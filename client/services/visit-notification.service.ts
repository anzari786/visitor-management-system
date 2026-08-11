/**
 * Temporary client-side stubs for visitor notification emails
 * until a real notification service is wired up.
 *
 * Host Portal API equivalents (for backend wiring):
 * - `useResendHostApprovalEmail` / `hostService.resendApprovalEmail`
 * - approve/reschedule mutations already invalidate host visit queries
 */

export type VisitApprovalEmailPayload = {
   visitorName: string;
   floor: string;
   room: string;
   visitSummary?: string;
};

export type VisitUpdateEmailPayload = {
   visitorName: string;
   floor: string;
   room: string;
   scheduleSummary?: string;
};

export function buildVisitApprovalEmailBody({
   floor,
   room,
}: Pick<VisitApprovalEmailPayload, 'floor' | 'room'>) {
   return `Your visit has been approved. Please report to Floor ${floor}, Room ${room} at the scheduled time.`;
}

export async function sendVisitApprovalEmail(
   payload: VisitApprovalEmailPayload,
): Promise<{ body: string }> {
   await new Promise((resolve) => setTimeout(resolve, 600));
   return { body: buildVisitApprovalEmailBody(payload) };
}

export async function sendVisitUpdateEmail(
   payload: VisitUpdateEmailPayload,
): Promise<{ body: string }> {
   await new Promise((resolve) => setTimeout(resolve, 600));
   const schedulePart = payload.scheduleSummary
      ? ` Updated schedule: ${payload.scheduleSummary}.`
      : '';
   return {
      body: `Your visit details have been updated. Please report to Floor ${payload.floor}, Room ${payload.room}.${schedulePart}`,
   };
}

export type PendingApprovalReminderPayload = {
   visitorName: string;
   hostName?: string;
   visitSummary?: string;
};

export async function sendPendingApprovalReminderEmail(
   payload: PendingApprovalReminderPayload,
): Promise<{ body: string }> {
   await new Promise((resolve) => setTimeout(resolve, 700));
   return {
      body: `Reminder: a visit request for ${payload.visitorName} is still awaiting host approval.${
         payload.visitSummary ? ` ${payload.visitSummary}` : ''
      }`,
   };
}
