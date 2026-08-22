import { eachDayOfInterval, startOfDay } from 'date-fns';
import type { HostInvitationFormValues } from '@/lib/validations/host-invitation.schema';

export interface CreateHostInvitationApiPayload {
   groupType: 'SINGLE' | 'GROUP';
   durationType: 'SINGLE_DAY' | 'MULTI_DAY';
   purpose: string;
   hostEmployeeId: number;
   visitors: Array<{
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      organization?: string;
   }>;
   expectedVisitorCount?: number;
   organization?: string;
   scheduleDates: Array<{
      date: Date;
      expectedStartTime?: Date;
      expectedEndTime?: Date;
   }>;
   floor: string;
   room: string;
}

const parseTimeOnDate = (date: Date, time: string): Date => {
   const [hours, minutes] = time.split(':').map(Number);
   const result = new Date(date);
   result.setHours(hours ?? 0, minutes ?? 0, 0, 0);
   return result;
};

const buildScheduleDates = (
   values: HostInvitationFormValues,
): CreateHostInvitationApiPayload['scheduleDates'] => {
   if (values.scheduleType === 'single_day' && values.visitDate) {
      const date = startOfDay(values.visitDate);
      return [
         {
            date,
            expectedStartTime: parseTimeOnDate(date, values.startTime),
            expectedEndTime: parseTimeOnDate(date, values.endTime),
         },
      ];
   }

   if (values.scheduleType === 'multi_day' && values.startDate && values.endDate) {
      return eachDayOfInterval({
         start: startOfDay(values.startDate),
         end: startOfDay(values.endDate),
      }).map((date) => ({
         date,
         expectedStartTime: parseTimeOnDate(date, values.startTime),
         expectedEndTime: parseTimeOnDate(date, values.endTime),
      }));
   }

   return [];
};

export const mapHostInvitationToApi = (
   values: HostInvitationFormValues,
   hostEmployeeId: number,
): CreateHostInvitationApiPayload => {
   const scheduleDates = buildScheduleDates(values);
   const isKnown = values.knowsVisitorInfo === 'yes';

   if (isKnown) {
      const visitorCount = values.visitors.length;
      return {
         groupType: visitorCount > 1 ? 'GROUP' : 'SINGLE',
         durationType:
            values.scheduleType === 'multi_day' ? 'MULTI_DAY' : 'SINGLE_DAY',
         purpose: values.purpose,
         hostEmployeeId,
         visitors: values.visitors.map((visitor) => ({
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            phone: visitor.phone,
            email: visitor.email,
            organization: visitor.organization,
         })),
         scheduleDates,
         floor: values.floor,
         room: values.room,
      };
   }

   const expectedVisitorCount = values.visitorCount ?? 1;

   return {
      groupType: expectedVisitorCount > 1 ? 'GROUP' : 'SINGLE',
      durationType:
         values.scheduleType === 'multi_day' ? 'MULTI_DAY' : 'SINGLE_DAY',
      purpose: values.purpose,
      hostEmployeeId,
      visitors: [],
      expectedVisitorCount,
      organization: values.visitorOrganization?.trim() || undefined,
      scheduleDates,
      floor: values.floor,
      room: values.room,
   };
};
