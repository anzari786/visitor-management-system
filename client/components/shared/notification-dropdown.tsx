'use client';

import type { ReactElement } from 'react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, CheckCircle2, Clock } from 'lucide-react';

type Notification = {
   id: string;
   icon: ReactElement;
   title: string;
   description: string;
   time: string;
};

const NOTIFICATIONS: Notification[] = [
   {
      id: '1',
      icon: <CheckCircle2 className="size-4 text-green-500" />,
      title: 'Meeting confirmed',
      description: 'Daily checkin has been confirmed for tomorrow at 9:00 AM',
      time: '2m ago',
   },
   {
      id: '2',
      icon: <Clock className="size-4 text-blue-500" />,
      title: 'Reminder',
      description: 'Team Standup starts in 30 minutes',
      time: '15m ago',
   },
   {
      id: '3',
      icon: <AlertCircle className="size-4 text-orange-500" />,
      title: 'Event updated',
      description: 'Design Workshop time has been changed to 2:00 PM',
      time: '1h ago',
   },
   {
      id: '4',
      icon: <CheckCircle2 className="size-4 text-green-500" />,
      title: 'New participant',
      description: 'Sarah joined the Sprint Planning meeting',
      time: '3h ago',
   },
];

type Props = {
   trigger?: ReactElement;
   align?: 'start' | 'center' | 'end';
};

const NotificationDropdown = ({ trigger, align = 'end' }: Props) => {
   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            {trigger ?? (
               <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-7 md:size-8 shrink-0"
               >
                  <Bell className="size-4" />
                  <span className="absolute top-1 right-1 size-1 bg-red-500 rounded-full" />
               </Button>
            )}
         </DropdownMenuTrigger>

         <DropdownMenuContent
            align={align}
            className="w-80"
            onCloseAutoFocus={(e) => e.preventDefault()}
         >
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {NOTIFICATIONS.map((n) => (
               <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
               >
                  <div className="flex items-center gap-2 w-full">
                     {n.icon}
                     <span className="text-sm font-medium flex-1">
                        {n.title}
                     </span>
                     <span className="text-xs text-muted-foreground">
                        {n.time}
                     </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                     {n.description}
                  </p>
               </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center cursor-pointer">
               <span className="text-xs text-muted-foreground">
                  View all notifications
               </span>
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

export default NotificationDropdown;
