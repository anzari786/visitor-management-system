import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   listAttendances,
   listDailyAttendances,
   getAttendanceById,
   findVisitForCheckIn,
   findVisitorForCheckOut,
   checkInVisitor,
   checkOutVisitor,
   markNoShow,
   formatAttendanceDetail,
   formatAttendanceSummary,
   retryAttendanceBadgePrint,
   getAttendancePrintStatus,
} from './visit-attendance.service.js';
import { formatPrintJob } from '../print-jobs/print-job.service.js';
import type {
   checkInSchema,
   listAttendancesSchema,
   dailyAttendanceSchema,
   attendanceIdParamSchema,
   lookupVisitByCodeSchema,
   lookupBadgeByCodeSchema,
} from './visit-attendance.validation.js';

type CheckInBody = z.infer<typeof checkInSchema>['body'];
type ListAttendancesQuery = z.infer<typeof listAttendancesSchema>['query'];
type DailyAttendanceQuery = z.infer<typeof dailyAttendanceSchema>['query'];
type AttendanceIdParams = z.infer<typeof attendanceIdParamSchema>['params'];
type LookupVisitQuery = z.infer<typeof lookupVisitByCodeSchema>['query'];
type LookupBadgeQuery = z.infer<typeof lookupBadgeByCodeSchema>['query'];

export const getAttendances = async (req: Request, res: Response) => {
   const { visitId, status, date, search, page, limit } =
      req.validatedQuery as ListAttendancesQuery;

   const { attendances, meta } = await listAttendances({
      visitId,
      status,
      date,
      search,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: attendances.map(formatAttendanceSummary),
      pagination: meta,
   });
};

export const getDailyAttendances = async (req: Request, res: Response) => {
   const { date, page, limit } = req.validatedQuery as DailyAttendanceQuery;

   const { attendances, meta } = await listDailyAttendances(
      { page, limit },
      date,
   );

   return res.status(200).json({
      success: true,
      data: attendances.map(formatAttendanceSummary),
      pagination: meta,
   });
};

/** code lookup for check-in — does not mutate attendance. */
export const lookupVisitForCheckIn = async (req: Request, res: Response) => {
   const { code, date } = req.validatedQuery as LookupVisitQuery;
   const data = await findVisitForCheckIn(code, date);

   return res.status(200).json({
      success: true,
      data,
   });
};

/** Printed badge QR lookup for check-out — does not mutate attendance. */
export const lookupVisitorForCheckOut = async (req: Request, res: Response) => {
   const { code } = req.validatedQuery as LookupBadgeQuery;
   const data = await findVisitorForCheckOut(code);

   return res.status(200).json({
      success: true,
      data,
   });
};

export const getAttendance = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AttendanceIdParams;

   const attendance = await getAttendanceById(id);

   return res.status(200).json({
      success: true,
      data: formatAttendanceDetail(attendance),
   });
};

export const postCheckIn = async (req: Request, res: Response) => {
   const input = req.validatedBody as CheckInBody;

   const attendance = await checkInVisitor(input, req.session.userId!);

   return res.status(200).json({
      success: true,
      message: 'Visitor checked in successfully',
      data: formatAttendanceDetail(attendance),
   });
};

export const postCheckOut = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AttendanceIdParams;

   const attendance = await checkOutVisitor(id, req.session.userId!);

   return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      data: formatAttendanceDetail(attendance),
   });
};

export const postNoShow = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AttendanceIdParams;

   const attendance = await markNoShow(id);

   return res.status(200).json({
      success: true,
      message: 'Attendance marked as no-show',
      data: formatAttendanceDetail(attendance),
   });
};

export const getPrintStatus = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AttendanceIdParams;
   const printJob = await getAttendancePrintStatus(id);

   return res.status(200).json({
      success: true,
      data: printJob,
   });
};

export const postRetryPrint = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AttendanceIdParams;
   const job = await retryAttendanceBadgePrint(id);

   return res.status(200).json({
      success: true,
      message: 'Badge print job queued for retry',
      data: formatPrintJob(job),
   });
};
