import type { VisitPurpose, VisitStatus } from '../../generated/prisma/client.js';

export type DateRange = {
   start: Date;
   end: Date;
};

export type DateRanges = {
   current: DateRange | null;
   previous: DateRange | null;
};

/** Summary cards + operational counters for the dashboard header. */
export type DashboardStats = {
   totalVisits: number;
   totalVisitsChange: number;
   currentlyInside: number;
   currentlyInsideChange: number;
   averageVisitDuration: string;
   averageVisitDurationChange: number;
   overstays: number;
   overstaysChange: number;
   pendingApprovals: number;
   upcomingVisits: number;
   checkedInVisitors: number;
   checkedOutVisitors: number;
};

export type VisitGrowthPoint = {
   year: string;
   month: string;
   week: number;
   visits: number;
};

export type ChartSlice = {
   name: string;
   value: number;
   color: string;
};

export type MeetingTypeStats = {
   data: Array<ChartSlice & { purpose: VisitPurpose }>;
   total: number;
};

export type VisitStatusStats = {
   data: Array<ChartSlice & { status: VisitStatus }>;
   total: number;
};
