import type { PublicBadgeInfo } from '@/types/public-badge.types';

/** Open `/badge/demo` to preview the public badge page with static data. */
export const DEMO_BADGE_TOKEN = 'demo';

export const DEMO_PUBLIC_BADGE_INFO: PublicBadgeInfo = {
   badgeNumber: 'ATI-001',
   visitor: {
      fullName: 'Sara Bekele',
      phone: '+251 911 234 567',
      organization: 'Green Valley Agro',
   },
   host: {
      name: 'Daniel Hailu',
      department: 'Partnerships',
   },
   visit: {
      purpose: 'Project kickoff meeting',
      date: '2026-08-11',
      startTime: '2026-08-11T09:30:00.000Z',
      endTime: '2026-08-11T11:00:00.000Z',
      floor: '3',
      room: 'Conference Room B',
      status: 'active',
   },
};
