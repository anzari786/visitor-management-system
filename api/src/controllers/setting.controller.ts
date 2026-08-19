import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { APP_INFO } from '../config/app.js';

const SETTING_KEYS = [
   'orgName',
   'badgePrefix',
   'overstayEnabled',
   'overstayAfterMins',
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
   orgName: 'Ethiopian Agricultural Transformation Institute',
   badgePrefix: 'ATI',
   overstayEnabled: 'true',
   overstayAfterMins: '120',
};

const loadSettingsMap = async () => {
   const rows = await prisma.systemSetting.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
   });

   return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Partial<
      Record<SettingKey, string>
   >;
};

const formatSettings = (
   map: Partial<Record<SettingKey, string>>,
   totalUsers: number,
) => ({
   orgName: map.orgName ?? DEFAULTS.orgName,
   badgePrefix: map.badgePrefix ?? DEFAULTS.badgePrefix,
   overstayEnabled: (map.overstayEnabled ?? DEFAULTS.overstayEnabled) !== 'false',
   overstayAfterMins: Number(
      map.overstayAfterMins ?? DEFAULTS.overstayAfterMins,
   ),
   systemVersion: APP_INFO.systemVersion,
   database: APP_INFO.databaseLabel,
   totalUsers,
});

export async function getSettings(_req: Request, res: Response) {
   const [map, totalUsers] = await Promise.all([
      loadSettingsMap(),
      prisma.user.count(),
   ]);

   return res.status(200).json({
      success: true,
      data: formatSettings(map, totalUsers),
   });
}

export async function updateGeneralSettings(req: Request, res: Response) {
   const { orgName, badgePrefix, overstayEnabled, overstayAfterMins } =
      req.body as {
         orgName?: string;
         badgePrefix?: string;
         overstayEnabled?: boolean;
         overstayAfterMins?: number;
      };

   const updates: Array<{ key: SettingKey; value: string }> = [];

   if (orgName !== undefined) updates.push({ key: 'orgName', value: orgName });
   if (badgePrefix !== undefined) {
      updates.push({ key: 'badgePrefix', value: badgePrefix });
   }
   if (overstayEnabled !== undefined) {
      updates.push({
         key: 'overstayEnabled',
         value: overstayEnabled ? 'true' : 'false',
      });
   }
   if (overstayAfterMins !== undefined) {
      updates.push({
         key: 'overstayAfterMins',
         value: String(overstayAfterMins),
      });
   }

   await Promise.all(
      updates.map((item) =>
         prisma.systemSetting.upsert({
            where: { key: item.key },
            create: {
               key: item.key,
               value: item.value,
               updatedById: req.session.userId,
            },
            update: {
               value: item.value,
               updatedById: req.session.userId,
            },
         }),
      ),
   );

   const [map, totalUsers] = await Promise.all([
      loadSettingsMap(),
      prisma.user.count(),
   ]);

   return res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: formatSettings(map, totalUsers),
   });
}
