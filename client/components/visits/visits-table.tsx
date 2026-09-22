'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SpinnerBars from '@/components/shared/spinner-bars';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import {
   VISIT_SOURCE_OPTIONS,
   type VisitSourceValue,
} from '@/constants/visit-sources';
import {
   PARTIAL_CHECK_IN,
   PARTIAL_CHECK_OUT,
   VISIT_STATUS_FILTER_OPTIONS,
} from '@/constants/visit-status';
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
import type { ManagedVisit } from '@/types/visit.types';
import {
   ColumnDef,
   flexRender,
   getCoreRowModel,
   useReactTable,
} from '@tanstack/react-table';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarRange, CalendarSearch, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { FindVisitCheckInDialog } from './find-visit-check-in-dialog';
import { CheckInDialog } from './check-in-dialog';
import type { CheckInConfirmPayload } from './check-in-dialog';
import { CheckInSuccessDialog } from './check-in-success-dialog';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';
import { VisitorInformationDialog } from './visitor-information-dialog';
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
import {
   useCheckInAttendance,
   useCheckOutAttendance,
   useRegisterVisitor,
   useVisits,
   visitQueryKeys,
} from '@/hooks/use-visits';
import { mapBackendVisit } from '@/lib/visit-mapper';
import { useQueryClient } from '@tanstack/react-query';
import {
   MEETING_TYPE_KEYS,
   useTranslation,
   type TranslationKey,
} from '@/lib/i18n';

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
   const end = visit.endDate ? parseISO(visit.endDate) : null;
   const isMultiDay = visit.isMultiDay && end && !isSameDay(start, end);
   const dateLabel =
      isMultiDay
         ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
         : format(start, 'MMM d, yyyy');
   const timeLabel = `${formatTimeLabel(visit.startTime)} – ${formatTimeLabel(visit.endTime)}`;
   return { dateLabel, timeLabel };
}

type RowHandlers = {
   onView: (visit: ManagedVisit) => void;
   onCheckIn: (visit: ManagedVisit) => void;
   onCheckOut: (visit: ManagedVisit) => void;
   onCancel: (visit: ManagedVisit) => void;
   onRegister: (visit: ManagedVisit) => void;
   onOpenAttendance: (
      visit: ManagedVisit,
      mode: 'check_in' | 'check_out',
   ) => void;
};

type Translate = (
   key: TranslationKey,
   vars?: Record<string, string | number>,
) => string;

const getColumns = (
   handlers: RowHandlers,
   t: Translate,
): ColumnDef<ManagedVisit>[] => [
   {
      accessorKey: 'id',
      header: t('visits.col.visitCode'),
      cell: ({ row }) => (
         <span className="font-mono text-xs font-medium tracking-wide text-foreground">
            {row.original.id}
         </span>
      ),
   },
   {
      id: 'visitor',
      header: t('visits.col.visitor'),
      cell: ({ row }) => {
         const { visitorName, visitorCount, organization } = row.original;
         const isGroup = visitorCount > 1;

         const displayName =
            visitorName?.trim() || organization?.trim() || null;

         return (
            <div className="min-w-0">
               {displayName ? (
                  <p className="truncate text-sm font-medium text-foreground">
                     {displayName}
                  </p>
               ) : (
                  <Badge variant="secondary" className="text-xs font-medium">
                     {t('visits.unknownVisitor')}
                  </Badge>
               )}

               {isGroup && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                     <Users className="size-3 shrink-0" />
                     <span>
                        {t(
                           visitorCount - 1 === 1
                              ? 'visits.moreVisitor'
                              : 'visits.moreVisitors',
                           { count: visitorCount - 1 },
                        )}
                     </span>
                  </p>
               )}
            </div>
         );
      },
   },
   {
      accessorKey: 'visitorCount',
      header: t('visits.col.guests'),
      cell: ({ row }) => {
         const count = row.original.visitorCount;
         return (
            <div
               className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
               title={t(
                  count === 1 ? 'visits.visitorCount' : 'visits.visitorsCount',
                  { count },
               )}
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
      header: t('visits.col.host'),
      cell: ({ row }) => (
         <span className="text-sm text-foreground">{row.original.host}</span>
      ),
   },
   {
      accessorKey: 'department',
      header: t('visits.col.department'),
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {row.original.department}
         </span>
      ),
   },
   {
      accessorKey: 'source',
      header: t('visits.col.visitSource'),
      cell: ({ row }) => {
         const Icon = getVisitTypeIcon(row.original.visitType);
         const source = VISIT_SOURCE_OPTIONS.find(
            (option) => option.value === row.original.source,
         );
         return (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
               <Icon className="size-4 text-muted-foreground" />
               {source ? t(source.labelKey) : row.original.source}
            </span>
         );
      },
   },
   {
      accessorKey: 'meetingType',
      header: t('visits.col.meetingType'),
      cell: ({ row }) => (
         <Badge variant="secondary" className="h-6 rounded-md px-2 font-medium">
            {t(MEETING_TYPE_KEYS[row.original.meetingType])}
         </Badge>
      ),
   },
   {
      id: 'schedule',
      header: t('visits.col.schedule'),
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
      header: t('common.status'),
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
            onRegister={handlers.onRegister}
            onOpenAttendance={handlers.onOpenAttendance}
         />
      ),
   },
];

