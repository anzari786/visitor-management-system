'use client';

import CreateBadge from '@/components/badge/create-badge';
import { Button } from '@/components/ui/button';
import { useCreateBadge } from '@/hooks/use-badges';
import type { CreateBadgeFormValues } from '@/lib/validations/badge.schema';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const BadgesToolbar = () => {
   const [open, setOpen] = React.useState(false);
   const { mutateAsync: createBadge } = useCreateBadge();

   async function handleCreateBadge(values: CreateBadgeFormValues) {
      try {
         await createBadge(values);
         toast.success('Badge created successfully');
         setOpen(false);
      } catch (error) {
         const message =
            (error as { response?: { data?: { message?: string } }; message?: string })
               ?.response?.data?.message ??
            (error as { message?: string })?.message ??
            'Failed to create badge. Please try again.';

         toast.error(message);
         throw error;
      }
   }

   return (
      <div>
         <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
               <h1 className="text-base sm:text-lg font-semibold tracking-tight">
                  Badges
               </h1>
               <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Manage the organization&apos;s physical visitor badges.
               </p>
            </div>
            <Button size="sm" className="shrink-0" onClick={() => setOpen(true)}>
               <Plus className="size-4" />
               <span className="hidden sm:inline-flex">Create Badge</span>
               <span className="sm:hidden">Create</span>
            </Button>
         </div>

         <CreateBadge
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateBadge}
         />
      </div>
   );
};

export default BadgesToolbar;
