import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

// Auth
import { login, getMe } from '../controllers/auth.controller';
// Clients
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clients.controller';
// Cases
import { getCases, getCaseById, getCaseByFileNo, createCase, updateCase, deleteCase } from '../controllers/cases.controller';
// Notes
import { getNotesByCaseId, createNote, updateNote, deleteNote } from '../controllers/notes.controller';
// Activities
import { getActivitiesByCaseId, createActivity, updateActivity, deleteActivity, getRecentActivities } from '../controllers/activities.controller';
// Dashboard
import { getDashboardStats, getUpcomingLimitations, getRecentCases, getReferrers } from '../controllers/dashboard.controller';
// History + Status
import { getHistoryByCaseId, getStatusHistoryByCaseId } from '../controllers/history.controller';
// Settlement
import { getSettlement, upsertSettlement } from '../controllers/settlement.controller';
// Contact Access
import { getContactAccess, createContactAccess, deleteContactAccess } from '../controllers/contact-access.controller';
// Third Party
import { getThirdParty, upsertThirdParty } from '../controllers/third-party.controller';
// No Fault
import { getNoFault, upsertNoFault } from '../controllers/no-fault.controller';
// Medical
import { getMedical, upsertMedical } from '../controllers/medical.controller';
// Employment
import { getEmployment, upsertEmployment } from '../controllers/employment.controller';
// Case Modules (police, lawyers, specialist, initial-interview, client-info)
import {
  getPoliceInfo, upsertPoliceInfo,
  getLawyers, upsertLawyers,
  getSpecialist, upsertSpecialist,
  getInitialInterview, upsertInitialInterview,
  getClientInfo, upsertClientInfo,
} from '../controllers/case-modules.controller';
// Documents
import { getAllDocuments, getDocumentsByCase, uploadDocument, renameDocument, deleteDocument, upload } from '../controllers/documents.controller';
// Misc (users, reports, portal, ocf)
import {
  getUsers, createUser, deleteUser,
  getStatusSummary, getMonthlyStats, getLimitationAlerts, getSettlementsSummary,
  getPortalCases, getPortalDocuments, getPortalStatusHistory,
  getOcfFormData, saveOcfFormData, getOcfPrefill,
} from '../controllers/misc.controller';

const router = Router();

// ── AUTH ──────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// ── DASHBOARD ─────────────────────────────────────────────────
router.get('/dashboard/stats',               authenticate, getDashboardStats);
router.get('/dashboard/upcoming-limitations',authenticate, getUpcomingLimitations);
router.get('/dashboard/recent-cases',        authenticate, getRecentCases);
router.get('/dashboard/recent-activities',   authenticate, getRecentActivities);
router.get('/referrers',                     authenticate, getReferrers);

// ── CLIENTS ───────────────────────────────────────────────────
router.get('/clients',    authenticate, getClients);
router.post('/clients',   authenticate, createClient);
router.get('/clients/:id',  authenticate, getClientById);
router.put('/clients/:id',  authenticate, updateClient);
router.delete('/clients/:id', authenticate, deleteClient);

// ── CASES ─────────────────────────────────────────────────────
router.get('/cases',               authenticate, getCases);
router.post('/cases',              authenticate, createCase);
router.get('/cases/by-file/:fileNo', authenticate, getCaseByFileNo);
router.get('/cases/:id',           authenticate, getCaseById);
router.put('/cases/:id',           authenticate, updateCase);
router.delete('/cases/:id',        authenticate, deleteCase);

// ── CASE TABS ─────────────────────────────────────────────────

// Notes
router.get('/cases/:caseId/notes',                 authenticate, getNotesByCaseId);
router.post('/cases/:caseId/notes',                authenticate, createNote);
router.put('/cases/:caseId/notes/:noteId',         authenticate, updateNote);
router.delete('/cases/:caseId/notes/:noteId',      authenticate, deleteNote);

