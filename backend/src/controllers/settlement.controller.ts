import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

function mapSettlement(row: any) {
  return {
    finalSettlement: parseFloat(row.final_settlement) || 0,
    ourFee: parseFloat(row.our_fee) || 0,
    rehabOutstanding: parseFloat(row.rehab_outstanding) || 0,
    assessmentOutstanding: parseFloat(row.assessment_outstanding) || 0,
    outstanding3: parseFloat(row.outstanding3) || 0,
    outstanding4: parseFloat(row.outstanding4) || 0,
    hst: parseFloat(row.hst) || 0,
    ourFeeHst: parseFloat(row.our_fee_hst) || 0,
    payToClient: parseFloat(row.pay_to_client) || 0,
    ourFinalAccount: parseFloat(row.our_final_account) || 0,
    settlementDate: row.settlement_date || '',
    notes: row.notes || '',
  };
}

const defaultSettlement = {
  finalSettlement:0, ourFee:0, rehabOutstanding:0, assessmentOutstanding:0,
  outstanding3:0, outstanding4:0, hst:0, ourFeeHst:0, payToClient:0, ourFinalAccount:0,
  settlementDate:'', notes:'',
};

export async function getSettlement(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_settlement WHERE case_id = ?', [req.params.caseId]) as any[];
    res.json((rows as any[])[0] ? mapSettlement((rows as any[])[0]) : defaultSettlement);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertSettlement(req: Request, res: Response): Promise<void> {
  const { finalSettlement, ourFee, rehabOutstanding, assessmentOutstanding, outstanding3, outstanding4,
    hst, ourFeeHst, payToClient, ourFinalAccount, settlementDate, notes } = req.body;
  const caseId = req.params.caseId;
  try {
    await pool.query(
      `INSERT INTO case_settlement (id, case_id, final_settlement, our_fee, rehab_outstanding,
        assessment_outstanding, outstanding3, outstanding4, hst, our_fee_hst, pay_to_client,
        our_final_account, settlement_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        final_settlement=VALUES(final_settlement), our_fee=VALUES(our_fee),
        rehab_outstanding=VALUES(rehab_outstanding), assessment_outstanding=VALUES(assessment_outstanding),
        outstanding3=VALUES(outstanding3), outstanding4=VALUES(outstanding4), hst=VALUES(hst),
        our_fee_hst=VALUES(our_fee_hst), pay_to_client=VALUES(pay_to_client),
        our_final_account=VALUES(our_final_account), settlement_date=VALUES(settlement_date), notes=VALUES(notes)`,
      [generateId(), caseId, finalSettlement||0, ourFee||0, rehabOutstanding||0, assessmentOutstanding||0,
       outstanding3||0, outstanding4||0, hst||0, ourFeeHst||0, payToClient||0, ourFinalAccount||0,
       settlementDate||null, notes||'']
    );
    const [rows] = await pool.query('SELECT * FROM case_settlement WHERE case_id = ?', [caseId]) as any[];
    res.json(mapSettlement((rows as any[])[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}
