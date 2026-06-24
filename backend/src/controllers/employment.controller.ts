import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

function mapEmployer(row: any, prefix: string) {
  if (!row) return {};
  const p = prefix;
  return {
    [`${p}Name`]: row.employer_name || '',
    [`${p}Address`]: row.address || '',
    [`${p}City`]: row.city || '',
    [`${p}Postal`]: row.postal_code || '',
    [`${p}Contact`]: row.contact || '',
    [`${p}Phone`]: row.phone || '',
    [`${p}Fax`]: row.fax || '',
    [`${p}PhoneOther`]: row.phone_other || '',
    [`${p}JobDesc`]: row.job_desc || '',
    [`${p}JobTitle`]: row.job_title || '',
    [`${p}Salary`]: row.salary_wages || '',
    [`${p}Hours`]: row.hours_per_week || '',
    [`${p}ExtHealth`]: row.ext_health || 'No',
    [`${p}HealthInsName`]: row.health_ins_name || '',
    [`${p}HealthPolicyNo`]: row.health_policy_no || '',
    [`${p}STD`]: row.std_benefits || 'No',
    [`${p}LTD`]: row.ltd_benefits || 'No',
  };
}

export async function getEmployment(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  try {
    const [empRows] = await pool.query('SELECT * FROM case_employment WHERE case_id = ?', [caseId]) as any[];
    const emp = (empRows as any[])[0];

    const [employers] = await pool.query(
      'SELECT * FROM case_employers WHERE case_id = ? ORDER BY employer_order', [caseId]
    ) as any[];

    const ft = (employers as any[]).find(e => e.employer_order === 1);
    const pt = (employers as any[]).find(e => e.employer_order === 2);

    res.json({
      // Status checkboxes
      statusEmployed: emp?.status_employed || 0,
      statusSelfEmployed: emp?.status_self_employed || 0,
      statusUnemployed26wks: emp?.status_unemployed_26wks || 0,
      statusWrittenContract: emp?.status_written_contract || 0,
      statusEiBenefits: emp?.status_ei_benefits || 0,
      statusUnemployed: emp?.status_unemployed || 0,
      statusRetired: emp?.status_retired || 0,
      statusStudent: emp?.status_student || 0,
      statusCaregiver: emp?.status_caregiver || 0,
      lossOfIncomeClaim: emp?.loss_of_income_claim || 0,
      // Full-time employer (prefix ft)
      ...mapEmployer(ft, 'ft'),
      // Part-time employer (prefix pt)
      ...mapEmployer(pt, 'pt'),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function upsertEmployment(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // Employment status row
    await conn.query(
      `INSERT INTO case_employment (id, case_id, status_employed, status_self_employed, status_unemployed_26wks, status_written_contract,
        status_ei_benefits, status_unemployed, status_retired, status_student, status_caregiver, loss_of_income_claim)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        status_employed=VALUES(status_employed), status_self_employed=VALUES(status_self_employed),
        status_unemployed_26wks=VALUES(status_unemployed_26wks), status_written_contract=VALUES(status_written_contract),
        status_ei_benefits=VALUES(status_ei_benefits), status_unemployed=VALUES(status_unemployed),
        status_retired=VALUES(status_retired), status_student=VALUES(status_student),
        status_caregiver=VALUES(status_caregiver), loss_of_income_claim=VALUES(loss_of_income_claim)`,
      [caseId, b.statusEmployed?1:0, b.statusSelfEmployed?1:0, b.statusUnemployed26wks?1:0, b.statusWrittenContract?1:0,
       b.statusEiBenefits?1:0, b.statusUnemployed?1:0, b.statusRetired?1:0, b.statusStudent?1:0,
       b.statusCaregiver?1:0, b.lossOfIncomeClaim?1:0]
    );

    // Upsert FT employer (order=1) and PT employer (order=2)
    for (const [order, prefix] of [[1, 'ft'], [2, 'pt']] as const) {
      const name = b[`${prefix}Name`];
      await conn.query(
        `INSERT INTO case_employers (id, case_id, employer_order, employer_name, address, city, province, postal_code, contact, phone, fax, phone_other,
          job_desc, job_title, salary_wages, hours_per_week, ext_health, health_ins_name, health_policy_no, std_benefits, ltd_benefits)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
          employer_name=VALUES(employer_name), address=VALUES(address), city=VALUES(city), province=VALUES(province),
          postal_code=VALUES(postal_code), contact=VALUES(contact), phone=VALUES(phone), fax=VALUES(fax),
          phone_other=VALUES(phone_other), job_desc=VALUES(job_desc), job_title=VALUES(job_title),
          salary_wages=VALUES(salary_wages), hours_per_week=VALUES(hours_per_week), ext_health=VALUES(ext_health),
          health_ins_name=VALUES(health_ins_name), health_policy_no=VALUES(health_policy_no),
          std_benefits=VALUES(std_benefits), ltd_benefits=VALUES(ltd_benefits)`,
        [caseId, order, name||'', b[`${prefix}Address`]||'', b[`${prefix}City`]||'', '', b[`${prefix}Postal`]||'',
         b[`${prefix}Contact`]||'', b[`${prefix}Phone`]||'', b[`${prefix}Fax`]||'', b[`${prefix}PhoneOther`]||'',
         b[`${prefix}JobDesc`]||'', b[`${prefix}JobTitle`]||'', b[`${prefix}Salary`]||0, b[`${prefix}Hours`]||0,
         b[`${prefix}ExtHealth`]||'No', b[`${prefix}HealthInsName`]||'', b[`${prefix}HealthPolicyNo`]||'',
         b[`${prefix}STD`]||'No', b[`${prefix}LTD`]||'No']
      );
    }

    await conn.commit();
    conn.release();

    const getReq = { params: { caseId } } as any;
    await getEmployment(getReq, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
