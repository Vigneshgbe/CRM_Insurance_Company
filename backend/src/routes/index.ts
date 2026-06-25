import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clients.controller';
import { getCases, getCaseById, getCaseByFileNo, createCase, updateCase, deleteCase } from '../controllers/cases.controller';
import { getNotesByCaseId, createNote, updateNote, deleteNote } from '../controllers/notes.controller';
import { getActivitiesByCaseId, createActivity, updateActivity, deleteActivity, getRecentActivities } from '../controllers/activities.controller';
import { getDashboardStats, getUpcomingLimitations, getRecentCases, getReferrers } from '../controllers/dashboard.controller';
import { getHistoryByCaseId, getStatusHistoryByCaseId } from '../controllers/history.controller';
import { getSettlement, upsertSettlement } from '../controllers/settlement.controller';
import { getContactAccess, createContactAccess, deleteContactAccess } from '../controllers/contact-access.controller';
import { getThirdParty, upsertThirdParty } from '../controllers/third-party.controller';
import { getNoFault, upsertNoFault } from '../controllers/no-fault.controller';
import { getMedical, upsertMedical } from '../controllers/medical.controller';
import { getEmployment, upsertEmployment } from '../controllers/employment.controller';
import { getDocumentsByCase, uploadDocument, getAllDocuments, deleteDocument, renameDocument, upload as docUpload } from '../controllers/documents.controller';
import pool from '../config/database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ── multer for portal upload ─────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/dashboard/upcoming-limitations', authenticate, getUpcomingLimitations);
router.get('/dashboard/recent-cases', authenticate, getRecentCases);
router.get('/dashboard/recent-activities', authenticate, getRecentActivities);

// ── Referrers ─────────────────────────────────────────────────────────────────
router.get('/referrers', authenticate, getReferrers);

// ── Clients ───────────────────────────────────────────────────────────────────
router.get('/clients', authenticate, getClients);
router.get('/clients/:id', authenticate, getClientById);
router.post('/clients', authenticate, createClient);
router.put('/clients/:id', authenticate, updateClient);
router.delete('/clients/:id', authenticate, deleteClient);

// ── Cases (specific routes BEFORE :id param) ──────────────────────────────────
router.get('/cases', authenticate, getCases);
router.get('/cases/by-file/:fileNo', authenticate, getCaseByFileNo);
router.get('/cases/:id', authenticate, getCaseById);
router.post('/cases', authenticate, createCase);
router.put('/cases/:id', authenticate, updateCase);
router.delete('/cases/:id', authenticate, deleteCase);

