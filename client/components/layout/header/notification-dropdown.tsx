'use client';

import {
   useLayoutEffect,
   useMemo,
   useRef,
   useState,
   type ReactElement,
} from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
   Bell,
   CalendarClock,
   CheckCircle2,
   ClipboardCheck,
   Loader2,
   LogIn,
   LogOut,
   type LucideIcon,
   UserPlus,
   XCircle,
} from 'lucide-react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
   useMarkAllNotificationsRead,
   useMarkNotificationAsRead,
   useNotificationUnreadCount,
   useNotifications,
} from '@/hooks/use-notifications';
import type { Notification as NotificationItem } from '@/types/notification.types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

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

const mapNotificationType = (type: string): NotificationType => {
   switch (type) {
      case 'VISIT_APPROVAL_REQUEST':
      case 'VISIT_SUBMITTED':
      case 'INVITATION_SENT':
         return 'visit_request_received';
      case 'VISIT_APPROVED':
         return 'visit_request_approved';
      case 'VISIT_REJECTED':
         return 'visit_request_rejected';
      case 'VISIT_RESCHEDULED':
         return 'visit_rescheduled';
      case 'VISITOR_ARRIVED':
      case 'VISITOR_REGISTERED':
         return 'visitor_checked_in';
      case 'VISITOR_CHECKED_OUT':
         return 'visitor_checked_out';
      case 'VISIT_CANCELLED':
      case 'OVERDUE_VISIT':
         return 'visit_cancelled';
      default:
         return 'visit_request_received';
   }
};

const formatNotificationTime = (value?: string | null) => {
   if (!value) return 'just now';

   try {
      return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
   } catch {
      return 'just now';
   }
};

function NotificationList({
   notifications,
   onSelect,
   pendingReadId,
}: {
   notifications: NotificationItem[];
   onSelect: (notification: NotificationItem) => void;
   pendingReadId: number | null;
}) {
   return (
      <div className="px-1.5 pb-1">
         {notifications.map((notification) => {
            const mappedType = mapNotificationType(notification.type);
            const style = TYPE_STYLES[mappedType];
            const Icon = style.icon;
            const isPending = pendingReadId === Number(notification.id);

            return (
               <button
                  key={notification.id}
                  type="button"
                  onClick={() => onSelect(notification)}
                  className={cn(
                     'my-1 flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/70 cursor-pointer',
                     !notification.isRead && 'bg-accent/40',
                  )}
                  aria-label={notification.title ?? 'Notification'}
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
                              notification.isRead
                                 ? 'font-medium'
                                 : 'font-semibold',
                           )}
                        >
                           {notification.title ?? 'Notification'}
                        </p>
                        {!notification.isRead && (
                           <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                     </div>
                     <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notification.message || 'No details available.'}
                     </p>
                     <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                           {formatNotificationTime(notification.createdAt)}
                        </p>
                        {isPending && (
                           <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                     </div>
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
   const { t } = useTranslation();
   const [open, setOpen] = useState(Boolean(defaultOpen));
   const [expanded, setExpanded] = useState(false);
   const [listHeight, setListHeight] = useState<number>();
   const listContainerRef = useRef<HTMLDivElement>(null);

   const {
      data: notifications = [],
      isLoading,
      isError,
   } = useNotifications({
      page: 1,
      limit: 20,
   });
   const { data: unreadCountData } = useNotificationUnreadCount();
   const markAsRead = useMarkNotificationAsRead();
   const markAllAsRead = useMarkAllNotificationsRead();

   const unreadCount = useMemo(
      () =>
         unreadCountData?.unreadCount ??
         notifications.filter((notification) => !notification.isRead).length,
      [notifications, unreadCountData],
   );

   const hasMany = notifications.length > INITIAL_VISIBLE_COUNT;
   const visibleNotifications =
      hasMany && !expanded
         ? notifications.slice(0, INITIAL_VISIBLE_COUNT)
         : notifications;

   const showSeeAll = hasMany && !expanded;
   const showMarkAllAsReadButton = (!hasMany || expanded) && unreadCount > 0;

   useLayoutEffect(() => {
      if (!expanded && listContainerRef.current && notifications.length > 0) {
         setListHeight(listContainerRef.current.offsetHeight);
      }
   }, [expanded, notifications.length, visibleNotifications.length]);

   function handleNotificationSelect(notification: NotificationItem) {
      if (notification.isRead) return;
      markAsRead.mutate(Number(notification.id));
   }

   return (
      <div className="relative flex items-center justify-center">
         <DropdownMenu
            open={open}
            onOpenChange={(nextOpen) => {
               setOpen(nextOpen);
               if (!nextOpen) {
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
                     {t('header.notifications')}
                  </p>
                  {unreadCount > 0 ? (
                     <Badge className="h-5 font-normal">
                        {unreadCount} New
                     </Badge>
                  ) : (
                     <Badge variant="secondary" className="h-5 font-normal">
                        {t('header.allCaughtUp')}
                     </Badge>
                  )}
               </DropdownMenuLabel>

               {isLoading ? (
                  <div className="px-1.5 pb-1">
                     {Array.from({ length: 3 }).map((_, index) => (
                        <div
                           key={index}
                           className="my-1 flex w-full items-start gap-3 rounded-xl p-2.5"
                        >
                           <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/80" />
                           <div className="min-w-0 flex-1 space-y-2">
                              <div className="h-4 w-2/3 rounded bg-muted/80" />
                              <div className="h-3 w-full rounded bg-muted/60" />
                              <div className="h-3 w-20 rounded bg-muted/60" />
                           </div>
                        </div>
                     ))}
                  </div>
               ) : isError ? (
                  <div className="px-4 pb-4 pt-1">
                     <p className="text-sm text-destructive">
                        {t('header.notificationsLoadError')}
                     </p>
                  </div>
               ) : notifications.length === 0 ? (
                  <div className="flex min-h-40 items-center justify-center px-4 py-6">
                     <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                           <Bell className="size-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                           {t('header.noNotifications')}
                        </p>
                     </div>
                  </div>
               ) : (
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
                              onSelect={handleNotificationSelect}
                              pendingReadId={
                                 markAsRead.isPending
                                    ? Number(markAsRead.variables ?? 0)
                                    : null
                              }
                           />
                        </ScrollArea>
                     ) : (
                        <NotificationList
                           notifications={visibleNotifications}
                           onSelect={handleNotificationSelect}
                           pendingReadId={
                              markAsRead.isPending
                                 ? Number(markAsRead.variables ?? 0)
                                 : null
                           }
                        />
                     )}
                  </div>
               )}

               {!isLoading && !isError && notifications.length > 0 && (
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
                           {t('header.seeAllNotifications')}
                        </Button>
                     ) : showMarkAllAsReadButton ? (
                        <Button
                           type="button"
                           variant="outline"
                           className="w-full rounded-xl cursor-pointer"
                           disabled={markAllAsRead.isPending}
                           onClick={(event) => {
                              event.preventDefault();
                              markAllAsRead.mutate();
                           }}
                        >
                           {markAllAsRead.isPending
                              ? 'Updating...'
                              : 'Mark All as Read'}
                        </Button>
                     ) : null}
                  </div>
               )}
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
   );
}
