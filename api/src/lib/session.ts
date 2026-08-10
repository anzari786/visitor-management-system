import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import type { RoleName } from '../generated/prisma/client.js';
import { SESSION_COOKIE_NAME } from '../config/session.js';
import { env } from '../config/env.js';

/**
 * Regenerates the session id (session fixation protection), stores the
 * authenticated User id + RoleName codes, and updates lastLoginAt.
 */
export function establishUserSession(
   req: Request,
   userId: number,
   roleCodes: RoleName[],
): Promise<void> {
   return new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
         if (error) {
            reject(error);
            return;
         }

         req.session.userId = userId;
         req.session.roleCodes = roleCodes;

         req.session.save(async (saveError) => {
            if (saveError) {
               reject(saveError);
               return;
            }

            try {
               await prisma.user.update({
                  where: { id: userId },
                  data: { lastLoginAt: new Date() },
               });
               resolve();
            } catch (updateError) {
               reject(updateError);
            }
         });
      });
   });
}

/** Destroys the store row and clears the auth cookie. */
export function destroyUserSession(
   req: Request,
   res: Response,
): Promise<void> {
   return new Promise((resolve, reject) => {
      req.session.destroy((error) => {
         if (error) {
            reject(error);
            return;
         }

         res.clearCookie(SESSION_COOKIE_NAME, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
         });
         resolve();
      });
   });
}
