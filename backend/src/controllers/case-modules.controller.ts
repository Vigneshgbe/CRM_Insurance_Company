import { Request, Response } from 'express';
import pool from '../config/database';
import { formatDate } from '../utils/helpers';

// ── POLICE INFO ──────────────────────────────────────────────
export async function getPoliceInfo(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_police_info WHERE case_id = ?', [req.params.caseId]) as any[];
    const r = (rows as any[])[0];
    if (!r) { res.json({}); return; }
    res.json({
      reportedDate: r.reported_date || '',
      reportOrdered: r.report_ordered || '',
      reportOrderedDate: formatDate(r.report_ordered_date) || '',
      policeCentre: r.police_centre || '',
      policeOfficer: r.police_officer || '',
      badgeNumber: r.badge_number || '',
      incidentNo: r.incident_no || '',
      division: r.division || '',
      address: r.address || '',
      city: r.city || '',
      provincePC: r.province_pc || '',
      requestDate: formatDate(r.request_date) || '',
      receivedDate: formatDate(r.received_date) || '',
      phone: r.phone || '',
      intersection: r.intersection || '',
      timeOfAccident: r.time_of_accident || '',
      accidentDescription: r.accident_description || '',
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertPoliceInfo(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_police_info (id, case_id, reported_date, report_ordered, report_ordered_date, police_centre, police_officer,
        badge_number, incident_no, division, address, city, province_pc, request_date, received_date, phone, intersection, time_of_accident, accident_description)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        reported_date=VALUES(reported_date), report_ordered=VALUES(report_ordered), report_ordered_date=VALUES(report_ordered_date),
        police_centre=VALUES(police_centre), police_officer=VALUES(police_officer), badge_number=VALUES(badge_number),
        incident_no=VALUES(incident_no), division=VALUES(division), address=VALUES(address), city=VALUES(city),
        province_pc=VALUES(province_pc), request_date=VALUES(request_date), received_date=VALUES(received_date),
        phone=VALUES(phone), intersection=VALUES(intersection), time_of_accident=VALUES(time_of_accident),
        accident_description=VALUES(accident_description)`,
      [caseId, b.reportedDate||'', b.reportOrdered||'', b.reportOrderedDate||null, b.policeCentre||'', b.policeOfficer||'',
       b.badgeNumber||'', b.incidentNo||'', b.division||'', b.address||'', b.city||'', b.provincePC||'',
       b.requestDate||null, b.receivedDate||null, b.phone||'', b.intersection||'', b.timeOfAccident||'', b.accidentDescription||'']
    );
    await getPoliceInfo(req, res);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

// ── LAWYERS ──────────────────────────────────────────────────
export async function getLawyers(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_lawyers WHERE case_id = ?', [req.params.caseId]) as any[];
    const result: any = {};
    for (const r of (rows as any[])) {
      const p = r.lawyer_type; // our, prev, trans
      result[`${p}Firm`] = r.firm_name || '';
      result[`${p}Address`] = r.address || '';
      result[`${p}City`] = r.city || '';
      result[`${p}Postal`] = r.postal_code || '';
      result[`${p}Lawyer`] = r.lawyer_name || '';
      result[`${p}Phone`] = r.phone || '';
      result[`${p}Fax`] = r.fax || '';
      result[`${p}Ext`] = r.ext || '';
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertLawyers(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    for (const type of ['our', 'prev', 'trans']) {
      await pool.query(
        `INSERT INTO case_lawyers (id, case_id, lawyer_type, firm_name, address, city, postal_code, lawyer_name, phone, fax, ext)
         VALUES (UUID(),?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
          firm_name=VALUES(firm_name), address=VALUES(address), city=VALUES(city), postal_code=VALUES(postal_code),
          lawyer_name=VALUES(lawyer_name), phone=VALUES(phone), fax=VALUES(fax), ext=VALUES(ext)`,
        [caseId, type, b[`${type}Firm`]||'', b[`${type}Address`]||'', b[`${type}City`]||'',
         b[`${type}Postal`]||'', b[`${type}Lawyer`]||'', b[`${type}Phone`]||'', b[`${type}Fax`]||'', b[`${type}Ext`]||'']
      );
    }
    await getLawyers(req, res);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

// ── SPECIALIST ───────────────────────────────────────────────
export async function getSpecialist(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_specialist WHERE case_id = ?', [req.params.caseId]) as any[];
    const r = (rows as any[])[0];
    if (!r) { res.json({}); return; }
    res.json({
      company: r.company || '',
      address: r.address || '',
      city: r.city || '',
      province: r.province || '',
      postCode: r.post_code || '',
      phone: r.phone || '',
      fax: r.fax || '',
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertSpecialist(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_specialist (id, case_id, company, address, city, province, post_code, phone, fax)
       VALUES (UUID(),?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE company=VALUES(company), address=VALUES(address), city=VALUES(city),
        province=VALUES(province), post_code=VALUES(post_code), phone=VALUES(phone), fax=VALUES(fax)`,
      [caseId, b.company||'', b.address||'', b.city||'', b.province||'', b.postCode||'', b.phone||'', b.fax||'']
    );
    await getSpecialist(req, res);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

// ── INITIAL INTERVIEW ────────────────────────────────────────
export async function getInitialInterview(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM case_initial_interview WHERE case_id = ?', [req.params.caseId]) as any[];
    const r = (rows as any[])[0];
    if (!r) { res.json({}); return; }
    res.json({
      conflictChecked: r.conflict_checked || 'No',
      anyConflict: r.any_conflict || 'No',
      fileNo: r.file_no || '',
      dateOfMVA: formatDate(r.date_of_mva) || '',
      interviewedBy: r.interviewed_by || '',
      interviewedOn: formatDate(r.interviewed_on) || '',
      referredBy: r.referred_by || '',
      speaksEnglish: r.speaks_english || 'Yes',
      interpreterRequired: r.interpreter_required || 'No',
      language: r.language || '',
      bornInCanada: r.born_in_canada || 'Yes',
      whereBorn: r.where_born || '',
      yearImmigrated: r.year_immigrated || '',
      clientRole: r.client_role || 'Driver',
      seatBelted: r.seat_belted || 'Yes',
      accidentAtWork: r.accident_at_work || 'No',
      wsibFiled: r.wsib_filed || 'No',
      streetName: r.street_name || '',
      majorIntersection: r.major_intersection || '',
      city: r.city || '',
      province: r.province || '',
      timeOfMVA: r.time_of_mva || '',
      policeReported: r.police_reported || 'Yes',
      dateReported: formatDate(r.date_reported) || '',
      policeCameToScene: r.police_came_to_scene || '',
      policeDepartment: r.police_department || '',
      incidentNo: r.incident_no || '',
      officerName: r.officer_name || '',
      badgeNo: r.badge_no || '',
      clientCharged: r.client_charged || 'No',
      clientChargedDesc: r.client_charged_desc || '',
      thirdPartyCharged: r.third_party_charged || 'No',
      thirdPartyChargedDesc: r.third_party_charged_desc || '',
      numOccupants: r.num_occupants || 1,
      seatingArrangement: r.seating_arrangement || '',
      photosOfDamage: r.photos_of_damage || 'No',
      estimatedDamage: r.estimated_damage || '',
      accidentDescription: r.accident_description || '',
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertInitialInterview(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  try {
    await pool.query(
      `INSERT INTO case_initial_interview (id, case_id, conflict_checked, any_conflict, file_no, date_of_mva, interviewed_by, interviewed_on,
        referred_by, speaks_english, interpreter_required, language, born_in_canada, where_born, year_immigrated, client_role, seat_belted,
        accident_at_work, wsib_filed, street_name, major_intersection, city, province, time_of_mva, police_reported, date_reported,
        police_came_to_scene, police_department, incident_no, officer_name, badge_no, client_charged, client_charged_desc,
        third_party_charged, third_party_charged_desc, num_occupants, seating_arrangement, photos_of_damage, estimated_damage, accident_description)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        conflict_checked=VALUES(conflict_checked), any_conflict=VALUES(any_conflict), file_no=VALUES(file_no),
        date_of_mva=VALUES(date_of_mva), interviewed_by=VALUES(interviewed_by), interviewed_on=VALUES(interviewed_on),
        referred_by=VALUES(referred_by), speaks_english=VALUES(speaks_english), interpreter_required=VALUES(interpreter_required),
        language=VALUES(language), born_in_canada=VALUES(born_in_canada), where_born=VALUES(where_born),
        year_immigrated=VALUES(year_immigrated), client_role=VALUES(client_role), seat_belted=VALUES(seat_belted),
        accident_at_work=VALUES(accident_at_work), wsib_filed=VALUES(wsib_filed), street_name=VALUES(street_name),
        major_intersection=VALUES(major_intersection), city=VALUES(city), province=VALUES(province),
        time_of_mva=VALUES(time_of_mva), police_reported=VALUES(police_reported), date_reported=VALUES(date_reported),
        police_came_to_scene=VALUES(police_came_to_scene), police_department=VALUES(police_department),
        incident_no=VALUES(incident_no), officer_name=VALUES(officer_name), badge_no=VALUES(badge_no),
        client_charged=VALUES(client_charged), client_charged_desc=VALUES(client_charged_desc),
        third_party_charged=VALUES(third_party_charged), third_party_charged_desc=VALUES(third_party_charged_desc),
        num_occupants=VALUES(num_occupants), seating_arrangement=VALUES(seating_arrangement),
        photos_of_damage=VALUES(photos_of_damage), estimated_damage=VALUES(estimated_damage),
        accident_description=VALUES(accident_description)`,
      [caseId, b.conflictChecked||'No', b.anyConflict||'No', b.fileNo||'', b.dateOfMVA||null, b.interviewedBy||'',
       b.interviewedOn||null, b.referredBy||'', b.speaksEnglish||'Yes', b.interpreterRequired||'No', b.language||'',
       b.bornInCanada||'Yes', b.whereBorn||'', b.yearImmigrated||'', b.clientRole||'Driver', b.seatBelted||'Yes',
       b.accidentAtWork||'No', b.wsibFiled||'No', b.streetName||'', b.majorIntersection||'', b.city||'', b.province||'',
       b.timeOfMVA||'', b.policeReported||'Yes', b.dateReported||null, b.policeCameToScene||'',
       b.policeDepartment||'', b.incidentNo||'', b.officerName||'', b.badgeNo||'',
       b.clientCharged||'No', b.clientChargedDesc||'', b.thirdPartyCharged||'No', b.thirdPartyChargedDesc||'',
       b.numOccupants||1, b.seatingArrangement||'', b.photosOfDamage||'No', b.estimatedDamage||0, b.accidentDescription||'']
    );
    await getInitialInterview(req, res);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

// ── CLIENT INFO (composite) ──────────────────────────────────
export async function getClientInfo(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  try {
    const [[docs]] = await pool.query('SELECT * FROM case_client_id_docs WHERE case_id = ?', [caseId]) as any[];
    const [contacts] = await pool.query('SELECT * FROM case_related_contacts WHERE case_id = ?', [caseId]) as any[];
    const [[settlement]] = await pool.query('SELECT * FROM case_settlement WHERE case_id = ?', [caseId]) as any[];

    const getContact = (type: string) => (contacts as any[]).find(c => c.contact_type === type) || {};

    const hk = getContact('hk');
    const carg = getContact('carg');
    const atc = getContact('atc');

    res.json({
      // ID Docs
      driverLicense: docs?.dl_number || '',
      ohipNumber: docs?.ohip_number || '',
      sinNumber: docs?.sin_number || '',
      citizenId: docs?.citizen_id || '',
      prCardNo: docs?.pr_card_number || '',
      passportNo: docs?.passport_no || '',
      // Children
      child1Name: docs?.child1_name || '', child1DOB: formatDate(docs?.child1_dob) || '',
      child2Name: docs?.child2_name || '', child2DOB: formatDate(docs?.child2_dob) || '',
      child3Name: docs?.child3_name || '', child3DOB: formatDate(docs?.child3_dob) || '',
      child4Name: docs?.child4_name || '', child4DOB: formatDate(docs?.child4_dob) || '',
      child5Name: docs?.child5_name || '', child5DOB: formatDate(docs?.child5_dob) || '',
      child6Name: docs?.child6_name || '', child6DOB: formatDate(docs?.child6_dob) || '',
      // Settlement (read-only from settlement table)
      finalSettlement: parseFloat(settlement?.final_settlement) || 0,
      ourFee: parseFloat(settlement?.our_fee) || 0,
      rehabOutstanding: parseFloat(settlement?.rehab_outstanding) || 0,
      assessmentOutstanding: parseFloat(settlement?.assessment_outstanding) || 0,
      outstanding3: parseFloat(settlement?.outstanding3) || 0,
      outstanding4: parseFloat(settlement?.outstanding4) || 0,
      hst: parseFloat(settlement?.hst) || 0,
      ourFeeHst: parseFloat(settlement?.our_fee_hst) || 0,
      payToClient: parseFloat(settlement?.pay_to_client) || 0,
      ourFinalAccount: parseFloat(settlement?.our_final_account) || 0,
      // Related Contacts
      hkName: hk.name||'', hkAddress: hk.address||'', hkCity: hk.city||'', hkPostCode: hk.post_code||'', hkPhone: hk.phone||'',
      cargName: carg.name||'', cargAddress: carg.address||'', cargCity: carg.city||'', cargPostCode: carg.post_code||'', cargPhone: carg.phone||'',
      atcName: atc.name||'', atcAddress: atc.address||'', atcCity: atc.city||'', atcPostCode: atc.post_code||'', atcPhone: atc.phone||'',
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function upsertClientInfo(req: Request, res: Response): Promise<void> {
  const caseId = req.params.caseId;
  const b = req.body;
  const conn = await (pool as any).getConnection();
  try {
    await conn.beginTransaction();

    // ID Docs
    await conn.query(
      `INSERT INTO case_client_id_docs (id, case_id, dl_number, ohip_number, sin_number, citizen_id, pr_card_number, passport_no,
        child1_name, child1_dob, child2_name, child2_dob, child3_name, child3_dob, child4_name, child4_dob, child5_name, child5_dob, child6_name, child6_dob)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        dl_number=VALUES(dl_number), ohip_number=VALUES(ohip_number), sin_number=VALUES(sin_number),
        citizen_id=VALUES(citizen_id), pr_card_number=VALUES(pr_card_number), passport_no=VALUES(passport_no),
        child1_name=VALUES(child1_name), child1_dob=VALUES(child1_dob), child2_name=VALUES(child2_name), child2_dob=VALUES(child2_dob),
        child3_name=VALUES(child3_name), child3_dob=VALUES(child3_dob), child4_name=VALUES(child4_name), child4_dob=VALUES(child4_dob),
        child5_name=VALUES(child5_name), child5_dob=VALUES(child5_dob), child6_name=VALUES(child6_name), child6_dob=VALUES(child6_dob)`,
      [caseId, b.driverLicense||'', b.ohipNumber||'', b.sinNumber||'', b.citizenId||'', b.prCardNo||'', b.passportNo||'',
       b.child1Name||'', b.child1DOB||null, b.child2Name||'', b.child2DOB||null,
       b.child3Name||'', b.child3DOB||null, b.child4Name||'', b.child4DOB||null,
       b.child5Name||'', b.child5DOB||null, b.child6Name||'', b.child6DOB||null]
    );

    // Related Contacts — delete and reinsert
    await conn.query('DELETE FROM case_related_contacts WHERE case_id = ?', [caseId]);
    for (const type of ['hk', 'carg', 'atc']) {
      const name = b[`${type}Name`];
      if (name || b[`${type}Phone`]) {
        await conn.query(
          'INSERT INTO case_related_contacts (id, case_id, contact_type, name, address, city, post_code, phone) VALUES (UUID(),?,?,?,?,?,?,?)',
          [caseId, type, name||'', b[`${type}Address`]||'', b[`${type}City`]||'', b[`${type}PostCode`]||'', b[`${type}Phone`]||'']
        );
      }
    }

    await conn.commit();
    conn.release();
    await getClientInfo(req, res);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
