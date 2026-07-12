import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import CalendlyEmbed from "../components/CalendlyEmbed";
import { MsgContent } from "../lib/chatFormat";
import { BRAND } from "../config/brandColors";
import {
  DEFAULT_SEL,
  DESIGN_TIERS,
  PRICES,
  computeQuote,
  fmtUSD,
  hasDesignSelection,
  priceLabel,
  type Sel,
} from "../lib/quoteEngine";

// ─── Enterprise solutions (scoped on a strategy call, not self-serve) ─────────

const ENTERPRISE_SOLUTIONS = [
  {
    id: "bi",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Business Intelligence & Predictive Analytics",
    tagline: "Know what's coming before it arrives",
    accent: BRAND.skyBlue,
    summary: "Turn historical operational data into forecasts, churn signals, and dashboards built around the metrics your team actually watches.",
    details: [
      "Sales and demand forecasting",
      "Customer churn prediction and retention triggers",
      "Dynamic pricing and inventory optimization",
      "Anomaly detection and fraud prevention",
      "Live dashboards across your data sources",
    ],
  },
  {
    id: "rag",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "RAG Knowledgebase",
    tagline: "Every document, instantly searchable",
    accent: BRAND.orange,
    summary: "A Retrieval-Augmented Generation system that indexes your docs, SOPs, and internal knowledge so your team or customers get accurate, source-cited answers.",
    details: [
      "Unified search across internal data from multiple sources",
      "Plain-English queries over thousands of documents",
      "Source citations on every answer",
      "Scales from hundreds to unlimited documents",
    ],
  },
  {
    id: "vision",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Computer Vision",
    tagline: "Teach your operations to see",
    accent: BRAND.orangeLight,
    summary: "Real-time image and video pipelines for defect detection, inventory counting, document OCR, and safety monitoring.",
    details: [
      "Product defect detection on the assembly line",
      "Document scanning and OCR at scale",
      "Multi-camera video pipelines, edge or on-prem",
      "Trained on your own data for domain-specific detection",
    ],
  },
  {
    id: "custom",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Custom Enterprise Builds",
    tagline: "When off-the-shelf isn't enough",
    accent: BRAND.navyMid,
    summary: "Dedicated infrastructure, custom integrations, and white-glove onboarding for teams whose needs don't fit a fixed tier.",
    details: [
      "Streaming data pipelines and custom integrations",
      "Dedicated analyst and engineering hours",
      "SLA-backed support and priority response",
      "Scoped and priced together on a call — not a checkout page",
    ],
  },
];

// ─── Batch field model ─────────────────────────────────────────────────────────
// Each conversation turn after the intro presents a small batch of fields (checkboxes
// and/or tier pickers) at once — the user selects whatever applies, then hits
// Continue to submit the whole batch in a single turn instead of one question each.

interface CheckboxField {
  kind: "checkbox";
  key: keyof Sel;
  label: string;
  price: string;
  onValue: boolean | number;
  offValue: boolean | number;
}

interface TierField {
  kind: "tier";
  key: keyof Sel;
  label: string;
  options: { value: string | number; label: string; description?: string }[];
  noneValue: string | number;
  layout?: "compact" | "stacked";
}

type Field = CheckboxField | TierField;

function checkboxField(key: keyof Sel, label: string, price: string): CheckboxField {
  return { kind: "checkbox", key, label, price, onValue: true, offValue: false };
}

function videoField(key: "video30s" | "video60s", label: string, price: string): CheckboxField {
  return { kind: "checkbox", key, label, price, onValue: 1, offValue: 0 };
}

function tierField(
  key: keyof Sel,
  label: string,
  options: { value: string | number; label: string; description?: string }[],
  noneValue: string | number,
  layout: "compact" | "stacked" = "compact",
): TierField {
  return { kind: "tier", key, label, options, noneValue, layout };
}

