import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

function mapRow(row: any) {
  if (!row) return {};
  return {
    reportedDate:       row.reported_date       || 'No',
    reportOrdered:      row.report_ordered       || 'No',
    reportOrderedDate:  row.report_ordered_date  || '',
    policeCentre:       row.police_centre        || '',
    policeOfficer:      row.police_officer       || '',
    badgeNumber:        row.badge_number         || '',
    incidentNo:         row.incident_no          || '',
    division:           row.division             || '',
    address:            row.address              || '',
    city:               row.city                 || '',
    provincePC:         row.province_pc          || '',
    requestDate:        row.request_date         || '',
    receivedDate:       row.received_date        || '',
    phone:              row.phone                || '',
    intersection:       row.intersection         || '',
    timeOfAccident:     row.time_of_accident     || '',
    accidentDescription: row.accident_description || '',
  };
}

// ── GET /api/cases/:caseId/police-info ────────────────────────────────────────
export async function getPoliceInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_police_info WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getPoliceInfo]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/police-info ───────────────────────────────────────
export async function savePoliceInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  const safeDate = (v: any) => (v && String(v).trim() !== '' ? v : null);

  try {
    const [existing] = await pool.query(
      'SELECT id FROM case_police_info WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const existingRow = Array.isArray(existing) ? existing[0] : null;

    if (existingRow) {
      await pool.query(
        `UPDATE case_police_info SET
          reported_date        = ?,
          report_ordered       = ?,
          report_ordered_date  = ?,
          police_centre        = ?,
          police_officer       = ?,
          badge_number         = ?,
          incident_no          = ?,
          division             = ?,
          address              = ?,
          city                 = ?,
          province_pc          = ?,
          request_date         = ?,
          received_date        = ?,
          phone                = ?,
          intersection         = ?,
          time_of_accident     = ?,
          accident_description = ?
        WHERE case_id = ?`,
        [
          b.reportedDate      || 'No',
          b.reportOrdered     || 'No',
          safeDate(b.reportOrderedDate),
          b.policeCentre      || '',
          b.policeOfficer     || '',
          b.badgeNumber       || '',
          b.incidentNo        || '',
          b.division          || '',
          b.address           || '',
          b.city              || '',
          b.provincePC        || '',
          safeDate(b.requestDate),
          safeDate(b.receivedDate),
          b.phone             || '',
          b.intersection      || '',
          b.timeOfAccident    || '',
          b.accidentDescription || '',
          caseId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO case_police_info
          (id, case_id,
           reported_date, report_ordered, report_ordered_date,
           police_centre, police_officer, badge_number, incident_no, division,
           address, city, province_pc,
           request_date, received_date,
           phone, intersection, time_of_accident, accident_description)
         VALUES (?,?, ?,?,?, ?,?,?,?,?, ?,?,?, ?,?, ?,?,?,?)`,
        [
          generateId(), caseId,
          b.reportedDate      || 'No',
          b.reportOrdered     || 'No',
          safeDate(b.reportOrderedDate),
          b.policeCentre      || '',
          b.policeOfficer     || '',
          b.badgeNumber       || '',
          b.incidentNo        || '',
          b.division          || '',
          b.address           || '',
          b.city              || '',
          b.provincePC        || '',
          safeDate(b.requestDate),
          safeDate(b.receivedDate),
          b.phone             || '',
          b.intersection      || '',
          b.timeOfAccident    || '',
          b.accidentDescription || ''
        ]
      );
    }

    await getPoliceInfo(req, res);
  } catch (err) {
    console.error('[savePoliceInfo]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
