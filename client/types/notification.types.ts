export const NOTIFICATION_TYPES = [
   'VISIT_SUBMITTED',
   'VISIT_APPROVAL_REQUEST',
   'VISIT_APPROVED',
   'VISIT_REJECTED',
   'VISIT_RESCHEDULED',
   'VISIT_CANCELLED',
   'VISITOR_ARRIVED',
   'VISITOR_CHECKED_OUT',
   'OVERDUE_VISIT',
   'INVITATION_SENT',
   'VISITOR_REGISTERED',
] as const;

export const NOTIFICATION_CHANNELS = ['EMAIL', 'DASHBOARD'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type Notification = {
   id: string;
   type: NotificationType;
   channel: NotificationChannel;
   title?: string | null;
   subject?: string | null;
   message: string;
   isRead: boolean;
   sentAt?: string | null;
   createdAt: string;
   visitId?: string | null;
};

export type NotificationListParams = {
   page?: number;
   limit?: number;
   isRead?: boolean;
   type?: NotificationType;
   channel?: NotificationChannel;
};

export type NotificationPaginationMeta = {
   page: number;
   limit: number;
   total: number;
   totalPages: number;
};

export type NotificationsListResponse = {
   data: Notification[];
   pagination: NotificationPaginationMeta;
};

export type UnreadNotificationCountData = {
   unreadCount: number;
};
