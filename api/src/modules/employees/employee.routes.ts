import { Router } from 'express';
import {
   getEmployees,
   getHostOptions,
   getEmployee,
   runEmployeeSync,
   getMyPendingApprovalVisits,
   getMyUpcomingVisits,
} from './employee.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   listEmployeesSchema,
   searchHostSchema,
   employeeIdParamSchema,
   syncEmployeesSchema,
   listMyVisitsSchema,
} from './employee.validation.js';

const router = Router();

router.get('/', requireAuth, validate(listEmployeesSchema), getEmployees);
router.get('/search-host', validate(searchHostSchema), getHostOptions);

router.get(
   '/me/visits/pending-approvals',
   requireAuth,
   validate(listMyVisitsSchema),
   getMyPendingApprovalVisits,
);
router.get(
   '/me/visits/upcoming',
   requireAuth,
   validate(listMyVisitsSchema),
   getMyUpcomingVisits,
);

router.get('/:id', requireAuth, validate(employeeIdParamSchema), getEmployee);

router.post(
   '/sync',
   requireAuth,
   requireRole('ADMIN'),
   validate(syncEmployeesSchema),
   runEmployeeSync,
);

export default router;
