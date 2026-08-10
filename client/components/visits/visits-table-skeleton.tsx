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
   'Visit ID',
   'Visitor',
   'Guests',
   'Host',
   'Department',
   'Meeting type',
   'Date & time',
   'Status',
   null,
] as const;

interface VisitsTableSkeletonProps {
   rows?: number;
   showFilters?: boolean;
}

export function VisitsTableSkeleton({
   rows = 10,
   showFilters = true,
}: VisitsTableSkeletonProps) {
   return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
         {showFilters && (
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
               <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Skeleton className="h-9 w-full rounded-md sm:max-w-xs" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-[180px]" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-[160px]" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-[170px]" />
               </div>
               <Skeleton className="h-9 w-[4.75rem] self-start rounded-md lg:self-auto" />
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
                  {Array.from({ length: rows }).map((_, rowIdx) => {
                     const showGroupHint = rowIdx % 3 === 1;

                     return (
                        <TableRow
                           key={rowIdx}
                           className="group/row border-border/70"
                        >
                           {/* Visit ID */}
                           <TableCell className="px-4 py-3.5">
                              <Skeleton className="h-3.5 w-[7.5rem] rounded" />
                           </TableCell>

                           {/* Visitor */}
                           <TableCell className="px-4 py-3.5">
                              <div className="min-w-0 space-y-1.5">
                                 <Skeleton className="h-4 w-28 rounded" />
                                 {showGroupHint && (
                                    <Skeleton className="h-3 w-24 rounded" />
                                 )}
                              </div>
                           </TableCell>

                           {/* Guests */}
                           <TableCell className="px-4 py-3.5">
                              <div className="inline-flex items-center gap-1.5">
                                 <Skeleton className="size-3.5 rounded" />
                                 <Skeleton className="h-4 w-4 rounded" />
                              </div>
                           </TableCell>

                           {/* Host */}
                           <TableCell className="px-4 py-3.5">
                              <Skeleton className="h-4 w-24 rounded" />
                           </TableCell>

                           {/* Department */}
                           <TableCell className="px-4 py-3.5">
                              <Skeleton className="h-4 w-28 rounded" />
                           </TableCell>

                           {/* Meeting type */}
                           <TableCell className="px-4 py-3.5">
                              <Skeleton className="h-6 w-24 rounded-md" />
                           </TableCell>

                           {/* Date & time */}
                           <TableCell className="px-4 py-3.5">
                              <div className="space-y-1.5">
                                 <Skeleton className="h-4 w-32 rounded" />
                                 <Skeleton className="h-3 w-24 rounded" />
                              </div>
                           </TableCell>

                           {/* Status */}
                           <TableCell className="px-4 py-3.5">
                              <Skeleton className="h-6 w-28 rounded-md" />
                           </TableCell>

                           {/* Actions */}
                           <TableCell className="w-12 px-4 py-3.5">
                              <div className="flex justify-end">
                                 <Skeleton className="size-8 rounded-md" />
                              </div>
                           </TableCell>
                        </TableRow>
                     );
                  })}
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
