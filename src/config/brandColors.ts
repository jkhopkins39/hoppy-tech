/** Hoppy Tech brand palette — blues sampled from WebsiteLogo.png gradient */
export const BRAND = {
  skyBlue: '#7AB2FC',
  skyBlueLight: '#B6DCFF',
  skyBlueMid: '#AED7FF',
  navy: '#023047',
  navyMid: '#0B3255',
  navyLight: '#114A75',
  cream: '#FAF9F0',
  creamDark: '#EDE8DC',
  taupe: '#AFA791',
  orange: '#FB8500',
  orangeLight: '#FFB703',
} as const;

/** RGB tuples for translucent overlays */
export const SKY_BLUE_RGB = '122, 178, 252';
export const SKY_BLUE_LIGHT_RGB = '182, 220, 255';

export const SKY_BLUE_A10 = `rgba(${SKY_BLUE_RGB}, 0.1)`;
export const SKY_BLUE_A14 = `rgba(${SKY_BLUE_RGB}, 0.14)`;
export const SKY_BLUE_LIGHT_A12 = `rgba(${SKY_BLUE_LIGHT_RGB}, 0.12)`;
export const NAVY_MID_A12 = 'rgba(11, 50, 85, 0.12)';
export const NAVY_MID_A14 = 'rgba(11, 50, 85, 0.14)';

export const BRAND_ACCENTS = [
  BRAND.skyBlue,
  BRAND.orange,
  BRAND.skyBlueLight,
  BRAND.navyMid,
  BRAND.orangeLight,
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  web: BRAND.skyBlue,
  mobile: BRAND.skyBlueLight,
  ai: BRAND.orange,
  other: BRAND.navyMid,
};

export const CATEGORY_BG: Record<string, string> = {
  web: `rgba(${SKY_BLUE_RGB}, 0.14)`,
  mobile: `rgba(${SKY_BLUE_LIGHT_RGB}, 0.14)`,
  ai: 'rgba(251, 133, 0, 0.14)',
  other: 'rgba(11, 50, 85, 0.2)',
};

export const LIVE_BUTTON_GRADIENT = `linear-gradient(135deg, ${BRAND.skyBlueLight}, ${BRAND.skyBlue})`;

export type TagStyle = { color: string; bg: string; border: string };

export const BLOG_TAG_STYLES_LIGHT: TagStyle[] = [
  { color: BRAND.navy, bg: `rgba(${SKY_BLUE_RGB}, 0.28)`, border: 'rgba(2, 48, 71, 0.2)' },
  { color: BRAND.navy, bg: 'rgba(251, 133, 0, 0.18)', border: 'rgba(251, 133, 0, 0.4)' },
  { color: BRAND.navy, bg: `rgba(${SKY_BLUE_RGB}, 0.22)`, border: 'rgba(2, 48, 71, 0.18)' },
  { color: BRAND.navy, bg: 'rgba(251, 133, 0, 0.14)', border: 'rgba(251, 133, 0, 0.35)' },
  { color: BRAND.navy, bg: 'rgba(11, 50, 85, 0.1)', border: 'rgba(11, 50, 85, 0.22)' },
];

export const BLOG_TAG_STYLES_DARK: TagStyle[] = [
  { color: BRAND.cream, bg: 'rgba(251, 133, 0, 0.28)', border: 'rgba(251, 133, 0, 0.55)' },
  { color: BRAND.cream, bg: `rgba(${SKY_BLUE_RGB}, 0.22)`, border: `rgba(${SKY_BLUE_RGB}, 0.48)` },
  { color: BRAND.orangeLight, bg: 'rgba(251, 133, 0, 0.22)', border: 'rgba(255, 183, 3, 0.5)' },
  { color: BRAND.cream, bg: `rgba(${SKY_BLUE_RGB}, 0.18)`, border: `rgba(${SKY_BLUE_RGB}, 0.42)` },
  { color: BRAND.orangeLight, bg: 'rgba(251, 133, 0, 0.18)', border: 'rgba(251, 133, 0, 0.45)' },
];
