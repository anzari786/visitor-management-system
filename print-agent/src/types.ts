export interface BadgePrintData {
   jobId: number;
   attendanceId: number;
   /** Opaque QR token — never visitor PII. */
   badgeToken: string;
   visitorName: string;
   organization?: string;
   visitCode: string;
   date: string;
   hostName?: string;
   floor?: string;
   room?: string;
   brandPrefix?: string;
}

export interface PrinterHealth {
   ok: boolean;
   printerName: string;
   message?: string;
}

export interface BadgePrinter {
   print(data: BadgePrintData): Promise<void>;
   healthCheck(): Promise<PrinterHealth>;
}

export interface LabelGeometry {
   widthIn: number;
   heightIn: number;
   dpi: number;
}

export interface AgentConfig {
   vmsApiUrl: string;
   printAgentToken: string;
   printAgentId: string;
   zebraPrinterHost: string;
   zebraPrinterPort: number;
   printerName: string;
   pollIntervalMs: number;
   healthPort: number;
   label: LabelGeometry;
   printerRetryCount: number;
   printerRetryDelayMs: number;
}
