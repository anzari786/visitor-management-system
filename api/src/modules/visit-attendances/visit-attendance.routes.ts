import { Router } from 'express';
import {
   getAttendances,
   getDailyAttendances,
   getAttendance,
   postCheckIn,
   postCheckOut,
   postNoShow,
} from './visit-attendance.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   checkInSchema,
   listAttendancesSchema,
   dailyAttendanceSchema,
   attendanceIdParamSchema,
} from './visit-attendance.validation.js';

const router = Router();

// Static segments declared before ':id' so they aren't swallowed by it.
router.get('/', requireAuth, validate(listAttendancesSchema), getAttendances);
router.get(
   '/daily',
   requireAuth,
   validate(dailyAttendanceSchema),
   getDailyAttendances,
);
router.get(
   '/:id',
   requireAuth,
   validate(attendanceIdParamSchema),
   getAttendance,
);

router.post(
   '/check-in',
   requireAuth,
   requireRole('Guard', 'ADMIN'),
   validate(checkInSchema),
   postCheckIn,
);

router.post(
   '/:id/check-out',
   requireAuth,
   requireRole('Guard', 'ADMIN'),
   validate(attendanceIdParamSchema),
   postCheckOut,
);

router.post(
   '/:id/no-show',
   requireAuth,
   requireRole('Guard', 'ADMIN'),
   validate(attendanceIdParamSchema),
   postNoShow,
);

export default router;
