import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── GET /api/cases/:caseId/ocf/:formNumber ────────────────────────────────────
export async function getOcfFormData(req: Request, res: Response): Promise<void> {
  const { caseId, formNumber } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ocf_form_data WHERE case_id = ? AND form_number = ? LIMIT 1',
      [caseId, formNumber]
    ) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) { res.json({}); return; }
    res.json({
      formNumber:     row.form_number      || '',
      exportedAt:     row.exported_at      || null,
      exportCount:    row.export_count     || 0,
      lastExportedBy: row.last_exported_by || null,
      formData:       row.form_data        ? JSON.parse(row.form_data) : {},
    });
  } catch (err) {
    console.error('[getOcfFormData]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/ocf/:formNumber ───────────────────────────────────
export async function saveOcfFormData(req: Request, res: Response): Promise<void> {
  const { caseId, formNumber } = req.params;
  const user = (req as any).user;
  const exportedBy = user?.name || user?.email || 'Staff';
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    const [existing] = await pool.query(
      'SELECT id, export_count FROM ocf_form_data WHERE case_id = ? AND form_number = ? LIMIT 1',
      [caseId, formNumber]
    ) as any[];
    const existingRow = Array.isArray(existing) ? existing[0] : null;
    const formDataJson = JSON.stringify(req.body.formData || {});
    if (existingRow) {
      const newCount = (existingRow.export_count || 0) + 1;
      await pool.query(
        `UPDATE ocf_form_data SET exported_at=?, export_count=?, last_exported_by=?, form_data=? WHERE id=?`,
        [now, newCount, exportedBy, formDataJson, existingRow.id]
      );
    } else {
      await pool.query(
        `INSERT INTO ocf_form_data (id, case_id, form_number, exported_at, export_count, last_exported_by, form_data)
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
// Joins 7 tables for maximum auto-fill. Column names verified against actual DB schema.
export async function getOcfPrefill(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // ── 1. cases + clients ────────────────────────────────────────────────────
    const [caseRows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.date_of_loss, ca.referred_by, ca.clerk_assigned,
              ca.client_street, ca.client_city, ca.client_state, ca.client_zip,
              ca.conflict_checked, ca.conflict_find,
              cl.first_name, cl.last_name, cl.initial, cl.gender,
              cl.address, cl.city, cl.province, cl.post_code,
              cl.home_phone, cl.work_phone, cl.cell_phone,
              cl.email, cl.date_of_birth, cl.marital_status, cl.dependants
       FROM cases ca
       LEFT JOIN clients cl ON cl.id = ca.client_id
       WHERE ca.id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const c = Array.isArray(caseRows) ? caseRows[0] : null;
    if (!c) { res.status(404).json({ error: 'Case not found' }); return; }

    // ── 2. case_no_fault (NoFaultTab — insurer, claim, policy) ───────────────
    const [nfRows] = await pool.query(
      `SELECT mva_company, adjuster_name, mva_address, mva_city, mva_phone, mva_fax,
              claim_no, policy_no, named_insured, auto_make, auto_model, auto_year, plate_number
       FROM case_no_fault WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const nf: any = Array.isArray(nfRows) && nfRows[0] ? nfRows[0] : {};

    // ── 3. case_insurance_first_party (InsuranceInformationSection tab) ───────
    const [fpRows] = await pool.query(
      `SELECT insurance_company, address, city, adjuster_name, adjuster_phone,
              adjuster_fax, adjuster_ext, policy_no, claim_no, policy_holder_name
       FROM case_insurance_first_party WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const fp: any = Array.isArray(fpRows) && fpRows[0] ? fpRows[0] : {};

    // ── 4. case_initial_interview (has staff-typed personal data) ─────────────
    const [iiRows] = await pool.query(
      `SELECT first_name, last_name, dob, home_phone, mobile, email,
              marital_status, gender, conflict_checked, any_conflict,
              interviewed_by, referred_by, speaks_english, interpreter_required,
              born_in_canada, seat_belted, accident_at_work, police_reported,
              street_name, major_intersection, city AS ii_city,
              province AS ii_province, time_of_mva, benefit_chosen
       FROM case_initial_interview WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const ii: any = Array.isArray(iiRows) && iiRows[0] ? iiRows[0] : {};

    // ── 5. case_accident_details ──────────────────────────────────────────────
    const [adRows] = await pool.query(
      `SELECT street_name, major_intersection, city, province_state,
              accident_date, accident_time, accident_description, reported_police
       FROM case_accident_details WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const ad: any = Array.isArray(adRows) && adRows[0] ? adRows[0] : {};

    // ── 6. case_third_party ───────────────────────────────────────────────────
    const [tpRows] = await pool.query(
      `SELECT driver_name, driver_license, home_phone AS tp_phone,
              driver_address, auto_make, auto_model, auto_year, plate_number
       FROM case_third_party WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const tp: any = Array.isArray(tpRows) && tpRows[0] ? tpRows[0] : {};

    // ── 7. case_third_party_insurance ─────────────────────────────────────────
    const [tpiRows] = await pool.query(
      `SELECT insurance_company, adjuster_name, ins_phone, ins_fax,
              claim_number, policy_number
       FROM case_third_party_insurance WHERE case_id = ? LIMIT 1`,
      [caseId]
    ) as any[];
    const tpi: any = Array.isArray(tpiRows) && tpiRows[0] ? tpiRows[0] : {};

    // ── Helpers ───────────────────────────────────────────────────────────────
    const s = (v: any): string =>
      (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : '');
    const d = (v: any): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      const str = String(v);
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      return str;
    };

    // ── Resolve: interview data wins over clients table ───────────────────────
    const firstName  = s(ii.first_name) || s(c.first_name);
    const lastName   = s(ii.last_name)  || s(c.last_name);
    const initial    = s(c.initial);
    const gender     = s(ii.gender)     || s(c.gender);
    const marital    = s(ii.marital_status) || s(c.marital_status);
    const homePhone  = s(ii.home_phone) || s(c.home_phone);
    const cellPhone  = s(ii.mobile)     || s(c.cell_phone);
    const workPhone  = s(c.work_phone);
    const email      = s(ii.email)      || s(c.email);
    const dob        = d(ii.dob)        || d(c.date_of_birth);
    const dependants = String(c.dependants ?? 0);

    // Address: case-level edits win over clients table
    const address    = s(c.client_street) || s(c.address);
    const city       = s(c.client_city)   || s(c.city);
    const province   = s(c.client_state)  || s(c.province);
    const postalCode = s(c.client_zip)    || s(c.post_code);

    // Insurance: first_party tab wins over no_fault tab
    const insurerName   = s(fp.insurance_company) || s(nf.mva_company);
    const insurerCity   = s(fp.city)              || s(nf.mva_city);
    const insurerAddr   = s(fp.address)           || s(nf.mva_address);
    const adjName       = s(fp.adjuster_name)     || s(nf.adjuster_name);
    const adjPhone      = s(fp.adjuster_phone)    || s(nf.mva_phone);
    const adjFax        = s(fp.adjuster_fax)      || s(nf.mva_fax);
    const adjExt        = s(fp.adjuster_ext);
    const claimNumber   = s(fp.claim_no)          || s(nf.claim_no);
    const policyNumber  = s(fp.policy_no)         || s(nf.policy_no);
    const namedInsured  = s(fp.policy_holder_name)|| s(nf.named_insured);

    // Split adjuster name for Last/First fields
    const adjParts  = adjName ? adjName.trim().split(' ') : [];
    const adjLast   = adjParts.length > 1 ? adjParts.slice(-1)[0] : adjName;
    const adjFirst  = adjParts.length > 1 ? adjParts.slice(0, -1).join(' ') : '';
    const namParts  = namedInsured ? namedInsured.trim().split(' ') : [];
    const phLast    = namParts.length > 1 ? namParts.slice(-1)[0] : namedInsured;
    const phFirst   = namParts.length > 1 ? namParts.slice(0, -1).join(' ') : '';

    const fullName       = `${firstName} ${lastName}`.trim();
    const dateOfAccident = d(c.date_of_loss) || d(ad.accident_date);
    const accParts       = [s(ad.street_name), s(ad.major_intersection), s(ad.city), s(ad.province_state)].filter(Boolean);
    const accTime        = ad.accident_time ? String(ad.accident_time).slice(0, 5) : '';

    res.json({
      firstName,    lastName,     initial,       gender,
      maritalStatus: marital,     dependants,    dateOfBirth: dob,
      fullName,     firstNameInitial: `${firstName} ${initial}`.trim(),

      address,      city,         province,      postalCode,
      homePhone,    workPhone,    cellPhone,
      phone: cellPhone || homePhone,
      email,

      fileNo:        s(c.file_no),
      dateOfAccident,
      dateOfMva:     dateOfAccident,
      referredBy:    s(ii.referred_by)    || s(c.referred_by),
      interviewedBy: s(ii.interviewed_by) || s(c.clerk_assigned),
      clerkAssigned: s(c.clerk_assigned),

      claimNumber,   policyNumber,
      insurerName,   insurerCity,   insurerAddress: insurerAddr,
      adjusterName:  adjName,       adjusterLast:  adjLast,
      adjusterFirst: adjFirst,      adjusterPhone: adjPhone,
      adjusterFax:   adjFax,        adjusterExt:   adjExt,
      namedInsured,  policyHolderLast: phLast, policyHolderFirst: phFirst,
      policyHolderName: namedInsured,
      autoMake: s(nf.auto_make),   autoModel: s(nf.auto_model),
      autoYear: s(nf.auto_year),   plateNumber: s(nf.plate_number),

      fp_insurerName: insurerName,  fp_insurerCity: insurerCity,
      fp_adjuster:    adjName,      fp_phone: adjPhone,
      fp_fax:         adjFax,       fp_claimNo: claimNumber,
      fp_policyNo:    policyNumber, fp_policyHolder: namedInsured,
      fp_autoMake: s(nf.auto_make), fp_autoModel: s(nf.auto_model),
      fp_autoYear: s(nf.auto_year), fp_plateNo: s(nf.plate_number),

      accidentLocation:    accParts.join(', '),
      accidentDescription: s(ad.accident_description),
      accidentStreet:      s(ad.street_name),
      accidentIntersection:s(ad.major_intersection),
      accidentCity:        s(ad.city),
      accidentProvince:    s(ad.province_state),
      timeOfAccident:      accTime,
      timeOfMVA:           accTime,

      tpDriverName:      s(tp.driver_name),
      tpDriverLicenseNo: s(tp.driver_license),
      tpDriverPhone:     s(tp.tp_phone),
      tpDriverAddress:   s(tp.driver_address),
      tpAutoMake:        s(tp.auto_make),
      tpAutoModel:       s(tp.auto_model),
      tpAutoYear:        s(tp.auto_year),
      tpPlateNo:         s(tp.plate_number),
      tp_driverName:     s(tp.driver_name),
      tp_driverLicenseNo:s(tp.driver_license),
      tp_driverPhone:    s(tp.tp_phone),
      tp_autoMake:       s(tp.auto_make),
      tp_autoModel:      s(tp.auto_model),
      tp_autoYear:       s(tp.auto_year),
      tp_plateNo:        s(tp.plate_number),
      tp_insurerName:    s(tpi.insurance_company),
      tp_adjuster:       s(tpi.adjuster_name),
      tp_phone:          s(tpi.ins_phone),
      tp_fax:            s(tpi.ins_fax),
      tp_claimNo:        s(tpi.claim_number),
      tp_policyNo:       s(tpi.policy_number),
      tpInsurerName:     s(tpi.insurance_company),
      tpAdjusterName:    s(tpi.adjuster_name),
      tpPhone:           s(tpi.ins_phone),
      tpFax:             s(tpi.ins_fax),
      tpClaimNo:         s(tpi.claim_number),
      tpPolicyNo:        s(tpi.policy_number),

      conflictChecked:   s(ii.conflict_checked),
      conflictFind:      s(ii.any_conflict),
      speaksEnglish:     s(ii.speaks_english),
      needsInterpreter:  s(ii.interpreter_required),
      bornInCanada:      s(ii.born_in_canada),
      seatBelted:        s(ii.seat_belted),
      accidentAtWork:    s(ii.accident_at_work),
      policeReported:    s(ii.police_reported) || s(ad.reported_police),
      benefitChosen:     s(ii.benefit_chosen),
      benefitChoice:     s(ii.benefit_chosen),
      benefitElection:   s(ii.benefit_chosen),

      sigName:    fullName,
      appSigName: fullName,
      decLastName:  lastName,
      decFirstName: firstName,
    });
  } catch (err: any) {
    console.error('[getOcfPrefill ERROR]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}