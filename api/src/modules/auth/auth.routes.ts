import { Router } from 'express';
import {
   ssoCallback,
   localLogin,
   changePassword,
   forceChangePassword,
   patchCurrentUser,
   checkUsername,
   logout,
   getCurrentUser,
} from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   ssoCallbackSchema,
   localLoginSchema,
   changePasswordSchema,
   forceChangePasswordSchema,
   updateProfileSchema,
   checkUsernameSchema,
   meQuerySchema,
} from './auth.validation.js';

const router = Router();

// Local username/password (Guard / Reception / Admin / Manager)
router.post('/login', validate(localLoginSchema), localLogin);
router.post(
   '/change-password',
   requireAuth,
   validate(changePasswordSchema),
   changePassword,
);
router.post(
   '/force-change-password',
   requireAuth,
   validate(forceChangePasswordSchema),
   forceChangePassword,
);

router.get(
   '/check-username',
   requireAuth,
   validate(checkUsernameSchema),
   checkUsername,
);

// Company SSO (including host employees with linked User accounts)
router.post('/sso/callback', validate(ssoCallbackSchema), ssoCallback);

router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, validate(meQuerySchema), getCurrentUser);
router.patch(
   '/me',
   requireAuth,
   validate(updateProfileSchema),
   patchCurrentUser,
);

export default router;
