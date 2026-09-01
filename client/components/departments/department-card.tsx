'use client';

import { StatusBadge } from '@/components/shared/status-badge';
import { useTranslation } from '@/lib/i18n';
import type { Department } from '@/types/department.types';
import { Briefcase, Users } from 'lucide-react';
import { DepartmentCardMenu } from './department-card-menu';

type DepartmentCardProps = {
   department: Department;
};

export function DepartmentCard({ department }: DepartmentCardProps) {
   const { t } = useTranslation();

   return (
      <div className="relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-4 hover:shadow-sm transition-shadow">
         {/* Color accent bar */}
         <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{ backgroundColor: department.color }}
         />

         <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Briefcase className="size-4" />
               </div>

               <div className="flex items-center gap-2">
                  <div
                     className="w-1 h-4 sm:h-5 rounded-sm shrink-0 cursor-pointer"
                     style={{ backgroundColor: department.color }}
                  />
                  <p className="text-sm font-semibold">{department.name}</p>
               </div>
            </div>

            <DepartmentCardMenu department={department} />
         </div>

         <div className="flex items-center justify-between pt-1 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
               <Users className="size-4" />
               <span>
                  {t('departments.visitsCount', {
                     count: department.totalVisits,
                  })}
               </span>
            </div>
            <StatusBadge status={department.isActive ? 'active' : 'inactive'} />
         </div>
      </div>
   );
}
