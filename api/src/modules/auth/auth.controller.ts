import type { Request, Response } from 'express';
import { NotFoundError } from '../../lib/errors.js';
import {
   destroyUserSession,
   establishUserSession,
} from '../../lib/session.js';
import {
   exchangeSsoCode,
   resolveUserBySubject,
   verifyCredentials,
   changePassword as changePasswordService,
   forceChangePassword as forceChangePasswordService,
   updateProfile as updateProfileService,
   checkUsernameAvailability,
   getAuthUserById,
   buildSessionUser,
   formatAuthUser,
} from './auth.service.js';
import type {
   ssoCallbackSchema,
   localLoginSchema,
   changePasswordSchema,
   forceChangePasswordSchema,
   updateProfileSchema,
   checkUsernameSchema,
} from './auth.validation.js';
import type { z } from 'zod';

type SsoCallbackBody = z.infer<typeof ssoCallbackSchema>['body'];
type LocalLoginBody = z.infer<typeof localLoginSchema>['body'];
type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];
type ForceChangePasswordBody = z.infer<
   typeof forceChangePasswordSchema
>['body'];
type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body'];
type CheckUsernameQuery = z.infer<typeof checkUsernameSchema>['query'];

const loginResponse = (
   res: Response,
   user: NonNullable<Awaited<ReturnType<typeof getAuthUserById>>>,
   extras?: Record<string, unknown>,
) =>
   res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
         user: formatAuthUser(user),
         ...extras,
      },
   });

/** Company SSO — hosts and staff provisioned with an externalSubject. */
export const ssoCallback = async (req: Request, res: Response) => {
   const { code, redirectUri } = req.validatedBody as SsoCallbackBody;

   const ssoToken = await exchangeSsoCode(code, redirectUri);
   const user = await resolveUserBySubject(ssoToken.subject);
   const sessionUser = buildSessionUser(user);

   await establishUserSession(
      req,
      sessionUser.userId,
      sessionUser.roleCodes,
   );

   return loginResponse(res, user);
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

   const sessionUser = buildSessionUser(user);
   await establishUserSession(
      req,
      sessionUser.userId,
      sessionUser.roleCodes,
   );

   return loginResponse(res, user, {
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
      req.sessionID,
   );

   return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
   });
};

export const forceChangePassword = async (req: Request, res: Response) => {
   const { newPassword } = req.validatedBody as ForceChangePasswordBody;

   const user = await forceChangePasswordService(
      req.session.userId!,
      newPassword,
      req.sessionID,
   );

   return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: formatAuthUser(user),
   });
};

export const patchCurrentUser = async (req: Request, res: Response) => {
   const input = req.validatedBody as UpdateProfileBody;

   const user = await updateProfileService(req.session.userId!, input);

   return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatAuthUser(user),
   });
};

export const checkUsername = async (req: Request, res: Response) => {
   const { username } = req.validatedQuery as CheckUsernameQuery;

   const data = await checkUsernameAvailability(username, req.session.userId);

   return res.status(200).json({
      success: true,
      data,
   });
};

export const logout = async (req: Request, res: Response) => {
   try {
      await destroyUserSession(req, res);
      return res.status(200).json({
         success: true,
         message: 'Logged out successfully',
      });
   } catch {
      return res.status(500).json({
         success: false,
         message: 'Logout failed',
      });
   }
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
