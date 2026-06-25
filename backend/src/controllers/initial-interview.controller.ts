import { Request, Response } from 'express';
import pool from '../config/database';

function mapRow(row: any) {
  if (!row) return {};
  return {
    conflictChecked:       row.conflict_checked        || 'No',
    anyConflict:           row.any_conflict            || 'No',
    fileNo:                row.file_no                 || '',
    dateOfMVA:             row.date_of_mva             ? row.date_of_mva.toISOString().split('T')[0] : '',
    interviewedBy:         row.interviewed_by          || '',
    interviewedOn:         row.interviewed_on          ? row.interviewed_on.toISOString().split('T')[0] : '',
    referredBy:            row.referred_by             || '',
    speaksEnglish:         row.speaks_english          || 'Yes',
    interpreterRequired:   row.interpreter_required    || 'No',
    language:              row.language                || '',
    bornInCanada:          row.born_in_canada          || 'Yes',
    whereBorn:             row.where_born              || '',
    yearImmigrated:        row.year_immigrated         || '',
    clientRole:            row.client_role             || '',
    seatBelted:            row.seat_belted             || 'Yes',
    accidentAtWork:        row.accident_at_work        || 'No',
    wsibFiled:             row.wsib_filed              || 'No',
    streetName:            row.street_name             || '',
    majorIntersection:     row.major_intersection      || '',
    city:                  row.city                   || '',
    province:              row.province               || '',
    timeOfMVA:             row.time_of_mva            || '',
    policeReported:        row.police_reported         || 'No',
    dateReported:          row.date_reported           ? row.date_reported.toISOString().split('T')[0] : '',
    policeCameToScene:     row.police_came_to_scene    || 'No',
    policeDepartment:      row.police_department       || '',
    incidentNo:            row.incident_no             || '',
    officerName:           row.officer_name            || '',
    badgeNo:               row.badge_no                || '',
    clientCharged:         row.client_charged          || 'No',
    clientChargedDesc:     row.client_charged_desc     || '',
    thirdPartyCharged:     row.third_party_charged     || 'No',
    thirdPartyChargedDesc: row.third_party_charged_desc || '',
    numOccupants:          row.num_occupants           || '',
    seatingArrangement:    row.seating_arrangement     || '',
    photosOfDamage:        row.photos_of_damage        || 'No',
    estimatedDamage:       row.estimated_damage        || '',
    accidentDescription:   row.accident_description    || '',
  };
}

// ─── GET /api/cases/:caseId/initial-interview ─────────────────────────────
export async function getInitialInterview(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [[row]] = await pool.query(
      'SELECT * FROM case_initial_interview WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    res.json(mapRow(row));
  } catch (err) {
    console.error('[getInitialInterview]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ─── POST /api/cases/:caseId/initial-interview ────────────────────────────
export async function saveInitialInterview(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_initial_interview
        (id, case_id, conflict_checked, any_conflict, file_no, date_of_mva,
         interviewed_by, interviewed_on, referred_by,
         speaks_english, interpreter_required, language,
         born_in_canada, where_born, year_immigrated,
         client_role, seat_belted, accident_at_work, wsib_filed,
         street_name, major_intersection, city, province, time_of_mva,
         police_reported, date_reported, police_came_to_scene, police_department,
         incident_no, officer_name, badge_no,
         client_charged, client_charged_desc, third_party_charged, third_party_charged_desc,
         num_occupants, seating_arrangement, photos_of_damage, estimated_damage, accident_description)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         conflict_checked=VALUES(conflict_checked), any_conflict=VALUES(any_conflict),
         file_no=VALUES(file_no), date_of_mva=VALUES(date_of_mva),
         interviewed_by=VALUES(interviewed_by), interviewed_on=VALUES(interviewed_on),
         referred_by=VALUES(referred_by), speaks_english=VALUES(speaks_english),
         interpreter_required=VALUES(interpreter_required), language=VALUES(language),
         born_in_canada=VALUES(born_in_canada), where_born=VALUES(where_born),
         year_immigrated=VALUES(year_immigrated), client_role=VALUES(client_role),
         seat_belted=VALUES(seat_belted), accident_at_work=VALUES(accident_at_work),
         wsib_filed=VALUES(wsib_filed), street_name=VALUES(street_name),
         major_intersection=VALUES(major_intersection), city=VALUES(city), province=VALUES(province),
         time_of_mva=VALUES(time_of_mva), police_reported=VALUES(police_reported),
         date_reported=VALUES(date_reported), police_came_to_scene=VALUES(police_came_to_scene),
         police_department=VALUES(police_department), incident_no=VALUES(incident_no),
         officer_name=VALUES(officer_name), badge_no=VALUES(badge_no),
         client_charged=VALUES(client_charged), client_charged_desc=VALUES(client_charged_desc),
         third_party_charged=VALUES(third_party_charged), third_party_charged_desc=VALUES(third_party_charged_desc),
         num_occupants=VALUES(num_occupants), seating_arrangement=VALUES(seating_arrangement),
         photos_of_damage=VALUES(photos_of_damage), estimated_damage=VALUES(estimated_damage),
         accident_description=VALUES(accident_description)`,
      [
        caseId,
        b.conflictChecked||'No', b.anyConflict||'No', b.fileNo||'',
        b.dateOfMVA||null, b.interviewedBy||'', b.interviewedOn||null, b.referredBy||'',
        b.speaksEnglish||'Yes', b.interpreterRequired||'No', b.language||'',
        b.bornInCanada||'Yes', b.whereBorn||'', b.yearImmigrated||'',
        b.clientRole||'', b.seatBelted||'Yes', b.accidentAtWork||'No', b.wsibFiled||'No',
        b.streetName||'', b.majorIntersection||'', b.city||'', b.province||'', b.timeOfMVA||'',
        b.policeReported||'No', b.dateReported||null, b.policeCameToScene||'No',
        b.policeDepartment||'', b.incidentNo||'', b.officerName||'', b.badgeNo||'',
        b.clientCharged||'No', b.clientChargedDesc||'',
        b.thirdPartyCharged||'No', b.thirdPartyChargedDesc||'',
        b.numOccupants||'', b.seatingArrangement||'',
        b.photosOfDamage||'No', b.estimatedDamage||'', b.accidentDescription||''
      ]
    );

    await getInitialInterview(req, res);
  } catch (err) {
    console.error('[saveInitialInterview]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
