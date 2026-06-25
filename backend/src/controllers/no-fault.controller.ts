import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// DB columns in case_no_fault:
// id, case_id, mva_company, adjuster_name, adjuster_email, mva_address, mva_city, mva_province,
// mva_postal, mva_phone, mva_fax, mva_supervisor, claim_no, policy_no, named_insured,
// auto_make, auto_model, auto_year, plate_number,
// ind_company, ind_adjuster, ind_address, ind_city, ind_postal, ind_phone, ind_fax, ind_claim_no, ind_supervisor

function mapRow(row: any) {
  if (!row) return {};
  return {
    mvaCompany:    row.mva_company    || '',
    adjusterName:  row.adjuster_name  || '',
    adjusterEmail: row.adjuster_email || '',
    mvaAddress:    row.mva_address    || '',
    mvaCity:       row.mva_city       || '',
    mvaProvince:   row.mva_province   || '',
    mvaPostal:     row.mva_postal     || '',
    mvaPhone:      row.mva_phone      || '',
    mvaFax:        row.mva_fax        || '',
    mvaSupervisor: row.mva_supervisor || '',
    claimNo:       row.claim_no       || '',
    policyNo:      row.policy_no      || '',
    namedInsured:  row.named_insured  || '',
    autoMake:      row.auto_make      || '',
    autoModel:     row.auto_model     || '',
    autoYear:      row.auto_year      || '',
    plateNumber:   row.plate_number   || '',
    indCompany:    row.ind_company    || '',
    indAdjuster:   row.ind_adjuster   || '',
    indAddress:    row.ind_address    || '',
    indCity:       row.ind_city       || '',
    indPostal:     row.ind_postal     || '',
    indPhone:      row.ind_phone      || '',
    indFax:        row.ind_fax        || '',
    indClaimNo:    row.ind_claim_no   || '',
    indSupervisor: row.ind_supervisor || '',
  };
}

// ── GET /api/cases/:caseId/no-fault ──────────────────────────────────────────
export async function getNoFault(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_no_fault WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    const row = Array.isArray(rows) ? rows[0] : null;
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getNoFault]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── POST /api/cases/:caseId/no-fault ─────────────────────────────────────────
export async function upsertNoFault(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  try {
    // Check if record exists
    const [existing] = await pool.query(
      'SELECT id FROM case_no_fault WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    const existingRow = Array.isArray(existing) ? existing[0] : null;

    if (existingRow) {
      await pool.query(
        `UPDATE case_no_fault SET
          mva_company    = ?,
          adjuster_name  = ?,
          adjuster_email = ?,
          mva_address    = ?,
          mva_city       = ?,
          mva_province   = ?,
          mva_postal     = ?,
          mva_phone      = ?,
          mva_fax        = ?,
          mva_supervisor = ?,
          claim_no       = ?,
          policy_no      = ?,
          named_insured  = ?,
          auto_make      = ?,
          auto_model     = ?,
          auto_year      = ?,
          plate_number   = ?,
          ind_company    = ?,
          ind_adjuster   = ?,
          ind_address    = ?,
          ind_city       = ?,
          ind_postal     = ?,
          ind_phone      = ?,
          ind_fax        = ?,
          ind_claim_no   = ?,
          ind_supervisor = ?
        WHERE case_id = ?`,
        [
          b.mvaCompany    || '', b.adjusterName  || '', b.adjusterEmail || '',
          b.mvaAddress    || '', b.mvaCity       || '', b.mvaProvince   || '',
          b.mvaPostal     || '', b.mvaPhone      || '', b.mvaFax        || '',
          b.mvaSupervisor || '', b.claimNo       || '', b.policyNo      || '',
          b.namedInsured  || '', b.autoMake      || '', b.autoModel     || '',
          b.autoYear      || '', b.plateNumber   || '',
          b.indCompany    || '', b.indAdjuster   || '', b.indAddress    || '',
          b.indCity       || '', b.indPostal     || '', b.indPhone      || '',
          b.indFax        || '', b.indClaimNo    || '', b.indSupervisor || '',
          caseId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO case_no_fault
          (id, case_id,
           mva_company, adjuster_name, adjuster_email, mva_address, mva_city, mva_province,
           mva_postal, mva_phone, mva_fax, mva_supervisor,
           claim_no, policy_no, named_insured,
           auto_make, auto_model, auto_year, plate_number,
           ind_company, ind_adjuster, ind_address, ind_city, ind_postal,
           ind_phone, ind_fax, ind_claim_no, ind_supervisor)
         VALUES (?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?)`,
        [
          generateId(), caseId,
          b.mvaCompany    || '', b.adjusterName  || '', b.adjusterEmail || '',
          b.mvaAddress    || '', b.mvaCity       || '', b.mvaProvince   || '',
          b.mvaPostal     || '', b.mvaPhone      || '', b.mvaFax        || '',
          b.mvaSupervisor || '', b.claimNo       || '', b.policyNo      || '',
          b.namedInsured  || '', b.autoMake      || '', b.autoModel     || '',
          b.autoYear      || '', b.plateNumber   || '',
          b.indCompany    || '', b.indAdjuster   || '', b.indAddress    || '',
          b.indCity       || '', b.indPostal     || '', b.indPhone      || '',
          b.indFax        || '', b.indClaimNo    || '', b.indSupervisor || ''
        ]
      );
    }

    await getNoFault(req, res);
  } catch (err) {
    console.error('[upsertNoFault]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
