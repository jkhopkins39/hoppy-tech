import { useLanguage } from "../context/LanguageContext";
import type { SiteLanguage } from "../lib/googleTranslate";

const OPTIONS: { value: SiteLanguage; label: string; title: string }[] = [
  { value: "en", label: "EN", title: "English" },
  { value: "es", label: "ES", title: "Español" },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="notranslate flex items-center rounded-lg border p-0.5"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-alpha)",
      }}
      role="group"
      aria-label="Site language"
    >
      {OPTIONS.map((option) => {
        const active = language === option.value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
            className="min-w-[2.25rem] rounded-md px-2 py-1.5 text-[12px] font-semibold tracking-wide transition-all duration-200"
            style={{
              backgroundColor: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-foreground)" : "var(--muted)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
