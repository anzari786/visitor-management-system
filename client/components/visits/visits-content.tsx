'use client';

import { Suspense } from 'react';
import { Content } from '@/components/shared/content';
import { VisitsTable } from '@/components/visits/visits-table';
import { VisitsTableSkeleton } from '@/components/visits/visits-table-skeleton';
import { useTranslation } from '@/lib/i18n';

export function VisitsContent() {
   const { t } = useTranslation();

   return (
      <Content
         subtitle={<p>{t('visits.subtitle')}</p>}
      >
         <Suspense fallback={<VisitsTableSkeleton rows={10} />}>
            <VisitsTable />
         </Suspense>
      </Content>
   );
}
