import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { destroyUserSession } from '../lib/session.js';

/**
 * Dev-bypass: adopt the first active admin so the UI can be used without
 * logging in. Only reachable when DEV_BYPASS_AUTH is on *and* NODE_ENV is not
 * production (see config/env.ts). Returns false when no admin exists, so the
 * caller still answers 401 rather than pretending to be authenticated.
 */
async function adoptDevSession(req: Request): Promise<boolean> {
   const admin = await prisma.user.findFirst({
      where: {
         isActive: true,
         userRoles: { some: { role: { name: 'ADMIN' } } },
      },
      select: {
         id: true,
         userRoles: { select: { role: { select: { name: true } } } },
      },
   });

   if (!admin) return false;

   req.session.userId = admin.id;
   req.session.roleCodes = admin.userRoles.map(
      (assignment) => assignment.role.name,
   );
   return true;
}

/**
 * Ensures the request has an authenticated session bound to an active User.
 * Stale sessions (deleted / deactivated users) are destroyed.
 */
export async function requireAuth(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   if (
      env.DEV_BYPASS_AUTH &&
      (!req.session.userId || !req.session.roleCodes?.length)
   ) {
      try {
         if (await adoptDevSession(req)) return next();
      } catch {
         // fall through to the normal 401 below
      }
   }

   const userId = req.session.userId;

   if (!userId || !req.session.roleCodes?.length) {
      return res.status(401).json({
         success: false,
         message: 'Unauthorized',
      });
   }

   try {
      const user = await prisma.user.findUnique({
         where: { id: userId },
         select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
         await destroyUserSession(req, res);
         return res.status(401).json({
            success: false,
            message: 'Unauthorized',
         });
      }

      return next();
   } catch {
      return res.status(500).json({
         success: false,
         message: 'Session validation failed',
      });
   }
}
