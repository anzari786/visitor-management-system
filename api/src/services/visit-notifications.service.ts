import { format } from 'date-fns';
import { createElement } from 'react';
import type { RoleName } from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import {
   dispatchDashboardNotifications,
   dispatchNotification,
} from './notification.service.js';
import type { VisitEmailDetails } from '../emails/index.js';
import {
   VisitApprovalRequestHostEmail,
   VisitApprovedEmail,
   VisitCancelledEmail,
   VisitRejectedEmail,
   VisitRequestSubmittedVisitorEmail,
   VisitRescheduledEmail,
   VisitorArrivedHostEmail,
   VisitorCheckedOutHostEmail,
   VisitorCheckedOutVisitorEmail,
} from '../emails/index.js';

type VisitPerson = {
   firstName: string;
   lastName: string;
   email?: string | null;
};

type VisitNotifyShape = {
   id: number;
   visitCode: string;
   purpose?: string | null;
   hostNameSnapshot?: string | null;
   hostEmailSnapshot?: string | null;
   departmentNameSnapshot?: string | null;
   floor?: string | null;
   room?: string | null;
   startDate?: Date | string | null;
   endDate?: Date | string | null;
   startTime?: string | null;
   endTime?: string | null;
   decisionNote?: string | null;
   hostEmployee?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      departmentName?: string | null;
      user?: { id: number } | null;
   } | null;
   participants?: Array<{
      visitor: VisitPerson;
   }>;
   /** Legacy v2 schedule relation — still accepted for transition. */
   schedules?: Array<{
      date: Date | string;
      expectedStartTime?: Date | string | null;
      expectedEndTime?: Date | string | null;
   }>;
   days?: Array<{ date: Date | string }>;
};

const STAFF_ROLES: RoleName[] = ['GUARD', 'RECEPTION', 'ADMIN', 'MANAGER'];

const fullName = (person: VisitPerson) =>
   `${person.firstName} ${person.lastName}`.trim();

const formatDateValue = (value?: Date | string | null): string | null => {
   if (!value) return null;
   const date = value instanceof Date ? value : new Date(value);
   if (Number.isNaN(date.getTime())) return null;
   return format(date, 'MMM d, yyyy');
};

const formatTimeValue = (value?: Date | string | null): string | null => {
   if (!value) return null;
   if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
      return value.slice(0, 5);
   }
   const date = value instanceof Date ? value : new Date(value);
   if (Number.isNaN(date.getTime())) return null;
   return format(date, 'HH:mm');
};

export const toVisitEmailDetails = (
   visit: VisitNotifyShape,
   options?: {
      visitors?: VisitPerson[];
      note?: string | null;
   },
): VisitEmailDetails => {
   const visitors = (options?.visitors ??
      visit.participants?.map((p) => p.visitor) ??
      []).map((visitor) => ({
      name: fullName(visitor),
      email: visitor.email,
   }));

   const firstSchedule = visit.schedules?.[0];
   const lastSchedule = visit.schedules?.[visit.schedules.length - 1];
   const firstDay = visit.days?.[0];
   const lastDay = visit.days?.[visit.days.length - 1];

   const hostName =
      visit.hostNameSnapshot ??
      (visit.hostEmployee
         ? `${visit.hostEmployee.firstName} ${visit.hostEmployee.lastName}`
         : null);

   return {
      visitCode: visit.visitCode,
      purpose: visit.purpose ?? null,
      hostName,
      departmentName:
         visit.departmentNameSnapshot ??
         visit.hostEmployee?.departmentName ??
         null,
      startDate:
         formatDateValue(visit.startDate) ??
         formatDateValue(firstSchedule?.date) ??
         formatDateValue(firstDay?.date),
      endDate:
         formatDateValue(visit.endDate) ??
         formatDateValue(lastSchedule?.date) ??
         formatDateValue(lastDay?.date),
      startTime:
         visit.startTime ??
         formatTimeValue(firstSchedule?.expectedStartTime ?? null),
      endTime:
         visit.endTime ??
         formatTimeValue(firstSchedule?.expectedEndTime ?? null),
      floor: visit.floor ?? null,
      room: visit.room ?? null,
      visitors,
      note: options?.note ?? visit.decisionNote ?? null,
   };
};

