import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { BRAND } from "../config/brandColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Sel {
  standardWebsite: boolean;
  emailSystem: boolean;
  mediaStorage: boolean;
  chatbot: boolean;
  ragTier: "none" | "standard" | "professional" | "enterprise";
  socialTier: "none" | "basic" | "full";
  video30s: number;
  video60s: number;
  cvTier: "none" | "standard" | "custom" | "enterprise";
  analyticsTier: "none" | "standard" | "professional" | "enterprise";
  ecommerce: boolean;
  booking: boolean;
  seo: boolean;
  customDashboard: boolean;
  apiIntegrations: number;
  workflows: boolean;
  mobileApp: "none" | "basic" | "full";
}

const DEFAULT_SEL: Sel = {
  standardWebsite: false,
  emailSystem: false,
  mediaStorage: false,
  chatbot: false,
  ragTier: "none",
  socialTier: "none",
  video30s: 0,
  video60s: 0,
  cvTier: "none",
  analyticsTier: "none",
  ecommerce: false,
  booking: false,
  seo: false,
  customDashboard: false,
  apiIntegrations: 0,
  workflows: false,
  mobileApp: "none",
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

type LineItem = { label: string; oneTime?: number; monthly?: number; custom?: true };

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function computeQuote(sel: Sel) {
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

  if (sel.ragTier === "standard") add({ label: "AI Knowledgebase — Standard", oneTime: 2_500, monthly: 150 });
  else if (sel.ragTier === "professional") add({ label: "AI Knowledgebase — Professional", oneTime: 4_000, monthly: 250 });
  else if (sel.ragTier === "enterprise") add({ label: "AI Knowledgebase — Enterprise", custom: true });

  if (sel.socialTier === "basic") add({ label: "AI Social Media Management", monthly: 150 });
  else if (sel.socialTier === "full") add({ label: "Full Socials Package", monthly: 500 });

  if (sel.video30s > 0) add({ label: `30s AI Video ×${sel.video30s}`, oneTime: sel.video30s * 250 });
  if (sel.video60s > 0) add({ label: `60s AI Video ×${sel.video60s}`, oneTime: sel.video60s * 400 });

  if (sel.cvTier === "standard") add({ label: "Computer Vision — Standard", oneTime: 1_500, monthly: 100 });
  else if (sel.cvTier === "custom") add({ label: "Computer Vision — Custom Models", oneTime: 3_500, monthly: 200 });
  else if (sel.cvTier === "enterprise") add({ label: "Computer Vision — Enterprise", custom: true });

  if (sel.analyticsTier === "standard") add({ label: "Predictive Analytics — Standard", oneTime: 2_000, monthly: 150 });
  else if (sel.analyticsTier === "professional") add({ label: "Predictive Analytics — Professional", oneTime: 3_500, monthly: 250 });
  else if (sel.analyticsTier === "enterprise") add({ label: "Predictive Analytics — Enterprise", custom: true });

  if (sel.ecommerce) add({ label: "E-Commerce Module", oneTime: 500 });
  if (sel.booking) add({ label: "Booking & Appointment System", oneTime: 300, monthly: 15 });
  if (sel.seo) add({ label: "SEO Foundation Package", oneTime: 200 });
  if (sel.customDashboard) add({ label: "Custom Analytics Dashboard", oneTime: 600, monthly: 25 });
  if (sel.apiIntegrations > 0) add({ label: `API Integrations ×${sel.apiIntegrations}`, oneTime: sel.apiIntegrations * 200 });
  if (sel.workflows) add({ label: "Automated Business Workflows", oneTime: 750, monthly: 50 });
  if (sel.mobileApp === "basic") add({ label: "Mobile App — Basic", oneTime: 2_500 });
  else if (sel.mobileApp === "full") add({ label: "Mobile App — Full Featured", custom: true });

  return { oneTime, monthly, hasCustom, lines };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function CheckOption({
  checked, onChange, label, description, oneTime, monthly, accent = "var(--accent)", note,
}: {
  checked: boolean; onChange: () => void; label: string; description: string;
  oneTime?: number; monthly?: number; accent?: string; note?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full text-left p-4 rounded-xl border transition-all duration-200"
      style={{
        borderColor: checked ? accent : "var(--border-color)",
        backgroundColor: checked ? `${accent}18` : "transparent",
      }}
      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
      onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-none mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
          style={{ borderColor: checked ? accent : "var(--border-hover)", backgroundColor: checked ? accent : "transparent" }}
        >
          {checked && (
            <svg className="w-3 h-3" fill="none" stroke="var(--accent-foreground)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="font-medium text-ink text-[15px]">{label}</span>
            <div className="flex gap-2 items-baseline flex-wrap">
              {oneTime && <span className="text-[13px] font-mono font-semibold" style={{ color: accent }}>{fmtUSD(oneTime)}</span>}
              {monthly && <span className="text-[12px] font-mono text-muted">{oneTime ? "+" : ""}{fmtUSD(monthly)}<span className="text-[10px]">/mo</span></span>}
            </div>
          </div>
          <p className="text-muted text-[13px] leading-relaxed mt-0.5">{description}</p>
          {note && <p className="text-[12px] mt-1 italic" style={{ color: accent }}>{note}</p>}
        </div>
      </div>
    </button>
  );
}

interface TierOption {
  value: string;
  label: string;
  description: string;
  oneTime?: number;
  monthly?: number;
  custom?: true;
  highlight?: string;
}

function TierSelector({
  value, onChange, options, accent = "var(--accent)", noneLabel = "None",
}: {
  value: string; onChange: (v: string) => void; options: TierOption[];
  accent?: string; noneLabel?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={() => onChange("none")}
        className="text-left p-4 rounded-xl border transition-all duration-200"
        style={{
          borderColor: value === "none" ? "var(--border-hover)" : "var(--border-color)",
          backgroundColor: value === "none" ? "var(--surface-alpha)" : "transparent",
        }}
        onMouseEnter={e => { if (value !== "none") (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
        onMouseLeave={e => { if (value !== "none") (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none"
            style={{ borderColor: value === "none" ? "var(--muted)" : "var(--border-hover)" }}>
            {value === "none" && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--muted)" }} />}
          </div>
          <span className="font-medium text-muted text-[14px]">{noneLabel}</span>
        </div>
        <p className="text-muted-2 text-[12px] pl-6">Not needed — skip this section.</p>
      </button>

      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="text-left p-4 rounded-xl border transition-all duration-200"
            style={{
              borderColor: active ? accent : "var(--border-color)",
              backgroundColor: active ? `${accent}18` : "transparent",
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-all"
                style={{ borderColor: active ? accent : "var(--border-hover)" }}>
                {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />}
              </div>
              <span className="font-medium text-ink text-[14px] flex-1">{opt.label}</span>
              {opt.highlight && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                  style={{ backgroundColor: `${accent}22`, color: accent }}>
                  {opt.highlight}
                </span>
              )}
            </div>
            <div className="pl-6">
              <p className="text-muted text-[12px] leading-relaxed">{opt.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {opt.custom ? (
                  <span className="text-[12px] font-mono font-semibold" style={{ color: accent }}>Contact for pricing</span>
                ) : (
                  <>
                    {opt.oneTime && <span className="text-[12px] font-mono font-semibold" style={{ color: accent }}>{fmtUSD(opt.oneTime)} setup</span>}
                    {opt.monthly && <span className="text-[12px] font-mono text-muted">+ {fmtUSD(opt.monthly)}/mo</span>}
                  </>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  value, onChange, label, description, priceEach, accent = "var(--accent)", max = 20,
}: {
  value: number; onChange: (n: number) => void; label: string;
  description: string; priceEach: number; accent?: string; max?: number;
}) {
  return (
    <div className="p-4 rounded-xl border transition-all duration-200"
      style={{ borderColor: value > 0 ? accent : "var(--border-color)", backgroundColor: value > 0 ? `${accent}12` : "transparent" }}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <span className="font-medium text-ink text-[15px]">{label}</span>
        <span className="text-[13px] font-mono font-semibold" style={{ color: accent }}>{fmtUSD(priceEach)} each</span>
      </div>
      <p className="text-muted text-[13px] leading-relaxed mb-3">{description}</p>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}
          className="w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-lg transition-all duration-150 disabled:opacity-30"
          style={{ borderColor: "var(--border-hover)", color: "var(--ink)" }}>−</button>
        <span className="w-8 text-center font-mono font-semibold text-ink text-[15px]">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-lg transition-all duration-150 disabled:opacity-30"
          style={{ borderColor: "var(--border-hover)", color: "var(--ink)" }}>+</button>
        {value > 0 && (
          <span className="text-[13px] font-mono text-muted">= {fmtUSD(value * priceEach)}</span>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  accent, categoryLabel, title, description, icon, children, index, suggested,
}: {
  accent: string; categoryLabel: string; title: string; description?: string;
  icon: React.ReactNode; children: React.ReactNode; index: number; suggested?: boolean;
}) {
  return (
    <motion.div custom={index} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={fadeUp}
      className="rounded-2xl border p-6 transition-[border-color] duration-300"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}>
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-none w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}22`, color: accent }}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-mono uppercase tracking-widest" style={{ color: accent }}>{categoryLabel}</span>
            {suggested && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{ backgroundColor: `${BRAND.orange}22`, color: BRAND.orange }}>New</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-ink leading-tight">{title}</h2>
          {description && <p className="text-muted text-[13px] mt-1 leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="w-full h-px mb-5" style={{ backgroundColor: "var(--border-color)" }} />
      <div className="flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Quote() {
  const navigate = useNavigate();
  const [sel, setSel] = useState<Sel>(DEFAULT_SEL);

  const { oneTime, monthly, hasCustom, lines } = useMemo(() => computeQuote(sel), [sel]);

  function toggle(key: keyof Pick<Sel,
    "standardWebsite" | "emailSystem" | "mediaStorage" | "chatbot" |
    "ecommerce" | "booking" | "seo" | "customDashboard" | "workflows"
  >) {
    setSel(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function set<K extends keyof Sel>(key: K, val: Sel[K]) {
    setSel(prev => ({ ...prev, [key]: val }));
  }

  const isEmpty = lines.length === 0;

  function handleRequest() {
    if (isEmpty) return;
    const summary = lines.map(l => {
      const parts = [`• ${l.label}`];
      if (l.custom) parts.push("(custom pricing needed)");
      else {
        if (l.oneTime) parts.push(`${fmtUSD(l.oneTime)} setup`);
        if (l.monthly) parts.push(`${fmtUSD(l.monthly)}/mo`);
      }
      return parts.join(" — ");
    }).join("\n");

    const totals = [
      oneTime > 0 ? `One-time total: ${fmtUSD(oneTime)}` : null,
      monthly > 0 ? `Monthly recurring: ${fmtUSD(monthly)}/mo` : null,
      hasCustom ? "Some items require a custom quote." : null,
    ].filter(Boolean).join("\n");

    const message = `Hi! I used the Quote Builder and I'm interested in the following:\n\n${summary}\n\n${totals}\n\nPlease send me a detailed proposal!`;
    navigate("/contact", { state: { quoteMessage: message } });
  }

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Transparent Pricing</span>
          <h1 className="mt-2 text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.1] tracking-tight text-ink">
            Build Your{" "}
            <span className="italic" style={{
              fontFamily: "'DM Serif Display', serif",
              background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Custom Quote</span>
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-2xl mt-4">
            Select the features and services you need — prices update in real time. When you're ready, submit your estimate and I'll send a formal proposal within 24 hours.
          </p>
        </motion.div>
      </section>

      {/* ─── Builder ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* Left: service sections */}
          <div className="flex flex-col gap-5">

            {/* 1 — Website Foundation */}
            <SectionCard index={1} accent={BRAND.skyBlue} categoryLabel="Foundation" title="Website Package"
              description="Every Hoppy Tech project starts here. The standard package includes five fully responsive pages and an admin dashboard to manage your content."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}>
              <CheckOption checked={sel.standardWebsite} onChange={() => toggle("standardWebsite")}
                label="Standard Website Package"
                description="Home, About, Services / Portfolio / Testimonials, Contact (with intake form), and an Admin Dashboard — all fully responsive and optimized for speed."
                oneTime={400} accent={BRAND.skyBlue} />
            </SectionCard>

            {/* 2 — Website Add-Ons */}
            <SectionCard index={2} accent={BRAND.skyBlueLight} categoryLabel="Add-Ons" title="Website Enhancements"
              description="Optional services that expand what your website can do out of the box."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}>
              <CheckOption checked={sel.emailSystem} onChange={() => toggle("emailSystem")}
                label="Email System"
                description="Receive an email whenever a client submits your contact form, plus the ability to send newsletters and bulk emails from your own domain."
                monthly={20} accent={BRAND.skyBlueLight} />
              <CheckOption checked={sel.mediaStorage} onChange={() => toggle("mediaStorage")}
                label="Media & File Storage"
                description="Dedicated cloud storage for images, PDFs, and other files beyond the built-in contact intake. Scales with your usage."
                monthly={10} accent={BRAND.skyBlueLight}
                note="Starting at $10/mo — storage tiers expand as needed." />
            </SectionCard>

            {/* 3 — AI Tools */}
            <SectionCard index={3} accent={BRAND.orange} categoryLabel="Artificial Intelligence" title="AI-Powered Tools"
              description="Purpose-built AI features — from a smart chatbot on your site to a full enterprise knowledgebase your team can query in plain English."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}>
              <CheckOption checked={sel.chatbot} onChange={() => toggle("chatbot")}
                label="Context-Aware Website Chatbot"
                description="An AI assistant embedded on your site that understands your business, answers questions, qualifies leads, and routes visitors — available 24/7. Trained on your content and connected to your database."
                oneTime={250} monthly={15} accent={BRAND.orange}
                note="Based on standard usage. High-traffic sites may be adjusted." />

              <div>
                <p className="text-[13px] font-semibold text-ink mb-1 px-1">AI Knowledgebase (RAG)</p>
                <p className="text-muted text-[12px] mb-3 px-1 leading-relaxed">
                  A Retrieval-Augmented Generation system that indexes your documents, SOPs, product info, or internal knowledge — so your team or customers can ask questions in plain English and get accurate, source-cited answers instantly.
                </p>
                <TierSelector value={sel.ragTier} onChange={v => set("ragTier", v as Sel["ragTier"])}
                  accent={BRAND.orange} noneLabel="No Knowledgebase"
                  options={[
                    { value: "standard", label: "Standard", description: "Up to 500 documents, ~5K queries/month. Ideal for small teams, client-facing FAQs, or internal policy lookups.", oneTime: 2_500, monthly: 150 },
                    { value: "professional", label: "Professional", description: "Up to 5,000 documents, ~50K queries/month. For growing teams with large documentation sets or high query volume.", oneTime: 4_000, monthly: 250, highlight: "Popular" },
                    { value: "enterprise", label: "Enterprise", description: "Unlimited documents, unlimited queries, fine-tuned models, dedicated infrastructure, SLA, and priority support.", custom: true },
                  ]} />
              </div>
            </SectionCard>

            {/* 4 — Social Media */}
            <SectionCard index={4} accent={BRAND.skyBlue} categoryLabel="Social Media" title="Social Media Management"
              description="Let AI handle your social media presence — from scheduling and posting to full autonomous content management — so you can focus on running your business."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}>
              <TierSelector value={sel.socialTier} onChange={v => set("socialTier", v as Sel["socialTier"])}
                accent={BRAND.skyBlue} noneLabel="No Social Package"
                options={[
                  { value: "basic", label: "AI Social Management", description: "Automated posting, scheduling, and engagement across your social platforms. A consistent presence with zero manual effort.", monthly: 150 },
                  { value: "full", label: "Full Socials Package", description: "Everything in Basic plus a social media dashboard, unlimited AI-generated content tailored to your brand voice, and fully autonomous management. You define the strategy — it executes.", monthly: 500, highlight: "All-Inclusive" },
                ]} />
              {sel.socialTier === "full" && (
                <p className="text-[12px] italic px-1 mt-1" style={{ color: BRAND.skyBlue }}>
                  ✓ Full Socials includes unlimited AI content generation for your social channels — no need to purchase individual videos for social use below.
                </p>
              )}
            </SectionCard>

            {/* 5 — Video Content */}
            <SectionCard index={5} accent={BRAND.orange} categoryLabel="Content Generation" title="AI Video Production"
              description="Custom AI-generated video content — for ads, website backgrounds, product showcases, or brand storytelling. Each video is unique to your brand identity."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}>
              <Stepper value={sel.video30s} onChange={v => set("video30s", v)}
                label="30-Second AI Video"
                description="Short-form video perfect for social ads, reels, and website hero sections."
                priceEach={250} accent={BRAND.orange} />
              <Stepper value={sel.video60s} onChange={v => set("video60s", v)}
                label="60-Second AI Video"
                description="Longer content or a bundle of shorter clips totaling 60 seconds (minimum 10s per clip). Great for brand stories, explainers, or product demos."
                priceEach={400} accent={BRAND.orange} />
              {sel.socialTier !== "full" && (
                <p className="text-[12px] text-muted-2 px-1 italic">
                  Tip: The Full Socials Package ($500/mo) includes unlimited content generation for your social channels.
                </p>
              )}
            </SectionCard>

            {/* 6 — Business Intelligence */}
            <SectionCard index={6} accent={BRAND.skyBlue} categoryLabel="Intelligence" title="Business Intelligence & Vision"
              description="Advanced AI that turns your operational data and visual feeds into a competitive advantage."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-1 px-1">Computer Vision Integration</p>
                <p className="text-muted text-[12px] mb-3 px-1 leading-relaxed">
                  Give your business the ability to see and understand images and video. Use cases include product defect detection, visual search for e-commerce, document scanning (OCR), customer flow analysis, inventory counting, and safety monitoring.
                </p>
                <TierSelector value={sel.cvTier} onChange={v => set("cvTier", v as Sel["cvTier"])}
                  accent={BRAND.skyBlue} noneLabel="No Computer Vision"
                  options={[
                    { value: "standard", label: "Standard", description: "Uses pre-built cloud vision APIs — image classification, OCR, object detection, label detection, face detection. Fast to deploy, ideal for common use cases.", oneTime: 1_500, monthly: 100 },
                    { value: "custom", label: "Custom Models", description: "Train a model on your own data for specialized detection (unique product defects, proprietary objects, or domain-specific workflows). Built precisely for your needs.", oneTime: 3_500, monthly: 200 },
                    { value: "enterprise", label: "Enterprise", description: "Real-time multi-camera video pipelines, high-volume inference, edge or on-premise deployment, and dedicated infrastructure.", custom: true },
                  ]} />
              </div>

              <div className="mt-2">
                <p className="text-[13px] font-semibold text-ink mb-1 px-1">Predictive Analytics</p>
                <p className="text-muted text-[12px] mb-3 px-1 leading-relaxed">
                  Turn your historical business data into forward-looking insights. Forecast sales, predict customer churn, optimize inventory, score leads, and identify problems before they happen — all surfaced in a dashboard built for your team.
                </p>
                <TierSelector value={sel.analyticsTier} onChange={v => set("analyticsTier", v as Sel["analyticsTier"])}
                  accent={BRAND.skyBlue} noneLabel="No Predictive Analytics"
                  options={[
                    { value: "standard", label: "Standard", description: "1–2 prediction models, monthly reports, up to 100K rows of data. Best for sales forecasting or basic churn analysis.", oneTime: 2_000, monthly: 150 },
                    { value: "professional", label: "Professional", description: "Up to 5 models, real-time dashboard, up to 1M rows, weekly insights. Covers multiple business domains simultaneously.", oneTime: 3_500, monthly: 250, highlight: "Popular" },
                    { value: "enterprise", label: "Enterprise", description: "Unlimited models, streaming data pipelines, custom integrations, dedicated analyst hours, and white-glove onboarding.", custom: true },
                  ]} />
              </div>
            </SectionCard>

            {/* 7 — Additional Services */}
            <SectionCard index={7} accent={BRAND.orangeLight} categoryLabel="Additional Services" title="Expand Your Platform"
              description="Popular add-ons that extend your digital presence. Mix and match to fit your workflow — each integrates directly with your existing Hoppy Tech setup."
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              suggested>
              <CheckOption checked={sel.ecommerce} onChange={() => toggle("ecommerce")}
                label="E-Commerce Module"
                description="Add a full online store — product catalog, shopping cart, Stripe payments, and order management in your admin dashboard. Payment processing fees (2.9% + 30¢/transaction) are passed through directly from Stripe."
                oneTime={500} accent={BRAND.orangeLight} />
              <CheckOption checked={sel.booking} onChange={() => toggle("booking")}
                label="Booking & Appointment System"
                description="Online self-booking, availability calendar, automated email/SMS confirmations, and Google/Outlook calendar sync. Customers book themselves — no back-and-forth required."
                oneTime={300} monthly={15} accent={BRAND.orangeLight} />
              <CheckOption checked={sel.seo} onChange={() => toggle("seo")}
                label="SEO Foundation Package"
                description="Technical SEO audit and fixes, meta tags, schema markup, XML sitemap, Google Analytics 4, Google Search Console integration, and core page speed optimization."
                oneTime={200} accent={BRAND.orangeLight} />
              <CheckOption checked={sel.customDashboard} onChange={() => toggle("customDashboard")}
                label="Custom Analytics Dashboard"
                description="A visual BI dashboard showing your most important KPIs — pulled from your website, CRM, sales tools, or other data sources. Exportable reports included."
                oneTime={600} monthly={25} accent={BRAND.orangeLight} />
              <Stepper value={sel.apiIntegrations} onChange={v => set("apiIntegrations", v)}
                label="Third-Party API Integrations"
                description="Connect your site or app to external tools — CRMs (HubSpot, Salesforce), ERPs, shipping APIs, payment processors, or any service with an API. Priced per integration."
                priceEach={200} accent={BRAND.orangeLight} />
              <CheckOption checked={sel.workflows} onChange={() => toggle("workflows")}
                label="Automated Business Workflows"
                description="Custom automation for repetitive operations: lead nurturing, invoice generation, report distribution, data syncing between tools, or any process that currently requires manual steps."
                oneTime={750} monthly={50} accent={BRAND.orangeLight} />

              <div>
                <p className="text-[13px] font-semibold text-ink mb-1 px-1">Mobile App (iOS & Android)</p>
                <p className="text-muted text-[12px] mb-3 px-1 leading-relaxed">
                  A native mobile app to complement your web presence. Note: Apple Developer ($99/yr) and Google Play ($25 one-time) accounts are required separately and not included.
                </p>
                <TierSelector value={sel.mobileApp} onChange={v => set("mobileApp", v as Sel["mobileApp"])}
                  accent={BRAND.orangeLight} noneLabel="No Mobile App"
                  options={[
                    { value: "basic", label: "Basic App", description: "Mirrors your website's core features with push notifications. Ideal for service businesses that want a branded app experience.", oneTime: 2_500 },
                    { value: "full", label: "Full-Featured App", description: "Unique functionality beyond the website — custom navigation, offline mode, native device features (camera, GPS, biometrics), or complex integrations.", custom: true },
                  ]} />
              </div>
            </SectionCard>

          </div>

          {/* Right: sticky quote summary */}
          <div className="lg:sticky lg:top-[88px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}>
              <h2 className="text-xl font-bold text-ink mb-1">Your Estimate</h2>
              <p className="text-muted text-[12px] mb-5 leading-relaxed">
                Select services on the left to build your quote. Prices are estimates — a detailed proposal with exact figures follows your inquiry.
              </p>

              {isEmpty ? (
                <div className="rounded-xl p-6 text-center mb-5"
                  style={{ backgroundColor: "var(--surface-alpha)", border: "1px dashed var(--border-hover)" }}>
                  <svg className="w-8 h-8 mx-auto mb-2 text-muted-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-muted text-[13px]">No services selected yet.<br />Choose options to see pricing.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 mb-5 max-h-72 overflow-y-auto pr-1">
                  {lines.map((line, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b last:border-0"
                      style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-ink text-[13px] leading-snug flex-1">{line.label}</span>
                      <div className="flex flex-col items-end text-right flex-none">
                        {line.custom ? (
                          <span className="text-[11px] font-mono text-accent">Custom</span>
                        ) : (
                          <>
                            {line.oneTime && <span className="text-[12px] font-mono text-ink">{fmtUSD(line.oneTime)}</span>}
                            {line.monthly && <span className="text-[11px] font-mono text-muted">{fmtUSD(line.monthly)}/mo</span>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isEmpty && (
                <>
                  <div className="w-full h-px mb-4" style={{ backgroundColor: "var(--border-color)" }} />
                  {oneTime > 0 && (
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-muted text-[13px]">One-time setup</span>
                      <span className="text-2xl font-bold text-ink font-mono">{fmtUSD(oneTime)}</span>
                    </div>
                  )}
                  {monthly > 0 && (
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-muted text-[13px]">Monthly recurring</span>
                      <span className="text-xl font-bold font-mono text-accent">
                        {fmtUSD(monthly)}<span className="text-[14px] font-normal text-muted">/mo</span>
                      </span>
                    </div>
                  )}
                  {hasCustom && (
                    <p className="text-[11px] italic text-muted mt-1">
                      * Some selections require a custom quote — exact pricing will be in your proposal.
                    </p>
                  )}
                </>
              )}

              <div className="mt-5 flex flex-col gap-3">
                <button onClick={handleRequest} disabled={isEmpty}
                  className="w-full py-3.5 px-6 font-semibold rounded-xl text-[15px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                  onMouseEnter={e => { if (!isEmpty) (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px color-mix(in srgb, var(--accent) 30%, transparent)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  Request This Quote
                </button>
                {!isEmpty && (
                  <button onClick={() => setSel(DEFAULT_SEL)}
                    className="w-full py-2.5 text-[13px] font-medium rounded-xl border transition-all duration-200 text-muted"
                    style={{ borderColor: "var(--border-color)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-color)")}>
                    Reset selections
                  </button>
                )}
              </div>

              <p className="text-[11px] text-muted-2 mt-4 text-center leading-relaxed">
                All estimates are approximate. A formal proposal with exact pricing, timeline, and terms follows your inquiry.
              </p>
            </motion.div>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
