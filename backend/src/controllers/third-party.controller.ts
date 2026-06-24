import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

function mapRow(tp: any, ins: any) {
  return {
    // Driver
    driverName: tp?.driver_name || '',
    driverAddress: tp?.driver_address || '',
    driverCity: tp?.driver_city || '',
    driverProvPC: tp?.driver_prov_pc || '',
    homePhone: tp?.home_phone || '',
    workPhone: tp?.work_phone || '',
    employerName: tp?.employer_name || '',
    workAddress: tp?.work_address || '',
    workCity: tp?.work_city || '',
    workProvPC: tp?.work_prov_pc || '',
    driverLicense: tp?.driver_license || '',
    driverDOB: formatDate(tp?.driver_dob) || '',
    autoMake: tp?.auto_make || '',
    autoModel: tp?.auto_model || '',
    autoYear: tp?.auto_year || '',
    plateNumber: tp?.plate_number || '',
    vehicleOwner: tp?.vehicle_owner || '',
    ownerAddress: tp?.owner_address || '',
    ownerCity: tp?.owner_city || '',
    ownerPostal: tp?.owner_postal || '',
    ownerPhone: tp?.owner_phone || '',
    witness1Name: tp?.witness1_name || '',
    witness1Phone: tp?.witness1_phone || '',
    witness2Name: tp?.witness2_name || '',
    witness2Phone: tp?.witness2_phone || '',
    // Insurance
    insuranceCompany: ins?.insurance_company || '',
    insAddress: ins?.ins_address || '',
    insCity: ins?.ins_city || '',
    insPostal: ins?.ins_postal || '',
    insAdjuster: ins?.adjuster_name || '',
    insPhone: ins?.ins_phone || '',
    insFax: ins?.ins_fax || '',
    insExt: ins?.ins_ext || '',
    insClaimNo: ins?.claim_number || '',
    insPolicyNo: ins?.policy_number || '',
  };
}

export async function getThirdParty(req: Request, res: Response): Promise<void> {
  try {
    const caseId = req.params.caseId;
    const [[tp]] = await pool.query('SELECT * FROM case_third_party WHERE case_id = ?', [caseId]) as any[];
    const [[ins]] = await pool.query('SELECT * FROM case_third_party_insurance WHERE case_id = ?', [caseId]) as any[];
    res.json(mapRow(tp, ins));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function upsertThirdParty(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_third_party (id, case_id, driver_name, driver_address, driver_city, driver_prov_pc, home_phone, work_phone,
        employer_name, work_address, work_city, work_prov_pc, driver_license, driver_dob, auto_make, auto_model, auto_year, plate_number,
        vehicle_owner, owner_address, owner_city, owner_postal, owner_phone, witness1_name, witness1_phone, witness2_name, witness2_phone)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        driver_name=VALUES(driver_name), driver_address=VALUES(driver_address), driver_city=VALUES(driver_city),
        driver_prov_pc=VALUES(driver_prov_pc), home_phone=VALUES(home_phone), work_phone=VALUES(work_phone),
        employer_name=VALUES(employer_name), work_address=VALUES(work_address), work_city=VALUES(work_city),
        work_prov_pc=VALUES(work_prov_pc), driver_license=VALUES(driver_license), driver_dob=VALUES(driver_dob),
        auto_make=VALUES(auto_make), auto_model=VALUES(auto_model), auto_year=VALUES(auto_year), plate_number=VALUES(plate_number),
        vehicle_owner=VALUES(vehicle_owner), owner_address=VALUES(owner_address), owner_city=VALUES(owner_city),
        owner_postal=VALUES(owner_postal), owner_phone=VALUES(owner_phone),
        witness1_name=VALUES(witness1_name), witness1_phone=VALUES(witness1_phone),
        witness2_name=VALUES(witness2_name), witness2_phone=VALUES(witness2_phone)`,
      [caseId, b.driverName||'', b.driverAddress||'', b.driverCity||'', b.driverProvPC||'', b.homePhone||'', b.workPhone||'',
       b.employerName||'', b.workAddress||'', b.workCity||'', b.workProvPC||'', b.driverLicense||'', b.driverDOB||null,
       b.autoMake||'', b.autoModel||'', b.autoYear||'', b.plateNumber||'', b.vehicleOwner||'', b.ownerAddress||'',
       b.ownerCity||'', b.ownerPostal||'', b.ownerPhone||'', b.witness1Name||'', b.witness1Phone||'', b.witness2Name||'', b.witness2Phone||'']
    );
    await pool.query(
      `INSERT INTO case_third_party_insurance (id, case_id, insurance_company, ins_address, ins_city, ins_postal, adjuster_name, ins_phone, ins_fax, ins_ext, claim_number, policy_number)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        insurance_company=VALUES(insurance_company), ins_address=VALUES(ins_address), ins_city=VALUES(ins_city),
        ins_postal=VALUES(ins_postal), adjuster_name=VALUES(adjuster_name), ins_phone=VALUES(ins_phone),
        ins_fax=VALUES(ins_fax), ins_ext=VALUES(ins_ext), claim_number=VALUES(claim_number), policy_number=VALUES(policy_number)`,
      [caseId, b.insuranceCompany||'', b.insAddress||'', b.insCity||'', b.insPostal||'', b.insAdjuster||'',
       b.insPhone||'', b.insFax||'', b.insExt||'', b.insClaimNo||'', b.insPolicyNo||'']
    );
    const [[tp]] = await pool.query('SELECT * FROM case_third_party WHERE case_id = ?', [caseId]) as any[];
    const [[ins]] = await pool.query('SELECT * FROM case_third_party_insurance WHERE case_id = ?', [caseId]) as any[];
    res.json(mapRow(tp, ins));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
