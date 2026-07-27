import { randomInt } from 'node:crypto';

// Excludes visually ambiguous characters (0/O, 1/I/L) for reliable reading
// off a printed badge or a reception screen.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

const generateCodeSuffix = (): string => {
   let suffix = '';

   for (let i = 0; i < CODE_LENGTH; i += 1) {
      suffix += CODE_CHARS[randomInt(0, CODE_CHARS.length)];
   }

   return suffix;
};

/** Generates a short, human-readable visit code, e.g. "VIS-7K4QXP". */
export const generateVisitCode = (): string => `VIS-${generateCodeSuffix()}`;

/** Generates a short, human-readable invitation code, e.g. "INV-4M8QZT". */
export const generateInvitationCode = (): string =>
   `INV-${generateCodeSuffix()}`;
