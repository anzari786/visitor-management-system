/**
 * Locale configuration for the VMS UI.
 *
 * English is the source language; Amharic (አማርኛ) and Tigrinya (ትግርኛ) are the
 * two official working languages requested for the reception/front-desk UI.
 */

export const LOCALES = ['en', 'am', 'ti'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie is read on the server so the first paint already has the right language. */
export const LOCALE_COOKIE_NAME = 'vms.locale';
/** Mirrored to localStorage so a locale survives a cookie-less preview. */
export const LOCALE_STORAGE_KEY = 'vms.locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type LocaleMeta = {
   /** Endonym — shown in the language switcher. */
   label: string;
   /** English name, shown as a secondary label. */
   englishLabel: string;
   /** BCP-47 tag used for Intl date/number formatting. */
   intlTag: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
   en: { label: 'English', englishLabel: 'English', intlTag: 'en-GB' },
   am: { label: 'አማርኛ', englishLabel: 'Amharic', intlTag: 'am-ET' },
   ti: { label: 'ትግርኛ', englishLabel: 'Tigrinya', intlTag: 'ti-ET' },
};

export function isLocale(value: unknown): value is Locale {
   return (
      typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
   );
}

/** Falls back to English for anything unknown (bad cookie, old value, etc.). */
export function normalizeLocale(value: unknown): Locale {
   return isLocale(value) ? value : DEFAULT_LOCALE;
}
