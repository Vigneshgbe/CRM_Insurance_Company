import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// Table: ocf_form_data
// Expected columns: id, case_id, form_number, exported_at, export_count, last_exported_by, form_data (JSON text), created_at, updated_at

// ── GET /api/cases/:caseId/ocf/:formNumber ────────────────────────────────────
export async function getOcfFormData(req: Request, res: Response): Promise<void> {
  const { caseId, formNumber } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ocf_form_data WHERE case_id = ? AND form_number = ? LIMIT 1',
      [caseId, formNumber]
    ) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;

    if (!row) {
      res.json({});
      return;
    }

    res.json({
      formNumber:      row.form_number      || '',
      exportedAt:      row.exported_at      || null,
      exportCount:     row.export_count     || 0,
      lastExportedBy:  row.last_exported_by || null,
      formData:        row.form_data        ? JSON.parse(row.form_data) : {},
    });
  } catch (err) {
    console.error('[getOcfFormData]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/ocf/:formNumber ───────────────────────────────────
export async function saveOcfFormData(req: Request, res: Response): Promise<void> {
  const { caseId, formNumber } = req.params;
  const b = req.body;

  // Get user from JWT for lastExportedBy
  const user = (req as any).user;
  const exportedBy = user?.name || user?.email || 'Staff';
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [existing] = await pool.query(
      'SELECT id, export_count FROM ocf_form_data WHERE case_id = ? AND form_number = ? LIMIT 1',
      [caseId, formNumber]
    ) as any[];
    const existingRow = Array.isArray(existing) ? existing[0] : null;

    const formDataJson = JSON.stringify(b.formData || {});

    if (existingRow) {
      const newCount = (existingRow.export_count || 0) + 1;
      await pool.query(
        `UPDATE ocf_form_data SET
          exported_at       = ?,
          export_count      = ?,
          last_exported_by  = ?,
          form_data         = ?
         WHERE id = ?`,
        [now, newCount, exportedBy, formDataJson, existingRow.id]
      );
    } else {
      await pool.query(
        `INSERT INTO ocf_form_data
          (id, case_id, form_number, exported_at, export_count, last_exported_by, form_data)
         VALUES (?,?,?,?,?,?,?)`,
        [generateId(), caseId, formNumber, now, 1, exportedBy, formDataJson]
      );
    }

    await getOcfFormData(req, res);
  } catch (err) {
    console.error('[saveOcfFormData]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── GET /api/cases/:caseId/ocf/prefill ───────────────────────────────────────
// Returns case + client data pre-filled for OCF forms
export async function getOcfPrefill(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, cl.first_name, cl.last_name, cl.date_of_birth,
              cl.home_phone, cl.cell_phone, cl.email,
              cl.address, cl.city, cl.province, cl.post_code
       FROM cases c
       LEFT JOIN clients cl ON cl.id = c.client_id
       WHERE c.id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) { res.json({}); return; }

    res.json({
      caseId,
      fileNo:        row.file_no       || '',
      dateOfLoss:    row.date_of_loss  || '',
      clientName:    `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      dateOfBirth:   row.date_of_birth || '',
      phone:         row.cell_phone    || row.home_phone || '',
      email:         row.email         || '',
      address:       row.address       || '',
      city:          row.city          || '',
      province:      row.province      || '',
      postCode:      row.post_code     || '',
      claimNo:       row.claim_no      || '',
      policyNo:      row.policy_no     || '',
      insurer:       row.insurer       || '',
    });
  } catch (err) {
    console.error('[getOcfPrefill]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
