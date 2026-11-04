import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { api, clearToken, getToken, type MediaRow } from "./api";

const NAV = [
  { href: "/social/inbox", label: "Inbox", cue: "01" },
  { href: "/social/post", label: "New cue", cue: "02" },
  { href: "/social/library", label: "Library", cue: "03" },
  { href: "/social/calendar", label: "Calendar", cue: "04" },
  { href: "/social/recipes", label: "Recipes", cue: "05" },
  { href: "/social/collections", label: "Jobs", cue: "06" },
  { href: "/social/roster", label: "Roster", cue: "07" },
  { href: "/social/brand", label: "Voice", cue: "08" },
  { href: "/social/boosts", label: "Boost list", cue: "09" },
];

export function StudioShell({ children }: { children: ReactNode }) {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      navigate("/social", { replace: true });
      return;
    }
    setReady(true);
    api
      .drafts()
      .then((d) => setWaiting(d.drafts.filter((x) => x.status === "open").length))
      .catch(() => undefined);
  }, [path, navigate]);

  if (!ready) return <div className="min-h-screen bg-studio-void" />;

  async function signOut() {
    try {
      await api.logout();
    } finally {
      clearToken();
      if (supabase) await supabase.auth.signOut();
      navigate("/social", { replace: true });
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[11rem_1fr] bg-studio-void text-studio-paper font-studio-sans">
      <aside className="border-r border-studio-line bg-studio-tape/60 film-perf pl-3">
        <div className="px-4 py-6">
          <p className="font-studio-mono text-[10px] tracking-[0.28em] uppercase text-studio-tungsten">Hoppy Social</p>
          <h1 className="font-studio-display text-2xl leading-none mt-1">Studio</h1>
          <p className="mt-2 text-xs text-studio-muted">Instagram + Facebook. Nothing airs without a tap.</p>
          <Link to="/portal" className="mt-3 inline-block font-studio-mono text-[10px] tracking-widest uppercase text-studio-gel">
            Client portal
          </Link>
        </div>
        <nav aria-label="Studio" className="flex flex-col gap-0.5 px-2 pb-8">
          {NAV.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-baseline gap-3 px-3 py-2 rounded-sm text-sm ${
                  active ? "bg-studio-void text-studio-paper" : "text-studio-muted hover:text-studio-paper"
                }`}
              >
                <span className="font-studio-mono text-[10px] text-studio-tungsten w-5">{item.cue}</span>
                {item.label}
                {item.href === "/social/inbox" && waiting > 0 ? (
                  <span className="ml-auto font-studio-mono text-[10px] text-studio-cue">{waiting}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="mx-4 mb-6 font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted hover:text-studio-paper"
        >
          Sign out
        </button>
      </aside>
      <div id="main" className="min-w-0">
        {children}
      </div>
    </div>
  );
}

export function Header({ cue, title, blurb }: { cue: string; title: string; blurb: string }) {
  return (
    <header className="mb-8">
      <p className="font-studio-mono text-[10px] tracking-[0.28em] uppercase text-studio-tungsten">Cue {cue}</p>
      <h2 className="font-studio-display text-4xl mt-1">{title}</h2>
      <p className="mt-2 text-studio-muted max-w-xl">{blurb}</p>
    </header>
  );
}

export function Empty({ children, to, action }: { children: ReactNode; to: string; action: string }) {
  return (
    <div className="border border-dashed border-studio-line p-10 text-studio-muted">
      <p>{children}</p>
      <Link to={to} className="inline-block mt-4 text-studio-tungsten font-studio-display">
        {action} →
      </Link>
    </div>
  );
}

export function DualPreview({
  image,
  captionFb,
  captionIg,
  pageName = "Hoppy Tech",
}: {
  image?: string;
  captionFb: string;
  captionIg: string;
  pageName?: string;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <figure className="relative mx-auto w-[min(100%,280px)]">
        <div className="rounded-[2rem] border border-studio-line bg-studio-void p-3 shadow-studio">
          <p className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-gel px-2 pb-2">Instagram · 4:5</p>
          <div className="relative aspect-[4/5] overflow-hidden bg-studio-tape crop-frame">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full grid place-items-center text-studio-muted text-sm">No still</div>
            )}
          </div>
          <figcaption className="px-2 pt-3 text-sm whitespace-pre-wrap">{captionIg || "Caption will land here."}</figcaption>
        </div>
      </figure>
      <article className="rounded-sm border border-studio-line bg-studio-tape/40 p-4 shadow-studio">
        <p className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-tungsten">Facebook · feed</p>
        <p className="font-studio-display text-lg mt-1">{pageName}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{captionFb || "Facebook copy."}</p>
        {image ? <img src={image} alt="" className="mt-4 w-full max-h-56 object-cover border border-studio-line" /> : null}
      </article>
    </div>
  );
}

export function pickPreview(media: MediaRow | undefined) {
  if (!media) return "";
  return media.ig_feed_url || media.url;
}

const fieldClass = "mt-1 w-full bg-studio-void border border-studio-line px-2 py-2 text-studio-paper";

export { fieldClass };
