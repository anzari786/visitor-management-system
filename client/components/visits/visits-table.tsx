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
import { CheckInDialog } from './check-in-dialog';
import { CheckInSuccessDialog } from './check-in-success-dialog';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';
import { ManagedVisitStatusBadge } from './managed-visit-status-badge';
import VisitDetailsSheet from './visit-details';
import { VisitRowActions } from './visit-row-actions';
import { VisitsTableFilters } from './visits-table-filters';
import { VisitsTablePagination } from './visits-table-pagination';

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
      if (opts.status && opts.status !== 'all' && visit.status !== opts.status) {
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
   onCheckOut: (visit: ManagedVisit) => void;
   onCancel: (visit: ManagedVisit) => void;
   onOpenAttendance: (visit: ManagedVisit, mode: 'check_out') => void;
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
   const [qrCheckInVisitId, setQrCheckInVisitId] = React.useState<string | null>(
      null,
   );
   const [qrCheckInSuccessOpen, setQrCheckInSuccessOpen] = React.useState(false);
   const [qrCheckInSuccessLabel, setQrCheckInSuccessLabel] = React.useState('');
   const [qrCheckInSuccessVisitId, setQrCheckInSuccessVisitId] =
      React.useState('');

   const page = Number(searchParams.get('page')) || 1;
   const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
   const search = searchParams.get('search') ?? undefined;
   const statusFilter =
      (searchParams.get('status') as ManagedVisitStatus | 'all') || 'all';
   const departmentFilter = searchParams.get('department') || 'all';
   const meetingTypeFilter =
      (searchParams.get('meetingType') as MeetingTypeValue | 'all') || 'all';

   const filtered = React.useMemo(
      () =>
         filterVisits(visits, {
            search,
            status: statusFilter,
            department: departmentFilter,
            meetingType: meetingTypeFilter,
         }),
      [visits, search, statusFilter, departmentFilter, meetingTypeFilter],
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
      ? getCheckInEligibleVisitors(qrCheckInVisit)
      : [];

   const lookupVisitByBadge = React.useCallback(
      (badge: string) => {
         const normalized = badge.trim().toLowerCase();
         if (!normalized) {
            return visits.find((visit) => canCheckOut(visit)) ?? null;
         }

         const digits = normalized.replace(/\D/g, '');
         return (
            visits.find((visit) => {
               if (!canCheckOut(visit)) return false;
               const visitDigits = visit.id.replace(/\D/g, '').slice(-4);
               const displayBadge = `b-${visitDigits}`;
               return (
                  visit.id.toLowerCase() === normalized ||
                  displayBadge === normalized ||
                  (digits.length > 0 && visitDigits.endsWith(digits))
               );
            }) ??
            visits.find((visit) => canCheckOut(visit)) ??
            null
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
      const target = visits.find((visit) => canCheckOut(visit)) ?? null;
      setBadgeCheckoutVisitId(target?.id ?? null);
      setBadgeCheckoutOpen(true);
   }, [visits]);

   const handleScanVisitorQr = React.useCallback(() => {
      const target = visits.find((visit) => canCheckIn(visit)) ?? null;
      setQrCheckInVisitId(target?.id ?? null);
      setQrCheckInOpen(true);
   }, [visits]);

   const handleBadgeCheckoutConfirm = React.useCallback(() => {
      if (!badgeCheckoutVisit) return;
      const eligible = getCheckOutEligibleVisitors(badgeCheckoutVisit);
      const updated = checkOutAllEligible(badgeCheckoutVisit);
      upsertVisit(updated);
      setBadgeSuccessLabel(
         eligible.length === 1
            ? eligible[0]!.name
            : `${eligible.length || badgeCheckoutVisit.visitorCount} visitors`,
      );
      setBadgeSuccessVisitId(badgeCheckoutVisit.id);
      setBadgeSuccessOpen(true);
      setBadgeCheckoutVisitId(null);
   }, [badgeCheckoutVisit, upsertVisit]);

   const handleQrCheckInConfirm = React.useCallback(
      (visitorIds: string[]) => {
         if (!qrCheckInVisit) return;
         const eligible = getCheckInEligibleVisitors(qrCheckInVisit);
         const ids =
            visitorIds.length > 0
               ? visitorIds
               : eligible.map((visitor) => visitor.id);
         if (ids.length === 0) return;

         const updated = applyVisitorAttendance(
            qrCheckInVisit,
            ids,
            'checked_in',
         );
         upsertVisit(updated);
         const names = qrCheckInVisit.visitors
            .filter((visitor) => ids.includes(visitor.id))
            .map((visitor) => visitor.name);
         setQrCheckInSuccessLabel(
            names.length === 1 ? names[0]! : `${names.length} visitors`,
         );
         setQrCheckInSuccessVisitId(qrCheckInVisit.id);
         setQrCheckInSuccessOpen(true);
         setQrCheckInVisitId(null);
      },
      [qrCheckInVisit, upsertVisit],
   );

   const handleView = React.useCallback((visit: ManagedVisit) => {
      setSelectedVisitId(visit.id);
      setSheetMode('view');
      setSheetOpen(true);
   }, []);

   const handleOpenAttendance = React.useCallback(
      (visit: ManagedVisit, mode: 'check_out') => {
         setSelectedVisitId(visit.id);
         setSheetMode(mode);
         setSheetOpen(true);
      },
      [],
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
            onCheckOut: handleCheckOut,
            onCancel: handleCancel,
            onOpenAttendance: handleOpenAttendance,
         }),
      [handleView, handleCheckOut, handleCancel, handleOpenAttendance],
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
                  onScanBadge={handleScanBadge}
                  onScanVisitorQr={handleScanVisitorQr}
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

         <CheckInDialog
            open={qrCheckInOpen}
            onOpenChange={(open) => {
               setQrCheckInOpen(open);
               if (!open) setQrCheckInVisitId(null);
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
         />

         <CheckOutConfirmDialog
            open={badgeCheckoutOpen}
            onOpenChange={(open) => {
               setBadgeCheckoutOpen(open);
               if (!open) setBadgeCheckoutVisitId(null);
            }}
            visit={badgeCheckoutVisit}
            scanMode
            onLookupBadge={(badge) => {
               const found = lookupVisitByBadge(badge);
               if (found) setBadgeCheckoutVisitId(found.id);
               return found;
            }}
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
