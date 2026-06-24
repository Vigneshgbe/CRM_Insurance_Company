import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';

function mapContact(row: any) {
  return {
    id: row.id,
    caseId: row.case_id,
    name: row.name || '',
    role: row.role || '',
    accessLevel: row.access_level || 'Read Only',
    dateAdded: formatDate(row.date_added) || '',
  };
}

export async function getContactAccess(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_contact_access WHERE case_id = ? ORDER BY date_added DESC', [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(mapContact));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createContactAccess(req: Request, res: Response): Promise<void> {
  const { name, role, accessLevel, dateAdded } = req.body;
  const caseId = req.params.caseId;
  try {
    const id = generateId();
    await pool.query(
      'INSERT INTO case_contact_access (id, case_id, name, role, access_level, date_added) VALUES (?,?,?,?,?,?)',
      [id, caseId, name||'', role||'', accessLevel||'Read Only', dateAdded||new Date().toISOString().slice(0,10)]
    );
    const [rows] = await pool.query('SELECT * FROM case_contact_access WHERE id = ?', [id]) as any[];
    res.status(201).json(mapContact((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function deleteContactAccess(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM case_contact_access WHERE id = ?', [req.params.contactId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
