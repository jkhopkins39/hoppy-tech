import { useEffect } from "react";
import { CALENDLY_URL } from "../config/calendly";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

export default function CalendlyEmbed() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="calendly-inline-widget rounded-2xl overflow-hidden"
      data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=faf9f0&primary_color=7ab2fc`}
      style={{ minWidth: "320px", height: "700px" }}
    />
  );
}
