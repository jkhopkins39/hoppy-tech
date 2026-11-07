import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { BRAND } from "../config/brandColors";
import { hasSocialAccess } from "../social/access";
import { clearToken, errorText, exchangeSupabaseSession, getToken } from "../social/api";
import { StudioShell } from "../social/ui";
import {
  BoostsPage,
  BrandPage,
  CalendarPage,
  CollectionsPage,
  InboxPage,
  LibraryPage,
  PostPage,
  RecipesPage,
  RosterPage,
} from "../social/pages";

type Gate = "loading" | "login" | "denied" | "studio" | "error";

export default function Social() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = "hoppy-social-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&family=Syne:wght@600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setError("Supabase is not configured.");
      setGate("error");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: existing } }) => {
        setSession(existing);
        if (!existing) setGate("login");
      })
      .catch((err: unknown) => {
        setError(errorText(err, "Could not read the sign-in session."));
        setGate("error");
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!hasSocialAccess(session.user)) {
      clearToken();
      setGate("denied");
      return;
    }
    if (getToken()) {
      setGate("studio");
      return;
    }
    let cancelled = false;
    setGate("loading");
    exchangeSupabaseSession(session.access_token)
      .then(() => {
        if (!cancelled) setGate("studio");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        clearToken();
        setError(err.message);
        setGate("error");
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <div className="studio-root min-h-screen bg-studio-void text-studio-paper font-studio-sans">
      {gate === "loading" ? (
        <Centered>
          <p className="font-studio-mono text-xs tracking-widest uppercase text-studio-tungsten" role="status">
            Opening the studio…
          </p>
        </Centered>
      ) : null}
      {gate === "login" ? <Centered><SocialLogin onError={setError} /></Centered> : null}
      {gate === "denied" ? <Centered><Denied /></Centered> : null}
      {gate === "error" ? <Centered><StudioError message={error || "The studio could not open."} /></Centered> : null}
      {gate === "studio" ? (
        <StudioShell>
          <Routes>
            <Route index element={<Navigate to="inbox" replace />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="post" element={<PostPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="brand" element={<BrandPage />} />
            <Route path="boosts" element={<BoostsPage />} />
            <Route path="*" element={<Navigate to="inbox" replace />} />
          </Routes>
        </StudioShell>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <main className="min-h-screen grid place-items-center px-6">{children}</main>;
}

function SocialLogin({ onError }: { onError: (msg: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setLocalError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message;
        setLocalError(msg);
        onError("");
      }
    } catch (err) {
      setLocalError(errorText(err, "Could not sign in. Try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm border border-studio-line bg-studio-tape/50 p-8 shadow-studio">
      <p className="font-studio-mono text-[10px] tracking-[0.3em] uppercase text-studio-tungsten">Hoppy Tech</p>
      <h1 className="font-studio-display text-4xl mt-2">Hoppy Social</h1>
      <p className="mt-3 text-sm text-studio-muted">
        Same email as the client portal. Only accounts signed up for socials get in. Nothing publishes until you tap approve.
      </p>
      {localError ? (
        <p id="social-login-error" role="alert" className="mt-4 text-sm text-studio-cue">
          {localError}
        </p>
      ) : null}
      <label className="block mt-8 text-xs font-studio-mono tracking-widest uppercase text-studio-muted" htmlFor="social-email">
        Email
      </label>
      <input
        id="social-email"
        type="email"
        required
        autoComplete="email"
        aria-invalid={localError ? true : undefined}
        aria-describedby={localError ? "social-login-error" : undefined}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 w-full bg-studio-void border border-studio-line px-3 py-3 text-studio-paper"
      />
      <label className="block mt-4 text-xs font-studio-mono tracking-widest uppercase text-studio-muted" htmlFor="social-password">
        Password
      </label>
      <input
        id="social-password"
        type="password"
        required
        autoComplete="current-password"
        aria-invalid={localError ? true : undefined}
        aria-describedby={localError ? "social-login-error" : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 w-full bg-studio-void border border-studio-line px-3 py-3 text-studio-paper"
      />
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="mt-6 w-full bg-studio-tungsten text-studio-ink font-studio-display text-lg py-3 disabled:opacity-60"
      >
        {loading ? "Checking…" : "Open the studio"}
      </button>
      <p className="mt-6 text-sm text-studio-muted">
        Website admin is on the{" "}
        <Link to="/portal" className="text-studio-tungsten">
          client portal
        </Link>
        .
      </p>
    </form>
  );
}

function StudioError({ message }: { message: string }) {
  async function signOut() {
    clearToken();
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      /* still leave this login */
    }
    window.location.assign("/social");
  }

  return (
    <div className="w-full max-w-sm border border-studio-line bg-studio-tape/50 p-8 shadow-studio">
      <p className="font-studio-mono text-[10px] tracking-[0.3em] uppercase text-studio-tungsten">Studio</p>
      <h1 className="text-3xl mt-2">The studio could not open</h1>
      <p className="mt-3 text-sm text-studio-muted" role="alert">
        {message}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 w-full bg-studio-tungsten text-studio-ink font-studio-display py-3"
      >
        Try again
      </button>
      <button type="button" onClick={() => void signOut()} className="mt-4 w-full text-sm text-studio-muted underline">
        Use a different login
      </button>
      <Link to="/portal" className="mt-4 block text-center text-sm text-studio-tungsten">
        Back to the client portal
      </Link>
    </div>
  );
}

function Denied({ message }: { message?: string }) {
  async function signOut() {
    clearToken();
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      /* still leave this login */
    }
    window.location.assign("/social");
  }

  return (
    <div className="w-full max-w-sm border border-studio-line bg-studio-tape/50 p-8 shadow-studio">
      <p className="font-studio-mono text-[10px] tracking-[0.3em] uppercase text-studio-cue">No socials seat</p>
      <h1 className="font-studio-display text-3xl mt-2">This login stays on the website</h1>
      <p className="mt-3 text-sm text-studio-muted">
        {message ||
          "That account can open its website admin. Hoppy Social is a separate product, and this login is not signed up for it."}
      </p>
      <Link
        to="/portal"
        className="mt-6 block text-center bg-studio-tungsten text-studio-ink font-studio-display py-3"
        style={{ color: BRAND.navy }}
      >
        Back to the client portal
      </Link>
      <button type="button" onClick={() => void signOut()} className="mt-4 w-full text-sm text-studio-muted underline">
        Use a different login
      </button>
    </div>
  );
}
