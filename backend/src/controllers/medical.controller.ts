import { Request, Response } from 'express';
import pool from '../config/database';

// ─── GET /api/cases/:caseId/medical ─────────────────────────────────────────
// Reads from: case_medical_hospital, case_medical_physio, case_medical_doctors,
//             case_medical_assessment_centre, case_medical_post_conditions,
//             case_medical_pre_conditions, case_medical_medications
export async function getMedical(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // Family doctor + hospital + treating clinic live in case_medical_hospital
    const [[hosp]] = await pool.query(
      'SELECT * FROM case_medical_hospital WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    // Physio / treating clinic rows — case_medical_physio
    const [physioRows] = await pool.query(
      'SELECT * FROM case_medical_physio WHERE case_id = ? ORDER BY provider_order ASC',
      [caseId]
    ) as any[];

    // Doctors — case_medical_doctors
    const [doctorRows] = await pool.query(
      'SELECT * FROM case_medical_doctors WHERE case_id = ? ORDER BY doctor_order ASC',
      [caseId]
    ) as any[];

    // Assessment centres — case_medical_assessment_centre
    const [assessRows] = await pool.query(
      'SELECT * FROM case_medical_assessment_centre WHERE case_id = ? ORDER BY assessment_order ASC',
      [caseId]
    ) as any[];

    // Post-accident conditions — case_medical_post_conditions
    const [[post]] = await pool.query(
      'SELECT * FROM case_medical_post_conditions WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    // Pre-accident conditions — case_medical_pre_conditions
    const [[pre]] = await pool.query(
      'SELECT * FROM case_medical_pre_conditions WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    // Medications — case_medical_medications
    const [[meds]] = await pool.query(
      'SELECT * FROM case_medical_medications WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    // Map treatment providers (physio table rows → tp1..tp4 flat shape for MedicalTab.tsx)
    const tpMap: Record<string, string> = {};
    (physioRows as any[]).forEach((row: any, i: number) => {
      const n = i + 1;
      tpMap[`tp${n}Centre`]  = row.clinic_name   || '';
      tpMap[`tp${n}Address`] = row.address        || '';
      tpMap[`tp${n}Phone`]   = row.phone          || '';
      tpMap[`tp${n}Fax`]     = row.fax            || '';
      tpMap[`tp${n}Type`]    = row.provider_type  || '';
    });

    const h = hosp || {};

    res.json({
      // Family Doctor
      doctorName:        h.doctor_name        || '',
      doctorAddress:     h.doctor_address     || '',
      doctorCity:        h.doctor_city        || '',
      doctorProvPC:      h.doctor_prov_pc     || '',
      doctorPhone:       h.doctor_phone       || '',
      doctorFax:         h.doctor_fax         || '',
      doctorOutstanding: h.doctor_outstanding || '',
      // Hospital
      wentToHospital:    h.went_to_hospital   || 'No',
      ambulanceRequired: h.ambulance_required || 'No',
      hospitalName:      h.hospital_name      || '',
      hospitalAddress:   h.hospital_address   || '',
      hospitalCity:      h.hospital_city      || '',
      hospitalProvince:  h.hospital_province  || '',
      hospitalPostal:    h.hospital_postal    || '',
      dateAttended:      h.date_attended      ? h.date_attended.toISOString().split('T')[0] : '',
      dateReleased:      h.date_released      ? h.date_released.toISOString().split('T')[0] : '',
      xrayTaken:         h.xray_taken         || 'No',
      // Treating Clinic
      clinicName:        h.clinic_name        || '',
      clinicAddress:     h.clinic_address     || '',
      clinicCity:        h.clinic_city        || '',
      clinicProvPC:      h.clinic_prov_pc     || '',
      clinicPhone:       h.clinic_phone       || '',
      clinicFax:         h.clinic_fax         || '',
      clinicOutstanding: h.clinic_outstanding || '',
      // Treatment Providers (flat tp1-tp4)
      ...tpMap,
      // Post-accident conditions (stored as JSON strings)
      physicalChecked: post?.physical      ? JSON.parse(post.physical)      : [],
      neuroChecked:    post?.neurological  ? JSON.parse(post.neurological)  : [],
      psychChecked:    post?.psychological ? JSON.parse(post.psychological) : [],
      // Pre-accident
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
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/medical ────────────────────────────────────────
export async function saveMedical(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // 1. case_medical_hospital — family doctor + hospital + treating clinic combined
    await conn.query(
      `INSERT INTO case_medical_hospital
        (id, case_id,
         doctor_name, doctor_address, doctor_city, doctor_prov_pc, doctor_phone, doctor_fax, doctor_outstanding,
         went_to_hospital, ambulance_required,
         hospital_name, hospital_address, hospital_city, hospital_province, hospital_postal,
         date_attended, date_released, xray_taken,
         clinic_name, clinic_address, clinic_city, clinic_prov_pc, clinic_phone, clinic_fax, clinic_outstanding)
       VALUES (UUID(),?,  ?,?,?,?,?,?,?,  ?,?,  ?,?,?,?,?,  ?,?,?,  ?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         doctor_name=VALUES(doctor_name), doctor_address=VALUES(doctor_address), doctor_city=VALUES(doctor_city),
         doctor_prov_pc=VALUES(doctor_prov_pc), doctor_phone=VALUES(doctor_phone), doctor_fax=VALUES(doctor_fax),
         doctor_outstanding=VALUES(doctor_outstanding),
         went_to_hospital=VALUES(went_to_hospital), ambulance_required=VALUES(ambulance_required),
         hospital_name=VALUES(hospital_name), hospital_address=VALUES(hospital_address),
         hospital_city=VALUES(hospital_city), hospital_province=VALUES(hospital_province),
         hospital_postal=VALUES(hospital_postal),
         date_attended=VALUES(date_attended), date_released=VALUES(date_released), xray_taken=VALUES(xray_taken),
         clinic_name=VALUES(clinic_name), clinic_address=VALUES(clinic_address), clinic_city=VALUES(clinic_city),
         clinic_prov_pc=VALUES(clinic_prov_pc), clinic_phone=VALUES(clinic_phone),
         clinic_fax=VALUES(clinic_fax), clinic_outstanding=VALUES(clinic_outstanding)`,
      [
        caseId,
        b.doctorName||'', b.doctorAddress||'', b.doctorCity||'', b.doctorProvPC||'',
        b.doctorPhone||'', b.doctorFax||'', b.doctorOutstanding||'',
        b.wentToHospital||'No', b.ambulanceRequired||'No',
        b.hospitalName||'', b.hospitalAddress||'', b.hospitalCity||'',
        b.hospitalProvince||'', b.hospitalPostal||'',
        b.dateAttended||null, b.dateReleased||null, b.xrayTaken||'No',
        b.clinicName||'', b.clinicAddress||'', b.clinicCity||'', b.clinicProvPC||'',
        b.clinicPhone||'', b.clinicFax||'', b.clinicOutstanding||''
      ]
    );

    // 2. case_medical_physio — treatment providers tp1-tp4
    // Delete existing rows then re-insert to handle variable count
    await conn.query('DELETE FROM case_medical_physio WHERE case_id = ?', [caseId]);
    for (let i = 1; i <= 4; i++) {
      const centre = b[`tp${i}Centre`] || '';
      if (!centre) continue; // skip empty rows
      await conn.query(
        `INSERT INTO case_medical_physio
          (id, case_id, provider_order, clinic_name, address, phone, fax, provider_type)
         VALUES (UUID(),?,?,?,?,?,?,?)`,
        [caseId, i, centre, b[`tp${i}Address`]||'', b[`tp${i}Phone`]||'', b[`tp${i}Fax`]||'', b[`tp${i}Type`]||'']
      );
    }

    // 3. case_medical_post_conditions — checkbox JSON arrays
    await conn.query(
      `INSERT INTO case_medical_post_conditions (id, case_id, physical, neurological, psychological)
       VALUES (UUID(),?,?,?,?)
       ON DUPLICATE KEY UPDATE
         physical=VALUES(physical), neurological=VALUES(neurological), psychological=VALUES(psychological)`,
      [
        caseId,
        JSON.stringify(b.physicalChecked || []),
        JSON.stringify(b.neuroChecked    || []),
        JSON.stringify(b.psychChecked    || [])
      ]
    );

    // 4. case_medical_pre_conditions
    await conn.query(
      `INSERT INTO case_medical_pre_conditions
        (id, case_id, pre_condition, pre_time_frame, pre_operative, pre_status, post_status)
       VALUES (UUID(),?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         pre_condition=VALUES(pre_condition), pre_time_frame=VALUES(pre_time_frame),
         pre_operative=VALUES(pre_operative), pre_status=VALUES(pre_status), post_status=VALUES(post_status)`,
      [caseId, b.preCondition||'', b.preTimeFrame||'', b.preOperative||'', b.preStatus||'', b.postStatus||'']
    );

    // 5. case_medical_medications
    await conn.query(
      `INSERT INTO case_medical_medications (id, case_id, med1, med2, med3, med4)
       VALUES (UUID(),?,?,?,?,?)
       ON DUPLICATE KEY UPDATE med1=VALUES(med1), med2=VALUES(med2), med3=VALUES(med3), med4=VALUES(med4)`,
      [caseId, b.med1||'', b.med2||'', b.med3||'', b.med4||'']
    );

    await conn.commit();
    conn.release();

    // Return fresh data
    await getMedical(req, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('[saveMedical]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
