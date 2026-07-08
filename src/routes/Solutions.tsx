import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { BRAND } from "../config/brandColors";

const solutions = [
  {
    id: "websites",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: "Websites & Web Apps",
    tagline: "Fast, modern, and built to convert",
    accent: BRAND.skyBlue,
    summary: "A fully responsive site with an admin dashboard you actually control — no developer required for everyday updates.",
    details: [
      "5 responsive pages plus an admin dashboard",
      "SEO foundation, analytics, and speed optimization available",
      "E-commerce and booking modules drop right in",
      "Hosted, maintained, and built to scale with you",
    ],
    example: "A local service business launches a 5-page site with an admin dashboard — they update pricing and photos themselves, no developer needed.",
  },
  {
    id: "chatbot",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "AI Chatbots & Assistants",
    tagline: "Always-on support that actually helps",
    accent: BRAND.orange,
    summary: "A custom AI assistant that knows your business inside out — answering questions, qualifying leads, and handling support 24/7.",
    details: [
      "Trained on your product docs, FAQs, and policies",
      "Handles customer support, bookings, and lead capture",
      "Seamlessly hands off complex issues to your team",
      "Button-driven quote builder just like this site's own",
    ],
    example: "A law firm's chatbot handles initial consultations, collects case details, and schedules follow-ups — freeing attorneys for billable work.",
  },
  {
    id: "ecommerce",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Online Stores",
    tagline: "Sell products without the platform fees",
    accent: BRAND.skyBlueLight,
    summary: "A full e-commerce module — product catalog, cart, and Stripe payments — built directly into your own site and dashboard.",
    details: [
      "Product catalog and shopping cart",
      "Stripe payments with transparent processing fees",
      "Order management inside your admin dashboard",
      "Pairs well with booking and email add-ons",
    ],
    example: "A boutique retailer replaces a $40/mo storefront subscription with a one-time build they fully own.",
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
    accent: BRAND.orangeLight,
    summary: "Let automation handle repetitive tasks — data entry, email routing, report generation — so you focus on higher-value work.",
    details: [
      "Automated invoice processing and data extraction",
      "Smart email triage and auto-responses",
      "Scheduled reporting and analytics summaries",
      "CRM updates triggered by customer interactions",
    ],
    example: "An e-commerce store automatically tags and routes customer emails and drafts responses to common inquiries.",
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
    accent: BRAND.skyBlue,
    summary: "Generate on-brand blog posts, product descriptions, social content, and marketing copy at scale — all in your unique voice.",
    details: [
      "Blog articles, SEO content, and landing pages",
      "Product descriptions for entire catalogs",
      "Social media posts and ad copy variations",
      "Bundled with the Social Media Management add-on",
    ],
    example: "A retailer with 10,000 SKUs uses AI to write compelling product descriptions in minutes, cutting content costs by 80%.",
  },
  {
    id: "mobile",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile Apps",
    tagline: "Take your brand to iOS & Android",
    accent: BRAND.navyMid,
    summary: "A native mobile app that complements your web presence — from a simple branded shell to a fully custom build.",
    details: [
      "Basic tier mirrors your website with push notifications",
      "Full-featured tier adds native device access and offline mode",
      "Apple Developer and Google Play accounts required separately",
      "Scoped and priced during your guided quote",
    ],
    example: "A service business launches a basic branded app so loyal customers can book and get push notifications without opening a browser.",
  },
];

export default function Solutions() {
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
            <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Websites, Chatbots & Apps</span>
            <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-ink">
              Built to ship,<br />
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
                priced in minutes
              </span>
            </h1>
            <p className="mt-4 text-muted text-lg leading-relaxed max-w-2xl">
              Websites, chatbots, e-commerce, automation, and apps — the kind of projects you can scope yourself.
              Pick what you need below, then walk through the guided quote to see live pricing.
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
                        onClick={(e) => { e.stopPropagation(); navigate("/quote"); }}
                        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] flex-none"
                        style={{ backgroundColor: s.accent, color: "#fff" }}
                      >
                        Get a live quote →
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Enterprise banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface)" }}
          >
            <div>
              <h3 className="font-semibold text-ink text-lg mb-1">Need something bigger?</h3>
              <p className="text-muted text-sm max-w-xl">
                Business intelligence dashboards, RAG knowledgebases, computer vision, and predictive analytics live on their
                own page — those are usually worth a real conversation first.
              </p>
            </div>
            <button
              onClick={() => navigate("/enterprise")}
              className="px-6 py-3 font-semibold rounded-xl text-[14px] flex-none transition-all duration-200 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              Explore Enterprise Solutions →
            </button>
          </motion.div>
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
              Answer a few quick questions in the guided quote and I'll help you figure out exactly what you need.
            </p>
            <button
              onClick={() => navigate("/quote")}
              className="px-8 py-4 font-semibold rounded-xl text-white transition-all duration-200 hover:scale-[1.02] text-[15px]"
              style={{
                backgroundColor: "var(--accent)",
                boxShadow: "0 8px 30px color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
            >
              Start the Guided Quote
            </button>
          </motion.div>
        </section>
      </div>

      <Footer />
    </>
  );
}