function designTierOptions() {
  return [
    { value: "none", label: DESIGN_TIERS.none.label, description: DESIGN_TIERS.none.description },
    {
      value: "basic",
      label: `${DESIGN_TIERS.basic.label} — est. ${fmtUSD(DESIGN_TIERS.basic.estimate)}*`,
      description: DESIGN_TIERS.basic.description,
    },
    {
      value: "advanced",
      label: `${DESIGN_TIERS.advanced.label} — est. ${fmtUSD(DESIGN_TIERS.advanced.estimate)}*`,
      description: DESIGN_TIERS.advanced.description,
    },
    {
      value: "iconLogo",
      label: `${DESIGN_TIERS.iconLogo.label} — ${fmtUSD(DESIGN_TIERS.iconLogo.oneTime)}`,
      description: DESIGN_TIERS.iconLogo.description,
    },
  ] as const;
}

type Interest = "website" | "chatbot" | "ecommerce" | "mobile" | "unsure" | null;

interface Batch {
  id: string;
  prompt: (interest: Interest) => string;
  fields: (sel: Sel) => Field[];
}

const BATCHES: Batch[] = [
  {
    id: "core",
    prompt: (interest) =>
      interest === "chatbot"
        ? "Let's start with the essentials — since you already have a site, pick anything else that applies:"
        : "Let's start with the essentials — pick any that apply:",
    fields: () => [
      checkboxField(
        "standardWebsite",
        "Standard Website Package",
        priceLabel(PRICES.standardWebsite.oneTime),
      ),
      checkboxField(
        "chatbot",
        "AI Chatbot",
        priceLabel(PRICES.chatbot.oneTime, PRICES.chatbot.monthly),
      ),
      checkboxField("ecommerce", "E-Commerce Module", priceLabel(PRICES.ecommerce.oneTime)),
    ],
  },
  {
    id: "design",
    prompt: () =>
      "Need design help? Bella (bella@hoppytech.com) handles all visual work — logos, brand identity, and styling. Pick one option or skip.",
    fields: () => [
      tierField("designTier", "Visual Design", designTierOptions(), "none", "stacked"),
    ],
  },
  {
    id: "operations",
    prompt: () => "Any of these operational add-ons sound useful?",
    fields: () => [
      checkboxField(
        "booking",
        "Booking & Appointments",
        priceLabel(PRICES.booking.oneTime),
      ),
      checkboxField("emailSystem", "Email System", priceLabel(undefined, PRICES.emailSystem.monthly)),
      checkboxField(
        "mediaStorage",
        "Media & File Storage",
        priceLabel(undefined, PRICES.mediaStorage.monthly),
      ),
    ],
  },
  {
    id: "growth",
    prompt: () => "What about these growth tools?",
    fields: () => [
      checkboxField("seo", "SEO Foundation Package", priceLabel(PRICES.seo.oneTime)),
      checkboxField(
        "customDashboard",
        "Custom Analytics Dashboard",
        priceLabel(PRICES.customDashboard.oneTime),
      ),
      checkboxField(
        "workflows",
        "Automated Business Workflows",
        priceLabel(PRICES.workflows.oneTime),
      ),
    ],
  },
  {
    id: "scale",
    prompt: () => "Need either of these to scale further?",
    fields: () => [
      tierField(
        "mobileApp",
        "Mobile App",
        [
          { value: "none", label: "None" },
          { value: "basic", label: `Basic — ${fmtUSD(PRICES.mobileAppBasic.oneTime)}` },
          { value: "full", label: "Full-featured — custom" },
        ],
        "none",
      ),
      tierField(
        "apiIntegrations",
        "API Integrations",
        [
          { value: 0, label: "None" },
          { value: 1, label: `1 — ${fmtUSD(PRICES.apiIntegration.oneTime)}` },
          { value: 2, label: `2 — ${fmtUSD(PRICES.apiIntegration.oneTime * 2)}` },
          { value: 3, label: "3+" },
        ],
        0,
      ),
    ],
  },
  {
    id: "social",
    prompt: () => "Want help with social media, or an AI-generated video here and there?",
    fields: (sel) => {
      const fields: Field[] = [
        tierField(
          "socialTier",
          "Social Media Management",
          [
            { value: "none", label: "None" },
            { value: "basic", label: `Basic — ${fmtUSD(PRICES.socialBasic.monthly)}/mo` },
            { value: "full", label: `Full — ${fmtUSD(PRICES.socialFull.monthly)}/mo` },
            { value: "elite", label: `Elite — ${fmtUSD(PRICES.socialElite.monthly)}/mo` },
          ],
          "none",
        ),
      ];
      if (sel.socialTier !== "full" && sel.socialTier !== "elite") {
        fields.push(videoField("video30s", "30s AI Video", priceLabel(PRICES.video30s.oneTime)));
        fields.push(videoField("video60s", "60s AI Video", priceLabel(PRICES.video60s.oneTime)));
      }
      return fields;
    },
  },
];

