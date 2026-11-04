import type { User } from "@supabase/supabase-js";

/**
 * Hoppy Social is granted in Supabase app_metadata, which only the service
 * role can write. A website client with `tenant` set and nothing else is
 * turned away. Do not read user_metadata — the account holder can edit it.
 */
export function hasSocialAccess(user: User | null | undefined): boolean {
  const meta = user?.app_metadata;
  if (!meta || typeof meta !== "object") return false;
  if (meta.role === "agency_owner") return true;
  if (meta.social === true) return true;
  const products = meta.products;
  return Array.isArray(products) && products.includes("social");
}
