import type { Request, Response } from 'express';
import { format, getISOWeek, startOfMonth, subMonths } from 'date-fns';
import { prisma } from '../config/prisma.js';
import { Prisma, VisitStatus } from '../generated/prisma/client.js';
import {
   GROWTH_MONTHS,
   DEPARTMENT_RANGES,
} from '../constants/dashboard.constants.js';
import type {
   DashboardStatsQuery,
   VisitGrowthQuery,
   DepartmentVisitsQuery,
} from '../validations/dashboard.validation.js';
import {
   getDateRanges,
   percentChange,
   getRangeStart,
   minuteDifference,
} from '../utils/dashboard.js';
import { DateRange } from '../types/dashboard.types.js';
import {
   calculateAverageDuration,
   formatVisitDuration,
} from '../utils/shared.js';

// Converts a date range into Prisma where condition
export function visitWhere(range: DateRange | null) {
   return range
      ? {
           checkedInAt: {
              gte: range.start,
              lt: range.end,
           },
        }
      : {};
}

export async function getVisitStats(req: Request, res: Response) {
   const { filter } = req.query as DashboardStatsQuery;

   const { current, previous } = getDateRanges(filter);

   // Get overstay configuration
   const settings = await prisma.setting.findUnique({
      where: { id: 1 },
      select: {
         overstayAfterMins: true,
      },
   });

   const overstayCutoff = new Date(
      Date.now() - (settings?.overstayAfterMins ?? 120) * 60 * 1000,
   );

   const [
      totalVisits,
      previousTotalVisits,
      currentlyInside,
      overstays,
      currentDurations,
      previousDurations,
   ] = await Promise.all([
      // Total visits in selected period
      prisma.visit.count({
         where: visitWhere(current),
      }),

      // Previous period comparison
      previous
         ? prisma.visit.count({
              where: visitWhere(previous),
           })
         : Promise.resolve(0),

      // Visitors currently inside
      prisma.visit.count({
         where: {
            status: VisitStatus.active,
            checkedOutAt: null,
         },
      }),

      // Active visitors exceeding allowed time
      prisma.visit.count({
         where: {
            status: VisitStatus.active,
            checkedOutAt: null,
            checkedInAt: {
               lte: overstayCutoff,
            },
         },
      }),

      // Current period durations
      prisma.visit.findMany({
         where: {
            ...visitWhere(current),
            checkedOutAt: {
               not: null,
            },
         },
         select: {
            checkedInAt: true,
            checkedOutAt: true,
         },
      }),

      // Previous period durations
      previous
         ? prisma.visit.findMany({
              where: {
                 ...visitWhere(previous),
                 checkedOutAt: {
                    not: null,
                 },
              },
              select: {
                 checkedInAt: true,
                 checkedOutAt: true,
              },
           })
         : Promise.resolve([]),
   ]);

   const averageCurrent = calculateAverageDuration(currentDurations);

   const averagePrevious = calculateAverageDuration(previousDurations);

   return res.status(200).json({
      success: true,

      data: {
         totalVisits,

         totalVisitsChange: previous
            ? percentChange(totalVisits, previousTotalVisits)
            : 0,

         currentlyInside,

         averageVisitDuration: formatVisitDuration(averageCurrent),

         averageVisitDurationChange: previous
            ? minuteDifference(averageCurrent, averagePrevious)
            : 0,

         overstays,
      },
   });
}

// GET /dashboard/growth?period=3m
export async function getVisitGrowth(req: Request, res: Response) {
   const { period } = req.query as VisitGrowthQuery;

   const monthsBack = GROWTH_MONTHS[period];

   const rangeStart = startOfMonth(subMonths(new Date(), monthsBack - 1));

   const rows = await prisma.$queryRaw<
      {
         weekStart: Date;
         visits: bigint;
      }[]
   >(
      Prisma.sql`
            SELECT
               DATE(
                  DATE_SUB(
                     checkedInAt,
                     INTERVAL WEEKDAY(checkedInAt) DAY
                  )
               ) AS weekStart,
               COUNT(*) AS visits

            FROM visits

            WHERE checkedInAt >= ${rangeStart}

            GROUP BY weekStart

            ORDER BY weekStart ASC
         `,
   );

   let lastMonth = '';

   const data = rows.map((row) => {
      const date = new Date(row.weekStart);

      const month = format(date, 'MMM');

      const showMonth = month !== lastMonth;

      lastMonth = month;

      return {
         year: format(date, 'yyyy'),
         month: showMonth ? month : '',
         week: getISOWeek(date),
         visits: Number(row.visits),
      };
   });

   return res.status(200).json({
      success: true,
      data,
   });
}

// GET /dashboard/departments?range=30days
export async function getDepartmentVisits(req: Request, res: Response) {
   const { range } = req.query as DepartmentVisitsQuery;

   const days = DEPARTMENT_RANGES[range];

   const rangeStart = getRangeStart(days);

   const rows = await prisma.$queryRaw<
      {
         name: string;
         shortName: string | null;
         color: string;
         value: bigint;
      }[]
   >(
      Prisma.sql`
            SELECT
               d.name,
                d.shortName,
               d.color,
               COUNT(v.id) AS value

            FROM visits v

            INNER JOIN departments d
               ON d.id = v.departmentId

            WHERE v.checkedInAt >= ${rangeStart}

            GROUP BY
               d.id,
               d.name,
                d.shortName,
               d.color

            ORDER BY value DESC
         `,
   );

   const data = rows.map((row) => ({
      name: row.name,
      shortName: row.shortName ?? undefined,
      color: row.color,
      value: Number(row.value),
   }));

   const total = data.reduce((sum, item) => sum + item.value, 0);

   return res.status(200).json({
      success: true,
      data: {
         data,
         total,
      },
   });
}
