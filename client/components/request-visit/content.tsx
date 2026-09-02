'use client';

import { PortalHeader } from '@/components/shared/portal-header';
import VisitRequestForm from '@/components/shared/visit-request/visit-request-form';
import { toSubmitVisitRequestPayload } from '@/services/visit-request.service';
import { useSubmitVisitRequest } from '@/hooks/use-visit-request';
import { useTranslation } from '@/lib/i18n';

const RequestVisitContent = () => {
   const { t } = useTranslation();
   const submitVisitRequest = useSubmitVisitRequest();

   return (
      <main className="min-h-dvh w-full bg-background">
         <PortalHeader homeHref="/self-service" />
         <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 max-w-2xl space-y-1.5 sm:mb-8">
               <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {t('selfService.title')}
               </h1>

               <p className="text-sm text-muted-foreground sm:text-base">
                  {t('selfService.description')}
               </p>
            </div>
            <VisitRequestForm
               submitAction={async (values) =>
                  submitVisitRequest.mutateAsync(
                     toSubmitVisitRequestPayload(values),
                  )
               }
               isSubmitting={submitVisitRequest.isPending}
            />
         </section>
      </main>
   );
};

export default RequestVisitContent;
