import { format as formatCsvRow } from '@fast-csv/format';
import { differenceInCalendarDays, format, startOfMonth } from 'date-fns';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import {
   buildCsvFilename,
   formatDuration,
   resolveDateRange,
} from '../utils/report.js';
import {
   calculateAverageDuration,
   formatVisitDuration,
} from '../utils/shared.js';
import { computeStatus, getSettings } from '../utils/visit.js';
import type { ExportVisitLogQuery } from '../validations/report.validation.js';

export async function getReportStats(_req: Request, res: Response) {
   const now = new Date();
   const monthStart = startOfMonth(now);

   const visits = await prisma.visit.findMany({
      where: { checkedInAt: { gte: monthStart, lte: now } },
      select: { checkedInAt: true, checkedOutAt: true },
   });

   const totalVisits = visits.length;
   const daysElapsed = differenceInCalendarDays(now, monthStart) + 1;
   const dailyAverage = totalVisits / daysElapsed;

   const dayBuckets = new Map<string, number>();
   for (const visit of visits) {
      const key = format(visit.checkedInAt, 'yyyy-MM-dd');
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
   }

   let peakDay = { date: format(now, 'yyyy-MM-dd'), count: 0 };
   for (const [date, count] of dayBuckets) {
      if (count > peakDay.count) peakDay = { date, count };
   }

   const completedVisits = visits.filter((v) => v.checkedOutAt);
   const averageVisitDuration = calculateAverageDuration(completedVisits);

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
         averageVisitDuration: formatVisitDuration(averageVisitDuration),
      },
   });
}

export async function exportVisitLog(req: Request, res: Response) {
   const { period, departmentId, from, to } =
      req.validatedQuery as ExportVisitLogQuery;

   const range = resolveDateRange(period, from, to);
   const settings = await getSettings();

   const visits = await prisma.visit.findMany({
      where: {
         departmentId,
         checkedInAt: range ? { gte: range.start, lte: range.end } : undefined,
      },
      include: { visitor: true, department: true },
      orderBy: { checkedInAt: 'desc' },
   });

   const filename = buildCsvFilename(departmentId);

   res.setHeader('Content-Type', 'text/csv');
   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

   const csvStream = formatCsvRow({ headers: true });
   csvStream.pipe(res);

   for (const visit of visits) {
      const checkedInAt = format(visit.checkedInAt, 'yyyy-MM-dd HH:mm');
      const checkedOutAt = visit.checkedOutAt
         ? format(visit.checkedOutAt, 'yyyy-MM-dd HH:mm')
         : '';

      csvStream.write({
         visitor: visit.visitor.fullName,
         phone: visit.visitor.phone,
         department: visit.department.name,
         host: visit.hostName,
         badge: visit.badgeNumber,
         status: computeStatus(visit, settings),
         checkedInAt: `="${checkedInAt}"`,
         checkedOutAt: checkedOutAt ? `="${checkedOutAt}"` : '',
         duration: visit.checkedOutAt
            ? formatDuration(visit.checkedInAt, visit.checkedOutAt)
            : '-',
      });
   }

   csvStream.end();
}
