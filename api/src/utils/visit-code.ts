import { prisma } from '../config/prisma.js';

const CODE_PREFIX = 'VMS';
const CODE_PAD_WIDTH = 4;

/**
 * Generates a sequential, human-readable visit code, e.g. "VMS-0104".
 *
 * Uniqueness/concurrency-safety comes from MySQL's own AUTO_INCREMENT on
 * VisitCodeSequence, not from randomness — inserting a row is an atomic,
 * race-free way to reserve the next number. Numbers beyond 9999 simply
 * widen past the 4-digit padding rather than truncate or collide.
 */
export const generateVisitCode = async (): Promise<string> => {
   const sequence = await prisma.visitCodeSequence.create({ data: {} });
   return `${CODE_PREFIX}-${String(sequence.id).padStart(CODE_PAD_WIDTH, '0')}`;
};
