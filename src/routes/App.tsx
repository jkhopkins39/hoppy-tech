import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import NavBar from "../components/NavBar";
import Chatbot from "../components/Chatbot";
import HeroPortfolioShowcase from "../components/HeroPortfolioShowcase";
import About from "./About";
import Blog from "./Blog";
import Contact from "./Contact";
import Dashboard from "./Dashboard";
import Portal from "./Portal";
import Portfolio from "./Portfolio";
import ThankYou from "./ThankYou";
import Refer from "./Refer";
import Quote from "./Quote";
import Privacy from "./Privacy";
import Footer from "../components/Footer";
import { socialLinks, contactInfo } from "../config/socialLinks";
import { BRAND } from "../config/brandColors";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const cardsContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const cardItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function HomePage() {
  const navigate = useNavigate();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!glowRef.current) return;
      const x = 30 + (e.clientX / window.innerWidth) * 5;
      const y = 40 + (e.clientY / window.innerHeight) * 5;
      glowRef.current.style.background = `radial-gradient(ellipse 38% 32% at ${x}% ${y}%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 3%, transparent) 38%, transparent 52%)`;
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <>
      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden xl:min-h-[calc(100vh-68px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 xl:gap-x-0 xl:grid-cols-1 xl:relative xl:min-h-[calc(100vh-68px)] xl:items-stretch">
          {/* Text — always above showcase in stacking order when overlap could occur */}
          <div className="relative z-[5] order-2 lg:order-1 flex flex-col justify-center py-8 lg:py-12 xl:absolute xl:inset-y-0 xl:left-0 xl:w-[min(100%,52%)] xl:py-24 xl:pr-6">
            <div className="w-full max-w-xl min-w-0">
            {/* Heading */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-[clamp(2.35rem,5.5vw,4.75rem)] font-bold leading-[1.08] tracking-tight text-ink mb-6"
            >
              Hoppy Tech<br />
              <span
                className="italic"
                style={{
                  display: "inline-block",
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  paddingRight: "0.1em",
                  paddingBottom: "0.08em",
                }}
              >
                Web, AI, and Custom Solutions
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-muted text-lg leading-relaxed max-w-xl mb-10"
            >
              Hoppy Tech is a technology company founded with the goal
              of bridging the gap between business needs and new, emerging technologies.
              Reach out today for a free consultation so we can meet you where you are
              and elevate your operations.
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => navigate("/contact")}
                className="px-7 py-3.5 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] text-[15px]"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-foreground)",
                  boxShadow: "0 0 0 0 color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 30px color-mix(in srgb, var(--accent) 30%, transparent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                Get in Touch
              </button>
              <button
                onClick={() => navigate("/portfolio")}
                className="px-7 py-3.5 font-medium rounded-xl transition-all duration-200 text-[15px] text-ink border"
                style={{ borderColor: "var(--border-color)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-alpha)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
                }}
              >
                View My Work
              </button>
            </motion.div>
            </div>
          </div>

          {/* Portfolio showcase */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="hero-showcase-stack relative order-1 lg:order-2 z-0 flex items-center justify-center py-6 lg:py-8 xl:absolute xl:inset-y-0 xl:right-0 xl:w-[min(100%,46%)] xl:py-6 xl:px-2 min-w-0"
          >
            <HeroPortfolioShowcase />
          </motion.div>
        </div>

        {/* Ambient glow — text column only */}
        <div
          ref={glowRef}
          className="hero-ambient-glow pointer-events-none absolute inset-y-0 left-0 w-full lg:w-1/2 xl:w-[48%] z-[1]"
          style={{
            background: "radial-gradient(ellipse 38% 32% at 30% 40%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 3%, transparent) 38%, transparent 52%)",
          }}
        />

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="hidden xl:flex xl:flex-col absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-1.5 text-muted z-[5]"
        >
          <span className="text-[11px] uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── What I Do ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">What I do</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-ink">
            Turning ideas into<br />
            <span style={{ fontFamily: "'DM Serif Display', serif" }} className="italic">real products</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={cardsContainer}
        >
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: "Web Development",
              desc: "Web applications using React, Node.js, and modern tooling. Simple, fast, and reliable.",
              accent: "var(--accent)",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: "AI & Machine Learning",
              desc: "Integrating intelligence into applications using TensorFlow, PyTorch, and Gemini; I believe AI is the next frontier!",
              accent: BRAND.skyBlue,
              learnMore: "/quote",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              ),
              title: "Software Engineering",
              desc: "My goal is to deliver the best product possible. Every solution is customized to fit your needs, with best practices, clean documentation, and ongoing support.",
              accent: BRAND.orange,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={cardItem}
              className="group relative p-6 rounded-2xl border transition-[border-color] duration-300"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--surface)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)";
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${card.accent}22`, color: card.accent }}
              >
                {card.icon}
              </div>
              <h3 className="font-semibold text-ink mb-2 text-lg">{card.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{card.desc}</p>
              {"learnMore" in card && card.learnMore && (
                <button
                  onClick={() => navigate(card.learnMore as string)}
                  className="mt-4 flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 hover:gap-2.5"
                  style={{ color: card.accent }}
                >
                  Learn more
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── CTA banner ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
          }}
        >
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-ink"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Let's build something great.
            </h2>
            <p className="text-muted mt-2 text-lg">Open to freelance and collaboration opportunities.</p>
          </div>
          <div className="flex flex-wrap gap-4 flex-none">
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 border text-ink rounded-xl transition-all duration-200 text-[14px] font-medium flex items-center gap-2"
              style={{ borderColor: "var(--border-color)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--surface-alpha)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-color)";
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
            <a
              href={`mailto:${contactInfo.email}`}
              className="px-6 py-3 font-semibold rounded-xl transition-all duration-200 text-[14px]"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              Send Email
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}

function SiteLayout() {
  return (
    <div className="flex flex-col bg-canvas min-h-screen">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/thanks" element={<ThankYou />} />
          <Route path="/ai-solutions" element={<Navigate to="/quote" replace />} />
          <Route path="/solutions" element={<Navigate to="/quote" replace />} />
          <Route path="/enterprise" element={<Navigate to="/quote" replace />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Standalone — no NavBar, no Chatbot */}
      <Route path="/portal" element={<Portal />} />
      {/* Public site */}
      <Route path="/*" element={<SiteLayout />} />
    </Routes>
  );
}

export default App;
