'use client';

import { AlertCircle, ScanLine } from 'lucide-react';

import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from '@/components/ui/card';

type PublicBadgeEmptyStateProps = {
   title: string;
   description: string;
   variant?: 'empty' | 'error';
};

export function PublicBadgeEmptyState({
   title,
   description,
   variant = 'empty',
}: PublicBadgeEmptyStateProps) {
   const Icon = variant === 'error' ? AlertCircle : ScanLine;

   return (
      <Card className="shadow-sm">
         <CardHeader className="items-center text-center pb-2">
            <div
               className={
                  variant === 'error'
                     ? 'mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive'
                     : 'mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'
               }
            >
               <Icon className="size-6" />
            </div>
            <CardTitle className="text-lg tracking-tight sm:text-xl">
               {title}
            </CardTitle>
            <CardDescription className="max-w-sm text-pretty">
               {description}
            </CardDescription>
         </CardHeader>
         <CardContent className="pt-0" />
      </Card>
   );
}
