import { authHeaders } from './auth';

export interface ContactSubmission {
  id: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  company: string | null;
  project_type: string | null;
  problem: string | null;
  timeline: string | null;
  budget: string | null;
  read: boolean | null;
  /** e.g. "google_ads" when ingested from Ads lead-form webhook */
  source?: string | null;
  google_lead_id?: string | null;

  /** Request metadata — added by 20260727_contact_security.sql */
  ip_address?: string | null;
  user_agent?: string | null;
  referer?: string | null;
  geo?: string | null;

  /** Verdict from the Gemini screening agent */
  screening_decision?: 'accept' | 'review' | 'reject' | null;
  screening_category?: string | null;
  screening_confidence?: number | null;
  screening_reason?: string | null;
  validation?: Record<string, unknown> | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => ({})) as T & { error?: string };

  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  return body;
}

export async function fetchSubmissions(): Promise<ContactSubmission[]> {
  const data = await adminFetch<{ submissions: ContactSubmission[] }>('/api/admin/submissions');
  return data.submissions;
}

export async function updateSubmissionRead(id: string, read: boolean): Promise<ContactSubmission> {
  const data = await adminFetch<{ submission: ContactSubmission }>('/api/admin/submissions', {
    method: 'PATCH',
    body: JSON.stringify({ id, read }),
  });
  return data.submission;
}

export async function deleteSubmissions(ids: string[]): Promise<void> {
  await adminFetch('/api/admin/submissions', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

export async function fetchChatSessions(): Promise<ChatSession[]> {
  const data = await adminFetch<{ sessions: ChatSession[] }>('/api/admin/chat-sessions');
  return data.sessions;
}

export async function deleteChatSession(id: string): Promise<void> {
  await adminFetch('/api/admin/chat-sessions', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export function submissionLabel(sub: ContactSubmission): string {
  const who = sub.name?.trim() || 'Anonymous';
  if (sub.email) return `${who} — ${sub.email}`;
  if (sub.phone) return `${who} — ${sub.phone}`;
  return who;
}

export function submissionPreview(sub: ContactSubmission): string {
  return sub.problem?.trim() || 'No description provided.';
}

/**
 * Screening badge: accept → Legit, review → Review, reject → Filtered.
 * Null for legacy rows with no screening decision.
 */
export function screeningBadge(
  sub: ContactSubmission,
): { label: string; className: string } | null {
  if (sub.screening_decision === 'reject') {
    return { label: 'Filtered', className: 'bg-red-500/10 text-red-400' };
  }
  if (sub.screening_decision === 'review') {
    return { label: 'Review', className: 'bg-amber-500/10 text-amber-400' };
  }
  if (sub.screening_decision === 'accept') {
    return { label: 'Legit', className: 'bg-emerald-500/10 text-emerald-400' };
  }
  return null;
}

export function isGoogleAdsLead(sub: ContactSubmission): boolean {
  return sub.source === 'google_ads' || sub.project_type === 'Google Ads Lead';
}
