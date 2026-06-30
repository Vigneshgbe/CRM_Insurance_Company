import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';
import { sendAutoNotification } from './email.controller';

function mapActivity(row: any) {
  return {
    id: row.id,
    caseId: row.case_id,
    date: formatDate(row.date) || '',
    time: row.time || '',
    type: row.type || '',
    regarding: row.regarding || '',
    details: row.details || '',
    recordManager: row.record_manager || '',
    companyGroup: row.company_group || '',
  };
}

export async function getActivitiesByCaseId(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM activities WHERE case_id = ? AND type != 'Note' ORDER BY date DESC, time DESC`,
      [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(mapActivity));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getRecentActivities(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 5;
    const [rows] = await pool.query(
      `SELECT * FROM activities ORDER BY date DESC, time DESC LIMIT ?`, [limit]
    ) as any[];
    res.json((rows as any[]).map(mapActivity));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  const { date, time, type, regarding, details, recordManager, companyGroup } = req.body;
  const caseId = req.params.caseId;
  const manager = recordManager || (req as any).user?.name || 'System';
  try {
    const id = generateId();
    await pool.query(
      `INSERT INTO activities (id, case_id, date, time, type, regarding, details, record_manager, company_group)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, caseId, date||new Date().toISOString().slice(0,10), time||'', type||'Note', regarding||'', details||'', manager, companyGroup||'Internal']
    );
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]) as any[];
    const newActivity = (rows as any[])[0];

    // ── NEW: auto email notification when a new activity is added ──────────────
    // GUARD: skip if type is 'Email' or 'Note' — Email activities are already the
    // result of an email action (would cause a loop), and Notes are excluded from
    // this tab entirely (per getActivitiesByCaseId filter), so notifying on them
    // would be inconsistent with what staff actually see.
    if (type && type !== 'Email' && type !== 'Note') {
      try {
        const [caseRows] = await pool.query(
          `SELECT ca.file_no, cl.email as client_email
           FROM cases ca LEFT JOIN clients cl ON ca.client_id = cl.id
           WHERE ca.id = ?`,
          [caseId]
        ) as any[];
        const caseInfo = (caseRows as any[])[0];
        const clientEmail = caseInfo?.client_email;
        const fileNo = caseInfo?.file_no;
        if (clientEmail) {
          await sendAutoNotification({
            caseId,
            to: clientEmail,
            subject: `Case ${fileNo} — New ${type}: ${regarding || ''}`.trim(),
            body: `Hello,\n\nA new ${type} was added to your case ${fileNo}.\n\n${regarding ? `Regarding: ${regarding}\n` : ''}${details ? `Details: ${details}\n` : ''}\nMatrix Legal Services`,
            triggerType: 'activity_added',
            sentBy: manager,
          });
        }
      } catch (emailErr) {
        // Email failure must never break activity creation
        console.error('[createActivity] auto-notification failed (non-fatal):', emailErr);
      }
    }

    res.status(201).json(mapActivity(newActivity));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  const { date, time, type, regarding, details, recordManager, companyGroup } = req.body;
  try {
    await pool.query(
      `UPDATE activities SET date=?, time=?, type=?, regarding=?, details=?, record_manager=?, company_group=? WHERE id=?`,
      [date, time, type, regarding, details, recordManager, companyGroup, req.params.activityId]
    );
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [req.params.activityId]) as any[];
    res.json(mapActivity((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function deleteActivity(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM activities WHERE id = ?', [req.params.activityId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}