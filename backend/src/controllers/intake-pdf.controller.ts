/**
 * intake-pdf.controller.ts
 *
 * Fills the real Matrix Legal Services Intake Master PDF with case data
 * and streams it back as a download.
 *
 * Route (add to index.ts — see comment block at end of this file):
 *   POST /api/cases/:caseId/intake/generate
 *
 * Optional POST body overrides (all are also pulled from the DB automatically):
 *   { percent, interviewedBy, referredBy, authDay, authMonth, authYear,
 *     ohipFromDate, ohipEndDate, ohipUnitNo, ohipStreetNo, ohipStreetName,
 *     ohipCity, ohipPostal }
 *
 * The controller re-uses the same DB queries as ocf.controller.ts / getOcfPrefill
 * (column names already verified).  It calls the self-contained Python script
 * D:\CRM_Phase_1\backend\scripts\fill_intake_form.py via execSync, exactly as
 * generateOcfPdf does for OCF forms.
 */

import { Request, Response } from 'express';
import pool from '../config/database';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { RowDataPacket } from 'mysql2';

// ── Paths (mirrors ocf-pdf.controller.ts conventions) ────────────────────────
const INTAKE_TEMPLATE_PATH = path.join(
  __dirname,
  '../../templates/intake_form/Intake_Master.pdf'
);
const FILL_SCRIPT = path.join(
  __dirname,
  '../../scripts/fill_intake_form.py'
);
const TEMP_DIR = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Controller ────────────────────────────────────────────────────────────────

