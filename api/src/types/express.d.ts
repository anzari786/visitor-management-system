import 'express-session';

declare module 'express-session' {
   interface SessionData {
      userId: number;
      roles: string[];
   }
}

declare global {
   namespace Express {
      interface Request {
         validatedQuery?: unknown;
         validatedBody?: unknown;
         validatedParams?: unknown;
      }
   }
}

export {};
