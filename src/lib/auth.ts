import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const AUTH_CHANGE_EVENT = 'admin-auth-change';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? 'jeremy@hoppytech.com').toLowerCase();

let cachedSession: Session | null = null;
let listenerStarted = false;

function isAllowedAdmin(session: Session | null): boolean {
  return !!session?.access_token && session.user.email?.toLowerCase() === ADMIN_EMAIL;
}

export function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function initAdminAuth(): void {
  if (listenerStarted) return;
  listenerStarted = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    cachedSession = session;
    notifyAuthChange();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedSession = session;
    notifyAuthChange();
  });
}

export function isAdminLoggedIn(): boolean {
  return isAllowedAdmin(cachedSession);
}

export function authHeaders(): Record<string, string> {
  const token = cachedSession?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!isAllowedAdmin(data.session)) {
    await supabase.auth.signOut();
    cachedSession = null;
    notifyAuthChange();
    throw new Error('This account is not authorized for admin access.');
  }
  cachedSession = data.session;
  notifyAuthChange();
}

export async function clearAdminAuth(): Promise<void> {
  await supabase.auth.signOut();
  cachedSession = null;
  localStorage.removeItem('blogAdminLoggedIn');
  notifyAuthChange();
}
