import { Request, Response } from 'express';
import pool from '../config/database';

function mapRow(row: any) {
  if (!row) return {};
  return {
    mvaCompany: row.mva_company || '',
    adjusterName: row.adjuster_name || '',
    adjusterEmail: row.adjuster_email || '',
    mvaAddress: row.mva_address || '',
    mvaCity: row.mva_city || '',
    mvaProvince: row.mva_province || '',
    mvaPostal: row.mva_postal || '',
    mvaPhone: row.mva_phone || '',
    mvaFax: row.mva_fax || '',
    mvaSupervisor: row.mva_supervisor || '',
    claimNo: row.claim_no || '',
    policyNo: row.policy_no || '',
    namedInsured: row.named_insured || '',
    autoMake: row.auto_make || '',
    autoModel: row.auto_model || '',
    autoYear: row.auto_year || '',
    plateNumber: row.plate_number || '',
    indCompany: row.ind_company || '',
    indAdjuster: row.ind_adjuster || '',
    indAddress: row.ind_address || '',
    indCity: row.ind_city || '',
    indPostal: row.ind_postal || '',
    indPhone: row.ind_phone || '',
    indFax: row.ind_fax || '',
    indClaimNo: row.ind_claim_no || '',
    indSupervisor: row.ind_supervisor || '',
  };
}

export async function getNoFault(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_no_fault WHERE case_id = ?', [req.params.caseId]) as any[];
    res.json(mapRow((rows as any[])[0]));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function upsertNoFault(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_no_fault (id, case_id, mva_company, adjuster_name, adjuster_email, mva_address, mva_city, mva_province,
        mva_postal, mva_phone, mva_fax, mva_supervisor, claim_no, policy_no, named_insured, auto_make, auto_model, auto_year,
        plate_number, ind_company, ind_adjuster, ind_address, ind_city, ind_postal, ind_phone, ind_fax, ind_claim_no, ind_supervisor)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        mva_company=VALUES(mva_company), adjuster_name=VALUES(adjuster_name), adjuster_email=VALUES(adjuster_email),
        mva_address=VALUES(mva_address), mva_city=VALUES(mva_city), mva_province=VALUES(mva_province),
        mva_postal=VALUES(mva_postal), mva_phone=VALUES(mva_phone), mva_fax=VALUES(mva_fax), mva_supervisor=VALUES(mva_supervisor),
        claim_no=VALUES(claim_no), policy_no=VALUES(policy_no), named_insured=VALUES(named_insured),
        auto_make=VALUES(auto_make), auto_model=VALUES(auto_model), auto_year=VALUES(auto_year), plate_number=VALUES(plate_number),
        ind_company=VALUES(ind_company), ind_adjuster=VALUES(ind_adjuster), ind_address=VALUES(ind_address),
        ind_city=VALUES(ind_city), ind_postal=VALUES(ind_postal), ind_phone=VALUES(ind_phone), ind_fax=VALUES(ind_fax),
        ind_claim_no=VALUES(ind_claim_no), ind_supervisor=VALUES(ind_supervisor)`,
      [caseId, b.mvaCompany||'', b.adjusterName||'', b.adjusterEmail||'', b.mvaAddress||'', b.mvaCity||'', b.mvaProvince||'',
       b.mvaPostal||'', b.mvaPhone||'', b.mvaFax||'', b.mvaSupervisor||'', b.claimNo||'', b.policyNo||'', b.namedInsured||'',
       b.autoMake||'', b.autoModel||'', b.autoYear||'', b.plateNumber||'',
       b.indCompany||'', b.indAdjuster||'', b.indAddress||'', b.indCity||'', b.indPostal||'',
       b.indPhone||'', b.indFax||'', b.indClaimNo||'', b.indSupervisor||'']
    );
    const [rows] = await pool.query('SELECT * FROM case_no_fault WHERE case_id = ?', [caseId]) as any[];
    res.json(mapRow((rows as any[])[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
