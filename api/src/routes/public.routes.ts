import { Router } from 'express';
import { getPublicBadgeByQr } from '../controllers/public-badge.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { publicBadgeLookupSchema } from '../validations/public-badge.validation.js';

const router = Router();

// Unauthenticated — opened when a physical badge QR is scanned.
router.get('/badges', validate(publicBadgeLookupSchema), getPublicBadgeByQr);

export default router;
