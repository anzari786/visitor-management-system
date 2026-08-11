'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useBadgeStats } from '@/hooks/use-badges';
import type { BadgeStats } from '@/types/badge.types';

const STAT_ITEMS: {
   key: keyof BadgeStats;
   label: string;
}[] = [
   { key: 'total', label: 'Total Badges' },
   { key: 'available', label: 'Available' },
   { key: 'assigned', label: 'Assigned' },
   { key: 'lost', label: 'Lost' },
   { key: 'inactive', label: 'Inactive' },
];

function BadgeStatsSkeleton() {
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
         {Array.from({ length: 5 }).map((_, i) => (
            <div
               key={i}
               className="rounded-xl border bg-card p-4 flex flex-col gap-2"
            >
               <Skeleton className="h-3 w-20" />
               <Skeleton className="h-7 w-10" />
            </div>
         ))}
      </div>
   );
}

export function BadgeStatsCards() {
   const { data, isPending, isError } = useBadgeStats();

   if (isPending) return <BadgeStatsSkeleton />;

   if (isError || !data) {
      return (
         <div className="rounded-xl border bg-card p-4 text-sm text-destructive">
            Failed to load badge stats. Please refresh the page.
         </div>
      );
   }

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
         {STAT_ITEMS.map((item) => (
            <div
               key={item.key}
               className="rounded-xl border bg-card p-4 flex flex-col gap-1.5"
            >
               <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
               </p>
               <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {data[item.key]}
               </p>
            </div>
         ))}
      </div>
   );
}
