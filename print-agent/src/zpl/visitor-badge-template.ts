import type { BadgePrintData, LabelGeometry } from '../types.js';

/**
 * Sanitize dynamic text for safe inclusion in ZPL Field Data (^FD...^FS).
 * Strips control characters and ZPL delimiters that would break the template.
 */
export function sanitizeZplField(value: string, maxLength = 40): string {
   return value
      .normalize('NFKC')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[\^~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
}

const dots = (inches: number, dpi: number) => Math.round(inches * dpi);

/**
 * Professional visitor badge layout using native ZPL QR (^BQ).
 * Dimensions come from LabelGeometry — nothing is hard-coded elsewhere.
 */
export function generateVisitorBadgeZpl(
   data: BadgePrintData,
   geometry: LabelGeometry,
): string {
   const w = dots(geometry.widthIn, geometry.dpi);
   const h = dots(geometry.heightIn, geometry.dpi);

   const brand = sanitizeZplField(
      data.brandPrefix ? `${data.brandPrefix} VMS` : 'ATI VMS',
      24,
   );
   const visitorName = sanitizeZplField(data.visitorName, 36);
   const organization = data.organization
      ? sanitizeZplField(data.organization, 36)
      : '';
   const visitCode = sanitizeZplField(data.visitCode, 24);
   const date = sanitizeZplField(data.date, 16);
   const hostName = data.hostName ? sanitizeZplField(data.hostName, 28) : '';
   const location = [data.floor, data.room]
      .filter(Boolean)
      .map((part) => sanitizeZplField(String(part), 12))
      .join(' / ');
   const qrPayload = sanitizeZplField(data.badgeToken, 64);

   const lines: string[] = [
      '^XA',
      `^PW${w}`,
      `^LL${h}`,
      '^LH0,0',
      '^CI28',
      // Brand
      '^FO24,24^A0N,28,28',
      `^FD${brand}^FS`,
      // VISITOR label
      '^FO24,60^A0N,40,40',
      '^FDVISITOR^FS',
      // Visitor name
      '^FO24,118^A0N,32,32',
      `^FD${visitorName}^FS`,
   ];

   let y = 158;
   if (organization) {
      lines.push('^FO24,' + y + '^A0N,24,24');
      lines.push(`^FD${organization}^FS`);
      y += 32;
   }

   lines.push(`^FO24,${y}^A0N,22,22`);
   lines.push(`^FDVisit: ${visitCode}^FS`);
   y += 28;

   lines.push(`^FO24,${y}^A0N,22,22`);
   lines.push(`^FDDate: ${date}^FS`);
   y += 28;

   if (hostName) {
      lines.push(`^FO24,${y}^A0N,20,20`);
      lines.push(`^FDHost: ${hostName}^FS`);
      y += 26;
   }

   if (location) {
      lines.push(`^FO24,${y}^A0N,20,20`);
      lines.push(`^FDLoc: ${location}^FS`);
   }

   // QR on the right — encodes opaque badgeToken only
   const qrX = Math.max(24, w - 180);
   lines.push(`^FO${qrX},70^BQN,2,4`);
   lines.push(`^FDQA,${qrPayload}^FS`);

   lines.push('^XZ');
   return lines.join('\n');
}
