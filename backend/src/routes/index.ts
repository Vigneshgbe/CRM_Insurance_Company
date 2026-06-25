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
import { getPoliceInfo, upsertPoliceInfo } from '../controllers/case-modules.controller';
import { getLawyers, upsertLawyers } from '../controllers/case-modules.controller';
import { getSpecialist, upsertSpecialist } from '../controllers/case-modules.controller';
import { getInitialInterview, upsertInitialInterview } from '../controllers/case-modules.controller';
import { getClientInfo, upsertClientInfo } from '../controllers/case-modules.controller';
import { getDocumentsByCaseId, uploadDocument, getAllDocuments, deleteDocument, renameDocument } from '../controllers/documents.controller';
import { getUsers, createUser, deleteUser } from '../controllers/misc.controller';
import { getStatusSummary, getMonthly, getLimitations, getSettlements } from '../controllers/misc.controller';
import { getPortalCases, getPortalDocuments } from '../controllers/misc.controller';
import pool from '../config/database';

const router = Router();

// ── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// ── Dashboard ───────────────────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/dashboard/upcoming-limitations', authenticate, getUpcomingLimitations);
router.get('/dashboard/recent-cases', authenticate, getRecentCases);
router.get('/dashboard/recent-activities', authenticate, getRecentActivities);

// ── Referrers ───────────────────────────────────────────────────────────────
router.get('/referrers', authenticate, getReferrers);

// ── Clients ─────────────────────────────────────────────────────────────────
router.get('/clients', authenticate, getClients);
router.get('/clients/:id', authenticate, getClientById);
router.post('/clients', authenticate, createClient);
router.put('/clients/:id', authenticate, updateClient);
router.delete('/clients/:id', authenticate, deleteClient);

// ── Cases ────────────────────────────────────────────────────────────────────
router.get('/cases', authenticate, getCases);
router.get('/cases/by-file/:fileNo', authenticate, getCaseByFileNo);
router.get('/cases/:id', authenticate, getCaseById);
router.post('/cases', authenticate, createCase);
router.put('/cases/:id', authenticate, updateCase);
router.delete('/cases/:id', authenticate, deleteCase);

