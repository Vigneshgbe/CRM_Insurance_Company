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

// ── GET /api/cases/:caseId/ocf/prefill ────────────────────────────────────────
// Replaces ALL previous versions. Joins 7 tables, returns consistent camelCase keys.
// Place this function in misc.controller.ts, replacing the existing getOcfPrefill.
export async function getOcfPrefill(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // ── 1. Core: cases + clients ──────────────────────────────────────────────
    const [caseRows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.file_status, ca.case_type, ca.date_of_loss,
              ca.open_date, ca.referred_by, ca.clerk_assigned,
              ca.client_street, ca.client_city, ca.client_state, ca.client_zip,
              ca.client_mobile, ca.conflict_checked, ca.conflict_find,
              ca.tort_law_firm, ca.tort_counsel, ca.ab_counsel,
              cl.id AS cl_id, cl.first_name, cl.last_name, cl.initial,
              cl.address, cl.city, cl.province, cl.post_code,
              cl.home_phone, cl.work_phone, cl.cell_phone,
              cl.email, cl.date_of_birth, cl.marital_status, cl.dependants, cl.gender
       FROM cases ca
       LEFT JOIN clients cl ON cl.id = ca.client_id
       WHERE ca.id = ?
       LIMIT 1`,
      [caseId]
    ) as any[];
    const c = Array.isArray(caseRows) ? caseRows[0] : null;
    if (!c) { res.status(404).json({ error: 'Case not found' }); return; }

    // ── 2. No-fault / first-party insurance (NoFaultTab) ─────────────────────
    const [nfRows] = await pool.query(
      `SELECT mva_company, adjuster_name, adjuster_email, mva_address, mva_city,
              mva_province, mva_postal, mva_phone, mva_fax, mva_supervisor,
              claim_no, policy_no, named_insured,
              auto_make, auto_model, auto_year, plate_number
       FROM case_no_fault WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const nf: any = Array.isArray(nfRows) && nfRows[0] ? nfRows[0] : {};

    // ── 3. Insurance first party (InsuranceInformationSection tab) ────────────
    const [fpRows] = await pool.query(
      `SELECT insurance_company, address, city, province, postal_code,
              adjuster_name, adjuster_email, adjuster_phone, adjuster_ext, adjuster_fax,
              supervisor_name, policy_no, claim_no, policy_holder_name
       FROM case_insurance_first_party WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const fp: any = Array.isArray(fpRows) && fpRows[0] ? fpRows[0] : {};

    // ── 4. Initial interview (has staff-entered personal data) ────────────────
    const [iiRows] = await pool.query(
      `SELECT first_name, last_name, dob, home_phone, mobile, email,
              marital_status, gender, conflict_checked, any_conflict,
              interviewed_by, interviewed_on, referred_by,
              speaks_english, interpreter_required, born_in_canada,
              seat_belted, accident_at_work, police_reported,
              street_name, major_intersection, city AS ii_city,
              province AS ii_province, time_of_mva, benefit_chosen,
              postal_code, country
       FROM case_initial_interview WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const ii: any = Array.isArray(iiRows) && iiRows[0] ? iiRows[0] : {};

    // ── 5. Accident details ───────────────────────────────────────────────────
    const [adRows] = await pool.query(
      `SELECT street_name, major_intersection, city, province_state,
              accident_date, accident_time, accident_description,
              reported_police, client_charged, client_charged_desc,
              third_party_charged, num_occupants, seating_arrangement,
              photos_of_damage, estimated_damage,
              ambulance_attended, went_to_hospital
       FROM case_accident_details WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const ad: any = Array.isArray(adRows) && adRows[0] ? adRows[0] : {};

    // ── 6. Third party driver ─────────────────────────────────────────────────
    const [tpRows] = await pool.query(
      `SELECT driver_name, driver_license, home_phone AS tp_phone,
              driver_address, auto_make, auto_model, auto_year, plate_number
       FROM case_third_party WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const tp: any = Array.isArray(tpRows) && tpRows[0] ? tpRows[0] : {};

    // ── 7. Third party insurance ──────────────────────────────────────────────
    const [tpiRows] = await pool.query(
      `SELECT insurance_company, adjuster_name, ins_phone, ins_fax,
              claim_number, policy_number
       FROM case_third_party_insurance WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const tpi: any = Array.isArray(tpiRows) && tpiRows[0] ? tpiRows[0] : {};

    // ── Helpers ───────────────────────────────────────────────────────────────
    const d = (v: any): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      const s = String(v);
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      return s;
    };
    const s = (v: any): string => (v !== null && v !== undefined ? String(v).trim() : '');

    // ── Resolve best values: interview data wins over clients table ───────────
    const firstName     = s(ii.first_name)  || s(c.first_name);
    const lastName      = s(ii.last_name)   || s(c.last_name);
    const initial       = s(c.initial);
    const dob           = d(ii.dob)         || d(c.date_of_birth);
    const gender        = s(ii.gender)      || s(c.gender);
    const marital       = s(ii.marital_status) || s(c.marital_status);
    const homePhone     = s(ii.home_phone)  || s(c.home_phone);
    const cellPhone     = s(ii.mobile)      || s(c.cell_phone);
    const workPhone     = s(c.work_phone);
    const email         = s(ii.email)       || s(c.email);
    const dependants    = String(c.dependants ?? 0);

    // Address: case-level edits override clients table
    const address    = s(c.client_street) || s(c.address);
    const city       = s(c.client_city)   || s(c.city);
    const province   = s(c.client_state)  || s(c.province);
    const postalCode = s(c.client_zip)    || s(c.post_code);

    // Insurance: first_party tab wins over no_fault tab
    const insurerName    = s(fp.insurance_company) || s(nf.mva_company);
    const insurerCity    = s(fp.city)              || s(nf.mva_city);
    const insurerAddress = s(fp.address)           || s(nf.mva_address);
    const adjusterName   = s(fp.adjuster_name)     || s(nf.adjuster_name);
    const adjusterPhone  = s(fp.adjuster_phone)    || s(nf.mva_phone);
    const adjusterFax    = s(fp.adjuster_fax)      || s(nf.mva_fax);
    const adjusterExt    = s(fp.adjuster_ext);
    const claimNumber    = s(fp.claim_no)          || s(nf.claim_no);
    const policyNumber   = s(fp.policy_no)         || s(nf.policy_no);
    const namedInsured   = s(fp.policy_holder_name)|| s(nf.named_insured);
    const autoMake       = s(nf.auto_make);
    const autoModel      = s(nf.auto_model);
    const autoYear       = s(nf.auto_year);
    const plateNumber    = s(nf.plate_number);

    const dateOfAccident = d(c.date_of_loss) || d(ad.accident_date);
    const dateOfMva      = d(c.date_of_loss);

    // Accident location
    const parts = [s(ad.street_name), s(ad.major_intersection), s(ad.city), s(ad.province_state)].filter(Boolean);
    const accidentLocation = parts.join(', ');
    const accidentTime = ad.accident_time ? String(ad.accident_time).slice(0, 5) : '';

    // Split adjuster name into Last / First for forms that need it separately
    const adjParts      = adjusterName ? adjusterName.trim().split(' ') : [];
    const adjusterLast  = adjParts.length > 1 ? adjParts.slice(-1)[0] : adjusterName;
    const adjusterFirst = adjParts.length > 1 ? adjParts.slice(0, -1).join(' ') : '';

    const namedParts        = namedInsured ? namedInsured.trim().split(' ') : [];
    const policyHolderLast  = namedParts.length > 1 ? namedParts.slice(-1)[0] : namedInsured;
    const policyHolderFirst = namedParts.length > 1 ? namedParts.slice(0, -1).join(' ') : '';

    const fullName = `${firstName} ${lastName}`.trim();

    res.json({
      // ── Identity ───────────────────────────────────────────────────────────
      firstName,
      lastName,
      initial,
      gender,
      maritalStatus: marital,
      dependants,
      dateOfBirth: dob,
      fullName,
      firstNameInitial: `${firstName} ${initial}`.trim(),

      // ── Contact ────────────────────────────────────────────────────────────
      address,
      city,
      province,
      postalCode,
      homePhone,
      workPhone,
      cellPhone,
      phone: cellPhone || homePhone,
      email,

      // ── Case ───────────────────────────────────────────────────────────────
      fileNo:        s(c.file_no),
      dateOfAccident,
      dateOfMva,
      referredBy:    s(ii.referred_by)    || s(c.referred_by),
      interviewedBy: s(ii.interviewed_by) || s(c.clerk_assigned),
      clerkAssigned: s(c.clerk_assigned),

      // ── First-party insurance ──────────────────────────────────────────────
      claimNumber,
      policyNumber,
      insurerName,
      insurerCity,
      insurerAddress,
      adjusterName,
      adjusterLast,
      adjusterFirst,
      adjusterPhone,
      adjusterFax,
      adjusterExt,
      namedInsured,
      policyHolderLast,
      policyHolderFirst,
      autoMake,
      autoModel,
      autoYear,
      plateNumber,

      // ── Accident details ───────────────────────────────────────────────────
      accidentLocation,
      accidentDescription: s(ad.accident_description),
      accidentStreet:      s(ad.street_name),
      accidentIntersection:s(ad.major_intersection),
      accidentCity:        s(ad.city),
      accidentProvince:    s(ad.province_state),
      timeOfAccident:      accidentTime,
      timeOfMVA:           accidentTime,

      // ── Third party ─────────────────────────────────────────────────────────
      tpDriverName:      s(tp.driver_name),
      tpDriverLicenseNo: s(tp.driver_license),
      tpDriverPhone:     s(tp.tp_phone),
      tpDriverAddress:   s(tp.driver_address),
      tpAutoMake:        s(tp.auto_make),
      tpAutoModel:       s(tp.auto_model),
      tpAutoYear:        s(tp.auto_year),
      tpPlateNo:         s(tp.plate_number),
      tpInsurerName:     s(tpi.insurance_company),
      tpAdjusterName:    s(tpi.adjuster_name),
      tpPhone:           s(tpi.ins_phone),
      tpFax:             s(tpi.ins_fax),
      tpClaimNo:         s(tpi.claim_number),
      tpPolicyNo:        s(tpi.policy_number),

      // ── Matrix / interview fields ──────────────────────────────────────────
      conflictChecked:    s(ii.conflict_checked),
      conflictFind:       s(ii.any_conflict),
      speaksEnglish:      s(ii.speaks_english),
      needsInterpreter:   s(ii.interpreter_required),
      bornInCanada:       s(ii.born_in_canada),
      seatBelted:         s(ii.seat_belted),
      accidentAtWork:     s(ii.accident_at_work),
      policeReported:     s(ii.police_reported) || s(ad.reported_police),
      benefitChosen:      s(ii.benefit_chosen),

      // ── Signature pre-fill ─────────────────────────────────────────────────
      sigName:     fullName,
      appSigName:  fullName,
      decLastName:  lastName,
      decFirstName: firstName,
    });
  } catch (err: any) {
    console.error('[getOcfPrefill ERROR]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
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
