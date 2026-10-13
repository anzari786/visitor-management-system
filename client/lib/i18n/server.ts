import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, normalizeLocale, type Locale } from './config';

/**
 * Reads the persisted locale on the server so `<html lang>` and the first
 * render already match the user's choice (no flash of English).
 */
export async function getServerLocale(): Promise<Locale> {
   const cookieStore = await cookies();
   return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}