// ── Case Status ───────────────────────────────────────────────────────────────
router.post('/cases/:caseId/status', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const { status, changedBy } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    await pool.query('UPDATE cases SET file_status = ? WHERE id = ?', [status, caseId]);
    await pool.query(
      'INSERT INTO status_history (id, case_id, status, date, changed_by) VALUES (?, ?, ?, CURDATE(), ?)',
      [crypto.randomUUID(), caseId, status, changedBy || req.user?.name || 'Staff']
    );
    await pool.query(
      `INSERT INTO case_history (id, case_id, date, time, user, action, field_changed, old_value, new_value)
       VALUES (?, ?, CURDATE(), TIME(NOW()), ?, 'Updated', 'File Status', '', ?)`,
      [crypto.randomUUID(), caseId, req.user?.name || 'Staff', status]
    );
    res.json({ success: true, status });
  } catch (err: any) {
    console.error('[ERROR] POST /cases/:caseId/status:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Notes ─────────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/notes', authenticate, getNotesByCaseId);
router.post('/cases/:caseId/notes', authenticate, createNote);
router.put('/cases/:caseId/notes/:noteId', authenticate, updateNote);
router.delete('/cases/:caseId/notes/:noteId', authenticate, deleteNote);

// ── Activities ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/activities', authenticate, getActivitiesByCaseId);
router.post('/cases/:caseId/activities', authenticate, createActivity);
router.put('/cases/:caseId/activities/:activityId', authenticate, updateActivity);
router.delete('/cases/:caseId/activities/:activityId', authenticate, deleteActivity);

// ── History ───────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/history', authenticate, getHistoryByCaseId);
router.get('/cases/:caseId/status-history', authenticate, getStatusHistoryByCaseId);

// ── Settlement ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/settlement', authenticate, getSettlement);
router.post('/cases/:caseId/settlement', authenticate, upsertSettlement);

// ── Contact Access ────────────────────────────────────────────────────────────
router.get('/cases/:caseId/contact-access', authenticate, getContactAccess);
router.post('/cases/:caseId/contact-access', authenticate, createContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId', authenticate, deleteContactAccess);

// ── Third Party ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/third-party', authenticate, getThirdParty);
router.post('/cases/:caseId/third-party', authenticate, upsertThirdParty);

// ── No Fault ──────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/no-fault', authenticate, getNoFault);
router.post('/cases/:caseId/no-fault', authenticate, upsertNoFault);

// ── Medical ───────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/medical', authenticate, getMedical);
router.post('/cases/:caseId/medical', authenticate, upsertMedical);

// ── Employment ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/employment', authenticate, getEmployment);
router.post('/cases/:caseId/employment', authenticate, upsertEmployment);

// ── Police Info ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/police-info', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM case_police_info WHERE case_id = ?', [req.params.caseId]) as any[];
    const r = rows[0] || {};
    res.json({
      reportedDate: r.reported_date || '', reportOrdered: r.report_ordered || '',
      reportOrderedDate: r.report_ordered_date || '', policeCentre: r.police_centre || '',
      policeOfficer: r.police_officer || '', badgeNumber: r.badge_number || '',
      incidentNo: r.incident_no || '', division: r.division || '',
      address: r.address || '', city: r.city || '', provincePC: r.province_pc || '',
      requestDate: r.request_date || '', receivedDate: r.received_date || '',
      phone: r.phone || '', intersection: r.intersection || '',
      timeOfAccident: r.time_of_accident || '', accidentDescription: r.accident_description || '',
    });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/police-info', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const d = req.body;
  try {
    await pool.query(
      `INSERT INTO case_police_info (id, case_id, reported_date, report_ordered, report_ordered_date,
        police_centre, police_officer, badge_number, incident_no, division, address, city, province_pc,
        request_date, received_date, phone, intersection, time_of_accident, accident_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        reported_date=VALUES(reported_date), report_ordered=VALUES(report_ordered),
        report_ordered_date=VALUES(report_ordered_date), police_centre=VALUES(police_centre),
        police_officer=VALUES(police_officer), badge_number=VALUES(badge_number),
        incident_no=VALUES(incident_no), division=VALUES(division), address=VALUES(address),
        city=VALUES(city), province_pc=VALUES(province_pc), request_date=VALUES(request_date),
        received_date=VALUES(received_date), phone=VALUES(phone), intersection=VALUES(intersection),
        time_of_accident=VALUES(time_of_accident), accident_description=VALUES(accident_description)`,
      [crypto.randomUUID(), caseId, d.reportedDate||null, d.reportOrdered||null, d.reportOrderedDate||null,
       d.policeCentre||null, d.policeOfficer||null, d.badgeNumber||null, d.incidentNo||null, d.division||null,
       d.address||null, d.city||null, d.provincePC||null, d.requestDate||null, d.receivedDate||null,
       d.phone||null, d.intersection||null, d.timeOfAccident||null, d.accidentDescription||null]
    );
    res.json({ success: true });
  } catch (err: any) { console.error(err.message); res.status(500).json({ error: 'Server error' }); }
});

