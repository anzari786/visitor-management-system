import { randomUUID } from 'node:crypto';

/**
 * Opaque token encoded into visit / printed-badge QR codes.
 *
 * Visit QR        → Visit.qrToken            (prefer over visitCode)
 * Printed badge QR → VisitAttendance.badgeToken (never visitor PII)
 *
 * Human-readable Visit.visitCode remains available for manual entry.
 */
export const generateQrToken = (): string => randomUUID();
