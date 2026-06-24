import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [[total]] = await pool.query('SELECT COUNT(*) as cnt FROM cases') as any[];
    const [[active]] = await pool.query(`SELECT COUNT(*) as cnt FROM cases WHERE file_status = 'Active'`) as any[];
    const [[thisMonth]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE MONTH(open_date) = MONTH(NOW()) AND YEAR(open_date) = YEAR(NOW())`
    ) as any[];
    const [[pending]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE file_status IN ('Pending','Settled')`
    ) as any[];
    res.json({
      totalCases: total.cnt,
      activeCases: active.cnt,
      casesThisMonth: thisMonth.cnt,
      settlementsPending: pending.cnt,
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getUpcomingLimitations(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.limitation_date, ca.file_status,
        cl.first_name, cl.last_name
       FROM cases ca
       LEFT JOIN clients cl ON ca.client_id = cl.id
       WHERE ca.limitation_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         AND ca.file_status NOT IN ('Settled','Closed')
       ORDER BY ca.limitation_date ASC LIMIT 10`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getRecentCases(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT ca.id, ca.file_no, ca.file_status, ca.case_type, ca.date_of_loss,
        ca.limitation_date, ca.clerk_assigned, cl.first_name, cl.last_name
       FROM cases ca
       LEFT JOIN clients cl ON ca.client_id = cl.id
       ORDER BY ca.created_at DESC LIMIT 10`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getReferrers(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM referrers ORDER BY name') as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
