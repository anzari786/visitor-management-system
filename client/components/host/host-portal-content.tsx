'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PortalHeader } from '@/components/shared/portal-header';
import type { HostVisitCardData } from './host-visit-card';
import { CreateInvitationDialog } from './create-invitation-dialog';
import { HostHeroSection } from './host-hero-section';
import PendingApprovals from './pending-approvals';
import { RescheduleConfirmedDialog } from './reschedule-confirmed-dialog';
import { UpcomingVisits } from './upcoming-visits';
import { applyScheduleToVisit } from '@/lib/host-visit-schedule';
import type { VisitUpdateDetailsValue } from './visit-update-details';

/**
 * Local mock seed data for the Host Portal UI.
 * Replace with `useHostPendingVisits` / `useHostUpcomingVisits` from
 * `@/hooks/use-host` when the host API is available.
 */
const INITIAL_PENDING: HostVisitCardData[] = [
   {
      id: '1',
      visitorName: 'Abebe Kebede',
      isGroup: false,
      orgName: 'Commercial Bank of Ethiopia',
      meetingType: 'Meeting',
      startDate: '12 Mar 2024',
      time: '08:00',
      endTime: '09:00',
      isMultiDay: false,
   },
   {
      id: '2',
      visitorName: 'Selamawit Tesfaye',
      isGroup: true,
      groupSize: 4,
      orgName: 'Dashen Bank',
      meetingType: 'Audit',
      startDate: '14 Mar 2024',
      endDate: '16 Mar 2024',
      time: '09:13',
      endTime: '17:00',
      isMultiDay: true,
   },
   {
      id: '3',
      visitorName: 'Dawit Bekele',
      isGroup: false,
      meetingType: 'Interview',
      startDate: '15 Mar 2024',
      time: '10:26',
      endTime: '11:00',
      isMultiDay: false,
   },
   {
      id: '4',
      visitorName: 'Meron Alemu',
      isGroup: true,
      groupSize: 2,
      orgName: 'Awash Insurance',
      meetingType: 'Site Visit',
      startDate: '16 Mar 2024',
      time: '11:39',
      endTime: '12:30',
      isMultiDay: false,
   },
   {
      id: '5',
      visitorName: 'Hana Girma',
      isGroup: false,
      orgName: 'Kifiya Financial Technology',
      meetingType: 'Vendor Review',
      startDate: '18 Mar 2024',
      endDate: '20 Mar 2024',
      time: '13:00',
      endTime: '16:30',
      isMultiDay: true,
   },
   {
      id: '6',
      visitorName: 'Yonas Tadesse',
      isGroup: false,
      orgName: 'Ethiopian Airlines',
      meetingType: 'Delivery',
      startDate: '19 Mar 2024',
      time: '09:45',
      endTime: '10:15',
      isMultiDay: false,
   },
   {
      id: '7',
      visitorName: 'Bethlehem Assefa',
      isGroup: false,
      meetingType: 'Meeting',
      startDate: '20 Mar 2024',
      time: '14:10',
      endTime: '15:00',
      isMultiDay: false,
   },
   {
      id: '8',
      visitorName: 'Tewodros Wolde',
      isGroup: true,
      groupSize: 6,
      orgName: 'Sunshine Construction',
      meetingType: 'Site Visit',
      startDate: '21 Mar 2024',
      endDate: '23 Mar 2024',
      time: '08:30',
      endTime: '17:30',
      isMultiDay: true,
   },
   {
      id: '9',
      visitorName: 'Rahel Mulugeta',
      isGroup: false,
      orgName: 'Zemen Bank',
      meetingType: 'Training',
      startDate: '22 Mar 2024',
      time: '10:00',
      endTime: '12:00',
      isMultiDay: false,
   },
   {
      id: '10',
      visitorName: 'Samuel Getachew',
      isGroup: false,
      meetingType: 'Delivery',
      startDate: '23 Mar 2024',
      time: '15:20',
      endTime: '15:50',
      isMultiDay: false,
   },
];

