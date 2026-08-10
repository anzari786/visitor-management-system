import {
   format,
   getISOWeek,
   startOfDay,
   startOfMonth,
   subDays,
   subMonths,
   differenceInMinutes,
} from 'date-fns';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   CHART_COLORS,
   CHART_RANGES,
   GROWTH_MONTHS,
   UPCOMING_VISIT_STATUSES,
   VISIT_PURPOSE_LABELS,
   VISIT_STATUS_LABELS,
} from './dashboard.constants.js';
import type {
   ChartTimeRange,
   DateFilter,
   GrowthPeriod,
} from './dashboard.validation.js';
import type {
   DashboardStats,
   DateRange,
   DateRanges,
   MeetingTypeStats,
   VisitGrowthPoint,
   VisitStatusStats,
} from './dashboard.types.js';

// ── Date helpers ────────────────────────────────────────────────────────────

export function getDateRanges(filter: DateFilter): DateRanges {
   const now = new Date();
   const todayStart = startOfDay(now);

   if (filter === 'all') {
      return { current: null, previous: null };
   }

   if (filter === 'yesterday') {
      const start = subDays(todayStart, 1);
      return {
         current: { start, end: todayStart },
         previous: { start: subDays(start, 1), end: start },
      };
   }

   const start =
      filter === 'today'
         ? todayStart
         : filter === 'last_7_days'
           ? subDays(todayStart, 7)
           : filter === 'last_30_days'
             ? subDays(todayStart, 30)
             : startOfMonth(now);

   const end = now;
   const duration = end.getTime() - start.getTime();

   return {
      current: { start, end },
      previous: {
         start: new Date(start.getTime() - duration),
         end: start,
      },
   };
}

function percentChange(current: number, previous: number): number {
   if (previous === 0) return current > 0 ? 100 : 0;
   return Math.round(((current - previous) / previous) * 100);
}

function getRangeStart(days: number): Date {
   return subDays(startOfDay(new Date()), days);
}

/**
 * Visits that occur within a calendar window (single- and multi-day).
 * Uses VisitDay rows so multi-day visits are counted once if any day overlaps.
 */
function visitsOverlappingRange(
   range: DateRange | null,
): Prisma.VisitWhereInput {
   if (!range) return {};

   return {
      days: {
         some: {
            date: {
               gte: range.start,
               lt: range.end,
            },
         },
      },
   };
}

