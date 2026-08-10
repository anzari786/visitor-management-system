import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { emailBrand } from '../brand.js';
import { InfoRow, VisitorList } from './EmailElements.js';

export interface VisitEmailDetails {
   visitCode: string;
   purpose?: string | null;
   hostName?: string | null;
   departmentName?: string | null;
   startDate?: string | null;
   endDate?: string | null;
   startTime?: string | null;
   endTime?: string | null;
   floor?: string | null;
   room?: string | null;
   visitors?: Array<{ name: string; email?: string | null }>;
   note?: string | null;
}

function formatSchedule(details: VisitEmailDetails): string {
   const datePart =
      details.startDate && details.endDate && details.startDate !== details.endDate
         ? `${details.startDate} → ${details.endDate}`
         : (details.startDate ?? details.endDate ?? '');

   const timePart =
      details.startTime && details.endTime
         ? `${details.startTime} – ${details.endTime}`
         : (details.startTime ?? details.endTime ?? '');

   if (datePart && timePart) return `${datePart} · ${timePart}`;
   return datePart || timePart || '';
}

function formatLocation(details: VisitEmailDetails): string {
   if (details.floor && details.room) {
      return `${details.floor}, ${details.room}`;
   }
   return details.floor ?? details.room ?? '';
}

/** Shared visit facts block used across status emails. */
export function VisitDetailsCard({ details }: { details: VisitEmailDetails }) {
   return (
      <Section style={styles.panel}>
         <Text style={styles.codeLabel}>Visit code</Text>
         <Text style={styles.codeValue}>{details.visitCode}</Text>

         <VisitorList visitors={details.visitors ?? []} />
         <InfoRow label="Host" value={details.hostName ?? ''} />
         <InfoRow label="Department" value={details.departmentName ?? ''} />
         <InfoRow label="Purpose" value={details.purpose ?? ''} />
         <InfoRow label="Schedule" value={formatSchedule(details)} />
         <InfoRow label="Location" value={formatLocation(details)} />
         <InfoRow label="Note" value={details.note ?? ''} />
      </Section>
   );
}

const styles = {
   panel: {
      backgroundColor: '#F9FAFB',
      borderRadius: '10px',
      border: `1px solid ${emailBrand.border}`,
      padding: '18px 16px',
      margin: '8px 0 4px',
   },
   codeLabel: {
      color: emailBrand.muted,
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      margin: '0 0 4px',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
   },
   codeValue: {
      color: emailBrand.primaryDark,
      fontSize: '20px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      margin: '0 0 16px',
      textAlign: 'center' as const,
   },
} as const;
