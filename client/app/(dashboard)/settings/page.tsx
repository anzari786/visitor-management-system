'use client';

import { useSettingsDialogStore } from '@/store/settings-dialog-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Settings is a dialog; open it and return to the dashboard. */
export default function SettingsPage() {
   const router = useRouter();
   const setOpen = useSettingsDialogStore((s) => s.setOpen);

   useEffect(() => {
      setOpen(true);
      router.replace('/dashboard');
   }, [router, setOpen]);

   return null;
}
