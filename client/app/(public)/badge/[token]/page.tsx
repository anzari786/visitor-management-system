import type { Metadata } from 'next';

import { PublicBadgeContent } from '@/components/public-badge/public-badge-content';

export const metadata: Metadata = {
   title: 'Badge Information | ATI VMS',
   description:
      'Public visitor information for a scanned physical visitor badge QR code.',
};

type PublicBadgePageProps = {
   params: Promise<{ token: string }>;
};

export default function PublicBadgePage({ params }: PublicBadgePageProps) {
   return <PublicBadgeContent tokenPromise={params} />;
}
