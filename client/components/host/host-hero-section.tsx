'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

type HostHeroSectionProps = {
   onCreateInvitation: () => void;
};

export function HostHeroSection({ onCreateInvitation }: HostHeroSectionProps) {
   return (
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
         <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
               Manage Visitor Invitations
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
               Create and manage visitor invitations quickly and keep track of
               upcoming visits.
            </p>
         </div>

         <Button
            type="button"
            size="lg"
            className="w-full shrink-0 cursor-pointer gap-2 sm:w-auto"
            onClick={onCreateInvitation}
         >
            <Send className="size-4" />
            Create Invitation
         </Button>
      </section>
   );
}
