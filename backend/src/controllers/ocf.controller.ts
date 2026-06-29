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
// Joins ALL 15 relevant tables. Column names verified against actual padak_insurance_crm.sql dump.
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

    // ── 2. case_no_fault ──────────────────────────────────────────────────────
    const [nfRows] = await pool.query(
      `SELECT mva_company, adjuster_name, mva_address, mva_city, mva_phone, mva_fax,
              claim_no, policy_no, named_insured, auto_make, auto_model, auto_year, plate_number
       FROM case_no_fault WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const nf: any = Array.isArray(nfRows) && nfRows[0] ? nfRows[0] : {};

    // ── 3. case_insurance_first_party ─────────────────────────────────────────
    const [fpRows] = await pool.query(
      `SELECT insurance_company, address, city, adjuster_name, adjuster_phone,
              adjuster_fax, adjuster_ext, policy_no, claim_no, policy_holder_name
       FROM case_insurance_first_party WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const fp: any = Array.isArray(fpRows) && fpRows[0] ? fpRows[0] : {};

    // ── 4. case_initial_interview ─────────────────────────────────────────────
    const [iiRows] = await pool.query(
      `SELECT first_name, last_name, dob, home_phone, mobile, email,
              marital_status, gender, conflict_checked, any_conflict,
              interviewed_by, referred_by, speaks_english, interpreter_required,
              born_in_canada, seat_belted, accident_at_work, police_reported,
              street_name, major_intersection, city AS ii_city,
              province AS ii_province, time_of_mva, benefit_chosen,
              police_department, incident_no, officer_name, badge_no,
              client_charged, client_charged_desc,
              third_party_charged, third_party_charged_desc,
              num_occupants, seating_arrangement, estimated_damage,
              photos_of_damage, accident_description AS ii_accident_desc
       FROM case_initial_interview WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const ii: any = Array.isArray(iiRows) && iiRows[0] ? iiRows[0] : {};

    // ── 5. case_accident_details ──────────────────────────────────────────────
    const [adRows] = await pool.query(
      `SELECT street_name, major_intersection, city, province_state,
              accident_date, accident_time, accident_description, reported_police
       FROM case_accident_details WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const ad: any = Array.isArray(adRows) && adRows[0] ? adRows[0] : {};

    // ── 6. case_third_party ───────────────────────────────────────────────────
    const [tpRows] = await pool.query(
      `SELECT driver_name, driver_license, home_phone AS tp_drv_phone,
              driver_address, auto_make, auto_model, auto_year, plate_number
       FROM case_third_party WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const tp: any = Array.isArray(tpRows) && tpRows[0] ? tpRows[0] : {};

    // ── 7. case_third_party_insurance ─────────────────────────────────────────
    const [tpiRows] = await pool.query(
      `SELECT insurance_company, adjuster_name, ins_phone, ins_fax,
              claim_number, policy_number
       FROM case_third_party_insurance WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const tpi: any = Array.isArray(tpiRows) && tpiRows[0] ? tpiRows[0] : {};

    // ── 8. case_medical_hospital ──────────────────────────────────────────────
    // Actual columns verified from SQL: hospital_postal_code (main), hospital_postal (extra empty col)
    const [mhRows] = await pool.query(
      `SELECT went_to_hospital, ambulance_required,
              hospital_name, hospital_address, hospital_city, hospital_province,
              hospital_postal_code,
              date_attended, date_released, xray_taken,
              doctor_name, doctor_address, doctor_city, doctor_prov_pc,
              doctor_phone, doctor_fax,
              clinic_name, clinic_address, clinic_city, clinic_prov_pc,
              clinic_phone, clinic_fax
       FROM case_medical_hospital WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const mh: any = Array.isArray(mhRows) && mhRows[0] ? mhRows[0] : {};

    // ── 9. case_medical_providers ─────────────────────────────────────────────
    const [mpRows] = await pool.query(
      `SELECT provider_order, centre, address, phone, fax, provider_type
       FROM case_medical_providers WHERE case_id = ? ORDER BY provider_order ASC LIMIT 4`, [caseId]
    ) as any[];
    const mpList = Array.isArray(mpRows) ? mpRows : [];

    // ── 10. case_medical_post_conditions ─────────────────────────────────────
    const [postRows] = await pool.query(
      `SELECT physical, neurological, psychological
       FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const postCond: any = Array.isArray(postRows) && postRows[0] ? postRows[0] : {};

    // ── 11. case_medical_pre_conditions ──────────────────────────────────────
    const [preRows] = await pool.query(
      `SELECT pre_condition, pre_time_frame, pre_operative, pre_status, post_status
       FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const preCond: any = Array.isArray(preRows) && preRows[0] ? preRows[0] : {};

    // ── 12. case_medical_medications ─────────────────────────────────────────
    const [medRows] = await pool.query(
      `SELECT med1, med2, med3, med4
       FROM case_medical_medications WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const meds: any = Array.isArray(medRows) && medRows[0] ? medRows[0] : {};

    // ── 13. case_employment (tinyint status columns) + case_employers ─────────
    const [empMainRows] = await pool.query(
      `SELECT employment_type,
              status_employed, status_self_employed, status_unemployed_26wks,
              status_written_contract, status_ei_benefits, status_unemployed,
              status_retired, status_student, status_caregiver, loss_of_income_claim
       FROM case_employment WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const empMain: any = Array.isArray(empMainRows) && empMainRows[0] ? empMainRows[0] : {};

    const [empRows] = await pool.query(
      `SELECT employer_order, employer_name, address, city, postal_code, phone, fax,
              job_title, salary_wages, hours_per_week
       FROM case_employers WHERE case_id = ? ORDER BY employer_order ASC LIMIT 3`, [caseId]
    ) as any[];
    const empList = Array.isArray(empRows) ? empRows : [];

    // ── 14. case_related_contacts (hk/carg/atc) ──────────────────────────────
    const [rcRows] = await pool.query(
      `SELECT contact_type, name, address, city, post_code, phone
       FROM case_related_contacts WHERE case_id = ?`, [caseId]
    ) as any[];
    const rcList = Array.isArray(rcRows) ? rcRows : [];
    const rcHK   = rcList.find((r: any) => r.contact_type === 'hk')   || {};
    const rcCarg = rcList.find((r: any) => r.contact_type === 'carg') || {};
    const rcAtc  = rcList.find((r: any) => r.contact_type === 'atc')  || {};

    // ── 15. case_client_id_docs — EXACT column names from SQL dump ────────────
    // driver_license (col added later), health_card (col added later),
    // ohip_number, sin_number, ontario_id_no, pr_card_no, citizen_card_no
    const [idRows] = await pool.query(
      `SELECT driver_license, health_card, ohip_number, sin_number,
              ontario_id_no, pr_card_no, citizen_card_no,
              child1_name, child1_dob, child2_name, child2_dob,
              child3_name, child3_dob, child4_name, child4_dob,
              child5_name, child5_dob, child6_name, child6_dob
       FROM case_client_id_docs WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const idDocs: any = Array.isArray(idRows) && idRows[0] ? idRows[0] : {};

    // ── 16. case_lawyers (our / previous / transferred) ──────────────────────
    const [lwRows] = await pool.query(
      `SELECT lawyer_type, firm_name, address, city, postal_code,
              lawyer_name, phone, fax, ext
       FROM case_lawyers WHERE case_id = ?`, [caseId]
    ) as any[];
    const lwList = Array.isArray(lwRows) ? lwRows : [];
    const lwOur   = lwList.find((r: any) => r.lawyer_type === 'our')         || {};
    const lwPrev  = lwList.find((r: any) => r.lawyer_type === 'previous')    || {};
    const lwTrans = lwList.find((r: any) => r.lawyer_type === 'transferred') || {};

    // ── 17. case_police_info ──────────────────────────────────────────────────
    const [piRows] = await pool.query(
      `SELECT reported_date, report_ordered, police_centre, police_officer,
              badge_number, incident_no, division, address, city, province_pc,
              phone, intersection, time_of_accident, accident_description
       FROM case_police_info WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const pi: any = Array.isArray(piRows) && piRows[0] ? piRows[0] : {};

    // ── 18. case_specialist ───────────────────────────────────────────────────
    const [spRows] = await pool.query(
      `SELECT company, address, city, province, post_code, phone, fax
       FROM case_specialist WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const sp: any = Array.isArray(spRows) && spRows[0] ? spRows[0] : {};

    // ── 19. case_settlement ───────────────────────────────────────────────────
    const [setRows] = await pool.query(
      `SELECT final_settlement, our_fee, rehab_outstanding, assessment_outstanding,
              outstanding3, outstanding4, hst, our_fee_hst, pay_to_client, our_final_account
       FROM case_settlement WHERE case_id = ? LIMIT 1`, [caseId]
    ) as any[];
    const settle: any = Array.isArray(setRows) && setRows[0] ? setRows[0] : {};

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
    const bool1 = (v: any): string => (v === 1 || v === true || v === '1' ? 'Y' : '');
    const safeNum = (v: any): string => (v != null && !isNaN(parseFloat(String(v))) ? String(parseFloat(String(v))) : '');
    const safeJSON = (v: any): string[] => {
      if (!v) return [];
      try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
    };

    // ── Resolve personal fields ───────────────────────────────────────────────
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
    const address    = s(c.client_street) || s(c.address);
    const city       = s(c.client_city)   || s(c.city);
    const province   = s(c.client_state)  || s(c.province);
    const postalCode = s(c.client_zip)    || s(c.post_code);

    // ── Insurance ─────────────────────────────────────────────────────────────
    const insurerName  = s(fp.insurance_company) || s(nf.mva_company);
    const insurerCity  = s(fp.city)              || s(nf.mva_city);
    const insurerAddr  = s(fp.address)           || s(nf.mva_address);
    const adjName      = s(fp.adjuster_name)     || s(nf.adjuster_name);
    const adjPhone     = s(fp.adjuster_phone)    || s(nf.mva_phone);
    const adjFax       = s(fp.adjuster_fax)      || s(nf.mva_fax);
    const adjExt       = s(fp.adjuster_ext);
    const claimNumber  = s(fp.claim_no)          || s(nf.claim_no);
    const policyNumber = s(fp.policy_no)         || s(nf.policy_no);
    const namedInsured = s(fp.policy_holder_name)|| s(nf.named_insured);
    const adjParts = adjName ? adjName.trim().split(' ') : [];
    const adjLast  = adjParts.length > 1 ? adjParts.slice(-1)[0] : adjName;
    const adjFirst = adjParts.length > 1 ? adjParts.slice(0, -1).join(' ') : '';
    const namParts = namedInsured ? namedInsured.trim().split(' ') : [];
    const phLast   = namParts.length > 1 ? namParts.slice(-1)[0] : namedInsured;
    const phFirst  = namParts.length > 1 ? namParts.slice(0, -1).join(' ') : '';

    const fullName       = `${firstName} ${lastName}`.trim();
    const dateOfAccident = d(c.date_of_loss) || d(ad.accident_date);
    const accParts       = [s(ad.street_name), s(ad.major_intersection), s(ad.city), s(ad.province_state)].filter(Boolean);
    const accTime        = ad.accident_time ? String(ad.accident_time).slice(0, 5) : '';

    // ── Treatment providers map ───────────────────────────────────────────────
    const tpFields: Record<string, string> = {};
    for (let i = 1; i <= 4; i++) {
      const p: any = mpList.find((r: any) => Number(r.provider_order) === i) || {};
      tpFields[`tp${i}_centre`]  = s(p.centre);
      tpFields[`tp${i}_address`] = s(p.address);
      tpFields[`tp${i}_phone`]   = s(p.phone);
      tpFields[`tp${i}_fax`]     = s(p.fax);
      const ptype = s(p.provider_type);
      ['Physio','Chiro','Rehab','Psych','Massage'].forEach(t => {
        tpFields[`tp${i}_type_${t}`] = ptype.toLowerCase() === t.toLowerCase() ? 'Y' : '';
      });
    }

    // ── Post-conditions checkboxes ────────────────────────────────────────────
    const physList  = safeJSON(postCond.physical);
    const neuroList = safeJSON(postCond.neurological);
    const psychList = safeJSON(postCond.psychological);
    const postCondMap: Record<string, string> = {};
    physList.forEach((area: string)  => { postCondMap[`postPhysical_${area}`] = 'Y'; });
    neuroList.forEach((item: string) => { postCondMap[`postNeuro_${item}`]    = 'Y'; });
    psychList.forEach((item: string) => { postCondMap[`postNeuro_${item}`]    = 'Y'; });

    // ── Employment status (tinyint columns → Y/'' for checkboxes) ────────────
    const empStatusMap: Record<string, string> = {
      empFullTime:     bool1(empMain.status_employed),
      empSelfEmployed: bool1(empMain.status_self_employed),
      empUnemployed26: bool1(empMain.status_unemployed_26wks),
      empContract:     bool1(empMain.status_written_contract),
      empEI:           bool1(empMain.status_ei_benefits),
      empUnemployed:   bool1(empMain.status_unemployed),
      empRetired:      bool1(empMain.status_retired),
      empStudent:      bool1(empMain.status_student),
      empCaregiver:    bool1(empMain.status_caregiver),
      lossOfIncome:    bool1(empMain.loss_of_income_claim),
    };

    // ── Employer fields ───────────────────────────────────────────────────────
    const empMap: Record<string, string> = {};
    for (let i = 1; i <= 3; i++) {
      const e: any = empList.find((r: any) => Number(r.employer_order) === i) || {};
      empMap[`emp${i}_name`]        = s(e.employer_name);
      empMap[`emp${i}_address`]     = s(e.address);
      empMap[`emp${i}_phone`]       = s(e.phone);
      empMap[`emp${i}_fax`]         = s(e.fax);
      empMap[`emp${i}_occupation`]  = s(e.job_title);
      empMap[`emp${i}_salary`]      = safeNum(e.salary_wages);
      empMap[`emp${i}_hoursPerWeek`]= safeNum(e.hours_per_week);
      // emp*_length and emp*_lastDay omitted: those columns don't exist in case_employers
    }

    res.json({
      // ── Identity ──────────────────────────────────────────────────────────
      firstName, lastName, initial, gender, maritalStatus: marital,
      dependants, dateOfBirth: dob, fullName,
      firstNameInitial: `${firstName} ${initial}`.trim(),

      // ── Contact ───────────────────────────────────────────────────────────
      address, city, province, postalCode,
      homePhone, workPhone, cellPhone, phone: cellPhone || homePhone, email,

      // ── Case ──────────────────────────────────────────────────────────────
      fileNo:        s(c.file_no),
      dateOfAccident, dateOfMva: dateOfAccident,
      referredBy:    s(ii.referred_by)    || s(c.referred_by),
      interviewedBy: s(ii.interviewed_by) || s(c.clerk_assigned),
      clerkAssigned: s(c.clerk_assigned),

      // ── First-party insurance ──────────────────────────────────────────────
      claimNumber, policyNumber, insurerName, insurerCity, insurerAddress: insurerAddr,
      adjusterName: adjName, adjusterLast: adjLast, adjusterFirst: adjFirst,
      adjusterPhone: adjPhone, adjusterFax: adjFax, adjusterExt: adjExt,
      namedInsured, policyHolderLast: phLast, policyHolderFirst: phFirst,
      policyHolderName: namedInsured,
      autoMake: s(nf.auto_make), autoModel: s(nf.auto_model),
      autoYear: s(nf.auto_year), plateNumber: s(nf.plate_number),
      // MatrixIntake first-party block keys
      fp_insurerName: insurerName,   fp_insurerCity: insurerCity,
      fp_insurerAddress: insurerAddr, fp_adjuster: adjName,
      fp_phone: adjPhone,            fp_fax: adjFax,
      fp_claimNo: claimNumber,       fp_policyNo: policyNumber,
      fp_policyHolder: namedInsured,
      fp_autoMake: s(nf.auto_make),  fp_autoModel: s(nf.auto_model),
      fp_autoYear: s(nf.auto_year),  fp_plateNo: s(nf.plate_number),

      // ── Accident ──────────────────────────────────────────────────────────
      accidentLocation: accParts.join(', '),
      accidentDescription: s(ad.accident_description),
      accidentStreet: s(ad.street_name),
      accidentIntersection: s(ad.major_intersection),
      accidentCity: s(ad.city), accidentProvince: s(ad.province_state),
      timeOfAccident: accTime, timeOfMVA: accTime,

      // ── Third party ────────────────────────────────────────────────────────
      tpDriverName: s(tp.driver_name),       tp_driverName: s(tp.driver_name),
      tpDriverLicenseNo: s(tp.driver_license), tp_driverLicenseNo: s(tp.driver_license),
      tpDriverPhone: s(tp.tp_drv_phone),     tp_driverPhone: s(tp.tp_drv_phone),
      tpDriverAddress: s(tp.driver_address),
      tpAutoMake: s(tp.auto_make),           tp_autoMake: s(tp.auto_make),
      tpAutoModel: s(tp.auto_model),         tp_autoModel: s(tp.auto_model),
      tpAutoYear: s(tp.auto_year),           tp_autoYear: s(tp.auto_year),
      tpPlateNo: s(tp.plate_number),         tp_plateNo: s(tp.plate_number),
      tpInsurerName: s(tpi.insurance_company), tp_insurerName: s(tpi.insurance_company),
      tpAdjusterName: s(tpi.adjuster_name),  tp_adjuster: s(tpi.adjuster_name),
      tpPhone: s(tpi.ins_phone),             tp_phone: s(tpi.ins_phone),
      tpFax: s(tpi.ins_fax),                tp_fax: s(tpi.ins_fax),
      tpClaimNo: s(tpi.claim_number),        tp_claimNo: s(tpi.claim_number),
      tpPolicyNo: s(tpi.policy_number),      tp_policyNo: s(tpi.policy_number),

      // ── Interview ─────────────────────────────────────────────────────────
      conflictChecked: s(ii.conflict_checked), conflictFind: s(ii.any_conflict),
      speaksEnglish: s(ii.speaks_english),    needsInterpreter: s(ii.interpreter_required),
      bornInCanada: s(ii.born_in_canada),     seatBelted: s(ii.seat_belted),
      accidentAtWork: s(ii.accident_at_work),
      policeReported: s(ii.police_reported) || s(ad.reported_police),
      benefitChosen: s(ii.benefit_chosen),    benefitChoice: s(ii.benefit_chosen),
      benefitElection: s(ii.benefit_chosen),

      // ── ID Documents (exact columns from case_client_id_docs SQL dump) ─────
      driverLicenseNo: s(idDocs.driver_license),
      healthCardNo:    s(idDocs.health_card),
      sinNo:           s(idDocs.sin_number),
      ohipNumber:      s(idDocs.ohip_number),
      prCitizenNo:     s(idDocs.pr_card_no),
      ontarioIdNo:     s(idDocs.ontario_id_no),
      citizenCardNo:   s(idDocs.citizen_card_no),

      // ── Children ──────────────────────────────────────────────────────────
      cg1_name: s(idDocs.child1_name), cg1_dob: d(idDocs.child1_dob),
      cg2_name: s(idDocs.child2_name), cg2_dob: d(idDocs.child2_dob),
      cg3_name: s(idDocs.child3_name), cg3_dob: d(idDocs.child3_dob),
      cg4_name: s(idDocs.child4_name), cg4_dob: d(idDocs.child4_dob),
      cg5_name: s(idDocs.child5_name), cg5_dob: d(idDocs.child5_dob),
      cg6_name: s(idDocs.child6_name), cg6_dob: d(idDocs.child6_dob),

      // ── Medical: Hospital (hospital_postal_code is the real column) ────────
      wentToHospital:    s(mh.went_to_hospital),
      ambulanceRequired: s(mh.ambulance_required),
      hospitalName:      s(mh.hospital_name),
      hospitalAddress:   s(mh.hospital_address),
      hospitalCity:      s(mh.hospital_city),
      hospitalProvince:  s(mh.hospital_province),
      hospitalPostal:    s(mh.hospital_postal_code),  // real column name
      admissionDate:     d(mh.date_attended),
      dischargeDate:     d(mh.date_released),
      xrayTaken:         s(mh.xray_taken),

      // ── Medical: Family Doctor ─────────────────────────────────────────────
      familyDoctor:        s(mh.doctor_name),
      familyDoctorAddress: s(mh.doctor_address),
      familyDoctorCity:    s(mh.doctor_city),
      familyDoctorPC:      s(mh.doctor_prov_pc),
      familyDoctorPhone:   s(mh.doctor_phone),
      familyDoctorFax:     s(mh.doctor_fax),

      // ── Medical: Treating Clinic ───────────────────────────────────────────
      clinicName:    s(mh.clinic_name),
      clinicAddress: s(mh.clinic_address),
      clinicCity:    s(mh.clinic_city),
      clinicPhone:   s(mh.clinic_phone),
      clinicFax:     s(mh.clinic_fax),

      // ── Medical: Treatment Providers ──────────────────────────────────────
      ...tpFields,

      // ── Medical: Post-Accident Conditions ─────────────────────────────────
      ...postCondMap,

      // ── Medical: Pre-Accident & Medications ───────────────────────────────
      preCondition:         s(preCond.pre_condition),
      preTimeFrame:         s(preCond.pre_time_frame),
      preOperativeProcedure:s(preCond.pre_operative),
      preAccidentStatus:    s(preCond.pre_status),
      postAccidentStatus:   s(preCond.post_status),
      medication1: s(meds.med1),
      medication2: s(meds.med2),
      medication3: s(meds.med3),
      medication4: s(meds.med4),

      // ── Employment Status (tinyint → Y/'') ───────────────────────────────
      ...empStatusMap,

      // ── Employer fields (MatrixIntake: emp1_name, emp2_name, emp3_name) ──
      ...empMap,

      // ── Expense/Contacts (hk/carg/atc) ────────────────────────────────────
      hk_name:    s((rcHK   as any).name),    hk_address: s((rcHK   as any).address),
      hk_phone:   s((rcHK   as any).phone),
      carg_name:  s((rcCarg as any).name),    carg_address: s((rcCarg as any).address),
      carg_phone: s((rcCarg as any).phone),
      care_name:  s((rcAtc  as any).name),    care_address: s((rcAtc  as any).address),
      care_phone: s((rcAtc  as any).phone),

      // ── Lawyers ────────────────────────────────────────────────────────────
      // MatrixIntake keys: ourFirm, ourLawyer, ourPhone, ourFax...
      ourFirm:    s((lwOur   as any).firm_name),   ourLawyer:   s((lwOur   as any).lawyer_name),
      ourAddress: s((lwOur   as any).address),     ourCity:     s((lwOur   as any).city),
      ourPostal:  s((lwOur   as any).postal_code), ourPhone:    s((lwOur   as any).phone),
      ourFax:     s((lwOur   as any).fax),         ourExt:      s((lwOur   as any).ext),
      prevFirm:   s((lwPrev  as any).firm_name),   prevLawyer:  s((lwPrev  as any).lawyer_name),
      prevAddress:s((lwPrev  as any).address),     prevCity:    s((lwPrev  as any).city),
      prevPostal: s((lwPrev  as any).postal_code), prevPhone:   s((lwPrev  as any).phone),
      prevFax:    s((lwPrev  as any).fax),         prevExt:     s((lwPrev  as any).ext),
      transFirm:  s((lwTrans as any).firm_name),   transLawyer: s((lwTrans as any).lawyer_name),
      transAddress:s((lwTrans as any).address),    transCity:   s((lwTrans as any).city),
      transPostal:s((lwTrans as any).postal_code), transPhone:  s((lwTrans as any).phone),
      transFax:   s((lwTrans as any).fax),         transExt:    s((lwTrans as any).ext),

      // ── Police Info (ii = InitialInterviewTab wins, pi = PoliceInfoTab fallback) ──
      policeReportedDate:  s(pi.reported_date),
      policeReportOrdered: s(pi.report_ordered),
      policeCentre:        s(ii.police_department) || s(pi.police_centre),
      policeOfficer:       s(ii.officer_name)      || s(pi.police_officer),
      policeBadgeNo:       s(ii.badge_no)          || s(pi.badge_number),
      policeIncidentNo:    s(ii.incident_no)       || s(pi.incident_no),
      policeDivision:      s(pi.division),
      policeAddress:       s(pi.address),
      policeCity:          s(pi.city),
      policeProvincePC:    s(pi.province_pc),
      policePhone:         s(pi.phone),
      policeIntersection:  s(pi.intersection),
      policeTimeOfAccident:s(pi.time_of_accident),
      policeAccidentDesc:  s(pi.accident_description),
      // MatrixIntake Accident Details section keys
      incidentNo:          s(ii.incident_no)        || s(pi.incident_no),
      officerName:         s(ii.officer_name)       || s(pi.police_officer),
      badgeNo:             s(ii.badge_no)           || s(pi.badge_number),
      policeDepartment:    s(ii.police_department)  || s(pi.police_centre),
      clientCharged:       s(ii.client_charged)     || s(ad.client_charged),
      clientChargedDesc:   s(ii.client_charged_desc)|| s(ad.client_charged_desc),
      thirdPartyCharged:   s(ii.third_party_charged)|| s(ad.third_party_charged),
      numOccupants:        s(ii.num_occupants)      || s(ad.num_occupants),
      seatingArrangement:  s(ii.seating_arrangement)|| s(ad.seating_arrangement),
      estimatedDamage:     safeNum(ii.estimated_damage) || safeNum(ad.estimated_damage),
      photosDamage:        s(ii.photos_of_damage)   || s(ad.photos_of_damage),

      // ── Specialist ─────────────────────────────────────────────────────────
      specialistCompany:  s(sp.company),
      specialistAddress:  s(sp.address),
      specialistCity:     s(sp.city),
      specialistProvince: s(sp.province),
      specialistPostCode: s(sp.post_code),
      specialistPhone:    s(sp.phone),
      specialistFax:      s(sp.fax),

      // ── Settlement ─────────────────────────────────────────────────────────
      finalSettlement:       safeNum(settle.final_settlement),
      ourFee:                safeNum(settle.our_fee),
      rehabOutstanding:      safeNum(settle.rehab_outstanding),
      assessmentOutstanding: safeNum(settle.assessment_outstanding),
      outstanding3:          safeNum(settle.outstanding3),
      outstanding4:          safeNum(settle.outstanding4),
      settlementHst:         safeNum(settle.hst),
      ourFeeHst:             safeNum(settle.our_fee_hst),
      payToClient:           safeNum(settle.pay_to_client),
      ourFinalAccount:       safeNum(settle.our_final_account),

      // ── Auth/Retainer pre-fill (derived) ──────────────────────────────────
      authClientName:   fullName,
      authRE:           `${fullName} — ${s(c.file_no)}`,
      authHealthCardNo: s(idDocs.ohip_number) || s(idDocs.health_card),
      retainerClientName:  fullName,
      retainerClientPhone: cellPhone || homePhone,

      // ── Signatures ─────────────────────────────────────────────────────────
      sigName: fullName, appSigName: fullName,
      decLastName: lastName, decFirstName: firstName,
    });
  } catch (err: any) {
    console.error('[getOcfPrefill ERROR]', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
}