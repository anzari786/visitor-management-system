import { randomUUID } from 'node:crypto';

/**
 * Opaque token encoded into visit/badge QR codes.
 *
 * Visit QR  → Visit.qrToken  (unique; prefer over visitCode for scanning)
 * Badge QR  → Badge.qrToken  (unique; prefer over badgeNumber for scanning)
 *
 * Human-readable Visit.visitCode / Badge.badgeNumber remain available for
 * manual entry; lookup endpoints accept either form.
 */
export const generateQrToken = (): string => randomUUID();
