'use client';

import { StatsCards } from './stats-cards';
import { VisitGrowthChart } from './visit-growth-chart';
import { VisitsTable } from '../visits/visits-table';
import { MeetingTypeChart } from './meeting-type-chart';
import { ExportVisitLogDialog } from './export-visit-log-dialog';
import { Button } from '@/components/ui/button';
import { Content } from '@/components/shared/content';
import { Download } from 'lucide-react';

export function DashboardContent() {
   return (
      <Content
         subtitle={
            <p>
               Here&apos;s an overview of today&apos;s visitor activity and
               trends.
            </p>
         }
         actionButton={
            <ExportVisitLogDialog
               trigger={
                  <Button
                     variant="outline"
                     size="sm"
                     className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                     <Download className="size-3 sm:size-4" />
                     <span className="hidden sm:inline">Download Report</span>
                     <span className="sm:hidden">Report</span>
                  </Button>
               }
            />
         }
      >
         <StatsCards />
         <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
            <VisitGrowthChart />
            <MeetingTypeChart />
         </div>
         <VisitsTable />
      </Content>
   );
}