const INTRO_PROMPT = "Hi! I'm Jeremy's assistant. What are you looking to build?";

interface IntroOption {
  label: string;
  interest: Interest;
  applyInitial?: (sel: Sel) => Sel;
}

const INTRO_OPTIONS: IntroOption[] = [
  { label: "A brand-new website", interest: "website" },
  { label: "Just a chatbot for my existing site", interest: "chatbot", applyInitial: (sel) => ({ ...sel, chatbot: true, standardWebsite: false }) },
  { label: "An online store", interest: "ecommerce", applyInitial: (sel) => ({ ...sel, ecommerce: true }) },
  { label: "A mobile app", interest: "mobile" },
  { label: "Not sure yet — walk me through everything", interest: "unsure" },
];

// ─── Chat message model ───────────────────────────────────────────────────────

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

function batchRecap(batch: Batch, sel: Sel): string {
  const parts: string[] = [];
  for (const field of batch.fields(sel)) {
    if (field.kind === "checkbox") {
      if (sel[field.key] === field.onValue) parts.push(`${field.label} (${field.price})`);
    } else {
      const value = sel[field.key];
      if (value !== field.noneValue) {
        const opt = field.options.find((o) => o.value === value);
        if (opt) parts.push(`${field.label}: ${opt.label}`);
      }
    }
  }
  return parts.length > 0 ? parts.join(", ") : "Nothing from this batch";
}

function formatLineItem(l: ReturnType<typeof computeQuote>["lines"][number]): string {
  if (l.custom) return `- ${l.label} — custom pricing`;
  const parts = [l.label];
  if (l.estimate && l.oneTime) parts.push(`est. ${fmtUSD(l.oneTime)} (price may vary)`);
  else {
    if (l.oneTime) parts.push(`${fmtUSD(l.oneTime)} setup`);
    if (l.monthly) parts.push(`${fmtUSD(l.monthly)}/mo`);
  }
  return `- ${parts.join(" — ")}`;
}

type Track = "standard" | "enterprise" | null;

