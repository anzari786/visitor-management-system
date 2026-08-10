import { Router } from 'express';
import {
   postUser,
   getUsers,
   getUser,
   patchUser,
   postUserRole,
   deleteUserRole,
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

export default router;
