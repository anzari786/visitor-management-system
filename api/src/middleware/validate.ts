import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

type RequestSchemaShape = {
   body?: unknown;
   query?: unknown;
   params?: unknown;
};
export function validate<T extends ZodType<RequestSchemaShape>>(schema: T) {
   return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse({
         body: req.body,
         query: req.query,
         params: req.params,
      });

      if (!result.success) {
         return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.error.flatten(),
         });
      }

      req.validatedBody = result.data.body;
      req.validatedQuery = result.data.query;
      req.validatedParams = result.data.params;

      next();
   };
}
