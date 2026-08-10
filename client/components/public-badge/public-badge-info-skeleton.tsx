'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PublicBadgeInfoSkeleton() {
   return (
      <Card className="shadow-sm overflow-hidden">
         <CardHeader className="border-b pb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
               <Skeleton className="mx-auto size-[132px] rounded-lg sm:mx-0" />
               <div className="flex flex-col gap-3 flex-1 items-center sm:items-start">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-5 w-20 rounded-full" />
               </div>
            </div>
         </CardHeader>
         <CardContent className="flex flex-col gap-4 pt-6">
            {Array.from({ length: 8 }).map((_, index) => (
               <div
                  key={index}
                  className="flex items-center justify-between gap-3"
               >
                  <div className="flex items-center gap-2">
                     <Skeleton className="size-8 rounded-lg" />
                     <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-28" />
               </div>
            ))}
         </CardContent>
      </Card>
   );
}
