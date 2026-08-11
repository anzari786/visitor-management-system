import type { Request, Response } from 'express';
import {
   createBadge,
   formatBadge,
   getBadgeById,
   listBadges,
} from '../services/badge.service.js';
import type {
   CreateBadgeBody,
   listBadgesSchema,
   badgeIdParamSchema,
} from '../validations/badge.validation.js';
import type { z } from 'zod';

type ListBadgesQuery = z.infer<typeof listBadgesSchema>['query'];
type BadgeIdParams = z.infer<typeof badgeIdParamSchema>['params'];

export const postBadge = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateBadgeBody;
   const badge = await createBadge(input);

   return res.status(201).json({
      success: true,
      message: 'Badge registered successfully',
      data: formatBadge(badge),
   });
};

export const getBadges = async (req: Request, res: Response) => {
   const { status, badgeNumber, page, limit } =
      req.validatedQuery as ListBadgesQuery;

   const result = await listBadges({
      status,
      badgeNumber,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: result.badges.map(formatBadge),
      pagination: result.pagination,
   });
};

export const getBadge = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeIdParams;
   const badge = await getBadgeById(id);

   return res.status(200).json({
      success: true,
      data: formatBadge(badge),
   });
};
