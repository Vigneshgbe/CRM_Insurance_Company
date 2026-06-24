import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';

function mapNote(row: any) {
  return {
    id: row.id,
    caseId: row.case_id,
    date: formatDate(row.date) || '',
    time: row.time || '',
    author: row.author || row.record_manager || '',
    text: row.text || row.details || '',
  };
}

export async function getNotesByCaseId(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM activities WHERE case_id = ? AND type = 'Note' ORDER BY date DESC, time DESC`,
      [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(mapNote));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  const { date, time, author, text } = req.body;
  const caseId = req.params.caseId;
  const realAuthor = author || (req as any).user?.name || 'System';
  try {
    const id = generateId();
    await pool.query(
      `INSERT INTO activities (id, case_id, date, time, type, regarding, details, author, text, record_manager, company_group)
       VALUES (?,?,?,?,'Note','Note',?,?,?,?,'Internal')`,
      [id, caseId, date || new Date().toISOString().slice(0,10), time||'', text||'', realAuthor, text||'', realAuthor]
    );
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [id]) as any[];
    res.status(201).json(mapNote((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  const { date, time, author, text } = req.body;
  try {
    await pool.query(
      `UPDATE activities SET date=?, time=?, author=?, text=?, details=?, record_manager=? WHERE id=? AND type='Note'`,
      [date, time, author, text, text, author, req.params.noteId]
    );
    const [rows] = await pool.query('SELECT * FROM activities WHERE id = ?', [req.params.noteId]) as any[];
    res.json(mapNote((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    await pool.query(`DELETE FROM activities WHERE id = ? AND type = 'Note'`, [req.params.noteId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
