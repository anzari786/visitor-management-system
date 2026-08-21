import type { BadgePrintData } from './types.js';
import { log } from './logger.js';

export interface PrintJobPayload {
   job: {
      id: string;
      attendanceId: string;
      status: string;
      attemptCount: number;
   };
   printData: BadgePrintData;
}

export class VmsApiClient {
   constructor(
      private readonly baseUrl: string,
      private readonly token: string,
      private readonly agentId: string,
   ) {}

   private async request<T>(
      method: string,
      path: string,
      body?: unknown,
   ): Promise<{ status: number; data: T | null }> {
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
         method,
         headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
         body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (response.status === 204) {
         return { status: 204, data: null };
      }

      const json = (await response.json().catch(() => null)) as T | null;

      if (!response.ok) {
         const message =
            json &&
            typeof json === 'object' &&
            'message' in json &&
            typeof (json as { message: unknown }).message === 'string'
               ? (json as { message: string }).message
               : `HTTP ${response.status}`;
         throw new Error(message);
      }

      return { status: response.status, data: json };
   }

   async claimNextJob(): Promise<PrintJobPayload | null> {
      type Envelope = { success: boolean; data: PrintJobPayload };
      const result = await this.request<Envelope>(
         'GET',
         `/print-jobs/next?agentId=${encodeURIComponent(this.agentId)}`,
      );

      if (result.status === 204 || !result.data?.data) {
         return null;
      }

      return result.data.data;
   }

   async markPrinting(jobId: number): Promise<void> {
      await this.request('POST', `/print-jobs/${jobId}/printing`, {
         agentId: this.agentId,
      });
   }

   async complete(jobId: number): Promise<void> {
      await this.request('POST', `/print-jobs/${jobId}/complete`, {
         agentId: this.agentId,
      });
      log.info('Reported print success', { jobId });
   }

   async fail(jobId: number, errorMessage: string): Promise<void> {
      await this.request('POST', `/print-jobs/${jobId}/fail`, {
         agentId: this.agentId,
         errorMessage,
      });
      log.warn('Reported print failure', { jobId, errorMessage });
   }
}
