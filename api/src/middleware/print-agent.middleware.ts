import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

function tokensEqual(a: string, b: string): boolean {
   const aBuf = Buffer.from(a);
   const bBuf = Buffer.from(b);
   if (aBuf.length !== bBuf.length) {
      return false;
   }
   return timingSafeEqual(aBuf, bBuf);
}

/**
 * Authenticates the local VMS Print Agent via Bearer token.
 * Does not use user sessions — printer credentials never go to the browser.
 */
export function requirePrintAgent(
   req: Request,
   res: Response,
   next: NextFunction,
) {
   const header = req.headers.authorization;
   if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
         success: false,
         message: 'Unauthorized',
         code: 'PRINT_AGENT_UNAUTHORIZED',
      });
   }

   const token = header.slice('Bearer '.length).trim();
   const expected = env.PRINT_AGENT_TOKEN;

   if (!expected || !tokensEqual(token, expected)) {
      return res.status(401).json({
         success: false,
         message: 'Unauthorized',
         code: 'PRINT_AGENT_UNAUTHORIZED',
      });
   }

   return next();
}
