import type { Request, Response } from 'express';
import { NotFoundError } from '../../lib/errors.js';
import {
   exchangeSsoCode,
   resolveUserBySubject,
   getAuthUserById,
   buildSessionUser,
   formatAuthUser,
} from './auth.service.js';
import type { ssoCallbackSchema } from './auth.validation.js';
import type { z } from 'zod';

type SsoCallbackBody = z.infer<typeof ssoCallbackSchema>['body'];

export const ssoCallback = async (req: Request, res: Response) => {
   const { code, redirectUri } = req.validatedBody as SsoCallbackBody;

   const ssoToken = await exchangeSsoCode(code, redirectUri);
   const user = await resolveUserBySubject(ssoToken.subject);

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
         data: { user: formatAuthUser(user) },
      });
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
   const userId = req.session.userId;

   const user = await getAuthUserById(userId);

   if (!user) {
      throw new NotFoundError('User not found');
   }

   return res.status(200).json({
      success: true,
      data: formatAuthUser(user),
   });
};
