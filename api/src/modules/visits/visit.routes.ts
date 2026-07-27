import { Router } from 'express';
import {
   submitVisitorRequest,
   submitWalkInVisit,
   getVisits,
   getVisit,
   decideApproveVisit,
   decideRejectVisit,
   rescheduleVisitHandler,
   cancelVisitHandler,
} from './visit.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   createVisitRequestSchema,
   createWalkInVisitSchema,
   listVisitsSchema,
   visitIdParamSchema,
   visitDecisionSchema,
   rescheduleVisitSchema,
} from './visit.validation.js';

const router = Router();

// Public self-service visitor request — submitted before any session exists.
router.post(
   '/request',
   validate(createVisitRequestSchema),
   submitVisitorRequest,
);

router.post(
   '/walk-in',
   requireAuth,
   requireRole('RECEPTION', 'ADMIN'),
   validate(createWalkInVisitSchema),
   submitWalkInVisit,
);

router.get('/', requireAuth, validate(listVisitsSchema), getVisits);
router.get('/:id', requireAuth, validate(visitIdParamSchema), getVisit);

router.post(
   '/:id/approve',
   requireAuth,
   requireRole('HOST', 'MANAGER', 'ADMIN'),
   validate(visitDecisionSchema),
   decideApproveVisit,
);

router.post(
   '/:id/reject',
   requireAuth,
   requireRole('HOST', 'MANAGER', 'ADMIN'),
   validate(visitDecisionSchema),
   decideRejectVisit,
);

router.post(
   '/:id/reschedule',
   requireAuth,
   requireRole('HOST', 'MANAGER', 'ADMIN', 'RECEPTION'),
   validate(rescheduleVisitSchema),
   rescheduleVisitHandler,
);

router.post(
   '/:id/cancel',
   requireAuth,
   requireRole('HOST', 'MANAGER', 'ADMIN', 'RECEPTION'),
   validate(visitDecisionSchema),
   cancelVisitHandler,
);

export default router;
