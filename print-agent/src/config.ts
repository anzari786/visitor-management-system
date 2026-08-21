import type { AgentConfig } from './types.js';

function required(name: string): string {
   const value = process.env[name]?.trim();
   if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
   }
   return value;
}

function optionalNumber(name: string, fallback: number): number {
   const raw = process.env[name];
   if (raw === undefined || raw === '') return fallback;
   const n = Number(raw);
   if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid number for ${name}: ${raw}`);
   }
   return n;
}

export function loadConfig(): AgentConfig {
   return {
      vmsApiUrl: required('VMS_API_URL').replace(/\/$/, ''),
      printAgentToken: required('PRINT_AGENT_TOKEN'),
      printAgentId: process.env.PRINT_AGENT_ID?.trim() || 'print-agent-1',
      zebraPrinterHost: required('ZEBRA_PRINTER_HOST'),
      zebraPrinterPort: optionalNumber('ZEBRA_PRINTER_PORT', 9100),
      printerName: process.env.PRINTER_NAME?.trim() || 'Zebra',
      pollIntervalMs: optionalNumber('POLL_INTERVAL_MS', 2000),
      healthPort: optionalNumber('HEALTH_PORT', 5055),
      label: {
         widthIn: optionalNumber('LABEL_WIDTH_IN', 3),
         heightIn: optionalNumber('LABEL_HEIGHT_IN', 2),
         dpi: optionalNumber('LABEL_DPI', 203),
      },
      printerRetryCount: optionalNumber('PRINTER_RETRY_COUNT', 2),
      printerRetryDelayMs: optionalNumber('PRINTER_RETRY_DELAY_MS', 1500),
   };
}
