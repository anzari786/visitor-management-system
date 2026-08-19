import type { Request, Response } from 'express';
import {
   getDashboardStats,
   getMeetingTypeStats,
   getVisitGrowth,
   getVisitStatusStats,
} from './dashboard.service.js';
import type {
   ChartRangeQuery,
   DashboardStatsQuery,
   VisitGrowthQuery,
} from './dashboard.validation.js';

export const getStats = async (req: Request, res: Response) => {
   const { filter } = req.validatedQuery as DashboardStatsQuery;
   const data = await getDashboardStats(filter);

   return res.status(200).json({
      success: true,
      data,
   });
};

export const getGrowth = async (req: Request, res: Response) => {
   const { period } = req.validatedQuery as VisitGrowthQuery;
   const data = await getVisitGrowth(period);

   return res.status(200).json({
      success: true,
      data,
   });
};

export const getMeetingTypes = async (req: Request, res: Response) => {
   const { range } = req.validatedQuery as ChartRangeQuery;
   const data = await getMeetingTypeStats(range);

   return res.status(200).json({
      success: true,
      data,
   });
};

export const getVisitStatuses = async (req: Request, res: Response) => {
   const { range } = req.validatedQuery as ChartRangeQuery;
   const data = await getVisitStatusStats(range);

   return res.status(200).json({
      success: true,
      data,
   });
};
