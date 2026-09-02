'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useDepartments } from '@/hooks/use-departments';
import { DepartmentCard } from './department-card';
import { useTranslation } from '@/lib/i18n';

function DepartmentCardSkeleton() {
   return (
      <div className="relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-4">
         <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-muted" />
         <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <Skeleton className="size-10 rounded-lg" />
               <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-7 w-16 rounded-md" />
         </div>
         <div className="flex items-center justify-between pt-1 border-t">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
         </div>
      </div>
   );
}

export function DepartmentCardGrid() {
   const { t } = useTranslation();
   const { data: departments, isLoading, isError } = useDepartments();

   if (isLoading) {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
               <DepartmentCardSkeleton key={i} />
            ))}
         </div>
      );
   }

   if (isError) {
      return (
         <p className="text-sm text-destructive">
            {t('departments.loadError')}
         </p>
      );
   }

   if (!departments?.length) {
      return (
         <p className="text-sm text-muted-foreground">
            {t('departments.empty')}
         </p>
      );
   }

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {departments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
         ))}
      </div>
   );
}
