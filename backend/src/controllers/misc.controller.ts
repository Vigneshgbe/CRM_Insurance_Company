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

// ── GET /api/cases/:caseId/ocf/prefill ───────────────────────────────────────
// Pulls from ALL relevant tables for maximum OCF auto-fill
// Tables joined: cases, clients, case_no_fault, case_insurance_first_party,
//                case_initial_interview, case_accident_details, case_third_party,
//                case_third_party_insurance
export async function getOcfPrefill(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // 1. Core case + client data
    const [caseRows] = await pool.query(
      `SELECT ca.*,
              cl.first_name, cl.last_name, cl.initial, cl.address, cl.city,
              cl.province, cl.post_code, cl.date_of_birth, cl.home_phone,
              cl.work_phone, cl.cell_phone, cl.email, cl.marital_status,
              cl.dependants, cl.gender
       FROM cases ca
       LEFT JOIN clients cl ON cl.id = ca.client_id
       WHERE ca.id = ?`,
      [caseId]
    ) as any[];
    const c = Array.isArray(caseRows) ? caseRows[0] : null;
    if (!c) { res.status(404).json({ error: 'Case not found' }); return; }

    // 2. No-fault (first party via NoFaultTab — mva_company, claim_no, policy_no)
    const [nfRows] = await pool.query(
      'SELECT * FROM case_no_fault WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const nf = Array.isArray(nfRows) ? nfRows[0] : null;

    // 3. Insurance first party (InsuranceInformationSection — insurance_company, claim_no, policy_no)
    const [fpRows] = await pool.query(
      'SELECT * FROM case_insurance_first_party WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const fp = Array.isArray(fpRows) ? fpRows[0] : null;

    // 4. Initial interview (has stored first_name, last_name, dob, phones, marital)
    const [iiRows] = await pool.query(
      'SELECT * FROM case_initial_interview WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const ii = Array.isArray(iiRows) ? iiRows[0] : null;

    // 5. Accident details
    const [adRows] = await pool.query(
      'SELECT * FROM case_accident_details WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const ad = Array.isArray(adRows) ? adRows[0] : null;

    // 6. Third party driver + insurance
    const [tpRows] = await pool.query(
      'SELECT * FROM case_third_party WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const tp = Array.isArray(tpRows) ? tpRows[0] : null;

    const [tpiRows] = await pool.query(
      'SELECT * FROM case_third_party_insurance WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const tpi = Array.isArray(tpiRows) ? tpiRows[0] : null;

    // Helper: format date to YYYY-MM-DD for HTML date inputs
    const fmtDate = (v: any): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      const s = String(v);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      return s;
    };

    // Prefer interview data for personal fields (most recently entered by staff),
    // fall back to clients table
    const firstName     = ii?.first_name     || c.first_name     || '';
    const lastName      = ii?.last_name      || c.last_name      || '';
    const initial       = c.initial          || '';
    const dob           = fmtDate(ii?.dob    || c.date_of_birth);
    const gender        = ii?.gender         || c.gender         || '';
    const maritalStatus = ii?.marital_status || c.marital_status || '';
    const dependants    = String(c.dependants || 0);
    const homePhone     = ii?.home_phone     || c.home_phone     || '';
    const workPhone     = c.work_phone       || '';
    const cellPhone     = ii?.mobile         || c.cell_phone     || '';
    const email         = ii?.email          || c.email          || '';

    // Address: prefer case-stored (client_street from CaseDetail edits), then clients table
    const address    = c.client_street || c.address || '';
    const city       = c.client_city   || c.city    || '';
    const province   = c.client_state  || c.province || '';
    const postalCode = c.client_zip    || c.post_code || '';

    // Insurance: prefer case_insurance_first_party (InsuranceInformationSection),
    // fall back to case_no_fault (NoFaultTab)
    const insurerName    = fp?.insurance_company || nf?.mva_company    || '';
    const insurerCity    = fp?.city              || nf?.mva_city        || '';
    const insurerAddress = fp?.address           || nf?.mva_address     || '';
    const adjusterName   = fp?.adjuster_name     || nf?.adjuster_name   || '';
    const adjusterPhone  = fp?.adjuster_phone    || nf?.mva_phone       || '';
    const adjusterFax    = fp?.adjuster_fax      || nf?.mva_fax         || '';
    const adjusterExt    = fp?.adjuster_ext      || '';
    const claimNumber    = fp?.claim_no          || nf?.claim_no        || '';
    const policyNumber   = fp?.policy_no         || nf?.policy_no       || '';
    const namedInsured   = fp?.policy_holder_name|| nf?.named_insured   || '';
    const autoMake       = nf?.auto_make         || '';
    const autoModel      = nf?.auto_model        || '';
    const autoYear       = nf?.auto_year         || '';
    const plateNumber    = nf?.plate_number      || '';

    // Dates
    const dateOfAccident = fmtDate(c.date_of_loss || ad?.accident_date);
    const dateOfMva      = fmtDate(c.date_of_loss);

    // Accident details
    const accidentLocation   = ad ? `${ad.street_name || ''} & ${ad.major_intersection || ''}, ${ad.city || ''}, ${ad.province_state || ''}`.replace(/^& /, '').replace(/, $/, '') : '';
    const accidentDescription= ad?.accident_description || '';
    const accidentStreet     = ad?.street_name        || '';
    const accidentIntersection = ad?.major_intersection || '';
    const accidentCity       = ad?.city               || '';
    const accidentProvince   = ad?.province_state     || '';
    const timeOfAccident     = ad?.accident_time      ? String(ad.accident_time).slice(0, 5) : '';

    // Third party
    const tpDriverName      = tp?.driver_name         || '';
    const tpDriverLicenseNo = tp?.driver_license      || '';
    const tpDriverPhone     = tp?.home_phone          || '';
    const tpDriverAddress   = tp?.driver_address      || '';
    const tpAutoMake        = tp?.auto_make           || '';
    const tpAutoModel       = tp?.auto_model          || '';
    const tpAutoYear        = tp?.auto_year           || '';
    const tpPlateNo         = tp?.plate_number        || '';
    const tpInsurerName     = tpi?.insurance_company  || '';
    const tpAdjusterName    = tpi?.adjuster_name      || '';
    const tpPhone           = tpi?.ins_phone          || '';
    const tpFax             = tpi?.ins_fax            || '';
    const tpClaimNo         = tpi?.claim_number       || '';
    const tpPolicyNo        = tpi?.policy_number      || '';

    // Matrix intake interview fields
    const conflictChecked   = ii?.conflict_checked    || '';
    const conflictFind      = ii?.any_conflict        || '';
    const interviewedBy     = ii?.interviewed_by      || c.clerk_assigned || '';
    const referredBy        = ii?.referred_by         || c.referred_by    || '';
    const speaksEnglish     = ii?.speaks_english      || '';
    const needsInterpreter  = ii?.interpreter_required|| '';
    const bornInCanada      = ii?.born_in_canada      || '';
    const seatBelted        = ii?.seat_belted         || '';
    const accidentAtWork    = ii?.accident_at_work    || '';
    const policeReported    = ii?.police_reported     || ad?.reported_police || '';
    const benefitChosen     = ii?.benefit_chosen      || '';

    const fullName = `${firstName} ${lastName}`.trim();

    // Split adjuster name into parts for forms that need Last/First separately
    const adjusterParts = adjusterName ? adjusterName.trim().split(' ') : [];
    const adjusterLast  = adjusterParts.length > 1 ? adjusterParts.slice(-1)[0] : adjusterName;
    const adjusterFirst = adjusterParts.length > 1 ? adjusterParts.slice(0, -1).join(' ') : '';

    const namedParts    = namedInsured ? namedInsured.trim().split(' ') : [];
    const policyHolderLast  = namedParts.length > 1 ? namedParts.slice(-1)[0] : namedInsured;
    const policyHolderFirst = namedParts.length > 1 ? namedParts.slice(0, -1).join(' ') : '';

    res.json({
      // Identity
      firstName, lastName, initial, gender, maritalStatus, dependants,
      dateOfBirth: dob, firstNameInitial: `${firstName} ${initial}`.trim(),
      fullName,
      // Contact
      address, city, province, postalCode,
      homePhone, workPhone, cellPhone, phone: cellPhone || homePhone,
      email,
      // Case
      fileNo: c.file_no || '', dateOfAccident, dateOfMva,
      referredBy, interviewedBy, clerkAssigned: c.clerk_assigned || '',
      conflictChecked, conflictFind,
      // First-party insurance
      claimNumber, policyNumber, insurerName, insurerCity, insurerAddress,
      adjusterName, adjusterLast, adjusterFirst,
      adjusterPhone, adjusterFax, adjusterExt,
      namedInsured, policyHolderLast, policyHolderFirst,
      autoMake, autoModel, autoYear, plateNumber,
      // Accident details
      accidentLocation, accidentDescription,
      accidentStreet, accidentIntersection, accidentCity, accidentProvince,
      timeOfAccident,
      // Third party
      tpDriverName, tpDriverLicenseNo, tpDriverPhone, tpDriverAddress,
      tpAutoMake, tpAutoModel, tpAutoYear, tpPlateNo,
      tpInsurerName, tpAdjusterName, tpPhone, tpFax, tpClaimNo, tpPolicyNo,
      // Matrix intake
      speaksEnglish, needsInterpreter, bornInCanada, seatBelted,
      accidentAtWork, policeReported, benefitChosen,
      // Signature pre-fill
      sigName: fullName, appSigName: fullName,
      decLastName: lastName, decFirstName: firstName,
    });
  } catch (err) {
    console.error('[getOcfPrefill]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TWO FUNCTIONS to the bottom of:
//   D:\CRM_Phase_1\backend\src\controllers\misc.controller.ts
//
// They sit right after the existing `deleteUser` function — do NOT remove
// or alter deleteUser or anything above it.
// ─────────────────────────────────────────────────────────────────────────────

// ── PUT /api/users/:id/reactivate  (Admin only — enforced in route + here) ──
export async function reactivateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requester = (req as any).user;

    // Only Admin display_role can reactivate
    if (requester?.display_role !== 'Admin') {
      res.status(403).json({ error: 'Only Admin users can reactivate accounts' });
      return;
    }

    // Cannot reactivate yourself (edge case guard)
    if (requester?.id === id) {
      res.status(400).json({ error: 'Cannot change your own active status' });
      return;
    }

    const [result]: any = await pool.query(
      'UPDATE users SET is_active = 1 WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User reactivated' });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── DELETE /api/users/:id/permanent  (Admin only — hard delete) ───────────────
export async function hardDeleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requester = (req as any).user;

    // Only Admin display_role can hard-delete
    if (requester?.display_role !== 'Admin') {
      res.status(403).json({ error: 'Only Admin users can permanently delete accounts' });
      return;
    }

    // Cannot delete yourself
    if (requester?.id === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const [result]: any = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error' });
  }
}
