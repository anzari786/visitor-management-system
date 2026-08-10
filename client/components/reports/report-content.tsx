'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Content } from '@/components/shared/content';
import { ExportVisitLogDialog } from './export-visit-log-dialog';
import { ReportStatsCards } from './report-stats-cards';

export function ReportContent() {
   return (
      <Content
         subtitle={
            <p>
               Review visit metrics and export logs for the selected period.
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
         <ReportStatsCards />
      </Content>
   );
}
