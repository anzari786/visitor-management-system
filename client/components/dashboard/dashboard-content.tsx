'use client';

import { FilterSection } from './filter-section';
import { StatsCards } from './stats-cards';
import { VisitGrowthChart } from './visit-growth-chart';
import { VisitsTable } from '../visits/visits-table';
import { DepartmentVisitsChart } from './department-visits-chart';
import { UserGreeting } from '../shared/user-greeting';
import { ExportVisitLogDialog } from '../reports/export-visit-log-dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { DateFilter } from '@/types/dashboard.types';
import { Download } from 'lucide-react';

export function DashboardContent() {
   const [dateFilter, setDateFilter] = useState<DateFilter>('today');

   return (
      <main className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <UserGreeting />
            <div className="flex flex-wrap items-center gap-2">
               <FilterSection
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
               />
               <ExportVisitLogDialog
                  trigger={
                     <Button variant="outline" className="gap-2">
                        <Download className="size-4" />
                        Download Report
                     </Button>
                  }
               />
            </div>
         </div>
         <StatsCards dateFilter={dateFilter} />
         <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
            <VisitGrowthChart />
            <DepartmentVisitsChart />
         </div>
         <VisitsTable />
      </main>
   );
}
