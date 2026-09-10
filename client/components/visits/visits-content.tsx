'use client';

import { UserPlus } from 'lucide-react';
import * as React from 'react';
import { Suspense } from 'react';
import { Content } from '@/components/shared/content';
import { WalkInVisitRequestForm } from '@/components/walk-in/walk-in-visit-request-form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisitsTable } from '@/components/visits/visits-table';
import { useTranslation } from '@/lib/i18n';

export function VisitsContent() {
   const { t } = useTranslation();
   const [walkInOpen, setWalkInOpen] = React.useState(false);

   return (
      <Content
         subtitle={<p>{t('visits.subtitle')}</p>}
         actionButton={
            <Button
               size="sm"
               onClick={() => setWalkInOpen(true)}
               className="h-8 gap-2 text-xs sm:h-9 sm:gap-3 sm:text-sm bg-linear-to-b from-primary to-primary/90 text-background cursor-pointer"
            >
               <UserPlus className="size-3 sm:size-4" />
               <span>{t('visits.walkIn')}</span>
            </Button>
         }
      >
         <Suspense fallback={null}>
            <VisitsTable />
         </Suspense>
         <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
            <DialogContent
               showCloseButton={false}
               className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl"
            >
               <DialogTitle className="sr-only">
                  {t('visits.walkIn')}
               </DialogTitle>
               <WalkInVisitRequestForm />
            </DialogContent>
         </Dialog>
      </Content>
   );
}
