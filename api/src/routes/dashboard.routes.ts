import { Router } from 'express';
import {
   getVisitStats,
   getVisitGrowth,
   getDepartmentVisits,
} from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
   dashboardStatsSchema,
   visitGrowthSchema,
   departmentVisitsSchema,
} from '../validations/dashboard.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', validate(dashboardStatsSchema), getVisitStats);
router.get('/visit-growth', validate(visitGrowthSchema), getVisitGrowth);
router.get(
   '/department-visits',
   validate(departmentVisitsSchema),
   getDepartmentVisits,
);

export default router;