function formatVisitDuration(minutes: number): string {
   if (minutes <= 0) return '0 min';
   if (minutes < 60) return `${Math.round(minutes)} min`;

   const hours = Math.floor(minutes / 60);
   const remaining = Math.round(minutes % 60);
   return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

function averageDurationMinutes(
   rows: Array<{ checkInAt: Date | null; checkOutAt: Date | null }>,
): number {
   const valid = rows.filter(
      (row): row is { checkInAt: Date; checkOutAt: Date } =>
         row.checkInAt != null && row.checkOutAt != null,
   );

   if (!valid.length) return 0;

   const total = valid.reduce(
      (sum, row) => sum + differenceInMinutes(row.checkOutAt, row.checkInAt),
      0,
   );

   return total / valid.length;
}

async function getOverstaySettings(): Promise<{
   enabled: boolean;
   afterMins: number;
}> {
   const rows = await prisma.systemSetting.findMany({
      where: { key: { in: ['overstayEnabled', 'overstayAfterMins'] } },
      select: { key: true, value: true },
   });

   const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

   return {
      enabled: map.overstayEnabled !== 'false',
      afterMins: Number(map.overstayAfterMins ?? 120),
   };
}

async function countOverstays(cutoff: Date | null): Promise<number> {
   if (!cutoff) return 0;

   return prisma.visitAttendance.count({
      where: {
         status: 'CHECKED_IN',
         checkInAt: { lte: cutoff },
      },
   });
}

async function countCheckedOutInRange(
   range: DateRange | null,
): Promise<number> {
   return prisma.visitAttendance.count({
      where: {
         status: 'CHECKED_OUT',
         checkOutAt: range
            ? { gte: range.start, lt: range.end }
            : { not: null },
      },
   });
}

async function averageDurationInRange(
   range: DateRange | null,
): Promise<number> {
   const rows = await prisma.visitAttendance.findMany({
      where: {
         status: 'CHECKED_OUT',
         checkOutAt: range
            ? { gte: range.start, lt: range.end }
            : { not: null },
         checkInAt: { not: null },
      },
      select: { checkInAt: true, checkOutAt: true },
   });

   return averageDurationMinutes(rows);
}

// ── Public service API ──────────────────────────────────────────────────────

export async function getDashboardStats(
   filter: DateFilter,
): Promise<DashboardStats> {
   const { current, previous } = getDateRanges(filter);
   const overstay = await getOverstaySettings();
   const overstayCutoff = overstay.enabled
      ? new Date(Date.now() - overstay.afterMins * 60_000)
      : null;

   const todayStart = startOfDay(new Date());

   const [
      totalVisits,
      previousTotalVisits,
      currentlyInside,
      previousInside,
      overstays,
      avgCurrent,
      avgPrevious,
      pendingApprovals,
      upcomingVisits,
      checkedOutVisitors,
   ] = await Promise.all([
      prisma.visit.count({ where: visitsOverlappingRange(current) }),
      previous
         ? prisma.visit.count({ where: visitsOverlappingRange(previous) })
         : Promise.resolve(0),
      prisma.visitAttendance.count({ where: { status: 'CHECKED_IN' } }),
      previous
         ? prisma.visitAttendance.count({
              where: {
                 status: 'CHECKED_IN',
                 checkInAt: { gte: previous.start, lt: previous.end },
              },
           })
         : Promise.resolve(0),
      countOverstays(overstayCutoff),
      averageDurationInRange(current),
      previous ? averageDurationInRange(previous) : Promise.resolve(0),
      prisma.visit.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.visit.count({
         where: {
            status: { in: UPCOMING_VISIT_STATUSES },
            startDate: { gte: todayStart },
         },
      }),
      countCheckedOutInRange(current),
   ]);

   return {
      totalVisits,
      totalVisitsChange: previous
         ? percentChange(totalVisits, previousTotalVisits)
         : 0,
      currentlyInside,
      currentlyInsideChange: previous
         ? percentChange(currentlyInside, previousInside)
         : 0,
      averageVisitDuration: formatVisitDuration(avgCurrent),
      averageVisitDurationChange: previous
         ? Math.round(avgCurrent - avgPrevious)
         : 0,
      overstays,
      // Live overstay count has no reliable historical snapshot.
      overstaysChange: 0,
      pendingApprovals,
      upcomingVisits,
      checkedInVisitors: currentlyInside,
      checkedOutVisitors,
   };
}

export async function getVisitGrowth(
   period: GrowthPeriod,
): Promise<VisitGrowthPoint[]> {
   const monthsBack = GROWTH_MONTHS[period];
   const rangeStart = startOfMonth(subMonths(new Date(), monthsBack - 1));

   const rows = await prisma.$queryRaw<
      Array<{ weekStart: Date; visits: bigint }>
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

   return rows.map((row) => {
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
}

export async function getMeetingTypeStats(
   range: ChartTimeRange,
): Promise<MeetingTypeStats> {
   const rangeStart = getRangeStart(CHART_RANGES[range]);

   const rows = await prisma.visit.groupBy({
      by: ['purpose'],
      where: visitsOverlappingRange({
         start: rangeStart,
         end: new Date(),
      }),
      _count: { _all: true },
      orderBy: { _count: { purpose: 'desc' } },
   });

   const data = rows.map((row, index) => ({
      purpose: row.purpose,
      name: VISIT_PURPOSE_LABELS[row.purpose],
      value: row._count._all,
      color: CHART_COLORS[index % CHART_COLORS.length],
   }));

   return {
      data,
      total: data.reduce((sum, item) => sum + item.value, 0),
   };
}

export async function getVisitStatusStats(
   range: ChartTimeRange,
): Promise<VisitStatusStats> {
   const rangeStart = getRangeStart(CHART_RANGES[range]);

   const rows = await prisma.visit.groupBy({
      by: ['status'],
      where: visitsOverlappingRange({
         start: rangeStart,
         end: new Date(),
      }),
      _count: { _all: true },
      orderBy: { _count: { status: 'desc' } },
   });

   const data = rows.map((row, index) => ({
      status: row.status,
      name: VISIT_STATUS_LABELS[row.status],
      value: row._count._all,
      color: CHART_COLORS[index % CHART_COLORS.length],
   }));

   return {
      data,
      total: data.reduce((sum, item) => sum + item.value, 0),
   };
}
