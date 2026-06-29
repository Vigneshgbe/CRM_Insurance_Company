import { Request, Response } from 'express';
import pool from '../config/database';

function mapEmployer(row: any, prefix: string): Record<string, string> {
  if (!row) return {};
  return {
    [`${prefix}Name`]:          row.employer_name  || '',
    [`${prefix}Address`]:       row.address        || '',
    [`${prefix}City`]:          row.city           || '',
    [`${prefix}Postal`]:        row.postal_code    || '',
    [`${prefix}Contact`]:       row.contact        || '',
    [`${prefix}Phone`]:         row.phone          || '',
    [`${prefix}Fax`]:           row.fax            || '',
    [`${prefix}PhoneOther`]:    row.phone_other    || '',
    [`${prefix}JobDesc`]:       row.job_desc       || '',
    [`${prefix}JobTitle`]:      row.job_title      || '',
    [`${prefix}Salary`]:        row.salary_wages   || '',
    [`${prefix}Hours`]:         row.hours_per_week || '',
    [`${prefix}ExtHealth`]:     row.ext_health     || 'No',
    [`${prefix}HealthInsName`]: row.health_ins_name  || '',
    [`${prefix}HealthPolicyNo`]: row.health_policy_no || '',
    [`${prefix}STD`]:           row.std_benefits   || 'No',
    [`${prefix}LTD`]:           row.ltd_benefits   || 'No',
  };
}

// ─── GET /api/cases/:caseId/employment ──────────────────────────────────────
export async function getEmployment(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_employers WHERE case_id = ? ORDER BY employer_order ASC',
      [caseId]
    ) as any[];

    const empRows = rows as any[];
    const ft = empRows.find((r: any) => r.employer_order === 1);
    const pt = empRows.find((r: any) => r.employer_order === 2);

    // employment_type from case_employment table
    const [[empMain]] = await pool.query(
      'SELECT * FROM case_employment WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    res.json({
      employmentType: empMain?.employment_type || '',
      ...mapEmployer(ft, 'ft'),
      ...mapEmployer(pt, 'pt'),
    });
  } catch (err) {
    console.error('[getEmployment]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/employment ─────────────────────────────────────
export async function saveEmployment(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // Main employment record — save employment_type AND all status checkbox columns
    // status_* columns populated by EmploymentTab checkboxes in the future;
    // for now write 0 if not supplied so the row exists for prefill
    await conn.query(
      `INSERT INTO case_employment
        (id, case_id, employment_type,
         status_employed, status_self_employed, status_unemployed_26wks,
         status_written_contract, status_ei_benefits, status_unemployed,
         status_retired, status_student, status_caregiver, loss_of_income_claim)
       VALUES (UUID(),?,?, ?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         employment_type=VALUES(employment_type),
         status_employed=VALUES(status_employed),
         status_self_employed=VALUES(status_self_employed),
         status_unemployed_26wks=VALUES(status_unemployed_26wks),
         status_written_contract=VALUES(status_written_contract),
         status_ei_benefits=VALUES(status_ei_benefits),
         status_unemployed=VALUES(status_unemployed),
         status_retired=VALUES(status_retired),
         status_student=VALUES(status_student),
         status_caregiver=VALUES(status_caregiver),
         loss_of_income_claim=VALUES(loss_of_income_claim)`,
      [
        caseId, b.employmentType || '',
        b.statusEmployed      ? 1 : 0,
        b.statusSelfEmployed  ? 1 : 0,
        b.statusUnemployed26  ? 1 : 0,
        b.statusContract      ? 1 : 0,
        b.statusEI            ? 1 : 0,
        b.statusUnemployed    ? 1 : 0,
        b.statusRetired       ? 1 : 0,
        b.statusStudent       ? 1 : 0,
        b.statusCaregiver     ? 1 : 0,
        b.lossOfIncome        ? 1 : 0,
      ]
    );

    // Full-time employer (employer_order = 1)
    await conn.query(
      `INSERT INTO case_employers
        (id, case_id, employer_order, employer_name, address, city, postal_code, contact,
         phone, fax, phone_other, job_desc, job_title, salary_wages, hours_per_week,
         ext_health, health_ins_name, health_policy_no, std_benefits, ltd_benefits)
       VALUES (UUID(),?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         employer_name=VALUES(employer_name), address=VALUES(address), city=VALUES(city),
         postal_code=VALUES(postal_code), contact=VALUES(contact), phone=VALUES(phone),
         fax=VALUES(fax), phone_other=VALUES(phone_other), job_desc=VALUES(job_desc),
         job_title=VALUES(job_title), salary_wages=VALUES(salary_wages),
         hours_per_week=VALUES(hours_per_week), ext_health=VALUES(ext_health),
         health_ins_name=VALUES(health_ins_name), health_policy_no=VALUES(health_policy_no),
         std_benefits=VALUES(std_benefits), ltd_benefits=VALUES(ltd_benefits)`,
      [
        caseId,
        b.ftName||'', b.ftAddress||'', b.ftCity||'', b.ftPostal||'', b.ftContact||'',
        b.ftPhone||'', b.ftFax||'', b.ftPhoneOther||'', b.ftJobDesc||'', b.ftJobTitle||'',
        b.ftSalary||'', b.ftHours||'',
        b.ftExtHealth||'No', b.ftHealthInsName||'', b.ftHealthPolicyNo||'',
        b.ftSTD||'No', b.ftLTD||'No'
      ]
    );

    // Part-time employer (employer_order = 2)
    await conn.query(
      `INSERT INTO case_employers
        (id, case_id, employer_order, employer_name, address, city, postal_code, contact,
         phone, fax, phone_other, job_desc, job_title, salary_wages, hours_per_week,
         ext_health, health_ins_name, health_policy_no, std_benefits, ltd_benefits)
       VALUES (UUID(),?,2,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         employer_name=VALUES(employer_name), address=VALUES(address), city=VALUES(city),
         postal_code=VALUES(postal_code), contact=VALUES(contact), phone=VALUES(phone),
         fax=VALUES(fax), phone_other=VALUES(phone_other), job_desc=VALUES(job_desc),
         job_title=VALUES(job_title), salary_wages=VALUES(salary_wages),
         hours_per_week=VALUES(hours_per_week), ext_health=VALUES(ext_health),
         health_ins_name=VALUES(health_ins_name), health_policy_no=VALUES(health_policy_no),
         std_benefits=VALUES(std_benefits), ltd_benefits=VALUES(ltd_benefits)`,
      [
        caseId,
        b.ptName||'', b.ptAddress||'', b.ptCity||'', b.ptPostal||'', b.ptContact||'',
        b.ptPhone||'', b.ptFax||'', b.ptPhoneOther||'', b.ptJobDesc||'', b.ptJobTitle||'',
        b.ptSalary||'', b.ptHours||'',
        b.ptExtHealth||'No', b.ptHealthInsName||'', b.ptHealthPolicyNo||'',
        b.ptSTD||'No', b.ptLTD||'No'
      ]
    );

    await conn.commit();
    conn.release();

    await getEmployment(req, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('[saveEmployment]', err);
    res.status(500).json({ error: 'Server error' });
  }
}