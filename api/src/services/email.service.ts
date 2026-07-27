/**
 * Sends a transactional email. Deliberately a stub — swap the body for
 * a real provider client (SES, SendGrid, SMTP, etc.) without touching
 * any caller; every caller already goes through dispatchNotification
 * rather than this directly.
 */
export const sendEmail = async (
   to: string,
   subject: string,
   body: string,
): Promise<void> => {
   // TODO: wire up the actual email provider.
   throw new Error('Not implemented');
};