// Activities
router.get('/cases/:caseId/activities',                   authenticate, getActivitiesByCaseId);
router.post('/cases/:caseId/activities',                  authenticate, createActivity);
router.put('/cases/:caseId/activities/:activityId',       authenticate, updateActivity);
router.delete('/cases/:caseId/activities/:activityId',    authenticate, deleteActivity);

// History + Status
router.get('/cases/:caseId/history',               authenticate, getHistoryByCaseId);
router.get('/cases/:caseId/status-history',        authenticate, getStatusHistoryByCaseId);

// Settlement
router.get('/cases/:caseId/settlement',            authenticate, getSettlement);
router.post('/cases/:caseId/settlement',           authenticate, upsertSettlement);

// Contact Access
router.get('/cases/:caseId/contact-access',                  authenticate, getContactAccess);
router.post('/cases/:caseId/contact-access',                 authenticate, createContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId',    authenticate, deleteContactAccess);

// Third Party
router.get('/cases/:caseId/third-party',           authenticate, getThirdParty);
router.post('/cases/:caseId/third-party',          authenticate, upsertThirdParty);

// No Fault
router.get('/cases/:caseId/no-fault',              authenticate, getNoFault);
router.post('/cases/:caseId/no-fault',             authenticate, upsertNoFault);

// Medical
router.get('/cases/:caseId/medical',               authenticate, getMedical);
router.post('/cases/:caseId/medical',              authenticate, upsertMedical);

// Employment
router.get('/cases/:caseId/employment',            authenticate, getEmployment);
router.post('/cases/:caseId/employment',           authenticate, upsertEmployment);

// Police Info
router.get('/cases/:caseId/police-info',           authenticate, getPoliceInfo);
router.post('/cases/:caseId/police-info',          authenticate, upsertPoliceInfo);

// Lawyers
router.get('/cases/:caseId/lawyers',               authenticate, getLawyers);
router.post('/cases/:caseId/lawyers',              authenticate, upsertLawyers);

// Specialist
router.get('/cases/:caseId/specialist',            authenticate, getSpecialist);
router.post('/cases/:caseId/specialist',           authenticate, upsertSpecialist);

// Initial Interview
router.get('/cases/:caseId/initial-interview',     authenticate, getInitialInterview);
router.post('/cases/:caseId/initial-interview',    authenticate, upsertInitialInterview);

// Client Info (composite)
router.get('/cases/:caseId/client-info',           authenticate, getClientInfo);
router.post('/cases/:caseId/client-info',          authenticate, upsertClientInfo);

// Documents (case level)
router.get('/cases/:caseId/documents',             authenticate, getDocumentsByCase);
router.post('/cases/:caseId/documents',            authenticate, upload.single('file'), uploadDocument);

// OCF Form Data
router.get('/cases/:caseId/ocf/prefill',           authenticate, getOcfPrefill);
router.get('/cases/:caseId/ocf/:formNumber',       authenticate, getOcfFormData);
router.post('/cases/:caseId/ocf/:formNumber',      authenticate, saveOcfFormData);

// ── DOCUMENTS (global) ────────────────────────────────────────
router.get('/documents',          authenticate, getAllDocuments);
router.put('/documents/:id',      authenticate, renameDocument);
router.delete('/documents/:id',   authenticate, deleteDocument);

// ── USERS ─────────────────────────────────────────────────────
router.get('/users',          authenticate, getUsers);
router.post('/users',         authenticate, createUser);
router.delete('/users/:id',   authenticate, deleteUser);

// ── REPORTS ───────────────────────────────────────────────────
router.get('/reports/status-summary',  authenticate, getStatusSummary);
router.get('/reports/monthly',         authenticate, getMonthlyStats);
router.get('/reports/limitations',     authenticate, getLimitationAlerts);
router.get('/reports/settlements',     authenticate, getSettlementsSummary);

// ── CLIENT PORTAL ─────────────────────────────────────────────
router.get('/portal/cases',                         authenticate, getPortalCases);
router.get('/portal/documents',                     authenticate, getPortalDocuments);
router.get('/portal/status-history/:caseId',        authenticate, getPortalStatusHistory);

export default router;
