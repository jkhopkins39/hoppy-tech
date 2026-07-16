import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const AW_ID = "AW-17931725659";

/**
 * Sends Ads + Meta page hits on each client-side route change. The base
 * snippets in index.html handle the initial load; this covers SPA "pages"
 * after that.
 */
export default function GtagPageView() {
  const location = useLocation();
  const lastHandledPath = useRef<string | null>(null);

  useEffect(() => {
    const pagePath = location.pathname + location.search;

    if (lastHandledPath.current === null) {
      lastHandledPath.current = pagePath;
      return;
    }

    if (lastHandledPath.current === pagePath) return;

    lastHandledPath.current = pagePath;

    if (typeof window.gtag === "function") {
      window.gtag("config", AW_ID, { page_path: pagePath });
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search]);

  return null;
}
