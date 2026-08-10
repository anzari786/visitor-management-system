import type { Request, Response } from 'express';
import { format, getISOWeek, startOfMonth, subMonths } from 'date-fns';
import { prisma } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
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
import type { DateRange } from '../types/dashboard.types.js';
import {
   calculateAverageDuration,
   formatVisitDuration,
} from '../utils/shared.js';

const visitCreatedWhere = (range: DateRange | null) =>
   range
      ? {
           createdAt: {
              gte: range.start,
              lt: range.end,
           },
        }
      : {};

const getOverstayAfterMins = async () => {
   const row = await prisma.systemSetting.findUnique({
      where: { key: 'overstayAfterMins' },
   });
   return Number(row?.value ?? 120);
};

export async function getVisitStats(req: Request, res: Response) {
   const { filter } = req.query as DashboardStatsQuery;
   const { current, previous } = getDateRanges(filter);
   const overstayAfterMins = await getOverstayAfterMins();
   const overstayCutoff = new Date(Date.now() - overstayAfterMins * 60_000);

   const [
      totalVisits,
      previousTotalVisits,
      currentlyInside,
      overstays,
      currentDurations,
      previousDurations,
   ] = await Promise.all([
      prisma.visit.count({ where: visitCreatedWhere(current) }),
      previous
         ? prisma.visit.count({ where: visitCreatedWhere(previous) })
         : Promise.resolve(0),
      prisma.visitAttendance.count({
         where: { status: 'CHECKED_IN' },
      }),
      prisma.visitAttendance.count({
         where: {
            status: 'CHECKED_IN',
            checkInAt: { lte: overstayCutoff },
         },
      }),
      prisma.visitAttendance.findMany({
         where: {
            status: 'CHECKED_OUT',
            checkOutAt: { not: null },
            ...(current
               ? { checkOutAt: { gte: current.start, lt: current.end } }
               : {}),
         },
         select: { checkInAt: true, checkOutAt: true },
      }),
      previous
         ? prisma.visitAttendance.findMany({
              where: {
                 status: 'CHECKED_OUT',
                 checkOutAt: {
                    gte: previous.start,
                    lt: previous.end,
                 },
              },
              select: { checkInAt: true, checkOutAt: true },
           })
         : Promise.resolve([]),
   ]);

   const averageCurrent = calculateAverageDuration(
      currentDurations.map((row) => ({
         checkedInAt: row.checkInAt!,
         checkedOutAt: row.checkOutAt,
      })),
   );

   const averagePrevious = calculateAverageDuration(
      previousDurations.map((row) => ({
         checkedInAt: row.checkInAt!,
         checkedOutAt: row.checkOutAt,
      })),
   );

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
                     createdAt,
                     INTERVAL WEEKDAY(createdAt) DAY
                  )
               ) AS weekStart,
               COUNT(*) AS visits
            FROM visits
            WHERE createdAt >= ${rangeStart}
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

export async function getDepartmentVisits(req: Request, res: Response) {
   const { range } = req.query as DepartmentVisitsQuery;
   const days = DEPARTMENT_RANGES[range];
   const rangeStart = getRangeStart(days);

   const rows = await prisma.$queryRaw<
      {
         name: string;
         value: bigint;
      }[]
   >(
      Prisma.sql`
            SELECT
               COALESCE(v.departmentNameSnapshot, 'Unknown') AS name,
               COUNT(v.id) AS value
            FROM visits v
            WHERE v.createdAt >= ${rangeStart}
              AND v.departmentNameSnapshot IS NOT NULL
            GROUP BY v.departmentNameSnapshot
            ORDER BY value DESC
         `,
   );

   const palette = [
      '#35B9E9',
      '#6E3FF3',
      '#375DFB',
      '#00D084',
      '#FF6900',
      '#EB144C',
      '#F7C948',
      '#2D9CDB',
   ];

   const data = rows.map((row, index) => ({
      name: row.name,
      color: palette[index % palette.length],
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
