'use client';

import { Badge } from '@/components/ui/badge';
import SpinnerBars from '@/components/shared/spinner-bars';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import { useUsers } from '@/hooks/use-users';
import { getLastLoginLabel } from '@/lib/format-last-login';
import { getUserFullName } from '@/lib/user';
import { cn } from '@/lib/utils';
import type { User, UserStatusFilter } from '@/types/user.types';
import {
   ColumnDef,
   flexRender,
   getCoreRowModel,
   useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import * as React from 'react';
import UserDetailsSheet from './user-details';
import { UserRowActions } from './user-row-actions';
import { UsersTableFilters } from './users-table-filters';
import { UsersTablePagination } from './users-table-pagination';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import { USER_ROLE_KEYS, useTranslation, type TranslationKey } from '@/lib/i18n';

const DEFAULT_PAGE_SIZE = 10;

type Translate = (
   key: TranslationKey,
   vars?: Record<string, string | number>,
) => string;

const getColumns = (
   onViewDetails: (user: User) => void,
   t: Translate,
): ColumnDef<User>[] => [
   {
      id: 'name',
      header: t('users.col.name'),
      cell: ({ row }) => (
         <button
            type="button"
            onClick={() => onViewDetails(row.original)}
            className="truncate text-left text-sm font-medium text-foreground hover:underline"
         >
            {getUserFullName(row.original)}
         </button>
      ),
   },
   {
      accessorKey: 'username',
      header: t('users.col.username'),
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground font-mono tracking-wide">
            {row.original.employee
               ? t('users.username.sso')
               : row.original.username}
         </span>
      ),
   },
   {
      accessorKey: 'role',
      header: t('users.col.role'),
      cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
   },
   {
      id: 'type',
      header: t('users.col.accountType'),
      cell: ({ row }) => {
         const isSso = !!row.original.employee;
         const TypeIcon = isSso ? ShieldCheck : KeyRound;

         return (
            <Badge
               variant="outline"
               className={cn(
                  'h-6 gap-1.5 rounded-md px-2 font-medium',
                  isSso
                     ? 'bg-primary/5 text-primary border-primary/20'
                     : 'bg-muted/30 text-muted-foreground border-border',
               )}
            >
               <TypeIcon className="size-3" />
               {t(
                  isSso
                     ? 'users.accountType.sso'
                     : 'users.accountType.local',
               )}
            </Badge>
         );
      },
   },
   {
      id: 'status',

      header: t('common.status'),
      cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
   },
   {
      id: 'lastActivity',
      header: t('users.col.lastActivity'),
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {(() => {
               const label = getLastLoginLabel(row.original.lastLoginAt);
               return t(label.key, label.vars);
            })()}
         </span>
      ),
   },
   {
      id: 'createdAt',
      header: t('users.col.created'),
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
         </span>
      ),
   },
   {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => (
         <UserRowActions user={row.original} onViewDetails={onViewDetails} />
      ),
   },
];

interface UsersTableProps {
   showFilters?: boolean;
}

export function UsersTable({ showFilters = true }: UsersTableProps) {
   const { t } = useTranslation();
   const searchParams = useSearchParams();

   const [sheetOpen, setSheetOpen] = React.useState(false);
   const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
      null,
   );

   const page = Number(searchParams.get('page')) || 1;
   const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
   const search = searchParams.get('search') ?? undefined;
   const statusFilter =
      (searchParams.get('status') as UserStatusFilter | 'all') || 'all';
   const roleFilter =
      (searchParams.get('role') as User['role'] | 'all') || 'all';

   const { data, isLoading, isError, isFetching } = useUsers({
      page,
      pageSize,
      search,
      status: statusFilter,
      role: roleFilter,
   });

   const users = data?.data ?? [];
   const pageCount = data?.pageCount ?? 0;
   const total = data?.total ?? 0;

   const handleViewDetails = React.useCallback((user: User) => {
      setSelectedUserId(user.id);
      setSheetOpen(true);
   }, []);

   const columns = React.useMemo(
      () => getColumns(handleViewDetails, t),
      [handleViewDetails, t],
   );

   const table = useReactTable({
      data: users,
      columns,
      getCoreRowModel: getCoreRowModel(),
      manualPagination: true,
      pageCount,
   });

   return (
      <>
         <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {showFilters && <UsersTableFilters />}

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
                     {isLoading ? (
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
                              className="h-40 px-4 text-center text-sm text-destructive"
                           >
                              {t('users.loadError')}
                           </TableCell>
                        </TableRow>
                     ) : users.length ? (
                        table.getRowModel().rows.map((row) => (
                           <TableRow
                              key={row.id}
                              className={cn(
                                 'group/row border-border/70',
                                 isFetching && 'opacity-60 transition-opacity',
                              )}
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
                                    {t('users.emptyTitle')}
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

            <UsersTablePagination
               total={total}
               pageCount={pageCount}
               isFetching={isFetching}
            />
         </div>

         <UserDetailsSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            userId={selectedUserId}
         />
      </>
   );
}
