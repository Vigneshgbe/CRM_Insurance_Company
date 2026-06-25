import { Request, Response } from 'express';
import pool from '../config/database';

// ─── GET /api/cases/:caseId/client-info ─────────────────────────────────────
// Returns full client profile linked to this case
export async function getClientInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [[row]] = await pool.query(
      `SELECT c.*, cl.id as case_id, cl.file_no, cl.file_status, cl.date_of_loss, cl.open_date,
              cl.referred_by, cl.clerk_assigned, cl.secretary, cl.limitation_date,
              cl.mediation_status, cl.arbitration_status, cl.mva_client_fault,
              cl.third_party_lawyer, cl.tort_file_no
       FROM clients c
       JOIN cases cl ON cl.client_id = c.id
       WHERE cl.id = ?
       LIMIT 1`,
      [caseId]
    ) as any[];

    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({
      // Client personal fields
      id:            row.id,
      firstName:     row.first_name      || '',
      lastName:      row.last_name       || '',
      initial:       row.initial         || '',
      address:       row.address         || '',
      city:          row.city            || '',
      province:      row.province        || '',
      postCode:      row.post_code       || '',
      homePhone:     row.home_phone      || '',
      cellPhone:     row.cell_phone      || '',
      workPhone:     row.work_phone      || '',
      email:         row.email           || '',
      dateOfBirth:   row.date_of_birth   ? row.date_of_birth.toISOString().split('T')[0] : '',
      maritalStatus: row.marital_status  || '',
      dependants:    row.dependants      || '',
      // Case fields
      fileNo:        row.file_no         || '',
      fileStatus:    row.file_status     || '',
      dateOfLoss:    row.date_of_loss    ? row.date_of_loss.toISOString().split('T')[0] : '',
      openDate:      row.open_date       ? row.open_date.toISOString().split('T')[0] : '',
      referredBy:    row.referred_by     || '',
      clerkAssigned: row.clerk_assigned  || '',
      secretary:     row.secretary       || '',
      limitationDate: row.limitation_date ? row.limitation_date.toISOString().split('T')[0] : '',
    });
  } catch (err) {
    console.error('[getClientInfo]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/client-info ────────────────────────────────────
// Updates client record linked to this case
export async function saveClientInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  try {
    // Get the client_id for this case
    const [[caseRow]] = await pool.query(
      'SELECT client_id FROM cases WHERE id = ? LIMIT 1',
      [caseId]
    ) as any[];

    if (!caseRow) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    await pool.query(
      `UPDATE clients SET
         first_name=?, last_name=?, initial=?, address=?, city=?, province=?,
         post_code=?, home_phone=?, cell_phone=?, work_phone=?, email=?,
         date_of_birth=?, marital_status=?, dependants=?
       WHERE id=?`,
      [
        b.firstName||'', b.lastName||'', b.initial||'', b.address||'',
        b.city||'', b.province||'', b.postCode||'',
        b.homePhone||'', b.cellPhone||'', b.workPhone||'', b.email||'',
        b.dateOfBirth||null, b.maritalStatus||'', b.dependants||'',
        caseRow.client_id
      ]
    );

    await getClientInfo(req, res);
  } catch (err) {
    console.error('[saveClientInfo]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
