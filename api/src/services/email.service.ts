import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { env } from '../config/env.js';

export interface SendEmailInput {
   to: string | string[];
   subject: string;
   /** Plain-text fallback (also used when HTML render is unavailable). */
   text: string;
   html?: string;
}

export interface SendTemplatedEmailInput {
   to: string | string[];
   subject: string;
   text: string;
   react: ReactElement;
}

let transporter: Transporter | null = null;

const isSmtpConfigured = () => Boolean(env.SMTP_HOST);

const getTransporter = (): Transporter => {
   if (transporter) {
      return transporter;
   }

   if (!env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured');
   }

   transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
         env.SMTP_USER && env.SMTP_PASS
            ? {
                 user: env.SMTP_USER,
                 pass: env.SMTP_PASS,
              }
            : undefined,
   });

   return transporter;
};

/**
 * Low-level email sender. Prefer `sendTemplatedEmail` from visit workflows.
 * Failures are thrown to the caller — `dispatchNotification` swallows them
 * so visit operations are never blocked by delivery issues.
 */
export const sendEmail = async (input: SendEmailInput): Promise<void> => {
   if (!isSmtpConfigured()) {
      console.warn(
         `[email] Skipping send to ${String(input.to)} — SMTP is not configured`,
      );
      return;
   }

   const mailer = getTransporter();

   await mailer.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text,
   });
};

/** Render a React Email template and send via Nodemailer. */
export const sendTemplatedEmail = async (
   input: SendTemplatedEmailInput,
): Promise<void> => {
   const html = await render(input.react);

   await sendEmail({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html,
   });
};
