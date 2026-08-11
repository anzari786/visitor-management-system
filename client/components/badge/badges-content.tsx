'use client';

import CreateBadge from '@/components/badge/create-badge';
import { BadgeCardGrid } from '@/components/badge/badge-card-grid';
import { BadgeStatsCards } from '@/components/badge/badge-stats';
import { Content } from '@/components/shared/content';
import { Button } from '@/components/ui/button';
import { useBadges, useCreateBadge } from '@/hooks/use-badges';
import type { CreateBadgeFormValues } from '@/lib/validations/badge.schema';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export function BadgesContent() {
   const [open, setOpen] = React.useState(false);
   const { data: badges = [] } = useBadges();
   const { mutateAsync: createBadge } = useCreateBadge();

   async function handleCreateBadge(values: CreateBadgeFormValues) {
      try {
         await createBadge(values);
         toast.success('Badge created successfully');
         setOpen(false);
      } catch (error) {
         const message =
            (
               error as {
                  response?: { data?: { message?: string } };
                  message?: string;
               }
            )?.response?.data?.message ??
            (error as { message?: string })?.message ??
            'Failed to create badge. Please try again.';

         toast.error(message);
         throw error;
      }
   }

   return (
      <Content
         subtitle={
            <p>
               Manage the organization&apos;s physical visitor badges.{' '}
               <span className="text-foreground font-medium tabular-nums">
                  {badges.length} badges
               </span>{' '}
               in the system
            </p>
         }
         actionButton={
            <Button
               size="sm"
               onClick={() => setOpen(true)}
               className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-linear-to-b from-foreground to-foreground/90 text-background"
            >
               <Plus className="size-3 sm:size-4" />
               <span className="hidden sm:inline">Create Badge</span>
               <span className="sm:hidden">Create</span>
            </Button>
         }
      >
         <BadgeStatsCards />
         <BadgeCardGrid />
         <CreateBadge
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateBadge}
         />
      </Content>
   );
}
