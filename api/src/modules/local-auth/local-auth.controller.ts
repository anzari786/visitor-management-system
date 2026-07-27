// TODO: Remove this entire module after SSO integration
import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   verifyCredentials,
   changePassword as changePasswordService,
} from './local-auth.service.js';
import {
   getAuthUserById,
   buildSessionUser,
   formatAuthUser,
} from '../auth/auth.service.js';
import type {
   localLoginSchema,
   changePasswordSchema,
} from './local-auth.validation.js';

type LoginBody = z.infer<typeof localLoginSchema>['body'];
type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];

/** TODO: Remove after SSO integration */
export const localLogin = async (req: Request, res: Response) => {
   const { username, password } = req.validatedBody as LoginBody;

   const credentialCheck = await verifyCredentials(username, password);

   // Reuse the exact same shared select/format the SSO flow uses, so the
   // response shape and session contents are indistinguishable either way.
   const user = await getAuthUserById(credentialCheck.id);
   if (!user) {
      return res
         .status(500)
         .json({ success: false, message: 'User record inconsistent' });
   }

   req.session.regenerate((error) => {
      if (error) {
         return res
            .status(500)
            .json({ success: false, message: 'Session error' });
      }

      const sessionUser = buildSessionUser(user);
      req.session.userId = sessionUser.userId;
      req.session.roleCodes = sessionUser.roleCodes;

      return res.status(200).json({
         success: true,
         message: 'Login successful',
         data: {
            user: formatAuthUser(user),
            mustChangePassword: credentialCheck.mustChangePassword, // TODO: Remove after SSO integration
         },
      });
   });
};

/** TODO: Remove after SSO integration */
export const changePassword = async (req: Request, res: Response) => {
   const { currentPassword, newPassword } =
      req.validatedBody as ChangePasswordBody;
   const userId = req.session.userId!;

   await changePasswordService(userId, currentPassword, newPassword);

   return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
   });
};
