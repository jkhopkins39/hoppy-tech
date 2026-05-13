import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const AW_ID = "AW-17931725659";

/**
 * Sends a gtag config on each client-side route change. The base snippet in
 * index.html handles the initial load; this covers SPA "pages" after that.
 */
export default function GtagPageView() {
  const location = useLocation();
  const lastHandledPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const pagePath = location.pathname + location.search;

    if (lastHandledPath.current === null) {
      lastHandledPath.current = pagePath;
      return;
    }

    if (lastHandledPath.current === pagePath) return;

    lastHandledPath.current = pagePath;
    window.gtag("config", AW_ID, { page_path: pagePath });
  }, [location.pathname, location.search]);

  return null;
}
