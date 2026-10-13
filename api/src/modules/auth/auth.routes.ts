import { Router } from 'express';
import {
   ssoCallback,
   developmentSsoLogin,
   localLogin,
   changePassword,
   completePasswordSetupHandler,
   logout,
   getCurrentUser,
   updateCurrentUser,
} from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   ssoCallbackSchema,
   localLoginSchema,
   changePasswordSchema,
   completePasswordSetupSchema,
   meQuerySchema,
   updateProfileSchema,
} from './auth.validation.js';

const router = Router();

// Local username/password (Guard / Reception / Admin / Manager)
router.post('/login', validate(localLoginSchema), localLogin);
router.post(
   '/password/setup/complete',
   validate(completePasswordSetupSchema),
   completePasswordSetupHandler,
);
router.post(
   '/change-password',
   requireAuth,
   validate(changePasswordSchema),
   changePassword,
);

// Company SSO (including host employees with linked User accounts)
router.post('/dev-sso-login', developmentSsoLogin);
router.post('/sso/callback', validate(ssoCallbackSchema), ssoCallback);

router.post('/logout', requireAuth, logout);
router.patch('/me', requireAuth, validate(updateProfileSchema), updateCurrentUser);
router.get('/me', requireAuth, validate(meQuerySchema), getCurrentUser);

export default router;
