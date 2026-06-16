import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../config/brandColors';

const SkillsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const skillGroups = [
    {
      category: "Languages",
      accent: BRAND.skyBlue,
      bg: "rgba(142, 202, 230, 0.1)",
      items: ["JavaScript", "TypeScript", "Python", "Java", "C#", "HTML", "CSS"],
    },
    {
      category: "Frameworks",
      accent: BRAND.orange,
      bg: "rgba(251, 133, 0, 0.1)",
      items: ["React", "Node.js", "Next.js", "Tailwind CSS", "PyTorch"],
    },
    {
      category: "Tools",
      accent: BRAND.skyBlueLight,
      bg: "rgba(181, 219, 240, 0.12)",
      items: ["Git", "SQL", "Linux", "OpenAI API", "MS Office"],
    },
    {
      category: "Soft Skills",
      accent: BRAND.navyMid,
      bg: "rgba(3, 69, 99, 0.12)",
      items: ["Problem Solving", "Leadership", "Communication", "Project Mgmt", "Detail-Oriented"],
    },
  ];

  return (
    <div className="mb-16">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 group"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
          >
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-semibold text-ink text-[15px]">Skills & Expertise</span>
        </div>
        <motion.svg
          className="w-5 h-5 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skillGroups.map((group, i) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  className="rounded-2xl border p-5 transition-all duration-200"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'; }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-[3px] w-6 rounded-full flex-none"
                      style={{ background: group.accent }}
                    />
                    <span
                      className="text-[11px] uppercase tracking-widest font-semibold"
                      style={{ color: group.accent }}
                    >
                      {group.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-ink"
                        style={{ background: group.bg }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillsDropdown;
