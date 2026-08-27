import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   listEmployees,
   searchHosts,
   getEmployeeById,
   syncEmployees,
   formatEmployee,
   getPendingApprovalVisits,
   getUpcomingVisits,
   formatHostVisit,
} from './employee.service.js';
import {
   type listEmployeesSchema,
   type searchHostSchema,
   type employeeIdParamSchema,
   type syncEmployeesSchema,
   listMyVisitsSchema,
} from './employee.validation.js';

type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>['query'];
type SearchHostQuery = z.infer<typeof searchHostSchema>['query'];
type EmployeeIdParams = z.infer<typeof employeeIdParamSchema>['params'];
type ListMyVisitsQuery = z.infer<typeof listMyVisitsSchema>['query'];
type SyncEmployeesBody = z.infer<typeof syncEmployeesSchema>['body'];

export const getEmployees = async (req: Request, res: Response) => {
   const { search, departmentName, isActive, page, limit } =
      req.validatedQuery as ListEmployeesQuery;

   const { employees, meta } = await listEmployees({
      search,
      departmentName,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: employees.map(formatEmployee),
      pagination: meta,
   });
};

export const getHostOptions = async (req: Request, res: Response) => {
   const { q, limit } = req.validatedQuery as SearchHostQuery;

   const hosts = await searchHosts(q, limit);

   return res.status(200).json({
      success: true,
      data: hosts.map((host) => ({
         id: String(host.id),
         firstName: host.firstName,
         lastName: host.lastName,
         email: host.email,
         departmentName: host.departmentName,
         departmentCode: host.departmentCode ?? undefined,
         position: host.position ?? undefined,
         isActive: host.isActive,
      })),
   });
};

export const getEmployee = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as EmployeeIdParams;

   const employee = await getEmployeeById(id);

   return res.status(200).json({
      success: true,
      data: formatEmployee(employee),
   });
};

export const getMyPendingApprovalVisits = async (
   req: Request,
   res: Response,
) => {
   const { page, limit } = req.validatedQuery as ListMyVisitsQuery;

   const { visits, meta } = await getPendingApprovalVisits({
      userId: req.session.userId!,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: visits.map(formatHostVisit),
      pagination: meta,
   });
};

export const getMyUpcomingVisits = async (req: Request, res: Response) => {
   const { page, limit } = req.validatedQuery as ListMyVisitsQuery;

   const { visits, meta } = await getUpcomingVisits({
      userId: req.session.userId!,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: visits.map(formatHostVisit),
      pagination: meta,
   });
};

export const runEmployeeSync = async (req: Request, res: Response) => {
   const { employees } = req.validatedBody as SyncEmployeesBody;

   const result = await syncEmployees(employees);

   return res.status(200).json({
      success: true,
      message: `Synced ${result.syncedCount} employee record(s)`,
      data: result,
   });
};
