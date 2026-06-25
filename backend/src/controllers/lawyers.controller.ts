import { Request, Response } from 'express';
import pool from '../config/database';

function mapLawyer(row: any, prefix: string): Record<string, string> {
  if (!row) return {};
  return {
    [`${prefix}Firm`]:    row.firm_name    || '',
    [`${prefix}Address`]: row.address      || '',
    [`${prefix}City`]:    row.city         || '',
    [`${prefix}Postal`]:  row.postal_code  || '',
    [`${prefix}Lawyer`]:  row.lawyer_name  || '',
    [`${prefix}Phone`]:   row.phone        || '',
    [`${prefix}Fax`]:     row.fax          || '',
    [`${prefix}Ext`]:     row.ext          || '',
  };
}

// ─── GET /api/cases/:caseId/lawyers ─────────────────────────────────────────
export async function getLawyers(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_lawyers WHERE case_id = ?',
      [caseId]
    ) as any[];

    const lawyerRows = rows as any[];
    const our  = lawyerRows.find((r: any) => r.lawyer_type === 'our');
    const prev = lawyerRows.find((r: any) => r.lawyer_type === 'previous');
    const trans = lawyerRows.find((r: any) => r.lawyer_type === 'transferred');

    res.json({
      ...mapLawyer(our,   'our'),
      ...mapLawyer(prev,  'prev'),
      ...mapLawyer(trans, 'trans'),
    });
  } catch (err) {
    console.error('[getLawyers]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/lawyers ────────────────────────────────────────
export async function saveLawyers(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  const types = [
    { type: 'our',         prefix: 'our'   },
    { type: 'previous',    prefix: 'prev'  },
    { type: 'transferred', prefix: 'trans' },
  ];

  try {
    for (const { type, prefix: p } of types) {
      await pool.query(
        `INSERT INTO case_lawyers
          (id, case_id, lawyer_type, firm_name, address, city, postal_code,
           lawyer_name, phone, fax, ext)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           firm_name=VALUES(firm_name), address=VALUES(address), city=VALUES(city),
           postal_code=VALUES(postal_code), lawyer_name=VALUES(lawyer_name),
           phone=VALUES(phone), fax=VALUES(fax), ext=VALUES(ext)`,
        [
          caseId, type,
          b[`${p}Firm`]    || '', b[`${p}Address`] || '', b[`${p}City`]   || '',
          b[`${p}Postal`]  || '', b[`${p}Lawyer`]  || '',
          b[`${p}Phone`]   || '', b[`${p}Fax`]     || '', b[`${p}Ext`]    || ''
        ]
      );
    }

    await getLawyers(req, res);
  } catch (err) {
    console.error('[saveLawyers]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
