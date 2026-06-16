/** Hoppy Tech brand palette (stylesheet) */
export const BRAND = {
  skyBlue: '#8ECAE6',
  skyBlueLight: '#B5DBF0',
  navy: '#023047',
  navyMid: '#034563',
  navyLight: '#045a7a',
  cream: '#FAF9F0',
  creamDark: '#EDE8DC',
  taupe: '#AFA791',
  orange: '#FB8500',
  orangeLight: '#FFB703',
} as const;

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
  web: 'rgba(142, 202, 230, 0.14)',
  mobile: 'rgba(181, 219, 240, 0.14)',
  ai: 'rgba(251, 133, 0, 0.14)',
  other: 'rgba(3, 69, 99, 0.2)',
};

export const LIVE_BUTTON_GRADIENT = `linear-gradient(135deg, ${BRAND.skyBlueLight}, ${BRAND.skyBlue})`;

export type TagStyle = { color: string; bg: string; border: string };

export const BLOG_TAG_STYLES_LIGHT: TagStyle[] = [
  { color: BRAND.navy, bg: 'rgba(142, 202, 230, 0.28)', border: 'rgba(2, 48, 71, 0.2)' },
  { color: BRAND.navy, bg: 'rgba(251, 133, 0, 0.18)', border: 'rgba(251, 133, 0, 0.4)' },
  { color: BRAND.navy, bg: 'rgba(142, 202, 230, 0.22)', border: 'rgba(2, 48, 71, 0.18)' },
  { color: BRAND.navy, bg: 'rgba(251, 133, 0, 0.14)', border: 'rgba(251, 133, 0, 0.35)' },
  { color: BRAND.navy, bg: 'rgba(3, 69, 99, 0.1)', border: 'rgba(3, 69, 99, 0.22)' },
];

export const BLOG_TAG_STYLES_DARK: TagStyle[] = [
  { color: BRAND.cream, bg: 'rgba(251, 133, 0, 0.28)', border: 'rgba(251, 133, 0, 0.55)' },
  { color: BRAND.cream, bg: 'rgba(142, 202, 230, 0.22)', border: 'rgba(142, 202, 230, 0.48)' },
  { color: BRAND.orangeLight, bg: 'rgba(251, 133, 0, 0.22)', border: 'rgba(255, 183, 3, 0.5)' },
  { color: BRAND.cream, bg: 'rgba(142, 202, 230, 0.18)', border: 'rgba(142, 202, 230, 0.42)' },
  { color: BRAND.orangeLight, bg: 'rgba(251, 133, 0, 0.18)', border: 'rgba(251, 133, 0, 0.45)' },
];
