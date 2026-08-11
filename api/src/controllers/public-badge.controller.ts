import type { Request, Response } from 'express';
import { getPublicBadgeInfoByQrToken } from '../services/public-badge.service.js';
import type { publicBadgeLookupSchema } from '../validations/public-badge.validation.js';
import type { z } from 'zod';

type PublicBadgeQuery = z.infer<typeof publicBadgeLookupSchema>['query'];

export const getPublicBadgeByQr = async (req: Request, res: Response) => {
   const { token } = req.validatedQuery as PublicBadgeQuery;
   const data = await getPublicBadgeInfoByQrToken(token);

   return res.status(200).json({
      success: true,
      data,
   });
};