const hostPortalUrl = (visitId: number) =>
   `${env.CLIENT_URL.replace(/\/$/, '')}/host?visitId=${visitId}`;

const resolveHost = (visit: VisitNotifyShape) => {
   const email = visit.hostEmailSnapshot ?? visit.hostEmployee?.email ?? null;
   const name =
      visit.hostNameSnapshot ??
      (visit.hostEmployee
         ? `${visit.hostEmployee.firstName} ${visit.hostEmployee.lastName}`
         : 'Host');
   const userId = visit.hostEmployee?.user?.id;

   return { email, name, userId };
};

const listStaffUserIds = async (): Promise<number[]> => {
   const rows = await prisma.userRole.findMany({
      where: {
         role: { name: { in: STAFF_ROLES } },
         user: { isActive: true },
      },
      select: { userId: true },
   });

   return rows.map((row) => row.userId);
};

const safeNotify = async (label: string, task: () => Promise<void>) => {
   try {
      await task();
   } catch (error) {
      console.error(`[visit-notify] ${label} failed:`, error);
   }
};

/** Visit request created — confirm visitors, alert host, notify staff inbox. */
export const notifyVisitSubmitted = async (visit: VisitNotifyShape) => {
   await safeNotify('visit-submitted', async () => {
      const details = toVisitEmailDetails(visit);
      const host = resolveHost(visit);
      const visitors = visit.participants?.map((p) => p.visitor) ?? [];

      await Promise.all(
         visitors
            .filter((visitor) => visitor.email)
            .map((visitor) =>
               dispatchNotification({
                  type: 'VISIT_SUBMITTED',
                  channel: 'EMAIL',
                  visitId: visit.id,
                  recipientEmail: visitor.email!,
                  title: 'Visit request submitted',
                  subject: `Visit request received — ${visit.visitCode}`,
                  message: `Your visit request ${visit.visitCode} was submitted and is pending host approval.`,
                  react: createElement(VisitRequestSubmittedVisitorEmail, {
                     visitorName: visitor.firstName,
                     details: {
                        ...details,
                        visitors: [
                           { name: fullName(visitor), email: visitor.email },
                        ],
                     },
                  }),
               }),
            ),
      );

      if (host.email) {
         await dispatchNotification({
            type: 'VISIT_APPROVAL_REQUEST',
            channel: 'EMAIL',
            visitId: visit.id,
            recipientEmail: host.email,
            recipientUserId: host.userId,
            title: 'Visit approval required',
            subject: `Approval needed — visit ${visit.visitCode}`,
            message: `A visit request (${visit.visitCode}) is waiting for your approval.`,
            react: createElement(VisitApprovalRequestHostEmail, {
               hostName: host.name.split(' ')[0] || host.name,
               details,
               reviewUrl: hostPortalUrl(visit.id),
            }),
         });
      } else if (host.userId) {
         await dispatchNotification({
            type: 'VISIT_APPROVAL_REQUEST',
            channel: 'DASHBOARD',
            visitId: visit.id,
            recipientUserId: host.userId,
            title: 'Visit approval required',
            message: `Visit ${visit.visitCode} is waiting for your approval.`,
         });
      }

      const staffIds = await listStaffUserIds();
      await dispatchDashboardNotifications(staffIds, {
         type: 'VISIT_SUBMITTED',
         visitId: visit.id,
         title: 'New visit request',
         message: `Visit ${visit.visitCode} was submitted and is pending approval.`,
      });
   });
};

const notifyVisitorsStatus = async (
   visit: VisitNotifyShape,
   type:
      | 'VISIT_APPROVED'
      | 'VISIT_REJECTED'
      | 'VISIT_RESCHEDULED'
      | 'VISIT_CANCELLED',
   subject: string,
   message: string,
   title: string,
   Template:
      | typeof VisitApprovedEmail
      | typeof VisitRejectedEmail
      | typeof VisitRescheduledEmail
      | typeof VisitCancelledEmail,
) => {
   const details = toVisitEmailDetails(visit);
   const visitors = visit.participants?.map((p) => p.visitor) ?? [];

   await Promise.all(
      visitors
         .filter((visitor) => visitor.email)
         .map((visitor) =>
            dispatchNotification({
               type,
               channel: 'EMAIL',
               visitId: visit.id,
               recipientEmail: visitor.email!,
               title,
               subject,
               message,
               react: createElement(Template, {
                  visitorName: visitor.firstName,
                  details: {
                     ...details,
                     visitors: [
                        { name: fullName(visitor), email: visitor.email },
                     ],
                  },
               }),
            }),
         ),
   );

   const staffIds = await listStaffUserIds();
   await dispatchDashboardNotifications(staffIds, {
      type,
      visitId: visit.id,
      title,
      message,
   });
};

