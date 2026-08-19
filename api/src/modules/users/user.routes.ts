import { Router } from 'express';
import {
   postUser,
   getUsers,
   getUser,
   patchUser,
   postUserRole,
   deleteUserRole,
   postResetPassword,
} from './user.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   createUserSchema,
   listUsersSchema,
   userIdParamSchema,
   updateUserSchema,
   assignRoleSchema,
   removeRoleParamSchema,
   resetPasswordParamSchema,
} from './user.validation.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.post('/', validate(createUserSchema), postUser);
router.get('/', validate(listUsersSchema), getUsers);
router.get('/:id', validate(userIdParamSchema), getUser);
router.patch('/:id', validate(updateUserSchema), patchUser);

router.post('/:id/roles', validate(assignRoleSchema), postUserRole);
router.delete(
   '/:id/roles/:role',
   validate(removeRoleParamSchema),
   deleteUserRole,
);
router.post(
   '/:id/reset-password',
   validate(resetPasswordParamSchema),
   postResetPassword,
);

export default router;