// ── Lawyers ───────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/lawyers', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM case_lawyers WHERE case_id = ?', [req.params.caseId]
    ) as any[];
    const byType = (t: string) => rows.find((r: any) => r.lawyer_type === t) || {};
    const map = (r: any, prefix: string) => ({
      [`${prefix}Firm`]: r.law_firm || '', [`${prefix}Address`]: r.address || '',
      [`${prefix}City`]: r.city || '', [`${prefix}Postal`]: r.postal_code || '',
      [`${prefix}Lawyer`]: r.lawyer_name || '', [`${prefix}Phone`]: r.phone || '',
      [`${prefix}Fax`]: r.fax || '', [`${prefix}Ext`]: r.ext || '',
    });
    res.json({ ...map(byType('our'), 'our'), ...map(byType('previous'), 'prev'), ...map(byType('transferred'), 'trans') });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/lawyers', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const d = req.body;
  try {
    const upsertLawyer = async (type: string, firm: string, lawyer: string, address: string, city: string, postal: string, phone: string, fax: string, ext: string) => {
      await pool.query(
        `INSERT INTO case_lawyers (id, case_id, lawyer_type, law_firm, lawyer_name, address, city, postal_code, phone, fax, ext)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE law_firm=VALUES(law_firm), lawyer_name=VALUES(lawyer_name),
           address=VALUES(address), city=VALUES(city), postal_code=VALUES(postal_code),
           phone=VALUES(phone), fax=VALUES(fax), ext=VALUES(ext)`,
        [crypto.randomUUID(), caseId, type, firm||null, lawyer||null, address||null, city||null, postal||null, phone||null, fax||null, ext||null]
      );
    };
    await upsertLawyer('our', d.ourFirm, d.ourLawyer, d.ourAddress, d.ourCity, d.ourPostal, d.ourPhone, d.ourFax, d.ourExt);
    await upsertLawyer('previous', d.prevFirm, d.prevLawyer, d.prevAddress, d.prevCity, d.prevPostal, d.prevPhone, d.prevFax, d.prevExt);
    await upsertLawyer('transferred', d.transFirm, d.transLawyer, d.transAddress, d.transCity, d.transPostal, d.transPhone, d.transFax, d.transExt);
    res.json({ success: true });
  } catch (err: any) { console.error(err.message); res.status(500).json({ error: 'Server error' }); }
});

// ── Specialist ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/specialist', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM case_specialist WHERE case_id = ? ORDER BY specialist_order', [req.params.caseId]) as any[];
    const r = rows[0] || {};
    res.json({
      company: r.company || '', address: r.address || '', city: r.city || '',
      province: r.province || '', postCode: r.post_code || '',
      phone: r.phone || '', fax: r.fax || '',
      assessmentDate: r.assessment_date || '', reportDate: r.report_date || '',
      specialtyType: r.specialty_type || '', findings: r.findings || '',
    });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/specialist', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const d = req.body;
  try {
    await pool.query(
      `INSERT INTO case_specialist (id, case_id, specialist_order, company, address, city, province,
        post_code, phone, fax, assessment_date, report_date, specialty_type, findings)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company=VALUES(company), address=VALUES(address), city=VALUES(city),
         province=VALUES(province), post_code=VALUES(post_code), phone=VALUES(phone), fax=VALUES(fax),
         assessment_date=VALUES(assessment_date), report_date=VALUES(report_date),
         specialty_type=VALUES(specialty_type), findings=VALUES(findings)`,
      [crypto.randomUUID(), caseId, d.company||null, d.address||null, d.city||null, d.province||null,
       d.postCode||null, d.phone||null, d.fax||null, d.assessmentDate||null, d.reportDate||null,
       d.specialtyType||null, d.findings||null]
    );
    res.json({ success: true });
  } catch (err: any) { console.error(err.message); res.status(500).json({ error: 'Server error' }); }
});

