import { Skeleton } from '@/components/ui/skeleton';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';

const COLUMN_WIDTHS = [
   'w-36', // visitor
   'w-28', // organization
   'w-28', // host
   'w-28', // department
   'w-32', // schedule
   'w-24', // purpose
   'w-20', // status
   'w-8', // actions
];

const COLUMN_HEADERS = [
   'Visitor',
   'Organization',
   'Host',
   'Department',
   'Visit Schedule',
   'Purpose',
   'Status',
   null,
];

interface VisitRequestsTableSkeletonProps {
   rows?: number;
   showFilters?: boolean;
}

export function VisitRequestsTableSkeleton({
   rows = 10,
   showFilters = true,
}: VisitRequestsTableSkeletonProps) {
   return (
      <div className="rounded-xl border border-border bg-card">
         {showFilters && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
               <Skeleton className="h-9 w-64 rounded-md" />
               <Skeleton className="h-9 w-28 rounded-md" />
               <Skeleton className="h-9 w-24 rounded-md" />
               <Skeleton className="h-9 w-28 rounded-md" />
            </div>
         )}

         <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                     {COLUMN_HEADERS.map((label, i) => (
                        <TableHead
                           key={i}
                           className="text-muted-foreground font-medium"
                        >
                           {label ? (
                              <div className="flex items-center gap-2">
                                 <Skeleton className="size-4 rounded" />
                                 <Skeleton className="h-3.5 w-14 rounded" />
                              </div>
                           ) : null}
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {Array.from({ length: rows }).map((_, rowIdx) => (
                     <TableRow key={rowIdx}>
                        {COLUMN_WIDTHS.map((width, colIdx) => (
                           <TableCell key={colIdx}>
                              {colIdx === COLUMN_WIDTHS.length - 1 ? (
                                 <Skeleton className="size-8 rounded-md" />
                              ) : colIdx === 6 ? (
                                 <Skeleton
                                    className={`h-5 ${width} rounded-full`}
                                 />
                              ) : (
                                 <Skeleton className={`h-4 ${width} rounded`} />
                              )}
                           </TableCell>
                        ))}
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>

         <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t">
            <div className="flex items-center gap-2">
               <Skeleton className="h-4 w-36 rounded" />
               <Skeleton className="h-8 w-16 rounded-md" />
               <Skeleton className="h-4 w-14 rounded" />
            </div>
            <div className="flex items-center gap-1">
               {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="size-8 rounded-md" />
               ))}
            </div>
         </div>
      </div>
   );
}
