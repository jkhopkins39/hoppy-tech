/** Hoppy Tech brand assets (public/images/) */
export const LETTERMARK = '/images/ht-lettermark.png';
export const WORDMARK = '/images/ht-wordmark.png';

/** Bump when replacing assets so browsers fetch the latest files. */
export const BRAND_VERSION = '1';

export const LETTERMARK_URL = `${LETTERMARK}?v=${BRAND_VERSION}`;
export const WORDMARK_URL = `${WORDMARK}?v=${BRAND_VERSION}`;

/** @deprecated Use LETTERMARK_URL — kept for existing imports */
export const WEBSITE_LOGO = LETTERMARK;
export const WEBSITE_LOGO_VERSION = BRAND_VERSION;
export const WEBSITE_LOGO_URL = LETTERMARK_URL;

export const WEBSITE_LOGO_ALT = 'Hoppy Tech';
export const WORDMARK_ALT = 'Hoppy Tech';