// ── CASE STATUS (was missing — this was causing "Failed" on status update) ──
router.post('/cases/:caseId/status', authenticate, async (req: any, res: any) => {
  const { caseId } = req.params;
  const { status, changedBy } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    // Update the case file_status
    await pool.query('UPDATE cases SET file_status = ? WHERE id = ?', [status, caseId]);
    // Insert status history record
    const id = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO status_history (id, case_id, status, date, changed_by) VALUES (?, ?, ?, CURDATE(), ?)',
      [id, caseId, status, changedBy || req.user?.name || 'Staff']
    );
    // Also log to case_history
    await pool.query(
      `INSERT INTO case_history (id, case_id, date, time, user, action, field_changed, old_value, new_value)
       VALUES (UUID(), ?, CURDATE(), TIME(NOW()), ?, 'Updated', 'File Status', '', ?)`,
      [caseId, req.user?.name || 'Staff', status]
    );
    res.json({ success: true, status });
  } catch (err) {
    console.error('[ERROR] POST /api/cases/:caseId/status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Notes ────────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/notes', authenticate, getNotesByCaseId);
router.post('/cases/:caseId/notes', authenticate, createNote);
router.put('/cases/:caseId/notes/:noteId', authenticate, updateNote);
router.delete('/cases/:caseId/notes/:noteId', authenticate, deleteNote);

// ── Activities ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/activities', authenticate, getActivitiesByCaseId);
router.post('/cases/:caseId/activities', authenticate, createActivity);
router.put('/cases/:caseId/activities/:activityId', authenticate, updateActivity);
router.delete('/cases/:caseId/activities/:activityId', authenticate, deleteActivity);

// ── History ──────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/history', authenticate, getHistoryByCaseId);
router.get('/cases/:caseId/status-history', authenticate, getStatusHistoryByCaseId);

// ── Settlement ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/settlement', authenticate, getSettlement);
router.post('/cases/:caseId/settlement', authenticate, upsertSettlement);

// ── Contact Access ───────────────────────────────────────────────────────────
router.get('/cases/:caseId/contact-access', authenticate, getContactAccess);
router.post('/cases/:caseId/contact-access', authenticate, createContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId', authenticate, deleteContactAccess);

// ── Third Party ──────────────────────────────────────────────────────────────
router.get('/cases/:caseId/third-party', authenticate, getThirdParty);
router.post('/cases/:caseId/third-party', authenticate, upsertThirdParty);

// ── No Fault ─────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/no-fault', authenticate, getNoFault);
router.post('/cases/:caseId/no-fault', authenticate, upsertNoFault);

// ── Medical ──────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/medical', authenticate, getMedical);
router.post('/cases/:caseId/medical', authenticate, upsertMedical);

// ── Employment ───────────────────────────────────────────────────────────────
router.get('/cases/:caseId/employment', authenticate, getEmployment);
router.post('/cases/:caseId/employment', authenticate, upsertEmployment);

// ── Case Modules (Police, Lawyers, Specialist, Initial Interview, Client Info) ─
router.get('/cases/:caseId/police-info', authenticate, getPoliceInfo);
router.post('/cases/:caseId/police-info', authenticate, upsertPoliceInfo);

router.get('/cases/:caseId/lawyers', authenticate, getLawyers);
router.post('/cases/:caseId/lawyers', authenticate, upsertLawyers);

router.get('/cases/:caseId/specialist', authenticate, getSpecialist);
router.post('/cases/:caseId/specialist', authenticate, upsertSpecialist);

router.get('/cases/:caseId/initial-interview', authenticate, getInitialInterview);
router.post('/cases/:caseId/initial-interview', authenticate, upsertInitialInterview);

router.get('/cases/:caseId/client-info', authenticate, getClientInfo);
router.post('/cases/:caseId/client-info', authenticate, upsertClientInfo);

// ── Documents ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/documents', authenticate, getDocumentsByCaseId);
router.post('/cases/:caseId/documents', authenticate, uploadDocument);
router.get('/documents', authenticate, getAllDocuments);
router.delete('/documents/:id', authenticate, deleteDocument);
router.put('/documents/:id', authenticate, renameDocument);

// ── OCF Forms ────────────────────────────────────────────────────────────────
router.get('/cases/:caseId/ocf/:formNumber', authenticate, async (req: any, res: any) => {
  const { caseId, formNumber } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT form_data FROM ocf_form_data WHERE case_id = ? AND form_number = ?',
      [caseId, formNumber]
    ) as any[];
    res.json(rows[0] ? JSON.parse(rows[0].form_data) : {});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/cases/:caseId/ocf/:formNumber', authenticate, async (req: any, res: any) => {
  const { caseId, formNumber } = req.params;
  try {
    await pool.query(
      `INSERT INTO ocf_form_data (id, case_id, form_number, form_data)
       VALUES (UUID(), ?, ?, ?)
       ON DUPLICATE KEY UPDATE form_data = VALUES(form_data)`,
      [caseId, formNumber, JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Users ────────────────────────────────────────────────────────────────────
router.get('/users', authenticate, getUsers);
router.post('/users', authenticate, createUser);
router.delete('/users/:id', authenticate, deleteUser);

// ── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/status-summary', authenticate, getStatusSummary);
router.get('/reports/monthly', authenticate, getMonthly);
router.get('/reports/limitations', authenticate, getLimitations);
router.get('/reports/settlements', authenticate, getSettlements);

// ── Portal ───────────────────────────────────────────────────────────────────
router.get('/portal/cases', authenticate, getPortalCases);
router.get('/portal/documents', authenticate, getPortalDocuments);
router.get('/portal/status-history/:caseId', authenticate, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM status_history WHERE case_id = ? ORDER BY date DESC',
      [req.params.caseId]
    ) as any[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;