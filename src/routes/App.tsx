import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import NavBar from "../components/NavBar";
import Chatbot from "../components/Chatbot";
import HeroPortfolioShowcase from "../components/HeroPortfolioShowcase";
import ClientLogoStrip from "../components/ClientLogoStrip";
import About from "./About";
import Blog from "./Blog";
import Contact from "./Contact";
import Dashboard from "./Dashboard";
import Portal from "./Portal";
import Social from "./Social";
import Portfolio from "./Portfolio";
import ThankYou from "./ThankYou";
import Sorry from "./Sorry";
import Refer from "./Refer";
import Quote from "./Quote";
import Privacy from "./Privacy";
import DataDeletion from "./DataDeletion";
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

/** What Hoppy Tech actually sells — mirrors the /quote catalog and enterprise solutions. */
const OFFERINGS = [
  {
    title: "Websites & online stores",
    desc: "A fast and modern site built, hosted, and maintained by Hoppy Tech.",
    includes: ["Site build", "E-commerce", "Booking & appointments", "Business email", "SEO foundation"],
    anchor: "Sites from $750",
    cta: { label: "Build a quote", path: "/quote" },
    accent: "var(--accent)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "AI that does a job",
    desc: "Models wired into the work your team repeats every day.",
    includes: ["Site chatbot", "RAG knowledgebase", "Document & vision pipelines", "Forecasting dashboards"],
    anchor: "Chatbot from $250",
    cta: { label: "Explore AI solutions", path: "/quote" },
    accent: BRAND.skyBlue,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Automation & custom software",
    desc: "Connecting the tools you already pay for and building what doesn't exist yet.",
    includes: ["Workflow automation", "API integrations", "Custom dashboards", "Mobile apps"],
    anchor: "Scoped on a call",
    cta: { label: "Start a conversation", path: "/contact" },
    accent: BRAND.orange,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
];

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
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 lg:pt-16 pb-10 grid grid-cols-1 lg:grid-cols-12 lg:gap-x-10 lg:items-center">
          {/* Nameplate + positioning + CTAs */}
          <div className="relative z-[5] lg:col-span-6 min-w-0">
            <motion.h1
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="font-bold tracking-tight text-ink leading-[1.04]"
            >
              <span className="block text-[clamp(2.6rem,6vw,4.9rem)]">Hoppy Tech</span>
              <span
                className="italic block text-[clamp(1.65rem,3.9vw,3.05rem)]"
                style={{
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

            <motion.p
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-muted text-lg leading-relaxed max-w-xl mt-6"
            >
              We bridge the gap between modern business needs and modern technology.
              Websites, AI, and custom software, built to fit how you
              already work. First consultation is free.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="flex flex-wrap gap-4 mt-8"
            >
              <button onClick={() => navigate("/contact")} className="cta-btn cta-btn--solid">
                Get in Touch
                <svg className="cta-btn__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button onClick={() => navigate("/portfolio")} className="cta-btn cta-btn--ghost">
                See Our Work
                <svg className="cta-btn__arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          </div>

          {/* Work showcase */}
          <div className="lg:col-span-6 min-w-0 mt-12 lg:mt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="hero-showcase-stack relative z-0 flex items-center justify-center min-w-0"
            >
              <HeroPortfolioShowcase />
            </motion.div>
          </div>
        </div>

        {/* Ambient glow — text column only */}
        <div
          ref={glowRef}
          className="hero-ambient-glow pointer-events-none absolute inset-y-0 left-0 w-full lg:w-1/2 z-[1]"
          style={{
            background: "radial-gradient(ellipse 38% 32% at 30% 40%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 3%, transparent) 38%, transparent 52%)",
          }}
        />
      </section>

      <ClientLogoStrip />

      {/* ─── What we build ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">What we build</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-ink">
            Three ways we{" "}
            <span style={{ fontFamily: "'DM Serif Display', serif" }} className="italic">work together</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={cardsContainer}
        >
          {OFFERINGS.map((row) => (
            <motion.div
              key={row.title}
              variants={cardItem}
              className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-x-5 gap-y-4 py-8 border-t transition-colors duration-300"
              style={{ borderColor: "var(--border-color)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)";
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{
                  background: `color-mix(in srgb, ${row.accent} 13%, transparent)`,
                  color: row.accent,
                }}
              >
                {row.icon}
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-ink text-xl">{row.title}</h3>
                <p className="text-muted text-[15px] leading-relaxed mt-1.5 max-w-prose">{row.desc}</p>
                <ul className="flex flex-wrap gap-2 mt-4">
                  {row.includes.map((item) => (
                    <li
                      key={item}
                      className="text-[12.5px] text-muted px-2.5 py-1 rounded-lg border"
                      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-alpha)" }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-start-2 md:col-start-3 flex flex-row md:flex-col md:items-end items-center gap-x-5 gap-y-2 md:text-right flex-none">
                <span className="text-[13px] font-mono text-ink whitespace-nowrap">{row.anchor}</span>
                <button
                  onClick={() => navigate(row.cta.path)}
                  className="flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 hover:gap-2.5 whitespace-nowrap"
                  style={{ color: row.accent }}
                >
                  {row.cta.label}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border-t pt-6 text-muted text-[14px]"
          style={{ borderColor: "var(--border-color)" }}
        >
          Logos, brand identity, and visual design are handled in-house by our designers. Add them to any
          project.
        </motion.p>
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
            <p className="text-muted mt-2 text-lg">
            Free first consultation. Tell us what you're working on.
          </p>
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
          <Route path="/sorry" element={<Sorry />} />
          <Route path="/ai-solutions" element={<Navigate to="/quote" replace />} />
          <Route path="/solutions" element={<Navigate to="/quote" replace />} />
          <Route path="/enterprise" element={<Navigate to="/quote" replace />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
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
      <Route path="/social/*" element={<Social />} />
      {/* Public site */}
      <Route path="/*" element={<SiteLayout />} />
    </Routes>
  );
}

export default App;
