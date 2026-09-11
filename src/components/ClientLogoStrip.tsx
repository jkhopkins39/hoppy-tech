import { motion } from "framer-motion";

export interface ClientLogo {
  name: string;
  href?: string;
  src?: string;
  /** Extra class on the <img> for per-logo styling */
  imgClass?: string;
  /** Short message shown on hover (e.g. coming soon) */
  hoverMessage?: string;
}

export const CLIENT_LOGOS: ClientLogo[] = [
  {
    name: "Cornerstone Coatings",
    href: "https://cornerstonecoatingsga.com",
    src: "/images/client-logos/cornerstone.png",
    imgClass: "client-logo-img--cornerstone",
  },
  {
    name: "Illuminated Productions",
    href: "https://illuminated-prod.vercel.app",
    src: "/images/client-logos/illuminated.png",
    imgClass: "client-logo-img--illuminated",
  },
  {
    name: "JB Recycling",
    src: "/images/client-logos/jb-recycling.png",
    imgClass: "client-logo-img--jb-recycling",
    hoverMessage: "Coming soon…",
  },
  {
    name: "Krush Windshield Repair",
    href: "https://krushwindshieldrepair.com",
    src: "/images/client-logos/krush.png",
    imgClass: "client-logo-img--krush",
  },
  {
    name: "Watch Trading Post",
    href: "https://www.watchtradingpost.com",
    src: "/images/client-logos/watch-trading-post.png",
  },
  {
    name: "One Talent Productions",
    href: "https://www.onetalentproductions.com",
    src: "/images/client-logos/one-talent-productions.png",
    imgClass: "client-logo-img--one-talent",
  },
];

function LogoMark({ client }: { client: ClientLogo }) {
  const inner = (
    <div className="client-logo-mark flex w-full items-center justify-center">
      {client.src ? (
        <img
          src={client.src}
          alt={client.name}
          loading="lazy"
          decoding="async"
          className={`client-logo-img ${client.imgClass ?? ""}`}
        />
      ) : null}
    </div>
  );

  const tooltip = client.hoverMessage ? (
    <span className="client-logo-tooltip" role="tooltip">
      {client.hoverMessage}
    </span>
  ) : null;

  if (client.href) {
    return (
      <a
        href={client.href}
        target="_blank"
        rel="noopener noreferrer"
        className="client-logo-link group flex items-center justify-center rounded-2xl border px-4 py-4.5 transition-colors duration-200"
        aria-label={`${client.name} (opens in new tab)`}
      >
        {inner}
        {tooltip}
      </a>
    );
  }

  return (
    <div
      className={`client-logo-link group relative flex items-center justify-center rounded-2xl border px-4 py-4.5${client.hoverMessage ? " cursor-default" : ""}`}
      aria-label={client.hoverMessage ? `${client.name} — ${client.hoverMessage}` : client.name}
    >
      {inner}
      {tooltip}
    </div>
  );
}

export default function ClientLogoStrip() {
  return (
    <section
      className="client-logo-strip border-y"
      style={{
        borderColor: "var(--border-color)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--surface-alpha) 80%, transparent), transparent 72%)",
      }}
      aria-labelledby="client-logo-strip-heading"
    >
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p
            id="client-logo-strip-heading"
            className="text-accent text-[13px] font-mono uppercase tracking-widest"
          >
            Selected clients
          </p>
          <p className="mt-2 text-muted text-[15px] sm:text-base max-w-lg mx-auto leading-relaxed">
            Businesses we&apos;ve built for across Georgia and the Southeast.
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 sm:gap-6"
        >
          {CLIENT_LOGOS.map((client) => (
            <li key={client.name}>
              <LogoMark client={client} />
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
