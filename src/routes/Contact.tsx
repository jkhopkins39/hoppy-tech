import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

interface ContactSubmission {
  id: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

const socials = [
  {
    name: 'GitHub',
    handle: '@jkhopkins39',
    url: 'https://github.com/jkhopkins39',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    accent: '#7A7A8E',
  },
  {
    name: 'LinkedIn',
    handle: 'jeremy-hopkins',
    url: 'https://www.linkedin.com/in/jeremy-hopkins-160001275',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    accent: '#0A66C2',
  },
  {
    name: 'Instagram',
    handle: '@jeremykhopkins',
    url: 'https://instagram.com/jeremykhopkins',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    accent: '#E1306C',
  },
  {
    name: 'Facebook',
    handle: 'Jeremy Hopkins',
    url: 'https://facebook.com/jeremy.hopkins.94695',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    accent: '#1877F2',
  },
];

const Contact: React.FC = () => {
  const [honeypot1, setHoneypot1] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [formLoadTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const storeSubmission = (email: string, message: string) => {
    const submission: ContactSubmission = {
      id: Date.now().toString(), email, message,
      date: new Date().toISOString(), read: false,
    };
    const existing = localStorage.getItem('contactSubmissions');
    const arr: ContactSubmission[] = existing ? JSON.parse(existing) : [];
    arr.unshift(submission);
    localStorage.setItem('contactSubmissions', JSON.stringify(arr));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (honeypot1 || honeypot2) {
      e.preventDefault();
      window.location.href = import.meta.env.DEV ? 'http://localhost:5173/thanks' : 'https://www.hoppytech.com/thanks';
      return;
    }
    if (Date.now() - formLoadTime < 3000) {
      e.preventDefault();
      alert("Please take your time filling out the form.");
      return;
    }
    if (formRef.current) {
      const fd = new FormData(formRef.current);
      const email = fd.get('email') as string;
      const message = fd.get('message') as string;
      if (email && message) storeSubmission(email, message);
    }
    setIsSubmitting(true);
  };

  const redirectUrl = import.meta.env.DEV ? 'http://localhost:5173/thanks' : 'https://www.hoppytech.com/thanks';

  const inputClass = "w-full px-4 py-3.5 bg-white/[0.03] border border-subtle rounded-xl text-ink placeholder-muted-3 focus:border-accent-subtle focus:bg-white/[0.05] transition-all text-sm";
  const labelClass = "block text-[11px] uppercase tracking-widest text-muted font-semibold mb-2";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Get in touch</span>
          <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight">
            Let's{' '}
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
              Connect
            </span>
          </h1>
          <p className="mt-4 text-muted text-lg leading-relaxed max-w-xl">
            Have a project in mind or want to collaborate? Drop a message and I'll get back to you within 24 hours.
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
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                  style={{ background: 'rgba(232,151,26,0.1)' }}
                >
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-ink">Send a Message</h2>
                  <p className="text-muted text-xs">I'll respond within 24 hours</p>
                </div>
              </div>

              <form
                ref={formRef}
                action="https://api.web3forms.com/submit"
                method="POST"
                className="space-y-5"
                onSubmit={handleFormSubmit}
              >
                <input type="hidden" name="access_key" value="46cae387-addf-453a-a32f-6464199035c6" />
                <input type="hidden" name="subject" value="New Contact Form Submission" />
                <input type="hidden" name="redirect" value={redirectUrl} />

                {/* Honeypot */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                  <input type="text" name="contact_website" value={honeypot1} onChange={e => setHoneypot1(e.target.value)} tabIndex={-1} autoComplete="off" />
                  <input type="text" name="contact_fax" value={honeypot2} onChange={e => setHoneypot2(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input type="email" name="email" required placeholder="hello@example.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" name="name" placeholder="John Doe" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Subject</label>
                  <input type="text" name="subject_line" placeholder="What's this about?" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Message *</label>
                  <textarea name="message" required placeholder="Tell me about your project or idea…" rows={6} className={`${inputClass} resize-none`} />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-accent hover:bg-accent-light text-canvas font-semibold rounded-xl transition-all duration-200 text-[15px] disabled:opacity-50 flex items-center justify-center gap-3 hover:shadow-[0_8px_30px_rgba(232,151,26,0.3)]"
                >
                  {isSubmitting ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Sending…</>
                  ) : (
                    <>Send Message<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                  )}
                </motion.button>
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
            {/* Direct email */}
            <a
              href="mailto:jeremy@hoppytech.com"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-subtle bg-surface hover:border-accent-subtle hover:bg-accent-subtle-2 transition-all duration-200"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{ background: 'rgba(232,151,26,0.1)' }}
              >
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-muted mb-0.5">Email</p>
                <p className="text-ink text-sm font-medium truncate group-hover:text-accent transition-colors">jeremy@hoppytech.com</p>
              </div>
              <svg className="w-4 h-4 text-muted group-hover:text-accent flex-none transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Social links */}
            <div className="p-5 rounded-2xl border border-subtle bg-surface">
              <h3 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-4">Follow Me</h3>
              <div className="space-y-3">
                {socials.map((social, i) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-none text-muted group-hover:text-ink transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {social.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink">{social.name}</p>
                      <p className="text-[11px] text-muted truncate">{social.handle}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-muted-2 group-hover:text-muted flex-none transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Response note */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: 'rgba(232,151,26,0.05)',
                borderColor: 'rgba(232,151,26,0.15)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-none mt-0.5"
                  style={{ background: 'rgba(232,151,26,0.1)' }}
                >
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink mb-1">Quick Response</p>
                  <p className="text-muted text-sm leading-relaxed">
                    I typically respond within 24 hours. For urgent matters, reach out on LinkedIn.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
