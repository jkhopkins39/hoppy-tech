import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { MsgContent } from "../lib/chatFormat";
import { BRAND } from "../config/brandColors";
import { DEFAULT_SEL, computeQuote, fmtUSD, type Sel } from "../lib/quoteEngine";

// ─── Conversation step machine ────────────────────────────────────────────────

type Interest = "website" | "chatbot" | "ecommerce" | "mobile" | "unsure" | null;

interface Option {
  label: string;
  sublabel?: string;
  apply: (sel: Sel) => Sel;
}

interface Step {
  id: string;
  prompt: (sel: Sel, interest: Interest) => string;
  skip?: (sel: Sel, interest: Interest) => boolean;
  options: (sel: Sel, interest: Interest) => Option[];
}

const YES_NO = (
  prompt: string,
  key: keyof Pick<Sel, "chatbot" | "ecommerce" | "booking" | "emailSystem" | "mediaStorage" | "seo" | "customDashboard" | "workflows">,
  yesLabel: string,
  noLabel = "No thanks, skip it",
  skip?: (sel: Sel, interest: Interest) => boolean,
): Step => ({
  id: key,
  prompt: () => prompt,
  skip,
  options: () => [
    { label: yesLabel, apply: (sel) => ({ ...sel, [key]: true }) },
    { label: noLabel, apply: (sel) => ({ ...sel, [key]: false }) },
  ],
});

const STEPS: Step[] = [
  {
    id: "standardWebsite",
    prompt: (_sel, interest) =>
      interest === "chatbot"
        ? "Since you already have a site, want me to include a full site refresh too — or just the chatbot?"
        : "Every project starts with the same solid foundation: 5 responsive pages (Home, About, Services/Portfolio, Testimonials, Contact) plus an admin dashboard. Include the Standard Website Package?",
    options: () => [
      { label: "Yes, include it — $400", apply: (sel) => ({ ...sel, standardWebsite: true }) },
      { label: "No thanks, skip it", apply: (sel) => ({ ...sel, standardWebsite: false }) },
    ],
  },
  YES_NO(
    "Want an AI chatbot on your site? It answers questions, qualifies leads, and routes visitors 24/7 — trained on your content.",
    "chatbot",
    "Yes — $250 setup + $15/mo",
    "No thanks",
    (sel) => sel.chatbot === true,
  ),
  YES_NO(
    "Selling products or services online? The E-Commerce Module adds a full store with Stripe payments and order management.",
    "ecommerce",
    "Yes — $350 one-time",
    "No thanks",
    (sel) => sel.ecommerce === true,
  ),
  {
    id: "mobileApp",
    prompt: () => "Do you need a companion mobile app for iOS and Android?",
    options: () => [
      { label: "No mobile app needed", apply: (sel) => ({ ...sel, mobileApp: "none" }) },
      { label: "Basic app — $2,500", sublabel: "Mirrors your site with push notifications", apply: (sel) => ({ ...sel, mobileApp: "basic" }) },
      { label: "Full-featured — custom scope", sublabel: "Unique features, offline mode, native device access", apply: (sel) => ({ ...sel, mobileApp: "full" }) },
    ],
  },
  YES_NO(
    "Need customers to self-book appointments? Includes a calendar sync and automated confirmations.",
    "booking",
    "Yes — $200 setup + $15/mo",
  ),
  YES_NO(
    "Want a built-in email system — contact form notifications plus the ability to send newsletters from your own domain?",
    "emailSystem",
    "Yes — $20/mo",
  ),
  YES_NO(
    "Need extra cloud storage for images, PDFs, or other files beyond the basics?",
    "mediaStorage",
    "Yes — starting at $10/mo",
  ),
  YES_NO(
    "Want the SEO Foundation Package? Technical audit, meta tags, schema markup, sitemap, GA4, and Search Console setup.",
    "seo",
    "Yes — $200 one-time",
  ),
  YES_NO(
    "Would a custom analytics dashboard help — a visual view of your key business metrics pulled from your site, CRM, or sales tools?",
    "customDashboard",
    "Yes — $600 setup + $25/mo",
  ),
  {
    id: "apiIntegrations",
    prompt: () => "How many third-party integrations do you need — CRM, ERP, shipping, payment processors? Each is $200.",
    options: () => [
      { label: "None needed", apply: (sel) => ({ ...sel, apiIntegrations: 0 }) },
      { label: "1 integration — $200", apply: (sel) => ({ ...sel, apiIntegrations: 1 }) },
      { label: "2 integrations — $400", apply: (sel) => ({ ...sel, apiIntegrations: 2 }) },
      { label: "3 or more", sublabel: "We'll finalize the exact count on your call", apply: (sel) => ({ ...sel, apiIntegrations: 3 }) },
    ],
  },
  YES_NO(
    "Any repetitive manual processes we could automate — lead nurturing, invoice generation, report distribution, data syncing?",
    "workflows",
    "Yes — $750 setup + $50/mo",
  ),
  {
    id: "socialTier",
    prompt: () =>
      "Want help managing your social media? Every paid tier includes scheduling, posting, and a dashboard — the difference is how much AI-generated content we produce for you.",
    options: () => [
      { label: "No thanks", apply: (sel) => ({ ...sel, socialTier: "none" }) },
      { label: "Basic — $150/mo", sublabel: "You provide the content, we schedule & post", apply: (sel) => ({ ...sel, socialTier: "basic" }) },
      { label: "Full — $400/mo", sublabel: "Adds up to 3 min of AI video/month", apply: (sel) => ({ ...sel, socialTier: "full" }) },
      { label: "Elite — $1,337/mo", sublabel: "Up to 15 min of AI video + dedicated posting app", apply: (sel) => ({ ...sel, socialTier: "elite" }) },
    ],
  },
  {
    id: "video",
    prompt: () => "Need any one-off AI-generated videos — for ads, hero sections, or product showcases?",
    skip: (sel) => sel.socialTier === "full" || sel.socialTier === "elite",
    options: () => [
      { label: "No videos needed", apply: (sel) => sel },
      { label: "Add a 30s video — $125", apply: (sel) => ({ ...sel, video30s: sel.video30s + 1 }) },
      { label: "Add a 60s video — $225", apply: (sel) => ({ ...sel, video60s: sel.video60s + 1 }) },
      { label: "Add both", apply: (sel) => ({ ...sel, video30s: sel.video30s + 1, video60s: sel.video60s + 1 }) },
    ],
  },
];

