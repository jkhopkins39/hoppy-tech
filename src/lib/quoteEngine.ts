// Pricing engine for the self-serve "simple" quote flow (websites, chatbots, apps).
// Business Intelligence, RAG, Computer Vision, and Predictive Analytics are enterprise-tier
// and are handled on the /enterprise page via a scheduled call instead of instant pricing.

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
};

export type LineItem = { label: string; oneTime?: number; monthly?: number; custom?: true };

export function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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

  if (sel.standardWebsite) add({ label: "Standard Website Package", oneTime: 400 });
  if (sel.emailSystem) add({ label: "Email System", monthly: 20 });
  if (sel.mediaStorage) add({ label: "Media & File Storage", monthly: 10 });
  if (sel.chatbot) add({ label: "AI Website Chatbot", oneTime: 250, monthly: 15 });

  if (sel.socialTier === "basic") add({ label: "AI Social Media Management", monthly: 150 });
  else if (sel.socialTier === "full") add({ label: "Full Socials Package", monthly: 400 });
  else if (sel.socialTier === "elite") add({ label: "Elite Socials Package", monthly: 1_337 });

  if (sel.video30s > 0) add({ label: `30s AI Video ×${sel.video30s}`, oneTime: sel.video30s * 125 });
  if (sel.video60s > 0) add({ label: `60s AI Video ×${sel.video60s}`, oneTime: sel.video60s * 225 });

  if (sel.ecommerce) add({ label: "E-Commerce Module", oneTime: 350 });
  if (sel.booking) add({ label: "Booking & Appointment System", oneTime: 200, monthly: 15 });
  if (sel.seo) add({ label: "SEO Foundation Package", oneTime: 200 });
  if (sel.customDashboard) add({ label: "Custom Analytics Dashboard", oneTime: 600, monthly: 25 });
  if (sel.apiIntegrations > 0) add({ label: `API Integrations ×${sel.apiIntegrations}`, oneTime: sel.apiIntegrations * 200 });
  if (sel.workflows) add({ label: "Automated Business Workflows", oneTime: 750, monthly: 50 });
  if (sel.mobileApp === "basic") add({ label: "Mobile App — Basic", oneTime: 2_500 });
  else if (sel.mobileApp === "full") add({ label: "Mobile App — Full Featured", custom: true });

  return { oneTime, monthly, hasCustom, lines };
}