export const notifyVisitApproved = async (visit: VisitNotifyShape) => {
   await safeNotify('visit-approved', async () => {
      await notifyVisitorsStatus(
         visit,
         'VISIT_APPROVED',
         `Visit approved — ${visit.visitCode}`,
         `Visit ${visit.visitCode} has been approved.`,
         'Visit approved',
         VisitApprovedEmail,
      );
   });
};

/** Host invitation created — visitors are notified as invited/approved. */
export const notifyHostInvitation = async (visit: VisitNotifyShape) => {
   await safeNotify('host-invitation', async () => {
      const details = toVisitEmailDetails(visit);
      const visitors = visit.participants?.map((p) => p.visitor) ?? [];

      await Promise.all(
         visitors
            .filter((visitor) => visitor.email)
            .map((visitor) =>
               dispatchNotification({
                  type: 'INVITATION_SENT',
                  channel: 'EMAIL',
                  visitId: visit.id,
                  recipientEmail: visitor.email!,
                  title: 'You are invited',
                  subject: `Visit invitation — ${visit.visitCode}`,
                  message: `You have been invited to visit (${visit.visitCode}).`,
                  react: createElement(VisitApprovedEmail, {
                     visitorName: visitor.firstName,
                     details: {
                        ...details,
                        visitors: [
                           { name: fullName(visitor), email: visitor.email },
                        ],
                     },
                  }),
               }),
            ),
      );

      const staffIds = await listStaffUserIds();
      await dispatchDashboardNotifications(staffIds, {
         type: 'INVITATION_SENT',
         visitId: visit.id,
         title: 'Host invitation created',
         message: `Visit invitation ${visit.visitCode} was created.`,
      });
   });
};

export const notifyVisitRejected = async (visit: VisitNotifyShape) => {
   await safeNotify('visit-rejected', async () => {
      await notifyVisitorsStatus(
         visit,
         'VISIT_REJECTED',
         `Visit declined — ${visit.visitCode}`,
         `Visit ${visit.visitCode} was not approved.`,
         'Visit rejected',
         VisitRejectedEmail,
      );
   });
};

export const notifyVisitRescheduled = async (visit: VisitNotifyShape) => {
   await safeNotify('visit-rescheduled', async () => {
      await notifyVisitorsStatus(
         visit,
         'VISIT_RESCHEDULED',
         `Visit rescheduled — ${visit.visitCode}`,
         `Visit ${visit.visitCode} has been rescheduled. Please review the updated details.`,
         'Visit rescheduled',
         VisitRescheduledEmail,
      );
   });
};

export const notifyVisitCancelled = async (visit: VisitNotifyShape) => {
   await safeNotify('visit-cancelled', async () => {
      await notifyVisitorsStatus(
         visit,
         'VISIT_CANCELLED',
         `Visit cancelled — ${visit.visitCode}`,
         `Visit ${visit.visitCode} has been cancelled.`,
         'Visit cancelled',
         VisitCancelledEmail,
      );
   });
};

export const notifyVisitorArrived = async (
   visit: VisitNotifyShape,
   arrivedVisitors: VisitPerson[],
) => {
   await safeNotify('visitor-arrived', async () => {
      const host = resolveHost(visit);
      const details = toVisitEmailDetails(visit, { visitors: arrivedVisitors });
      const names = arrivedVisitors.map(fullName).join(', ');
      const message = `${names} checked in for visit ${visit.visitCode}.`;

      if (host.email) {
         await dispatchNotification({
            type: 'VISITOR_ARRIVED',
            channel: 'EMAIL',
            visitId: visit.id,
            recipientEmail: host.email,
            recipientUserId: host.userId,
            title: 'Visitor arrived',
            subject: `Visitor arrived — ${visit.visitCode}`,
            message,
            react: createElement(VisitorArrivedHostEmail, {
               hostName: host.name.split(' ')[0] || host.name,
               arrivedVisitors: arrivedVisitors.map((v) => ({
                  name: fullName(v),
                  email: v.email,
               })),
               details,
            }),
         });
      } else if (host.userId) {
         await dispatchNotification({
            type: 'VISITOR_ARRIVED',
            channel: 'DASHBOARD',
            visitId: visit.id,
            recipientUserId: host.userId,
            title: 'Visitor arrived',
            message,
         });
      }

      const staffIds = await listStaffUserIds();
      await dispatchDashboardNotifications(staffIds, {
         type: 'VISITOR_ARRIVED',
         visitId: visit.id,
         title: 'Visitor arrived',
         message,
      });
   });
};

