import type { BadgePrinter } from './types.js';
import type { AgentConfig } from './types.js';
import { VmsApiClient } from './vms-api-client.js';
import { log } from './logger.js';
import { PrinterError } from './printer/zebra-printer.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Long-polls the VMS for queued badge print jobs and drives the BadgePrinter.
 * Contains no visit/check-in business logic.
 */
export class PrintAgent {
   private abortController: AbortController | null = null;
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
      this.abortController = new AbortController();
      log.info('Print agent started', {
         agentId: this.config.printAgentId,
         longPollTimeoutMs: this.config.longPollTimeoutMs,
         printer: this.config.printerName,
      });
      void this.loop();
   }

   stop() {
      if (!this.running) return;
      this.running = false;
      this.abortController?.abort();
      this.abortController = null;
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

   /**
    * Self-scheduling long-poll loop. Each iteration holds a request open on
    * the server for up to `longPollTimeoutMs`, returning immediately when a
    * job is available. On empty (204) it loops straight back into the next
    * long poll. On error it backs off briefly before retrying.
    */
   private async loop() {
      while (this.running) {
         this.busy = true;
         try {
            const payload = await this.api.claimNextJob(
               this.config.longPollTimeoutMs,
               this.abortController?.signal,
            );

            if (!payload) {
               // No job within the wait window — immediately re-poll.
               continue;
            }

            const jobId = Number(payload.job.id);
            if (this.completedJobIds.has(jobId)) {
               log.warn('Skipping already-completed job in this session', {
                  jobId,
               });
               continue;
            }

            await this.processJob(jobId, payload.printData);
         } catch (error) {
            if (!this.running) break; // aborted by stop(), not a real failure

            this.lastError =
               error instanceof Error ? error.message : 'Unknown poll error';
            log.error('Print agent poll failed', { error: this.lastError });
            await sleep(this.config.pollErrorDelayMs);
         } finally {
            this.busy = false;
         }
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

   private async printWithRetries(data: Parameters<BadgePrinter['print']>[0]) {
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
