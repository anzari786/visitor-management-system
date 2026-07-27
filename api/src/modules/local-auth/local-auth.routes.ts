// TODO: Remove this entire module after SSO integration
import { Router } from 'express';
import { localLogin, changePassword } from './local-auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   localLoginSchema,
   changePasswordSchema,
} from './local-auth.validation.js';

const router = Router();

router.post('/login', validate(localLoginSchema), localLogin);
router.post(
   '/change-password',
   requireAuth,
   validate(changePasswordSchema),
   changePassword,
);

// Logout and "current user" are intentionally NOT duplicated here.
// POST /api/auth/logout and GET /api/auth/me from the existing SSO
// module already work for local sessions — they only read/destroy
// req.session, which local login populates identically.

export default router;