/** Visitor completed self-registration or desk registration for an invitation. */
export const notifyVisitorRegistered = async (
   visit: VisitNotifyShape,
   visitor: VisitPerson,
) => {
   await safeNotify('visitor-registered', async () => {
      const host = resolveHost(visit);
      const visitorName = fullName(visitor);
      const message = `${visitorName} registered for visit ${visit.visitCode}.`;

      if (host.userId) {
         await dispatchNotification({
            type: 'VISITOR_REGISTERED',
            channel: 'DASHBOARD',
            visitId: visit.id,
            recipientUserId: host.userId,
            title: 'Visitor registered',
            message,
         });
      }

      if (host.email) {
         await dispatchNotification({
            type: 'VISITOR_REGISTERED',
            channel: 'EMAIL',
            visitId: visit.id,
            recipientEmail: host.email,
            recipientUserId: host.userId,
            title: 'Visitor registered',
            subject: `Visitor registered — ${visit.visitCode}`,
            message,
         });
      }

      const staffIds = await listStaffUserIds();
      await dispatchDashboardNotifications(staffIds, {
         type: 'VISITOR_REGISTERED',
         visitId: visit.id,
         title: 'Visitor registered',
         message,
      });
   });
};

export const notifyVisitorCheckedOut = async (
   visit: VisitNotifyShape,
   checkedOutVisitors: VisitPerson[],
) => {
   await safeNotify('visitor-checked-out', async () => {
      const host = resolveHost(visit);
      const details = toVisitEmailDetails(visit, {
         visitors: checkedOutVisitors,
      });
      const names = checkedOutVisitors.map(fullName).join(', ');
      const message = `${names} checked out from visit ${visit.visitCode}.`;

      if (host.email) {
         await dispatchNotification({
            type: 'VISITOR_CHECKED_OUT',
            channel: 'EMAIL',
            visitId: visit.id,
            recipientEmail: host.email,
            recipientUserId: host.userId,
            title: 'Visitor checked out',
            subject: `Visitor checked out — ${visit.visitCode}`,
            message,
            react: createElement(VisitorCheckedOutHostEmail, {
               hostName: host.name.split(' ')[0] || host.name,
               checkedOutVisitors: checkedOutVisitors.map((v) => ({
                  name: fullName(v),
                  email: v.email,
               })),
               details,
            }),
         });
      } else if (host.userId) {
         await dispatchNotification({
            type: 'VISITOR_CHECKED_OUT',
            channel: 'DASHBOARD',
            visitId: visit.id,
            recipientUserId: host.userId,
            title: 'Visitor checked out',
            message,
         });
      }

      await Promise.all(
         checkedOutVisitors
            .filter((visitor) => visitor.email)
            .map((visitor) =>
               dispatchNotification({
                  type: 'VISITOR_CHECKED_OUT',
                  channel: 'EMAIL',
                  visitId: visit.id,
                  recipientEmail: visitor.email!,
                  title: 'Checkout confirmed',
                  subject: `Checkout confirmed — ${visit.visitCode}`,
                  message: `Your checkout for visit ${visit.visitCode} was recorded.`,
                  react: createElement(VisitorCheckedOutVisitorEmail, {
                     visitorName: visitor.firstName,
                     details: {
                        ...details,
                        visitors: [
                           { name: fullName(visitor), email: visitor.email },
                        ],
                     },
                  }),
               }),
            ),
      );

      const staffIds = await listStaffUserIds();
      await dispatchDashboardNotifications(staffIds, {
         type: 'VISITOR_CHECKED_OUT',
         visitId: visit.id,
         title: 'Visitor checked out',
         message,
      });
   });
};
