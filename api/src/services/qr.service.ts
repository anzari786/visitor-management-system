import { randomUUID } from 'node:crypto';

/**
 * Opaque token encoded into printed-badge QR codes.
 *
 * Printed badge QR → VisitAttendance.badgeToken (never visitor PII)
 */
export const generateQrToken = (): string => randomUUID();
