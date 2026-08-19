import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   getGrowth,
   getMeetingTypes,
   getStats,
   getVisitStatuses,
} from './dashboard.controller.js';
import {
   chartRangeSchema,
   dashboardStatsSchema,
   visitGrowthSchema,
} from './dashboard.validation.js';

const router = Router();

router.use(requireAuth);

/** Summary cards + operational counters. */
router.get('/stats', validate(dashboardStatsSchema), getStats);

/** Weekly visit creation trend for the growth chart. */
router.get('/visit-growth', validate(visitGrowthSchema), getGrowth);

/** VisitPurpose breakdown for the meeting-type pie chart. */
router.get('/meeting-types', validate(chartRangeSchema), getMeetingTypes);

/** VisitStatus breakdown (includes partial check-in/out). */
router.get('/visit-statuses', validate(chartRangeSchema), getVisitStatuses);

export default router;
