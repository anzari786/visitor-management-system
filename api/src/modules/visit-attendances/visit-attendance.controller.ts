import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   listAttendances,
   listDailyAttendances,
   getAttendanceById,
   checkInVisitor,
   checkOutVisitor,
   markNoShow,
   formatAttendanceDetail,
   formatAttendanceSummary,
} from './visit-attendance.service.js';
import type {
   checkInSchema,
   listAttendancesSchema,
   dailyAttendanceSchema,
   attendanceIdParamSchema,
} from './visit-attendance.validation.js';

type CheckInBody = z.infer<typeof checkInSchema>['body'];
type ListAttendancesQuery = z.infer<typeof listAttendancesSchema>['query'];
type DailyAttendanceQuery = z.infer<typeof dailyAttendanceSchema>['query'];
type AttendanceIdParams = z.infer<typeof attendanceIdParamSchema>['params'];

export const getAttendances = async (req: Request, res: Response) => {
   const {
      visitId,
      visitScheduleId,
      visitParticipantId,
      status,
      badgeId,
      date,
      page,
      limit,
   } = req.validatedQuery as ListAttendancesQuery;

   const { attendances, meta } = await listAttendances({
      visitId,
      visitScheduleId,
      visitParticipantId,
      status,
      badgeId,
      date,
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

   const { attendances, meta } = await listDailyAttendances(date, {
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: attendances.map(formatAttendanceSummary),
      pagination: meta,
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
