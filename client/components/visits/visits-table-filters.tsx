'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import {
   MEETING_TYPE_OPTIONS,
   type MeetingTypeValue,
} from '@/constants/meeting-types';
import {
   MANAGED_VISIT_STATUS_LABELS,
   VISIT_DEPARTMENTS,
} from '@/data/mock-visits';
import { useDebounce } from '@/hooks/use-debounce';
import type { ManagedVisitStatus } from '@/types/visit.types';
import { ScanLine, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { ScanDialog } from './scan-dialog';

type VisitsTableFiltersProps = {
   onScanBadge?: () => void;
   onScanVisitorQr?: () => void;
   onFindVisit?: () => void;
};

export function VisitsTableFilters({
   onScanBadge,
   onScanVisitorQr,
   onFindVisit,
}: VisitsTableFiltersProps) {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const [scanOpen, setScanOpen] = React.useState(false);

   const search = searchParams.get('search') ?? '';
   const statusFilter =
      (searchParams.get('status') as ManagedVisitStatus | 'all') || 'all';
   const departmentFilter = searchParams.get('department') || 'all';
   const meetingTypeFilter =
      (searchParams.get('meetingType') as MeetingTypeValue | 'all') || 'all';

   const [searchInput, setSearchInput] = React.useState(search);
   const debouncedSearch = useDebounce(searchInput, 300);
   const lastPushedSearch = React.useRef(search);

   const updateParams = React.useCallback(
      (updates: Record<string, string | number | null | undefined>) => {
         const params = new URLSearchParams(searchParams.toString());

         Object.entries(updates).forEach(([key, value]) => {
            if (
               value === null ||
               value === undefined ||
               value === '' ||
               value === 'all'
            ) {
               params.delete(key);
            } else {
               params.set(key, String(value));
            }
         });

         router.push(`${pathname}?${params.toString()}`, { scroll: false });
      },
      [pathname, router, searchParams],
   );

   React.useEffect(() => {
      if (search !== lastPushedSearch.current) {
         setSearchInput(search);
         lastPushedSearch.current = search;
      }
   }, [search]);

   React.useEffect(() => {
      if (debouncedSearch === search) return;
      lastPushedSearch.current = debouncedSearch;
      updateParams({ search: debouncedSearch, page: 1 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [debouncedSearch]);

   const hasActiveFilters =
      Boolean(search) ||
      statusFilter !== 'all' ||
      departmentFilter !== 'all' ||
      meetingTypeFilter !== 'all';

   const clearAllFilters = () => {
      setSearchInput('');
      updateParams({
         search: null,
         status: null,
         department: null,
         meetingType: null,
         page: 1,
      });
   };

   return (
      <>
         <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
               <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     placeholder="Search visitor or visit ID…"
                     value={searchInput}
                     onChange={(e) => setSearchInput(e.target.value)}
                     className="h-9 bg-background pl-8"
                  />
               </div>

               <Select
                  value={departmentFilter}
                  onValueChange={(value) =>
                     updateParams({ department: value, page: 1 })
                  }
               >
                  <SelectTrigger className="h-9 w-full bg-background sm:w-[180px]">
                     <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All departments</SelectItem>
                     {VISIT_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                           {dept}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                     updateParams({ status: value, page: 1 })
                  }
               >
                  <SelectTrigger className="h-9 w-full bg-background sm:w-[160px]">
                     <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All statuses</SelectItem>
                     {(
                        Object.keys(
                           MANAGED_VISIT_STATUS_LABELS,
                        ) as ManagedVisitStatus[]
                     ).map((status) => (
                        <SelectItem key={status} value={status}>
                           {MANAGED_VISIT_STATUS_LABELS[status]}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <Select
                  value={meetingTypeFilter}
                  onValueChange={(value) =>
                     updateParams({ meetingType: value, page: 1 })
                  }
               >
                  <SelectTrigger className="h-9 w-full bg-background sm:w-[170px]">
                     <SelectValue placeholder="Meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All meeting types</SelectItem>
                     {MEETING_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                           {type.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               {hasActiveFilters && (
                  <Button
                     variant="ghost"
                     size="sm"
                     className="h-9 gap-1.5 self-start text-muted-foreground"
                     onClick={clearAllFilters}
                  >
                     <X className="size-3.5" />
                     Clear
                  </Button>
               )}
            </div>

            <Button
               size="sm"
               className="h-9 gap-2 self-start lg:self-auto"
               onClick={() => setScanOpen(true)}
            >
               <ScanLine className="size-4" />
               Scan
            </Button>
         </div>

         <ScanDialog
            open={scanOpen}
            onOpenChange={setScanOpen}
            onFindVisit={onFindVisit}
            onScanBadge={onScanBadge}
            onScanVisitorQr={onScanVisitorQr}
         />
      </>
   );
}