export async function generateIntakePdf(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;

  // Guard: template and script must exist on disk
  if (!fs.existsSync(INTAKE_TEMPLATE_PATH)) {
    res.status(404).json({
      error: 'Intake Master PDF template not found',
      expected: INTAKE_TEMPLATE_PATH,
      action:
        'Copy Intake_Master.pdf to D:\\CRM_Phase_1\\backend\\templates\\intake_form\\',
    });
    return;
  }

  if (!fs.existsSync(FILL_SCRIPT)) {
    res.status(404).json({
      error: 'fill_intake_form.py script not found',
      expected: FILL_SCRIPT,
      action:
        'Copy fill_intake_form.py to D:\\CRM_Phase_1\\backend\\scripts\\',
    });
    return;
  }

  try {
    const prefill = await getIntakePrefillData(caseId);
    // Merge DB data with any body overrides (body overrides win)
    const data: Record<string, any> = { ...prefill, ...req.body };

    // Write the merged data to a temp JSON file
    const ts      = Date.now();
    const tmpJson = path.join(TEMP_DIR, `intake_${caseId}_${ts}.json`);
    const tmpPdf  = path.join(TEMP_DIR, `intake_${caseId}_${ts}.pdf`);

    fs.writeFileSync(tmpJson, JSON.stringify(data, null, 2), 'utf8');

    execSync(
      `python "${FILL_SCRIPT}" "${INTAKE_TEMPLATE_PATH}" "${tmpJson}" "${tmpPdf}"`,
      { timeout: 30_000 }
    );

    if (!fs.existsSync(tmpPdf)) {
      res.status(500).json({ error: 'PDF fill script ran but produced no output' });
      return;
    }

    const lastName = String(prefill.lastName || caseId);
    const fileName = `Intake_${lastName}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fs.readFileSync(tmpPdf));

    // Clean up temp files (best-effort)
    try { fs.unlinkSync(tmpJson); } catch { /* ignore */ }
    try { fs.unlinkSync(tmpPdf);  } catch { /* ignore */ }

  } catch (err: any) {
    console.error('[Intake PDF] Error:', err.message);
    res.status(500).json({ error: 'Intake PDF generation failed', detail: err.message });
  }
}

// ── DB prefill — column names verified from existing controllers ──────────────

async function getIntakePrefillData(caseId: string): Promise<Record<string, any>> {
  // ── cases + clients ───────────────────────────────────────────────────────
  const [caseRows] = await pool.query<RowDataPacket[]>(
    `SELECT
       ca.id, ca.file_no, ca.date_of_loss, ca.referred_by, ca.clerk_assigned,
       ca.client_street, ca.client_city, ca.client_state, ca.client_zip,
       cl.first_name, cl.last_name, cl.initial, cl.gender,
       cl.address, cl.city, cl.province, cl.post_code,
       cl.home_phone, cl.work_phone, cl.cell_phone,
       cl.email, cl.date_of_birth, cl.marital_status, cl.dependants
     FROM cases ca
     LEFT JOIN clients cl ON cl.id = ca.client_id
     WHERE ca.id = ? LIMIT 1`,
    [caseId]
  );
  const c: any = Array.isArray(caseRows) && caseRows[0] ? caseRows[0] : {};

  // ── case_initial_interview ────────────────────────────────────────────────
  const [iiRows] = await pool.query<RowDataPacket[]>(
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
            photos_of_damage, accident_description
     FROM case_initial_interview WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const ii: any = Array.isArray(iiRows) && iiRows[0] ? iiRows[0] : {};

  // ── case_accident_details ─────────────────────────────────────────────────
  const [adRows] = await pool.query<RowDataPacket[]>(
    `SELECT street_name, major_intersection, city, province_state,
            accident_date, accident_time, accident_description, reported_police
     FROM case_accident_details WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const ad: any = Array.isArray(adRows) && adRows[0] ? adRows[0] : {};

  // ── case_no_fault (first-party insurance) ─────────────────────────────────
  const [nfRows] = await pool.query<RowDataPacket[]>(
    `SELECT mva_company, adjuster_name, mva_address, mva_city, mva_phone, mva_fax,
            claim_no, policy_no, named_insured, auto_make, auto_model, auto_year, plate_number
     FROM case_no_fault WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const nf: any = Array.isArray(nfRows) && nfRows[0] ? nfRows[0] : {};

  // ── case_insurance_first_party ────────────────────────────────────────────
  const [fpRows] = await pool.query<RowDataPacket[]>(
    `SELECT insurance_company, address, city, adjuster_name, adjuster_phone,
            adjuster_fax, adjuster_ext, policy_no, claim_no, policy_holder_name
     FROM case_insurance_first_party WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const fp: any = Array.isArray(fpRows) && fpRows[0] ? fpRows[0] : {};

  // ── case_third_party + case_third_party_insurance ─────────────────────────
  const [tpRows] = await pool.query<RowDataPacket[]>(
    `SELECT driver_name, driver_license, home_phone AS tp_drv_phone,
            driver_address, auto_make, auto_model, auto_year, plate_number
     FROM case_third_party WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const tp: any = Array.isArray(tpRows) && tpRows[0] ? tpRows[0] : {};

  const [tpiRows] = await pool.query<RowDataPacket[]>(
    `SELECT insurance_company, adjuster_name, ins_phone, ins_fax,
            claim_number, policy_number
     FROM case_third_party_insurance WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const tpi: any = Array.isArray(tpiRows) && tpiRows[0] ? tpiRows[0] : {};

  // ── case_medical_hospital ─────────────────────────────────────────────────
  const [mhRows] = await pool.query<RowDataPacket[]>(
    `SELECT went_to_hospital, ambulance_required,
            hospital_name, hospital_address, hospital_city,
            hospital_postal_code,
            date_attended, date_released, xray_taken,
            doctor_name, doctor_address, doctor_city, doctor_prov_pc,
            doctor_phone, doctor_fax
     FROM case_medical_hospital WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const mh: any = Array.isArray(mhRows) && mhRows[0] ? mhRows[0] : {};

  // ── case_medical_providers ────────────────────────────────────────────────
  const [mpRows] = await pool.query<RowDataPacket[]>(
    `SELECT provider_order, centre, address, phone, fax, provider_type
     FROM case_medical_providers WHERE case_id = ? ORDER BY provider_order ASC LIMIT 4`,
    [caseId]
  );
  const mpList: any[] = Array.isArray(mpRows) ? mpRows : [];

  // ── case_medical_post_conditions ──────────────────────────────────────────
  const [postRows] = await pool.query<RowDataPacket[]>(
    `SELECT physical, neurological, psychological
     FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const postCond: any = Array.isArray(postRows) && postRows[0] ? postRows[0] : {};

  // ── case_medical_pre_conditions ───────────────────────────────────────────
  const [preRows] = await pool.query<RowDataPacket[]>(
    `SELECT pre_condition, pre_time_frame, pre_operative, pre_status, post_status
     FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const preCond: any = Array.isArray(preRows) && preRows[0] ? preRows[0] : {};

  // ── case_medical_medications ──────────────────────────────────────────────
  const [medRows] = await pool.query<RowDataPacket[]>(
    `SELECT med1, med2, med3, med4
     FROM case_medical_medications WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const meds: any = Array.isArray(medRows) && medRows[0] ? medRows[0] : {};

  // ── case_employment + case_employers ──────────────────────────────────────
  const [empMainRows] = await pool.query<RowDataPacket[]>(
    `SELECT employment_type,
            status_employed, status_self_employed, status_unemployed_26wks,
            status_written_contract, status_ei_benefits, status_unemployed,
            status_retired, status_student, status_caregiver, loss_of_income_claim
     FROM case_employment WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const empMain: any = Array.isArray(empMainRows) && empMainRows[0] ? empMainRows[0] : {};

  const [empRows] = await pool.query<RowDataPacket[]>(
    `SELECT employer_order, employer_name, address, city, postal_code, phone, fax,
            job_title, salary_wages, hours_per_week
     FROM case_employers WHERE case_id = ? ORDER BY employer_order ASC LIMIT 3`,
    [caseId]
  );
  const empList: any[] = Array.isArray(empRows) ? empRows : [];

  // ── case_client_id_docs ───────────────────────────────────────────────────
  const [idRows] = await pool.query<RowDataPacket[]>(
    `SELECT driver_license, health_card, ohip_number, sin_number,
            ontario_id_no, pr_card_no, citizen_card_no,
            child1_name, child1_dob, child2_name, child2_dob,
            child3_name, child3_dob, child4_name, child4_dob,
            child5_name, child5_dob, child6_name, child6_dob
     FROM case_client_id_docs WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const idDocs: any = Array.isArray(idRows) && idRows[0] ? idRows[0] : {};

  // ── case_related_contacts (hk/carg/atc) ──────────────────────────────────
  const [rcRows] = await pool.query<RowDataPacket[]>(
    `SELECT contact_type, name, address, city, post_code, phone
     FROM case_related_contacts WHERE case_id = ?`,
    [caseId]
  );
  const rcList: any[] = Array.isArray(rcRows) ? rcRows : [];
  const rcHK   = rcList.find((r: any) => r.contact_type === 'hk')   || {};
  const rcCarg = rcList.find((r: any) => r.contact_type === 'carg') || {};
  const rcAtc  = rcList.find((r: any) => r.contact_type === 'atc')  || {};

  // ── case_police_info ──────────────────────────────────────────────────────
  const [piRows] = await pool.query<RowDataPacket[]>(
    `SELECT reported_date, report_ordered, police_centre, police_officer,
            badge_number, incident_no, division, address, city, province_pc,
            phone, intersection, time_of_accident, accident_description
     FROM case_police_info WHERE case_id = ? LIMIT 1`,
    [caseId]
  );
  const pi: any = Array.isArray(piRows) && piRows[0] ? piRows[0] : {};

  // ── Helpers ───────────────────────────────────────────────────────────────
  const s = (v: any): string =>
    v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : '';

  const d = (v: any): string => {
    if (!v) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const str = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    return str;
  };

  const bool1 = (v: any): string =>
    v === 1 || v === true || v === '1' ? 'Yes' : 'No';

  const safeJSON = (v: any): string[] => {
    if (!v) return [];
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  };

  // ── Resolve personal ──────────────────────────────────────────────────────
  const firstName = s(ii.first_name) || s(c.first_name);
  const lastName  = s(ii.last_name)  || s(c.last_name);
  const gender    = s(ii.gender)     || s(c.gender);
  const homePhone = s(ii.home_phone) || s(c.home_phone);
  const cellPhone = s(ii.mobile)     || s(c.cell_phone);
  const workPhone = s(c.work_phone);
  const email     = s(ii.email)      || s(c.email);
  const dob       = d(ii.dob)        || d(c.date_of_birth);
  const address   = s(c.client_street) || s(c.address);
  const city      = s(c.client_city)   || s(c.city);
  const province  = s(c.client_state)  || s(c.province) || 'ON';
  const postCode  = s(c.client_zip)    || s(c.post_code);
  const marital   = s(ii.marital_status) || s(c.marital_status);

  // ── Resolve insurance ─────────────────────────────────────────────────────
  const fp_insurerName    = s(fp.insurance_company) || s(nf.mva_company);
  const fp_insurerCity    = s(fp.city)              || s(nf.mva_city);
  const fp_insurerAddress = s(fp.address)           || s(nf.mva_address);
  const fp_adjuster       = s(fp.adjuster_name)     || s(nf.adjuster_name);
  const fp_phone          = s(fp.adjuster_phone)    || s(nf.mva_phone);
  const fp_fax            = s(fp.adjuster_fax)      || s(nf.mva_fax);
  const fp_claimNo        = s(fp.claim_no)          || s(nf.claim_no);
  const fp_policyNo       = s(fp.policy_no)         || s(nf.policy_no);
  const fp_policyHolder   = s(fp.policy_holder_name)|| s(nf.named_insured);

  // ── Resolve accident ──────────────────────────────────────────────────────
  const dateOfMva   = d(c.date_of_loss) || d(ad.accident_date);
  const accStreet   = s(ii.street_name) || s(ad.street_name);
  const accInter    = s(ii.major_intersection) || s(ad.major_intersection);
  const accCity     = s(ii.ii_city)     || s(ad.city);
  const timeOfMVA   = s(ii.time_of_mva) || (ad.accident_time ? String(ad.accident_time).slice(0, 5) : '');

  // ── Resolve police ────────────────────────────────────────────────────────
  const policeDep  = s(ii.police_department) || s(pi.police_centre);
  const incidentNo = s(ii.incident_no)       || s(pi.incident_no);
  const officerName= s(ii.officer_name)      || s(pi.police_officer);
  const badgeNo    = s(ii.badge_no)          || s(pi.badge_number);

  // ── Treatment providers map ───────────────────────────────────────────────
  const tpMap: Record<string, string> = {};
  for (let i = 1; i <= 4; i++) {
    const prov: any = mpList.find((r: any) => Number(r.provider_order) === i) || {};
    tpMap[`tp${i}_centre`]  = s(prov.centre);
    tpMap[`tp${i}_address`] = s(prov.address);
    tpMap[`tp${i}_phone`]   = s(prov.phone);
    tpMap[`tp${i}_fax`]     = s(prov.fax);
  }

  // ── Employer map ──────────────────────────────────────────────────────────
  const empMap: Record<string, string> = {};
  for (let i = 1; i <= 3; i++) {
    const e: any = empList.find((r: any) => Number(r.employer_order) === i) || {};
    empMap[`emp${i}_name`]        = s(e.employer_name);
    empMap[`emp${i}_address`]     = s(e.address);
    empMap[`emp${i}_phone`]       = s(e.phone);
    empMap[`emp${i}_fax`]         = s(e.fax);
    empMap[`emp${i}_occupation`]  = s(e.job_title);
    empMap[`emp${i}_salary`]      = e.salary_wages != null ? String(e.salary_wages) : '';
    empMap[`emp${i}_hoursPerWeek`]= e.hours_per_week != null ? String(e.hours_per_week) : '';
    empMap[`emp${i}_length`]      = '';   // column doesn't exist in case_employers
    empMap[`emp${i}_lastDay`]     = '';   // column doesn't exist in case_employers
  }

  return {
    // Personal
    firstName, lastName,
    gender:        gender === 'Male' || gender === 'male' ? 'Male' : (gender ? 'Female' : ''),
    dateOfBirth:   dob,
    address, city, province, postCode,
    homePhone, cellPhone, workPhone, email,
    maritalStatus: marital,
    dependants:    String(c.dependants ?? 0),

    // ID docs
    driverLicenseNo: s(idDocs.driver_license),
    healthCardNo:    s(idDocs.health_card),
    ohipNumber:      s(idDocs.ohip_number),
    sinNo:           s(idDocs.sin_number),
    ontarioIdNo:     s(idDocs.ontario_id_no),
    prCitizenNo:     s(idDocs.pr_card_no),
    citizenCardNo:   s(idDocs.citizen_card_no),

    // Children
    cg1_name: s(idDocs.child1_name), cg1_dob: d(idDocs.child1_dob),
    cg2_name: s(idDocs.child2_name), cg2_dob: d(idDocs.child2_dob),
    cg3_name: s(idDocs.child3_name), cg3_dob: d(idDocs.child3_dob),
    cg4_name: s(idDocs.child4_name), cg4_dob: d(idDocs.child4_dob),
    cg5_name: s(idDocs.child5_name), cg5_dob: d(idDocs.child5_dob),
    cg6_name: s(idDocs.child6_name), cg6_dob: d(idDocs.child6_dob),

    // Interview header
    fileNo:        s(c.file_no),
    conflictChecked: s(ii.conflict_checked),
    conflictFind:    s(ii.any_conflict),
    interviewedBy:   s(ii.interviewed_by) || s(c.clerk_assigned),
    referredBy:      s(ii.referred_by)    || s(c.referred_by),
    dateOfMva,
    dateOfAccident:  dateOfMva,
    percent:         '25%',

    // Language
    speaksEnglish:     s(ii.speaks_english),
    needsInterpreter:  s(ii.interpreter_required),
    bornInCanada:      s(ii.born_in_canada),

    // Accident
    seatBelted:            s(ii.seat_belted),
    accidentAtWork:        s(ii.accident_at_work),
    accidentStreet:        accStreet,
    accidentIntersection:  accInter,
    accidentCity:          accCity,
    accidentProvince:      s(ii.ii_province) || s(ad.province_state) || 'ON',
    timeOfAccident:        timeOfMVA,
    policeReported:        s(ii.police_reported) || s(ad.reported_police),
    policeDepartment:      policeDep,
    incidentNo, officerName, badgeNo,
    clientCharged:         s(ii.client_charged),
    clientChargedDesc:     s(ii.client_charged_desc),
    thirdPartyCharged:     s(ii.third_party_charged),
    thirdPartyChargedDesc: s(ii.third_party_charged_desc),
    numOccupants:          s(ii.num_occupants)   || s(ad.num_occupants),
    seatingArrangement:    s(ii.seating_arrangement) || s(ad.seating_arrangement),
    photosOfDamage:        s(ii.photos_of_damage),
    estimatedDamage:       s(ii.estimated_damage)|| s(ad.estimated_damage),
    accidentDescription:   s(ii.accident_description) || s(ad.accident_description),

    // Benefit election
    benefitElection: s(ii.benefit_chosen),

    // First-party insurance
    fp_insurerName, fp_insurerCity, fp_insurerAddress,
    fp_adjuster, fp_phone, fp_fax,
    fp_claimNo, fp_policyNo, fp_policyHolder,
    fp_autoMake:  s(nf.auto_make),
    fp_autoModel: s(nf.auto_model),
    fp_autoYear:  s(nf.auto_year),
    fp_plateNo:   s(nf.plate_number),

    // Third party
    tp_driverName:     s(tp.driver_name),
    tp_driverAddress:  s(tp.driver_address),
    tp_driverLicenseNo:s(tp.driver_license),
    tp_driverPhone:    s(tp.tp_drv_phone),
    tp_insurerName:    s(tpi.insurance_company),
    tp_adjuster:       s(tpi.adjuster_name),
    tp_phone:          s(tpi.ins_phone),
    tp_fax:            s(tpi.ins_fax),
    tp_policyNo:       s(tpi.policy_number),
    tp_claimNo:        s(tpi.claim_number),
    tp_policyHolder:   '',

    // Medical — hospital
    wentToHospital:    s(mh.went_to_hospital),
    ambulanceRequired: s(mh.ambulance_required),
    hospitalName:      s(mh.hospital_name),
    hospitalAddress:   s(mh.hospital_address),
    admissionDate:     d(mh.date_attended),
    dischargeDate:     d(mh.date_released),
    xrayTaken:         s(mh.xray_taken),

    // Medical — family doctor
    familyDoctor:        s(mh.doctor_name),
    familyDoctorAddress: s(mh.doctor_address),
    familyDoctorCity:    s(mh.doctor_city),
    familyDoctorPC:      s(mh.doctor_prov_pc),
    familyDoctorPhone:   s(mh.doctor_phone),
    familyDoctorFax:     s(mh.doctor_fax),

    // Medical — treatment providers
    ...tpMap,

    // Medical — medications
    medication1: s(meds.med1),
    medication2: s(meds.med2),
    medication3: s(meds.med3),
    medication4: s(meds.med4),

    // Post-accident conditions (pass as arrays for the Python script)
    postPhysical: safeJSON(postCond.physical),
    postNeuro:    safeJSON(postCond.neurological),
    postPsych:    safeJSON(postCond.psychological),

    // Pre-accident
    preCondition:           s(preCond.pre_condition),
    preTimeFrame:           s(preCond.pre_time_frame),
    preOperativeProcedure:  s(preCond.pre_operative),
    preAccidentStatus:      s(preCond.pre_status),
    postAccidentStatus:     s(preCond.post_status),

    // Employment status
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

    // Employer data
    ...empMap,

    // Related contacts (housekeeper/caregiver/care person)
    hk_name:    s(rcHK.name),    hk_address: s(rcHK.address),   hk_phone: s(rcHK.phone),
    carg_name:  s(rcCarg.name),  carg_address: s(rcCarg.address),carg_phone: s(rcCarg.phone),
    care_name:  s(rcAtc.name),   care_address: s(rcAtc.address), care_phone: s(rcAtc.phone),
  };
}

/*
──────────────────────────────────────────────────────────────────────────────
ADD THESE TWO LINES TO index.ts  (additive only — add after the OCF PDF route):

import { generateIntakePdf } from '../controllers/intake-pdf.controller';

// Intake Master PDF generation
router.post('/cases/:caseId/intake/generate', generateIntakePdf);
──────────────────────────────────────────────────────────────────────────────
*/
