import { Request, Response } from 'express';
import pool from '../config/database';

function mapRow(row: any) {
  if (!row) return {};
  return {
    company:   row.company   || '',
    address:   row.address   || '',
    city:      row.city      || '',
    province:  row.province  || '',
    postCode:  row.post_code || '',
    phone:     row.phone     || '',
    fax:       row.fax       || '',
  };
}

// ─── GET /api/cases/:caseId/specialist ──────────────────────────────────────
export async function getSpecialist(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [[row]] = await pool.query(
      'SELECT * FROM case_specialist WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getSpecialist]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/specialist ─────────────────────────────────────
export async function saveSpecialist(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_specialist (id, case_id, company, address, city, province, post_code, phone, fax)
       VALUES (UUID(),?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         company=VALUES(company), address=VALUES(address), city=VALUES(city),
         province=VALUES(province), post_code=VALUES(post_code),
         phone=VALUES(phone), fax=VALUES(fax)`,
      [
        caseId,
        b.company||'', b.address||'', b.city||'',
        b.province||'', b.postCode||'', b.phone||'', b.fax||''
      ]
    );
    await getSpecialist(req, res);
  } catch (err) {
    console.error('[saveSpecialist]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
