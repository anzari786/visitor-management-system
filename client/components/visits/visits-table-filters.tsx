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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
   VISIT_TYPE_OPTIONS,
   type VisitTypeValue,
} from '@/constants/visit-types';
import { useDebounce } from '@/hooks/use-debounce';
import type { ManagedVisitStatus } from '@/types/visit.types';
import { Footprints, MailPlus, ScanLine, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { ScanDialog } from './scan-dialog';

type StatusFilterValue =
   | 'all'
   | 'pending'
   | 'approved'
   | 'rejected'
   | 'rescheduled'
   | 'checked_in'
   | 'checked_out';

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
   { value: 'all', label: 'All' },
   { value: 'pending', label: 'Pending' },
   { value: 'approved', label: 'Approved' },
   { value: 'rejected', label: 'Rejected' },
   { value: 'rescheduled', label: 'Rescheduled' },
   { value: 'checked_in', label: 'Checked In' },
   { value: 'checked_out', label: 'Checked Out' },
];

const VISIT_TYPE_TOGGLE_OPTIONS: {
   value: VisitTypeValue | 'all';
   label: string;
}[] = [{ value: 'all', label: 'All' }, ...VISIT_TYPE_OPTIONS];

const TOGGLE_OPTIONS = STATUS_FILTER_OPTIONS.map((opt) => ({
   key: `status:${opt.value}`,
   label: opt.label,
   value: opt.value,
}));

const VISIT_TYPE_ICONS: Record<
   VisitTypeValue,
   React.ComponentType<{ size?: number; className?: string }>
> = {
   visit: Footprints,
   invitation: MailPlus,
};

export const STATUS_FILTER_GROUPS: Record<
   Exclude<StatusFilterValue, 'all'>,
   ManagedVisitStatus[]
> = {
   pending: ['requested'],
   approved: ['approved'],
   rejected: ['rejected', 'cancelled'],
   rescheduled: ['rescheduled'],
   checked_in: ['checked_in', 'partially_checked_in'],
   checked_out: ['checked_out', 'partially_checked_out'],
};
type VisitsTableFiltersProps = {
   onScanBadge?: () => void;
   onFindVisit?: () => void;
};

export function VisitsTableFilters({
   onScanBadge,
   onFindVisit,
}: VisitsTableFiltersProps) {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const [scanOpen, setScanOpen] = React.useState(false);

   const search = searchParams.get('search') ?? '';
   const statusFilter =
      (searchParams.get('status') as StatusFilterValue) || 'all';
   const visitTypeFilter =
      (searchParams.get('visitType') as VisitTypeValue | 'all') || 'all';

   const activeToggleKey = `status:${statusFilter}`;

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
      Boolean(search) || statusFilter !== 'all' || visitTypeFilter !== 'all';

   const clearAllFilters = () => {
      setSearchInput('');
      updateParams({
         search: null,
         status: null,
         visitType: null,
         page: 1,
      });
   };

   return (
      <>
         <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
               <div className="relative w-full sm:max-w-xs p-1">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     placeholder="Search visitor or visit code…"
                     value={searchInput}
                     onChange={(e) => setSearchInput(e.target.value)}
                     className="h-9 bg-background pl-8"
                  />
               </div>

               <Select
                  value={visitTypeFilter}
                  onValueChange={(value) =>
                     updateParams({ visitType: value, page: 1 })
                  }
               >
                  <SelectTrigger className="h-9 w-full bg-background sm:w-[160px]">
                     <div className="flex items-center gap-2">
                        {visitTypeFilter !== 'all' &&
                           (() => {
                              const Icon =
                                 VISIT_TYPE_ICONS[
                                    visitTypeFilter as VisitTypeValue
                                 ];
                              return Icon ? <Icon size={16} /> : null;
                           })()}
                        <SelectValue placeholder="Visit type" />
                     </div>
                  </SelectTrigger>
                  <SelectContent
                     align="start"
                     className="data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400"
                  >
                     <SelectItem value="all">All visit types</SelectItem>
                     {VISIT_TYPE_OPTIONS.map((type) => {
                        return (
                           <SelectItem key={type.value} value={type.value}>
                              <span className="truncate">{type.label}</span>
                           </SelectItem>
                        );
                     })}
                  </SelectContent>
               </Select>

               <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <ToggleGroup
                     type="single"
                     value={activeToggleKey}
                     onValueChange={(val) => {
                        if (!val) return;
                        const [, value] = val.split(':');
                        updateParams({ status: value, page: 1 });
                     }}
                     className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start"
                  >
                     {TOGGLE_OPTIONS.map((option) => {
                        const isActive = activeToggleKey === option.key;
                        return (
                           <ToggleGroupItem
                              key={option.key}
                              value={option.key}
                              className="relative px-3.5 py-1.5 h-8.5 rounded-lg! border-0 text-sm font-medium transition-colors bg-muted/90 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer outline-none first:rounded-lg last:rounded-lg data-[state=on]:bg-transparent data-[state=on]:text-primary-foreground"
                           >
                              <span className="relative z-10">
                                 {option.label}
                              </span>
                              {isActive && (
                                 <motion.div
                                    layoutId="active-status-pill"
                                    className="absolute inset-0 bg-primary rounded-lg z-0"
                                    transition={{
                                       type: 'spring',
                                       stiffness: 380,
                                       damping: 30,
                                    }}
                                 />
                              )}
                           </ToggleGroupItem>
                        );
                     })}
                  </ToggleGroup>
               </div>
            </div>

            <Button
               className="text-white bg-blue-500 hover:bg-blue-500/80 relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.7)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0] dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] cursor-pointer"
               size="sm"
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
         />
      </>
   );
}
