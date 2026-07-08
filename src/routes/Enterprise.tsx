import { motion } from "framer-motion";
import Footer from "../components/Footer";
import CalendlyEmbed from "../components/CalendlyEmbed";
import { BRAND } from "../config/brandColors";

const solutions = [
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

export default function Enterprise() {
  return (
    <>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Enterprise AI & Business Intelligence</span>
            <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-ink">
              This isn't a checkout page.<br />
              <span
                className="italic"
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  background: `linear-gradient(135deg, ${BRAND.skyBlueLight}, ${BRAND.skyBlue})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  paddingRight: "0.1em",
                }}
              >
                It's a strategy session.
              </span>
            </h1>
            <p className="mt-4 text-muted text-lg leading-relaxed max-w-2xl">
              Business intelligence, RAG knowledgebases, computer vision, and predictive analytics touch your real data
              and real infrastructure — that deserves a conversation, not a set of checkboxes. Scroll down to book 30
              minutes directly on my calendar.
            </p>
          </motion.div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {solutions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border p-6 flex flex-col"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-none"
                  style={{ background: `${s.accent}22`, color: s.accent }}
                >
                  {s.icon}
                </div>
                <h3 className="font-semibold text-ink text-lg mb-1">{s.title}</h3>
                <p className="text-[13px] font-medium mb-2" style={{ color: s.accent }}>{s.tagline}</p>
                <p className="text-muted text-sm leading-relaxed mb-4">{s.summary}</p>
                <ul className="space-y-2 mt-auto">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-muted text-xs leading-relaxed">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-none" style={{ color: s.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Scheduling */}
        <section id="schedule" className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Schedule a Strategy Call
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Pick a time that works and we'll meet over Zoom to scope your project — no obligation, no sales pitch.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}
          >
            <CalendlyEmbed />
          </motion.div>
        </section>
      </div>

      <Footer />
    </>
  );
}
