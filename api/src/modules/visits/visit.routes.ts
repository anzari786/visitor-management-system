import { Router } from 'express';
import {
   submitVisitorRequest,
   submitWalkInVisit,
   submitHostInvitation,
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
   createHostInvitationSchema,
   listVisitsSchema,
   visitIdParamSchema,
   visitDecisionSchema,
   approveVisitSchema,
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
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(createWalkInVisitSchema),
   submitWalkInVisit,
);

router.post(
   '/invite',
   requireAuth,
   validate(createHostInvitationSchema),
   submitHostInvitation,
);

router.get('/', requireAuth, validate(listVisitsSchema), getVisits);
router.get('/:id', requireAuth, validate(visitIdParamSchema), getVisit);

// Host (linked employee) or decision staff — enforced in the service layer.
router.post(
   '/:id/approve',
   requireAuth,
   validate(approveVisitSchema),
   decideApproveVisit,
);

router.post(
   '/:id/reject',
   requireAuth,
   validate(visitDecisionSchema),
   decideRejectVisit,
);

router.post(
   '/:id/reschedule',
   requireAuth,
   validate(rescheduleVisitSchema),
   rescheduleVisitHandler,
);

router.post(
   '/:id/cancel',
   requireAuth,
   validate(visitDecisionSchema),
   cancelVisitHandler,
);

export default router;
