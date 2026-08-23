'use client';

import { Suspense } from 'react';
import { Content } from '@/components/shared/content';
import { VisitsTable } from '@/components/visits/visits-table';
import { VisitsTableSkeleton } from '@/components/visits/visits-table-skeleton';

export function VisitsContent() {
   return (
      <Content
         subtitle={
            <p>
               Manage visits from invitation and request through check-in and
               check-out.
            </p>
         }
      >
         <Suspense fallback={<VisitsTableSkeleton rows={10} />}>
            <VisitsTable />
         </Suspense>
      </Content>
   );
}
