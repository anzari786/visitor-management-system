import type { Request, Response, NextFunction } from 'express';
import type { RoleName } from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { destroyUserSession } from '../lib/session.js';

const PASSWORD_CHANGE_ALLOWED_PATHS = new Set([
   '/api/v1/auth/me',
   '/api/v1/auth/change-password',
   '/api/v1/auth/force-change-password',
   '/api/v1/auth/logout',
]);

const requestPath = (req: Request): string => {
   const combined = `${req.baseUrl}${req.path}`;
   if (combined.length > 1 && combined.endsWith('/')) {
      return combined.slice(0, -1);
   }
   return combined;
};

/**
 * Ensures the request has an authenticated session bound to an active User.
 * Role codes are loaded from the database so role grant/revoke takes effect
 * on the next request without waiting for a new login.
 * Stale sessions (deleted / deactivated users) are destroyed.
 */
export async function requireAuth(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   const userId = req.session.userId;

   if (!userId) {
      return res.status(401).json({
         success: false,
         message: 'Unauthorized',
      });
   }

   try {
      const user = await prisma.user.findUnique({
         where: { id: userId },
         select: {
            id: true,
            isActive: true,
            mustChangePassword: true,
            userRoles: {
               select: {
                  role: { select: { name: true } },
               },
            },
         },
      });

      if (!user || !user.isActive) {
         await destroyUserSession(req, res);
         return res.status(401).json({
            success: false,
            message: 'Unauthorized',
         });
      }

      const roleCodes = user.userRoles.map(
         (assignment) => assignment.role.name,
      ) as RoleName[];

      if (roleCodes.length === 0) {
         return res.status(401).json({
            success: false,
            message: 'Unauthorized',
         });
      }

      req.session.roleCodes = roleCodes;

      if (
         user.mustChangePassword &&
         !PASSWORD_CHANGE_ALLOWED_PATHS.has(requestPath(req))
      ) {
         return res.status(403).json({
            success: false,
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED',
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
