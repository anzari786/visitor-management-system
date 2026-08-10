import { Router } from 'express';
import {
   postBadge,
   getBadges,
   getBadge,
   patchBadge,
   postAssignBadge,
   postReleaseBadge,
   postBadgeLost,
   postBadgeDisabled,
   postRestoreBadge,
} from './badge.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   createBadgeSchema,
   listBadgesSchema,
   badgeIdParamSchema,
   updateBadgeSchema,
   badgeActionSchema,
} from './badge.validation.js';

const router = Router();

router.use(requireAuth);

router.post(
   '/',
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(createBadgeSchema),
   postBadge,
);
router.get('/', validate(listBadgesSchema), getBadges);
router.get('/:id', validate(badgeIdParamSchema), getBadge);
router.patch(
   '/:id',
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(updateBadgeSchema),
   patchBadge,
);

router.post(
   '/:id/assign',
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(badgeIdParamSchema),
   postAssignBadge,
);
router.post(
   '/:id/release',
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(badgeIdParamSchema),
   postReleaseBadge,
);
router.post(
   '/:id/lost',
   requireRole('GUARD', 'RECEPTION', 'ADMIN'),
   validate(badgeActionSchema),
   postBadgeLost,
);
router.post(
   '/:id/disable',
   requireRole('ADMIN'),
   validate(badgeActionSchema),
   postBadgeDisabled,
);
router.post(
   '/:id/restore',
   requireRole('ADMIN'),
   validate(badgeActionSchema),
   postRestoreBadge,
);

export default router;
