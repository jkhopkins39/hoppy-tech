import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'crackMode';
const SECRET_WORD = 'crack';
const LOGO_CLICKS_REQUIRED = 7;
const LOGO_CLICK_WINDOW_MS = 3000;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface CrackModeContextType {
  isCrackMode: boolean;
  enableCrackMode: () => void;
  disableCrackMode: () => void;
  registerLogoClick: () => void;
}

export const CrackModeContext = createContext<CrackModeContextType>({
  isCrackMode: false,
  enableCrackMode: () => {},
  disableCrackMode: () => {},
  registerLogoClick: () => {},
});

export const CrackModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCrackMode, setIsCrackMode] = useState<boolean>(() => {
    if (prefersReducedMotion()) return false;
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });

  const typedRef = useRef('');
  const logoClicksRef = useRef<number[]>([]);

  const enableCrackMode = useCallback(() => {
    if (prefersReducedMotion()) return;
    setIsCrackMode(true);
  }, []);

  const disableCrackMode = useCallback(() => {
    setIsCrackMode(false);
  }, []);

  const registerLogoClick = useCallback(() => {
    if (prefersReducedMotion() || isCrackMode) return;

    const now = Date.now();
    logoClicksRef.current = logoClicksRef.current.filter(t => now - t < LOGO_CLICK_WINDOW_MS);
    logoClicksRef.current.push(now);

    if (logoClicksRef.current.length >= LOGO_CLICKS_REQUIRED) {
      logoClicksRef.current = [];
      enableCrackMode();
    }
  }, [enableCrackMode, isCrackMode]);

  useEffect(() => {
    if (isCrackMode) {
      document.documentElement.setAttribute('data-crack-mode', 'true');
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      document.documentElement.removeAttribute('data-crack-mode');
      sessionStorage.setItem(STORAGE_KEY, 'false');
    }
  }, [isCrackMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (prefersReducedMotion() || isCrackMode) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      typedRef.current = (typedRef.current + e.key.toLowerCase()).slice(-SECRET_WORD.length);
      if (typedRef.current === SECRET_WORD) {
        typedRef.current = '';
        enableCrackMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enableCrackMode, isCrackMode]);

  return (
    <CrackModeContext.Provider value={{ isCrackMode, enableCrackMode, disableCrackMode, registerLogoClick }}>
      {children}
    </CrackModeContext.Provider>
  );
};

export const useCrackMode = () => useContext(CrackModeContext);
