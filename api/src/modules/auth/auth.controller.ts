import type { Request, Response } from 'express';
import type { z } from 'zod';
import { NotFoundError } from '../../lib/errors.js';
import {
   exchangeSsoCode,
   resolveUserBySubject,
   verifyCredentials,
   changePassword as changePasswordService,
   getAuthUserById,
   buildSessionUser,
   formatAuthUser,
} from './auth.service.js';
import type {
   ssoCallbackSchema,
   localLoginSchema,
   changePasswordSchema,
} from './auth.validation.js';

type SsoCallbackBody = z.infer<typeof ssoCallbackSchema>['body'];
type LocalLoginBody = z.infer<typeof localLoginSchema>['body'];
type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];

const establishSession = (
   req: Request,
   res: Response,
   user: NonNullable<Awaited<ReturnType<typeof getAuthUserById>>>,
   extras?: Record<string, unknown>,
) => {
   req.session.regenerate((error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Session error',
         });
      }

      const sessionUser = buildSessionUser(user);
      req.session.userId = sessionUser.userId;
      req.session.roleCodes = sessionUser.roleCodes;

      return res.status(200).json({
         success: true,
         message: 'Login successful',
         data: {
            user: formatAuthUser(user),
            ...extras,
         },
      });
   });
};

/** Company SSO — hosts and staff provisioned with an externalSubject. */
export const ssoCallback = async (req: Request, res: Response) => {
   const { code, redirectUri } = req.validatedBody as SsoCallbackBody;

   const ssoToken = await exchangeSsoCode(code, redirectUri);
   const user = await resolveUserBySubject(ssoToken.subject);

   establishSession(req, res, user);
};

/** Local username/password login for Guard / Reception / Admin / Manager. */
export const localLogin = async (req: Request, res: Response) => {
   const { username, password } = req.validatedBody as LocalLoginBody;

   const credentialCheck = await verifyCredentials(username, password);
   const user = await getAuthUserById(credentialCheck.id);

   if (!user) {
      return res
         .status(500)
         .json({ success: false, message: 'User record inconsistent' });
   }

   establishSession(req, res, user, {
      mustChangePassword: credentialCheck.mustChangePassword,
   });
};

export const changePassword = async (req: Request, res: Response) => {
   const { currentPassword, newPassword } =
      req.validatedBody as ChangePasswordBody;

   await changePasswordService(
      req.session.userId!,
      currentPassword,
      newPassword,
   );

   return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
   });
};

export const logout = (req: Request, res: Response) => {
   req.session.destroy((error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Logout failed',
         });
      }

      res.clearCookie('vms.sid');

      return res.status(200).json({
         success: true,
         message: 'Logged out successfully',
      });
   });
};

export const getCurrentUser = async (req: Request, res: Response) => {
   const user = await getAuthUserById(req.session.userId!);

   if (!user) {
      throw new NotFoundError('User not found');
   }

   return res.status(200).json({
      success: true,
      data: formatAuthUser(user),
   });
};
