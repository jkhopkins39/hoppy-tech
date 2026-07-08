import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND, SKY_BLUE_A14, NAVY_MID_A14 } from "../config/brandColors";

interface TimelineItem {
  title: string;
  period: string;
  description: string;
  image?: string;
  /** 'contain' keeps a logo fully visible (no cropping) on a solid backdrop instead of filling the frame. */
  imageFit?: "cover" | "contain";
  imageBg?: string;
}

interface EducationTimelineProps {
  items: TimelineItem[];
}

const EducationTimeline: React.FC<EducationTimelineProps> = ({ items }) => {
  const [expanded, setExpanded] = useState<number | null>(0);

  const accents = [
    { dot: BRAND.skyBlue, tag: SKY_BLUE_A14, tagText: BRAND.navy },
    { dot: BRAND.orange, tag: "rgba(251, 133, 0, 0.14)", tagText: BRAND.orange },
    { dot: BRAND.navyMid, tag: NAVY_MID_A14, tagText: "var(--ink)" },
  ];

  return (
    <div className="relative py-2">
      {/* Center spine */}
      <div
        className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2"
        style={{ background: `linear-gradient(to bottom, ${BRAND.skyBlue}80, ${BRAND.orange}70, ${BRAND.navyMid}50)` }}
      />

      <div className="space-y-5 md:space-y-8">
        {items.map((item, i) => {
          const accent = accents[i % accents.length];
          const isOpen = expanded === i;
          const isLeft = i % 2 === 0;
          const isCurrent = i === 0;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="relative md:grid md:grid-cols-2 md:gap-x-10"
            >
              {/* Dot marker */}
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-label={isOpen ? `Collapse ${item.title}` : `Expand ${item.title}`}
                aria-expanded={isOpen}
                className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full"
                style={{ width: 24, height: 24 }}
              >
                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: accent.dot }}
                    animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                  />
                )}
                <span
                  className="relative rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{
                    width: isOpen ? 18 : 13,
                    height: isOpen ? 18 : 13,
                    background: accent.dot,
                    boxShadow: isOpen
                      ? `0 0 0 6px ${accent.dot}2A, 0 0 0 2.5px var(--canvas)`
                      : `0 0 0 2.5px var(--canvas)`,
                  }}
                >
                  {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-white/90" />}
                </span>
              </button>

              <div
                className={`pl-11 md:pl-0 ${isLeft ? "md:col-start-1 md:flex md:justify-end md:pr-9" : "md:col-start-2 md:pl-9"}`}
              >
                <div
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full md:max-w-sm rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    background: "var(--surface)",
                    borderColor: isOpen ? `${accent.dot}55` : "var(--border-color)",
                    boxShadow: isOpen ? `0 8px 30px ${accent.dot}1F` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)";
                  }}
                >
                  {/* Header row — always visible */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex-none"
                      style={{ background: accent.tag, color: accent.tagText }}
                    >
                      {item.period}
                    </span>
                    <h3 className="font-semibold text-ink text-[14px] flex-1 leading-snug min-w-0 truncate">
                      {item.title}
                    </h3>
                    <svg
                      className="w-4 h-4 flex-none transition-transform duration-300"
                      style={{ color: accent.dot, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expandable detail */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        {item.image && (
                          <div className="relative h-32 border-t" style={{ borderColor: "var(--border-color)" }}>
                            {item.imageFit === "contain" ? (
                              <div
                                className="w-full h-full flex items-center justify-center p-5"
                                style={{ background: item.imageBg ?? "#ffffff" }}
                              >
                                <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
                              </div>
                            ) : (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <p className="text-muted text-sm leading-relaxed p-4">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default EducationTimeline;
