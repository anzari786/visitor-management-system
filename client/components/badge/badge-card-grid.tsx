'use client';

import { BadgeCard } from '@/components/badge/badge-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBadges } from '@/hooks/use-badges';

function BadgeCardSkeleton() {
   return (
      <div className="rounded-xl border bg-card p-4 flex flex-col gap-4">
         <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
               <Skeleton className="h-4 w-20" />
               <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="size-8 rounded-md" />
         </div>
         <div className="flex items-center gap-4">
            <Skeleton className="size-[88px] rounded-lg" />
            <div className="flex flex-col gap-2 flex-1">
               <Skeleton className="h-5 w-20 rounded-full" />
               <Skeleton className="h-3 w-28" />
               <Skeleton className="h-3 w-32" />
            </div>
         </div>
         <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
         </div>
      </div>
   );
}

export function BadgeCardGrid() {
   const { data: badges, isLoading, isError } = useBadges();

   if (isLoading) {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
               <BadgeCardSkeleton key={i} />
            ))}
         </div>
      );
   }

   if (isError) {
      return (
         <p className="text-sm text-destructive">
            Failed to load badges. Please refresh the page.
         </p>
      );
   }

   if (!badges?.length) {
      return (
         <div className="rounded-xl border border-dashed bg-card px-4 py-12 text-center">
            <p className="text-sm font-medium">No badges yet</p>
            <p className="text-xs text-muted-foreground mt-1">
               Create a badge to start managing physical visitor inventory.
            </p>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
         {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
         ))}
      </div>
   );
}
