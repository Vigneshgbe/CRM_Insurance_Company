import { Router } from 'express';
import {
  getDashboardStats,
  getUpcomingLimitations,
  getRecentCases,
  getReferrers,
  getRecentActivities,
  getCaseStatusBreakdown,
  getCaseStatusTrend,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Existing
router.get('/stats',               getDashboardStats);
router.get('/upcoming-limitations', getUpcomingLimitations);
router.get('/recent-cases',         getRecentCases);
router.get('/referrers',            getReferrers);
router.get('/recent-activities',    getRecentActivities);

// New
router.get('/case-status-breakdown', getCaseStatusBreakdown);
router.get('/case-status-trend',     getCaseStatusTrend);

export default router;