import 'express-session';
import type { RoleName } from '../generated/prisma/client.js';

declare module 'express-session' {
   interface SessionData {
      userId: number;
      roleCodes: RoleName[];
   }
}

declare global {
   namespace Express {
      interface Request {
         validatedBody?: unknown;
         validatedQuery?: unknown;
         validatedParams?: unknown;
      }
   }
}

export {};