const INTRO_PROMPT = "Hi! I'm Jeremy's assistant. What are you looking to build?";

interface IntroOption {
  label: string;
  sublabel?: string;
  interest: Interest;
  enterprise?: boolean;
  applyInitial?: (sel: Sel) => Sel;
}

const INTRO_OPTIONS: IntroOption[] = [
  { label: "A brand-new website", interest: "website" },
  { label: "Just a chatbot for my existing site", interest: "chatbot", applyInitial: (sel) => ({ ...sel, chatbot: true, standardWebsite: false }) },
  { label: "An online store", interest: "ecommerce", applyInitial: (sel) => ({ ...sel, ecommerce: true }) },
  { label: "A mobile app", interest: "mobile" },
  { label: "Not sure yet — walk me through everything", interest: "unsure" },
  { label: "Enterprise AI — BI, RAG, or computer vision", interest: null, enterprise: true, sublabel: "Business intelligence, knowledgebases, predictive analytics" },
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

function nextStepIndex(from: number, sel: Sel, interest: Interest) {
  let i = from;
  while (i < STEPS.length && STEPS[i].skip?.(sel, interest)) i++;
  return i;
}

export default function Quote() {
  const navigate = useNavigate();
  const [interest, setInterest] = useState<Interest>(null);
  const [sel, setSel] = useState<Sel>(DEFAULT_SEL);
  const [stepPointer, setStepPointer] = useState(-1); // -1 = intro, STEPS.length = final, -2 = enterprise redirect
  const [messages, setMessages] = useState<ChatMsg[]>([{ id: 0, role: "assistant", text: INTRO_PROMPT }]);
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
    const bullets = ls
      .map((l) => {
        if (l.custom) return `- ${l.label} — custom pricing`;
        const parts = [l.label];
        if (l.oneTime) parts.push(`${fmtUSD(l.oneTime)} setup`);
        if (l.monthly) parts.push(`${fmtUSD(l.monthly)}/mo`);
        return `- ${parts.join(" — ")}`;
      })
      .join("\n");
    const totals = [
      ot > 0 ? `**One-time total: ${fmtUSD(ot)}**` : null,
      mo > 0 ? `**Monthly recurring: ${fmtUSD(mo)}/mo**` : null,
      hc ? "*Some selections require a custom quote — exact pricing will be in your proposal.*" : null,
    ]
      .filter(Boolean)
      .join("\n");
    return `Here's what we've got so far:\n\n${bullets}\n\n${totals}\n\nReady to send this to Jeremy?`;
  }

  function goToStep(pointer: number, currentSel: Sel, currentInterest: Interest) {
    const idx = nextStepIndex(pointer, currentSel, currentInterest);
    setStepPointer(idx);
    if (idx >= STEPS.length) {
      pushMessage("assistant", summaryText(currentSel));
    } else {
      pushMessage("assistant", STEPS[idx].prompt(currentSel, currentInterest));
    }
  }

  function handleIntroOption(opt: IntroOption) {
    pushMessage("user", opt.label);
    if (opt.enterprise) {
      setStepPointer(-2);
      pushMessage(
        "assistant",
        "Business Intelligence, RAG knowledgebases, and computer vision are enterprise-grade builds — the fastest path is a quick call with Jeremy so we can scope it properly.",
      );
      return;
    }
    setInterest(opt.interest);
    const newSel = opt.applyInitial ? opt.applyInitial(sel) : sel;
    setSel(newSel);
    goToStep(0, newSel, opt.interest);
  }

  function handleStepOption(opt: Option) {
    pushMessage("user", opt.label);
    const newSel = opt.apply(sel);
    setSel(newSel);
    goToStep(stepPointer + 1, newSel, interest);
  }

  function handleReset() {
    setInterest(null);
    setSel(DEFAULT_SEL);
    setStepPointer(-1);
    setMessages([{ id: 0, role: "assistant", text: INTRO_PROMPT }]);
    idRef.current = 1;
  }

  function handleRequestQuote() {
    const message = summaryRequestMessage(sel);
    navigate("/contact", { state: { quoteMessage: message } });
  }

  function summaryRequestMessage(currentSel: Sel) {
    const { oneTime: ot, monthly: mo, hasCustom: hc, lines: ls } = computeQuote(currentSel);
    const summary = ls
      .map((l) => {
        const parts = [`• ${l.label}`];
        if (l.custom) parts.push("(custom pricing needed)");
        else {
          if (l.oneTime) parts.push(`${fmtUSD(l.oneTime)} setup`);
          if (l.monthly) parts.push(`${fmtUSD(l.monthly)}/mo`);
        }
        return parts.join(" — ");
      })
      .join("\n");
    const totals = [
      ot > 0 ? `One-time total: ${fmtUSD(ot)}` : null,
      mo > 0 ? `Monthly recurring: ${fmtUSD(mo)}/mo` : null,
      hc ? "Some items require a custom quote." : null,
    ]
      .filter(Boolean)
      .join("\n");
    return `Hi! I used the Guided Quote chat and I'm interested in the following:\n\n${summary}\n\n${totals}\n\nPlease send me a detailed proposal!`;
  }

  const showingIntro = stepPointer === -1;
  const showingEnterpriseRedirect = stepPointer === -2;
  const showingFinal = stepPointer >= STEPS.length && !showingEnterpriseRedirect && !showingIntro;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Transparent Pricing</span>
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
            Answer a few quick questions — mostly with a tap, not typing — and I'll build a live estimate as we go.
          </p>
        </motion.div>
      </section>

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
          <div className="flex flex-col gap-3 px-5 py-5 max-h-[520px] overflow-y-auto">
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

          {/* Options / actions */}
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
                  {opt.sublabel && <p className="text-muted text-[12px] mt-0.5">{opt.sublabel}</p>}
                </button>
              ))}

            {!showingIntro && !showingFinal && !showingEnterpriseRedirect && stepPointer < STEPS.length &&
              STEPS[stepPointer].options(sel, interest).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleStepOption(opt)}
                  className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200"
                  style={{ borderColor: "var(--border-color)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)")}
                >
                  <span className="font-medium text-ink text-[14px]">{opt.label}</span>
                  {opt.sublabel && <p className="text-muted text-[12px] mt-0.5">{opt.sublabel}</p>}
                </button>
              ))}

            {showingEnterpriseRedirect && (
              <>
                <button
                  onClick={() => navigate("/enterprise")}
                  className="w-full py-3.5 px-6 font-semibold rounded-xl text-[15px] transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  View Enterprise Solutions →
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-2.5 text-[13px] font-medium rounded-xl border transition-all duration-200 text-muted"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  Actually, let's talk simple projects
                </button>
              </>
            )}

            {showingFinal && (
              <>
                {!isEmpty && (
                  <button
                    onClick={handleRequestQuote}
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

        {/* Enterprise pointer */}
        <p className="text-center text-muted text-[13px] mt-6">
          Need enterprise-grade AI, BI, or a RAG knowledgebase?{" "}
          <button onClick={() => navigate("/enterprise")} className="underline font-medium" style={{ color: BRAND.skyBlue }}>
            Explore Enterprise Solutions →
          </button>
        </p>
      </section>

      <Footer />
    </>
  );
}
