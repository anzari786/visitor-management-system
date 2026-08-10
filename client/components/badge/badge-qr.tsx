'use client';

import { cn } from '@/lib/utils';

type BadgeQrProps = {
   value: string;
   className?: string;
   size?: number;
};

/** Deterministic QR-style visual from a badge token (no external QR dependency). */
export function BadgeQr({ value, className, size = 128 }: BadgeQrProps) {
   const cells = 21;
   const modules: boolean[][] = [];

   let hash = 0;
   for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
   }

   for (let y = 0; y < cells; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < cells; x++) {
         const inFinder =
            (x < 7 && y < 7) ||
            (x >= cells - 7 && y < 7) ||
            (x < 7 && y >= cells - 7);

         if (inFinder) {
            const fx = x < 7 ? x : x >= cells - 7 ? x - (cells - 7) : x;
            const fy = y < 7 ? y : y >= cells - 7 ? y - (cells - 7) : y;
            const onBorder = fx === 0 || fx === 6 || fy === 0 || fy === 6;
            const inCenter = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
            row.push(onBorder || inCenter);
            continue;
         }

         const bit = (hash ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
         row.push(bit % 3 !== 0);
      }
      modules.push(row);
   }

   const cellSize = size / cells;

   return (
      <div
         className={cn(
            'inline-flex rounded-lg border bg-white p-2 shadow-sm dark:bg-zinc-50',
            className,
         )}
      >
         <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`QR code for ${value}`}
         >
            <rect width={size} height={size} fill="white" />
            {modules.map((row, y) =>
               row.map((on, x) =>
                  on ? (
                     <rect
                        key={`${x}-${y}`}
                        x={x * cellSize}
                        y={y * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="#111"
                     />
                  ) : null,
               ),
            )}
         </svg>
      </div>
   );
}
