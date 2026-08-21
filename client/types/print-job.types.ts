export type PrintJobStatus =
   | 'QUEUED'
   | 'PRINTING'
   | 'PRINTED'
   | 'FAILED'
   | 'CANCELLED';

export type BadgePrintJob = {
   id: string;
   attendanceId?: string;
   status: PrintJobStatus;
   attemptCount?: number;
   requestedAt?: string;
   printedAt?: string;
   errorMessage?: string;
   claimedBy?: string;
   claimedAt?: string;
   createdAt?: string;
   updatedAt?: string;
};
