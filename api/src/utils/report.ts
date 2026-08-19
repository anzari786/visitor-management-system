import {
   differenceInMinutes,
   endOfDay,
   format,
   startOfDay,
   subDays,
   subMonths,
} from 'date-fns';
import { REPORT_PERIODS } from '../constants/report.constants.js';
import { ExportVisitLogQuery } from '../validations/report.validation.js';

export function resolveDateRange(
   period: ExportVisitLogQuery['period'],
   from?: string,
   to?: string,
) {
   const now = new Date();

   if (period === 'all') {
      return null;
   }

   if (period === 'custom') {
      return {
         start: startOfDay(new Date(from!)),
         end: endOfDay(new Date(to!)),
      };
   }

   const config = REPORT_PERIODS[period];

   return {
      start:
         config.unit === 'days'
            ? subDays(startOfDay(now), config.value)
            : startOfDay(subMonths(now, config.value)),
      end: now,
   };
}

export function buildCsvFilename(departmentName?: string) {
   const dateStr = format(new Date(), 'yyyy-MM-dd');
   const deptSuffix = departmentName
      ? `-dept-${departmentName.replace(/\s+/g, '-').toLowerCase()}`
      : '';
   return `visit-log${deptSuffix}-${dateStr}.csv`;
}

export function formatDuration(start: Date, end: Date): string {
   const totalMinutes = differenceInMinutes(end, start);
   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;

   if (hours === 0) return `${minutes}min`;
   if (minutes === 0) return `${hours}hr`;
   return `${hours}hr ${minutes}min`;
}
