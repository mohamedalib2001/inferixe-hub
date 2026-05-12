import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Language, translations } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("inferixe-language");
      return (saved as Language) || "en";
    }
    return "en";
  });

  const isRTL = language === "ar";

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("inferixe-language", lang);
  };

  const t = useCallback((key: keyof typeof translations.en): string => {
    return translations[language][key] || key;
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
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
