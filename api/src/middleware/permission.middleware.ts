import type { Request, Response, NextFunction } from 'express';

/**
 * Role is a data model (Role.code) in this schema, not an enum, and a
 * user can hold more than one role via UserRoleAssignment — so this
 * takes role codes as strings and checks against the session's array.
 */
export function requireRole(...roleCodes: string[]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.session.roleCodes) {
         return res.status(401).json({
            success: false,
            message: 'Unauthorized',
         });
      }

      const hasRole = req.session.roleCodes.some((code) =>
         roleCodes.includes(code),
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
