import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   listVisitors,
   getVisitorById,
   findOrCreateVisitor,
   updateVisitor,
   getVisitorHistory,
   formatVisitor,
   formatVisitorHistoryEntry,
} from './visitor.service.js';
import type {
   listVisitorsSchema,
   visitorIdParamSchema,
   createVisitorSchema,
   updateVisitorSchema,
   visitorHistoryQuerySchema,
} from './visitor.validation.js';

type ListVisitorsQuery = z.infer<typeof listVisitorsSchema>['query'];
type VisitorIdParams = z.infer<typeof visitorIdParamSchema>['params'];
type CreateVisitorBody = z.infer<typeof createVisitorSchema>['body'];
type UpdateVisitorParams = z.infer<typeof updateVisitorSchema>['params'];
type UpdateVisitorBody = z.infer<typeof updateVisitorSchema>['body'];
type VisitorHistoryParams = z.infer<typeof visitorHistoryQuerySchema>['params'];
type VisitorHistoryQuery = z.infer<typeof visitorHistoryQuerySchema>['query'];

export const getVisitors = async (req: Request, res: Response) => {
   const { search, phone, idNumber, page, limit } =
      req.validatedQuery as ListVisitorsQuery;

   const { visitors, meta } = await listVisitors({
      search,
      phone,
      idNumber,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: visitors.map(formatVisitor),
      pagination: meta,
   });
};

export const getVisitor = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitorIdParams;

   const visitor = await getVisitorById(id);

   return res.status(200).json({
      success: true,
      data: formatVisitor(visitor),
   });
};

export const createVisitor = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateVisitorBody;

   const visitor = await findOrCreateVisitor(input);

   return res.status(201).json({
      success: true,
      message: 'Visitor registered successfully',
      data: formatVisitor(visitor),
   });
};

export const patchVisitor = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as UpdateVisitorParams;
   const input = req.validatedBody as UpdateVisitorBody;

   const visitor = await updateVisitor(id, input);

   return res.status(200).json({
      success: true,
      message: 'Visitor updated successfully',
      data: formatVisitor(visitor),
   });
};

export const getVisitorHistoryList = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitorHistoryParams;
   const { page, limit } = req.validatedQuery as VisitorHistoryQuery;

   const { entries, meta } = await getVisitorHistory(id, { page, limit });

   return res.status(200).json({
      success: true,
      data: entries.map(formatVisitorHistoryEntry),
      pagination: meta,
   });
};
