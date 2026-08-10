import type { Request, Response, NextFunction } from 'express';
import type { RoleName } from '../generated/prisma/client.js';

/**
 * Role-based access control using RoleName enum values stored on the
 * session after login (GUARD | RECEPTION | ADMIN | MANAGER).
 */
export function requireRole(...roles: RoleName[]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.session.userId || !req.session.roleCodes) {
         return res.status(401).json({
            success: false,
            message: 'Unauthorized',
         });
      }

      const hasRole = req.session.roleCodes.some((role) =>
         roles.includes(role as RoleName),
      );

      if (!hasRole) {
         return res.status(403).json({
            success: false,
            message: 'Forbidden',
         });
      }

      next();
   };
}
