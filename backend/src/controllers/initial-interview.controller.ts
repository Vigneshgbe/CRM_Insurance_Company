import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── DB column → API field mapping (42 columns confirmed from phpMyAdmin) ─────
function mapRow(row: any) {
  if (!row) return {};
  return {
    conflictChecked:        row.conflict_checked         || 'No',
    anyConflict:            row.any_conflict             || 'No',
    fileNo:                 row.file_no                  || '',
    dateOfMVA:              row.date_of_mva              || '',
    interviewedBy:          row.interviewed_by           || '',
    interviewedOn:          row.interviewed_on           || '',
    referredBy:             row.referred_by              || '',
    speaksEnglish:          row.speaks_english           || 'Yes',
    interpreterRequired:    row.interpreter_required     || 'No',
    language:               row.language                 || '',
    bornInCanada:           row.born_in_canada           || 'Yes',
    whereBorn:              row.where_born               || '',
    yearImmigrated:         row.year_immigrated          || '',
    clientRole:             row.client_role              || '',
    seatBelted:             row.seat_belted              || 'Yes',
    accidentAtWork:         row.accident_at_work         || 'No',
    wsibFiled:              row.wsib_filed               || 'No',
    streetName:             row.street_name              || '',
    majorIntersection:      row.major_intersection       || '',
    city:                   row.city                     || '',
    province:               row.province                 || '',
    timeOfMVA:              row.time_of_mva              || '',
    policeReported:         row.police_reported          || 'No',
    dateReported:           row.date_reported            || '',
    policeCameToScene:      row.police_came_to_scene     || 'No',
    policeDepartment:       row.police_department        || '',
    incidentNo:             row.incident_no              || '',
    officerName:            row.officer_name             || '',
    badgeNo:                row.badge_no                 || '',
    clientCharged:          row.client_charged           || 'No',
    clientChargedDesc:      row.client_charged_desc      || '',
    thirdPartyCharged:      row.third_party_charged      || 'No',
    thirdPartyChargedDesc:  row.third_party_charged_desc || '',
    numOccupants:           row.num_occupants != null ? String(row.num_occupants) : '',
    seatingArrangement:     row.seating_arrangement      || '',
    photosOfDamage:         row.photos_of_damage         || 'No',
    estimatedDamage:        row.estimated_damage != null ? String(row.estimated_damage) : '',
    accidentDescription:    row.accident_description     || '',
  };
}

