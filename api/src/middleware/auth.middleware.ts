import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { destroyUserSession } from '../lib/session.js';

/**
 * Ensures the request has an authenticated session bound to an active User.
 * Stale sessions (deleted / deactivated users) are destroyed.
 */
export async function requireAuth(
   req: Request,
   res: Response,
   next: NextFunction,
) {
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
