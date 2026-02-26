import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './en';
import { de } from './de';
import { fr } from './fr';

type Language = 'en' | 'de' | 'fr';
const LANG_CYCLE: Language[] = ['en', 'de', 'fr'];
export const nextLanguage = (current: Language): Language => LANG_CYCLE[(LANG_CYCLE.indexOf(current) + 1) % LANG_CYCLE.length];
export const langLabel = (lang: Language): string => lang.toUpperCase();
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, de, fr };

function getNestedRaw(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function getNestedValue(obj: any, path: string): string {
  const val = getNestedRaw(obj, path);
  return typeof val === 'string' ? val : path;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored === 'de' || stored === 'en' || stored === 'fr') ? stored : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
  };

  const tArray = (key: string): string[] => {
    const val = getNestedRaw(translations[language], key);
    return Array.isArray(val) ? val : [];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
