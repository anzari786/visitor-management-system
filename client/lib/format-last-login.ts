import {
   differenceInCalendarDays,
   differenceInCalendarMonths,
   differenceInCalendarYears,
   differenceInHours,
   differenceInMinutes,
} from 'date-fns';
import type { TranslationKey } from '@/lib/i18n';

export type LastLoginLabel = {
   key: TranslationKey;
   vars?: Record<string, number>;
};

/**
 * Relative "last seen" label as a dictionary key so it renders in the
 * active language: `t(label.key, label.vars)`.
 */
export function getLastLoginLabel(
   lastLoginAt?: string | Date | null,
): LastLoginLabel {
   if (!lastLoginAt) return { key: 'lastLogin.never' };

   const date = new Date(lastLoginAt);
   const now = new Date();

   const minutes = differenceInMinutes(now, date);
   if (minutes < 1) return { key: 'lastLogin.justNow' };
   if (minutes < 60) return { key: 'lastLogin.minutesAgo', vars: { count: minutes } };

   const hours = differenceInHours(now, date);
   if (hours < 24) return { key: 'lastLogin.hoursAgo', vars: { count: hours } };

   const days = differenceInCalendarDays(now, date);
   if (days === 1) return { key: 'common.yesterday' };
   if (days < 30) return { key: 'lastLogin.daysAgo', vars: { count: days } };

   const months = differenceInCalendarMonths(now, date);
   if (months < 12) return { key: 'lastLogin.monthsAgo', vars: { count: months } };

   return {
      key: 'lastLogin.yearsAgo',
      vars: { count: differenceInCalendarYears(now, date) },
   };
}
