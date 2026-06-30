import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';
import { sendEmail, getFromEmail } from '../services/email.service';

// ── GET /api/cases/:caseId/emails — list all logged emails for a case ───────
export async function getEmailsByCaseId(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM email_log WHERE case_id = ? ORDER BY created_at DESC',
      [caseId]
    ) as any[];

    const emails = (rows as any[]).map(r => ({
      id: r.id,
      caseId: r.case_id,
      direction: r.direction,
      toEmail: r.to_email,
      ccEmail: r.cc_email || '',
      fromEmail: r.from_email,
      subject: r.subject,
      body: r.body,
      status: r.status,
      errorMessage: r.error_message || '',
      sentBy: r.sent_by,
      triggerType: r.trigger_type,
      createdAt: r.created_at,
    }));

    res.json(emails);
  } catch (err) {
    console.error('[getEmailsByCaseId]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/emails/send — actually send via SMTP + log ──────
export async function sendCaseEmail(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const { to, cc, subject, body } = req.body;
  const sentBy = (req as any).user?.name || 'Staff';

  if (!to || !subject || !body) {
    res.status(400).json({ error: 'to, subject, and body are required' });
    return;
  }

  const result = await sendEmail({ to, cc, subject, body });
  const fromEmail = getFromEmail();

  try {
    const id = generateId();
    await pool.query(
      `INSERT INTO email_log
        (id, case_id, direction, to_email, cc_email, from_email, subject, body, status, error_message, sent_by, trigger_type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, caseId, 'sent', to, cc || null, fromEmail, subject, body,
        result.success ? 'sent' : 'failed',
        result.success ? null : (result.error || 'Unknown error'),
        sentBy, 'manual',
      ]
    );

    // Also log into activities table so it shows in the existing Activities tab
    // This is an ADDITIVE insert only — does not touch any existing activities code
    await pool.query(
      `INSERT INTO activities (id, case_id, date, time, type, regarding, details, record_manager)
       VALUES (?,?,CURDATE(),TIME(NOW()),?,?,?,?)`,
      [
        generateId(), caseId, 'Email',
        subject,
        `Email ${result.success ? 'sent' : 'failed'} to ${to}`,
        sentBy,
      ]
    );

    if (!result.success) {
      res.status(502).json({ error: 'Email send failed', detail: result.error, logged: true, id });
      return;
    }

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('[sendCaseEmail]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/emails/log — manually log an email sent outside the CRM ──
export async function logManualEmail(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const { to, cc, subject, body } = req.body;
  const sentBy = (req as any).user?.name || 'Staff';

  if (!to || !subject) {
    res.status(400).json({ error: 'to and subject are required' });
    return;
  }

  try {
    const id = generateId();
    await pool.query(
      `INSERT INTO email_log
        (id, case_id, direction, to_email, cc_email, from_email, subject, body, status, sent_by, trigger_type)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, caseId, 'manual', to, cc || null, sentBy, subject, body || '', 'logged', sentBy, 'manual']
    );

    await pool.query(
      `INSERT INTO activities (id, case_id, date, time, type, regarding, details, record_manager)
       VALUES (?,?,CURDATE(),TIME(NOW()),?,?,?,?)`,
      [generateId(), caseId, 'Email', subject, `Email manually logged to ${to}`, sentBy]
    );

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('[logManualEmail]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── Internal helper — called from cases.controller (status change) and
//    activities.controller (new activity) for automatic notifications.
//    Wrapped in try/catch by the caller so it can NEVER break the parent save. ──
export async function sendAutoNotification(params: {
  caseId: string;
  to: string;
  subject: string;
  body: string;
  triggerType: 'status_change' | 'activity_added';
  sentBy: string;
}): Promise<void> {
  const { caseId, to, subject, body, triggerType, sentBy } = params;
  if (!to) return; // no recipient configured — silently skip, do not throw

  const result = await sendEmail({ to, subject, body });
  const fromEmail = getFromEmail();

  await pool.query(
    `INSERT INTO email_log
      (id, case_id, direction, to_email, from_email, subject, body, status, error_message, sent_by, trigger_type)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      generateId(), caseId, 'sent', to, fromEmail, subject, body,
      result.success ? 'sent' : 'failed',
      result.success ? null : (result.error || 'Unknown error'),
      sentBy, triggerType,
    ]
  );
}