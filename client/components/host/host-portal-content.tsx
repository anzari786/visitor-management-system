'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PortalHeader } from '@/components/shared/portal-header';
import {
   useApproveHostVisit,
   useCancelHostVisit,
   useHostPendingVisits,
   useHostUpcomingVisits,
   useRejectHostVisit,
   useRescheduleHostVisit,
} from '@/hooks/use-host';
import type { HostVisitCardData } from './host-visit-card';
import { CreateInvitationDialog } from './create-invitation-dialog';
import { HostHeroSection } from './host-hero-section';
import PendingApprovals from './pending-approvals';
import { RescheduleConfirmedDialog } from './reschedule-confirmed-dialog';
import { UpcomingVisits } from './upcoming-visits';
import type { VisitUpdateDetailsValue } from './visit-update-details';
import { useTranslation } from '@/lib/i18n';

function SpinnerEllipsis() {
   return (
      <>
         <style>{`
            .spinner-ellipsis-dot {
               animation: spinner-ellipsis 1s ease-in-out infinite;
            }
            @keyframes spinner-ellipsis {
               0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
               40% { transform: scale(1); opacity: 1; }
            }
         `}</style>
         <div className="flex items-center gap-1.5 text-muted-foreground">
            {[0, 0.2, 0.4].map((delay, i) => (
               <span
                  key={i}
                  className="size-2 rounded-full bg-current spinner-ellipsis-dot"
                  style={{ animationDelay: `${delay}s` }}
               />
            ))}
         </div>
      </>
   );
}

function ListState({
   loading,
   error,
   loadingLabel,
   errorLabel,
}: {
   loading: boolean;
   error: boolean;
   loadingLabel: string;
   errorLabel: string;
}) {
   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
            <SpinnerEllipsis />
            <p className="text-sm font-medium text-foreground">{loadingLabel}</p>
         </div>
      );
   }

   if (error) {
      return (
         <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20">
            <AlertCircle className="size-7 text-red-500 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-200">
               {errorLabel}
            </p>
         </div>
      );
   }

   return null;
}

type ConfirmedReschedule = { visit: HostVisitCardData };

function toReschedulePayload(value: VisitUpdateDetailsValue) {
   const startDate = value.date;
   const endDate = value.endDate ?? startDate;
   const dates =
      value.scheduleType === 'multi_day' && startDate && endDate
         ? [startDate, endDate]
         : startDate
           ? [startDate]
           : [];

   return {
      scheduleDates: dates.map((date) => ({
         date,
         expectedStartTime: new Date(
            `${date.toISOString().slice(0, 10)}T${value.startTime}`,
         ),
         expectedEndTime: new Date(
            `${date.toISOString().slice(0, 10)}T${value.endTime}`,
         ),
      })),
      floor: value.floor,
      room: value.room,
   };
}

export function HostPortalContent() {
   const { t } = useTranslation();
   const [createDialogOpen, setCreateDialogOpen] = useState(false);
   const [confirmedReschedule, setConfirmedReschedule] =
      useState<ConfirmedReschedule | null>(null);
   const pendingVisitsQuery = useHostPendingVisits();
   const upcomingVisitsQuery = useHostUpcomingVisits();
   const pendingVisits = pendingVisitsQuery.data ?? [];
   const upcomingVisits = upcomingVisitsQuery.data ?? [];
   const approveVisit = useApproveHostVisit();
   const rejectVisit = useRejectHostVisit();
   const rescheduleVisit = useRescheduleHostVisit();
   const cancelVisit = useCancelHostVisit();

   const handleReschedule = async (
      visit: HostVisitCardData,
      value: VisitUpdateDetailsValue,
   ) => {
      try {
         await rescheduleVisit.mutateAsync({
            id: visit.id,
            payload: toReschedulePayload(value),
         });
         toast.success('Visit rescheduled');
         setConfirmedReschedule({ visit });
      } catch (error) {
         toast.error(
            error instanceof Error
               ? error.message
               : 'Unable to reschedule visit.',
         );
         throw error;
      }
   };

   const handleCancel = async (visitId: string, reason: string) => {
      try {
         await cancelVisit.mutateAsync({
            id: visitId,
            payload: { note: reason },
         });
         toast.success('Visit cancelled');
      } catch (error) {
         toast.error(
            error instanceof Error ? error.message : 'Unable to cancel visit.',
         );
         throw error;
      }
   };

   const handleReject = async (visitId: string) => {
      try {
         await rejectVisit.mutateAsync({ id: visitId });
         toast.success('Visit request rejected');
      } catch (error) {
         toast.error(
            error instanceof Error ? error.message : 'Unable to reject visit.',
         );
         throw error;
      }
   };

   const handleApprove = async (
      visit: HostVisitCardData,
      floor: string,
      room: string,
   ) => {
      try {
         await approveVisit.mutateAsync({
            id: visit.id,
            payload: { floor, room },
         });
         toast.success(`Visit approved for ${visit.visitorName}`);
      } catch (error) {
         toast.error(
            error instanceof Error ? error.message : 'Unable to approve visit.',
         );
         throw error;
      }
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
            {pendingVisitsQuery.isLoading ? (
               <ListState
                  loading
                  error={false}
                  loadingLabel="Loading pending approvals..."
                  errorLabel="Unable to load pending approvals right now."
               />
            ) : pendingVisitsQuery.isError ? (
               <ListState
                  loading={false}
                  error
                  loadingLabel="Loading pending approvals..."
                  errorLabel="Unable to load pending approvals right now."
               />
            ) : (
               <PendingApprovals
                  visits={pendingVisits}
                  onReschedule={handleReschedule}
                  onReject={handleReject}
                  onApprove={handleApprove}
               />
            )}
            <div className="flex w-full items-center gap-4 py-1">
               <Separator className="flex-1" />
               <Badge className="h-6 shrink-0 rounded-full px-4 text-xs font-medium">
                  {t('host.upcoming.title')}
               </Badge>
               <Separator className="flex-1" />
            </div>
            {upcomingVisitsQuery.isLoading ? (
               <ListState
                  loading
                  error={false}
                  loadingLabel="Loading upcoming visits..."
                  errorLabel="Unable to load upcoming visits right now."
               />
            ) : upcomingVisitsQuery.isError ? (
               <ListState
                  loading={false}
                  error
                  loadingLabel="Loading upcoming visits..."
                  errorLabel="Unable to load upcoming visits right now."
               />
            ) : (
               <UpcomingVisits
                  visits={upcomingVisits}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
               />
            )}
            <RescheduleConfirmedDialog
               visit={confirmedReschedule?.visit ?? null}
               open={!!confirmedReschedule}
               onOpenChange={(open) => !open && setConfirmedReschedule(null)}
            />
         </main>
      </div>
   );
}
