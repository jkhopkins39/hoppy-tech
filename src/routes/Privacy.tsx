import React from "react";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { contactInfo } from "../config/socialLinks";

const LAST_UPDATED = "July 18, 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Introduction",
    body: (
      <>
        <p>
          Hoppy Tech LLC (&ldquo;Hoppy Tech,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) provides web development and AI solutions. This Privacy
          Policy explains how we collect, use, and protect information when you
          interact with hoppytech.com or respond to our advertising.
        </p>
      </>
    ),
  },
  {
    title: "Information we collect",
    body: (
      <>
        <p>
          We collect information you choose to share when reaching out about a
          project. That typically includes:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>
            Optional details you provide in a message, quote form, or referral
          </li>
        </ul>
        <p>
          This information may come through our website contact or quote forms,
          or through <strong className="text-ink font-medium">Google Ads lead forms</strong>.
          We use those forms strictly for business inquiries and communication.
        </p>
        <p>
          If you use our website chat assistant, we collect the messages you send
          so the assistant can respond, and we keep a transcript of the
          conversation (linked to an anonymous session ID, not your identity) to
          improve responses and follow up on inquiries raised through chat.
        </p>
        <p>
          If you use our referral form, we collect your name and email, along
          with the name and contact details of the business you refer.
        </p>
        <p>
          We may also collect limited technical data (such as pages visited and
          approximate device or browser information) through analytics and
          advertising tools described below.
        </p>
      </>
    ),
  },
  {
    title: "How we use information",
    body: (
      <>
        <p>We use the information we collect only to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Respond to business inquiries and consultation requests</li>
          <li>Provide quotes and communicate about projects</li>
          <li>Operate, improve, and secure our website</li>
          <li>
            Measure advertising performance (for example, whether a Google Ads
            lead or call resulted in contact)
          </li>
        </ul>
        <p>
          We do not use your contact details for unrelated marketing lists or
          spam.
        </p>
      </>
    ),
  },
  {
    title: "How we share information",
    body: (
      <>
        <p>
          <strong className="text-ink font-medium">
            We do not sell your personal information, and we do not share it with
            third parties for their marketing.
          </strong>
        </p>
        <p>
          We may rely on trusted service providers solely to run our business
          and website — including{" "}
          <strong className="text-ink font-medium">Supabase</strong> (database
          storage), <strong className="text-ink font-medium">Resend</strong>{" "}
          (email delivery), <strong className="text-ink font-medium">Vercel</strong>{" "}
          (hosting and analytics), and{" "}
          <strong className="text-ink font-medium">Anthropic</strong> (our AI
          chat assistant provider). Those providers process data only as needed
          to provide their services to us.
        </p>
        <p>
          We may disclose information if required by law or to protect our
          rights, safety, or property.
        </p>
      </>
    ),
  },
  {
    title: "Google Ads and advertising",
    body: (
      <>
        <p>
          When you submit a Google Ads lead form, Google collects your name,
          email, and phone number and shares them with us so we can follow up on
          your inquiry. We treat that information the same as contact details
          submitted on our website — for business communication only.
        </p>
        <p>
          We also use Google Ads and Google Analytics tags, and{" "}
          <strong className="text-ink font-medium">Vercel Analytics</strong>, to
          understand how visitors find and use our site, and to measure
          conversions (such as form submissions or click-to-call). Meta Pixel
          may be used for similar advertising measurement.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          Our site may use cookies and similar technologies for basic
          functionality, analytics, and ad measurement. You can control cookies
          through your browser settings. Disabling cookies may affect some site
          features or how accurately we measure ad performance.
        </p>
        <p>
          If you use our on-site Google Translate feature, Google sets a cookie
          to remember your selected language and loads Google&rsquo;s translation
          script from translate.google.com.
        </p>
      </>
    ),
  },
  {
    title: "Data retention",
    body: (
      <>
        <p>
          We keep inquiry information only as long as needed to respond to you,
          manage an ongoing relationship, or meet ordinary business and legal
          requirements. When it is no longer needed, we delete or de-identify it
          in the normal course of operations.
        </p>
        <p>
          Chat assistant transcripts are kept so we can review and improve
          responses and follow up on inquiries raised through chat. You can
          request deletion of a chat transcript at any time — see &ldquo;Your
          choices&rdquo; below.
        </p>
      </>
    ),
  },
  {
    title: "Your choices",
    body: (
      <>
        <p>
          You may email us to ask what personal information we hold about you,
          request a correction, or ask us to delete inquiry data we no longer
          need to keep. We will respond within a reasonable time.
        </p>
      </>
    ),
  },
  {
    title: "Children’s privacy",
    body: (
      <>
        <p>
          Our services are directed to businesses and adults. We do not
          knowingly collect personal information from children under 13.
        </p>
      </>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <>
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;Last
          updated&rdquo; date at the top of this page will reflect the latest
          revision. Continued use of the site after changes means you accept the
          updated policy.
        </p>
      </>
    ),
  },
];

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">
            Legal
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-[1.1] tracking-tight text-ink font-sans">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-2 text-xs">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-muted text-base sm:text-lg leading-relaxed max-w-2xl">
            How Hoppy Tech LLC collects and uses information from business
            inquiries — simply and transparently.
          </p>
        </motion.div>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pb-24"
      >
        <div className="max-w-3xl space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-ink mb-3 font-sans">
                {section.title}
              </h2>
              <div className="space-y-4 text-muted text-[15px] sm:text-base leading-relaxed">
                {section.body}
              </div>
            </section>
          ))}

          <section
            className="mt-4 pt-10 border-t"
            style={{ borderTopColor: "var(--border-color)" }}
          >
            <h2 className="text-xl font-bold text-ink mb-3 font-sans">Contact</h2>
            <div className="space-y-4 text-muted text-[15px] sm:text-base leading-relaxed">
              <p>
                Questions about this policy or your information? Reach out anytime.
              </p>
              <p>
                <span className="text-ink font-medium">Hoppy Tech LLC</span>
                <br />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-accent hover:text-accent-light transition-colors underline-offset-2 hover:underline"
                >
                  {contactInfo.email}
                </a>
                <br />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-accent hover:text-accent-light transition-colors underline-offset-2 hover:underline"
                >
                  {contactInfo.phone}
                </a>
              </p>
            </div>
          </section>
        </div>
      </motion.article>

      <Footer />
    </div>
  );
};

export default Privacy;
