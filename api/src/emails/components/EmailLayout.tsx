import {
   Body,
   Container,
   Head,
   Html,
   Img,
   Link,
   Preview,
   Section,
   Text,
   Hr,
} from '@react-email/components';
import * as React from 'react';
import { emailBrand } from '../brand.js';

export interface EmailLayoutProps {
   preview: string;
   children: React.ReactNode;
}

/**
 * Shared shell for all VMS transactional emails.
 * Inspired by clean, centered invitation layouts (logo → content → CTA → footer).
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
   return (
      <Html>
         <Head />
         <Preview>{preview}</Preview>
         <Body style={styles.body}>
            <Container style={styles.container}>
               <Section style={styles.header}>
                  <Text style={styles.logoMark}>{emailBrand.shortName}</Text>
                  <Text style={styles.logoSub}>{emailBrand.orgName}</Text>
               </Section>

               <Section style={styles.card}>{children}</Section>

               <Section style={styles.footer}>
                  <Hr style={styles.hr} />
                  <Text style={styles.footerText}>
                     This is an automated message from {emailBrand.productName}.
                     Please do not reply directly to this email.
                  </Text>
                  <Text style={styles.footerText}>
                     Need help? Contact reception or your visit host.
                  </Text>
                  <Text style={styles.footerMuted}>{emailBrand.orgName}</Text>
               </Section>
            </Container>
         </Body>
      </Html>
   );
}

/** Optional wordmark image when SMTP/assets host a logo URL. */
export function BrandLogo({ src }: { src?: string }) {
   if (!src) {
      return <Text style={styles.logoMark}>{emailBrand.shortName}</Text>;
   }

   return (
      <Img
         src={src}
         width="140"
         alt={emailBrand.shortName}
         style={{ display: 'block', margin: '0 auto 8px' }}
      />
   );
}

export function FooterLink({ href, children }: { href: string; children: string }) {
   return (
      <Link href={href} style={styles.link}>
         {children}
      </Link>
   );
}

const styles = {
   body: {
      backgroundColor: emailBrand.background,
      fontFamily:
         '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      margin: 0,
      padding: '24px 12px',
   },
   container: {
      maxWidth: '560px',
      margin: '0 auto',
   },
   header: {
      textAlign: 'center' as const,
      padding: '8px 0 20px',
   },
   logoMark: {
      color: emailBrand.primary,
      fontSize: '22px',
      fontWeight: 700,
      letterSpacing: '0.02em',
      margin: '0 0 4px',
   },
   logoSub: {
      color: emailBrand.muted,
      fontSize: '12px',
      margin: 0,
   },
   card: {
      backgroundColor: emailBrand.card,
      borderRadius: '12px',
      padding: '32px 28px',
      border: `1px solid ${emailBrand.border}`,
   },
   footer: {
      padding: '20px 8px 0',
      textAlign: 'center' as const,
   },
   hr: {
      borderColor: emailBrand.border,
      margin: '0 0 16px',
   },
   footerText: {
      color: emailBrand.muted,
      fontSize: '12px',
      lineHeight: '18px',
      margin: '0 0 6px',
   },
   footerMuted: {
      color: '#9CA3AF',
      fontSize: '11px',
      margin: '12px 0 0',
   },
   link: {
      color: emailBrand.primary,
      textDecoration: 'none',
   },
} as const;
