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
   const visitorCount =
      values.knowsVisitorInfo === 'yes'
         ? values.visitors.length
         : Number(values.visitorCount ?? 1);

   const groupType: CreateHostInvitationApiPayload['groupType'] =
      visitorCount > 1 ? 'GROUP' : 'SINGLE';
   const durationType: CreateHostInvitationApiPayload['durationType'] =
      values.scheduleType === 'multi_day' ? 'MULTI_DAY' : 'SINGLE_DAY';

   const basePayload: Omit<CreateHostInvitationApiPayload, 'visitors'> = {
      groupType,
      durationType,
      purpose: values.purpose,
      hostEmployeeId,
      scheduleDates,
      floor: values.floor,
      room: values.room,
   };

   if (values.knowsVisitorInfo === 'yes') {
      return {
         ...basePayload,
         visitors: values.visitors.map((visitor) => ({
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            phone: visitor.phone,
            email: visitor.email,
            organization: visitor.organization,
         })),
      };
   }

   return {
      ...basePayload,
      visitors: [],
      expectedVisitorCount: Number(values.visitorCount ?? 1),
      organization: values.visitorOrganization,
   };
};
