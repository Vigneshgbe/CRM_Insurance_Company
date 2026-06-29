import { Router } from 'express';
import { generateOcfPdf } from '../controllers/ocf-pdf.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/cases/:caseId/ocf/:formNumber/generate
 *
 * Fills the real OCF PDF template with case data and returns the PDF as a download.
 *
 * Optional POST body fields:
 *   For OCF-6:  { expenses: [{item, date, description, amount}], expenseTotal: "..." }
 *   For OCF-10: { benefitElection: "income_replacement" | "non_earner" | "caregiver" }
 *   Any other field can be overridden by passing it in the body.
 */
router.post('/:caseId/ocf/:formNumber/generate', authenticate, generateOcfPdf);

export default router;