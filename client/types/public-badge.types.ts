export type PublicVisitStatus =
   | 'active'
   | 'overstay'
   | 'completed'
   | 'cancelled';

export type PublicBadgeInfo = {
   badgeNumber: string;
   visitor: {
      fullName: string;
      phone: string | null;
      organization: string | null;
   };
   host: {
      name: string;
      department: string | null;
   };
   visit: {
      purpose: string | null;
      date: string;
      startTime: string;
      endTime: string | null;
      floor: string | null;
      room: string | null;
      status: PublicVisitStatus;
   };
};
