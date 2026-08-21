import { Router } from 'express';
import {
   getAttendances,
   getDailyAttendances,
   getAttendance,
   lookupVisitForCheckIn,
   lookupVisitorForCheckOut,
   postCheckIn,
   postCheckOut,
   postNoShow,
   getPrintStatus,
   postRetryPrint,
} from './visit-attendance.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   checkInSchema,
   listAttendancesSchema,
   dailyAttendanceSchema,
   attendanceIdParamSchema,
   lookupVisitByCodeSchema,
   lookupBadgeByCodeSchema,
} from './visit-attendance.validation.js';

const router = Router();

const deskStaff = requireRole('GUARD', 'RECEPTION', 'ADMIN');

// Static segments declared before ':id' so they aren't swallowed by it.
router.get('/', requireAuth, validate(listAttendancesSchema), getAttendances);
router.get(
   '/daily',
   requireAuth,
   validate(dailyAttendanceSchema),
   getDailyAttendances,
);

// QR / code lookups (scan → verify → then call check-in / check-out)
router.get(
   '/lookup/visit',
   requireAuth,
   deskStaff,
   validate(lookupVisitByCodeSchema),
   lookupVisitForCheckIn,
);

/** Printed badge token lookup (path kept as /lookup/badge for desk scanners). */
router.get(
   '/lookup/badge',
   requireAuth,
   deskStaff,
   validate(lookupBadgeByCodeSchema),
   lookupVisitorForCheckOut,
);

router.post(
   '/check-in',
   requireAuth,
   deskStaff,
   validate(checkInSchema),
   postCheckIn,
);

router.get(
   '/:id',
   requireAuth,
   validate(attendanceIdParamSchema),
   getAttendance,
);

router.get(
   '/:id/print-status',
   requireAuth,
   deskStaff,
   validate(attendanceIdParamSchema),
   getPrintStatus,
);

router.post(
   '/:id/retry-print',
   requireAuth,
   deskStaff,
   validate(attendanceIdParamSchema),
   postRetryPrint,
);

router.post(
   '/:id/check-out',
   requireAuth,
   deskStaff,
   validate(attendanceIdParamSchema),
   postCheckOut,
);

router.post(
   '/:id/no-show',
   requireAuth,
   deskStaff,
   validate(attendanceIdParamSchema),
   postNoShow,
);

export default router;
