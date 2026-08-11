'use client';

import {
   Pagination,
   PaginationContent,
   PaginationEllipsis,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from '@/components/ui/pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

const DEFAULT_PAGE_SIZE = 10;

interface VisitsTablePaginationProps {
   total: number;
   pageCount: number;
   isFetching?: boolean;
}

export function VisitsTablePagination({
   total,
   pageCount,
   isFetching = false,
}: VisitsTablePaginationProps) {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const page = Number(searchParams.get('page')) || 1;
   const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

   const goToPage = (nextPage: number, nextPageSize?: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(Math.max(1, Math.min(pageCount || 1, nextPage))));
      if (nextPageSize) params.set('pageSize', String(nextPageSize));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
   };

   const canPrev = page > 1;
   const canNext = page < pageCount;
   const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
   const to = Math.min(page * pageSize, total);

   const renderPageButtons = () => {
      if (pageCount <= 0) return null;

      const buttons: React.ReactNode[] = [];
      const maxVisible = 5;

      let start = Math.max(1, page - Math.floor(maxVisible / 2));
      let end = Math.min(pageCount, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
         start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
         buttons.push(
            <PaginationItem key={1}>
               <PaginationLink
                  onClick={() => goToPage(1)}
                  disabled={isFetching}
                  className="h-10 w-10 cursor-pointer rounded-xl"
               >
                  1
               </PaginationLink>
            </PaginationItem>,
         );
         if (start > 2) {
            buttons.push(
               <PaginationItem key="ellipsis-start">
                  <PaginationEllipsis />
               </PaginationItem>,
            );
         }
      }

      for (let i = start; i <= end; i++) {
         const isActive = page === i;
         buttons.push(
            <PaginationItem key={i} className="relative">
               <PaginationLink
                  isActive={isActive}
                  onClick={() => goToPage(i)}
                  disabled={isFetching}
                  className={cn(
                     'h-10 w-10 cursor-pointer rounded-xl border-0 text-sm font-bold transition-all',
                     isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
               >
                  {i}
               </PaginationLink>
               {isActive && (
                  <motion.div
                     layoutId="visits-pagination-ribbon"
                     className="absolute inset-x-1.5 bottom-0.5 h-0.5 rounded-full bg-primary"
                     transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
               )}
            </PaginationItem>,
         );
      }

      if (end < pageCount) {
         if (end < pageCount - 1) {
            buttons.push(
               <PaginationItem key="ellipsis-end">
                  <PaginationEllipsis />
               </PaginationItem>,
            );
         }
         buttons.push(
            <PaginationItem key={pageCount}>
               <PaginationLink
                  onClick={() => goToPage(pageCount)}
                  disabled={isFetching}
                  className="h-10 w-10 cursor-pointer rounded-xl"
               >
                  {pageCount}
               </PaginationLink>
            </PaginationItem>,
         );
      }

      return buttons;
   };

   return (
      <div className="flex flex-col items-center justify-between gap-4 border-t px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
         <div className="flex w-full flex-col gap-2 sm:w-auto">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
               <span>Results</span>
               <div className="h-1 w-1 rounded-full bg-border" />
               <span className="tabular-nums text-foreground/80">
                  {total === 0 ? '0' : `${from}–${to}`}
               </span>
               <span>of</span>
               <span className="tabular-nums text-foreground/80">{total}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border bg-background/80 p-1.5">
               <span className="px-2 text-xs text-muted-foreground">Show</span>
               <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => goToPage(1, Number(value))}
               >
                  <SelectTrigger className="h-8 w-[4.25rem] rounded-xl border-0 bg-transparent shadow-none">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="5">5</SelectItem>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                     <SelectItem value="50">50</SelectItem>
                  </SelectContent>
               </Select>
               <span className="pr-2 text-xs text-muted-foreground">
                  per page
               </span>
            </div>
         </div>

         <div className="flex flex-col items-center gap-3">
            <Pagination className="mx-0 w-auto">
               <PaginationContent className="gap-1 rounded-2xl border bg-background/80 p-2">
                  <PaginationItem>
                     <PaginationPrevious
                        text=""
                        onClick={() => goToPage(page - 1)}
                        disabled={!canPrev || isFetching}
                        className="group flex h-10 w-10 cursor-pointer justify-center rounded-xl p-0 hover:bg-muted"
                     />
                  </PaginationItem>

                  <div className="mx-2 flex items-center gap-1.5">
                     {renderPageButtons()}
                  </div>

                  <PaginationItem>
                     <PaginationNext
                        text=""
                        onClick={() => goToPage(page + 1)}
                        disabled={!canNext || isFetching}
                        className="group flex h-10 w-10 cursor-pointer justify-center rounded-xl p-0 hover:bg-muted"
                     />
                  </PaginationItem>
               </PaginationContent>
            </Pagination>

            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
               <span
                  className={
                     page === 1 ? 'text-primary transition-colors' : undefined
                  }
               >
                  First
               </span>
               <div className="h-1 w-1 rounded-full bg-border" />
               <span
                  className={
                     page === pageCount || pageCount === 0
                        ? 'text-primary transition-colors'
                        : undefined
                  }
               >
                  Last
               </span>
            </div>
         </div>
      </div>
   );
}
