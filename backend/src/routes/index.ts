import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

import { login } from '../controllers/auth.controller';

import { getDashboardStats, getRecentCases, getUpcomingLimitations, getReferrers } from '../controllers/dashboard.controller';
import { getRecentActivities, getActivitiesByCaseId, createActivity } from '../controllers/activities.controller';
import { getCases, createCase, getCaseById, updateCase } from '../controllers/cases.controller';
import { getClients, createClient, getClientById, updateClient } from '../controllers/clients.controller';
import { getNotesByCaseId, createNote, deleteNote } from '../controllers/notes.controller';
import { getHistoryByCaseId, getStatusHistoryByCaseId } from '../controllers/history.controller';
import { getContactAccess, createContactAccess, deleteContactAccess } from '../controllers/contact-access.controller';
import { getDocumentsByCase, uploadDocument, getAllDocuments, deleteDocument, renameDocument, upload as docUpload } from '../controllers/documents.controller';
import { getSettlement, upsertSettlement } from '../controllers/settlement.controller';
import { getThirdParty, upsertThirdParty } from '../controllers/third-party.controller';
import { getNoFault, upsertNoFault } from '../controllers/no-fault.controller';
import { getMedical, saveMedical } from '../controllers/medical.controller';
import { getEmployment, saveEmployment } from '../controllers/employment.controller';
import { getPoliceInfo, savePoliceInfo } from '../controllers/police-info.controller';
import { getLawyers, saveLawyers } from '../controllers/lawyers.controller';
import { getSpecialist, saveSpecialist } from '../controllers/specialist.controller';
import { getClientInfo, saveClientInfo } from '../controllers/client-info.controller';
import { getInitialInterview, saveInitialInterview } from '../controllers/initial-interview.controller';
import {
  getUsers, createUser, deleteUser,
  getStatusSummary, getMonthlyStats, getLimitationAlerts, getSettlementsSummary,
  getPortalCases, getPortalDocuments, getPortalStatusHistory,
} from '../controllers/misc.controller';
import { getOcfFormData, saveOcfFormData, getOcfPrefill } from '../controllers/ocf.controller';

import {
  listEditorDocuments,
  getEditorDocument,
  createEditorDocument,
  updateEditorDocument,
  deleteEditorDocument,
} from "../controllers/editor-documents.controller";

const router = Router();

router.get   ("/editor-documents",     authenticate, listEditorDocuments);
router.get   ("/editor-documents/:id", authenticate, getEditorDocument);
router.post  ("/editor-documents",     authenticate, createEditorDocument);
router.put   ("/editor-documents/:id", authenticate, updateEditorDocument);
router.delete("/editor-documents/:id", authenticate, deleteEditorDocument);

// Public
router.post('/auth/login', login);

// Protected
router.use(authenticate);

// Dashboard
router.get('/dashboard/stats',                getDashboardStats);
router.get('/dashboard/recent-cases',         getRecentCases);
router.get('/dashboard/upcoming-limitations', getUpcomingLimitations);
router.get('/dashboard/recent-activities',    getRecentActivities);

// Referrers
router.get('/referrers', getReferrers);

// Cases
router.get('/cases',     getCases);
router.post('/cases',    createCase);
router.get('/cases/:id', getCaseById);
router.put('/cases/:id', updateCase);

// Clients
router.get('/clients',     getClients);
router.post('/clients',    createClient);
router.get('/clients/:id', getClientById);
router.put('/clients/:id', updateClient);

// Notes
router.get('/cases/:caseId/notes',            getNotesByCaseId);
router.post('/cases/:caseId/notes',           createNote);
router.delete('/cases/:caseId/notes/:noteId', deleteNote);

// Activities
router.get('/cases/:caseId/activities',  getActivitiesByCaseId);
router.post('/cases/:caseId/activities', createActivity);

// History
router.get('/cases/:caseId/history',        getHistoryByCaseId);
router.get('/cases/:caseId/status-history', getStatusHistoryByCaseId);

// Contact Access
router.get('/cases/:caseId/contact-access',               getContactAccess);
router.post('/cases/:caseId/contact-access',              createContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId', deleteContactAccess);

// Documents
router.get('/cases/:caseId/documents',  getDocumentsByCase);
router.post('/cases/:caseId/documents', docUpload.single('file'), uploadDocument);
router.get('/documents',                getAllDocuments);
router.put('/documents/:id',            renameDocument);
router.delete('/documents/:id',         deleteDocument);

// Settlement
router.get('/cases/:caseId/settlement',  getSettlement);
router.post('/cases/:caseId/settlement', upsertSettlement);

// Third Party
router.get('/cases/:caseId/third-party',  getThirdParty);
router.post('/cases/:caseId/third-party', upsertThirdParty);

// No Fault
router.get('/cases/:caseId/no-fault',  getNoFault);
router.post('/cases/:caseId/no-fault', upsertNoFault);

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

// OCF Forms
router.get('/cases/:caseId/ocf/prefill',      getOcfPrefill);
router.get('/cases/:caseId/ocf/:formNumber',  getOcfFormData);
router.post('/cases/:caseId/ocf/:formNumber', saveOcfFormData);

// Users
router.get('/users',        getUsers);
router.post('/users',       createUser);
router.delete('/users/:id', deleteUser);

// Reports
router.get('/reports/status-summary', getStatusSummary);
router.get('/reports/monthly',        getMonthlyStats);
router.get('/reports/limitations',    getLimitationAlerts);
router.get('/reports/settlements',    getSettlementsSummary);

// Portal
router.get('/portal/cases',                  getPortalCases);
router.get('/portal/documents',              getPortalDocuments);
router.get('/portal/status-history/:caseId', getPortalStatusHistory);

export default router;