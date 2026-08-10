import { Router } from 'express';
import {
   getSettings,
   updateGeneralSettings,
} from '../controllers/setting.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/permission.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateGeneralSettingsSchema } from '../validations/setting.validation.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', getSettings);
router.patch(
   '/general',
   validate(updateGeneralSettingsSchema),
   updateGeneralSettings,
);

export default router;
