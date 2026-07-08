import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { MsgContent } from "../lib/chatFormat";
import { BRAND } from "../config/brandColors";
import { DEFAULT_SEL, computeQuote, fmtUSD, type Sel } from "../lib/quoteEngine";

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
  options: { value: string | number; label: string }[];
  noneValue: string | number;
}

type Field = CheckboxField | TierField;

function checkboxField(key: keyof Sel, label: string, price: string): CheckboxField {
  return { kind: "checkbox", key, label, price, onValue: true, offValue: false };
}

function videoField(key: "video30s" | "video60s", label: string, price: string): CheckboxField {
  return { kind: "checkbox", key, label, price, onValue: 1, offValue: 0 };
}

function tierField(key: keyof Sel, label: string, options: { value: string | number; label: string }[], noneValue: string | number): TierField {
  return { kind: "tier", key, label, options, noneValue };
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
      checkboxField("standardWebsite", "Standard Website Package", "$400"),
      checkboxField("chatbot", "AI Chatbot", "$250 + $15/mo"),
      checkboxField("ecommerce", "E-Commerce Module", "$350"),
    ],
  },
  {
    id: "operations",
    prompt: () => "Any of these operational add-ons sound useful?",
    fields: () => [
      checkboxField("booking", "Booking & Appointments", "$200 + $15/mo"),
      checkboxField("emailSystem", "Email System", "$20/mo"),
      checkboxField("mediaStorage", "Media & File Storage", "$10/mo"),
    ],
  },
  {
    id: "growth",
    prompt: () => "What about these growth tools?",
    fields: () => [
      checkboxField("seo", "SEO Foundation Package", "$200"),
      checkboxField("customDashboard", "Custom Analytics Dashboard", "$600 + $25/mo"),
      checkboxField("workflows", "Automated Business Workflows", "$750 + $50/mo"),
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
          { value: "basic", label: "Basic — $2,500" },
          { value: "full", label: "Full-featured — custom" },
        ],
        "none",
      ),
      tierField(
        "apiIntegrations",
        "API Integrations",
        [
          { value: 0, label: "None" },
          { value: 1, label: "1 — $200" },
          { value: 2, label: "2 — $400" },
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
            { value: "basic", label: "Basic — $150/mo" },
            { value: "full", label: "Full — $400/mo" },
            { value: "elite", label: "Elite — $1,337/mo" },
          ],
          "none",
        ),
      ];
      if (sel.socialTier !== "full" && sel.socialTier !== "elite") {
        fields.push(videoField("video30s", "30s AI Video", "$125"));
        fields.push(videoField("video60s", "60s AI Video", "$225"));
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

export default function Quote() {
  const navigate = useNavigate();
  const [interest, setInterest] = useState<Interest>(null);
  const [sel, setSel] = useState<Sel>(DEFAULT_SEL);
  const [batchPointer, setBatchPointer] = useState(-1); // -1 = intro, BATCHES.length = final
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

  const showingIntro = batchPointer === -1;
  const showingFinal = batchPointer >= BATCHES.length;
  const activeBatch = !showingIntro && !showingFinal ? BATCHES[batchPointer] : null;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Get a Quote</span>
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
            Answer a few quick rounds of questions — tap whatever applies, then continue — and I'll build a live estimate as we go.
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

        {/* Enterprise pointer — separate page, not part of this flow */}
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
