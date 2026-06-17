export type TenantKey =
  | 'cornerstone'
  | 'otp'
  | 'illuminated'
  | 'joshua_firm'
  | 'sxnctuary'
  | 'bells'
  | 'watch_luxury';

export interface TenantConfig {
  key: TenantKey;
  label: string;
  description: string;
  /** Where the admin dashboard lives on the client's domain. */
  adminUrl: string;
  /**
   * Where the portal sends the user after login.
   * Next.js apps: /admin/auth/callback (server route that sets session cookies).
   * Vite/Express apps: /admin (JS on that page reads URL params + calls setSession).
   */
  callbackUrl: string;
}

export const TENANTS: Record<TenantKey, TenantConfig> = {
  cornerstone: {
    key: 'cornerstone',
    label: "Cornerstone Coatings",
    description: "Painting & coatings contractor",
    adminUrl: "https://cornerstonecoatingsga.com/admin",
    callbackUrl: "https://cornerstonecoatingsga.com/admin/auth/callback",
  },
  otp: {
    key: 'otp',
    label: "One Talent Productions",
    description: "Video & events production",
    adminUrl: "https://www.onetalentproductions.com/admin",
    callbackUrl: "https://www.onetalentproductions.com/admin/auth/callback",
  },
  illuminated: {
    key: 'illuminated',
    label: "Illuminated Productions",
    description: "Photography & visual media",
    adminUrl: "https://illuminated-prod.vercel.app/admin",
    callbackUrl: "https://illuminated-prod.vercel.app/admin/auth/callback",
  },
  joshua_firm: {
    key: 'joshua_firm',
    label: "Joshua 1:9 Law Firm",
    description: "Legal services",
    adminUrl: "https://joshua19lawfirm.com/admin",
    callbackUrl: "https://joshua19lawfirm.com/admin",
  },
  sxnctuary: {
    key: 'sxnctuary',
    label: "SXNCTUARY",
    description: "Music & merch",
    adminUrl: "https://sxnctuary.com/admin",
    callbackUrl: "https://sxnctuary.com/admin",
  },
  bells: {
    key: 'bells',
    label: "Bell's Southern Creations",
    description: "Custom art & creations",
    adminUrl: "https://www.bellssoutherncreations.com/admin",
    callbackUrl: "https://www.bellssoutherncreations.com/admin",
  },
  watch_luxury: {
    key: 'watch_luxury',
    label: "Watch Trading Post",
    description: "Luxury watch marketplace",
    adminUrl: "https://www.watchtradingpost.com/admin/dashboard",
    callbackUrl: "https://www.watchtradingpost.com/admin/auth/callback",
  },
};

export function getTenantConfig(tenantKey: string): TenantConfig | null {
  return TENANTS[tenantKey as TenantKey] ?? null;
}

/** Builds the cross-domain redirect URL for SSO session transfer. */
export function buildCallbackUrl(
  tenant: TenantConfig,
  accessToken: string,
  refreshToken: string,
): string {
  const url = new URL(tenant.callbackUrl);
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('refresh_token', refreshToken);
  return url.toString();
}
