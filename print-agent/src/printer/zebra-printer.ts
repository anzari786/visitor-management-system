import { createConnection } from 'node:net';
import type { BadgePrintData, BadgePrinter, LabelGeometry, PrinterHealth } from '../types.js';
import { generateVisitorBadgeZpl } from '../zpl/visitor-badge-template.js';
import { log } from '../logger.js';

export class PrinterError extends Error {
   constructor(
      message: string,
      public readonly code:
         | 'OFFLINE'
         | 'TIMEOUT'
         | 'SEND_FAILED'
         | 'INVALID_DATA' = 'SEND_FAILED',
   ) {
      super(message);
      this.name = 'PrinterError';
   }
}

export interface ZebraPrinterOptions {
   host: string;
   port: number;
   printerName: string;
   label: LabelGeometry;
   connectTimeoutMs?: number;
}

/**
 * Sends raw ZPL over TCP (typical Zebra network/USB print server port 9100).
 */
export class ZebraPrinter implements BadgePrinter {
   private readonly connectTimeoutMs: number;

   constructor(private readonly options: ZebraPrinterOptions) {
      this.connectTimeoutMs = options.connectTimeoutMs ?? 5_000;
   }

   async print(data: BadgePrintData): Promise<void> {
      if (!data.badgeToken?.trim() || !data.visitorName?.trim()) {
         throw new PrinterError(
            'Malformed badge print data',
            'INVALID_DATA',
         );
      }

      const zpl = generateVisitorBadgeZpl(data, this.options.label);
      await this.sendRaw(zpl);
      log.info('ZPL sent to printer', {
         jobId: data.jobId,
         printer: this.options.printerName,
      });
   }

   async healthCheck(): Promise<PrinterHealth> {
      try {
         await this.sendRaw('~HS');
         return {
            ok: true,
            printerName: this.options.printerName,
            message: 'Printer reachable',
         };
      } catch (error) {
         return {
            ok: false,
            printerName: this.options.printerName,
            message:
               error instanceof Error ? error.message : 'Printer unreachable',
         };
      }
   }

   /** Exposed for tests — sends already-generated ZPL. */
   async sendRaw(zpl: string): Promise<void> {
      const { host, port } = this.options;

      await new Promise<void>((resolve, reject) => {
         const socket = createConnection({ host, port });
         let settled = false;

         const finish = (err?: Error) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            if (err) reject(err);
            else resolve();
         };

         const timer = setTimeout(() => {
            finish(
               new PrinterError(
                  `Printer connection timed out (${host}:${port})`,
                  'TIMEOUT',
               ),
            );
         }, this.connectTimeoutMs);

         socket.on('connect', () => {
            socket.write(zpl, 'utf8', (writeErr) => {
               clearTimeout(timer);
               if (writeErr) {
                  finish(
                     new PrinterError(
                        `Failed to send ZPL: ${writeErr.message}`,
                        'SEND_FAILED',
                     ),
                  );
                  return;
               }
               // Give the printer a moment to accept the buffer, then close.
               socket.end(() => finish());
            });
         });

         socket.on('error', (err) => {
            clearTimeout(timer);
            finish(
               new PrinterError(
                  `Printer offline or unreachable (${host}:${port}): ${err.message}`,
                  'OFFLINE',
               ),
            );
         });
      });
   }
}
