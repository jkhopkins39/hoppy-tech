import React, { useState, useEffect, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { TENANTS, getTenantConfig, buildCallbackUrl, type TenantConfig } from '../lib/portal';
import { BRAND } from '../config/brandColors';

/* ── Types ────────────────────────────────────────────────── */

type ViewState = 'loading' | 'login' | 'routing' | 'hub' | 'error';

/* ── Root component ───────────────────────────────────────── */

export default function Portal() {
  const [view, setView] = useState<ViewState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [routingTo, setRoutingTo] = useState<TenantConfig | null>(null);
  const [error, setError] = useState('');
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel env vars.');
      setView('error');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setView(session ? 'routing' : 'login');
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
      // A client app signed the user out and redirected here. Clear the param
      // then sign out the portal session so we land on the login form.
      window.history.replaceState({}, '', window.location.pathname);
      supabase.auth.signOut(); // triggers onAuthStateChange → view = 'login'
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setView(session ? 'routing' : 'login');
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  // Route immediately after session resolves
  useEffect(() => {
    if (view !== 'routing' || !session || !user || redirectedRef.current) return;

    const tenant = user.app_metadata?.tenant as string | undefined;
    const role = user.app_metadata?.role as string | undefined;

    if (tenant) {
      const config = getTenantConfig(tenant);
      if (config && session.access_token && session.refresh_token) {
        redirectedRef.current = true;
        setRoutingTo(config);
        const dest = buildCallbackUrl(config, session.access_token, session.refresh_token);
        setTimeout(() => { window.location.href = dest; }, 800);
      } else {
        setError('Your account has an unrecognised tenant. Contact your administrator.');
        setView('error');
      }
      return;
    }

    if (role === 'agency_owner') {
      setView('hub');
      return;
    }

    setError('Your account is not authorised for portal access. Contact your administrator.');
    setView('error');
  }, [view, session, user]);

  if (view === 'loading') return <Screen><Spinner /></Screen>;
  if (view === 'error') return <Screen><ErrorCard message={error} /></Screen>;
  if (view === 'login') return <Screen><LoginForm onError={setError} /></Screen>;
  if (view === 'routing') return <Screen><RoutingCard tenant={routingTo} /></Screen>;
  if (view === 'hub') return <HubView session={session!} user={user!} />;

  return null;
}

/* ── Screen wrapper (centres content) ────────────────────── */

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: `var(--canvas)` }}
    >
      <div className="w-full max-w-md">
        <PortalLogo />
        {children}
      </div>
    </div>
  );
}

function PortalLogo() {
  return (
    <div className="flex flex-col items-center mb-8">
      <span className="font-display text-2xl font-bold" style={{ color: BRAND.skyBlue }}>
        Hoppy Tech
      </span>
      <span className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
        Client Admin Portal
      </span>
    </div>
  );
}

/* ── Login form ───────────────────────────────────────────── */

function LoginForm({ onError }: { onError: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setLocalError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message;
      setLocalError(msg);
      onError('');
    }
    setLoading(false);
  };

  return (
    <div
      className="rounded-2xl border p-8"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <h1 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
        Sign in
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Use your admin credentials to access your dashboard.
      </p>

      {localError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--muted)' }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-color)',
              color: 'var(--ink)',
            }}
            onFocus={e => (e.target.style.borderColor = BRAND.skyBlue)}
            onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--muted)' }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-color)',
              color: 'var(--ink)',
            }}
            onFocus={e => (e.target.style.borderColor = BRAND.skyBlue)}
            onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all mt-1 disabled:opacity-60"
          style={{
            background: BRAND.skyBlue,
            color: BRAND.navy,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

/* ── Routing transition card ──────────────────────────────── */

function RoutingCard({ tenant }: { tenant: TenantConfig | null }) {
  return (
    <div
      className="rounded-2xl border p-8 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
    >
      <Spinner />
      <p className="mt-4 font-medium" style={{ color: 'var(--ink)' }}>
        {tenant ? `Redirecting to ${tenant.label}…` : 'Routing…'}
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
        You'll land directly in your dashboard.
      </p>
    </div>
  );
}

/* ── Error card ───────────────────────────────────────────── */

function ErrorCard({ message }: { message: string }) {
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div
      className="rounded-2xl border p-8"
      style={{ background: 'var(--surface)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      <p className="font-medium mb-2" style={{ color: '#f87171' }}>Access error</p>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>{message}</p>
      <button
        onClick={handleSignOut}
        className="text-sm underline"
        style={{ color: 'var(--muted)' }}
      >
        Sign out
      </button>
    </div>
  );
}

/* ── Hub view (agency owner sees all clients) ─────────────── */

function HubView({ session, user }: { session: Session; user: User }) {
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendError, setSendError] = useState('');

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const handleOpen = (tenant: TenantConfig) => {
    if (!session.access_token || !session.refresh_token) return;
    const dest = buildCallbackUrl(tenant, session.access_token, session.refresh_token);
    window.location.href = dest;
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    setSendError('');
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      setSendResult(data);
      setSubject('');
      setMessage('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold" style={{ color: BRAND.skyBlue }}>
            Hoppy Tech
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            Admin Hub
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--muted)',
              border: '1px solid var(--border-color)',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Client grid */}
      <main className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
            Client Dashboards
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Open any client's admin panel. Your session transfers automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(TENANTS).map(tenant => (
            <ClientCard
              key={tenant.key}
              tenant={tenant}
              onOpen={() => handleOpen(tenant)}
            />
          ))}
        </div>

        {/* Announcement panel */}
        <div className="mt-10">
          <button
            onClick={() => { setAnnouncementOpen(o => !o); setSendResult(null); setSendError(''); }}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', color: 'var(--muted)' }}
          >
            <span>📢</span>
            <span>{announcementOpen ? 'Hide' : 'Send Announcement to All Clients'}</span>
          </button>

          {announcementOpen && (
            <form
              onSubmit={handleBroadcast}
              className="mt-4 rounded-2xl border p-6 flex flex-col gap-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border-color)' }}
            >
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  placeholder="Scheduled maintenance — June 20"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Hi, we'll be performing scheduled maintenance on your site from 2–4 AM EST…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {sendResult && (
                <p className="text-sm" style={{ color: '#4ade80' }}>
                  Sent to {sendResult.sent}/{sendResult.total} clients.
                  {sendResult.failed > 0 && ` (${sendResult.failed} failed)`}
                </p>
              )}
              {sendError && (
                <p className="text-sm" style={{ color: '#f87171' }}>{sendError}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="self-start rounded-lg px-5 py-2 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: BRAND.skyBlue, color: BRAND.navy }}
              >
                {sending ? 'Sending…' : 'Send to All Clients'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Client card ──────────────────────────────────────────── */

function ClientCard({ tenant, onOpen }: { tenant: TenantConfig; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        borderColor: hovered ? BRAND.skyBlue + '60' : 'var(--border-color)',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-sm leading-tight" style={{ color: 'var(--ink)' }}>
            {tenant.label}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {tenant.description}
          </p>
        </div>
        <span
          className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide"
          style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
        >
          {tenant.key}
        </span>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={onOpen}
          className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
          style={{ background: BRAND.skyBlue, color: BRAND.navy }}
        >
          Open Admin ↗
        </button>
      </div>
    </div>
  );
}

/* ── Spinner ──────────────────────────────────────────────── */

function Spinner() {
  return (
    <div className="flex justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${BRAND.skyBlue} transparent transparent transparent` }}
      />
    </div>
  );
}
