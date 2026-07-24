import 'express-session';

declare module 'express-session' {
   interface SessionData {
      userId: number;
      roleCodes: string[];
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
