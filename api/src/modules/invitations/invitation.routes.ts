import { Router } from 'express';
import {
   submitInvitation,
   getInvitations,
   getInvitation,
   markInvitationArrived,
   convertInvitationHandler,
   rejectInvitationHandler,
   cancelInvitationHandler,
} from './invitation.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   createInvitationSchema,
   listInvitationsSchema,
   invitationIdParamSchema,
   invitationDecisionSchema,
   convertInvitationSchema,
} from './invitation.validation.js';

const router = Router();

router.post(
   '/',
   requireAuth,
   requireRole('HOST', 'GUARD', 'ADMIN'),
   validate(createInvitationSchema),
   submitInvitation,
);

router.get('/', requireAuth, validate(listInvitationsSchema), getInvitations);
router.get(
   '/:id',
   requireAuth,
   validate(invitationIdParamSchema),
   getInvitation,
);

router.post(
   '/:id/arrival',
   requireAuth,
   requireRole('GUARD', 'ADMIN'),
   validate(invitationIdParamSchema),
   markInvitationArrived,
);

router.post(
   '/:id/convert',
   requireAuth,
   requireRole('GUARD', 'HOST', 'MANAGER', 'ADMIN'),
   validate(convertInvitationSchema),
   convertInvitationHandler,
);

router.post(
   '/:id/reject',
   requireAuth,
   requireRole('GUARD', 'HOST', 'MANAGER', 'ADMIN'),
   validate(invitationDecisionSchema),
   rejectInvitationHandler,
);

router.post(
   '/:id/cancel',
   requireAuth,
   requireRole('HOST', 'MANAGER', 'ADMIN', 'GUARD'),
   validate(invitationDecisionSchema),
   cancelInvitationHandler,
);

export default router;
