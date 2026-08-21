import type { BadgePrinter } from './types.js';
import type { AgentConfig } from './types.js';
import { VmsApiClient } from './vms-api-client.js';
import { log } from './logger.js';
import { PrinterError } from './printer/zebra-printer.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Polls the VMS for queued badge print jobs and drives the BadgePrinter.
 * Contains no visit/check-in business logic.
 */
export class PrintAgent {
   private timer: NodeJS.Timeout | null = null;
   private running = false;
   private busy = false;
   private lastError: string | null = null;
   private processedCount = 0;
   private readonly api: VmsApiClient;
   /** Jobs successfully reported PRINTED this process lifetime (dedupe guard). */
   private readonly completedJobIds = new Set<number>();

   constructor(
      private readonly config: AgentConfig,
      private readonly printer: BadgePrinter,
   ) {
      this.api = new VmsApiClient(
         config.vmsApiUrl,
         config.printAgentToken,
         config.printAgentId,
      );
   }

   start() {
      if (this.running) return;
      this.running = true;
      log.info('Print agent started', {
         agentId: this.config.printAgentId,
         pollIntervalMs: this.config.pollIntervalMs,
         printer: this.config.printerName,
      });
      void this.tick();
      this.timer = setInterval(() => void this.tick(), this.config.pollIntervalMs);
   }

   stop() {
      this.running = false;
      if (this.timer) {
         clearInterval(this.timer);
         this.timer = null;
      }
      log.info('Print agent stopped');
   }

   getStatus() {
      return {
         running: this.running,
         busy: this.busy,
         agentId: this.config.printAgentId,
         printerName: this.config.printerName,
         processedCount: this.processedCount,
         lastError: this.lastError,
      };
   }

   private async tick() {
      if (!this.running || this.busy) return;
      this.busy = true;
      try {
         const payload = await this.api.claimNextJob();
         if (!payload) return;

         const jobId = Number(payload.job.id);
         if (this.completedJobIds.has(jobId)) {
            log.warn('Skipping already-completed job in this session', {
               jobId,
            });
            return;
         }

         await this.processJob(jobId, payload.printData);
      } catch (error) {
         this.lastError =
            error instanceof Error ? error.message : 'Unknown poll error';
         log.error('Print agent poll failed', { error: this.lastError });
      } finally {
         this.busy = false;
      }
   }

   private async processJob(
      jobId: number,
      printData: Parameters<BadgePrinter['print']>[0],
   ) {
      log.info('Processing print job', { jobId });

      try {
         await this.api.markPrinting(jobId);
      } catch (error) {
         log.warn('markPrinting failed (continuing)', {
            jobId,
            error: error instanceof Error ? error.message : String(error),
         });
      }

      try {
         await this.printWithRetries(printData);
         await this.api.complete(jobId);
         this.completedJobIds.add(jobId);
         this.processedCount += 1;
         this.lastError = null;
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Print failed';
         this.lastError = message;
         try {
            await this.api.fail(jobId, message);
         } catch (reportError) {
            log.error('Failed to report print failure', {
               jobId,
               error:
                  reportError instanceof Error
                     ? reportError.message
                     : String(reportError),
            });
         }
      }
   }

   private async printWithRetries(
      data: Parameters<BadgePrinter['print']>[0],
   ) {
      let attempt = 0;
      let lastError: unknown;

      while (attempt <= this.config.printerRetryCount) {
         try {
            await this.printer.print(data);
            return;
         } catch (error) {
            lastError = error;
            const retryable =
               error instanceof PrinterError &&
               (error.code === 'OFFLINE' ||
                  error.code === 'TIMEOUT' ||
                  error.code === 'SEND_FAILED');

            if (!retryable || attempt >= this.config.printerRetryCount) {
               throw error;
            }

            log.warn('Transient printer failure — retrying', {
               attempt: attempt + 1,
               error: error.message,
            });
            await sleep(this.config.printerRetryDelayMs);
            attempt += 1;
         }
      }

      throw lastError instanceof Error
         ? lastError
         : new Error('Print failed after retries');
   }
}
