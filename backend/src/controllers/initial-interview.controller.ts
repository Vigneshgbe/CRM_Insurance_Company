import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── DB column → API field mapping ─────────────────────────────────────────────
function mapRow(row: any, idDocs: any) {
  if (!row) return {};
  return {
    // Original 38 fields — unchanged
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

    // ── NEW: personal / header fields ────────────────────────────────────────
    salutation:             row.salutation               || '',
    gender:                 row.gender                   || '',
    unitNumber:             row.unit_number              || '',
    streetNumber:           row.street_number            || '',
    postalCode:             row.postal_code              || '',
    country:                row.country                  || '',
    homePhone:              row.home_phone               || '',
    mobile:                 row.mobile                   || '',
    otherPhone:             row.other_phone              || '',
    whatsapp:               row.whatsapp                 || '',
    email:                  row.email                    || '',
    maritalStatus:          row.marital_status           || '',
    dependants:             row.dependants != null ? String(row.dependants) : '0',
    languageNeeds:          row.language_needs           || '',
    electronicConsent:      row.electronic_consent       || 'Yes',
    benefitChosen:          row.benefit_chosen           || '',
    tortLawFirm:            row.tort_law_firm            || '',
    tortCounsel:            row.tort_counsel             || '',
    abCounsel:              row.ab_counsel               || '',
    secretary:              row.secretary                || '',
    fileStatus:             row.file_status              || '',

    // ── NEW: ID Documents from case_client_id_docs ───────────────────────────
    driverLicense:          idDocs?.driver_license       || '',
    driverLicenseCopy:      idDocs?.driver_license_copy  || 'No',
    healthCard:             idDocs?.health_card          || '',
    healthCardCopy:         idDocs?.health_card_copy     || 'No',
    sin:                    idDocs?.sin_number           || '',
    sinCopy:                idDocs?.sin_copy             || 'No',
    ontarioId:              !!(idDocs?.ontario_id),
    ontarioIdNo:            idDocs?.ontario_id_no        || '',
    ontarioIdCopy:          idDocs?.ontario_id_copy      || 'No',
    prCard:                 !!(idDocs?.pr_card),
    prCardNo:               idDocs?.pr_card_no           || '',
    prCardCopy:             idDocs?.pr_card_copy         || 'No',
    citizenCard:            !!(idDocs?.citizen_card),
    citizenCardNo:          idDocs?.citizen_card_no      || '',
    citizenCardCopy:        idDocs?.citizen_card_copy    || 'No',
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

    // Also fetch ID docs
    const [idRows] = await pool.query(
      'SELECT * FROM case_client_id_docs WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const idDocs = Array.isArray(idRows) ? idRows[0] : null;

    res.json(mapRow(row, idDocs));
  } catch (err) {
    console.error('[getInitialInterview]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── POST /api/cases/:caseId/initial-interview ─────────────────────────────────
export async function saveInitialInterview(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const b = req.body;

  const safeDate = (v: any) => (v && String(v).trim() !== '' ? v : null);

  const numOccupants = b.numOccupants !== '' && b.numOccupants != null
    ? parseInt(String(b.numOccupants), 10) || null
    : null;

  const estimatedDamage = b.estimatedDamage !== '' && b.estimatedDamage != null
    ? parseFloat(String(b.estimatedDamage)) || null
    : null;

  const dependants = b.dependants !== '' && b.dependants != null
    ? parseInt(String(b.dependants), 10) || 0
    : 0;

  try {
    // ── Check existing interview record ───────────────────────────────────────
    const [existing] = await pool.query(
      'SELECT id FROM case_initial_interview WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const existingRow = Array.isArray(existing) ? existing[0] : null;

    // ── All columns in order — original 38 + 21 new ───────────────────────────
    const interviewValues = [
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
      // NEW personal / header fields
      b.salutation             || '',
      b.gender                 || '',
      b.unitNumber             || '',
      b.streetNumber           || '',
      b.postalCode             || '',
      b.country                || '',
      b.homePhone              || '',
      b.mobile                 || '',
      b.otherPhone             || '',
      b.whatsapp               || '',
      b.email                  || '',
      b.maritalStatus          || '',
      dependants,
      b.languageNeeds          || '',
      b.electronicConsent      || 'Yes',
      b.benefitChosen          || '',
      b.tortLawFirm            || '',
      b.tortCounsel            || '',
      b.abCounsel              || '',
      b.secretary              || '',
      b.fileStatus             || '',
    ];

    if (existingRow) {
      await pool.query(
        `UPDATE case_initial_interview SET
          conflict_checked=?,       any_conflict=?,          file_no=?,
          date_of_mva=?,            interviewed_by=?,        interviewed_on=?,
          referred_by=?,            speaks_english=?,        interpreter_required=?,
          language=?,               born_in_canada=?,        where_born=?,
          year_immigrated=?,        client_role=?,           seat_belted=?,
          accident_at_work=?,       wsib_filed=?,            street_name=?,
          major_intersection=?,     city=?,                  province=?,
          time_of_mva=?,            police_reported=?,       date_reported=?,
          police_came_to_scene=?,   police_department=?,     incident_no=?,
          officer_name=?,           badge_no=?,              client_charged=?,
          client_charged_desc=?,    third_party_charged=?,   third_party_charged_desc=?,
          num_occupants=?,          seating_arrangement=?,   photos_of_damage=?,
          estimated_damage=?,       accident_description=?,
          salutation=?,             gender=?,                unit_number=?,
          street_number=?,          postal_code=?,           country=?,
          home_phone=?,             mobile=?,                other_phone=?,
          whatsapp=?,               email=?,                 marital_status=?,
          dependants=?,             language_needs=?,        electronic_consent=?,
          benefit_chosen=?,         tort_law_firm=?,         tort_counsel=?,
          ab_counsel=?,             secretary=?,             file_status=?
        WHERE case_id = ?`,
        [...interviewValues, caseId]
      );
    } else {
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
           photos_of_damage, estimated_damage, accident_description,
           salutation, gender, unit_number, street_number, postal_code, country,
           home_phone, mobile, other_phone, whatsapp, email,
           marital_status, dependants, language_needs, electronic_consent,
           benefit_chosen, tort_law_firm, tort_counsel, ab_counsel, secretary, file_status)
         VALUES (?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?, ?,?, ?,?, ?,?,?, ?,?,?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?,?,?,?)`,
        [generateId(), caseId, ...interviewValues]
      );
    }

    // ── Save ID Documents to case_client_id_docs ──────────────────────────────
    const [idExisting] = await pool.query(
      'SELECT id FROM case_client_id_docs WHERE case_id = ? LIMIT 1',
      [caseId]
    ) as any[];
    const idRow = Array.isArray(idExisting) ? idExisting[0] : null;

    const idValues = [
      b.driverLicense     || '',
      b.driverLicenseCopy || 'No',
      b.healthCard        || '',
      b.healthCardCopy    || 'No',
      b.sin               || '',
      b.sinCopy           || 'No',
      b.ontarioId  ? 1 : 0,
      b.ontarioIdNo       || '',
      b.ontarioIdCopy     || 'No',
      b.prCard     ? 1 : 0,
      b.prCardNo          || '',
      b.prCardCopy        || 'No',
      b.citizenCard ? 1 : 0,
      b.citizenCardNo     || '',
      b.citizenCardCopy   || 'No',
    ];

    if (idRow) {
      await pool.query(
        `UPDATE case_client_id_docs SET
          driver_license=?,     driver_license_copy=?,
          health_card=?,        health_card_copy=?,
          sin_number=?,         sin_copy=?,
          ontario_id=?,         ontario_id_no=?,   ontario_id_copy=?,
          pr_card=?,            pr_card_no=?,      pr_card_copy=?,
          citizen_card=?,       citizen_card_no=?, citizen_card_copy=?
        WHERE case_id = ?`,
        [...idValues, caseId]
      );
    } else {
      await pool.query(
        `INSERT INTO case_client_id_docs
          (id, case_id,
           driver_license,    driver_license_copy,
           health_card,       health_card_copy,
           sin_number,        sin_copy,
           ontario_id,        ontario_id_no,  ontario_id_copy,
           pr_card,           pr_card_no,     pr_card_copy,
           citizen_card,      citizen_card_no, citizen_card_copy)
         VALUES (?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [generateId(), caseId, ...idValues]
      );
    }

    // Return saved record
    await getInitialInterview(req, res);
  } catch (err) {
    console.error('[saveInitialInterview]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}