interface VisitsTableProps {
   showFilters?: boolean;
   variant?: 'full' | 'dashboard';
}

export function VisitsTable({
   showFilters = true,
   variant = 'full',
}: VisitsTableProps) {
   const { t } = useTranslation();
   const queryClient = useQueryClient();
   const searchParams = useSearchParams();
   const isDashboard = variant === 'dashboard';
   const page = isDashboard ? 1 : Number(searchParams.get('page')) || 1;
   const pageSize = isDashboard
      ? 8
      : Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
   const search = isDashboard
      ? undefined
      : searchParams.get('search') || undefined;
   const statusFilter = isDashboard
      ? 'all'
      : searchParams.get('status') || 'all';
   const visitSourceFilter = isDashboard
      ? 'all'
      : (searchParams.get('source') as VisitSourceValue | 'all') || 'all';
   const selectedStatus = VISIT_STATUS_FILTER_OPTIONS.find(
      (option) => option.value === statusFilter,
   );
   const status = selectedStatus
      ? selectedStatus.value === 'checked_in'
         ? [PARTIAL_CHECK_IN, 'CHECKED_IN']
         : selectedStatus.value === 'checked_out'
           ? [PARTIAL_CHECK_OUT, 'CHECKED_OUT']
           : selectedStatus.schemaStatus
      : undefined;
   const source = visitSourceFilter === 'all' ? undefined : visitSourceFilter;
   const {
      data: visitsData,
      isPending,
      isError,
      isFetching,
      refetch,
   } = useVisits({
      page,
      pageSize,
      search,
      status,
      source,
   });
   const { mutateAsync: registerVisitor } = useRegisterVisitor();
   const { mutateAsync: checkInAttendance } = useCheckInAttendance();
   const { mutateAsync: checkOutAttendance } = useCheckOutAttendance();
   const [visits, setVisits] = React.useState<ManagedVisit[]>(() =>
      [],
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
   const [checkInOpen, setCheckInOpen] = React.useState(false);
   const [checkInVisitId, setCheckInVisitId] = React.useState<
      string | null
   >(null);
   const [checkInVisitorIds, setCheckInVisitorIds] = React.useState<
      string[] | null
   >(null);
   const [checkInSuccessOpen, setCheckInSuccessOpen] =
      React.useState(false);
   const [checkInSuccessLabel, setCheckInSuccessLabel] = React.useState('');
   const [checkInSuccessVisitId, setCheckInSuccessVisitId] =
      React.useState('');
   const [checkInPrintTargets, setCheckInPrintTargets] = React.useState<
      CheckInPrintTarget[]
   >([]);
   const [checkoutQrScannerOpen, setCheckoutQrScannerOpen] =
      React.useState(false);
   const [findVisitOpen, setFindVisitOpen] = React.useState(false);
   const [checkoutVisitorIds, setCheckoutVisitorIds] = React.useState<
      string[] | null
   >(null);
   const [visitorInfoOpen, setVisitorInfoOpen] = React.useState(false);
   const [pendingInfoVisitId, setPendingInfoVisitId] = React.useState<
      string | null
   >(null);

   const backendVisits = React.useMemo(
      () => {
         const mappedVisits =
            visitsData?.visits.map((visit) => {
               const mapped = mapBackendVisit(visit);
               const synced = syncVisitAttendanceForDay(
                  mapped,
                  getRelevantVisitDay(mapped),
               );
               return { ...synced, status: mapped.status };
            }) ?? [];

         if (!isDashboard) return mappedVisits;

         return [...mappedVisits].sort((a, b) =>
            `${b.startDate}T${b.startTime}`.localeCompare(
               `${a.startDate}T${a.startTime}`,
            ),
         );
      },
      [isDashboard, visitsData],
   );

   React.useEffect(() => {
      if (visitsData) {
         setVisits(backendVisits);
      }
   }, [backendVisits, visitsData]);

   const total = visitsData?.pagination.total ?? 0;
   const pageCount = Math.max(1, visitsData?.pagination.totalPages ?? 1);
   const pageVisits = visits;

   const selectedVisit =
      visits.find((visit) => visit.id === selectedVisitId) ?? null;

   const badgeCheckoutVisit =
      visits.find((visit) => visit.id === badgeCheckoutVisitId) ??
      visits.find((visit) => canCheckOut(visit)) ??
      null;

   const pendingInfoVisit =
      visits.find((visit) => visit.id === pendingInfoVisitId) ?? null;

   const checkInVisit =
      visits.find((visit) => visit.id === checkInVisitId) ??
      visits.find((visit) => canCheckIn(visit)) ??
      null;

   const checkInVisitors = checkInVisit
      ? checkInVisitorIds?.length
         ? checkInVisit.visitors.filter((visitor) =>
              checkInVisitorIds.includes(visitor.id),
           )
         : getCheckInEligibleVisitors(checkInVisit)
      : [];

   const badgeCheckoutVisitors = badgeCheckoutVisit
      ? checkoutVisitorIds?.length
         ? badgeCheckoutVisit.visitors.filter((visitor) =>
              checkoutVisitorIds.includes(visitor.id),
           )
         : getCheckOutEligibleVisitors(badgeCheckoutVisit)
      : [];

   const upsertVisit = React.useCallback((updated: ManagedVisit) => {
      setVisits((prev) =>
         prev.map((visit) => (visit.id === updated.id ? updated : visit)),
      );
   }, []);

   const handleScanBadge = React.useCallback(() => {
      setCheckoutQrScannerOpen(true);
   }, []);

   const openManualCheckIn = React.useCallback((visit: ManagedVisit) => {
      if (!canCheckIn(visit)) {
         toast.error(t('visits.toast.notReadyCheckIn'));
         return;
      }

      if (visit.visitType === 'invitation') {
         setPendingInfoVisitId(visit.id);
         setVisitorInfoOpen(true);
         return;
      }

      const eligible = getCheckInEligibleVisitors(visit);
      setCheckInVisitId(visit.id);
      setCheckInVisitorIds(eligible.map((visitor) => visitor.id));
      setCheckInOpen(true);
   }, [t]);

   const handleRegister = React.useCallback((visit: ManagedVisit) => {
      setPendingInfoVisitId(visit.id);
      setVisitorInfoOpen(true);
   }, []);

   const handleVisitorInfoComplete = React.useCallback(
      (visitorData: any[]) => {
         if (!pendingInfoVisit) return;

         // Map updated visitor data back to the visit
         const updatedVisitors = pendingInfoVisit.visitors.map((v, i) => {
            const data = visitorData[i];
            if (!data) return v;
            return {
               ...v,
               name: `${data.firstName} ${data.lastName}`,
               email: data.email,
               phone: data.phone,
               nationality: data.nationality,
               organization: data.organization,
            };
         });

         const updatedVisit = {
            ...pendingInfoVisit,
            visitors: updatedVisitors,
         };
         upsertVisit(updatedVisit);

         // Close info dialog and proceed to check-in
         setVisitorInfoOpen(false);
         setPendingInfoVisitId(null);

         const eligible = getCheckInEligibleVisitors(updatedVisit);
         setCheckInVisitId(updatedVisit.id);
         setCheckInVisitorIds(eligible.map((visitor) => visitor.id));
         setCheckInOpen(true);
      },
      [pendingInfoVisit, upsertVisit],
   );

   const handleVisitorRegistrationComplete = React.useCallback(
      async (visitorData: any[]) => {
         if (!pendingInfoVisit) return;

         const updatedVisitors = pendingInfoVisit.visitors.map((v, i) => {
            const data = visitorData[i];
            if (!data) return v;
            return {
               ...v,
               name: `${data.firstName} ${data.lastName}`,
               email: data.email,
               phone: data.phone,
               organization: data.organization,
            };
         });

         const visitId =
            pendingInfoVisit.backendId ?? Number(pendingInfoVisit.id);
         if (!Number.isInteger(visitId) || visitId <= 0) {
            throw new Error('The selected visit has no valid backend id.');
         }

         for (const visitor of visitorData) {
            await registerVisitor({
               visitId,
               visitParticipantId: visitor.visitParticipantId,
               firstName: visitor.firstName,
               lastName: visitor.lastName,
               phone: visitor.phone,
               email: visitor.email || undefined,
               nationality: visitor.nationality || undefined,
               organization: visitor.organization?.trim() || undefined,
            });
         }

         upsertVisit({ ...pendingInfoVisit, visitors: updatedVisitors });
         setVisitorInfoOpen(false);
         setPendingInfoVisitId(null);
         toast.success(t('visits.toast.registrationSuccess'));
      },
      [pendingInfoVisit, registerVisitor, upsertVisit, t],
   );

   const handleCheckoutQrScanned = React.useCallback(
      async (code: string) => {
         const result =
            await visitAttendanceLookupService.lookupBadgeForCheckOut(
               code,
               visits,
            );

         if (!result.eligibleForCheckOut || result.visitors.length === 0) {
            throw new Error(
               result.reason ?? t('visits.toast.noBadgeMatch'),
            );
         }

         setBadgeCheckoutVisitId(result.visit.id);
         setCheckoutVisitorIds(result.visitors.map((visitor) => visitor.id));
         setBadgeCheckoutOpen(true);
         toast.success(t('visits.toast.badgeMatched'), {
            description: `${result.visitors.map((v) => v.name).join(', ')} · ${result.badgeToken}`,
         });
      },
      [visits, t],
   );

   const handleBadgeCheckoutConfirm = React.useCallback(async () => {
      if (!badgeCheckoutVisit) return;
      const eligible = checkoutVisitorIds?.length
         ? badgeCheckoutVisit.visitors.filter((visitor) =>
              checkoutVisitorIds.includes(visitor.id),
           )
         : getCheckOutEligibleVisitors(badgeCheckoutVisit);
      const ids = eligible.map((visitor) => visitor.id);
      if (eligible.some((visitor) => !visitor.attendanceId)) {
         toast.error(t('visitActions.toast.tryAgain'));
         return;
      }

      try {
         await Promise.all(
            eligible.map((visitor) =>
               checkOutAttendance(visitor.attendanceId!),
            ),
         );
      } catch (error) {
         const message =
            error instanceof AxiosError
               ? (error.response?.data?.message as string | undefined)
               : error instanceof Error
                 ? error.message
                 : undefined;
         toast.error(message ?? t('visitActions.toast.tryAgain'));
         return;
      }

      const updated = applyVisitorAttendance(
         badgeCheckoutVisit,
         ids,
            'CHECKED_OUT',
      );
      upsertVisit(updated);
      setBadgeSuccessLabel(
         eligible.length === 1
            ? eligible[0]!.name
            : t('visits.visitorsCount', {
                 count: eligible.length || badgeCheckoutVisit.visitorCount,
              }),
      );
      setBadgeSuccessVisitId(badgeCheckoutVisit.id);
      setBadgeSuccessOpen(true);
      setBadgeCheckoutVisitId(null);
      setCheckoutVisitorIds(null);
   }, [
      badgeCheckoutVisit,
      checkoutVisitorIds,
      checkOutAttendance,
      upsertVisit,
      t,
   ]);

   const handleCheckInConfirm = React.useCallback(
      async (payload: CheckInConfirmPayload) => {
         if (!checkInVisit) return;
         const ids = payload.visitorIds;
         if (ids.length === 0) return;

         const selected = checkInVisit.visitors.filter((visitor) =>
            ids.includes(visitor.id),
         );

         const printTargets: CheckInPrintTarget[] = [];

         if (
            selected.some(
               (visitor) =>
                  visitor.visitParticipantId == null ||
                  visitor.visitDayId == null,
            )
         ) {
            toast.error(
               `Unable to check in ${checkInVisit.visitorName}: missing visit participant or visit day ID`,
            );
            return;
         }

         for (const visitor of selected) {
            try {
               const attendance = await checkInAttendance({
                  visitParticipantId: visitor.visitParticipantId!,
                  visitDayId: visitor.visitDayId!,
                  retainPersonalId: true,
               });
               printTargets.push({
                  attendanceId: attendance.id,
                  visitorName: visitor.name,
                  initialStatus: attendance.printJob?.status ?? 'QUEUED',
               });
            } catch (error) {
               const message =
                  error instanceof AxiosError
                     ? (error.response?.data?.message as string | undefined)
                     : error instanceof Error
                        ? error.message
                        : undefined;
               toast.error(
                  message ??
                     t('visits.toast.checkInFailed', {
                        name: visitor.name,
                     }),
               );
               return;
            }
         }

         const withAttendance = applyVisitorAttendance(
            checkInVisit,
            ids,
            'CHECKED_IN',
         );
         upsertVisit(withAttendance);
         void queryClient.invalidateQueries({
            queryKey: visitQueryKeys.lists(),
         });

         const names = selected.map((visitor) => visitor.name);
         setCheckInSuccessLabel(
            names.length === 1
               ? names[0]!
               : t('visits.visitorsCount', { count: names.length }),
         );
         setCheckInSuccessVisitId(checkInVisit.id);
         setCheckInPrintTargets(printTargets);
         setCheckInSuccessOpen(true);
         setCheckInVisitId(null);
         setCheckInVisitorIds(null);
      },
      [checkInVisit, checkInAttendance, queryClient, upsertVisit, t],
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
         getColumns(
            {
               onView: handleView,
               onCheckIn: handleCheckIn,
               onCheckOut: handleCheckOut,
               onCancel: handleCancel,
               onRegister: handleRegister,
               onOpenAttendance: handleOpenAttendance,
            },
            t,
         ),
      [
         handleView,
         handleCheckIn,
         handleCheckOut,
         handleCancel,
         handleRegister,
         handleOpenAttendance,
         t,
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
            {isDashboard ? (
               <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
                  <h2 className="text-base font-semibold text-foreground">
                     {t('dashboard.recentVisits')}
                  </h2>
                  <Link
                     href="/visits"
                     className="text-sm font-medium text-primary hover:underline"
                  >
                     {t('dashboard.viewAll')}
                  </Link>
               </div>
            ) : showFilters ? (
               <VisitsTableFilters
                  onScanBadge={handleScanBadge}
               />
            ) : null}

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
                     {isPending ? (
                        <TableRow className="hover:bg-transparent">
                           <TableCell
                              colSpan={columns.length}
                              className="h-40 px-4"
                           >
                              <div className="flex justify-center text-primary">
                                 <SpinnerBars />
                              </div>
                           </TableCell>
                        </TableRow>
                     ) : isError ? (
                        <TableRow className="hover:bg-transparent">
                           <TableCell
                              colSpan={columns.length}
                              className="h-40 px-4 text-center"
                           >
                              <div className="flex flex-col items-center gap-2">
                                 <p className="text-sm font-medium text-destructive">
                                    {t('visits.loadError')}
                                 </p>
                                 <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => void refetch()}
                                    disabled={isFetching}
                                    className="h-auto p-0 text-sm font-medium"
                                 >
                                    {t('common.retry')}
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     ) : pageVisits.length ? (
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
                                 <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
                                    <CalendarSearch className="size-6 text-muted-foreground" />
                                 </div>
                                 <p className="text-sm font-medium text-foreground">
                                    {t('visits.emptyTitle')}
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                    {t('visits.emptyDescription')}
                                 </p>
                              </div>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </div>

            {!isDashboard && (
               <VisitsTablePagination
                  total={total}
                  pageCount={pageCount}
                  isFetching={isFetching}
               />
            )}
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

         <VisitorInformationDialog
            open={visitorInfoOpen}
            onOpenChange={setVisitorInfoOpen}
            visit={pendingInfoVisit}
            onComplete={handleVisitorInfoComplete}
            onRegisterComplete={handleVisitorRegistrationComplete}
         />

         <QrScannerDialog
            open={checkoutQrScannerOpen}
            onOpenChange={setCheckoutQrScannerOpen}
            title={t('visits.scanBadgeTitle')}
            description={t('visits.scanBadgeDescription')}
            onScan={handleCheckoutQrScanned}
         />

         <CheckInDialog
            open={checkInOpen}
            onOpenChange={(open) => {
               setCheckInOpen(open);
               if (!open) {
                  setCheckInVisitId(null);
                  setCheckInVisitorIds(null);
               }
            }}
            visit={checkInVisit}
            visitors={checkInVisitors}
            onConfirm={handleCheckInConfirm}
         />

         <CheckInSuccessDialog
            open={checkInSuccessOpen}
            onOpenChange={setCheckInSuccessOpen}
            visitorLabel={checkInSuccessLabel}
            visitId={checkInSuccessVisitId}
            printTargets={checkInPrintTargets}
            onRetryPrint={async (attendanceId) => {
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
