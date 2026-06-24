import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

export async function getMedical(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  try {
    const [[hosp]] = await pool.query('SELECT * FROM case_medical_hospital WHERE case_id = ?', [caseId]) as any[];
    const [providers] = await pool.query('SELECT * FROM case_medical_providers WHERE case_id = ? ORDER BY provider_order', [caseId]) as any[];
    const [[post]] = await pool.query('SELECT * FROM case_medical_post_conditions WHERE case_id = ?', [caseId]) as any[];
    const [[pre]] = await pool.query('SELECT * FROM case_medical_pre_conditions WHERE case_id = ?', [caseId]) as any[];
    const [[meds]] = await pool.query('SELECT * FROM case_medical_medications WHERE case_id = ?', [caseId]) as any[];

    const provArr = (providers as any[]);

    res.json({
      // Family Doctor
      doctorName: hosp?.doctor_name || '',
      doctorAddress: hosp?.doctor_address || '',
      doctorCity: hosp?.doctor_city || '',
      doctorProvPC: hosp?.doctor_prov_pc || '',
      doctorPhone: hosp?.doctor_phone || '',
      doctorFax: hosp?.doctor_fax || '',
      doctorOutstanding: hosp?.doctor_outstanding || '',
      // Hospital
      wentToHospital: hosp?.went_to_hospital || 'No',
      ambulanceRequired: hosp?.ambulance_required || 'No',
      hospitalName: hosp?.hospital_name || '',
      hospitalAddress: hosp?.hospital_address || '',
      hospitalCity: hosp?.hospital_city || '',
      hospitalProvince: hosp?.hospital_province || '',
      hospitalPostal: hosp?.hospital_postal_code || '',
      dateAttended: formatDate(hosp?.date_attended) || '',
      dateReleased: formatDate(hosp?.date_released) || '',
      xrayTaken: hosp?.xray_taken || 'No',
      // Treating Clinic
      clinicName: hosp?.clinic_name || '',
      clinicAddress: hosp?.clinic_address || '',
      clinicCity: hosp?.clinic_city || '',
      clinicProvPC: hosp?.clinic_prov_pc || '',
      clinicPhone: hosp?.clinic_phone || '',
      clinicFax: hosp?.clinic_fax || '',
      clinicOutstanding: hosp?.clinic_outstanding || '',
      // Treatment Providers (4 slots)
      tp1Centre: provArr[0]?.centre || '',
      tp1Address: provArr[0]?.address || '',
      tp1Phone: provArr[0]?.phone || '',
      tp1Fax: provArr[0]?.fax || '',
      tp1Type: provArr[0]?.provider_type || '',
      tp2Centre: provArr[1]?.centre || '',
      tp2Address: provArr[1]?.address || '',
      tp2Phone: provArr[1]?.phone || '',
      tp2Fax: provArr[1]?.fax || '',
      tp2Type: provArr[1]?.provider_type || '',
      tp3Centre: provArr[2]?.centre || '',
      tp3Address: provArr[2]?.address || '',
      tp3Phone: provArr[2]?.phone || '',
      tp3Fax: provArr[2]?.fax || '',
      tp3Type: provArr[2]?.provider_type || '',
      tp4Centre: provArr[3]?.centre || '',
      tp4Address: provArr[3]?.address || '',
      tp4Phone: provArr[3]?.phone || '',
      tp4Fax: provArr[3]?.fax || '',
      tp4Type: provArr[3]?.provider_type || '',
      // Post conditions
      physicalChecked: post?.physical ? JSON.parse(post.physical) : [],
      neuroChecked: post?.neurological ? JSON.parse(post.neurological) : [],
      psychChecked: post?.psychological ? JSON.parse(post.psychological) : [],
      // Pre conditions
      preCondition: pre?.pre_condition || '',
      preTimeFrame: pre?.pre_time_frame || '',
      preOperative: pre?.pre_operative || '',
      preStatus: pre?.pre_status || '',
      postStatus: pre?.post_status || '',
      // Medications
      med1: meds?.med1 || '',
      med2: meds?.med2 || '',
      med3: meds?.med3 || '',
      med4: meds?.med4 || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function upsertMedical(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // Hospital + Doctor + Clinic (all in one table)
    await conn.query(
      `INSERT INTO case_medical_hospital (id, case_id, doctor_name, doctor_address, doctor_city, doctor_prov_pc, doctor_phone, doctor_fax, doctor_outstanding,
        went_to_hospital, ambulance_required, hospital_name, hospital_address, hospital_city, hospital_province, hospital_postal_code, date_attended, date_released, xray_taken,
        clinic_name, clinic_address, clinic_city, clinic_prov_pc, clinic_phone, clinic_fax, clinic_outstanding)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        doctor_name=VALUES(doctor_name), doctor_address=VALUES(doctor_address), doctor_city=VALUES(doctor_city),
        doctor_prov_pc=VALUES(doctor_prov_pc), doctor_phone=VALUES(doctor_phone), doctor_fax=VALUES(doctor_fax),
        doctor_outstanding=VALUES(doctor_outstanding), went_to_hospital=VALUES(went_to_hospital),
        ambulance_required=VALUES(ambulance_required), hospital_name=VALUES(hospital_name),
        hospital_address=VALUES(hospital_address), hospital_city=VALUES(hospital_city),
        hospital_province=VALUES(hospital_province), hospital_postal_code=VALUES(hospital_postal_code),
        date_attended=VALUES(date_attended), date_released=VALUES(date_released), xray_taken=VALUES(xray_taken),
        clinic_name=VALUES(clinic_name), clinic_address=VALUES(clinic_address), clinic_city=VALUES(clinic_city),
        clinic_prov_pc=VALUES(clinic_prov_pc), clinic_phone=VALUES(clinic_phone), clinic_fax=VALUES(clinic_fax),
        clinic_outstanding=VALUES(clinic_outstanding)`,
      [caseId, b.doctorName||'', b.doctorAddress||'', b.doctorCity||'', b.doctorProvPC||'', b.doctorPhone||'', b.doctorFax||'', b.doctorOutstanding||0,
       b.wentToHospital||'No', b.ambulanceRequired||'No', b.hospitalName||'', b.hospitalAddress||'', b.hospitalCity||'',
       b.hospitalProvince||'', b.hospitalPostal||'', b.dateAttended||null, b.dateReleased||null, b.xrayTaken||'No',
       b.clinicName||'', b.clinicAddress||'', b.clinicCity||'', b.clinicProvPC||'', b.clinicPhone||'', b.clinicFax||'', b.clinicOutstanding||0]
    );

    // Treatment Providers — delete and reinsert
    await conn.query('DELETE FROM case_medical_providers WHERE case_id = ?', [caseId]);
    for (let i = 1; i <= 4; i++) {
      const centre = b[`tp${i}Centre`];
      if (centre) {
        await conn.query(
          'INSERT INTO case_medical_providers (id, case_id, provider_order, centre, address, phone, fax, provider_type) VALUES (UUID(),?,?,?,?,?,?,?)',
          [caseId, i, centre, b[`tp${i}Address`]||'', b[`tp${i}Phone`]||'', b[`tp${i}Fax`]||'', b[`tp${i}Type`]||'']
        );
      }
    }

    // Post conditions
    await conn.query(
      `INSERT INTO case_medical_post_conditions (id, case_id, physical, neurological, psychological) VALUES (UUID(),?,?,?,?)
       ON DUPLICATE KEY UPDATE physical=VALUES(physical), neurological=VALUES(neurological), psychological=VALUES(psychological)`,
      [caseId, JSON.stringify(b.physicalChecked||[]), JSON.stringify(b.neuroChecked||[]), JSON.stringify(b.psychChecked||[])]
    );

    // Pre conditions
    await conn.query(
      `INSERT INTO case_medical_pre_conditions (id, case_id, pre_condition, pre_time_frame, pre_operative, pre_status, post_status)
       VALUES (UUID(),?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE pre_condition=VALUES(pre_condition), pre_time_frame=VALUES(pre_time_frame),
        pre_operative=VALUES(pre_operative), pre_status=VALUES(pre_status), post_status=VALUES(post_status)`,
      [caseId, b.preCondition||'', b.preTimeFrame||'', b.preOperative||'', b.preStatus||'', b.postStatus||'']
    );

    // Medications
    await conn.query(
      `INSERT INTO case_medical_medications (id, case_id, med1, med2, med3, med4) VALUES (UUID(),?,?,?,?,?)
       ON DUPLICATE KEY UPDATE med1=VALUES(med1), med2=VALUES(med2), med3=VALUES(med3), med4=VALUES(med4)`,
      [caseId, b.med1||'', b.med2||'', b.med3||'', b.med4||'']
    );

    await conn.commit();
    conn.release();

    // Return fresh data
    const getMedReq = { params: { caseId } } as any;
    await getMedical(getMedReq, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
