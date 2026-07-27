import { randomUUID } from 'node:crypto';

/**
 * Generates an opaque, unguessable token used to encode a visit or
 * badge's QR code. Kept as a thin boundary so the actual QR image
 * rendering (if any) can be swapped in here later without touching
 * callers.
 */
export const generateQrToken = (): string => randomUUID();
