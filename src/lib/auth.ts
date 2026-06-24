import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './supabase';

export const AUTH_CHANGE_EVENT = 'admin-auth-change';

let cachedSession: Session | null = null;
let listenerStarted = false;

export function isAgencyOwner(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === 'agency_owner';
}

function isAllowedAdmin(session: Session | null): boolean {
  return !!session?.access_token && isAgencyOwner(session.user);
}

export function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function initAdminAuth(): void {
  if (listenerStarted || !supabase) return;
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
  if (!supabaseConfigured || !supabase) {
    throw new Error('Admin login is not configured on this site. Missing Supabase env vars.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Incorrect email or password for the agency owner account.');
    }
    throw new Error(error.message);
  }

  if (!isAllowedAdmin(data.session)) {
    await supabase.auth.signOut();
    cachedSession = null;
    notifyAuthChange();
    throw new Error(
      'That account is not an agency owner. Use jeremy@hoppytech.com (or your agency owner login), not a client portal account.',
    );
  }

  cachedSession = data.session;
  notifyAuthChange();
}

export async function clearAdminAuth(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  cachedSession = null;
  localStorage.removeItem('blogAdminLoggedIn');
  notifyAuthChange();
}
