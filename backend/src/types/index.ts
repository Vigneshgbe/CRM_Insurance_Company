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

const router = Router();

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/dashboard/upcoming-limitations', authenticate, getUpcomingLimitations);
router.get('/dashboard/recent-cases', authenticate, getRecentCases);
router.get('/dashboard/recent-activities', authenticate, getRecentActivities);

// ── Referrers ─────────────────────────────────────────────────
router.get('/referrers', authenticate, getReferrers);

// ── Clients ───────────────────────────────────────────────────
router.get('/clients', authenticate, getClients);
router.get('/clients/:id', authenticate, getClientById);
router.post('/clients', authenticate, createClient);
router.put('/clients/:id', authenticate, updateClient);
router.delete('/clients/:id', authenticate, deleteClient);

// ── Cases ─────────────────────────────────────────────────────
router.get('/cases', authenticate, getCases);
router.get('/cases/by-file/:fileNo', authenticate, getCaseByFileNo);
router.get('/cases/:id', authenticate, getCaseById);
router.post('/cases', authenticate, createCase);
router.put('/cases/:id', authenticate, updateCase);
router.delete('/cases/:id', authenticate, deleteCase);

// ── Notes ─────────────────────────────────────────────────────
router.get('/cases/:caseId/notes', authenticate, getNotesByCaseId);
router.post('/cases/:caseId/notes', authenticate, createNote);
router.put('/cases/:caseId/notes/:noteId', authenticate, updateNote);
router.delete('/cases/:caseId/notes/:noteId', authenticate, deleteNote);

// ── Activities ────────────────────────────────────────────────
router.get('/cases/:caseId/activities', authenticate, getActivitiesByCaseId);
router.post('/cases/:caseId/activities', authenticate, createActivity);
router.put('/cases/:caseId/activities/:activityId', authenticate, updateActivity);
router.delete('/cases/:caseId/activities/:activityId', authenticate, deleteActivity);

// ── History ───────────────────────────────────────────────────
router.get('/cases/:caseId/history', authenticate, getHistoryByCaseId);
router.get('/cases/:caseId/status-history', authenticate, getStatusHistoryByCaseId);

// ── Settlement ────────────────────────────────────────────────
router.get('/cases/:caseId/settlement', authenticate, getSettlement);
router.post('/cases/:caseId/settlement', authenticate, upsertSettlement);

// ── Contact Access ────────────────────────────────────────────
router.get('/cases/:caseId/contact-access', authenticate, getContactAccess);
router.post('/cases/:caseId/contact-access', authenticate, createContactAccess);
router.delete('/cases/:caseId/contact-access/:contactId', authenticate, deleteContactAccess);

export default router;
