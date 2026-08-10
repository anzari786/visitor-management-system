'use client';

import { Timer, TriangleAlert, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardStatCard } from '@/types/dashboard.types';

/**
 * Static mock stats — swap for API data (e.g. useVisitStats) when backend is ready.
 */
const MOCK_STATS: DashboardStatCard[] = [
   {
      id: 'total_visits',
      title: 'Total Visits',
      value: '1,248',
      change: '+20%',
      changeValue: '(208)',
      isPositive: true,
   },
   {
      id: 'currently_inside',
      title: 'Currently Inside',
      value: '42',
      change: '+8%',
      changeValue: '(3)',
      isPositive: true,
   },
   {
      id: 'avg_duration',
      title: 'Avg. Visit Duration',
      value: '1h 24m',
      change: '-15%',
      changeValue: '(12m)',
      isPositive: false,
   },
   {
      id: 'overstays',
      title: 'Overstays',
      value: '18',
      change: '-12%',
      changeValue: '(2)',
      isPositive: false,
   },
];

const STAT_ICONS: Record<DashboardStatCard['id'], LucideIcon> = {
   total_visits: Users,
   currently_inside: UserPlus,
   avg_duration: Timer,
   overstays: TriangleAlert,
};

interface StatsCardsProps {
   /** Optional override — defaults to mock data until backend is wired. */
   data?: DashboardStatCard[];
}

export function StatsCards({ data = MOCK_STATS }: StatsCardsProps) {
   return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
         {data.map((stat, index) => {
            const Icon = STAT_ICONS[stat.id];

            return (
               <div key={stat.id} className="flex items-start">
                  <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
                     <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                        <Icon className="size-3.5 sm:size-[18px]" />
                        <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                           {stat.title}
                        </span>
                     </div>
                     <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
                        {stat.value}
                     </p>
                     <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
                        <span
                           className={
                              stat.isPositive
                                 ? 'text-emerald-600'
                                 : 'text-red-600'
                           }
                        >
                           {stat.change}
                           <span className="hidden sm:inline">
                              {stat.changeValue}
                           </span>
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                           vs Last Months
                        </span>
                     </div>
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
