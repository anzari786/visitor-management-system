import type { Request, Response, NextFunction } from 'express';

import type { Role } from '../generated/prisma/client.js';

export function requireRole(...roles: Role[]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.session.role) {
         return res.status(401).json({
            message: 'Unauthorized',
         });
      }

      if (!roles.includes(req.session.role)) {
         return res.status(403).json({
            message: 'Forbidden',
         });
      }

      next();
   };
}
