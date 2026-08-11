export type GrowthPeriod = '3m' | '6m' | '12m';

export type DepartmentTimeRange = '7days' | '30days' | '90days';

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
   averageVisitDuration: string;
   averageVisitDurationChange: number;
   overstays: number;
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
   | 'overstays';

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
