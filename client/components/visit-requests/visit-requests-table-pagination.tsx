'use client';

import { Button } from '@/components/ui/button';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 10;

interface VisitRequestsTablePaginationProps {
   total: number;
   pageCount: number;
   isFetching: boolean;
}

export function VisitRequestsTablePagination({
   total,
   pageCount,
   isFetching,
}: VisitRequestsTablePaginationProps) {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const page = Number(searchParams.get('page')) || 1;
   const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

   const goToPage = (nextPage: number, nextPageSize?: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(nextPage));
      if (nextPageSize) params.set('pageSize', String(nextPageSize));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
   };

   const canPrev = page > 1;
   const canNext = page < pageCount;
   const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
   const to = Math.min(page * pageSize, total);
   const visiblePages = Array.from(
      { length: Math.min(5, pageCount) },
      (_, i) => i + 1,
   );

   return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
               {total === 0
                  ? 'No results'
                  : `Showing ${from} to ${to} of ${total}`}
            </span>

            <Select
               value={pageSize.toString()}
               onValueChange={(value) => goToPage(1, Number(value))}
            >
               <SelectTrigger className="h-8 w-17.5">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
               </SelectContent>
            </Select>

            <span>per page</span>
         </div>

         <div className="flex items-center gap-1">
            <Button
               variant="outline"
               size="icon"
               className="size-8"
               onClick={() => goToPage(page - 1)}
               disabled={!canPrev || isFetching}
            >
               <ChevronLeft className="size-4" />
            </Button>

            {visiblePages.map((p) => (
               <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(p)}
                  disabled={isFetching}
               >
                  {p}
               </Button>
            ))}

            {pageCount > 5 && (
               <>
                  <span className="px-1 text-muted-foreground">…</span>
                  <Button
                     variant={page === pageCount ? 'default' : 'outline'}
                     size="icon"
                     className="size-8"
                     onClick={() => goToPage(pageCount)}
                     disabled={isFetching}
                  >
                     {pageCount}
                  </Button>
               </>
            )}

            <Button
               variant="outline"
               size="icon"
               className="size-8"
               onClick={() => goToPage(page + 1)}
               disabled={!canNext || isFetching}
            >
               <ChevronRight className="size-4" />
            </Button>
         </div>
      </div>
   );
}
