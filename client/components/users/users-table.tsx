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
import { USER_ROLE_CONFIG } from '@/constants/user';
import { useUsers } from '@/hooks/use-users';
import { formatLastLogin } from '@/lib/format-last-login';
import { getUserFullName } from '@/lib/user';
import { cn } from '@/lib/utils';
import type { User, UserRole, UserStatusFilter } from '@/types/user.types';
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
import { roleFilterLabels, UsersTableFilters } from './users-table-filters';
import { UsersTablePagination } from './users-table-pagination';
import { UserStatusBadge } from './user-status-badge';

const DEFAULT_PAGE_SIZE = 10;

const getColumns = (onViewDetails: (user: User) => void): ColumnDef<User>[] => [
   {
      id: 'name',
      header: 'Name',
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
      header: 'Username',
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {row.original.username}
         </span>
      ),
   },
   {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
         const role = row.original.role as UserRole;
         const config = USER_ROLE_CONFIG[role];
         const RoleIcon = config.icon;

         return (
            <Badge
               variant="secondary"
               className={cn(
                  'h-6 gap-1.5 rounded-md px-2 font-medium',
                  config.color,
               )}
            >
               <RoleIcon className="size-3" />
               {roleFilterLabels[role]}
            </Badge>
         );
      },
   },
   {
      id: 'type',
      header: 'Account Type',
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
               {isSso ? 'SSO' : 'Local'}
            </Badge>
         );
      },
   },
   {
      id: 'status',

      header: 'Status',
      cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
   },
   {
      id: 'lastActivity',
      header: 'Last activity',
      cell: ({ row }) => (
         <span className="text-sm text-muted-foreground">
            {formatLastLogin(row.original.lastLoginAt)}
         </span>
      ),
   },
   {
      id: 'createdAt',
      header: 'Created',
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
   const roleFilter = (searchParams.get('role') as UserRole | 'all') || 'all';

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
      () => getColumns(handleViewDetails),
      [handleViewDetails],
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
                        Array.from({ length: pageSize }).map((_, i) => (
                           <TableRow key={i} className="border-border/70">
                              {columns.map((_, j) => (
                                 <TableCell key={j} className="px-4 py-3.5">
                                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                 </TableCell>
                              ))}
                           </TableRow>
                        ))
                     ) : isError ? (
                        <TableRow className="hover:bg-transparent">
                           <TableCell
                              colSpan={columns.length}
                              className="h-40 px-4 text-center text-sm text-destructive"
                           >
                              Failed to load users. Please try again.
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
                                    No users found
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