// ── GET /api/cases/:caseId/initial-interview ──────────────────────────────────
export async function getInitialInterview(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_initial_interview WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    const row = Array.isArray(rows) ? rows[0] : null;
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getInitialInterview]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── POST /api/cases/:caseId/initial-interview ─────────────────────────────────
export async function saveInitialInterview(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  // Safe coerce for int column num_occupants — empty string → null
  const numOccupants = b.numOccupants !== '' && b.numOccupants != null
    ? parseInt(String(b.numOccupants), 10) || null
    : null;

  // Safe coerce for decimal column estimated_damage
  const estimatedDamage = b.estimatedDamage !== '' && b.estimatedDamage != null
    ? parseFloat(String(b.estimatedDamage)) || null
    : null;

  // Safe date — empty string → null for DATE columns
  const safeDate = (v: any) => (v && String(v).trim() !== '' ? v : null);

  try {
    // Check if record exists for this case_id
    const [existing] = await pool.query(
      'SELECT id FROM case_initial_interview WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];

    const existingRow = Array.isArray(existing) ? existing[0] : null;

    if (existingRow) {
      // UPDATE existing record
      await pool.query(
        `UPDATE case_initial_interview SET
          conflict_checked        = ?,
          any_conflict            = ?,
          file_no                 = ?,
          date_of_mva             = ?,
          interviewed_by          = ?,
          interviewed_on          = ?,
          referred_by             = ?,
          speaks_english          = ?,
          interpreter_required    = ?,
          language                = ?,
          born_in_canada          = ?,
          where_born              = ?,
          year_immigrated         = ?,
          client_role             = ?,
          seat_belted             = ?,
          accident_at_work        = ?,
          wsib_filed              = ?,
          street_name             = ?,
          major_intersection      = ?,
          city                    = ?,
          province                = ?,
          time_of_mva             = ?,
          police_reported         = ?,
          date_reported           = ?,
          police_came_to_scene    = ?,
          police_department       = ?,
          incident_no             = ?,
          officer_name            = ?,
          badge_no                = ?,
          client_charged          = ?,
          client_charged_desc     = ?,
          third_party_charged     = ?,
          third_party_charged_desc= ?,
          num_occupants           = ?,
          seating_arrangement     = ?,
          photos_of_damage        = ?,
          estimated_damage        = ?,
          accident_description    = ?
        WHERE case_id = ?`,
        [
          b.conflictChecked        || 'No',
          b.anyConflict            || 'No',
          b.fileNo                 || '',
          safeDate(b.dateOfMVA),
          b.interviewedBy          || '',
          safeDate(b.interviewedOn),
          b.referredBy             || '',
          b.speaksEnglish          || 'Yes',
          b.interpreterRequired    || 'No',
          b.language               || '',
          b.bornInCanada           || 'Yes',
          b.whereBorn              || '',
          b.yearImmigrated         || '',
          b.clientRole             || '',
          b.seatBelted             || 'Yes',
          b.accidentAtWork         || 'No',
          b.wsibFiled              || 'No',
          b.streetName             || '',
          b.majorIntersection      || '',
          b.city                   || '',
          b.province               || '',
          b.timeOfMVA              || '',
          b.policeReported         || 'No',
          safeDate(b.dateReported),
          b.policeCameToScene      || 'No',
          b.policeDepartment       || '',
          b.incidentNo             || '',
          b.officerName            || '',
          b.badgeNo                || '',
          b.clientCharged          || 'No',
          b.clientChargedDesc      || '',
          b.thirdPartyCharged      || 'No',
          b.thirdPartyChargedDesc  || '',
          numOccupants,
          b.seatingArrangement     || '',
          b.photosOfDamage         || 'No',
          estimatedDamage,
          b.accidentDescription    || '',
          caseId
        ]
      );
    } else {
      // INSERT new record
      await pool.query(
        `INSERT INTO case_initial_interview
          (id, case_id,
           conflict_checked, any_conflict, file_no, date_of_mva,
           interviewed_by, interviewed_on, referred_by,
           speaks_english, interpreter_required, language,
           born_in_canada, where_born, year_immigrated,
           client_role, seat_belted, accident_at_work, wsib_filed,
           street_name, major_intersection, city, province, time_of_mva,
           police_reported, date_reported, police_came_to_scene, police_department,
           incident_no, officer_name, badge_no,
           client_charged, client_charged_desc,
           third_party_charged, third_party_charged_desc,
           num_occupants, seating_arrangement,
           photos_of_damage, estimated_damage, accident_description)
         VALUES (?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?, ?,?, ?,?, ?,?,?)`,
        [
          generateId(), caseId,
          b.conflictChecked        || 'No',
          b.anyConflict            || 'No',
          b.fileNo                 || '',
          safeDate(b.dateOfMVA),
          b.interviewedBy          || '',
          safeDate(b.interviewedOn),
          b.referredBy             || '',
          b.speaksEnglish          || 'Yes',
          b.interpreterRequired    || 'No',
          b.language               || '',
          b.bornInCanada           || 'Yes',
          b.whereBorn              || '',
          b.yearImmigrated         || '',
          b.clientRole             || '',
          b.seatBelted             || 'Yes',
          b.accidentAtWork         || 'No',
          b.wsibFiled              || 'No',
          b.streetName             || '',
          b.majorIntersection      || '',
          b.city                   || '',
          b.province               || '',
          b.timeOfMVA              || '',
          b.policeReported         || 'No',
          safeDate(b.dateReported),
          b.policeCameToScene      || 'No',
          b.policeDepartment       || '',
          b.incidentNo             || '',
          b.officerName            || '',
          b.badgeNo                || '',
          b.clientCharged          || 'No',
          b.clientChargedDesc      || '',
          b.thirdPartyCharged      || 'No',
          b.thirdPartyChargedDesc  || '',
          numOccupants,
          b.seatingArrangement     || '',
          b.photosOfDamage         || 'No',
          estimatedDamage,
          b.accidentDescription    || ''
        ]
      );
    }

    // Return the saved record
    await getInitialInterview(req, res);
  } catch (err) {
    console.error('[saveInitialInterview]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}
