import { motion } from 'framer-motion';
import EducationTimeline from "../components/EducationTimeline";
import SkillsDropdown from "../components/SkillsDropdown";
import ResumeSection from "../components/ResumeSection";
import Footer from "../components/Footer";

const educationHistory = [
  {
    title: "Kennesaw State University",
    period: "2022–2026",
    description:
      "Earned a BS in Computer Science with a focus in Artificial Intelligence. Built the majority of my portfolio projects during my time at KSU, ranging from AI integrations to full-stack web applications.",
    image: "/images/education/marietta-campus.jpg",
  },
  {
    title: "University of West Georgia",
    period: "2021–2022",
    description:
      "Gained a strong foundation in test-driven development, object-oriented programming, and software design. Also worked in the catering department — even had a meeting with the university president.",
    image: "/images/education/UWG.jpg",
  },
  {
    title: "Bremen High School",
    period: "2017–2021",
    description:
      "Graduated with National Honor Society membership. Served as brass captain of the BHS Marching Blue Devils and worked as a sound & lighting technician in the Fine Arts Center.",
    image: "/images/education/BHS.png",
  },
];

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function About() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ─── Page header ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <motion.div {...fadeUp(0)}>
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">About me</span>
        </motion.div>
        <motion.h1
          {...fadeUp(1)}
          className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-ink"
        >
          The person behind<br />
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontStyle: "italic",
              background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            the code
          </span>
        </motion.h1>
        <motion.p {...fadeUp(2)} className="mt-4 text-muted text-lg leading-relaxed max-w-2xl">
          I&apos;m Jeremy Hopkins, KSU Alumni and AI Intern. I enjoy building stuff with new random technologies.
        </motion.p>
      </div>

      {/* ─── Education ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
          >
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="font-bold text-xl text-ink">Education Journey</h2>
        </motion.div>

        <EducationTimeline items={educationHistory} />
      </div>

      {/* ─── Skills ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SkillsDropdown />
      </div>

      {/* ─── Resume ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ResumeSection />
      </div>

      <Footer />
    </div>
  );
}

export default About;