export default function Quote() {
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track>(null);
  const [interest, setInterest] = useState<Interest>(null);
  const [sel, setSel] = useState<Sel>(DEFAULT_SEL);
  const [batchPointer, setBatchPointer] = useState(-1); // -1 = intro, BATCHES.length = final
  const [messages, setMessages] = useState<ChatMsg[]>([{ id: 0, role: "assistant", text: INTRO_PROMPT }]);
  const [openEnterpriseId, setOpenEnterpriseId] = useState<string | null>(null);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { oneTime, monthly, lines } = useMemo(() => computeQuote(sel), [sel]);
  const isEmpty = lines.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function pushMessage(role: "user" | "assistant", text: string) {
    setMessages((prev) => [...prev, { id: idRef.current++, role, text }]);
  }

  function summaryText(currentSel: Sel) {
    const { oneTime: ot, monthly: mo, hasCustom: hc, lines: ls } = computeQuote(currentSel);
    if (ls.length === 0) {
      return "Looks like you skipped everything! No worries — you can still reach out and we'll figure out the right fit together.";
    }
    const bullets = ls.map(formatLineItem).join("\n");
    const designNote = hasDesignSelection(currentSel)
      ? "\n\n*Visual design selected — Bella will be copied on your request.*"
      : "";
    const totals = [
      ot > 0 ? `**One-time total: ${fmtUSD(ot)}**` : null,
      mo > 0 ? `**Monthly recurring: ${fmtUSD(mo)}/mo**` : null,
      hc ? "*Some selections require a custom quote — exact pricing will be in your proposal.*" : null,
      hasDesignSelection(currentSel) ? "*Design estimates may change based on scope — Bella will confirm final pricing.*" : null,
    ]
      .filter(Boolean)
      .join("\n");
    return `Here's what we've got so far:\n\n${bullets}\n\n${totals}${designNote}\n\nReady to send this to Jeremy?`;
  }

  function goToBatch(pointer: number, currentSel: Sel, currentInterest: Interest) {
    setBatchPointer(pointer);
    if (pointer >= BATCHES.length) {
      pushMessage("assistant", summaryText(currentSel));
    } else {
      pushMessage("assistant", BATCHES[pointer].prompt(currentInterest));
    }
  }

  function handleIntroOption(opt: IntroOption) {
    pushMessage("user", opt.label);
    setInterest(opt.interest);
    const newSel = opt.applyInitial ? opt.applyInitial(sel) : sel;
    setSel(newSel);
    goToBatch(0, newSel, opt.interest);
  }

  function handleFieldToggle(field: Field) {
    setSel((prev) => {
      if (field.kind === "checkbox") {
        const isOn = prev[field.key] === field.onValue;
        return { ...prev, [field.key]: isOn ? field.offValue : field.onValue };
      }
      return prev;
    });
  }

  function handleTierSelect(field: TierField, value: string | number) {
    setSel((prev) => ({ ...prev, [field.key]: value }));
  }

  function handleContinue() {
    const batch = BATCHES[batchPointer];
    pushMessage("user", batchRecap(batch, sel));
    goToBatch(batchPointer + 1, sel, interest);
  }

  function handleReset() {
    setInterest(null);
    setSel(DEFAULT_SEL);
    setBatchPointer(-1);
    setMessages([{ id: 0, role: "assistant", text: INTRO_PROMPT }]);
    idRef.current = 1;
  }

  const showingIntro = batchPointer === -1;
  const showingFinal = batchPointer >= BATCHES.length;
  const activeBatch = !showingIntro && !showingFinal ? BATCHES[batchPointer] : null;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Websites, AI & Enterprise Solutions</span>
          <h1 className="mt-2 text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.1] tracking-tight text-ink">
            Let's Talk{" "}
            <span
              className="italic"
              style={{
                fontFamily: "'DM Serif Display', serif",
                background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Through It
            </span>
          </h1>
          <p className="text-muted text-lg leading-relaxed mt-4">
            Pick a track below — self-serve pricing for standard projects, or a strategy call for enterprise AI and data work.
          </p>
        </motion.div>
      </section>

      {/* ─── Track picker ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setTrack("standard")}
            className="text-left p-6 rounded-2xl border-2 transition-all duration-200"
            style={{
              borderColor: track === "standard" ? BRAND.skyBlue : "var(--border-color)",
              backgroundColor: track === "standard" ? `${BRAND.skyBlue}12` : "var(--surface)",
            }}
          >
            <h3 className="font-semibold text-ink text-lg mb-1.5">Standard Projects</h3>
            <p className="text-muted text-sm leading-relaxed">
              Websites, chatbots, online stores, automation, and apps — build a live estimate yourself in a couple minutes.
            </p>
          </button>
          <button
            onClick={() => setTrack("enterprise")}
            className="text-left p-6 rounded-2xl border-2 transition-all duration-200"
            style={{
              borderColor: track === "enterprise" ? BRAND.orange : "var(--border-color)",
              backgroundColor: track === "enterprise" ? `${BRAND.orange}12` : "var(--surface)",
            }}
          >
            <h3 className="font-semibold text-ink text-lg mb-1.5">Enterprise & AI</h3>
            <p className="text-muted text-sm leading-relaxed">
              Business intelligence, RAG knowledgebases, computer vision, and custom builds — worth a real conversation first.
            </p>
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {track === "standard" && (
          <motion.div key="standard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {/* ─── Chat panel ───────────────────────────────────── */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-none"
                      style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--accent-foreground)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">Jeremy's AI Assistant</p>
                      <p className="text-[11px] text-muted">Guided Quote</p>
                    </div>
                  </div>
                  {!isEmpty && (
                    <div className="text-right">
                      {oneTime > 0 && <p className="text-[13px] font-mono font-semibold text-ink">{fmtUSD(oneTime)}</p>}
                      {monthly > 0 && <p className="text-[11px] font-mono text-accent">{fmtUSD(monthly)}/mo</p>}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-3 px-5 py-5 max-h-[420px] overflow-y-auto">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                        style={{
                          background: msg.role === "user" ? "linear-gradient(135deg, var(--accent-light), var(--accent))" : "var(--surface-alpha)",
                          border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none",
                          color: msg.role === "user" ? "var(--accent-foreground)" : "var(--ink)",
                        }}
                      >
                        {msg.role === "assistant" ? <MsgContent text={msg.text} /> : msg.text}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={scrollRef} />
                </div>

                {/* Batch fields / actions */}
                <div className="px-5 py-4 border-t flex flex-col gap-2" style={{ borderColor: "var(--border-color)" }}>
                  {showingIntro &&
                    INTRO_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleIntroOption(opt)}
                        className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200"
                        style={{ borderColor: "var(--border-color)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)")}
                      >
                        <span className="font-medium text-ink text-[14px]">{opt.label}</span>
                      </button>
                    ))}

                  {activeBatch && (
                    <>
                      {activeBatch.fields(sel).map((field) => {
                        if (field.kind === "checkbox") {
                          const checked = sel[field.key] === field.onValue;
                          return (
                            <button
                              key={field.key}
                              onClick={() => handleFieldToggle(field)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
                              style={{
                                borderColor: checked ? BRAND.skyBlue : "var(--border-color)",
                                backgroundColor: checked ? `${BRAND.skyBlue}18` : "transparent",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-all duration-200"
                                  style={{ borderColor: checked ? BRAND.skyBlue : "var(--border-hover)", backgroundColor: checked ? BRAND.skyBlue : "transparent" }}
                                >
                                  {checked && (
                                    <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="font-medium text-ink text-[14px]">{field.label}</span>
                              </div>
                              <span className="text-[12px] font-mono text-muted flex-none">{field.price}</span>
                            </button>
                          );
                        }

                        return (
                          <div key={field.key} className="px-1 py-1">
                            <p className="text-[13px] font-semibold text-ink mb-1.5">{field.label}</p>
                            {field.layout === "stacked" ? (
                              <div className="flex flex-col gap-2">
                                {field.options.map((opt) => {
                                  const active = sel[field.key] === opt.value;
                                  return (
                                    <button
                                      key={String(opt.value)}
                                      onClick={() => handleTierSelect(field, opt.value)}
                                      className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200"
                                      style={{
                                        borderColor: active ? BRAND.skyBlue : "var(--border-color)",
                                        backgroundColor: active ? `${BRAND.skyBlue}18` : "transparent",
                                      }}
                                    >
                                      <p className="font-medium text-ink text-[14px]">{opt.label}</p>
                                      {opt.description && (
                                        <p className="mt-1 text-[12px] leading-relaxed text-muted">{opt.description}</p>
                                      )}
                                    </button>
                                  );
                                })}
                                {field.key === "designTier" && (
                                  <p className="text-[11px] text-muted px-1">* Estimated price — final quote may vary by scope.</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((opt) => {
                                  const active = sel[field.key] === opt.value;
                                  return (
                                    <button
                                      key={String(opt.value)}
                                      onClick={() => handleTierSelect(field, opt.value)}
                                      className="px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-200"
                                      style={{
                                        borderColor: active ? BRAND.skyBlue : "var(--border-color)",
                                        backgroundColor: active ? `${BRAND.skyBlue}18` : "transparent",
                                        color: active ? BRAND.skyBlue : "var(--ink)",
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={handleContinue}
                        className="w-full mt-1 py-3 px-6 font-semibold rounded-xl text-[15px] transition-all duration-200 hover:scale-[1.02]"
                        style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {showingFinal && (
                    <>
                      {!isEmpty && (
                        <button
                          onClick={() => {
                            const message = summaryRequestMessage(sel);
                            navigate("/contact", {
                              state: {
                                quoteMessage: message,
                                notifyBella: hasDesignSelection(sel),
                              },
                            });
                          }}
                          className="w-full py-3.5 px-6 font-semibold rounded-xl text-[15px] transition-all duration-200 hover:scale-[1.02]"
                          style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                          Request This Quote
                        </button>
                      )}
                      {isEmpty && (
                        <button
                          onClick={() => navigate("/contact")}
                          className="w-full py-3.5 px-6 font-semibold rounded-xl text-[15px] transition-all duration-200 hover:scale-[1.02]"
                          style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                          Go to Contact
                        </button>
                      )}
                      <button
                        onClick={handleReset}
                        className="w-full py-2.5 text-[13px] font-medium rounded-xl border transition-all duration-200 text-muted"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        Start Over
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-center text-muted text-[13px] mt-6">
                Need enterprise-grade AI, BI, or a RAG knowledgebase?{" "}
                <button onClick={() => setTrack("enterprise")} className="underline font-medium" style={{ color: BRAND.skyBlue }}>
                  Explore Enterprise Solutions →
                </button>
              </p>
            </section>
          </motion.div>
        )}

        {track === "enterprise" && (
          <motion.div key="enterprise" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-ink mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Schedule a Strategy Call
                </h2>
                <p className="text-muted text-lg max-w-xl mx-auto">
                  Pick a time that works and we'll meet over Zoom to scope your project — no obligation, no sales pitch.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
                {/* ─── Compact capability list ───────────────────── */}
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-3">What we can build</p>
                  <div className="space-y-2">
                    {ENTERPRISE_SOLUTIONS.map((s, i) => {
                      const isOpen = openEnterpriseId === s.id;
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                          className="rounded-xl border overflow-hidden"
                          style={{ borderColor: isOpen ? `${s.accent}40` : "var(--border-color)", backgroundColor: "var(--surface)" }}
                        >
                          <button
                            onClick={() => setOpenEnterpriseId(isOpen ? null : s.id)}
                            className="w-full flex items-center gap-3 p-3 text-left"
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-none [&>svg]:w-5 [&>svg]:h-5"
                              style={{ background: `${s.accent}22`, color: s.accent }}
                            >
                              {s.icon}
                            </div>
                            <span className="flex-1 font-medium text-ink text-[13px] leading-snug">{s.title}</span>
                            <svg
                              className={`w-4 h-4 flex-none text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3.5">
                                  <p className="text-[12px] font-medium mb-1.5" style={{ color: s.accent }}>{s.tagline}</p>
                                  <p className="text-muted text-xs leading-relaxed mb-2.5">{s.summary}</p>
                                  <ul className="space-y-1.5">
                                    {s.details.map((d) => (
                                      <li key={d} className="flex items-start gap-1.5 text-muted text-[11px] leading-relaxed">
                                        <svg className="w-3 h-3 mt-0.5 flex-none" style={{ color: s.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {d}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── Calendar ───────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <CalendlyEmbed />
                </motion.div>
              </div>

              <p className="text-center text-muted text-[13px] mt-10">
                Looking for something simpler?{" "}
                <button onClick={() => setTrack("standard")} className="underline font-medium" style={{ color: BRAND.orange }}>
                  Explore Standard Projects →
                </button>
              </p>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

function summaryRequestMessage(currentSel: Sel) {
  const { oneTime: ot, monthly: mo, hasCustom: hc, lines: ls } = computeQuote(currentSel);
  const summary = ls.map((l) => formatLineItem(l).replace(/^- /, "• ")).join("\n");
  const totals = [
    ot > 0 ? `One-time total: ${fmtUSD(ot)}` : null,
    mo > 0 ? `Monthly recurring: ${fmtUSD(mo)}/mo` : null,
    hc ? "Some items require a custom quote." : null,
    hasDesignSelection(currentSel) ? "Design estimates may change — Bella will confirm final pricing." : null,
  ]
    .filter(Boolean)
    .join("\n");
  const designNote = hasDesignSelection(currentSel)
    ? "\n\n(Visual design selected — please copy Bella on this request.)"
    : "";
  return `Hi! I used the Guided Quote and I'm interested in the following:\n\n${summary}\n\n${totals}${designNote}\n\nPlease send me a detailed proposal!`;
}
