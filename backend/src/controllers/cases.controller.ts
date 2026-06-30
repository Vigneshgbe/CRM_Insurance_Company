import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId, generateFileNo, formatDate } from '../utils/helpers';
import { sendAutoNotification } from './email.controller';

function mapCase(row: any): any {
  return {
    id: row.id,
    clientId: row.client_id,
    fileNo: row.file_no,
    fileStatus: row.file_status,
    caseType: row.case_type,
    dateOfLoss: formatDate(row.date_of_loss) || '',
    openDate: formatDate(row.open_date) || '',
    referredBy: row.referred_by || '',
    referredById: row.referred_by_id || '',
    clerkAssigned: row.clerk_assigned || '',
    secretary: row.secretary || '',
    limitationDate: formatDate(row.limitation_date) || '',
    mediationStatus: row.mediation_status || 'N/A',
    arbitrationStatus: row.arbitration_status || 'N/A',
    mvaClientFault: row.mva_client_fault || 'No',
    benefitsClaiming: row.benefits_claiming || 'No',
    irbNonEarnerDue: row.irb_non_earner_due || 'No',
    thirdPartyLawyer: row.third_party_lawyer || '',
    tortFileNo: row.tort_file_no || '',
    closedFileNo: row.closed_file_no || '',
    clientSignatureUrl: row.client_signature_url || '',
    clientInitials: row.client_initials || '',
    clientStreet: row.client_street || '',
    clientCity: row.client_city || '',
    clientState: row.client_state || '',
    clientZip: row.client_zip || '',
    clientCountry: row.client_country || 'Canada',
    clientMobile: row.client_mobile || '',
    abCounsel: row.ab_counsel || '',
    tortLawFirm: row.tort_law_firm || '',
    tortCounsel: row.tort_counsel || '',
    client: {
      id: row.c_id || row.client_id,
      firstName: row.c_first_name || '',
      lastName: row.c_last_name || '',
      initial: row.c_initial || '',
      address: row.c_address || '',
      city: row.c_city || '',
      province: row.c_province || '',
      postCode: row.c_post_code || '',
      homePhone: row.c_home_phone || '',
      cellPhone: row.c_cell_phone || '',
      workPhone: row.c_work_phone || '',
      email: row.c_email || '',
      dateOfBirth: formatDate(row.c_date_of_birth) || '',
      maritalStatus: row.c_marital_status || '',
      dependants: row.c_dependants || 0,
      phoneNumber: row.c_home_phone || '',
      mobileNumber: row.c_cell_phone || '',
    },
  };
}

const CASE_JOIN = `
  SELECT ca.*,
    cl.id as c_id, cl.first_name as c_first_name, cl.last_name as c_last_name,
    cl.initial as c_initial, cl.address as c_address, cl.city as c_city,
    cl.province as c_province, cl.post_code as c_post_code,
    cl.home_phone as c_home_phone, cl.cell_phone as c_cell_phone,
    cl.work_phone as c_work_phone, cl.email as c_email,
    cl.date_of_birth as c_date_of_birth, cl.marital_status as c_marital_status,
    cl.dependants as c_dependants
  FROM cases ca
  LEFT JOIN clients cl ON ca.client_id = cl.id
`;

