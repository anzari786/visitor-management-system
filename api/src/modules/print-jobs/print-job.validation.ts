import { z } from 'zod';

export const printJobIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const claimPrintJobSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      agentId: z.string().trim().min(1).max(128),
   }),
});

export const completePrintJobSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      agentId: z.string().trim().min(1).max(128),
   }),
});

export const failPrintJobSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      agentId: z.string().trim().min(1).max(128),
      errorMessage: z.string().trim().min(1).max(2000),
   }),
});

export const nextPrintJobSchema = z.object({
   query: z.object({
      agentId: z.string().trim().min(1).max(128),
   }),
});
