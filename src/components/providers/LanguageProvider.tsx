"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Language } from '@/lib/types';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/lib/constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("English");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY) as Language | null;
    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, newLanguage);
  }, []);

  if (!mounted) {
     // Avoid rendering children until language is determined
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
