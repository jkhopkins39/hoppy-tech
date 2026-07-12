// Pricing engine for the self-serve "simple" quote flow (websites, chatbots, apps).
// Business Intelligence, RAG, Computer Vision, and Predictive Analytics are enterprise-tier
// and are handled on the /enterprise page via a scheduled call instead of instant pricing.
//
// Rates tuned for rural audiences, small businesses, and solo ventures (2026).

export interface Sel {
  standardWebsite: boolean;
  emailSystem: boolean;
  mediaStorage: boolean;
  chatbot: boolean;
  socialTier: "none" | "basic" | "full" | "elite";
  video30s: number;
  video60s: number;
  ecommerce: boolean;
  booking: boolean;
  seo: boolean;
  customDashboard: boolean;
  apiIntegrations: number;
  workflows: boolean;
  mobileApp: "none" | "basic" | "full";
  designTier: "none" | "basic" | "advanced" | "iconLogo" | "discuss";
}

export const DEFAULT_SEL: Sel = {
  standardWebsite: false,
  emailSystem: false,
  mediaStorage: false,
  chatbot: false,
  socialTier: "none",
  video30s: 0,
  video60s: 0,
  ecommerce: false,
  booking: false,
  seo: false,
  customDashboard: false,
  apiIntegrations: 0,
  workflows: false,
  mobileApp: "none",
  designTier: "none",
};

/** Canonical Hoppy Tech catalog — one-time and/or monthly. */
export const PRICES = {
  standardWebsite: { oneTime: 750 },
  chatbot: { oneTime: 250, monthly: 15 },
  ecommerce: { oneTime: 600 },
  booking: { oneTime: 400 },
  emailSystem: { monthly: 30 },
  mediaStorage: { monthly: 15 },
  seo: { oneTime: 750 },
  customDashboard: { oneTime: 1_000 },
  workflows: { oneTime: 1_500 },
  apiIntegration: { oneTime: 400 },
  mobileAppBasic: { oneTime: 3_000 },
  socialBasic: { monthly: 150 },
  socialFull: { monthly: 400 },
  socialElite: { monthly: 1_337 },
  video30s: { oneTime: 200 },
  video60s: { oneTime: 350 },
} as const;

/** Visual design services — handled by Bella (bella@hoppytech.com). */
export const DESIGN_TIERS = {
  none: {
    label: "No design services",
    description: "Skip — you already have what you need.",
  },
  basic: {
    label: "Basic redesign",
    description:
      "Redesign based on your existing content, logo, stylesheet, and other visual assets you provide. Final price may vary depending on what you need.",
    estimate: 400,
  },
  advanced: {
    label: "Advanced — full brand build",
    description:
      "Ground-up brand creation: logo, style guides, and several iterations. Cohesive look for your website plus print-ready assets (business cards, signs, billboards, posters, and more).",
    estimate: 800,
  },
  iconLogo: {
    label: "Icon logo only",
    description: "A standalone icon mark — no full brand package.",
    oneTime: 200,
  },
  discuss: {
    label: "Not sure yet — let's talk it through",
    description:
      "You know you want design help but aren't sure what you need. We'll discuss your goals on a call and figure out the right fit together.",
  },
} as const;

export const BELLA_DESIGN_EMAIL = "bella@hoppytech.com";

export function hasDesignSelection(sel: Sel): boolean {
  return sel.designTier !== "none";
}

export type LineItem = {
  label: string;
  oneTime?: number;
  monthly?: number;
  custom?: true;
  /** Shown as an estimate; final price may vary. */
  estimate?: true;
};

export function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** Short label for quote UI checkboxes / tiers. */
export function priceLabel(oneTime?: number, monthly?: number): string {
  const parts: string[] = [];
  if (oneTime) parts.push(fmtUSD(oneTime));
  if (monthly) parts.push(`${fmtUSD(monthly)}/mo`);
  return parts.join(" + ") || "—";
}

export function computeQuote(sel: Sel) {
  let oneTime = 0;
  let monthly = 0;
  let hasCustom = false;
  const lines: LineItem[] = [];

  function add(item: LineItem) {
    lines.push(item);
    if (item.oneTime) oneTime += item.oneTime;
    if (item.monthly) monthly += item.monthly;
    if (item.custom) hasCustom = true;
  }

  if (sel.standardWebsite) {
    add({ label: "Standard Website Package", oneTime: PRICES.standardWebsite.oneTime });
  }
  if (sel.emailSystem) add({ label: "Email System", monthly: PRICES.emailSystem.monthly });
  if (sel.mediaStorage) add({ label: "Media & File Storage", monthly: PRICES.mediaStorage.monthly });
  if (sel.chatbot) {
    add({
      label: "AI Website Chatbot",
      oneTime: PRICES.chatbot.oneTime,
      monthly: PRICES.chatbot.monthly,
    });
  }

  if (sel.socialTier === "basic") {
    add({ label: "AI Social Media Management", monthly: PRICES.socialBasic.monthly });
  } else if (sel.socialTier === "full") {
    add({ label: "Full Socials Package", monthly: PRICES.socialFull.monthly });
  } else if (sel.socialTier === "elite") {
    add({ label: "Elite Socials Package", monthly: PRICES.socialElite.monthly });
  }

  if (sel.video30s > 0) {
    add({
      label: `30s AI Video ×${sel.video30s}`,
      oneTime: sel.video30s * PRICES.video30s.oneTime,
    });
  }
  if (sel.video60s > 0) {
    add({
      label: `60s AI Video ×${sel.video60s}`,
      oneTime: sel.video60s * PRICES.video60s.oneTime,
    });
  }

  if (sel.ecommerce) add({ label: "E-Commerce Module", oneTime: PRICES.ecommerce.oneTime });
  if (sel.booking) {
    add({
      label: "Booking & Appointment System",
      oneTime: PRICES.booking.oneTime,
    });
  }
  if (sel.seo) add({ label: "SEO Foundation Package", oneTime: PRICES.seo.oneTime });
  if (sel.customDashboard) {
    add({
      label: "Custom Analytics Dashboard",
      oneTime: PRICES.customDashboard.oneTime,
    });
  }
  if (sel.apiIntegrations > 0) {
    add({
      label: `API Integrations ×${sel.apiIntegrations}`,
      oneTime: sel.apiIntegrations * PRICES.apiIntegration.oneTime,
    });
  }
  if (sel.workflows) {
    add({
      label: "Automated Business Workflows",
      oneTime: PRICES.workflows.oneTime,
    });
  }
  if (sel.mobileApp === "basic") {
    add({ label: "Mobile App — Basic", oneTime: PRICES.mobileAppBasic.oneTime });
  } else if (sel.mobileApp === "full") {
    add({ label: "Mobile App — Full Featured", custom: true });
  }

  if (sel.designTier === "basic") {
    add({
      label: "Basic Visual Redesign",
      oneTime: DESIGN_TIERS.basic.estimate,
      estimate: true,
    });
  } else if (sel.designTier === "advanced") {
    add({
      label: "Full Brand Build",
      oneTime: DESIGN_TIERS.advanced.estimate,
      estimate: true,
    });
  } else if (sel.designTier === "iconLogo") {
    add({ label: "Icon Logo", oneTime: DESIGN_TIERS.iconLogo.oneTime });
  } else if (sel.designTier === "discuss") {
    add({ label: "Visual Design — scope to discuss", custom: true });
  }

  return { oneTime, monthly, hasCustom, lines };
}
