import { Router } from 'express';
import {
   getNotifications,
   getUnreadNotificationCount,
   patchNotificationRead,
   postMarkAllRead,
} from './notification.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   listNotificationsSchema,
   notificationIdParamSchema,
} from './notification.validation.js';

const router = Router();

router.use(requireAuth);

// Static segments declared before ':id' so they aren't swallowed by it.
router.get('/', validate(listNotificationsSchema), getNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.post('/read-all', postMarkAllRead);

router.patch(
   '/:id/read',
   validate(notificationIdParamSchema),
   patchNotificationRead,
);

export default router;
