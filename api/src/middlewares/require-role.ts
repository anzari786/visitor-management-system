import type { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.session.roles?.length) {
         return res.status(401).json({
            message: 'Unauthorized',
         });
      }

      const hasRequiredRole = roles.some((role) =>
         req.session.roles!.includes(role),
      );

      if (!hasRequiredRole) {
         return res.status(403).json({
            message: 'Forbidden',
         });
      }

      next();
   };
}
