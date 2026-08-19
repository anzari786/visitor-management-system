import { Router } from 'express';
import { getBadge, getBadges, postBadge } from '../controllers/badge.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
   badgeIdParamSchema,
   createBadgeSchema,
   listBadgesSchema,
} from '../validations/badge.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createBadgeSchema), postBadge);
router.get('/', validate(listBadgesSchema), getBadges);
router.get('/:id', validate(badgeIdParamSchema), getBadge);

export default router;
