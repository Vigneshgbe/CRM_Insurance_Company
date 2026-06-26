import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// DB tables used:
// case_medical_hospital — family doctor + hospital + treating clinic (one row per case)
// case_medical_physio   — treatment providers tp1-tp4 (rows with provider_order 1-4)
// case_medical_post_conditions — physicalChecked, neuroChecked, psychChecked as JSON
// case_medical_pre_conditions  — pre-accident condition fields
// case_medical_medications     — med1-med4

function safeDate(v: any) {
  return v && String(v).trim() !== '' ? v : null;
}

// ── GET /api/cases/:caseId/medical ───────────────────────────────────────────
export async function getMedical(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // 1. case_medical_hospital — single row
    const [hRows] = await pool.query(
      'SELECT * FROM case_medical_hospital WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const h = Array.isArray(hRows) ? hRows[0] : null;

    // 2. case_medical_physio — provider rows ordered 1-4
    const [pRows] = await pool.query(
      'SELECT * FROM case_medical_physio WHERE case_id = ? ORDER BY provider_order ASC', [caseId]
    ) as any[];
    const providers = Array.isArray(pRows) ? pRows : [];

    // Build tp1-tp4 flat fields
    const tpFields: Record<string, string> = {};
    for (let i = 1; i <= 4; i++) {
      const p = providers.find((r: any) => Number(r.provider_order) === i);
      tpFields[`tp${i}Centre`]  = p?.clinic_name    || '';
      tpFields[`tp${i}Address`] = p?.address        || '';
      tpFields[`tp${i}Phone`]   = p?.phone          || '';
      tpFields[`tp${i}Fax`]     = p?.fax            || '';
      tpFields[`tp${i}Type`]    = p?.provider_type  || '';
    }

    // 3. case_medical_post_conditions
    const [postRows] = await pool.query(
      'SELECT * FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const post = Array.isArray(postRows) ? postRows[0] : null;

    // 4. case_medical_pre_conditions
    const [preRows] = await pool.query(
      'SELECT * FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const pre = Array.isArray(preRows) ? preRows[0] : null;

    // 5. case_medical_medications
    const [medRows] = await pool.query(
      'SELECT * FROM case_medical_medications WHERE case_id = ? LIMIT 1', [caseId]
    ) as any[];
    const meds = Array.isArray(medRows) ? medRows[0] : null;

    res.json({
      // Family Doctor
      doctorName:        h?.doctor_name        || '',
      doctorAddress:     h?.doctor_address     || '',
      doctorCity:        h?.doctor_city        || '',
      doctorProvPC:      h?.doctor_prov_pc     || '',
      doctorPhone:       h?.doctor_phone       || '',
      doctorFax:         h?.doctor_fax         || '',
      doctorOutstanding: h?.doctor_outstanding || '',
      // Hospital
      wentToHospital:    h?.went_to_hospital   || 'No',
      ambulanceRequired: h?.ambulance_required || 'No',
      hospitalName:      h?.hospital_name      || '',
      hospitalAddress:   h?.hospital_address   || '',
      hospitalCity:      h?.hospital_city      || '',
      hospitalProvince:  h?.hospital_province  || '',
      hospitalPostal:    h?.hospital_postal    || '',
      dateAttended:      h?.date_attended      || '',
      dateReleased:      h?.date_released      || '',
      xrayTaken:         h?.xray_taken         || 'No',
      // Treating Clinic
      clinicName:        h?.clinic_name        || '',
      clinicAddress:     h?.clinic_address     || '',
      clinicCity:        h?.clinic_city        || '',
      clinicProvPC:      h?.clinic_prov_pc     || '',
      clinicPhone:       h?.clinic_phone       || '',
      clinicFax:         h?.clinic_fax         || '',
      clinicOutstanding: h?.clinic_outstanding || '',
      // Treatment Providers
      ...tpFields,
      // Post-Accident Conditions — stored as JSON arrays
      physicalChecked: post?.physical      ? JSON.parse(post.physical)      : [],
      neuroChecked:    post?.neurological  ? JSON.parse(post.neurological)  : [],
      psychChecked:    post?.psychological ? JSON.parse(post.psychological) : [],
      // Pre-Accident
      preCondition:  pre?.pre_condition  || '',
      preTimeFrame:  pre?.pre_time_frame || '',
      preOperative:  pre?.pre_operative  || '',
      preStatus:     pre?.pre_status     || '',
      postStatus:    pre?.post_status    || '',
      // Medications
      med1: meds?.med1 || '',
      med2: meds?.med2 || '',
      med3: meds?.med3 || '',
      med4: meds?.med4 || '',
    });
  } catch (err) {
    console.error('[getMedical]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/medical ──────────────────────────────────────────
export async function saveMedical(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  const conn = await (pool as any).getConnection();

  try {
    await conn.beginTransaction();

    // ── 1. case_medical_hospital ──────────────────────────────────────────
    const [existH] = await conn.query(
      'SELECT id FROM case_medical_hospital WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasH = Array.isArray(existH) && existH.length > 0;

    const hospitalFields = [
      b.doctorName        || '', b.doctorAddress    || '', b.doctorCity       || '',
      b.doctorProvPC      || '', b.doctorPhone       || '', b.doctorFax        || '',
      b.doctorOutstanding || '',
      b.wentToHospital    || 'No', b.ambulanceRequired || 'No',
      b.hospitalName      || '', b.hospitalAddress   || '', b.hospitalCity     || '',
      b.hospitalProvince  || '', b.hospitalPostal    || '',
      safeDate(b.dateAttended), safeDate(b.dateReleased),
      b.xrayTaken         || 'No',
      b.clinicName        || '', b.clinicAddress     || '', b.clinicCity       || '',
      b.clinicProvPC      || '', b.clinicPhone       || '', b.clinicFax        || '',
      b.clinicOutstanding || '',
    ];

    if (hasH) {
      await conn.query(
        `UPDATE case_medical_hospital SET
          doctor_name=?, doctor_address=?, doctor_city=?, doctor_prov_pc=?,
          doctor_phone=?, doctor_fax=?, doctor_outstanding=?,
          went_to_hospital=?, ambulance_required=?,
          hospital_name=?, hospital_address=?, hospital_city=?,
          hospital_province=?, hospital_postal=?,
          date_attended=?, date_released=?, xray_taken=?,
          clinic_name=?, clinic_address=?, clinic_city=?, clinic_prov_pc=?,
          clinic_phone=?, clinic_fax=?, clinic_outstanding=?
         WHERE case_id=?`,
        [...hospitalFields, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_medical_hospital
          (id, case_id,
           doctor_name, doctor_address, doctor_city, doctor_prov_pc,
           doctor_phone, doctor_fax, doctor_outstanding,
           went_to_hospital, ambulance_required,
           hospital_name, hospital_address, hospital_city,
           hospital_province, hospital_postal,
           date_attended, date_released, xray_taken,
           clinic_name, clinic_address, clinic_city, clinic_prov_pc,
           clinic_phone, clinic_fax, clinic_outstanding)
         VALUES (?,?, ?,?,?,?, ?,?,?, ?,?, ?,?,?, ?,?, ?,?,?, ?,?,?,?, ?,?,?)`,
        [generateId(), caseId, ...hospitalFields]
      );
    }

    // ── 2. case_medical_physio — delete and re-insert tp1-tp4 ────────────
    await conn.query('DELETE FROM case_medical_physio WHERE case_id = ?', [caseId]);
    for (let i = 1; i <= 4; i++) {
      const centre = b[`tp${i}Centre`] || '';
      if (!centre && !b[`tp${i}Phone`]) continue; // skip empty rows
      await conn.query(
        `INSERT INTO case_medical_physio
          (id, case_id, provider_order, clinic_name, address, phone, fax, provider_type)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          generateId(), caseId, i,
          centre,
          b[`tp${i}Address`] || '',
          b[`tp${i}Phone`]   || '',
          b[`tp${i}Fax`]     || '',
          b[`tp${i}Type`]    || '',
        ]
      );
    }

    // ── 3. case_medical_post_conditions ───────────────────────────────────
    const [existPost] = await conn.query(
      'SELECT id FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasPost = Array.isArray(existPost) && existPost.length > 0;
    const physJson  = JSON.stringify(Array.isArray(b.physicalChecked) ? b.physicalChecked : []);
    const neuroJson = JSON.stringify(Array.isArray(b.neuroChecked)    ? b.neuroChecked    : []);
    const psychJson = JSON.stringify(Array.isArray(b.psychChecked)    ? b.psychChecked    : []);

    if (hasPost) {
      await conn.query(
        'UPDATE case_medical_post_conditions SET physical=?, neurological=?, psychological=? WHERE case_id=?',
        [physJson, neuroJson, psychJson, caseId]
      );
    } else {
      await conn.query(
        'INSERT INTO case_medical_post_conditions (id, case_id, physical, neurological, psychological) VALUES (?,?,?,?,?)',
        [generateId(), caseId, physJson, neuroJson, psychJson]
      );
    }

    // ── 4. case_medical_pre_conditions ────────────────────────────────────
    const [existPre] = await conn.query(
      'SELECT id FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasPre = Array.isArray(existPre) && existPre.length > 0;
    const preFields = [
      b.preCondition || '', b.preTimeFrame || '',
      b.preOperative || '', b.preStatus    || '', b.postStatus   || '',
    ];

    if (hasPre) {
      await conn.query(
        `UPDATE case_medical_pre_conditions SET
          pre_condition=?, pre_time_frame=?, pre_operative=?, pre_status=?, post_status=?
         WHERE case_id=?`,
        [...preFields, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_medical_pre_conditions
          (id, case_id, pre_condition, pre_time_frame, pre_operative, pre_status, post_status)
         VALUES (?,?,?,?,?,?,?)`,
        [generateId(), caseId, ...preFields]
      );
    }

    // ── 5. case_medical_medications ───────────────────────────────────────
    const [existMed] = await conn.query(
      'SELECT id FROM case_medical_medications WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasMed = Array.isArray(existMed) && existMed.length > 0;
    const medFields = [b.med1 || '', b.med2 || '', b.med3 || '', b.med4 || ''];

    if (hasMed) {
      await conn.query(
        'UPDATE case_medical_medications SET med1=?, med2=?, med3=?, med4=? WHERE case_id=?',
        [...medFields, caseId]
      );
    } else {
      await conn.query(
        'INSERT INTO case_medical_medications (id, case_id, med1, med2, med3, med4) VALUES (?,?,?,?,?,?)',
        [generateId(), caseId, ...medFields]
      );
    }

    await conn.commit();
    conn.release();
    await getMedical(req, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('[saveMedical]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
