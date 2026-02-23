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
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, de, fr };

function getNestedValue(obj: any, path: string): string {
  const val = path.split('.').reduce((acc, part) => acc?.[part], obj);
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
