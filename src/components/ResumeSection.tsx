import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const downloadResume = (format: 'pdf' | 'docx') => {
    const filename = format === 'pdf' ? 'Jeremy_Hopkins_Resume.pdf' : 'Jeremy_Hopkins_Resume.docx';
    const fileUrl = format === 'pdf' ? '/documents/resume.pdf' : '/documents/resume.docx';
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mb-16">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="font-bold text-xl text-ink">Resume</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-56 flex-none"
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="group w-full rounded-2xl overflow-hidden border transition-all duration-300 relative"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; }}
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src="/documents/resume-preview.png"
                alt="Resume Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/50 px-3 py-2 rounded-xl backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 flex flex-col gap-3"
        >
          <p className="text-muted text-sm leading-relaxed mb-2">
            Download my resume to learn more about my education, skills, and experience.
          </p>

          {[
            {
              label: 'Download PDF', sub: 'Best for viewing & sharing',
              accent: 'var(--accent)', iconFill: true,
              onClick: () => downloadResume('pdf'),
              icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9v4h-2v-4H6l4-4 4 4h-2z" />,
            },
            {
              label: 'Download DOCX', sub: 'Editable Word format',
              accent: '#A78BFA', iconFill: true,
              onClick: () => downloadResume('docx'),
              icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-1 9l-2 6-2-6H6l3 8h2l2-5 2 5h2l3-8h-2l-2 6-2-6h-2z" />,
            },
            {
              label: 'View Full Resume', sub: 'Preview in browser',
              accent: '#38BDF8', iconFill: false,
              onClick: () => setIsExpanded(true),
              icon: (<><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>),
            },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border transition-all duration-200 group text-left"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb,' + btn.accent + ' 30%, transparent)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in srgb,' + btn.accent + ' 5%, var(--surface))';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface)';
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                style={{ background: `color-mix(in srgb, ${btn.accent} 12%, transparent)`, color: btn.accent }}
              >
                <svg className="w-4 h-4" fill={btn.iconFill ? 'currentColor' : 'none'} stroke={btn.iconFill ? undefined : 'currentColor'} viewBox="0 0 24 24">
                  {btn.icon}
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-ink">{btn.label}</div>
                <div className="text-[12px] text-muted">{btn.sub}</div>
              </div>
              <svg className="w-4 h-4 text-muted flex-none transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Fullscreen resume viewer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <object data="/documents/resume.pdf" type="application/pdf" className="w-full h-full">
                <div className="flex flex-col items-center justify-center h-full text-gray-800 bg-gray-50">
                  <p className="mb-4">Browser can't display PDF.</p>
                  <a
                    href="/documents/resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-accent text-on-accent rounded-xl font-semibold"
                  >
                    Open PDF
                  </a>
                </div>
              </object>

              <a
                href="/documents/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 left-3 px-3 py-1.5 text-sm text-white bg-black/60 hover:bg-black/80 rounded-xl flex items-center gap-2 z-50 backdrop-blur-sm transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in tab
              </a>
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-3 right-3 p-2 text-white bg-black/60 hover:bg-black/80 rounded-xl z-50 backdrop-blur-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeSection;
