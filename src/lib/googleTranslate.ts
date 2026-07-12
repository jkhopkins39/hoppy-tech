export type SiteLanguage = "en" | "es";

const STORAGE_KEY = "ht-lang";
const SCRIPT_ID = "google-translate-script";
const MOUNT_ID = "google_translate_element";
const COOKIE_EXPIRES = "Thu, 01 Jan 1970 00:00:00 UTC";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              autoDisplay: boolean;
            },
            id: string,
          ): void;
        };
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function getStoredLanguage(): SiteLanguage {
  return localStorage.getItem(STORAGE_KEY) === "es" ? "es" : "en";
}

export function setStoredLanguage(lang: SiteLanguage) {
  localStorage.setItem(STORAGE_KEY, lang);
}

export function getActiveLanguage(): SiteLanguage {
  const hasSpanishCookie = document.cookie
    .split(";")
    .some((part) => part.trim() === "googtrans=/en/es");
  return hasSpanishCookie ? "es" : getStoredLanguage();
}

function clearGoogTransCookies() {
  const base = "path=/";
  const expired = `expires=${COOKIE_EXPIRES}`;
  document.cookie = `googtrans=;${base};${expired}`;

  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1") return;

  document.cookie = `googtrans=;${base};domain=${host};${expired}`;
  const parts = host.split(".");
  if (parts.length >= 2) {
    document.cookie = `googtrans=;${base};domain=.${parts.slice(-2).join(".")};${expired}`;
  }
}

function setGoogTransCookie(lang: SiteLanguage) {
  if (lang === "en") {
    clearGoogTransCookies();
    window.location.hash = "";
    return;
  }

  document.cookie = `googtrans=/en/${lang};path=/`;
  window.location.hash = `#googtrans(en|${lang})`;
}

export function loadGoogleTranslate(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (window.google?.translate?.TranslateElement) {
      resolve();
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      const timer = window.setInterval(() => {
        if (window.google?.translate?.TranslateElement) {
          window.clearInterval(timer);
          resolve();
        }
      }, 50);
      return;
    }

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,es",
            autoDisplay: false,
          },
          MOUNT_ID,
        );
      }
      resolve();
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function switchSiteLanguage(lang: SiteLanguage): void {
  const current = getActiveLanguage();
  if (current === lang) return;

  setStoredLanguage(lang);
  setGoogTransCookie(lang);
  window.location.reload();
}

export function refreshTranslation(lang: SiteLanguage): void {
  if (lang !== "es") return;
  window.location.hash = "#googtrans(en|es)";
}
