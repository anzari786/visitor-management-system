import { Router } from 'express';
import {
   exportVisitLog,
   getReportStats,
} from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/permission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { exportVisitLogSchema } from '../validations/report.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', getReportStats);
router.get(
   '/export',
   requireRole('admin'),
   validate(exportVisitLogSchema),
   exportVisitLog,
);

export default router;
