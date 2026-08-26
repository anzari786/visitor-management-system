'use client';

import { useMemo, useState } from 'react';
import { parse } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogClose,
} from '@/components/ui/dialog';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
   DropdownMenuCheckboxItem,
   DropdownMenuSeparator,
   DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
   Search,
   ListFilter,
   Clock,
   SearchX,
   ClipboardCheck,
   XIcon,
   Mail,
   Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MEETING_TYPE_OPTIONS } from '@/constants/meeting-types';
import {
   sendPendingApprovalReminderEmail,
   sendVisitUpdateEmail,
} from '@/services/visit-notification.service';
import { formatScheduleSummary } from '@/lib/host-visit-schedule';
import { ApproveVisitDialog } from './approve-visit-dialog';
import {
   VisitUpdateDetails,
   type VisitUpdateDetailsValue,
} from './visit-update-details';
import { HostVisitCard, type HostVisitCardData } from './host-visit-card';

type PendingApprovalsProps = {
   visits: HostVisitCardData[];
   onReschedule: (
      visit: HostVisitCardData,
      value: VisitUpdateDetailsValue,
   ) => void;
   onReject: (visitId: string) => void;
   onApprove: (visit: HostVisitCardData, floor: string, room: string) => void;
};

const PendingApprovals = ({
   visits,
   onReschedule,
   onReject,
   onApprove,
}: PendingApprovalsProps) => {
   const [searchQuery, setSearchQuery] = useState('');
   const [typeFilter, setTypeFilter] = useState<string[]>([]);
   const [updateRequest, setUpdateRequest] = useState<HostVisitCardData | null>(
      null,
   );
   const [rejectRequest, setRejectRequest] = useState<HostVisitCardData | null>(
      null,
   );
   const [approveRequest, setApproveRequest] =
      useState<HostVisitCardData | null>(null);
   // const [resendingId, setResendingId] = useState<string | null>(null);

   const filteredRequests = useMemo(() => {
      let result = visits;
      if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         result = result.filter(
            (r) =>
               r.visitorName.toLowerCase().includes(q) ||
               r.orgName?.toLowerCase().includes(q) ||
               r.meetingType.toLowerCase().includes(q),
         );
      }
      if (typeFilter.length > 0) {
         result = result.filter((r) => typeFilter.includes(r.meetingType));
      }
      return result;
   }, [searchQuery, typeFilter, visits]);

   const toggleTypeFilter = (type: string) => {
      setTypeFilter((prev) =>
         prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
      );
   };

   const hasFilters = typeFilter.length > 0;

   // const handleResendApprovalEmail = async (request: HostVisitCardData) => {
   //    if (resendingId) return;
   //    setResendingId(request.id);
   //    try {
   //       await sendPendingApprovalReminderEmail({
   //          visitorName: request.visitorName,
   //          visitSummary: `${request.meetingType} · ${request.startDate}${
   //             request.isMultiDay && request.endDate
   //                ? ` → ${request.endDate}`
   //                : ''
   //          }`,
   //       });
   //       toast.success('Approval email resent', {
   //          description: `Reminder sent for ${request.visitorName}'s visit request.`,
   //       });
   //    } catch {
   //       toast.error('Could not resend email', {
   //          description: 'Please try again in a moment.',
   //       });
   //    } finally {
   //       setResendingId(null);
   //    }
   // };

   return (
      <>
         <section className="w-full min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
               <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                     <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        Pending Approvals
                     </h2>
                     <Badge className="bg-orange-200 text-orange-900 dark:bg-orange-950 dark:text-orange-200">
                        <Clock className="size-3" />
                        {filteredRequests.length} pending
                     </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                     Review visit requests waiting for your decision
                  </p>
               </div>

               <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                     <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                     <Input
                        placeholder="Search visitors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full bg-background pl-8 text-sm sm:w-56"
                     />
                  </div>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           variant="outline"
                           size="sm"
                           className="h-9 cursor-pointer gap-1.5"
                        >
                           <ListFilter className="size-4" />
                           Meeting Type
                           {hasFilters && (
                              <span className="size-1.5 rounded-full bg-primary" />
                           )}
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuCheckboxItem
                           checked={typeFilter.length === 0}
                           onCheckedChange={() => setTypeFilter([])}
                        >
                           All meeting types
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {MEETING_TYPE_OPTIONS.map((type) => (
                           <DropdownMenuCheckboxItem
                              key={type.value}
                              checked={typeFilter.includes(type.label)}
                              onCheckedChange={() =>
                                 toggleTypeFilter(type.label)
                              }
                           >
                              {type.label}
                           </DropdownMenuCheckboxItem>
                        ))}
                        {hasFilters && (
                           <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                 onClick={() => setTypeFilter([])}
                              >
                                 Clear filter
                              </DropdownMenuItem>
                           </>
                        )}
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>

            <div className="space-y-1.5">
               {visits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
                     <ClipboardCheck className="size-8 text-muted-foreground/50" />
                     <p className="text-sm font-medium text-foreground">
                        No pending approvals
                     </p>
                     <p className="text-xs text-muted-foreground">
                        New visit requests will show up here once submitted.
                     </p>
                  </div>
               ) : filteredRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
                     <SearchX className="size-8 text-muted-foreground/50" />
                     <p className="text-sm font-medium text-foreground">
                        No visit requests found
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Try adjusting your search or filter.
                     </p>
                  </div>
               ) : (
                  filteredRequests.map((request) => (
                     <HostVisitCard
                        key={request.id}
                        visit={request}
                        statusLabel="Pending"
                        statusClassName="bg-orange-200 text-orange-900 dark:bg-orange-950 dark:text-orange-200"
                        actions={
                           <>
                              {/* <Button
                                 variant="outline"
                                 size="sm"
                                 className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
                                 disabled={resendingId === request.id}
                                 onClick={() =>
                                    handleResendApprovalEmail(request)
                                 }
                              >
                                 {resendingId === request.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                 ) : (
                                    <Mail className="size-3.5" />
                                 )}
                                 {resendingId === request.id
                                    ? 'Sending…'
                                    : 'Resend Approval Email'}
                              </Button> */}
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
                                 onClick={() => setUpdateRequest(request)}
                              >
                                 <Clock className="size-3.5" />
                                 Reschedule
                              </Button>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 className={cn(
                                    'h-8 cursor-pointer gap-1 px-2.5 text-xs',
                                    'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700',
                                    'dark:border-red-900/60 dark:hover:bg-red-950/40',
                                 )}
                                 onClick={() => setRejectRequest(request)}
                              >
                                 Reject
                              </Button>
                              <Button
                                 size="sm"
                                 className="h-8 cursor-pointer gap-1 px-2.5 text-xs hover:bg-primary/90"
                                 onClick={() => setApproveRequest(request)}
                              >
                                 Approve
                              </Button>
                           </>
                        }
                     />
                  ))
               )}
            </div>
         </section>

         <Dialog
            open={!!updateRequest}
            onOpenChange={(open) => !open && setUpdateRequest(null)}
         >
            <DialogContent
               aria-describedby={undefined}
               className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-lg [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
            >
               <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
                  <DialogTitle>Reschedule Visit</DialogTitle>
               </DialogHeader>
               {updateRequest && (
                  <VisitUpdateDetails
                     isMultiDay={updateRequest.isMultiDay}
                     visitorName={updateRequest.visitorName}
                     orgName={updateRequest.orgName}
                     meetingType={updateRequest.meetingType}
                     defaultDate={parse(
                        updateRequest.startDate,
                        'd MMM yyyy',
                        new Date(),
                     )}
                     defaultEndDate={
                        updateRequest.endDate
                           ? parse(
                                updateRequest.endDate,
                                'd MMM yyyy',
                                new Date(),
                             )
                           : undefined
                     }
                     defaultStartTime={updateRequest.time}
                     defaultEndTime={updateRequest.endTime}
                     defaultFloor={updateRequest.floor}
                     defaultRoom={updateRequest.room}
                     onCancel={() => setUpdateRequest(null)}
                     onConfirm={async (value) => {
                        const scheduleSummary = formatScheduleSummary(value);
                        await sendVisitUpdateEmail({
                           visitorName: updateRequest.visitorName,
                           floor: value.floor,
                           room: value.room,
                           scheduleSummary,
                        });
                        onReschedule(updateRequest, value);
                        setUpdateRequest(null);
                     }}
                  />
               )}
            </DialogContent>
         </Dialog>

         <ApproveVisitDialog
            request={approveRequest}
            open={!!approveRequest}
            onOpenChange={(open) => !open && setApproveRequest(null)}
            onApproved={(values) => {
               if (!approveRequest) return;
               onApprove(approveRequest, values.floor, values.room);
               setApproveRequest(null);
            }}
         />

         <Dialog
            open={!!rejectRequest}
            onOpenChange={(open) => !open && setRejectRequest(null)}
         >
            <DialogContent
               showCloseButton={false}
               aria-describedby={undefined}
               className="duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-md [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
            >
               {rejectRequest && (
                  <div className="flex flex-col items-center gap-4 text-center">
                     <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <XIcon size={20} />
                     </div>

                     <DialogHeader className="items-center">
                        <DialogTitle>Reject visit request?</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                           Reject{' '}
                           <span className="font-medium text-foreground">
                              {rejectRequest.visitorName}
                           </span>
                           &apos;s {rejectRequest.meetingType.toLowerCase()}{' '}
                           request? The visitor will be notified.
                        </p>
                     </DialogHeader>

                     <div className="flex w-full gap-3">
                        <DialogClose asChild>
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 cursor-pointer"
                           >
                              Cancel
                           </Button>
                        </DialogClose>

                        <DialogClose asChild>
                           <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                 onReject(rejectRequest.id);
                                 toast.success('Visit request rejected', {
                                    description: `${rejectRequest.visitorName} has been notified.`,
                                 });
                                 setRejectRequest(null);
                              }}
                           >
                              Reject
                           </Button>
                        </DialogClose>
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </>
   );
};

export default PendingApprovals;
