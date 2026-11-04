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

async function errorDetail(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { detail?: string };
    if (typeof body.detail === "string" && body.detail) return body.detail;
  } catch {
    /* plain text */
  }
  return text.slice(0, 400) || response.statusText;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.assign("/social");
    throw new Error("sign in");
  }
  if (!response.ok) {
    throw new Error(await errorDetail(response));
  }
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export async function exchangeSupabaseSession(accessToken: string): Promise<void> {
  const response = await fetch(apiUrl("/portal/supabase"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!response.ok) {
    throw new Error(await errorDetail(response));
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("studio did not open a session");
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
