'use client';

import { Badge } from '@/components/ui/badge';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import {
   getVisitTypeLabel,
   type VisitTypeValue,
} from '@/constants/visit-types';
import {
   getMeetingTypeLabel,
   type MeetingTypeValue,
} from '@/constants/meeting-types';
import { MOCK_VISITS } from '@/data/mock-visits';
import {
   applyVisitorAttendance,
   canCancel,
   canCheckIn,
   canCheckOut,
   checkOutAllEligible,
   getCheckInEligibleVisitors,
   getCheckOutEligibleVisitors,
   getRelevantVisitDay,
   syncVisitAttendanceForDay,
} from '@/lib/visit-attendance';
import { cn } from '@/lib/utils';
import type { ManagedVisit, ManagedVisitStatus } from '@/types/visit.types';
import {
   ColumnDef,
   flexRender,
   getCoreRowModel,
   useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { CalendarRange, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { FindVisitCheckInDialog } from './find-visit-check-in-dialog';
import { CheckInDialog } from './check-in-dialog';
import type { CheckInConfirmPayload } from './check-in-dialog';
import { CheckInSuccessDialog } from './check-in-success-dialog';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';
import { ManagedVisitStatusBadge } from './managed-visit-status-badge';
import VisitDetailsSheet, { getVisitTypeIcon } from './visit-details';
import { VisitRowActions } from './visit-row-actions';
import { VisitsTableFilters } from './visits-table-filters';
import { VisitsTablePagination } from './visits-table-pagination';
import { QrScannerDialog } from '@/components/shared/qr-scanner-dialog';
import { visitAttendanceLookupService } from '@/services/visit-attendance-lookup.service';
import { visitAttendanceService } from '@/services/visit-attendance.service';
import type { CheckInPrintTarget } from './check-in-success-dialog';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const DEFAULT_PAGE_SIZE = 10;

function formatTimeLabel(time: string) {
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatVisitSchedule(visit: ManagedVisit) {
   const start = parseISO(visit.startDate);
   const dateLabel =
      visit.isMultiDay && visit.endDate
         ? `${format(start, 'MMM d')} – ${format(parseISO(visit.endDate), 'MMM d, yyyy')}`
         : format(start, 'MMM d, yyyy');
   const timeLabel = `${formatTimeLabel(visit.startTime)} – ${formatTimeLabel(visit.endTime)}`;
   return { dateLabel, timeLabel };
}

function filterVisits(
   visits: ManagedVisit[],
   opts: {
      search?: string;
      status?: ManagedVisitStatus | 'all';
      department?: string;
      visitType?: VisitTypeValue | 'all';
      meetingType?: MeetingTypeValue | 'all';
   },
) {
   return visits.filter((visit) => {
      if (opts.search) {
         const q = opts.search.toLowerCase().trim();
         const matches =
            visit.visitorName.toLowerCase().includes(q) ||
            visit.id.toLowerCase().includes(q) ||
            visit.visitors.some((v) => v.name.toLowerCase().includes(q));
         if (!matches) return false;
      }
      if (
         opts.status &&
         opts.status !== 'all' &&
         visit.status !== opts.status
      ) {
         return false;
      }
      if (
         opts.department &&
         opts.department !== 'all' &&
         visit.department !== opts.department
      ) {
         return false;
      }
      if (
         opts.visitType &&
         opts.visitType !== 'all' &&
         visit.visitType !== opts.visitType
      ) {
         return false;
      }
      if (
         opts.meetingType &&
         opts.meetingType !== 'all' &&
         visit.meetingType !== opts.meetingType
      ) {
         return false;
      }
      return true;
   });
}

type RowHandlers = {
   onView: (visit: ManagedVisit) => void;
   onCheckIn: (visit: ManagedVisit) => void;
   onCheckOut: (visit: ManagedVisit) => void;
   onCancel: (visit: ManagedVisit) => void;
   onOpenAttendance: (
      visit: ManagedVisit,
      mode: 'check_in' | 'check_out',
   ) => void;
};

const getColumns = (handlers: RowHandlers): ColumnDef<ManagedVisit>[] => [
   {
      accessorKey: 'id',
      header: 'Visit ID',
      cell: ({ row }) => (
         <span className="font-mono text-xs font-medium tracking-wide text-foreground">
            {row.original.id}
         </span>
      ),
   },
   {
      id: 'visitor',
      header: 'Visitor',
      cell: ({ row }) => {
         const { visitorName, visitorCount } = row.original;
         const isGroup = visitorCount > 1;

         return (
            <div className="min-w-0">
               <p className="truncate text-sm font-medium text-foreground">
                  {visitorName}
               </p>
               {isGroup && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                     <Users className="size-3 shrink-0" />
                     <span>
                        +{visitorCount - 1} more
                        {visitorCount - 1 === 1 ? ' visitor' : ' visitors'}
                     </span>
                  </p>
               )}
            </div>
         );
      },
   },
   {
      accessorKey: 'visitorCount',
      header: 'Guests',
      cell: ({ row }) => {
         const count = row.original.visitorCount;
         return (
            <div
               className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
               title={`${count} visitor${count === 1 ? '' : 's'}`}
            >
               <Users className="size-3.5" />
               <span className="font-medium text-foreground tabular-nums">
                  {count}
               </span>
            </div>
         );
      },
   },
   {
      accessorKey: 'host',
      header: 'Host',
      cell: ({ row }) => (
         <span className="text-sm text-foreground">{row.original.host}</span>
      ),
   },
   {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {row.original.department}
         </span>
      ),
   },
   {
      accessorKey: 'visitType',
      header: 'Visit type',
      cell: ({ row }) => {
         const Icon = getVisitTypeIcon(row.original.visitType);
         return (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
               <Icon className="size-4 text-muted-foreground" />
               {getVisitTypeLabel(row.original.visitType)}
            </span>
         );
      },
   },
   {
      accessorKey: 'meetingType',
      header: 'Meeting type',
      cell: ({ row }) => (
         <Badge variant="secondary" className="h-6 rounded-md px-2 font-medium">
            {getMeetingTypeLabel(row.original.meetingType)}
         </Badge>
      ),
   },
   {
      id: 'schedule',
      header: 'Date & time',
      cell: ({ row }) => {
         const visit = row.original;
         const { dateLabel, timeLabel } = formatVisitSchedule(visit);

         return (
            <div className="space-y-0.5">
               <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {visit.isMultiDay && (
                     <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  {dateLabel}
               </p>
               <p className="text-xs text-muted-foreground">{timeLabel}</p>
            </div>
         );
      },
   },
   {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
         <ManagedVisitStatusBadge status={row.original.status} />
      ),
   },
   {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
         <VisitRowActions
            visit={row.original}
            onView={handlers.onView}
            onCheckIn={handlers.onCheckIn}
            onCheckOut={handlers.onCheckOut}
            onCancel={handlers.onCancel}
            onOpenAttendance={handlers.onOpenAttendance}
         />
      ),
   },
];

interface VisitsTableProps {
   showFilters?: boolean;
}

export function VisitsTable({ showFilters = true }: VisitsTableProps) {
   const searchParams = useSearchParams();
   const [visits, setVisits] = React.useState<ManagedVisit[]>(() =>
      MOCK_VISITS.map((visit) =>
         syncVisitAttendanceForDay(visit, getRelevantVisitDay(visit)),
      ),
   );
   const [selectedVisitId, setSelectedVisitId] = React.useState<string | null>(
      null,
   );
   const [sheetOpen, setSheetOpen] = React.useState(false);
   const [sheetMode, setSheetMode] = React.useState<
      'view' | 'check_in' | 'check_out'
   >('view');
   const [badgeCheckoutOpen, setBadgeCheckoutOpen] = React.useState(false);
   const [badgeCheckoutVisitId, setBadgeCheckoutVisitId] = React.useState<
      string | null
   >(null);
   const [badgeSuccessOpen, setBadgeSuccessOpen] = React.useState(false);
   const [badgeSuccessLabel, setBadgeSuccessLabel] = React.useState('');
   const [badgeSuccessVisitId, setBadgeSuccessVisitId] = React.useState('');
   const [qrCheckInOpen, setQrCheckInOpen] = React.useState(false);
   const [qrCheckInVisitId, setQrCheckInVisitId] = React.useState<
      string | null
   >(null);
   const [qrCheckInVisitorIds, setQrCheckInVisitorIds] = React.useState<
      string[] | null
   >(null);
   const [qrCheckInSuccessOpen, setQrCheckInSuccessOpen] =
      React.useState(false);
   const [qrCheckInSuccessLabel, setQrCheckInSuccessLabel] = React.useState('');
   const [qrCheckInSuccessVisitId, setQrCheckInSuccessVisitId] =
      React.useState('');
   const [qrCheckInPrintTargets, setQrCheckInPrintTargets] = React.useState<
      CheckInPrintTarget[]
   >([]);
   const [checkoutQrScannerOpen, setCheckoutQrScannerOpen] =
      React.useState(false);
   const [findVisitOpen, setFindVisitOpen] = React.useState(false);
   const [checkoutVisitorIds, setCheckoutVisitorIds] = React.useState<
      string[] | null
   >(null);

   const page = Number(searchParams.get('page')) || 1;
   const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
   const search = searchParams.get('search') ?? undefined;
   const statusFilter =
      (searchParams.get('status') as ManagedVisitStatus | 'all') || 'all';
   const departmentFilter = searchParams.get('department') || 'all';
   const visitTypeFilter =
      (searchParams.get('visitType') as VisitTypeValue | 'all') || 'all';
   const meetingTypeFilter =
      (searchParams.get('meetingType') as MeetingTypeValue | 'all') || 'all';

   const filtered = React.useMemo(
      () =>
         filterVisits(visits, {
            search,
            status: statusFilter,
            department: departmentFilter,
            visitType: visitTypeFilter,
            meetingType: meetingTypeFilter,
         }),
      [
         visits,
         search,
         statusFilter,
         departmentFilter,
         visitTypeFilter,
         meetingTypeFilter,
      ],
   );

   const total = filtered.length;
   const pageCount = Math.max(1, Math.ceil(total / pageSize));
   const safePage = Math.min(page, pageCount);
   const pageVisits = filtered.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize,
   );

   const selectedVisit =
      visits.find((visit) => visit.id === selectedVisitId) ?? null;

   const badgeCheckoutVisit =
      visits.find((visit) => visit.id === badgeCheckoutVisitId) ??
      visits.find((visit) => canCheckOut(visit)) ??
      null;

   const qrCheckInVisit =
      visits.find((visit) => visit.id === qrCheckInVisitId) ??
      visits.find((visit) => canCheckIn(visit)) ??
      null;

   const qrCheckInVisitors = qrCheckInVisit
      ? qrCheckInVisitorIds?.length
         ? qrCheckInVisit.visitors.filter((visitor) =>
              qrCheckInVisitorIds.includes(visitor.id),
           )
         : getCheckInEligibleVisitors(qrCheckInVisit)
      : [];

   const badgeCheckoutVisitors = badgeCheckoutVisit
      ? checkoutVisitorIds?.length
         ? badgeCheckoutVisit.visitors.filter((visitor) =>
              checkoutVisitorIds.includes(visitor.id),
           )
         : getCheckOutEligibleVisitors(badgeCheckoutVisit)
      : [];

   const lookupVisitByBadge = React.useCallback(
      (badge: string) => {
         const token = badge.trim();
         if (!token) {
            return visits.find((visit) => canCheckOut(visit)) ?? null;
         }

         return (
            visits.find((visit) => {
               if (!canCheckOut(visit)) return false;
               return getCheckOutEligibleVisitors(visit).some(
                  (visitor) => visitor.badgeToken === token,
               );
            }) ?? null
         );
      },
      [visits],
   );

   const upsertVisit = React.useCallback((updated: ManagedVisit) => {
      setVisits((prev) =>
         prev.map((visit) => (visit.id === updated.id ? updated : visit)),
      );
   }, []);

   const handleScanBadge = React.useCallback(() => {
      setCheckoutQrScannerOpen(true);
   }, []);

   const handleFindVisit = React.useCallback(() => {
      setFindVisitOpen(true);
   }, []);

   const openManualCheckIn = React.useCallback((visit: ManagedVisit) => {
      if (!canCheckIn(visit)) {
         toast.error('This visit is not ready for check-in');
         return;
      }
      const eligible = getCheckInEligibleVisitors(visit);
      setQrCheckInVisitId(visit.id);
      setQrCheckInVisitorIds(eligible.map((visitor) => visitor.id));
      setQrCheckInOpen(true);
   }, []);

   const handleCheckoutQrScanned = React.useCallback(
      async (code: string) => {
         const result =
            await visitAttendanceLookupService.lookupBadgeForCheckOut(
               code,
               visits,
            );

         if (!result.eligibleForCheckOut || result.visitors.length === 0) {
            throw new Error(
               result.reason ?? 'No checked-in visitor found for this badge',
            );
         }

         setBadgeCheckoutVisitId(result.visit.id);
         setCheckoutVisitorIds(result.visitors.map((visitor) => visitor.id));
         setBadgeCheckoutOpen(true);
         toast.success('Badge matched', {
            description: `${result.visitors.map((v) => v.name).join(', ')} · ${result.badgeToken}`,
         });
      },
      [visits],
   );

   const handleBadgeCheckoutConfirm = React.useCallback(() => {
      if (!badgeCheckoutVisit) return;
      const eligible = checkoutVisitorIds?.length
         ? badgeCheckoutVisit.visitors.filter((visitor) =>
              checkoutVisitorIds.includes(visitor.id),
           )
         : getCheckOutEligibleVisitors(badgeCheckoutVisit);
      const ids = eligible.map((visitor) => visitor.id);
      const updated = applyVisitorAttendance(
         badgeCheckoutVisit,
         ids,
         'checked_out',
      );
      upsertVisit(updated);
      setBadgeSuccessLabel(
         eligible.length === 1
            ? eligible[0]!.name
            : `${eligible.length || badgeCheckoutVisit.visitorCount} visitors`,
      );
      setBadgeSuccessVisitId(badgeCheckoutVisit.id);
      setBadgeSuccessOpen(true);
      setBadgeCheckoutVisitId(null);
      setCheckoutVisitorIds(null);
   }, [badgeCheckoutVisit, checkoutVisitorIds, upsertVisit]);

   const handleQrCheckInConfirm = React.useCallback(
      async (payload: CheckInConfirmPayload) => {
         if (!qrCheckInVisit) return;
         const ids = payload.visitorIds;
         if (ids.length === 0) return;

         const selected = qrCheckInVisit.visitors.filter((visitor) =>
            ids.includes(visitor.id),
         );

         const printTargets: CheckInPrintTarget[] = [];
         let usedApi = false;

         for (const visitor of selected) {
            if (
               visitor.visitParticipantId != null &&
               visitor.visitDayId != null
            ) {
               try {
                  const { data } = await visitAttendanceService.checkIn({
                     visitParticipantId: visitor.visitParticipantId,
                     visitDayId: visitor.visitDayId,
                  });
                  usedApi = true;
                  printTargets.push({
                     attendanceId: data.data.id,
                     visitorName: visitor.name,
                     initialStatus: data.data.printJob?.status ?? 'QUEUED',
                  });
               } catch (error) {
                  const message =
                     error instanceof AxiosError
                        ? (error.response?.data?.message as string | undefined)
                        : error instanceof Error
                          ? error.message
                          : undefined;
                  toast.error(message ?? `Unable to check in ${visitor.name}`);
                  return;
               }
            }
         }

         const withAttendance = applyVisitorAttendance(
            qrCheckInVisit,
            ids,
            'checked_in',
         );
         upsertVisit(withAttendance);

         if (!usedApi) {
            for (const visitor of withAttendance.visitors.filter((v) =>
               ids.includes(v.id),
            )) {
               printTargets.push({
                  attendanceId: visitor.attendanceId ?? `mock-${visitor.id}`,
                  visitorName: visitor.name,
                  initialStatus: 'QUEUED',
                  simulate: true,
               });
            }
         }

         const names = selected.map((visitor) => visitor.name);
         setQrCheckInSuccessLabel(
            names.length === 1 ? names[0]! : `${names.length} visitors`,
         );
         setQrCheckInSuccessVisitId(qrCheckInVisit.id);
         setQrCheckInPrintTargets(printTargets);
         setQrCheckInSuccessOpen(true);
         setQrCheckInVisitId(null);
         setQrCheckInVisitorIds(null);
      },
      [qrCheckInVisit, upsertVisit],
   );

   const handleView = React.useCallback((visit: ManagedVisit) => {
      setSelectedVisitId(visit.id);
      setSheetMode('view');
      setSheetOpen(true);
   }, []);

   const handleOpenAttendance = React.useCallback(
      (visit: ManagedVisit, mode: 'check_in' | 'check_out') => {
         if (mode === 'check_in') {
            openManualCheckIn(visit);
            return;
         }
         setSelectedVisitId(visit.id);
         setSheetMode(mode);
         setSheetOpen(true);
      },
      [openManualCheckIn],
   );

   const handleCheckIn = React.useCallback(
      (visit: ManagedVisit) => {
         openManualCheckIn(visit);
      },
      [openManualCheckIn],
   );

   const handleCheckOut = React.useCallback(
      (visit: ManagedVisit) => {
         upsertVisit(checkOutAllEligible(visit));
      },
      [upsertVisit],
   );

   const handleCancel = React.useCallback(
      (visit: ManagedVisit) => {
         if (!canCancel(visit.status)) return;
         upsertVisit({ ...visit, status: 'cancelled' });
      },
      [upsertVisit],
   );

   const columns = React.useMemo(
      () =>
         getColumns({
            onView: handleView,
            onCheckIn: handleCheckIn,
            onCheckOut: handleCheckOut,
            onCancel: handleCancel,
            onOpenAttendance: handleOpenAttendance,
         }),
      [
         handleView,
         handleCheckIn,
         handleCheckOut,
         handleCancel,
         handleOpenAttendance,
      ],
   );

   const table = useReactTable({
      data: pageVisits,
      columns,
      getCoreRowModel: getCoreRowModel(),
      manualPagination: true,
      pageCount,
   });

   return (
      <>
         <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {showFilters && (
               <VisitsTableFilters
                  onFindVisit={handleFindVisit}
                  onScanBadge={handleScanBadge}
               />
            )}

            <div className="overflow-x-auto">
               <Table>
                  <TableHeader>
                     {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                           key={headerGroup.id}
                           className="hover:bg-transparent"
                        >
                           {headerGroup.headers.map((header) => (
                              <TableHead
                                 key={header.id}
                                 className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                              >
                                 {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                         header.column.columnDef.header,
                                         header.getContext(),
                                      )}
                              </TableHead>
                           ))}
                        </TableRow>
                     ))}
                  </TableHeader>
                  <TableBody>
                     {pageVisits.length ? (
                        table.getRowModel().rows.map((row) => (
                           <TableRow
                              key={row.id}
                              className="group/row border-border/70"
                           >
                              {row.getVisibleCells().map((cell) => (
                                 <TableCell
                                    key={cell.id}
                                    className={cn(
                                       'px-4 py-3.5',
                                       cell.column.id === 'actions' && 'w-12',
                                    )}
                                 >
                                    {flexRender(
                                       cell.column.columnDef.cell,
                                       cell.getContext(),
                                    )}
                                 </TableCell>
                              ))}
                           </TableRow>
                        ))
                     ) : (
                        <TableRow className="hover:bg-transparent">
                           <TableCell
                              colSpan={columns.length}
                              className="h-40 px-4 text-center"
                           >
                              <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5">
                                 <p className="text-sm font-medium text-foreground">
                                    No visits found
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                    Try adjusting your search or filters to find
                                    what you&apos;re looking for.
                                 </p>
                              </div>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>

            <VisitsTablePagination total={total} pageCount={pageCount} />
         </div>

         <VisitDetailsSheet
            visit={selectedVisit}
            open={sheetOpen}
            onOpenChange={(open) => {
               setSheetOpen(open);
               if (!open) {
                  setSheetMode('view');
               }
            }}
            onVisitChange={upsertVisit}
            initialMode={sheetMode}
         />

         <FindVisitCheckInDialog
            open={findVisitOpen}
            onOpenChange={setFindVisitOpen}
            visits={visits}
            onSelectVisit={openManualCheckIn}
         />

         <QrScannerDialog
            open={checkoutQrScannerOpen}
            onOpenChange={setCheckoutQrScannerOpen}
            title="Scan Badge QR"
            description="Scan the printed visitor badge QR to find the checked-in visitor."
            onScan={handleCheckoutQrScanned}
         />

         <CheckInDialog
            open={qrCheckInOpen}
            onOpenChange={(open) => {
               setQrCheckInOpen(open);
               if (!open) {
                  setQrCheckInVisitId(null);
                  setQrCheckInVisitorIds(null);
               }
            }}
            visit={qrCheckInVisit}
            visitors={qrCheckInVisitors}
            onConfirm={handleQrCheckInConfirm}
         />

         <CheckInSuccessDialog
            open={qrCheckInSuccessOpen}
            onOpenChange={setQrCheckInSuccessOpen}
            visitorLabel={qrCheckInSuccessLabel}
            visitId={qrCheckInSuccessVisitId}
            printTargets={qrCheckInPrintTargets}
            onRetryPrint={async (attendanceId) => {
               if (attendanceId.startsWith('mock-')) {
                  return {
                     id: `mock-retry-${attendanceId}`,
                     attendanceId,
                     status: 'QUEUED',
                  };
               }
               const { data } =
                  await visitAttendanceService.retryPrint(attendanceId);
               return data.data;
            }}
         />

         <CheckOutConfirmDialog
            open={badgeCheckoutOpen}
            onOpenChange={(open) => {
               setBadgeCheckoutOpen(open);
               if (!open) {
                  setBadgeCheckoutVisitId(null);
                  setCheckoutVisitorIds(null);
               }
            }}
            visit={badgeCheckoutVisit}
            visitors={badgeCheckoutVisitors}
            scanMode
            onLookupBadge={(badge) => {
               const found = lookupVisitByBadge(badge);
               if (found) setBadgeCheckoutVisitId(found.id);
               return found;
            }}
            onScanBadgeRequest={() => setCheckoutQrScannerOpen(true)}
            onConfirm={handleBadgeCheckoutConfirm}
         />

         <CheckOutSuccessDialog
            open={badgeSuccessOpen}
            onOpenChange={setBadgeSuccessOpen}
            visitorLabel={badgeSuccessLabel}
            visitId={badgeSuccessVisitId}
         />
      </>
   );
}
