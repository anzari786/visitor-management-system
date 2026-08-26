import { VISIT_PURPOSE_OPTIONS } from '@/constants/visit-request';
import type { VisitRequestFormValues } from '@/lib/validations/visit-request.schema';
import { eachDayOfInterval, format, isSameDay } from 'date-fns';
import type { SubmitVisitRequestPayload } from '@/types/self-service.types';

export function toSubmitVisitRequestPayload(
   values: VisitRequestFormValues,
): SubmitVisitRequestPayload {
   return {
      groupType: values.visitors.length === 1 ? 'SINGLE' : 'GROUP',
      durationType: isSameDay(values.startDate, values.endDate)
         ? 'SINGLE_DAY'
         : 'MULTI_DAY',
      purpose: values.purpose,
      hostEmployeeId: Number(values.hostId),
      visitors: values.visitors.map(
         ({ firstName, lastName, phone, email, organization }) => ({
            firstName,
            lastName,
            phone,
            email,
            organization,
         }),
      ),
      scheduleDates: eachDayOfInterval({
         start: values.startDate,
         end: values.endDate,
      }).map((day) => {
         const date = format(day, 'yyyy-MM-dd');
         return {
            date: `${date}T00:00:00.000Z`,
            expectedStartTime: `${date}T${values.startTime}:00.000Z`,
            expectedEndTime: `${date}T${values.endTime}:00.000Z`,
         };
      }),
   };
}

export function getPurposeLabel(value: string) {
   return VISIT_PURPOSE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function formatVisitTime(time: string) {
   if (!time) return '';
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatVisitDateRange(startDate: Date, endDate: Date) {
   if (isSameDay(startDate, endDate)) {
      return format(startDate, 'PPP');
   }
   return `${format(startDate, 'PPP')} – ${format(endDate, 'PPP')}`;
}
