'use client';

import { use } from 'react';

import { PublicBadgeEmptyState } from '@/components/public-badge/public-badge-empty-state';
import { PublicBadgeInfoCard } from '@/components/public-badge/public-badge-info-card';
import { PublicBadgeInfoSkeleton } from '@/components/public-badge/public-badge-info-skeleton';
import { PortalHeader } from '@/components/shared/portal-header';
import { usePublicBadgeInfo } from '@/hooks/use-public-badge';

type PublicBadgeContentProps = {
   tokenPromise: Promise<{ token: string }>;
};

function resolvePublicError(status?: number, message?: string) {
   if (status === 404) {
      const lower = (message ?? '').toLowerCase();

      if (lower.includes('not available')) {
         return {
            title: 'Badge unavailable',
            description:
               'This badge cannot be used for visitor lookup right now. Please contact reception for assistance.',
            variant: 'empty' as const,
         };
      }

      if (lower.includes('no active') || lower.includes('assignment')) {
         return {
            title: 'No active visit',
            description:
               'This badge is not currently assigned to an active visitor. Please check in at reception if you need a new assignment.',
            variant: 'empty' as const,
         };
      }

      return {
         title: 'Badge not found',
         description:
            'We could not find a badge for this QR code. Ask reception to verify the badge and try again.',
         variant: 'empty' as const,
      };
   }

   if (status === 400) {
      return {
         title: 'Invalid badge QR',
         description:
            'This QR code does not look valid. Please scan a physical visitor badge QR code and try again.',
         variant: 'error' as const,
      };
   }

   return {
      title: 'Unable to load badge info',
      description:
         'Something went wrong while loading visitor information. Please try again in a moment.',
      variant: 'error' as const,
   };
}

export function PublicBadgeContent({ tokenPromise }: PublicBadgeContentProps) {
   const { token: rawToken } = use(tokenPromise);
   const token = decodeURIComponent(rawToken ?? '').trim();
   const { data, isLoading, isError, error } = usePublicBadgeInfo(
      token || undefined,
   );

   const errorState =
      !token
         ? {
              title: 'Invalid badge QR',
              description:
                 'This link is missing a badge identifier. Please scan a physical visitor badge QR code.',
              variant: 'error' as const,
           }
         : isError
           ? resolvePublicError(
                error?.response?.status,
                error?.response?.data?.message,
             )
           : null;

   return (
      <main className="min-h-dvh w-full bg-background">
         <PortalHeader homeHref="/self-service" />

         <section className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 space-y-1.5 sm:mb-8">
               <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Badge Information
               </h1>
               <p className="text-sm text-muted-foreground sm:text-base">
                  Visitor details for the currently assigned badge.
               </p>
            </div>

            {!token || errorState ? (
               <PublicBadgeEmptyState
                  title={errorState!.title}
                  description={errorState!.description}
                  variant={errorState!.variant}
               />
            ) : isLoading ? (
               <PublicBadgeInfoSkeleton />
            ) : data ? (
               <PublicBadgeInfoCard data={data} qrToken={token} />
            ) : (
               <PublicBadgeEmptyState
                  title="No active visit"
                  description="This badge is not currently assigned to an active visitor."
               />
            )}
         </section>
      </main>
   );
}
