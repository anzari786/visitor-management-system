import { Router } from 'express';
import { getBadge, getBadges, postBadge } from '../controllers/badge.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { validate } from '../middlewares/validate.js';
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
