const API = (import.meta.env.HT_SOCIAL_API_URL as string | undefined) || "http://127.0.0.1:8000";
const TOKEN_KEY = "hoppy_portal_token";

export function apiUrl(path: string) {
  return `${API.replace(/\/$/, "")}${path}`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function errorText(err: unknown, fallback: string) {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function extractMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const detail = record.detail ?? record.message ?? record.error;
  if (typeof detail === "string") return detail.trim();
  if (!Array.isArray(detail)) return "";
  return detail
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "msg" in item) {
        const msg = (item as { msg: unknown }).msg;
        if (typeof msg === "string") return msg.trim();
      }
      return "";
    })
    .filter(Boolean)
    .join(". ");
}

function messageFromBody(text: string, fallback: string) {
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = extractMessage(JSON.parse(trimmed) as unknown);
    if (parsed) return parsed.slice(0, 400);
  } catch {
    /* plain text */
  }
  return trimmed.slice(0, 400);
}

const UNREACHABLE = "The studio could not reach the agent. Check that it is running, then try again.";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new Error(UNREACHABLE);
  }

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.assign("/social");
    throw new Error("Sign in again to keep working.");
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(messageFromBody(text, response.statusText || `Request failed (${response.status})`));
  }
  if (response.status === 204) return {} as T;
  const text = await response.text().catch(() => "");
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The agent sent a response the studio could not read.");
  }
}

export async function exchangeSupabaseSession(accessToken: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/portal/supabase"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(messageFromBody(text, "The studio could not open a session."));
  }
  const text = await response.text().catch(() => "");
  let body: { token?: string } = {};
  if (text.trim()) {
    try {
      body = JSON.parse(text) as { token?: string };
    } catch {
      throw new Error("The agent sent a response the studio could not read.");
    }
  }
  if (!body.token) throw new Error("The studio did not open a session.");
  setToken(body.token);
}

export const api = {
  logout: () => request("/portal/logout", { method: "POST" }),
  me: () =>
    request<{
      psid: string;
      tenant_id: string;
      active_page_id: string | null;
      pages: { page_id: string; name: string; ig_user_id: string }[];
    }>("/portal/me"),
  media: (qs = "") => request<{ media: MediaRow[] }>(`/portal/media${qs}`),
  upload: (form: FormData) =>
    request<{ media: MediaRow }>("/portal/media", { method: "POST", body: form }),
  patchMedia: (id: string, body: object) =>
    request<{ media: MediaRow }>(`/portal/media/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  drafts: () => request<{ drafts: DraftRow[] }>("/portal/drafts"),
  createDraft: (body: object) =>
    request<{ draft: DraftRow }>("/portal/drafts", { method: "POST", body: JSON.stringify(body) }),
  approve: (id: string) =>
    request<{ draft: DraftRow }>(`/portal/drafts/${id}/approve`, { method: "POST" }),
  cancel: (id: string) =>
    request<{ draft: DraftRow }>(`/portal/drafts/${id}/cancel`, { method: "POST" }),
  calendar: () => request<{ drafts: DraftRow[] }>("/portal/calendar"),
  collections: () => request<{ collections: CollectionRow[] }>("/portal/collections"),
  createCollection: (body: object) =>
    request<{ collection: CollectionRow }>("/portal/collections", { method: "POST", body: JSON.stringify(body) }),
  roster: () => request<{ roster: RosterRow[] }>("/portal/roster"),
  createRoster: (body: object) =>
    request<{ item: RosterRow }>("/portal/roster", { method: "POST", body: JSON.stringify(body) }),
  recipes: () => request<{ recipes: RecipeRow[] }>("/portal/recipes"),
  createRecipe: (body: object) =>
    request<{ recipe: RecipeRow }>("/portal/recipes", { method: "POST", body: JSON.stringify(body) }),
  patchRecipe: (id: string, body: object) =>
    request<{ recipe: RecipeRow }>(`/portal/recipes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  brand: (pageId: string) =>
    request<{ profile: ProfileRow }>(`/portal/brand?page_id=${encodeURIComponent(pageId)}`),
  saveBrand: (body: object) =>
    request<{ profile: ProfileRow }>("/portal/brand", { method: "PATCH", body: JSON.stringify(body) }),
  boosts: () => request<{ posts: BoostRow[] }>("/portal/boosts"),
};

export type MediaRow = {
  id: string;
  kind: string;
  title: string;
  description: string;
  tags: string[];
  collection_id: string | null;
  url: string;
  ig_feed_url: string;
  ig_story_url: string;
  created_at: string | null;
  last_used_at: string | null;
};

export type DraftRow = {
  id: string;
  number: number;
  label: string;
  summary: string;
  status: string;
  page_id: string | null;
  caption: string;
  caption_fb: string;
  caption_ig: string;
  facts: Record<string, string>;
  media_ids: string[];
  source: string;
  scheduled_for: string | null;
  presented: boolean;
  updated_at: string | null;
};

export type CollectionRow = {
  id: string;
  title: string;
  event_type: string;
  venue: string;
  client: string;
  event_date: string | null;
  people: string;
  notes: string;
};

export type RosterRow = { id: string; kind: string; name: string; notes: string; tags: string[] };

export type RecipeRow = {
  id: string;
  name: string;
  post_type: string;
  weekdays: number[];
  hour: number;
  minute: number;
  page_id: string;
  timezone: string;
  constraints: Record<string, unknown>;
  enabled: boolean;
  last_run_at: string | null;
};

export type ProfileRow = {
  page_id: string;
  sections: Record<string, string>;
  fields: { key: string; label: string; required?: boolean; hint?: string }[];
  example: string;
};

export type BoostRow = {
  id: string;
  caption: string;
  boost_score: number;
  link: string;
  published_at: string | null;
};

export const DEFAULT_FIELDS = [
  { key: "event_type", label: "Event type", required: true, hint: "Gala, wedding, corporate, install" },
  { key: "venue", label: "Venue", required: true, hint: "Where it happened" },
  { key: "client", label: "Client", required: false, hint: "Who hired the crew" },
  { key: "people_of_note", label: "People of note", required: false, hint: "Names to credit — never guess from faces" },
  { key: "what_happened", label: "What happened", required: false, hint: "The one sentence the post is about" },
];
