import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   formatDepartment,
   listDepartments,
   syncDepartments,
} from './department.service.js';
import {
   type listDepartmentsSchema,
   type syncDepartmentsSchema,
} from './department.validation.js';

type ListDepartmentsQuery = z.infer<typeof listDepartmentsSchema>['query'];
type SyncDepartmentsBody = z.infer<typeof syncDepartmentsSchema>['body'];

export const getDepartments = async (req: Request, res: Response) => {
   const { search, activeOnly, page, limit } =
      req.validatedQuery as ListDepartmentsQuery;
   const { departments, meta } = await listDepartments({
      search,
      activeOnly,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: departments.map(formatDepartment),
      pagination: meta,
   });
};

export const runDepartmentSync = async (req: Request, res: Response) => {
   const { departments } = req.validatedBody as SyncDepartmentsBody;
   const result = await syncDepartments(departments);

   return res.status(200).json({
      success: true,
      message: `Synced ${result.syncedCount} department record(s)`,
      data: result,
   });
};