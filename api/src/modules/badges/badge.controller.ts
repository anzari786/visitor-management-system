import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   createBadge,
   listBadges,
   getBadgeById,
   updateBadge,
   assignBadge,
   releaseBadge,
   reportBadgeLost,
   disableBadge,
   restoreBadge,
   formatBadge,
} from './badge.service.js';
import type {
   createBadgeSchema,
   listBadgesSchema,
   badgeIdParamSchema,
   updateBadgeSchema,
   badgeActionSchema,
} from './badge.validation.js';

type CreateBadgeBody = z.infer<typeof createBadgeSchema>['body'];
type ListBadgesQuery = z.infer<typeof listBadgesSchema>['query'];
type BadgeIdParams = z.infer<typeof badgeIdParamSchema>['params'];
type UpdateBadgeParams = z.infer<typeof updateBadgeSchema>['params'];
type UpdateBadgeBody = z.infer<typeof updateBadgeSchema>['body'];
type BadgeActionParams = z.infer<typeof badgeActionSchema>['params'];
type BadgeActionBody = z.infer<typeof badgeActionSchema>['body'];

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

   const { badges, meta } = await listBadges({
      status,
      badgeNumber,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: badges.map(formatBadge),
      pagination: meta,
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

export const patchBadge = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as UpdateBadgeParams;
   const input = req.validatedBody as UpdateBadgeBody;
   const badge = await updateBadge(id, input);

   return res.status(200).json({
      success: true,
      message: 'Badge updated successfully',
      data: formatBadge(badge),
   });
};

export const postAssignBadge = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeIdParams;
   const badge = await assignBadge(id);

   return res.status(200).json({
      success: true,
      message: 'Badge assigned successfully',
      data: formatBadge(badge),
   });
};

export const postReleaseBadge = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeIdParams;
   const badge = await releaseBadge(id);

   return res.status(200).json({
      success: true,
      message: 'Badge released successfully',
      data: formatBadge(badge),
   });
};

export const postBadgeLost = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeActionParams;
   const { note } = req.validatedBody as BadgeActionBody;
   const badge = await reportBadgeLost(id, note);

   return res.status(200).json({
      success: true,
      message: 'Badge reported lost',
      data: formatBadge(badge),
   });
};

export const postBadgeDisabled = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeActionParams;
   const { note } = req.validatedBody as BadgeActionBody;
   const badge = await disableBadge(id, note);

   return res.status(200).json({
      success: true,
      message: 'Badge disabled',
      data: formatBadge(badge),
   });
};

export const postRestoreBadge = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as BadgeActionParams;
   const { note } = req.validatedBody as BadgeActionBody;
   const badge = await restoreBadge(id, note);

   return res.status(200).json({
      success: true,
      message: 'Badge restored to service',
      data: formatBadge(badge),
   });
};
