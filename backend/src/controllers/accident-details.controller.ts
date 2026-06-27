import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── DB column → API field mapping ─────────────────────────────────────────────
function mapRow(row: any) {
  if (!row) return {};
  const safeStr  = (v: any) => v != null ? String(v) : '';
  const safeInt  = (v: any) => v != null ? String(v) : '';
  const safeBool = (v: any) => v === 1 || v === true || v === '1';
  return {
    workAccident:           safeStr(row.accident_at_work),
    commuteAccident:        safeStr(row.commute_accident),
    wsibClaim:              safeStr(row.wsib_claim),
    streetName:             safeStr(row.street_name),
    majorIntersection:      safeStr(row.major_intersection),
    city:                   safeStr(row.city),
    provinceState:          safeStr(row.province_state),
    accidentDate:           safeStr(row.accident_date),
    accidentTime:           safeStr(row.accident_time),
    reportedPolice:         safeStr(row.reported_police),
    dateReported:           safeStr(row.date_reported),
    policeDepartment:       safeStr(row.police_department),
    collisionCentre:        safeBool(row.went_collision_centre),
    policeAttended:         safeBool(row.police_attended),
    incidentNo:             safeStr(row.incident_no),
    officer:                safeStr(row.officer_name),
    badgeNo:                safeStr(row.badge_no),
    youCharged:             safeStr(row.client_charged),
    youChargedDesc:         safeStr(row.client_charged_desc),
    thirdPartyCharged:      safeStr(row.third_party_charged),
    thirdPartyChargedDesc:  safeStr(row.third_party_charged_desc),
    anyWitness:             safeStr(row.any_witness),
    witnessName:            safeStr(row.witness_name),
    witnessPhone:           safeStr(row.witness_phone),
    numOccupants:           safeInt(row.num_occupants),
    seatingArrangement:     safeStr(row.seating_arrangement),
    vehiclesInvolved:       safeInt(row.vehicles_involved),
    photosDamage:           safeStr(row.photos_of_damage),
    estimatedDamage:        row.estimated_damage != null ? String(row.estimated_damage) : '',
    ambulanceAttended:      safeBool(row.ambulance_attended),
    wentToHospital:         safeBool(row.went_to_hospital),
    wentToDoctor:           safeBool(row.went_to_doctor),
    accidentDescription:    safeStr(row.accident_description),
    involvement:            safeStr(row.involvement),
  };
}

// ── GET /api/cases/:caseId/accident-details ───────────────────────────────────
export async function getAccidentDetails(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_accident_details WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getAccidentDetails]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── POST /api/cases/:caseId/accident-details ──────────────────────────────────
export async function saveAccidentDetails(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  const safeDate = (v: any) => (v && String(v).trim() !== '' ? v : null);
  const safeTime = (v: any) => (v && String(v).trim() !== '' ? v : null);
  const safeInt  = (v: any) => (v !== '' && v != null ? parseInt(String(v), 10) || null : null);
  const safeDec  = (v: any) => (v !== '' && v != null ? parseFloat(String(v)) || null : null);
  const safeBool = (v: any) => (v === true || v === 'true' || v === 1 || v === '1') ? 1 : 0;

  const values = [
    b.workAccident          || '',
    b.commuteAccident       || '',
    b.wsibClaim             || '',
    b.streetName            || '',
    b.majorIntersection     || '',
    b.city                  || '',
    b.provinceState         || '',
    safeDate(b.accidentDate),
    safeTime(b.accidentTime),
    b.reportedPolice        || '',
    safeDate(b.dateReported),
    b.policeDepartment      || '',
    safeBool(b.collisionCentre),
    safeBool(b.policeAttended),
    b.incidentNo            || '',
    b.officer               || '',
    b.badgeNo               || '',
    b.youCharged            || '',
    b.youChargedDesc        || '',
    b.thirdPartyCharged     || '',
    b.thirdPartyChargedDesc || '',
    b.anyWitness            || '',
    b.witnessName           || '',
    b.witnessPhone          || '',
    safeInt(b.numOccupants),
    b.seatingArrangement    || '',
    safeInt(b.vehiclesInvolved),
    b.photosDamage          || '',
    safeDec(b.estimatedDamage),
    safeBool(b.ambulanceAttended),
    safeBool(b.wentToHospital),
    safeBool(b.wentToDoctor),
    b.accidentDescription   || '',
    b.involvement           || '',
  ];

  try {
    const [existing] = await pool.query(
      'SELECT id FROM case_accident_details WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const existingRow = Array.isArray(existing) ? existing[0] : null;

    if (existingRow) {
      await pool.query(
        `UPDATE case_accident_details SET
          accident_at_work=?,       commute_accident=?,          wsib_claim=?,
          street_name=?,            major_intersection=?,        city=?,
          province_state=?,         accident_date=?,             accident_time=?,
          reported_police=?,        date_reported=?,             police_department=?,
          went_collision_centre=?,  police_attended=?,           incident_no=?,
          officer_name=?,           badge_no=?,
          client_charged=?,         client_charged_desc=?,
          third_party_charged=?,    third_party_charged_desc=?,
          any_witness=?,            witness_name=?,              witness_phone=?,
          num_occupants=?,          seating_arrangement=?,       vehicles_involved=?,
          photos_of_damage=?,       estimated_damage=?,
          ambulance_attended=?,     went_to_hospital=?,          went_to_doctor=?,
          accident_description=?,   involvement=?
        WHERE case_id = ?`,
        [...values, caseId]
      );
    } else {
      await pool.query(
        `INSERT INTO case_accident_details
          (id, case_id,
           accident_at_work, commute_accident, wsib_claim,
           street_name, major_intersection, city, province_state,
           accident_date, accident_time,
           reported_police, date_reported, police_department,
           went_collision_centre, police_attended,
           incident_no, officer_name, badge_no,
           client_charged, client_charged_desc,
           third_party_charged, third_party_charged_desc,
           any_witness, witness_name, witness_phone,
           num_occupants, seating_arrangement, vehicles_involved,
           photos_of_damage, estimated_damage,
           ambulance_attended, went_to_hospital, went_to_doctor,
           accident_description, involvement)
         VALUES (?,?, ?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?, ?,?,?, ?,?, ?,?, ?,?,?, ?,?,?, ?,?, ?,?,?, ?,?)`,
        [generateId(), caseId, ...values]
      );
    }

    // Return saved record
    await getAccidentDetails(req, res);
  } catch (err) {
    console.error('[saveAccidentDetails]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
