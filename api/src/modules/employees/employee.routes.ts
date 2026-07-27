import { Router } from 'express';
import {
   getEmployees,
   getHostOptions,
   getEmployee,
   runEmployeeSync,
} from './employee.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   listEmployeesSchema,
   searchHostSchema,
   employeeIdParamSchema,
   syncEmployeesSchema,
} from './employee.validation.js';

const router = Router();

router.get('/', requireAuth, validate(listEmployeesSchema), getEmployees);
router.get(
   '/search-host',
   requireAuth,
   validate(searchHostSchema),
   getHostOptions,
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
