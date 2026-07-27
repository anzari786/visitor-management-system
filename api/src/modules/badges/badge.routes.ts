import { Router } from 'express';
import {
   postBadge,
   getBadges,
   getBadge,
   patchBadge,
   postAssignBadge,
   postReleaseBadge,
   postBadgeLost,
   postBadgeDamaged,
   postRestoreBadge,
   postRetireBadge,
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
   requireRole('GUARD', 'ADMIN'),
   validate(createBadgeSchema),
   postBadge,
);
router.get('/', validate(listBadgesSchema), getBadges);
router.get('/:id', validate(badgeIdParamSchema), getBadge);
router.patch(
   '/:id',
   requireRole('GUARD', 'ADMIN'),
   validate(updateBadgeSchema),
   patchBadge,
);

router.post(
   '/:id/assign',
   requireRole('GUARD', 'ADMIN'),
   validate(badgeIdParamSchema),
   postAssignBadge,
);
router.post(
   '/:id/release',
   requireRole('GUARD', 'ADMIN'),
   validate(badgeIdParamSchema),
   postReleaseBadge,
);
router.post(
   '/:id/lost',
   requireRole('GUARD', 'ADMIN'),
   validate(badgeActionSchema),
   postBadgeLost,
);
router.post(
   '/:id/damaged',
   requireRole('GUARD', 'ADMIN'),
   validate(badgeActionSchema),
   postBadgeDamaged,
);
router.post(
   '/:id/restore',
   requireRole('ADMIN'),
   validate(badgeActionSchema),
   postRestoreBadge,
);
router.post(
   '/:id/retire',
   requireRole('ADMIN'),
   validate(badgeActionSchema),
   postRetireBadge,
);

export default router;
