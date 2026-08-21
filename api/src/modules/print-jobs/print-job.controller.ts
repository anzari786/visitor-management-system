import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   claimNextPrintJob,
   markPrintJobPrinting,
   completePrintJob,
   failPrintJob,
   retryBadgePrintJob,
   getPrintJobById,
   formatPrintJob,
} from './print-job.service.js';
import type {
   printJobIdParamSchema,
   claimPrintJobSchema,
   completePrintJobSchema,
   failPrintJobSchema,
   nextPrintJobSchema,
} from './print-job.validation.js';

type PrintJobIdParams = z.infer<typeof printJobIdParamSchema>['params'];
type ClaimBody = z.infer<typeof claimPrintJobSchema>['body'];
type CompleteBody = z.infer<typeof completePrintJobSchema>['body'];
type FailBody = z.infer<typeof failPrintJobSchema>['body'];
type NextQuery = z.infer<typeof nextPrintJobSchema>['query'];

/** Print Agent: claim the next QUEUED job (or null if empty). */
export const getNextPrintJob = async (req: Request, res: Response) => {
   const { agentId } = req.validatedQuery as NextQuery;
   const result = await claimNextPrintJob(agentId);

   if (!result) {
      return res.status(204).send();
   }

   return res.status(200).json({
      success: true,
      data: {
         job: formatPrintJob(result.job),
         printData: result.printData,
      },
   });
};

export const postPrintJobPrinting = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as PrintJobIdParams;
   const { agentId } = req.validatedBody as ClaimBody;

   const job = await markPrintJobPrinting(id, agentId);

   return res.status(200).json({
      success: true,
      data: formatPrintJob(job),
   });
};

export const postPrintJobComplete = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as PrintJobIdParams;
   const { agentId } = req.validatedBody as CompleteBody;

   const job = await completePrintJob(id, agentId);

   return res.status(200).json({
      success: true,
      message: 'Print job marked as printed',
      data: formatPrintJob(job),
   });
};

export const postPrintJobFail = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as PrintJobIdParams;
   const { agentId, errorMessage } = req.validatedBody as FailBody;

   const job = await failPrintJob(id, agentId, errorMessage);

   return res.status(200).json({
      success: true,
      message: 'Print job marked as failed',
      data: formatPrintJob(job),
   });
};

/** Desk staff: re-queue a failed / completed job for reprint. */
export const postPrintJobRetry = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as PrintJobIdParams;

   const job = await retryBadgePrintJob(id);

   return res.status(200).json({
      success: true,
      message: 'Print job queued for retry',
      data: formatPrintJob(job),
   });
};

export const getPrintJob = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as PrintJobIdParams;
   const job = await getPrintJobById(id);

   return res.status(200).json({
      success: true,
      data: formatPrintJob(job),
   });
};
