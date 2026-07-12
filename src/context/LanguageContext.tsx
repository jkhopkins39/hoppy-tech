import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  applyGoogleTranslate,
  getStoredLanguage,
  loadGoogleTranslate,
  restoreStoredLanguage,
  switchSiteLanguage,
  type SiteLanguage,
} from "../lib/googleTranslate";

interface LanguageContextValue {
  language: SiteLanguage;
  setLanguage: (lang: SiteLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [language, setLanguageState] = useState<SiteLanguage>(() => getStoredLanguage());

  useEffect(() => {
    loadGoogleTranslate().then(() => restoreStoredLanguage());
  }, []);

  useEffect(() => {
    if (language !== "es") return;

    const timer = window.setTimeout(() => {
      applyGoogleTranslate("es");
    }, 350);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, language]);

  const setLanguage = useCallback(async (lang: SiteLanguage) => {
    setLanguageState(lang);
    await switchSiteLanguage(lang);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
