import type { InvitationPreview } from '@/services/visit-invitation.service';

/** Open `/register/demo` to preview the visitor registration page with static data. */
export const DEMO_INVITATION_TOKEN = 'demo';

export const DEMO_INVITATION_PREVIEW: InvitationPreview = {
   visitCode: 'VIS-DEMO01',
   purpose: 'MEETING',
   organization: 'ABC Company',
   expectedVisitorCount: 5,
   registeredCount: 2,
   remainingSlots: 3,
   isFull: false,
   isActive: true,
   hostName: 'John Doe',
   departmentName: 'Partnerships',
   floor: '3',
   room: 'Conference Room B',
   startDate: '2026-08-25',
   endDate: '2026-08-25',
   startTime: '09:00',
   endTime: '17:00',
   scheduleDates: ['2026-08-25'],
};
