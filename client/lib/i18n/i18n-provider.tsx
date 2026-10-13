'use client';

import * as React from 'react';
import {
   DEFAULT_LOCALE,
   LOCALE_COOKIE_MAX_AGE,
   LOCALE_COOKIE_NAME,
   LOCALE_META,
   LOCALE_STORAGE_KEY,
   normalizeLocale,
   type Locale,
} from './config';
import { dictionaries, type TranslationKey } from './dictionaries';

type TranslateVars = Record<string, string | number>;

type I18nContextValue = {
   locale: Locale;
   setLocale: (locale: Locale) => void;
   /** Translate a key; `{name}` placeholders are replaced from `vars`. */
   t: (key: TranslationKey, vars?: TranslateVars) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

/** Replaces `{placeholder}` tokens — keeps the token when no value is given. */
function interpolate(template: string, vars?: TranslateVars) {
   if (!vars) return template;

   return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
   );
}

function persistLocale(locale: Locale) {
   document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;

   try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
   } catch {
      // Private mode / storage disabled — the cookie is enough.
   }
}

export function I18nProvider({
   initialLocale = DEFAULT_LOCALE,
   children,
}: {
   initialLocale?: Locale;
   children: React.ReactNode;
}) {
   const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

   // Public pages can be served without the cookie having reached the server
   // yet; reconcile with localStorage once mounted.
   React.useEffect(() => {
      try {
         const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
         if (stored && normalizeLocale(stored) !== locale) {
            setLocaleState(normalizeLocale(stored));
         }
      } catch {
         // ignore
      }
      // Runs once on mount only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   React.useEffect(() => {
      document.documentElement.lang = locale;
   }, [locale]);

   const setLocale = React.useCallback((next: Locale) => {
      const normalized = normalizeLocale(next);
      setLocaleState(normalized);
      persistLocale(normalized);
   }, []);

   const value = React.useMemo<I18nContextValue>(() => {
      const dictionary = dictionaries[locale];
      const fallback = dictionaries[DEFAULT_LOCALE];

      return {
         locale,
         setLocale,
         t: (key, vars) =>
            interpolate(dictionary[key] ?? fallback[key] ?? key, vars),
      };
   }, [locale, setLocale]);

   return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * UI translation hook.
 *
 * Outside a provider it degrades to English instead of throwing, so isolated
 * components (storybook-style previews, error boundaries) still render.
 */
export function useTranslation() {
   const context = React.useContext(I18nContext);

   if (context) return context;

   return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey, vars?: TranslateVars) =>
         interpolate(dictionaries[DEFAULT_LOCALE][key] ?? key, vars),
   } satisfies I18nContextValue;
}

/** BCP-47 tag for `Intl` / `date-fns` style formatting. */
export function useLocaleTag() {
   const { locale } = useTranslation();
   return LOCALE_META[locale].intlTag;
}
