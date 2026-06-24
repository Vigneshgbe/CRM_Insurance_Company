import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

export async function getHistoryByCaseId(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_history WHERE case_id = ? ORDER BY date DESC, time DESC',
      [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(row => ({
      id: row.id, caseId: row.case_id,
      date: formatDate(row.date) || '', time: row.time || '',
      user: row.user || '', action: row.action || '',
      fieldChanged: row.field_changed || '', oldValue: row.old_value || '', newValue: row.new_value || '',
    })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getStatusHistoryByCaseId(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM status_history WHERE case_id = ? ORDER BY date DESC',
      [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(row => ({
      id: row.id, caseId: row.case_id,
      status: row.status || '', date: formatDate(row.date) || '', changedBy: row.changed_by || '',
    })));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
