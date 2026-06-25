import { Request, Response } from 'express';
import pool from '../config/database';

function mapRow(row: any) {
  if (!row) return {};
  return {
    reportedDate:      row.reported_date      ? row.reported_date.toISOString().split('T')[0] : '',
    reportOrdered:     row.report_ordered     || 'No',
    reportOrderedDate: row.report_ordered_date ? row.report_ordered_date.toISOString().split('T')[0] : '',
    policeCentre:      row.police_centre      || '',
    policeOfficer:     row.police_officer     || '',
    badgeNumber:       row.badge_number       || '',
    incidentNo:        row.incident_no        || '',
    division:          row.division           || '',
    address:           row.address            || '',
    city:              row.city               || '',
    provincePC:        row.province_pc        || '',
    requestDate:       row.request_date       ? row.request_date.toISOString().split('T')[0] : '',
    receivedDate:      row.received_date      ? row.received_date.toISOString().split('T')[0] : '',
    phone:             row.phone              || '',
    intersection:      row.intersection       || '',
    timeOfAccident:    row.time_of_accident   || '',
    accidentDescription: row.accident_description || '',
  };
}

// ─── GET /api/cases/:caseId/police-info ──────────────────────────────────────
export async function getPoliceInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [[row]] = await pool.query(
      'SELECT * FROM case_police_info WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getPoliceInfo]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/police-info ─────────────────────────────────────
export async function savePoliceInfo(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_police_info
        (id, case_id, reported_date, report_ordered, report_ordered_date,
         police_centre, police_officer, badge_number, incident_no, division,
         address, city, province_pc, request_date, received_date,
         phone, intersection, time_of_accident, accident_description)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         reported_date=VALUES(reported_date), report_ordered=VALUES(report_ordered),
         report_ordered_date=VALUES(report_ordered_date), police_centre=VALUES(police_centre),
         police_officer=VALUES(police_officer), badge_number=VALUES(badge_number),
         incident_no=VALUES(incident_no), division=VALUES(division),
         address=VALUES(address), city=VALUES(city), province_pc=VALUES(province_pc),
         request_date=VALUES(request_date), received_date=VALUES(received_date),
         phone=VALUES(phone), intersection=VALUES(intersection),
         time_of_accident=VALUES(time_of_accident), accident_description=VALUES(accident_description)`,
      [
        caseId,
        b.reportedDate||null, b.reportOrdered||'No', b.reportOrderedDate||null,
        b.policeCentre||'', b.policeOfficer||'', b.badgeNumber||'',
        b.incidentNo||'', b.division||'', b.address||'', b.city||'', b.provincePC||'',
        b.requestDate||null, b.receivedDate||null,
        b.phone||'', b.intersection||'', b.timeOfAccident||'', b.accidentDescription||''
      ]
    );

    await getPoliceInfo(req, res);
  } catch (err) {
    console.error('[savePoliceInfo]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
