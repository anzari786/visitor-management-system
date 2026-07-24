import { Router } from 'express';
import { ssoCallback, logout, getCurrentUser } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { ssoCallbackSchema, meQuerySchema } from './auth.validation.js';

const router = Router();

router.post('/sso/callback', validate(ssoCallbackSchema), ssoCallback);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, validate(meQuerySchema), getCurrentUser);

export default router;
