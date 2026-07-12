export type SiteLanguage = "en" | "es";

const STORAGE_KEY = "ht-lang";
const SCRIPT_ID = "google-translate-script";
const MOUNT_ID = "google_translate_element";

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
              layout?: number;
            },
            id: string,
          ): void;
          InlineLayout: {
            SIMPLE: number;
          };
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

function findTranslateSelect(): HTMLSelectElement | null {
  return document.querySelector<HTMLSelectElement>(".goog-te-combo");
}

export function applyGoogleTranslate(lang: SiteLanguage): boolean {
  const select = findTranslateSelect();
  if (!select) return false;

  const value = lang === "en" ? "" : lang;
  if (select.value !== value) {
    select.value = value;
    select.dispatchEvent(new Event("change"));
  }

  document.documentElement.lang = lang;
  return true;
}

export function loadGoogleTranslate(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve();
      return;
    }

    window.googleTranslateElementInit = () => {
      const InlineLayout = window.google?.translate?.TranslateElement?.InlineLayout;
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,es",
            autoDisplay: false,
            layout: InlineLayout?.SIMPLE,
          },
          MOUNT_ID,
        );
      }
      resolve();
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  });

  return loadPromise;
}

export async function switchSiteLanguage(lang: SiteLanguage): Promise<void> {
  setStoredLanguage(lang);
  await loadGoogleTranslate();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (applyGoogleTranslate(lang)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function restoreStoredLanguage(): Promise<void> {
  const lang = getStoredLanguage();
  if (lang === "en") return;
  await switchSiteLanguage(lang);
}
