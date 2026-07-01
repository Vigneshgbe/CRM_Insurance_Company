import { Request, Response } from 'express';
import pool from '../config/database';

// ── existing ────────────────────────────────────────────────────────────────

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [[total]]       = await pool.query('SELECT COUNT(*) as cnt FROM cases') as any[];
    const [[active]]      = await pool.query(`SELECT COUNT(*) as cnt FROM cases WHERE file_status = 'Active'`) as any[];
    const [[thisMonth]]   = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE MONTH(open_date) = MONTH(NOW()) AND YEAR(open_date) = YEAR(NOW())`
    ) as any[];
    const [[pending]]     = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE file_status IN ('Pending','Settled')`
    ) as any[];

    // vs-last-month deltas
    const [[lastTotal]]   = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE open_date < DATE_FORMAT(NOW(),'%Y-%m-01')`
    ) as any[];
    const [[lastActive]]  = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE file_status = 'Active'
       AND open_date < DATE_FORMAT(NOW(),'%Y-%m-01')`
    ) as any[];
    const [[lastMonth]]   = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases
       WHERE MONTH(open_date) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
         AND YEAR(open_date)  = YEAR(DATE_SUB(NOW(),  INTERVAL 1 MONTH))`
    ) as any[];
    const [[lastPending]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM cases WHERE file_status IN ('Pending','Settled')
       AND open_date < DATE_FORMAT(NOW(),'%Y-%m-01')`
    ) as any[];

    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    res.json({
      totalCases:         total.cnt,
      activeCases:        active.cnt,
      casesThisMonth:     thisMonth.cnt,
      settlementsPending: pending.cnt,
      vsLastMonth: {
        totalCases:         pct(total.cnt,   lastTotal.cnt),
        activeCases:        pct(active.cnt,  lastActive.cnt),
        casesThisMonth:     pct(thisMonth.cnt, lastMonth.cnt),
        settlementsPending: pct(pending.cnt, lastPending.cnt),
      },
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

export async function getRecentActivities(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.type, a.regarding, a.date, a.record_manager,
              ca.file_no, cl.first_name, cl.last_name
       FROM activities a
       LEFT JOIN cases ca ON a.case_id = ca.id
       LEFT JOIN clients cl ON ca.client_id = cl.id
       ORDER BY a.date DESC, a.created_at DESC LIMIT 10`
    ) as any[];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

// ── NEW ──────────────────────────────────────────────────────────────────────

/** Donut chart: count per file_status across all non-closed cases */
export async function getCaseStatusBreakdown(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT file_status as status, CAST(COUNT(*) AS UNSIGNED) as count
       FROM cases
       GROUP BY file_status
       ORDER BY count DESC`
    ) as any[];
    // Ensure count is always a JS number, not BigInt
    const safe = (rows as any[]).map(r => ({ status: r.status, count: Number(r.count) }));
    res.json(safe);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

/** Line chart: new cases opened per day for the last 14 days */
export async function getCaseStatusTrend(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      `SELECT DATE(open_date) as date, CAST(COUNT(*) AS UNSIGNED) as count
       FROM cases
       WHERE open_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(open_date)
       ORDER BY date ASC`
    ) as any[];

    // Fill missing days with 0 so the chart line is continuous
    const map: Record<string, number> = {};
    (rows as any[]).forEach((r: any) => {
      const key = r.date instanceof Date
        ? r.date.toISOString().slice(0, 10)
        : String(r.date).slice(0, 10);
      map[key] = Number(r.count);
    });
    const result = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map[key] ?? 0 });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}