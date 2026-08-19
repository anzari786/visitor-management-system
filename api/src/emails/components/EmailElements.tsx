import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import {
   emailBrand,
   statusBadgeStyles,
   type VisitEmailStatus,
} from '../brand.js';

export function EmailHeading({ children }: { children: React.ReactNode }) {
   return <Text style={styles.heading}>{children}</Text>;
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
   return <Text style={styles.paragraph}>{children}</Text>;
}

export function StatusBadge({ status }: { status: VisitEmailStatus }) {
   const badge = statusBadgeStyles[status];

   return (
      <Section style={styles.badgeWrap}>
         <Text
            style={{
               ...styles.badge,
               backgroundColor: badge.background,
               color: badge.color,
            }}
         >
            {badge.label}
         </Text>
      </Section>
   );
}

export function PrimaryButton({
   href,
   children,
}: {
   href: string;
   children: string;
}) {
   return (
      <Section style={styles.buttonWrap}>
         <Button href={href} style={styles.button}>
            {children}
         </Button>
      </Section>
   );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
   if (!value) return null;

   return (
      <Section style={styles.infoRow}>
         <Text style={styles.infoLabel}>{label}</Text>
         <Text style={styles.infoValue}>{value}</Text>
      </Section>
   );
}

export function VisitorList({
   visitors,
}: {
   visitors: Array<{ name: string; email?: string | null }>;
}) {
   if (!visitors.length) return null;

   return (
      <Section style={styles.listBlock}>
         <Text style={styles.infoLabel}>Visitor{visitors.length > 1 ? 's' : ''}</Text>
         {visitors.map((visitor) => (
            <Text key={`${visitor.name}-${visitor.email ?? ''}`} style={styles.listItem}>
               {visitor.name}
               {visitor.email ? ` · ${visitor.email}` : ''}
            </Text>
         ))}
      </Section>
   );
}

const styles = {
   heading: {
      color: emailBrand.text,
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px',
      textAlign: 'center' as const,
      margin: '0 0 12px',
   },
   paragraph: {
      color: emailBrand.muted,
      fontSize: '15px',
      lineHeight: '24px',
      textAlign: 'center' as const,
      margin: '0 0 16px',
   },
   badgeWrap: {
      textAlign: 'center' as const,
      margin: '0 0 20px',
   },
   badge: {
      display: 'inline-block',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      padding: '6px 14px',
      margin: 0,
      textTransform: 'uppercase' as const,
   },
   buttonWrap: {
      textAlign: 'center' as const,
      margin: '24px 0 8px',
   },
   button: {
      backgroundColor: emailBrand.primary,
      borderRadius: '8px',
      color: '#FFFFFF',
      display: 'inline-block',
      fontSize: '14px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      padding: '14px 28px',
      textDecoration: 'none',
      textTransform: 'uppercase' as const,
   },
   infoRow: {
      borderTop: `1px solid ${emailBrand.border}`,
      padding: '12px 0 0',
      margin: '0 0 8px',
   },
   infoLabel: {
      color: emailBrand.muted,
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      margin: '0 0 4px',
      textTransform: 'uppercase' as const,
   },
   infoValue: {
      color: emailBrand.text,
      fontSize: '15px',
      fontWeight: 600,
      margin: 0,
      lineHeight: '22px',
   },
   listBlock: {
      borderTop: `1px solid ${emailBrand.border}`,
      padding: '12px 0 0',
      margin: '0 0 8px',
   },
   listItem: {
      color: emailBrand.text,
      fontSize: '14px',
      margin: '0 0 4px',
      lineHeight: '20px',
   },
} as const;
