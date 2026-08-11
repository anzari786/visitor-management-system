import { BadgeCardGrid } from '@/components/badge/badge-card-grid';
import { BadgeStatsCards } from '@/components/badge/badge-stats';
import BadgesToolbar from '@/components/badge/badges-toolbar';

export default function BadgePage() {
   return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
         <BadgesToolbar />
         <BadgeStatsCards />
         <BadgeCardGrid />
      </div>
   );
}
