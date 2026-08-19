import { format as formatCsvRow } from '@fast-csv/format';
import { differenceInCalendarDays, format, startOfMonth } from 'date-fns';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { buildCsvFilename, resolveDateRange } from '../utils/report.js';
import { formatVisitDuration, calculateAverageDuration } from '../utils/shared.js';
import type { ExportVisitLogQuery } from '../validations/report.validation.js';

export async function getReportStats(_req: Request, res: Response) {
   const now = new Date();
   const monthStart = startOfMonth(now);

   const [visits, durations] = await Promise.all([
      prisma.visit.findMany({
         where: { createdAt: { gte: monthStart, lte: now } },
         select: { createdAt: true },
      }),
      prisma.visitAttendance.findMany({
         where: {
            status: 'CHECKED_OUT',
            checkOutAt: { gte: monthStart, lte: now },
            checkInAt: { not: null },
         },
         select: { checkInAt: true, checkOutAt: true },
      }),
   ]);

   const totalVisits = visits.length;
   const daysElapsed = differenceInCalendarDays(now, monthStart) + 1;
   const dailyAverage = totalVisits / daysElapsed;

   const dayBuckets = new Map<string, number>();
   for (const visit of visits) {
      const key = format(visit.createdAt, 'yyyy-MM-dd');
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
   }

   let peakDay = { date: format(now, 'yyyy-MM-dd'), count: 0 };
   for (const [date, count] of dayBuckets) {
      if (count > peakDay.count) peakDay = { date, count };
   }

   const averageMinutes = calculateAverageDuration(
      durations.map((row) => ({
         checkedInAt: row.checkInAt!,
         checkedOutAt: row.checkOutAt,
      })),
   );

   return res.status(200).json({
      success: true,
      data: {
         periodLabel: 'This month',
         totalVisits,
         dailyAverage: Math.round(dailyAverage),
         peakDay: {
            count: peakDay.count,
            date: peakDay.date,
            label: format(new Date(peakDay.date), 'EEE MMM d'),
         },
         averageVisitDuration: formatVisitDuration(averageMinutes),
      },
   });
}

export async function exportVisitLog(req: Request, res: Response) {
   const { period, departmentName, from, to } =
      req.validatedQuery as ExportVisitLogQuery;

   const range = resolveDateRange(period, from, to);

   const visits = await prisma.visit.findMany({
      where: {
         ...(departmentName
            ? { departmentNameSnapshot: departmentName }
            : {}),
         createdAt: range ? { gte: range.start, lte: range.end } : undefined,
      },
      include: {
         hostEmployee: true,
         participants: {
            include: { visitor: true },
            take: 1,
         },
      },
      orderBy: { createdAt: 'desc' },
   });

   const filename = buildCsvFilename(departmentName);

   res.setHeader('Content-Type', 'text/csv');
   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

   const csvStream = formatCsvRow({ headers: true });
   csvStream.pipe(res);

   for (const visit of visits) {
      const primaryVisitor = visit.participants[0]?.visitor;
      const hostName =
         visit.hostNameSnapshot ??
         (visit.hostEmployee
            ? `${visit.hostEmployee.firstName} ${visit.hostEmployee.lastName}`
            : '');

      csvStream.write({
         visitCode: visit.visitCode,
         visitor: primaryVisitor
            ? `${primaryVisitor.firstName} ${primaryVisitor.lastName}`
            : '',
         phone: primaryVisitor?.phone ?? '',
         department: visit.departmentNameSnapshot ?? '',
         host: hostName,
         status: visit.status,
         createdAt: `="${format(visit.createdAt, 'yyyy-MM-dd HH:mm')}"`,
      });
   }

   csvStream.end();
}