const INITIAL_UPCOMING: HostVisitCardData[] = [
   {
      id: 'u1',
      visitorName: 'Kidist Hailu',
      isGroup: false,
      orgName: 'Ministry of Agriculture',
      meetingType: 'Official Visit',
      startDate: '10 Mar 2026',
      time: '09:00',
      endTime: '10:30',
      isMultiDay: false,
      floor: '3rd Floor',
      room: 'Conference Room A',
   },
   {
      id: 'u2',
      visitorName: 'Daniel Mekonnen',
      isGroup: true,
      groupSize: 3,
      orgName: 'Ethio Telecom',
      meetingType: 'Meeting',
      startDate: '11 Mar 2026',
      time: '14:00',
      endTime: '16:00',
      isMultiDay: false,
      floor: '2nd Floor',
      room: 'Board Room',
   },
   {
      id: 'u3',
      visitorName: 'Sara Bekele',
      isGroup: false,
      orgName: 'Awash Bank',
      meetingType: 'Training',
      startDate: '12 Mar 2026',
      endDate: '13 Mar 2026',
      time: '08:30',
      endTime: '17:00',
      isMultiDay: true,
      floor: 'Ground Floor',
      room: 'Training Room 1',
   },
   {
      id: 'u4',
      visitorName: 'Henok Tadesse',
      isGroup: false,
      meetingType: 'Delivery',
      startDate: '14 Mar 2026',
      time: '11:00',
      endTime: '11:30',
      isMultiDay: false,
      floor: '1st Floor',
      room: 'Reception Hall',
   },
   {
      id: 'u5',
      visitorName: 'Liya Assefa',
      isGroup: true,
      groupSize: 2,
      orgName: 'Dashen Bank',
      meetingType: 'Audit',
      startDate: '15 Mar 2026',
      time: '10:00',
      endTime: '12:00',
      isMultiDay: false,
      floor: '4th Floor',
      room: 'Meeting Room 2',
   },
];

type ConfirmedReschedule = {
   visit: HostVisitCardData;
};

export function HostPortalContent() {
   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [pendingVisits, setPendingVisits] = useState(INITIAL_PENDING);
   const [upcomingVisits, setUpcomingVisits] = useState(INITIAL_UPCOMING);
   const [confirmedReschedule, setConfirmedReschedule] =
      useState<ConfirmedReschedule | null>(null);

   const handlePendingReschedule = (
      visit: HostVisitCardData,
      value: VisitUpdateDetailsValue,
   ) => {
      const updatedVisit = applyScheduleToVisit(visit, value);

      setPendingVisits((prev) => prev.filter((item) => item.id !== visit.id));
      setUpcomingVisits((prev) => [updatedVisit, ...prev]);
      setConfirmedReschedule({ visit: updatedVisit });
   };

   const handleUpcomingReschedule = (
      visit: HostVisitCardData,
      value: VisitUpdateDetailsValue,
   ) => {
      const updatedVisit = applyScheduleToVisit(visit, value);
      setUpcomingVisits((prev) =>
         prev.map((item) => (item.id === visit.id ? updatedVisit : item)),
      );
   };

   const handleCancelUpcoming = (visitId: string, _reason: string) => {
      setUpcomingVisits((prev) => prev.filter((item) => item.id !== visitId));
   };

   const handleRejectPending = (visitId: string) => {
      setPendingVisits((prev) => prev.filter((item) => item.id !== visitId));
   };

   const handleApprovePending = (
      visit: HostVisitCardData,
      floor: string,
      room: string,
   ) => {
      setPendingVisits((prev) => prev.filter((item) => item.id !== visit.id));
      setUpcomingVisits((prev) => [{ ...visit, floor, room }, ...prev]);
   };

   return (
      <div className="min-h-dvh w-full bg-background">
         <PortalHeader homeHref="/host" />
         <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
            <CreateInvitationDialog
               open={createDialogOpen}
               onOpenChange={setCreateDialogOpen}
            />

            <HostHeroSection
               onCreateInvitation={() => setCreateDialogOpen(true)}
            />

            <PendingApprovals
               visits={pendingVisits}
               onReschedule={handlePendingReschedule}
               onReject={handleRejectPending}
               onApprove={handleApprovePending}
            />

            <div className="flex w-full items-center gap-4 py-1">
               <Separator className="flex-1" />
               <Badge className="h-6 shrink-0 rounded-full px-4 text-xs font-medium">
                  Upcoming Visits
               </Badge>
               <Separator className="flex-1" />
            </div>

            <UpcomingVisits
               visits={upcomingVisits}
               onReschedule={handleUpcomingReschedule}
               onCancel={handleCancelUpcoming}
            />

            <RescheduleConfirmedDialog
               visit={confirmedReschedule?.visit ?? null}
               open={!!confirmedReschedule}
               onOpenChange={(open) => !open && setConfirmedReschedule(null)}
            />
         </main>
      </div>
   );
}
