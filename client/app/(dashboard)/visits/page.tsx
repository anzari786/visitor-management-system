import { VisitsTable } from '@/components/visits/visits-table';
import { VisitsTableSkeleton } from '@/components/visits/visits-table-skeleton';
import VisitsToolbar from '@/components/visits/visits-toolbar';
import { Suspense } from 'react';

export default function VisitsPage() {
   return (
      <div className="w-full space-y-5 bg-background p-3 sm:space-y-6 sm:p-4 md:p-6">
         <VisitsToolbar />
         <Suspense fallback={<VisitsTableSkeleton rows={10} />}>
            <VisitsTable />
         </Suspense>
      </div>
   );
}
