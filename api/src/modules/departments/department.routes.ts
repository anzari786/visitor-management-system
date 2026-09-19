import { Router } from 'express';
import {
   getDepartments,
   runDepartmentSync,
} from './department.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   listDepartmentsSchema,
   syncDepartmentsSchema,
} from './department.validation.js';

const router = Router();

router.get(
   '/',
   requireAuth,
   validate(listDepartmentsSchema),
   getDepartments,
);

router.post(
   '/sync',
   requireAuth,
   requireRole('ADMIN'),
   validate(syncDepartmentsSchema),
   runDepartmentSync,
);

export default router;