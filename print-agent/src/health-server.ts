import { createServer } from 'node:http';
import type { BadgePrinter } from './types.js';
import type { PrintAgent } from './agent.js';
import { log } from './logger.js';

/**
 * Localhost-only diagnostics for reception desk operators.
 */
export function startHealthServer(
   port: number,
   agent: PrintAgent,
   printer: BadgePrinter,
) {
   const server = createServer(async (req, res) => {
      if (req.url === '/health' || req.url === '/') {
         const printerHealth = await printer.healthCheck().catch((error) => ({
            ok: false,
            printerName: 'unknown',
            message: error instanceof Error ? error.message : 'Health check failed',
         }));

         const body = JSON.stringify({
            status: 'ok',
            agent: agent.getStatus(),
            printer: printerHealth,
         });

         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(body);
         return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'not_found' }));
   });

   server.listen(port, '127.0.0.1', () => {
      log.info('Health endpoint listening', { url: `http://127.0.0.1:${port}/health` });
   });

   return server;
}
