import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const ThankYou: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg w-full text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
            className="mb-8 inline-block"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h1
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-ink"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic' }}
            >
              Message received!
            </h1>
            <p className="text-muted text-lg leading-relaxed mb-3">
              Thanks for reaching out — your message is in my inbox.
            </p>
            <p className="text-muted text-sm leading-relaxed mb-10">
              I typically respond within 24–48 hours. Keep an eye on your inbox (and check spam, just in case).
            </p>
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8 text-left p-5 rounded-2xl border bg-surface"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-none mt-0.5"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
              >
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-1">What happens next?</p>
                <p className="text-muted text-sm leading-relaxed">
                  I'll review your message and reply via email. For urgent needs, connect with me on LinkedIn.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/">
              <button
                className="w-full sm:w-auto px-7 py-3.5 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] text-[15px] flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return Home
              </button>
            </Link>
            <Link to="/contact">
              <button
                className="w-full sm:w-auto px-7 py-3.5 border font-medium rounded-xl transition-all duration-200 text-[15px] text-ink"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Send Another
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ThankYou;
