'use client';

import {
   useLayoutEffect,
   useMemo,
   useRef,
   useState,
   type ReactElement,
} from 'react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
   CalendarClock,
   CheckCircle2,
   ClipboardCheck,
   LogIn,
   LogOut,
   type LucideIcon,
   UserPlus,
   XCircle,
} from 'lucide-react';

type Props = {
   trigger: ReactElement;
   defaultOpen?: boolean;
   align?: 'start' | 'center' | 'end';
};

type NotificationType =
   | 'visit_request_received'
   | 'visit_request_approved'
   | 'visit_request_rejected'
   | 'visit_rescheduled'
   | 'visitor_checked_in'
   | 'visitor_checked_out'
   | 'visit_cancelled';

type Notification = {
   id: string;
   type: NotificationType;
   title: string;
   description: string;
   time: string;
   read: boolean;
};

const INITIAL_VISIBLE_COUNT = 4;

const TYPE_STYLES: Record<
   NotificationType,
   { icon: LucideIcon; bgColor: string; textColor: string }
> = {
   visit_request_received: {
      icon: UserPlus,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
   },
   visit_request_approved: {
      icon: CheckCircle2,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
   },
   visit_request_rejected: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
   },
   visit_rescheduled: {
      icon: CalendarClock,
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
   },
   visitor_checked_in: {
      icon: LogIn,
      bgColor: 'bg-sky-500/10',
      textColor: 'text-sky-600 dark:text-sky-400',
   },
   visitor_checked_out: {
      icon: LogOut,
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-600 dark:text-violet-400',
   },
   visit_cancelled: {
      icon: ClipboardCheck,
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-600 dark:text-slate-400',
   },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
   {
      id: '1',
      type: 'visit_request_received',
      title: 'New visit request received',
      description: 'Abebe Kebede requested a visit with the Operations team.',
      time: '2m ago',
      read: false,
   },
   {
      id: '2',
      type: 'visit_request_approved',
      title: 'Visit request approved',
      description: 'Sara Alemu’s visit for tomorrow at 10:00 AM was approved.',
      time: '18m ago',
      read: false,
   },
   {
      id: '3',
      type: 'visitor_checked_in',
      title: 'Visitor checked in',
      description: 'Daniel Haile has checked in at the front desk.',
      time: '42m ago',
      read: false,
   },
   {
      id: '4',
      type: 'visit_rescheduled',
      title: 'Visit rescheduled',
      description: 'Helen Tadesse moved her visit from Monday to Wednesday.',
      time: '1h ago',
      read: false,
   },
   {
      id: '5',
      type: 'visit_request_rejected',
      title: 'Visit request rejected',
      description: 'Yonas Bekele’s visit request was rejected by the host.',
      time: '2h ago',
      read: true,
   },
   {
      id: '6',
      type: 'visitor_checked_out',
      title: 'Visitor checked out',
      description: 'Marta Girma has completed checkout and left the premises.',
      time: '3h ago',
      read: true,
   },
   {
      id: '7',
      type: 'visit_cancelled',
      title: 'Visit cancelled',
      description: 'The scheduled visit for Michael Assefa has been cancelled.',
      time: '5h ago',
      read: true,
   },
];

