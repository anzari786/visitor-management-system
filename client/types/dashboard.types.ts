export type GrowthPeriod = '3m' | '6m' | '12m';

export type DepartmentTimeRange = '7days' | '30days' | '90days';

export type ExportPeriod = '7d' | '30d' | '3m' | '6m' | 'all' | 'custom';

export type ExportVisitStatus =
   | 'PENDING_APPROVAL'
   | 'APPROVED'
   | 'REJECTED'
   | 'EXPIRED'
   | 'RESCHEDULED'
   | 'CANCELLED'
   | 'PARTIALLY_CHECKED_IN'
   | 'CHECKED_IN'
   | 'PARTIALLY_CHECKED_OUT'
   | 'CHECKED_OUT';

export type ExportVisitLogParams = {
   period: ExportPeriod;
   departmentId?: number;
   status?: ExportVisitStatus;
   from?: string;
   to?: string;
};

export type DateFilter =
   | 'all'
   | 'today'
   | 'yesterday'
   | 'last_7_days'
   | 'last_30_days'
   | 'this_month';

/**
 * Dashboard summary card data
 */
export type VisitStats = {
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

/**
 * Visit growth chart point
 */
export type VisitGrowthDataPoint = {
   year: string;
   month: string;
   week: number;
   visits: number;
};

/**
 * Department visits chart item
 */
export type DepartmentVisitDataPoint = {
   name: string;
   shortName?: string;
   value: number;
   color: string;
};

export type DepartmentVisitsData = {
   data: DepartmentVisitDataPoint[];
   total: number;
};

/**
 * Dashboard summary stat card (UI-ready; swap mock for API later)
 */
export type DashboardStatId =
   | 'total_visits'
   | 'currently_inside'
   | 'avg_duration'
   | 'pending_approvals';

export type DashboardStatCard = {
   id: DashboardStatId;
   title: string;
   value: string;
   change: string;
   changeValue: string;
   isPositive: boolean;
};

/**
 * Meeting type pie chart item
 */
export type MeetingTypeDataPoint = {
   name: string;
   value: number;
   color: string;
};

export type MeetingTypeChartData = {
   data: MeetingTypeDataPoint[];
   total: number;
};
