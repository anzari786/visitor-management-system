'use client';

import type { ReactNode } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import {
   Briefcase,
   Building2,
   Calendar,
   Clock,
   DoorOpen,
   Layers,
   Phone,
   User,
   Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BadgeQr } from '@/components/badge/badge-qr';
import { StatusBadge } from '@/components/shared/status-badge';
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PublicBadgeInfo } from '@/types/public-badge.types';

function displayValue(value: string | null | undefined) {
   const trimmed = value?.trim();
   return trimmed ? trimmed : '—';
}

function formatVisitDate(isoDate: string) {
   const date = parseISO(isoDate);
   if (!isValid(date)) return '—';
   return format(date, 'dd MMM yyyy');
}

function formatVisitTime(iso: string | null) {
   if (!iso) return '—';
   const date = parseISO(iso);
   if (!isValid(date)) return '—';
   return format(date, 'h:mm a');
}

function InfoRow({
   icon: Icon,
   label,
   value,
}: {
   icon: LucideIcon;
   label: string;
   value: ReactNode;
}) {
   return (
      <div className="flex items-start justify-between gap-3 text-sm">
         <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
               <Icon className="size-4" />
            </div>
            <span>{label}</span>
         </div>
         <div className="text-right font-medium text-foreground break-words max-w-[55%]">
            {value}
         </div>
      </div>
   );
}

function SectionHeading({ children }: { children: ReactNode }) {
   return (
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
         {children}
      </p>
   );
}

type PublicBadgeInfoCardProps = {
   data: PublicBadgeInfo;
   qrToken: string;
};

export function PublicBadgeInfoCard({
   data,
   qrToken,
}: PublicBadgeInfoCardProps) {
   const { badgeNumber, visitor, host, visit } = data;

   return (
      <Card className="overflow-hidden shadow-sm">
         <CardHeader className="gap-3 border-b pb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
               <div className="flex justify-center sm:justify-start shrink-0">
                  <BadgeQr value={qrToken} size={132} className="p-2" />
               </div>

               <div className="flex flex-col gap-2.5 min-w-0 flex-1 justify-center text-center sm:text-left">
                  <div className="space-y-1">
                     <CardTitle className="text-xl tracking-tight sm:text-2xl">
                        {badgeNumber}
                     </CardTitle>
                     <CardDescription>
                        Active visitor assignment for this badge
                     </CardDescription>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                     <StatusBadge status={visit.status} />
                  </div>
               </div>
            </div>
         </CardHeader>

         <CardContent className="flex flex-col gap-6 pt-6">
            <section>
               <SectionHeading>Visitor</SectionHeading>
               <div className="flex flex-col gap-3">
                  <InfoRow
                     icon={User}
                     label="Full name"
                     value={displayValue(visitor.fullName)}
                  />
                  <InfoRow
                     icon={Phone}
                     label="Phone"
                     value={displayValue(visitor.phone)}
                  />
                  <InfoRow
                     icon={Building2}
                     label="Organization"
                     value={displayValue(visitor.organization)}
                  />
               </div>
            </section>

            <Separator />

            <section>
               <SectionHeading>Host</SectionHeading>
               <div className="flex flex-col gap-3">
                  <InfoRow
                     icon={Users}
                     label="Host name"
                     value={displayValue(host.name)}
                  />
                  <InfoRow
                     icon={Building2}
                     label="Department"
                     value={displayValue(host.department)}
                  />
               </div>
            </section>

            <Separator />

            <section>
               <SectionHeading>Visit</SectionHeading>
               <div className="flex flex-col gap-3">
                  <InfoRow
                     icon={Briefcase}
                     label="Purpose"
                     value={displayValue(visit.purpose)}
                  />
                  <InfoRow
                     icon={Calendar}
                     label="Visit date"
                     value={formatVisitDate(visit.date)}
                  />
                  <InfoRow
                     icon={Clock}
                     label="Start time"
                     value={formatVisitTime(visit.startTime)}
                  />
                  <InfoRow
                     icon={Clock}
                     label="End time"
                     value={formatVisitTime(visit.endTime)}
                  />
               </div>
            </section>

            <Separator />

            <section>
               <SectionHeading>Visit Location</SectionHeading>
               <div className="flex flex-col gap-3">
                  <InfoRow
                     icon={Layers}
                     label="Floor"
                     value={displayValue(visit.floor)}
                  />
                  <InfoRow
                     icon={DoorOpen}
                     label="Room"
                     value={displayValue(visit.room)}
                  />
               </div>
            </section>
         </CardContent>
      </Card>
   );
}
