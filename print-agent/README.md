# VMS Print Agent

Local Node.js service that polls the VMS backend for queued visitor badge print jobs and sends ZPL to a Zebra thermal printer.

```
Next.js VMS → Express API → BadgePrintJob → Print Agent → Zebra → Printed Badge
```

The agent never performs check-in/out business logic. It only claims jobs, generates ZPL, prints, and reports results.

## Setup

```bash
cd print-agent
pnpm install
cp .env.example .env
# Edit .env — set VMS_API_URL, PRINT_AGENT_TOKEN, ZEBRA_PRINTER_HOST
pnpm dev
```

Health check: `http://127.0.0.1:5055/health`

## Configuration

| Variable | Description |
|----------|-------------|
| `VMS_API_URL` | Backend base including `/api/v1` |
| `PRINT_AGENT_TOKEN` | Shared secret (`PRINT_AGENT_TOKEN` on the API) |
| `PRINT_AGENT_ID` | Unique agent instance id for claim locking |
| `ZEBRA_PRINTER_HOST` | Printer IP / hostname |
| `ZEBRA_PRINTER_PORT` | Raw ZPL port (default `9100`) |
| `PRINTER_NAME` | Display name for diagnostics |
| `POLL_INTERVAL_MS` | Queue poll interval |
| `LABEL_WIDTH_IN` / `LABEL_HEIGHT_IN` / `LABEL_DPI` | Label geometry |

## Architecture

- `ZebraPrinter` — `BadgePrinter` adapter (TCP raw ZPL)
- `generateVisitorBadgeZpl` — reusable ZPL template (native `^BQ` QR)
- `PrintAgent` — poll / claim / print / report loop
