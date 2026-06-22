import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { en, type I18nKey } from './en';
import { pt } from './pt';

export type Locale = 'en' | 'pt';
const DICTS = { en, pt };
const STORAGE_KEY = 'chess.locale';

type TFn = (key: I18nKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: TFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR + first client render are ALWAYS English to avoid hydration mismatch;
  // the saved preference is applied in an effect after hydration.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  };

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[locale];
    const t: TFn = (key, params) => {
      let str: string = dict[key] ?? en[key] ?? String(key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    };
    return {
      locale,
      setLocale,
      toggle: () => setLocale(locale === 'en' ? 'pt' : 'en'),
      t
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