// ── Initial Interview ─────────────────────────────────────────────────────────
router.get('/cases/:caseId/initial-interview', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM case_initial_interview WHERE case_id = ?', [req.params.caseId]) as any[];
    if (!rows[0]) return res.json({});
    const r = rows[0];
    const camel: any = {};
    Object.keys(r).forEach(k => {
      const c = k.replace(/_([a-z])/g, (_: any, l: string) => l.toUpperCase());
      camel[c] = r[k];
    });
    res.json(camel);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/initial-interview', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const d = req.body;
  try {
    await pool.query(
      `INSERT INTO case_initial_interview (id, case_id, salutation, gender, date_of_birth, first_name, last_name,
        city, province, postal_code, country, home_phone, mobile, email, marital_status,
        number_of_dependants, born_in_canada, languages_used, speaks_english, requires_interpreter,
        consent_electronic_comms, benefit_election)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE salutation=VALUES(salutation), gender=VALUES(gender),
         date_of_birth=VALUES(date_of_birth), first_name=VALUES(first_name), last_name=VALUES(last_name),
         city=VALUES(city), province=VALUES(province), postal_code=VALUES(postal_code),
         home_phone=VALUES(home_phone), mobile=VALUES(mobile), email=VALUES(email),
         marital_status=VALUES(marital_status), number_of_dependants=VALUES(number_of_dependants),
         born_in_canada=VALUES(born_in_canada), languages_used=VALUES(languages_used),
         speaks_english=VALUES(speaks_english), requires_interpreter=VALUES(requires_interpreter),
         consent_electronic_comms=VALUES(consent_electronic_comms), benefit_election=VALUES(benefit_election)`,
      [crypto.randomUUID(), caseId, d.salutation||null, d.gender||null, d.dateOfBirth||null,
       d.firstName||null, d.lastName||null, d.city||null, d.province||null, d.postalCode||null,
       d.country||'Canada', d.homePhone||null, d.mobile||null, d.email||null, d.maritalStatus||null,
       d.numberOfDependants||0, d.bornInCanada||null, d.languagesUsed||null, d.speaksEnglish||null,
       d.requiresInterpreter||null, d.consentElectronicComms||null, d.benefitElection||null]
    );
    res.json({ success: true });
  } catch (err: any) { console.error(err.message); res.status(500).json({ error: 'Server error' }); }
});

// ── Client Info ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/client-info', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM case_client_id_docs WHERE case_id = ?', [req.params.caseId]) as any[];
    const r = rows[0] || {};
    res.json({
      dlNumber: r.dl_number || '', dlCopy: !!r.dl_copy,
      healthCardNumber: r.health_card_number || '', healthCardCopy: !!r.health_card_copy,
      ohipNumber: r.ohip_number || '',
      sinNumber: r.sin_number || '', sinCopy: !!r.sin_copy,
      ontarioIdNumber: r.ontario_id_number || '', ontarioIdCopy: !!r.ontario_id_copy,
      prCardNumber: r.pr_card_number || '', prCardCopy: !!r.pr_card_copy,
      citizenCardNumber: r.citizen_card_number || '', citizenCardCopy: !!r.citizen_card_copy,
    });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/client-info', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const d = req.body;
  try {
    await pool.query(
      `INSERT INTO case_client_id_docs (id, case_id, dl_number, dl_copy, health_card_number, health_card_copy,
        ohip_number, sin_number, sin_copy, ontario_id_number, ontario_id_copy, pr_card_number, pr_card_copy,
        citizen_card_number, citizen_card_copy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE dl_number=VALUES(dl_number), dl_copy=VALUES(dl_copy),
         health_card_number=VALUES(health_card_number), health_card_copy=VALUES(health_card_copy),
         ohip_number=VALUES(ohip_number), sin_number=VALUES(sin_number), sin_copy=VALUES(sin_copy),
         ontario_id_number=VALUES(ontario_id_number), ontario_id_copy=VALUES(ontario_id_copy),
         pr_card_number=VALUES(pr_card_number), pr_card_copy=VALUES(pr_card_copy),
         citizen_card_number=VALUES(citizen_card_number), citizen_card_copy=VALUES(citizen_card_copy)`,
      [crypto.randomUUID(), caseId, d.dlNumber||null, d.dlCopy?1:0, d.healthCardNumber||null, d.healthCardCopy?1:0,
       d.ohipNumber||null, d.sinNumber||null, d.sinCopy?1:0, d.ontarioIdNumber||null, d.ontarioIdCopy?1:0,
       d.prCardNumber||null, d.prCardCopy?1:0, d.citizenCardNumber||null, d.citizenCardCopy?1:0]
    );
    res.json({ success: true });
  } catch (err: any) { console.error(err.message); res.status(500).json({ error: 'Server error' }); }
});

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/documents', authenticate, getDocumentsByCase);
router.post('/cases/:caseId/documents', authenticate, docUpload.single('file'), uploadDocument);
router.get('/documents', authenticate, getAllDocuments);
router.delete('/documents/:id', authenticate, deleteDocument);
router.put('/documents/:id', authenticate, renameDocument);

