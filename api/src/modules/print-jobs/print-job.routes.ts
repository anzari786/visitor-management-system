import { Router } from 'express';
import {
   getNextPrintJob,
   postPrintJobPrinting,
   postPrintJobComplete,
   postPrintJobFail,
   postPrintJobRetry,
   getPrintJob,
} from './print-job.controller.js';
import { requirePrintAgent } from '../../middleware/print-agent.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   printJobIdParamSchema,
   claimPrintJobSchema,
   completePrintJobSchema,
   failPrintJobSchema,
   nextPrintJobSchema,
} from './print-job.validation.js';

const router = Router();

const deskStaff = requireRole('GUARD', 'RECEPTION', 'ADMIN');

// ── Print Agent endpoints (Bearer token) ───────────────────────────────────

router.get(
   '/next',
   requirePrintAgent,
   validate(nextPrintJobSchema),
   getNextPrintJob,
);

router.post(
   '/:id/printing',
   requirePrintAgent,
   validate(claimPrintJobSchema),
   postPrintJobPrinting,
);

router.post(
   '/:id/complete',
   requirePrintAgent,
   validate(completePrintJobSchema),
   postPrintJobComplete,
);

router.post(
   '/:id/fail',
   requirePrintAgent,
   validate(failPrintJobSchema),
   postPrintJobFail,
);

// ── Desk endpoints (session auth) ──────────────────────────────────────────

router.get(
   '/:id',
   requireAuth,
   deskStaff,
   validate(printJobIdParamSchema),
   getPrintJob,
);

router.post(
   '/:id/retry',
   requireAuth,
   deskStaff,
   validate(printJobIdParamSchema),
   postPrintJobRetry,
);

export default router;
