import { useEffect, useRef } from "react";
import { CALENDLY_URL } from "../config/calendly";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement; resize?: boolean }) => void;
    };
  }
}

function loadCalendlyScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Calendly) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Calendly script failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Calendly script failed to load")), { once: true });
    document.body.appendChild(script);
  });
}

export default function CalendlyEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadCalendlyScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.Calendly) return;
        window.Calendly.initInlineWidget({
          url: `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=ffffff&primary_color=7ab2fc`,
          parentElement: containerRef.current,
          resize: true,
        });
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden"
      style={{ width: "100%", maxWidth: "460px", minWidth: "280px", minHeight: "700px" }}
    />
  );
}
