'use client';

import { Download } from 'lucide-react';
import { ExportVisitLogDialog } from '../dashboard/export-visit-log-dialog';
import { useTranslation } from '@/lib/i18n';

export function SidebarExportMenu() {
   const { t } = useTranslation();

   return (
      <div className="flex flex-col gap-1">
         <ExportVisitLogDialog
            trigger={
               <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal text-foreground hover:bg-accent transition-colors">
                  <Download className="size-4 text-muted-foreground" />
                  {t('sidebar.exportCsv')}
               </button>
            }
         />
      </div>
   );
}