// ── OCF Forms ─────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/ocf/:formNumber', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT form_data FROM ocf_form_data WHERE case_id = ? AND form_number = ?',
      [req.params.caseId, req.params.formNumber]
    ) as any[];
    res.json(rows[0] ? JSON.parse(rows[0].form_data) : {});
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/cases/:caseId/ocf/:formNumber', authenticate, async (req: any, res: any) => {
  try {
    await pool.query(
      `INSERT INTO ocf_form_data (id, case_id, form_number, form_data)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE form_data = VALUES(form_data)`,
      [crypto.randomUUID(), req.params.caseId, req.params.formNumber, JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', authenticate, async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, is_active FROM users ORDER BY name') as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/users', authenticate, async (req: any, res: any) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), name, email, hash, role || 'employee']
    );
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});
router.delete('/users/:id', authenticate, async (req: any, res: any) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/status-summary', authenticate, async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT file_status as status, COUNT(*) as count FROM cases GROUP BY file_status'
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/reports/monthly', authenticate, async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(open_date, '%b %Y') as month, COUNT(*) as cases
       FROM cases WHERE open_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(open_date, '%Y-%m') ORDER BY MIN(open_date)`
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/reports/limitations', authenticate, async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.file_no as fileNo, c.limitation_date as limitationDate,
              c.file_status as fileStatus, cl.first_name as firstName, cl.last_name as lastName
       FROM cases c JOIN clients cl ON c.client_id = cl.id
       WHERE c.limitation_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
         AND c.file_status NOT IN ('Closed','Settled')
       ORDER BY c.limitation_date`
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/reports/settlements', authenticate, async (_req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.file_no as fileNo, c.file_status as fileStatus,
              cl.first_name as firstName, cl.last_name as lastName,
              s.final_settlement as finalSettlement, s.pay_to_client as payToClient
       FROM cases c
       JOIN clients cl ON c.client_id = cl.id
       LEFT JOIN case_settlement s ON c.id = s.case_id
       WHERE c.file_status = 'Settled'
       ORDER BY c.updated_at DESC`
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});

// ── Portal ────────────────────────────────────────────────────────────────────
router.get('/portal/cases', authenticate, async (req: any, res: any) => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) return res.status(403).json({ error: 'Client access only' });
    const [rows] = await pool.query(
      `SELECT c.id, c.file_no as fileNo, c.file_status as fileStatus,
              c.case_type as caseType, c.date_of_loss as dateOfLoss,
              c.limitation_date as limitationDate
       FROM cases c WHERE c.client_id = ? ORDER BY c.created_at DESC`,
      [clientId]
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/portal/documents', authenticate, async (req: any, res: any) => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) return res.status(403).json({ error: 'Client access only' });
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.category, d.date
       FROM documents d JOIN cases c ON d.case_id = c.id
       WHERE c.client_id = ? ORDER BY d.created_at DESC`,
      [clientId]
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/portal/documents', authenticate, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const clientId = req.user?.clientId;
    const [cases] = await pool.query('SELECT id FROM cases WHERE client_id = ? LIMIT 1', [clientId]) as any[];
    const caseId = cases[0]?.id || null;
    await pool.query(
      `INSERT INTO documents (id, case_id, name, category, uploaded_by, file_url, date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [crypto.randomUUID(), caseId, req.file.originalname, 'Client Upload',
       req.user?.name || 'Client', `/uploads/${req.file.filename}`]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/portal/status-history/:caseId', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, status, date, changed_by as changedBy FROM status_history WHERE case_id = ? ORDER BY date DESC',
      [req.params.caseId]
    ) as any[];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: 'Server error' }); }
});

export default router;