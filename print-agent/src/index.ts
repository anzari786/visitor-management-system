import { loadConfig } from './config.js';
import { ZebraPrinter } from './printer/zebra-printer.js';
import { MockPrinter } from './printer/mock-printer.js';
import { PrintAgent } from './agent.js';
import { startHealthServer } from './health-server.js';
import { log } from './logger.js';

async function main() {
   const config = loadConfig();
   const printer =
      config.printerMode === 'mock'
         ? new MockPrinter({
              printerName: config.printerName,
              label: config.label,
           })
         : new ZebraPrinter({
              host: config.zebraPrinterHost,
              port: config.zebraPrinterPort,
              printerName: config.printerName,
              label: config.label,
           });

   log.info(`Printer mode: ${config.printerMode}`);
   log.info(
      config.printerMode === 'mock' ? 'Using MockPrinter' : 'Using ZebraPrinter',
   );

   const agent = new PrintAgent(config, printer);
   startHealthServer(config.healthPort, agent, printer);
   agent.start();

   const shutdown = () => {
      log.info('Shutting down print agent');
      agent.stop();
      process.exit(0);
   };

   process.on('SIGINT', shutdown);
   process.on('SIGTERM', shutdown);
}

main().catch((error) => {
   log.error('Fatal print agent error', {
      error: error instanceof Error ? error.message : String(error),
   });
   process.exit(1);
});
