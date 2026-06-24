import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';

// ── USERS ────────────────────────────────────────────────────
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, display_role, is_active, created_at FROM users ORDER BY name'
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, displayRole } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, password required' }); return;
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = generateId();
    await pool.query(
      'INSERT INTO users (id, name, email, password, role, display_role) VALUES (?,?,?,?,?,?)',
      [id, name, email, hash, role||'employee', displayRole||'Staff']
    );
    const [rows] = await pool.query('SELECT id, name, email, role, display_role FROM users WHERE id = ?', [id]) as any[];
    res.status(201).json((rows as any[])[0]);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Email already exists' }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

// ── REPORTS ──────────────────────────────────────────────────
export async function getStatusSummary(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT file_status as status, COUNT(*) as count FROM cases GROUP BY file_status ORDER BY count DESC`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getMonthlyStats(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(open_date, '%b') as month, COUNT(*) as cases
       FROM cases WHERE open_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY YEAR(open_date), MONTH(open_date) ORDER BY open_date ASC`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getLimitationAlerts(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.file_status, ca.limitation_date, cl.first_name, cl.last_name
       FROM cases ca LEFT JOIN clients cl ON ca.client_id = cl.id
       WHERE ca.limitation_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
         AND ca.limitation_date >= CURDATE()
         AND ca.file_status NOT IN ('Settled','Closed')
       ORDER BY ca.limitation_date ASC`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getSettlementsSummary(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.file_status, s.final_settlement, s.pay_to_client,
        cl.first_name, cl.last_name
       FROM cases ca LEFT JOIN clients cl ON ca.client_id = cl.id
       LEFT JOIN case_settlement s ON s.case_id = ca.id
       WHERE ca.file_status = 'Settled' ORDER BY ca.updated_at DESC`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

// ── CLIENT PORTAL ─────────────────────────────────────────────
export async function getPortalCases(req: any, res: Response): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) { res.status(403).json({ error: 'Client ID not found in token' }); return; }
    const [rows] = await pool.query(
      `SELECT ca.*, cl.first_name, cl.last_name, cl.email FROM cases ca
       LEFT JOIN clients cl ON ca.client_id = cl.id
       WHERE ca.client_id = ? ORDER BY ca.created_at DESC`,
      [clientId]
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getPortalDocuments(req: any, res: Response): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) { res.status(403).json({ error: 'Client ID not found' }); return; }
    const [rows] = await pool.query(
      `SELECT d.* FROM documents d INNER JOIN cases ca ON d.case_id = ca.id
       WHERE ca.client_id = ? ORDER BY d.created_at DESC`,
      [clientId]
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getPortalStatusHistory(req: any, res: Response): Promise<void> {
  try {
    const clientId = req.user?.clientId;
    const caseId = req.params.caseId;
    const [verify] = await pool.query('SELECT id FROM cases WHERE id = ? AND client_id = ?', [caseId, clientId]) as any[];
    if (!(verify as any[]).length) { res.status(403).json({ error: 'Access denied' }); return; }
    const [rows] = await pool.query('SELECT * FROM status_history WHERE case_id = ? ORDER BY date DESC', [caseId]) as any[];
    res.json((rows as any[]).map(r => ({
      id: r.id, caseId: r.case_id, status: r.status,
      date: formatDate(r.date), changedBy: r.changed_by,
    })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

// ── OCF FORM DATA ─────────────────────────────────────────────
export async function getOcfFormData(req: Request, res: Response): Promise<void> {
  try {
    const { caseId, formNumber } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM ocf_form_data WHERE case_id = ? AND form_number = ?', [caseId, formNumber]
    ) as any[];
    const r = (rows as any[])[0];
    res.json(r ? JSON.parse(r.form_data) : {});
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function saveOcfFormData(req: Request, res: Response): Promise<void> {
  const { caseId, formNumber } = req.params;
  try {
    await pool.query(
      `INSERT INTO ocf_form_data (id, case_id, form_number, form_data) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE form_data=VALUES(form_data)`,
      [generateId(), caseId, formNumber, JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getOcfPrefill(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT ca.*, cl.first_name, cl.last_name, cl.initial, cl.address, cl.city, cl.province,
        cl.post_code, cl.date_of_birth, cl.home_phone, cl.work_phone, cl.cell_phone, cl.email,
        cl.marital_status, cl.dependants, cl.gender,
        nf.claim_no, nf.policy_no, nf.mva_company, nf.adjuster_name,
        nf.mva_phone as adjuster_phone, nf.mva_address as ins_address,
        nf.mva_city as ins_city, nf.mva_postal as ins_postal, nf.named_insured
       FROM cases ca
       LEFT JOIN clients cl ON ca.client_id = cl.id
       LEFT JOIN case_no_fault nf ON nf.case_id = ca.id
       WHERE ca.id = ?`,
      [caseId]
    ) as any[];
    const r = (rows as any[])[0];
    if (!r) { res.status(404).json({ error: 'Case not found' }); return; }
    res.json({
      claimNumber: r.claim_no || r.file_no || '',
      policyNumber: r.policy_no || '',
      dateOfAccident: formatDate(r.date_of_loss) || '',
      lastName: r.last_name || '',
      firstName: r.first_name || '',
      firstNameInitial: `${r.first_name||''} ${r.initial||''}`.trim(),
      initial: r.initial || '',
      gender: r.gender || '',
      address: r.address || '',
      city: r.city || '',
      province: r.province || '',
      postalCode: r.post_code || '',
      birthDate: formatDate(r.date_of_birth) || '',
      dateOfBirth: formatDate(r.date_of_birth) || '',
      homeTelephone: r.home_phone || '',
      homePhone: r.home_phone || '',
      workTelephone: r.work_phone || '',
      workPhone: r.work_phone || '',
      cellPhone: r.cell_phone || '',
      email: r.email || '',
      maritalStatus: r.marital_status || '',
      dependants: String(r.dependants||0),
      insuranceCompanyName: r.mva_company || '',
      adjusterName: r.adjuster_name || '',
      adjusterPhone: r.adjuster_phone || '',
      insAddress: r.ins_address || '',
      insCity: r.ins_city || '',
      insPostal: r.ins_postal || '',
      namedInsured: r.named_insured || '',
      fileNo: r.file_no || '',
      referredBy: r.referred_by || '',
      interviewedBy: r.clerk_assigned || '',
      dateOfMva: formatDate(r.date_of_loss) || '',
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