export async function getCases(req: Request, res: Response): Promise<void> {
  try {
    const { search, status, caseType, assignedTo, dateFrom, dateTo } = req.query;
    let sql = CASE_JOIN + ' WHERE 1=1';
    const params: any[] = [];
    if (search) {
      sql += ' AND (ca.file_no LIKE ? OR cl.first_name LIKE ? OR cl.last_name LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status) { sql += ' AND ca.file_status = ?'; params.push(status); }
    if (caseType) { sql += ' AND ca.case_type = ?'; params.push(caseType); }
    if (assignedTo) { sql += ' AND ca.clerk_assigned = ?'; params.push(assignedTo); }
    if (dateFrom) { sql += ' AND ca.date_of_loss >= ?'; params.push(dateFrom); }
    if (dateTo) { sql += ' AND ca.date_of_loss <= ?'; params.push(dateTo); }
    sql += ' ORDER BY ca.created_at DESC';
    const [rows] = await pool.query(sql, params) as any[];
    res.json((rows as any[]).map(mapCase));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function getCaseById(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(CASE_JOIN + ' WHERE ca.id = ?', [req.params.id]) as any[];
    if (!(rows as any[])[0]) { res.status(404).json({ error: 'Case not found' }); return; }
    res.json(mapCase((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getCaseByFileNo(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(CASE_JOIN + ' WHERE ca.file_no = ?', [req.params.fileNo]) as any[];
    if (!(rows as any[])[0]) { res.status(404).json({ error: 'Case not found' }); return; }
    res.json(mapCase((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createCase(req: Request, res: Response): Promise<void> {
  const {
    clientId, fileStatus, caseType, dateOfLoss, openDate, referredBy, referredById,
    clerkAssigned, secretary, limitationDate, mediationStatus, arbitrationStatus,
    mvaClientFault, benefitsClaiming, irbNonEarnerDue, thirdPartyLawyer, tortFileNo,
    clientInitials, clientStreet, clientCity, clientState, clientZip, clientCountry, clientMobile,
    abCounsel, tortLawFirm, tortCounsel, interviewedBy, interviewedOn,
    conflictChecked, conflictFind, whoseFault, fileStatusDate,
  } = req.body;

  if (!clientId || !caseType) {
    res.status(400).json({ error: 'clientId and caseType required' }); return;
  }

  try {
    const [seqRows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE file_no LIKE ?`,
      [`MVA-${new Date().getFullYear()}-%`]
    ) as any[];
    const lastSeq = (seqRows as any[])[0].cnt || 0;
    const fileNo = generateFileNo(lastSeq);
    const id = generateId();

    await pool.query(
      `INSERT INTO cases (id, client_id, file_no, file_status, case_type, date_of_loss, open_date,
        referred_by, referred_by_id, clerk_assigned, secretary, limitation_date,
        mediation_status, arbitration_status, mva_client_fault, benefits_claiming,
        irb_non_earner_due, third_party_lawyer, tort_file_no, client_initials,
        client_street, client_city, client_state, client_zip, client_country, client_mobile,
        ab_counsel, tort_law_firm, tort_counsel, interviewed_by, interviewed_on,
        conflict_checked, conflict_find, whose_fault, file_status_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, clientId, fileNo, fileStatus||'Active', caseType, dateOfLoss||null, openDate||null,
       referredBy||'', referredById||null, clerkAssigned||'', secretary||'', limitationDate||null,
       mediationStatus||'N/A', arbitrationStatus||'N/A', mvaClientFault||'No',
       benefitsClaiming||'No', irbNonEarnerDue||'No', thirdPartyLawyer||'', tortFileNo||'',
       clientInitials||'', clientStreet||'', clientCity||'', clientState||'', clientZip||'',
       clientCountry||'Canada', clientMobile||'', abCounsel||'', tortLawFirm||'', tortCounsel||'',
       interviewedBy||'', interviewedOn||null,
       conflictChecked ? 1 : 0, conflictFind ? 1 : 0, whoseFault||'', fileStatusDate||null]
    );

    const user = (req as any).user?.name || 'System';
    await pool.query(
      `INSERT INTO case_history (id, case_id, date, time, user, action, field_changed, old_value, new_value)
       VALUES (?,?,CURDATE(),TIME(NOW()),?,'Created','Case','',?)`,
      [generateId(), id, user, fileNo]
    );
    await pool.query(
      `INSERT INTO status_history (id, case_id, status, date, changed_by) VALUES (?,?,?,CURDATE(),?)`,
      [generateId(), id, fileStatus||'Active', user]
    );

    const [rows] = await pool.query(CASE_JOIN + ' WHERE ca.id = ?', [id]) as any[];
    res.status(201).json(mapCase((rows as any[])[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function updateCase(req: Request, res: Response): Promise<void> {
  const caseId = req.params.id;
  const {
    fileStatus, caseType, dateOfLoss, openDate, referredBy, referredById,
    clerkAssigned, secretary, limitationDate, mediationStatus, arbitrationStatus,
    mvaClientFault, benefitsClaiming, irbNonEarnerDue, thirdPartyLawyer, tortFileNo,
    closedFileNo, clientInitials, clientSignatureUrl, clientStreet, clientCity,
    clientState, clientZip, clientCountry, clientMobile, abCounsel, tortLawFirm, tortCounsel,
    clientFirstName, clientLastName, clientEmail,
  } = req.body;

  try {
    const [oldRows] = await pool.query('SELECT file_status, client_id FROM cases WHERE id = ?', [caseId]) as any[];
    const oldStatus = (oldRows as any[])[0]?.file_status;
    const clientId  = (oldRows as any[])[0]?.client_id;

    await pool.query(
      `UPDATE cases SET file_status=?, case_type=?, date_of_loss=?, open_date=?,
        referred_by=?, referred_by_id=?, clerk_assigned=?, secretary=?, limitation_date=?,
        mediation_status=?, arbitration_status=?, mva_client_fault=?, benefits_claiming=?,
        irb_non_earner_due=?, third_party_lawyer=?, tort_file_no=?, closed_file_no=?,
        client_initials=?, client_signature_url=?, client_street=?, client_city=?,
        client_state=?, client_zip=?, client_country=?, client_mobile=?,
        ab_counsel=?, tort_law_firm=?, tort_counsel=?
       WHERE id=?`,
      [fileStatus, caseType, dateOfLoss||null, openDate||null, referredBy||'', referredById||null,
       clerkAssigned||'', secretary||'', limitationDate||null, mediationStatus||'N/A',
       arbitrationStatus||'N/A', mvaClientFault||'No', benefitsClaiming||'No', irbNonEarnerDue||'No',
       thirdPartyLawyer||'', tortFileNo||'', closedFileNo||'', clientInitials||'',
       clientSignatureUrl||'', clientStreet||'', clientCity||'', clientState||'', clientZip||'',
       clientCountry||'Canada', clientMobile||'', abCounsel||'', tortLawFirm||'', tortCounsel||'', caseId]
    );

    // ── Update client name if provided ────────────────────────────────────────
    if (clientId && (clientFirstName !== undefined || clientLastName !== undefined || clientEmail !== undefined)) {
      const updates: string[] = [];
      const vals: any[] = [];
      if (clientFirstName !== undefined) {
        updates.push('first_name = ?');
        vals.push(String(clientFirstName).trim());
      }
      if (clientLastName !== undefined) {
        updates.push('last_name = ?');
        vals.push(String(clientLastName).trim());
      }
      if (clientEmail !== undefined) {
        updates.push('email = ?');
        vals.push(String(clientEmail).trim());
      }
      if (updates.length > 0) {
        vals.push(clientId);
        await pool.query(
          `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
          vals
        );
      }
    }

    if (oldStatus && oldStatus !== fileStatus) {
      const user = (req as any).user?.name || 'System';
      await pool.query(
        `INSERT INTO case_history (id, case_id, date, time, user, action, field_changed, old_value, new_value)
         VALUES (?,?,CURDATE(),TIME(NOW()),?,'Updated','File Status',?,?)`,
        [generateId(), caseId, user, oldStatus, fileStatus]
      );
      await pool.query(
        `INSERT INTO status_history (id, case_id, status, date, changed_by) VALUES (?,?,?,CURDATE(),?)`,
        [generateId(), caseId, fileStatus, user]
      );

      // ── NEW: auto email notification on status change (additive, never blocks save) ──
      try {
        const [rows] = await pool.query(CASE_JOIN + ' WHERE ca.id = ?', [caseId]) as any[];
        const updatedCase = (rows as any[])[0];
        const notifyEmail = updatedCase?.c_email;
        const fileNo = updatedCase?.file_no;
        if (notifyEmail) {
          await sendAutoNotification({
            caseId,
            to: notifyEmail,
            subject: `Case ${fileNo} — Status Updated to ${fileStatus}`,
            body: `Hello,\n\nYour case ${fileNo} status has been updated from "${oldStatus}" to "${fileStatus}".\n\nIf you have any questions, please contact our office.\n\nMatrix Legal Services`,
            triggerType: 'status_change',
            sentBy: user,
          });
        }
      } catch (emailErr) {
        // Email failure must never break the case update itself
        console.error('[updateCase] auto-notification failed (non-fatal):', emailErr);
      }
    }

    const [rows] = await pool.query(CASE_JOIN + ' WHERE ca.id = ?', [caseId]) as any[];
    res.json(mapCase((rows as any[])[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

// ── NEW: matches StatusTab.tsx's POST /api/cases/:caseId/status ────────────
// This route never existed before (was 404ing). Pre-existing bug, unrelated
// to the email feature, fixed here since it shares the same status-change
// + email-notification logic already built into updateCase above.
export async function updateCaseStatus(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const { status, changedBy } = req.body;

  if (!status) {
    res.status(400).json({ error: 'status is required' });
    return;
  }

  try {
    const [oldRows] = await pool.query(
      `SELECT ca.file_status, ca.file_no, ca.client_id, cl.email as client_email
       FROM cases ca LEFT JOIN clients cl ON ca.client_id = cl.id
       WHERE ca.id = ?`,
      [caseId]
    ) as any[];
    const caseInfo = (oldRows as any[])[0];
    if (!caseInfo) { res.status(404).json({ error: 'Case not found' }); return; }

    const oldStatus = caseInfo.file_status;
    const user = changedBy || (req as any).user?.name || 'Staff';

    await pool.query('UPDATE cases SET file_status = ? WHERE id = ?', [status, caseId]);

    await pool.query(
      `INSERT INTO status_history (id, case_id, status, date, changed_by) VALUES (?,?,?,CURDATE(),?)`,
      [generateId(), caseId, status, user]
    );
    await pool.query(
      `INSERT INTO case_history (id, case_id, date, time, user, action, field_changed, old_value, new_value)
       VALUES (?,?,CURDATE(),TIME(NOW()),?,'Updated','File Status',?,?)`,
      [generateId(), caseId, user, oldStatus || '', status]
    );

    // ── Same auto-email-notification pattern as updateCase, non-fatal on failure ──
    if (oldStatus !== status) {
      try {
        if (caseInfo.client_email) {
          await sendAutoNotification({
            caseId,
            to: caseInfo.client_email,
            subject: `Case ${caseInfo.file_no} — Status Updated to ${status}`,
            body: `Hello,\n\nYour case ${caseInfo.file_no} status has been updated from "${oldStatus}" to "${status}".\n\nIf you have any questions, please contact our office.\n\nMatrix Legal Services`,
            triggerType: 'status_change',
            sentBy: user,
          });
        }
      } catch (emailErr) {
        console.error('[updateCaseStatus] auto-notification failed (non-fatal):', emailErr);
      }
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error('[updateCaseStatus]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

export async function deleteCase(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM cases WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}