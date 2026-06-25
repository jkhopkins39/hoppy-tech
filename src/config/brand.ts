/** Hoppy Tech brand assets (public/) */
export const LETTERMARK = '/WebsiteLogo.png';
export const WORDMARK = '/WebsiteLogo.png';

/** Bump when replacing assets so browsers fetch the latest files. */
export const BRAND_VERSION = '4';

export const LETTERMARK_URL = `${LETTERMARK}?v=${BRAND_VERSION}`;
export const WORDMARK_URL = `${WORDMARK}?v=${BRAND_VERSION}`;

/** @deprecated Use LETTERMARK_URL — kept for existing imports */
export const WEBSITE_LOGO = LETTERMARK;
export const WEBSITE_LOGO_VERSION = BRAND_VERSION;
export const WEBSITE_LOGO_URL = LETTERMARK_URL;

export const WEBSITE_LOGO_ALT = 'Hoppy Tech';
export const WORDMARK_ALT = 'Hoppy Tech';