function NotificationList({
   notifications,
   onSelect,
}: {
   notifications: Notification[];
   onSelect: (id: string) => void;
}) {
   return (
      <div className="px-1.5 pb-1">
         {notifications.map((notification) => {
            const style = TYPE_STYLES[notification.type];
            const Icon = style.icon;

            return (
               <button
                  key={notification.id}
                  type="button"
                  onClick={() => onSelect(notification.id)}
                  className={cn(
                     'my-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/70 cursor-pointer',
                     !notification.read && 'bg-accent/40',
                  )}
               >
                  <div
                     className={cn('rounded-xl p-2.5 shrink-0', style.bgColor)}
                  >
                     <Icon className={cn('size-4', style.textColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-start justify-between gap-2">
                        <p
                           className={cn(
                              'text-sm text-popover-foreground',
                              notification.read
                                 ? 'font-medium'
                                 : 'font-semibold',
                           )}
                        >
                           {notification.title}
                        </p>
                        {!notification.read && (
                           <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                     </div>
                     <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notification.description}
                     </p>
                     <p className="mt-1 text-xs text-muted-foreground">
                        {notification.time}
                     </p>
                  </div>
               </button>
            );
         })}
      </div>
   );
}

export default function NotificationDropdown({
   trigger,
   defaultOpen,
   align = 'end',
}: Props) {
   const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
   const [expanded, setExpanded] = useState(false);
   const [listHeight, setListHeight] = useState<number>();
   const listContainerRef = useRef<HTMLDivElement>(null);

   const unreadCount = useMemo(
      () => notifications.filter((notification) => !notification.read).length,
      [notifications],
   );

   const hasMany = notifications.length > INITIAL_VISIBLE_COUNT;
   const visibleNotifications =
      hasMany && !expanded
         ? notifications.slice(0, INITIAL_VISIBLE_COUNT)
         : notifications;

   const showSeeAll = hasMany && !expanded;
   const showMarkAllAsRead = (!hasMany || expanded) && unreadCount > 0;

   useLayoutEffect(() => {
      if (!expanded && listContainerRef.current) {
         setListHeight(listContainerRef.current.offsetHeight);
      }
   }, [expanded, visibleNotifications.length]);

   function markAllAsRead() {
      setNotifications((current) =>
         current.map((notification) => ({ ...notification, read: true })),
      );
   }

   function markAsRead(id: string) {
      setNotifications((current) =>
         current.map((notification) =>
            notification.id === id
               ? { ...notification, read: true }
               : notification,
         ),
      );
   }

   return (
      <div className="relative flex items-center justify-center">
         <DropdownMenu
            defaultOpen={defaultOpen}
            onOpenChange={(open) => {
               if (!open) {
                  setExpanded(false);
                  setListHeight(undefined);
               }
            }}
         >
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            {unreadCount > 0 && (
               <span className="pointer-events-none absolute top-1.5 right-1.5 z-10 size-2 rounded-full bg-red-500" />
            )}

            <DropdownMenuContent
               align={align}
               className="p-0 w-[22rem] sm:w-96 rounded-2xl"
               onCloseAutoFocus={(event) => event.preventDefault()}
            >
               <DropdownMenuLabel className="flex items-center justify-between gap-3 p-4 font-normal">
                  <p className="text-base font-medium text-popover-foreground">
                     Notifications
                  </p>
                  {unreadCount > 0 ? (
                     <Badge className="h-5 font-normal">{unreadCount} New</Badge>
                  ) : (
                     <Badge variant="secondary" className="h-5 font-normal">
                        All caught up
                     </Badge>
                  )}
               </DropdownMenuLabel>

               <div
                  ref={listContainerRef}
                  className="overflow-hidden"
                  style={
                     expanded && listHeight
                        ? { height: listHeight }
                        : undefined
                  }
               >
                  {expanded ? (
                     <ScrollArea className="h-full">
                        <NotificationList
                           notifications={visibleNotifications}
                           onSelect={markAsRead}
                        />
                     </ScrollArea>
                  ) : (
                     <NotificationList
                        notifications={visibleNotifications}
                        onSelect={markAsRead}
                     />
                  )}
               </div>

               <div className="mx-1.5 mb-1.5 p-2 pt-1">
                  {showSeeAll ? (
                     <Button
                        type="button"
                        className="w-full rounded-xl cursor-pointer hover:bg-primary/80"
                        onClick={(event) => {
                           event.preventDefault();
                           setExpanded(true);
                        }}
                     >
                        See All Notifications
                     </Button>
                  ) : showMarkAllAsRead ? (
                     <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl cursor-pointer"
                        onClick={(event) => {
                           event.preventDefault();
                           markAllAsRead();
                        }}
                     >
                        Mark All as Read
                     </Button>
                  ) : null}
               </div>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
