import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { BRAND } from '../config/brandColors';

const Refer: React.FC = () => {
  const navigate = useNavigate();
  const [honeypot1, setHoneypot1] = useState('');
  const [honeypot2, setHoneypot2] = useState('');
  const [formLoadTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    if (honeypot1 || honeypot2) {
      navigate('/thanks');
      return;
    }
    if (Date.now() - formLoadTime < 2000) {
      return;
    }
    if (!formRef.current) return;

    const fd = new FormData(formRef.current);
    const payload = {
      referrer_name: String(fd.get('referrer_name') ?? '').trim(),
      referrer_email: String(fd.get('referrer_email') ?? '').trim(),
      business_name: String(fd.get('business_name') ?? '').trim(),
      contact_name: String(fd.get('contact_name') ?? '').trim(),
      contact_email: String(fd.get('contact_email') ?? '').trim(),
      notes: String(fd.get('notes') ?? '').trim(),
      contact_website: honeypot1,
      contact_fax: honeypot2,
    };

    if (!payload.referrer_name || !payload.referrer_email || !payload.business_name) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({})) as { success?: boolean; message?: string };

      if (!res.ok || !result.success) {
        setSubmitError(result.message ?? 'Failed to send. Please email directly.');
        setIsSubmitting(false);
        return;
      }

      navigate('/thanks');
    } catch {
      setSubmitError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3.5 bg-surface-2 border border-subtle rounded-xl text-ink placeholder-muted-3 focus:border-accent-subtle focus:bg-surface-3 transition-all text-sm';
  const labelClass = 'block text-[11px] uppercase tracking-widest text-muted font-semibold mb-2';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ─── Hero band ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Referral Program</span>
          <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight">
            Know a business we{' '}
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontStyle: 'italic',
                background: 'linear-gradient(135deg, var(--accent-light), var(--accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              can help?
            </span>
          </h1>
          <p className="mt-4 text-muted text-lg leading-relaxed max-w-xl">
            Introduce us to a business that needs to optimize, automate, or level up their tech.
            When they sign on, we'll send <strong className="text-ink">$20 your way</strong> as a thank you.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ─── Form ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl border border-subtle bg-surface p-6 md:p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: `${BRAND.skyBlue}22` }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.skyBlue }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-ink">Make an Introduction</h2>
                  <p className="text-muted text-xs">Takes about 60 seconds</p>
                </div>
              </div>

              <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
                {/* Honeypot */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                  <input type="text" name="contact_website" value={honeypot1} onChange={e => setHoneypot1(e.target.value)} tabIndex={-1} autoComplete="off" />
                  <input type="text" name="contact_fax" value={honeypot2} onChange={e => setHoneypot2(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                {/* Divider: Your info */}
                <p className="text-[11px] uppercase tracking-widest text-muted font-semibold pb-1 border-b border-subtle">Your Info</p>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Your Name *</label>
                    <input type="text" name="referrer_name" required placeholder="Jane Smith" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Your Email *</label>
                    <input type="email" name="referrer_email" required placeholder="jane@example.com" className={inputClass} />
                  </div>
                </div>

                {/* Divider: Their info */}
                <p className="text-[11px] uppercase tracking-widest text-muted font-semibold pb-1 border-b border-subtle pt-2">The Business</p>

                <div>
                  <label className={labelClass}>Business Name *</label>
                  <input type="text" name="business_name" required placeholder="Acme Corp" className={inputClass} />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Their Contact Name</label>
                    <input type="text" name="contact_name" placeholder="John Doe (optional)" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Their Email</label>
                    <input type="email" name="contact_email" placeholder="john@acme.com (optional)" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>What do they need? (optional)</label>
                  <textarea
                    name="notes"
                    placeholder="Any context on their challenges or what they're looking to build…"
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 font-semibold rounded-xl transition-all duration-200 text-[15px] disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      Send Introduction
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </motion.button>

                {submitError && <p className="text-sm text-red-400">{submitError}</p>}
              </form>
            </div>
          </motion.div>

          {/* ─── Sidebar ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* How it works */}
            <div className="p-5 rounded-2xl border border-subtle bg-surface">
              <h3 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-4">How It Works</h3>
              <ol className="space-y-4">
                {[
                  { step: '1', title: 'Make the intro', desc: 'Drop their business details in the form. That\'s it.' },
                  { step: '2', title: 'We reach out', desc: 'Jeremy will follow up with your contact directly.' },
                  { step: '3', title: 'You get paid', desc: '$20 sent to you the moment they officially sign on.' },
                ].map(item => (
                  <li key={item.step} className="flex gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-none text-[11px] font-bold mt-0.5"
                      style={{ background: `${BRAND.skyBlue}22`, color: BRAND.skyBlue }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                      <p className="text-[12px] text-muted mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Bounty callout */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: `${BRAND.skyBlue}0d`,
                borderColor: `${BRAND.skyBlue}30`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-none mt-0.5"
                  style={{ background: `${BRAND.skyBlue}22` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: BRAND.skyBlue }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink mb-1">$20 Referral Bounty</p>
                  <p className="text-muted text-sm leading-relaxed">
                    The bounty is paid out the moment the referred business officially signs on or completes their first booking. No expiry.
                  </p>
                </div>
              </div>
            </div>

            {/* Who to refer */}
            <div className="p-5 rounded-2xl border border-subtle bg-surface">
              <h3 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-3">Good Candidates</h3>
              <ul className="space-y-2">
                {[
                  'Local businesses with outdated websites',
                  'Service companies that need online booking',
                  'Teams drowning in manual processes',
                  'Anyone looking to add AI to their workflow',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-muted">
                    <svg className="w-3.5 h-3.5 text-accent flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Refer;
