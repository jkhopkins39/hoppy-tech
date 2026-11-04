import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { hasSocialAccess } from "../src/social/access";

function user(app_metadata: Record<string, unknown>): User {
  return { app_metadata } as User;
}

describe("Hoppy Social access", () => {
  it("rejects a website-only client", () => {
    expect(hasSocialAccess(user({ tenant: "cornerstone", role: "client" }))).toBe(false);
  });

  it("rejects an empty account", () => {
    expect(hasSocialAccess(null)).toBe(false);
    expect(hasSocialAccess(user({}))).toBe(false);
  });

  it("accepts a socials product grant", () => {
    expect(hasSocialAccess(user({ tenant: "illuminated", products: ["social"] }))).toBe(true);
  });

  it("accepts the agency owner", () => {
    expect(hasSocialAccess(user({ role: "agency_owner" }))).toBe(true);
  });

  it("ignores a products claim that is not an array", () => {
    expect(hasSocialAccess(user({ products: "social" }))).toBe(false);
  });
});
