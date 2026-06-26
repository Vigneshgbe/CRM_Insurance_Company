import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

function safeDate(v: any): string | null {
  return v && String(v).trim() !== '' ? String(v) : null;
}

function safeDecimal(v: any): number | null {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

// ── GET /api/cases/:caseId/medical ───────────────────────────────────────────
export async function getMedical(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // 1. case_medical_hospital — confirmed columns from phpMyAdmin screenshots
    const [hRows] = await pool.query(
      'SELECT * FROM case_medical_hospital WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const h = Array.isArray(hRows) ? hRows[0] : null;

    // 2. case_medical_providers — real table name (not case_medical_physio)
    // columns: id, case_id, provider_order(int), centre, address, phone, fax, provider_type
    const [pRows] = await pool.query(
      'SELECT * FROM case_medical_providers WHERE case_id = ? ORDER BY provider_order ASC',
      [caseId]
    ) as any[];
    const providers = Array.isArray(pRows) ? pRows : [];

    const tpFields: Record<string, string> = {};
    for (let i = 1; i <= 4; i++) {
      const p = providers.find((r: any) => Number(r.provider_order) === i);
      tpFields[`tp${i}Centre`]  = p?.centre        || '';
      tpFields[`tp${i}Address`] = p?.address       || '';
      tpFields[`tp${i}Phone`]   = p?.phone         || '';
      tpFields[`tp${i}Fax`]     = p?.fax           || '';
      tpFields[`tp${i}Type`]    = p?.provider_type || '';
    }

    // 3. case_medical_post_conditions — physical, neurological, psychological (longtext JSON)
    const [postRows] = await pool.query(
      'SELECT * FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const post = Array.isArray(postRows) ? postRows[0] : null;

    // 4. case_medical_pre_conditions
    const [preRows] = await pool.query(
      'SELECT * FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const pre = Array.isArray(preRows) ? preRows[0] : null;

    // 5. case_medical_medications — med1, med2, med3, med4
    const [medRows] = await pool.query(
      'SELECT * FROM case_medical_medications WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const meds = Array.isArray(medRows) ? medRows[0] : null;

    res.json({
      // Family Doctor — confirmed column names from screenshot
      doctorName:        h?.doctor_name        || '',
      doctorAddress:     h?.doctor_address     || '',
      doctorCity:        h?.doctor_city        || '',
      doctorProvPC:      h?.doctor_prov_pc     || '',
      doctorPhone:       h?.doctor_phone       || '',
      doctorFax:         h?.doctor_fax         || '',
      doctorOutstanding: h?.doctor_outstanding != null ? String(h.doctor_outstanding) : '',
      // Hospital — using exact column names from screenshot
      wentToHospital:    h?.went_to_hospital   || 'No',
      ambulanceRequired: h?.ambulance_required || 'No',
      hospitalName:      h?.hospital_name      || '',
      hospitalAddress:   h?.hospital_address   || '',
      hospitalCity:      h?.hospital_city      || '',
      hospitalProvince:  h?.hospital_province  || '',
      hospitalPostal:    h?.hospital_postal_code || '', // col 11: hospital_postal_code
      dateAttended:      h?.date_attended      || '',
      dateReleased:      h?.date_released      || '',
      xrayTaken:         h?.xray_taken         || 'No',
      // Treating Clinic — confirmed column names
      clinicName:        h?.clinic_name        || '',
      clinicAddress:     h?.clinic_address     || '',
      clinicCity:        h?.clinic_city        || '',
      clinicProvPC:      h?.clinic_prov_pc     || '',
      clinicPhone:       h?.clinic_phone       || '',
      clinicFax:         h?.clinic_fax         || '',
      clinicOutstanding: h?.clinic_outstanding != null ? String(h.clinic_outstanding) : '',
      // Treatment Providers
      ...tpFields,
      // Post-Accident Conditions
      physicalChecked: (() => { try { return post?.physical ? JSON.parse(post.physical) : []; } catch { return []; } })(),
      neuroChecked:    (() => { try { return post?.neurological ? JSON.parse(post.neurological) : []; } catch { return []; } })(),
      psychChecked:    (() => { try { return post?.psychological ? JSON.parse(post.psychological) : []; } catch { return []; } })(),
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
    // Using EXACT column names confirmed from phpMyAdmin screenshots
    const [existH] = await conn.query(
      'SELECT id FROM case_medical_hospital WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasH = Array.isArray(existH) && existH.length > 0;

    const hVals = [
      b.wentToHospital    || 'No',
      b.ambulanceRequired || 'No',
      b.hospitalName      || '',
      b.hospitalAddress   || '',
      b.hospitalCity      || '',
      b.hospitalProvince  || '',
      b.hospitalPostal    || '',   // → hospital_postal_code
      safeDate(b.dateAttended),
      safeDate(b.dateReleased),
      b.xrayTaken         || 'No',
      b.doctorName        || '',
      b.doctorAddress     || '',
      b.doctorCity        || '',
      b.doctorProvPC      || '',
      b.doctorPhone       || '',
      b.doctorFax         || '',
      safeDecimal(b.doctorOutstanding),
      b.clinicName        || '',
      b.clinicAddress     || '',
      b.clinicCity        || '',
      b.clinicProvPC      || '',
      b.clinicPhone       || '',
      b.clinicFax         || '',
      safeDecimal(b.clinicOutstanding),
    ];

    if (hasH) {
      await conn.query(
        `UPDATE case_medical_hospital SET
          went_to_hospital    = ?,
          ambulance_required  = ?,
          hospital_name       = ?,
          hospital_address    = ?,
          hospital_city       = ?,
          hospital_province   = ?,
          hospital_postal_code= ?,
          date_attended       = ?,
          date_released       = ?,
          xray_taken          = ?,
          doctor_name         = ?,
          doctor_address      = ?,
          doctor_city         = ?,
          doctor_prov_pc      = ?,
          doctor_phone        = ?,
          doctor_fax          = ?,
          doctor_outstanding  = ?,
          clinic_name         = ?,
          clinic_address      = ?,
          clinic_city         = ?,
          clinic_prov_pc      = ?,
          clinic_phone        = ?,
          clinic_fax          = ?,
          clinic_outstanding  = ?
        WHERE case_id = ?`,
        [...hVals, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_medical_hospital
          (id, case_id,
           went_to_hospital, ambulance_required,
           hospital_name, hospital_address, hospital_city, hospital_province, hospital_postal_code,
           date_attended, date_released, xray_taken,
           doctor_name, doctor_address, doctor_city, doctor_prov_pc, doctor_phone, doctor_fax, doctor_outstanding,
           clinic_name, clinic_address, clinic_city, clinic_prov_pc, clinic_phone, clinic_fax, clinic_outstanding)
         VALUES (?,?, ?,?, ?,?,?,?,?, ?,?,?, ?,?,?,?,?,?,?, ?,?,?,?,?,?,?)`,
        [generateId(), caseId, ...hVals]
      );
    }

    // ── 2. case_medical_providers — real table, columns: centre, address, phone, fax, provider_type
    await conn.query('DELETE FROM case_medical_providers WHERE case_id = ?', [caseId]);
    for (let i = 1; i <= 4; i++) {
      const centre = b[`tp${i}Centre`] || '';
      if (!centre && !b[`tp${i}Phone`]) continue;
      await conn.query(
        `INSERT INTO case_medical_providers
          (id, case_id, provider_order, centre, address, phone, fax, provider_type)
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

    // ── 3. case_medical_post_conditions
    const [existPost] = await conn.query(
      'SELECT id FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasPost = Array.isArray(existPost) && existPost.length > 0;
    const physJson  = JSON.stringify(Array.isArray(b.physicalChecked) ? b.physicalChecked : []);
    const neuroJson = JSON.stringify(Array.isArray(b.neuroChecked)    ? b.neuroChecked    : []);
    const psychJson = JSON.stringify(Array.isArray(b.psychChecked)    ? b.psychChecked    : []);

    if (hasPost) {
      await conn.query(
        `UPDATE case_medical_post_conditions
          SET physical=?, neurological=?, psychological=?
         WHERE case_id=?`,
        [physJson, neuroJson, psychJson, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_medical_post_conditions
          (id, case_id, physical, neurological, psychological)
         VALUES (?,?,?,?,?)`,
        [generateId(), caseId, physJson, neuroJson, psychJson]
      );
    }

    // ── 4. case_medical_pre_conditions
    const [existPre] = await conn.query(
      'SELECT id FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasPre = Array.isArray(existPre) && existPre.length > 0;
    const preVals = [
      b.preCondition || '',
      b.preTimeFrame || '',
      b.preOperative || '',
      b.preStatus    || '',
      b.postStatus   || '',
    ];

    if (hasPre) {
      await conn.query(
        `UPDATE case_medical_pre_conditions
          SET pre_condition=?, pre_time_frame=?, pre_operative=?, pre_status=?, post_status=?
         WHERE case_id=?`,
        [...preVals, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_medical_pre_conditions
          (id, case_id, pre_condition, pre_time_frame, pre_operative, pre_status, post_status)
         VALUES (?,?,?,?,?,?,?)`,
        [generateId(), caseId, ...preVals]
      );
    }

    // ── 5. case_medical_medications
    const [existMed] = await conn.query(
      'SELECT id FROM case_medical_medications WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasMed = Array.isArray(existMed) && existMed.length > 0;
    const medVals = [b.med1 || '', b.med2 || '', b.med3 || '', b.med4 || ''];

    if (hasMed) {
      await conn.query(
        'UPDATE case_medical_medications SET med1=?, med2=?, med3=?, med4=? WHERE case_id=?',
        [...medVals, caseId]
      );
    } else {
      await conn.query(
        'INSERT INTO case_medical_medications (id, case_id, med1, med2, med3, med4) VALUES (?,?,?,?,?,?)',
        [generateId(), caseId, ...medVals]
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
