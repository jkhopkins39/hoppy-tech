import React from "react";
import { motion } from "framer-motion";
import { BRAND } from "../config/brandColors";

interface TimelineItem {
  title: string;
  period: string;
  description: string;
  image: string;
}

interface EducationTimelineProps {
  items: TimelineItem[];
}

const EducationTimeline: React.FC<EducationTimelineProps> = ({ items }) => {
  const accents = [
    { line: BRAND.skyBlue, dot: BRAND.skyBlue, tag: "rgba(142, 202, 230, 0.14)", tagText: BRAND.navy },
    { line: BRAND.orange, dot: BRAND.orange, tag: "rgba(251, 133, 0, 0.14)", tagText: BRAND.orange },
    { line: BRAND.navyMid, dot: BRAND.navyMid, tag: "rgba(3, 69, 99, 0.14)", tagText: BRAND.skyBlueLight },
  ];

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div
        className="absolute left-[22px] top-6 bottom-6 w-px hidden md:block"
        style={{ background: `linear-gradient(to bottom, ${BRAND.skyBlue}99, ${BRAND.orange}88, ${BRAND.navyMid}66)` }}
      />

      <div className="space-y-8">
        {items.map((item, i) => {
          const accent = accents[i % accents.length];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-6 group"
            >
              {/* Timeline dot */}
              <div className="relative flex-none w-11 flex flex-col items-center pt-1 hidden md:flex">
                <div
                  className="w-[11px] h-[11px] rounded-full z-10 transition-transform duration-300 group-hover:scale-125"
                  style={{ background: accent.dot, boxShadow: `0 0 0 2px var(--canvas)` }}
                />
              </div>

              {/* Card */}
              <div
                className="flex-1 rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-xl"
                style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--surface) 0%, transparent 60%)' }} />

                  {/* Period badge */}
                  <div className="absolute bottom-3 left-4">
                    <span
                      className="px-3 py-1 rounded-lg text-[12px] font-mono font-semibold"
                      style={{ background: accent.tag, color: accent.tagText }}
                    >
                      {item.period}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div
                    className="h-[2px] w-10 mb-4 rounded-full"
                    style={{ background: accent.line }}
                  />
                  <h3 className="font-semibold text-lg text-ink mb-2">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.description}</p>
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
