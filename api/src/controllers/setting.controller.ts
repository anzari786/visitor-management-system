import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import { APP_INFO } from '../config/app.js';
import { NotFoundError } from '../lib/errors.js';

const settingSelect = {
   orgName: true,
   badgePrefix: true,
   overstayEnabled: true,
   overstayAfterMins: true,
   createdAt: true,
} satisfies Prisma.SettingSelect;

type SettingWithBase = Prisma.SettingGetPayload<{
   select: typeof settingSelect;
}>;

// Maps the Prisma shape onto the frontend `Settings` type
// (adds computed/env-derived fields not stored in the DB).
const formatSettings = (setting: SettingWithBase, totalUsers: number) => ({
   orgName: setting.orgName,
   badgePrefix: setting.badgePrefix,
   overstayEnabled: setting.overstayEnabled,
   overstayAfterMins: setting.overstayAfterMins,
   createdAt: setting.createdAt,
   systemVersion: APP_INFO.systemVersion,
   database: APP_INFO.databaseLabel,
   totalUsers,
});

export async function getSettings(_req: Request, res: Response) {
   const [settings, totalUsers] = await Promise.all([
      prisma.setting.findUnique({
         where: { id: 1 },
         select: settingSelect,
      }),
      prisma.user.count(),
   ]);

   if (!settings) {
      throw new NotFoundError('Settings not found');
   }

   return res.status(200).json({
      success: true,
      data: formatSettings(settings, totalUsers),
   });
}

export async function updateGeneralSettings(req: Request, res: Response) {
   const { orgName, badgePrefix, overstayEnabled, overstayAfterMins } =
      req.body;

   const [settings, totalUsers] = await Promise.all([
      prisma.setting.update({
         where: { id: 1 },
         data: { orgName, badgePrefix, overstayEnabled, overstayAfterMins },
         select: settingSelect,
      }),
      prisma.user.count(),
   ]);

   return res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: formatSettings(settings, totalUsers),
   });
}
