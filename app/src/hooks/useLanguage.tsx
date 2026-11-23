import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, type Strings } from '@/i18n/en';
import { fr } from '@/i18n/fr';

export type Language = 'en' | 'fr';

/** The languages offered in Settings, each written in its own language. */
export const LANGUAGES: readonly { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const STRINGS: Record<Language, Strings> = { en, fr };

/** Locale used to format dates and times (toLocaleDateString...). */
const LOCALES: Record<Language, string> = { en: 'en-GB', fr: 'fr-FR' };

const STORAGE_KEY = 'language';

/** The phone's language if it is one of ours, English otherwise. */
function deviceLanguage(): Language {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
  return locale.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export type UseLanguageResult = {
  language: Language;
  /** The texts of the current language, e.g. t.settings.title. */
  t: Strings;
  /** Locale to format dates, e.g. date.toLocaleDateString(locale, ...). */
  locale: string;
  /** Changes the language of the whole app and remembers it on this phone. */
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<UseLanguageResult | undefined>(undefined);

/**
 * Holds the app language. Starts with the phone's language, then the one chosen in Settings
 * (saved on the phone, so it also applies to the login screen). Placed at the top of the root
 * _layout.tsx.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(deviceLanguage);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'fr') setLanguageState(saved);
      })
      .catch(() => {}); // keep the phone's language
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {}); // still applied for this session
  };

  return (
    <LanguageContext.Provider
      value={{ language, t: STRINGS[language], locale: LOCALES[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Reads the current language and its texts. Must be used inside <LanguageProvider>.
 *
 * @throws If called outside of <LanguageProvider>.
 */
export function useLanguage(): UseLanguageResult {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  }
  return context;
}
