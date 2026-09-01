'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useVisitStats } from '@/hooks/use-dashboard';
import type {
   DashboardStatCard,
   DashboardStatId,
   VisitStats,
} from '@/types/dashboard.types';
import { Timer, TriangleAlert, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const STAT_TITLE_KEYS: Record<DashboardStatId, TranslationKey> = {
   total_visits: 'dashboard.stats.totalVisits',
   currently_inside: 'dashboard.stats.currentlyInside',
   avg_duration: 'dashboard.stats.avgDuration',
   pending_approvals: 'dashboard.stats.pendingApprovals',
};

const STAT_ICONS: Record<DashboardStatId, LucideIcon> = {
   total_visits: Users,
   currently_inside: UserPlus,
   avg_duration: Timer,
   pending_approvals: TriangleAlert,
};

function formatSignedPercent(value: number) {
   const sign = value > 0 ? '+' : value < 0 ? '-' : '';
   return `${sign}${Math.abs(value)}%`;
}

function formatSignedMinutes(value: number) {
   const sign = value > 0 ? '+' : value < 0 ? '-' : '';
   return `${sign}${Math.abs(value)}min`;
}

function mapStatsToCards(stats: VisitStats): DashboardStatCard[] {
   return [
      {
         id: 'total_visits',
         title: 'Total Visits',
         value: stats.totalVisits.toLocaleString(),
         change: formatSignedPercent(stats.totalVisitsChange),
         changeValue: '',
         isPositive: stats.totalVisitsChange >= 0,
      },
      {
         id: 'currently_inside',
         title: 'Currently Inside',
         value: stats.currentlyInside.toLocaleString(),
         change: formatSignedPercent(stats.currentlyInsideChange),
         changeValue: '',
         isPositive: stats.currentlyInsideChange >= 0,
      },
      {
         id: 'avg_duration',
         title: 'Avg. Visit Duration',
         value: stats.averageVisitDuration,
         change: formatSignedMinutes(stats.averageVisitDurationChange),
         changeValue: '',
         isPositive: stats.averageVisitDurationChange >= 0,
      },
      {
         id: 'pending_approvals',
         title: 'Pending Approvals',
         value: '2',
         change: '',
         changeValue: '',
         isPositive: true,
      },
   ];
}

export function StatsCards() {
   const { t } = useTranslation();
   const { data: stats, isPending, isError } = useVisitStats('today');

   if (isPending) {
      return (
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            {Array.from({ length: 4 }).map((_, index) => (
               <div key={index} className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                     <Skeleton className="size-3.5 sm:size-[18px] rounded-sm" />
                     <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-16" />
               </div>
            ))}
         </div>
      );
   }

   if (isError) {
      return (
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            <p className="col-span-full text-sm text-destructive">
               {t('dashboard.stats.loadError')}
            </p>
         </div>
      );
   }

   if (!stats) {
      return (
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
            <p className="col-span-full text-sm text-muted-foreground">
               {t('dashboard.stats.empty')}
            </p>
         </div>
      );
   }

   const data = mapStatsToCards(stats);

   return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
         {data.map((stat, index) => {
            const Icon = STAT_ICONS[stat.id];
            const isPendingApprovals = stat.id === 'pending_approvals';
            const isCurrentlyInside = stat.id === 'currently_inside';
            const subtitleText = t(
               isPendingApprovals
                  ? 'dashboard.stats.awaitingReview'
                  : isCurrentlyInside
                    ? 'dashboard.stats.onSiteNow'
                    : 'dashboard.stats.vsLastMonth',
            );

            return (
               <div key={stat.id} className="flex items-start">
                  <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
                     <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                        <Icon className="size-3.5 sm:size-[18px]" />
                        <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                           {t(STAT_TITLE_KEYS[stat.id])}
                        </span>
                     </div>
                     <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
                        {stat.value}
                     </p>

                     {isPendingApprovals ? (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
                           <span className="text-muted-foreground">
                              {subtitleText}
                           </span>
                        </div>
                     ) : (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
                           {!isCurrentlyInside && (
                              <span
                                 className={
                                    stat.isPositive
                                       ? 'text-emerald-600'
                                       : 'text-red-600'
                                 }
                              >
                                 {stat.change}
                                 {!isPendingApprovals && stat.changeValue && (
                                    <span className="hidden sm:inline">
                                       {stat.changeValue}
                                    </span>
                                 )}
                              </span>
                           )}
                           {isCurrentlyInside && (
                              <span className="text-muted-foreground hidden sm:inline">
                                 {subtitleText}
                              </span>
                           )}
                           {!isCurrentlyInside && !isPendingApprovals && (
                              <span className="text-muted-foreground hidden sm:inline">
                                 {subtitleText}
                              </span>
                           )}
                        </div>
                     )}
                  </div>
                  {index < data.length - 1 && (
                     <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
                  )}
               </div>
            );
         })}
      </div>
   );
}
