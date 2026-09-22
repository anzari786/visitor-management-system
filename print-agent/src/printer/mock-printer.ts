import type {
   BadgePrintData,
   BadgePrinter,
   LabelGeometry,
   PrinterHealth,
} from '../types.js';
import { log } from '../logger.js';
import { generateVisitorBadgeZpl } from '../zpl/visitor-badge-template.js';
import { PrinterError } from './zebra-printer.js';

export interface MockPrinterOptions {
   printerName: string;
   label: LabelGeometry;
}

/** Development printer that generates and logs the same ZPL as ZebraPrinter. */
export class MockPrinter implements BadgePrinter {
   constructor(private readonly options: MockPrinterOptions) {}

   async print(data: BadgePrintData): Promise<void> {
      if (!data.badgeToken?.trim() || !data.visitorName?.trim()) {
         throw new PrinterError('Malformed badge print data', 'INVALID_DATA');
      }

      const zpl = generateVisitorBadgeZpl(data, this.options.label);
      log.info('Mock printer generated badge', {
         jobId: data.jobId,
         printer: this.options.printerName,
      });
      console.log(
         [
            '========================================',
            'MOCK PRINTER',
            '========================================',
            `Job ID: ${data.jobId}`,
            `Visitor: ${data.visitorName}`,
            `Printer: ${this.options.printerName}`,
            '----------------------------------------',
            zpl,
            '========================================',
         ].join('\n'),
      );
   }

   async healthCheck(): Promise<PrinterHealth> {
      return {
         ok: true,
         printerName: this.options.printerName,
         message: 'Mock printer ready',
      };
   }
}