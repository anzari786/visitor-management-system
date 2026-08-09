import { format } from 'date-fns';
import type { HostVisitCardData } from '@/components/host/host-visit-card';
import type { VisitUpdateDetailsValue } from '@/components/host/visit-update-details';

export function formatScheduleSummary(value: VisitUpdateDetailsValue) {
   const dateLabel =
      value.scheduleType === 'multi_day' &&
      value.date &&
      value.endDate &&
      value.date.getTime() !== value.endDate.getTime()
         ? `${format(value.date, 'PPP')} – ${format(value.endDate, 'PPP')}`
         : value.date
           ? format(value.date, 'PPP')
           : 'Updated date';

   return `${dateLabel}, ${value.startTime}–${value.endTime}`;
}

export function applyScheduleToVisit(
   visit: HostVisitCardData,
   value: VisitUpdateDetailsValue,
): HostVisitCardData {
   const startDate = value.date ? format(value.date, 'd MMM yyyy') : visit.startDate;
   const endDate =
      value.scheduleType === 'multi_day' && value.endDate
         ? format(value.endDate, 'd MMM yyyy')
         : undefined;
   const isMultiDay =
      value.scheduleType === 'multi_day' &&
      !!value.date &&
      !!value.endDate &&
      value.date.getTime() !== value.endDate.getTime();

   return {
      ...visit,
      startDate,
      endDate: isMultiDay ? endDate : undefined,
      time: value.startTime,
      endTime: value.endTime,
      isMultiDay,
      floor: value.floor,
      room: value.room,
   };
}
