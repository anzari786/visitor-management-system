import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './config/session.js';
import type { NextFunction, Request, Response } from 'express';
import routes from './routes/index.js';
import { HttpError } from './lib/errors.js';

const app = express();

app.use(
   cors({
      origin: ['http://localhost:3000'],
      credentials: true,
   }),
);
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.get('/api/health', (req: Request, res: Response) => {
   return res.status(200).json({
      status: 'ok',
   });
});

app.use('/api/v1', routes);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
   console.error(err);

   if (err instanceof HttpError) {
      return res.status(err.status).json({
         success: false,
         message: err.message,
         code: err.code,
      });
   }

   return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
   });
});

export default app;
