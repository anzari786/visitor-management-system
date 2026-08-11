import { Skeleton } from '@/components/ui/skeleton';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';

const COLUMN_HEADERS = [
   'Name',
   'Username',
   'Role',
   'Status',
   'Last activity',
   'Created',
   null,
] as const;

interface UsersTableSkeletonProps {
   rows?: number;
   showFilters?: boolean;
}

export function UsersTableSkeleton({
   rows = 10,
   showFilters = true,
}: UsersTableSkeletonProps) {
   return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
         {showFilters && (
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
               <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Skeleton className="h-9 w-full rounded-md sm:max-w-xs" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-[160px]" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-[150px]" />
               </div>
            </div>
         )}

         <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                  <TableRow className="hover:bg-transparent">
                     {COLUMN_HEADERS.map((label, i) => (
                        <TableHead
                           key={label ?? `actions-${i}`}
                           className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                        >
                           {label}
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {Array.from({ length: rows }).map((_, rowIdx) => (
                     <TableRow
                        key={rowIdx}
                        className="group/row border-border/70"
                     >
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-4 w-28 rounded" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-4 w-24 rounded" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-6 w-24 rounded-md" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-6 w-20 rounded-md" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-4 w-28 rounded" />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                           <Skeleton className="h-4 w-24 rounded" />
                        </TableCell>
                        <TableCell className="w-12 px-4 py-3.5">
                           <div className="flex justify-end">
                              <Skeleton className="size-8 rounded-md" />
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>

         <div className="flex flex-col items-center justify-between gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
            <div className="flex w-full flex-col gap-2 sm:w-auto">
               <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-12 rounded" />
                  <Skeleton className="size-1 rounded-full" />
                  <Skeleton className="h-2.5 w-10 rounded" />
                  <Skeleton className="h-2.5 w-4 rounded" />
                  <Skeleton className="h-2.5 w-6 rounded" />
               </div>
               <Skeleton className="h-11 w-44 rounded-2xl" />
            </div>

            <div className="flex flex-col items-center gap-3">
               <div className="flex items-center gap-1 rounded-2xl border bg-background/80 p-2">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="mx-2 flex items-center gap-1.5">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="size-10 rounded-xl" />
                     ))}
                  </div>
                  <Skeleton className="size-10 rounded-xl" />
               </div>
               <div className="flex items-center gap-2">
                  <Skeleton className="h-2.5 w-8 rounded" />
                  <Skeleton className="size-1 rounded-full" />
                  <Skeleton className="h-2.5 w-8 rounded" />
               </div>
            </div>
         </div>
      </div>
   );
}
