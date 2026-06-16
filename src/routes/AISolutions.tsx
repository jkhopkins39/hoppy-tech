import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { BRAND } from "../config/brandColors";

const solutions = [
  {
    id: "chatbot",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "AI Chatbots & Assistants",
    tagline: "Always-on support that actually helps",
    accent: BRAND.skyBlue,
    summary: "Deploy a custom AI assistant that knows your business inside out — answering questions, qualifying leads, and handling support 24/7.",
    details: [
      "Trained on your product docs, FAQs, and policies",
      "Handles customer support, bookings, and lead capture",
      "Seamlessly hands off complex issues to your team",
      "Access to database, with RAG capabilities",
      "Many more options available upon request"
    ],
    example: "A law firm's chatbot handles initial consultations, collects case details, and schedules follow-ups — freeing attorneys for billable work.",
  },
  {
    id: "automation",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Workflow Automation",
    tagline: "Eliminate the busywork",
    accent: BRAND.orange,
    summary: "Let AI handle repetitive tasks such as data entry, email routing, and report generation, so you can focus on high-value work.",
    details: [
      "Automated invoice processing and data extraction",
      "Smart email triage and auto-responses",
      "Scheduled reporting and analytics summaries",
      "CRM updates triggered by customer interactions",
    ],
    example: "An e-commerce store automatically tags and routes customer emails, generates daily inventory reports, and drafts responses to common inquiries.",
  },
  {
    id: "content",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Content Generation",
    tagline: "Scale your voice, not your headcount",
    accent: BRAND.skyBlueLight,
    summary: "Generate on-brand blog posts, product descriptions, social content, and marketing copy at scale — all in your unique voice.",
    details: [
      "Blog articles, SEO content, and landing pages",
      "Product descriptions for entire catalogs",
      "Social media posts and ad copy variations",
      "Personalized email campaigns",
    ],
    example: "A retailer with 10,000 SKUs uses AI to write compelling product descriptions in minutes, cutting content costs by 80%.",
  },
  {
    id: "search",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Intelligent Search",
    tagline: "Find anything, understand everything",
    accent: BRAND.navyMid,
    summary: "Replace clunky keyword search with semantic AI search that understands intent — across your docs, products, or knowledge base.",
    details: [
      "Unified search platform to retrieve internal data from multiple sources",
      "Product recommendation engines",
      "Smart autocomplete and query suggestions",
    ],
    example: "A SaaS company's support portal answers questions in plain English by searching thousands of documentation pages instantly.",
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
    tagline: "Teach your app to see",
    accent: BRAND.orangeLight,
    summary: "Analyze images and video to detect objects, extract text, verify identities, or automate quality control processes.",
    details: [
      "Zoom meeting audio/video analysis for updating internal documentation and policies",
      "Product image tagging and classification",
      "Document OCR and data extraction",
      "Quality control and defect detection",
    ],
    example: "A manufacturing company uses computer vision to inspect parts on the assembly line, catching defects in real time before they ship.",
  },
  {
    id: "analytics",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Predictive Analytics",
    tagline: "Know what's coming before it arrives",
    accent: BRAND.skyBlue,
    summary: "Use your historical data to forecast sales, anticipate churn, optimize inventory, and make smarter decisions faster.",
    details: [
      "Sales and demand forecasting",
      "Customer churn prediction and retention triggers",
      "Dynamic pricing and inventory optimization",
      "Anomaly detection and fraud prevention",
    ],
    example: "A subscription business predicts which customers are likely to cancel 30 days early, triggering personalized retention offers.",
  },
];

export default function AISolutions() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-accent text-[13px] font-mono uppercase tracking-widest">AI Applications</span>
            <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-ink">
              What AI can do<br />
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
                for your business
              </span>
            </h1>
            <p className="mt-4 text-muted text-lg leading-relaxed max-w-2xl">
              In the age of AI, don't fall behind the curve. There are a lot of ways you can leverage AI for your business needs to save money, time, and manpower, as
              well as gain insights and optimize how you get things done.
            </p>
          </motion.div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {solutions.map((s, i) => {
              const isFlipped = activeId === s.id;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-[300px]"
                  style={{ perspective: "1000px" }}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Front face */}
                    <div
                      className="absolute inset-0 p-6 rounded-2xl border cursor-pointer flex flex-col transition-colors duration-200"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--surface)",
                      }}
                      onClick={() => setActiveId(s.id)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = s.accent + "80";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)";
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-none"
                        style={{ background: `${s.accent}22`, color: s.accent }}
                      >
                        {s.icon}
                      </div>
                      <h3 className="font-semibold text-ink text-base mb-1">{s.title}</h3>
                      <p className="text-[13px] font-medium mb-2" style={{ color: s.accent }}>{s.tagline}</p>
                      <p className="text-muted text-sm leading-relaxed flex-1 line-clamp-3">{s.summary}</p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium flex-none" style={{ color: s.accent }}>
                        <span>See details</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Back face */}
                    <div
                      className="absolute inset-0 p-6 rounded-2xl border flex flex-col"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderColor: `${s.accent}40`,
                        background: `linear-gradient(135deg, ${s.accent}0A 0%, ${s.accent}04 100%)`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-4 flex-none">
                        <h3 className="font-semibold text-ink text-sm">{s.title}</h3>
                        <button
                          onClick={() => setActiveId(null)}
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: s.accent }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back
                        </button>
                      </div>
                      <ul className="space-y-2 flex-1">
                        {s.details.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-muted text-xs leading-relaxed">
                            <svg
                              className="w-3.5 h-3.5 mt-0.5 flex-none"
                              style={{ color: s.accent }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {d}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/contact"); }}
                        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] flex-none"
                        style={{ backgroundColor: s.accent, color: "#fff" }}
                      >
                        Build this for me →
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden p-10 md:p-14 text-center"
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 100%)",
              border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-ink mb-3"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Not sure where to start?
            </h2>
            <p className="text-muted text-lg max-w-xl mx-auto mb-8">
              I get it, there's a lot of options. If it wasn't mentioned here, reach out to me with your idea and we can make it happen!
            </p>
            <button
              onClick={() => navigate("/contact")}
              className="px-8 py-4 font-semibold rounded-xl text-white transition-all duration-200 hover:scale-[1.02] text-[15px]"
              style={{
                backgroundColor: "var(--accent)",
                boxShadow: "0 8px 30px color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
            >
              Let's Talk
            </button>
          </motion.div>
        </section>
      </div>

      <Footer />
    </>
  );
}
