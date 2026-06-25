import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── GET /api/cases/:caseId/client-info ───────────────────────────────────────
// Reads from: case_client_id_docs, case_settlement, case_related_contacts
export async function getClientInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    // 1. Identification docs
    const [idRows] = await pool.query(
      'SELECT * FROM case_client_id_docs WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const id = Array.isArray(idRows) ? idRows[0] : null;

    // 2. Settlement
    const [setRows] = await pool.query(
      'SELECT * FROM case_settlement WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const s = Array.isArray(setRows) ? setRows[0] : null;

    // 3. Related contacts — hk, carg, atc rows
    const [contactRows] = await pool.query(
      'SELECT * FROM case_related_contacts WHERE case_id = ?',
      [caseId]
    ) as any[];
    const contacts = Array.isArray(contactRows) ? contactRows : [];
    const hk   = contacts.find((r: any) => r.contact_type === 'hk')   || {};
    const carg = contacts.find((r: any) => r.contact_type === 'carg') || {};
    const atc  = contacts.find((r: any) => r.contact_type === 'atc')  || {};

    // 4. Children — stored as child1_name/child1_dob ... child6_name/child6_dob in case_client_id_docs
    const children: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      children[`child${i}Name`] = id?.[`child${i}_name`] || '';
      children[`child${i}DOB`]  = id?.[`child${i}_dob`]  || '';
    }

    // Compute read-only fields
    const fs     = parseFloat(s?.final_settlement      || '0') || 0;
    const fee    = parseFloat(s?.our_fee               || '0') || 0;
    const rehab  = parseFloat(s?.rehab_outstanding      || '0') || 0;
    const assess = parseFloat(s?.assessment_outstanding || '0') || 0;
    const o3     = parseFloat(s?.outstanding3           || '0') || 0;
    const o4     = parseFloat(s?.outstanding4           || '0') || 0;
    const hst    = parseFloat(s?.hst                   || '0') || 0;
    const feeHst = parseFloat(s?.our_fee_hst           || '0') || 0;
    const payToClient    = fs - (fee + rehab + assess + o3 + o4 + hst + feeHst);
    const ourFinalAccount = fee + feeHst;

    res.json({
      // Identification
      driverLicense: id?.driver_license || '',
      ohipNumber:    id?.ohip_number    || '',
      sinNumber:     id?.sin_number     || '',
      citizenId:     id?.citizen_id     || '',
      prCardNo:      id?.pr_card_no     || '',
      passportNo:    id?.passport_no    || '',
      // Children
      ...children,
      // Settlement
      finalSettlement:       String(s?.final_settlement       || '0'),
      ourFee:                String(s?.our_fee                || '0'),
      rehabOutstanding:      String(s?.rehab_outstanding       || '0'),
      assessmentOutstanding: String(s?.assessment_outstanding  || '0'),
      outstanding3:          String(s?.outstanding3            || '0'),
      outstanding4:          String(s?.outstanding4            || '0'),
      hst:                   String(s?.hst                    || '0'),
      ourFeeHst:             String(s?.our_fee_hst            || '0'),
      payToClient:           String(payToClient.toFixed(2)),
      ourFinalAccount:       String(ourFinalAccount.toFixed(2)),
      // Related Contacts
      hkName:     hk.name      || '', hkAddress: hk.address   || '',
      hkCity:     hk.city      || '', hkPostCode: hk.post_code || '',
      hkPhone:    hk.phone     || '',
      cargName:   carg.name    || '', cargAddress: carg.address  || '',
      cargCity:   carg.city    || '', cargPostCode: carg.post_code || '',
      cargPhone:  carg.phone   || '',
      atcName:    atc.name     || '', atcAddress: atc.address   || '',
      atcCity:    atc.city     || '', atcPostCode: atc.post_code || '',
      atcPhone:   atc.phone    || '',
    });
  } catch (err) {
    console.error('[getClientInfo]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/client-info ──────────────────────────────────────
export async function saveClientInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  const conn = await (pool as any).getConnection();

  const safeNum = (v: any) => {
    const n = parseFloat(String(v || '0'));
    return isNaN(n) ? 0 : n;
  };
  const safeDate = (v: any) => (v && String(v).trim() !== '' ? v : null);

  try {
    await conn.beginTransaction();

    // ── 1. case_client_id_docs ──────────────────────────────────────────────
    const [existId] = await conn.query(
      'SELECT id FROM case_client_id_docs WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasId = Array.isArray(existId) && existId.length > 0;

    // Build children columns dynamically
    const childCols = [];
    const childVals = [];
    const childSets = [];
    for (let i = 1; i <= 6; i++) {
      childCols.push(`child${i}_name`, `child${i}_dob`);
      childVals.push(b[`child${i}Name`] || '', safeDate(b[`child${i}DOB`]));
      childSets.push(`child${i}_name=VALUES(child${i}_name)`, `child${i}_dob=VALUES(child${i}_dob)`);
    }

    if (hasId) {
      await conn.query(
        `UPDATE case_client_id_docs SET
          driver_license=?, ohip_number=?, sin_number=?, citizen_id=?, pr_card_no=?, passport_no=?,
          child1_name=?, child1_dob=?, child2_name=?, child2_dob=?,
          child3_name=?, child3_dob=?, child4_name=?, child4_dob=?,
          child5_name=?, child5_dob=?, child6_name=?, child6_dob=?
         WHERE case_id=?`,
        [
          b.driverLicense||'', b.ohipNumber||'', b.sinNumber||'',
          b.citizenId||'', b.prCardNo||'', b.passportNo||'',
          b.child1Name||'', safeDate(b.child1DOB),
          b.child2Name||'', safeDate(b.child2DOB),
          b.child3Name||'', safeDate(b.child3DOB),
          b.child4Name||'', safeDate(b.child4DOB),
          b.child5Name||'', safeDate(b.child5DOB),
          b.child6Name||'', safeDate(b.child6DOB),
          caseId
        ]
      );
    } else {
      await conn.query(
        `INSERT INTO case_client_id_docs
          (id, case_id, driver_license, ohip_number, sin_number, citizen_id, pr_card_no, passport_no,
           child1_name, child1_dob, child2_name, child2_dob,
           child3_name, child3_dob, child4_name, child4_dob,
           child5_name, child5_dob, child6_name, child6_dob)
         VALUES (?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?,?)`,
        [
          generateId(), caseId,
          b.driverLicense||'', b.ohipNumber||'', b.sinNumber||'',
          b.citizenId||'', b.prCardNo||'', b.passportNo||'',
          b.child1Name||'', safeDate(b.child1DOB),
          b.child2Name||'', safeDate(b.child2DOB),
          b.child3Name||'', safeDate(b.child3DOB),
          b.child4Name||'', safeDate(b.child4DOB),
          b.child5Name||'', safeDate(b.child5DOB),
          b.child6Name||'', safeDate(b.child6DOB),
        ]
      );
    }

    // ── 2. case_settlement ──────────────────────────────────────────────────
    const fs     = safeNum(b.finalSettlement);
    const fee    = safeNum(b.ourFee);
    const rehab  = safeNum(b.rehabOutstanding);
    const assess = safeNum(b.assessmentOutstanding);
    const o3     = safeNum(b.outstanding3);
    const o4     = safeNum(b.outstanding4);
    const hst    = safeNum(b.hst);
    const feeHst = safeNum(b.ourFeeHst);
    const payToClient    = fs - (fee + rehab + assess + o3 + o4 + hst + feeHst);
    const ourFinalAccount = fee + feeHst;

    const [existSet] = await conn.query(
      'SELECT id FROM case_settlement WHERE case_id = ? LIMIT 1', [caseId]
    );
    const hasSet = Array.isArray(existSet) && existSet.length > 0;

    if (hasSet) {
      await conn.query(
        `UPDATE case_settlement SET
          final_settlement=?, our_fee=?, rehab_outstanding=?, assessment_outstanding=?,
          outstanding3=?, outstanding4=?, hst=?, our_fee_hst=?,
          pay_to_client=?, our_final_account=?
         WHERE case_id=?`,
        [fs, fee, rehab, assess, o3, o4, hst, feeHst, payToClient, ourFinalAccount, caseId]
      );
    } else {
      await conn.query(
        `INSERT INTO case_settlement
          (id, case_id, final_settlement, our_fee, rehab_outstanding, assessment_outstanding,
           outstanding3, outstanding4, hst, our_fee_hst, pay_to_client, our_final_account)
         VALUES (?,?, ?,?,?,?, ?,?,?,?, ?,?)`,
        [generateId(), caseId, fs, fee, rehab, assess, o3, o4, hst, feeHst, payToClient, ourFinalAccount]
      );
    }

    // ── 3. case_related_contacts — delete & re-insert 3 rows ───────────────
    await conn.query('DELETE FROM case_related_contacts WHERE case_id = ?', [caseId]);
    for (const type of ['hk', 'carg', 'atc'] as const) {
      const p = type;
      const name = b[`${p}Name`] || '';
      // Only insert if at least name is provided
      if (!name && !b[`${p}Phone`]) continue;
      await conn.query(
        `INSERT INTO case_related_contacts (id, case_id, contact_type, name, address, city, post_code, phone)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          generateId(), caseId, type,
          b[`${p}Name`]     || '',
          b[`${p}Address`]  || '',
          b[`${p}City`]     || '',
          b[`${p}PostCode`] || '',
          b[`${p}Phone`]    || '',
        ]
      );
    }

    await conn.commit();
    conn.release();
    await getClientInfo(req, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('[saveClientInfo]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
