/**
 * Client-side i18n entry point:
 *
 *    const { t, locale, setLocale } = useTranslation();
 *    <h1>{t('nav.dashboard')}</h1>
 *    <p>{t('visits.moreVisitors', { count: 3 })}</p>
 *
 * `getServerLocale` lives in `./server` because it reads `next/headers`.
 */
export {
   DEFAULT_LOCALE,
   LOCALES,
   LOCALE_COOKIE_NAME,
   LOCALE_META,
   isLocale,
   normalizeLocale,
   type Locale,
} from './config';
export { I18nProvider, useLocaleTag, useTranslation } from './i18n-provider';
export type { Dictionary, TranslationKey } from './dictionaries';
export {
   ATTENDANCE_STATUS_KEYS,
   ID_TYPE_KEYS,
   MANAGED_VISIT_STATUS_KEYS,
   MEETING_TYPE_KEYS,
   USER_ROLE_KEYS,
   VISIT_PURPOSE_KEYS,
   VISIT_TYPE_KEYS,
   getVisitorAttendanceLabelKey,
} from './labels';
