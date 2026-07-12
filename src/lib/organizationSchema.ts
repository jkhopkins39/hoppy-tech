/**
 * Canonical JSON-LD entity for Hoppy Tech — referenced from hoppytech.com
 * and client-site footer credits so search engines treat the brand as a
 * technology company, not a misspelling of "hobby".
 */
export const HOPPY_TECH_ORG_ID = "https://www.hoppytech.com/#organization";

const hoppyTechOrganizationNode = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": HOPPY_TECH_ORG_ID,
  name: "Hoppy Tech",
  alternateName: ["HoppyTech", "hoppytech"],
  legalName: "Hoppy Tech",
  description:
    "Hoppy Tech is a technology company specializing in web development, software engineering, and AI solutions for individuals and businesses.",
  disambiguatingDescription:
    "A technology company and web-development studio — not related to hobbies or the word 'hobby'.",
  url: "https://www.hoppytech.com/",
  logo: {
    "@type": "ImageObject",
    url: "https://www.hoppytech.com/WebsiteLogo.png?v=4",
  },
  email: "jeremy@hoppytech.com",
  telephone: "+1-770-686-6503",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "jeremy@hoppytech.com",
    telephone: "+1-770-686-6503",
    areaServed: "US",
    availableLanguage: "English",
  },
  sameAs: [
    "https://github.com/jkhopkins39",
    "https://linkedin.com/in/jeremy-hopkins-160001275",
    "https://instagram.com/jeremykhopkins",
  ],
  areaServed: { "@type": "Country", name: "United States" },
  knowsAbout: [
    "Web Development",
    "Software Engineering",
    "Artificial Intelligence",
    "Machine Learning",
  ],
};

export function hoppyTechOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    ...hoppyTechOrganizationNode,
  };
}

/** Links a client WebSite to Hoppy Tech as its creator (footer credit). */
export function hoppyTechWebDeveloperAttributionJsonLd(opts: {
  siteUrl: string;
  siteName: string;
  description?: string;
}) {
  const base = opts.siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      hoppyTechOrganizationNode,
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: opts.siteName,
        ...(opts.description ? { description: opts.description } : {}),
        creator: { "@id": HOPPY_TECH_ORG_ID },
      },
    ],
  };
}
