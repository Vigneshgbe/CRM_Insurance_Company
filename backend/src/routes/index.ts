import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

// ── Controllers ──────────────────────────────────────────────────────────────
import { login } from '../controllers/auth.controller';
import { getDashboardStats, getRecentCases, getUpcomingLimitations, getRecentActivities } from '../controllers/dashboard.controller';
import { getCases, createCase, getCaseById, updateCase } from '../controllers/cases.controller';
import { getClients, createClient, getClientById, updateClient } from '../controllers/clients.controller';
import { getNotes, createNote, deleteNote } from '../controllers/notes.controller';
import { getActivities, createActivity } from '../controllers/activities.controller';
import { getHistory } from '../controllers/history.controller';
import { getStatusHistory, addStatus } from '../controllers/status.controller';
import { getContactAccess, addContactAccess, deleteContactAccess } from '../controllers/contact-access.controller';
import { getDocumentsByCase, uploadDocument, getAllDocuments, deleteDocument, renameDocument, upload as docUpload } from '../controllers/documents.controller';
import { getSettlement, saveSettlement } from '../controllers/settlement.controller';
import { getThirdParty, saveThirdParty } from '../controllers/third-party.controller';
import { getNoFault, saveNoFault } from '../controllers/no-fault.controller';
import { getMedical, saveMedical } from '../controllers/medical.controller';
import { getEmployment, saveEmployment } from '../controllers/employment.controller';
import { getPoliceInfo, savePoliceInfo } from '../controllers/police-info.controller';
import { getLawyers, saveLawyers } from '../controllers/lawyers.controller';
import { getSpecialist, saveSpecialist } from '../controllers/specialist.controller';
import { getClientInfo, saveClientInfo } from '../controllers/client-info.controller';
import { getInitialInterview, saveInitialInterview } from '../controllers/initial-interview.controller';
import { getOcfData, saveOcfData } from '../controllers/ocf.controller';
import { getUsers, createUser, deleteUser } from '../controllers/users.controller';
import { getReportStatusSummary, getReportMonthly, getReportLimitations, getReportSettlements } from '../controllers/reports.controller';
import { getPortalCases, getPortalDocuments, uploadPortalDocument, getPortalStatusHistory } from '../controllers/portal.controller';

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.post('/auth/login', login);

// ── All routes below require JWT ─────────────────────────────────────────────
router.use(authenticate);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',                getDashboardStats);
router.get('/dashboard/recent-cases',         getRecentCases);
router.get('/dashboard/upcoming-limitations', getUpcomingLimitations);
router.get('/dashboard/recent-activities',    getRecentActivities);

// ── Cases ─────────────────────────────────────────────────────────────────────
router.get('/cases',      getCases);
router.post('/cases',     createCase);
router.get('/cases/:id',  getCaseById);
router.put('/cases/:id',  updateCase);

// ── Clients ───────────────────────────────────────────────────────────────────
router.get('/clients',      getClients);
router.post('/clients',     createClient);
router.get('/clients/:id',  getClientById);
router.put('/clients/:id',  updateClient);

// ── Case Tabs ─────────────────────────────────────────────────────────────────

// Notes
router.get('/cases/:caseId/notes',           getNotes);
router.post('/cases/:caseId/notes',          createNote);
router.delete('/cases/:caseId/notes/:noteId', deleteNote);

// Activities
router.get('/cases/:caseId/activities',  getActivities);
router.post('/cases/:caseId/activities', createActivity);

// History
router.get('/cases/:caseId/history', getHistory);

// Status
router.get('/cases/:caseId/status-history', getStatusHistory);
router.post('/cases/:caseId/status',        addStatus);

// Contact Access
router.get('/cases/:caseId/contact-access',                   getContactAccess);
router.post('/cases/:caseId/contact-access',                  addContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId',     deleteContactAccess);

// Documents (case-scoped)
router.get('/cases/:caseId/documents',  getDocumentsByCase);
router.post('/cases/:caseId/documents', docUpload.single('file'), uploadDocument);

// Settlement
router.get('/cases/:caseId/settlement',  getSettlement);
router.post('/cases/:caseId/settlement', saveSettlement);

// Third Party
router.get('/cases/:caseId/third-party',  getThirdParty);
router.post('/cases/:caseId/third-party', saveThirdParty);

// No Fault
router.get('/cases/:caseId/no-fault',  getNoFault);
router.post('/cases/:caseId/no-fault', saveNoFault);

// Medical
router.get('/cases/:caseId/medical',  getMedical);
router.post('/cases/:caseId/medical', saveMedical);

// Employment
router.get('/cases/:caseId/employment',  getEmployment);
router.post('/cases/:caseId/employment', saveEmployment);

// Police Info
router.get('/cases/:caseId/police-info',  getPoliceInfo);
router.post('/cases/:caseId/police-info', savePoliceInfo);

// Lawyers
router.get('/cases/:caseId/lawyers',  getLawyers);
router.post('/cases/:caseId/lawyers', saveLawyers);

// Specialist
router.get('/cases/:caseId/specialist',  getSpecialist);
router.post('/cases/:caseId/specialist', saveSpecialist);

// Client Info
router.get('/cases/:caseId/client-info',  getClientInfo);
router.post('/cases/:caseId/client-info', saveClientInfo);

// Initial Interview
router.get('/cases/:caseId/initial-interview',  getInitialInterview);
router.post('/cases/:caseId/initial-interview', saveInitialInterview);

// OCF Forms data (save/load per form number)
router.get('/cases/:caseId/ocf/:formNumber',  getOcfData);
router.post('/cases/:caseId/ocf/:formNumber', saveOcfData);

// ── Documents (global) ────────────────────────────────────────────────────────
router.get('/documents',       getAllDocuments);
router.put('/documents/:id',   renameDocument);
router.delete('/documents/:id', deleteDocument);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',         getUsers);
router.post('/users',        createUser);
router.delete('/users/:id',  deleteUser);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/status-summary', getReportStatusSummary);
router.get('/reports/monthly',        getReportMonthly);
router.get('/reports/limitations',    getReportLimitations);
router.get('/reports/settlements',    getReportSettlements);

// ── Portal (client role) ──────────────────────────────────────────────────────
router.get('/portal/cases',                      getPortalCases);
router.get('/portal/documents',                  getPortalDocuments);
router.post('/portal/documents',                 docUpload.single('file'), uploadPortalDocument);
router.get('/portal/status-history/:caseId',     getPortalStatusHistory);

export default router;
