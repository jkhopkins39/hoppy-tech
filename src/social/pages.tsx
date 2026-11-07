import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_FIELDS,
  api,
  errorText,
  type BoostRow,
  type CollectionRow,
  type DraftRow,
  type MediaRow,
  type RecipeRow,
  type RosterRow,
} from "./api";
import { DualPreview, Empty, Header, fieldClass, pickPreview } from "./ui";

function Alert({ children }: { children: string }) {
  return (
    <p role="alert" className="text-studio-cue text-sm mb-4">
      {children}
    </p>
  );
}

function externalHref(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function InboxPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [active, setActive] = useState<DraftRow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [d, m] = await Promise.all([api.drafts(), api.media()]);
    if (!Array.isArray(d.drafts) || !Array.isArray(m.media)) {
      throw new Error("The agent sent an inbox the studio could not read.");
    }
    setDrafts(d.drafts);
    setMedia(m.media);
    setActive((current) => d.drafts.find((x) => x.id === current?.id) ?? d.drafts[0] ?? null);
    setError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, "Could not load the inbox."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const still = media.find((m) => m.id === active?.media_ids[0]);

  async function refreshAfter(action: "approve" | "cancel") {
    try {
      await load();
    } catch (err) {
      const done = action === "approve" ? "Approved" : "Dropped";
      setError(errorText(err, `${done}, but the inbox did not refresh. Reload before approving again.`));
    }
  }

  async function approve() {
    if (!active || busy) return;
    setBusy("approve");
    setError("");
    try {
      await api.approve(active.id);
    } catch (err) {
      setError(errorText(err, "Could not approve this cue."));
      setBusy("");
      return;
    }
    await refreshAfter("approve");
    setBusy("");
  }

  async function cancel() {
    if (!active || busy) return;
    setBusy("cancel");
    setError("");
    try {
      await api.cancel(active.id);
    } catch (err) {
      setError(errorText(err, "Could not drop this cue."));
      setBusy("");
      return;
    }
    await refreshAfter("cancel");
    setBusy("");
  }

  async function retry() {
    setLoading(true);
    setError("");
    try {
      await load();
    } catch (err) {
      setError(errorText(err, "Could not load the inbox."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="01" title="Approval inbox" blurb="Recipes and Messenger land here. Nothing posts until you tap." />
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <p className="font-studio-mono text-sm text-studio-muted" role="status">
          Pulling the inbox…
        </p>
      ) : drafts.length === 0 ? (
        error ? (
          <button type="button" onClick={() => void retry()} className="border border-studio-line px-5 py-3 text-sm">
            Try again
          </button>
        ) : (
          <Empty to="/social/post" action="Build a cue">
            No drafts waiting. Upload from New cue, or let a recipe draft a throwback.
          </Empty>
        )
      ) : (
        <div className="grid lg:grid-cols-[16rem_1fr] gap-8">
          <ul className="border-y border-studio-line divide-y divide-studio-line">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  onClick={() => setActive(draft)}
                  aria-current={active?.id === draft.id ? "true" : undefined}
                  className={`w-full text-left py-3 px-2 ${active?.id === draft.id ? "bg-studio-void" : ""}`}
                >
                  <span className="font-studio-mono text-[10px] text-studio-tungsten">
                    #{draft.number} · {draft.status} · {draft.source}
                  </span>
                  <span className="block font-studio-display">{draft.label || "Untitled cue"}</span>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <section>
              <DualPreview
                image={pickPreview(still)}
                imageAlt={still?.title}
                captionFb={active.caption_fb}
                captionIg={active.caption_ig}
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void approve()}
                  disabled={busy !== ""}
                  className="bg-studio-tungsten text-studio-ink px-5 py-3 font-studio-display disabled:opacity-60"
                >
                  {busy === "approve" ? "Cueing…" : "Approve — Instagram + Facebook"}
                </button>
                <button
                  type="button"
                  onClick={() => void cancel()}
                  disabled={busy !== ""}
                  className="border border-studio-line px-5 py-3 text-sm disabled:opacity-60"
                >
                  {busy === "cancel" ? "Dropping…" : "Drop it"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}

export function PostPage() {
  const [pages, setPages] = useState<{ page_id: string; name: string }[]>([]);
  const [pageId, setPageId] = useState("");
  const [media, setMedia] = useState<MediaRow | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [facts, setFacts] = useState<Record<string, string>>({});
  const [captionFb, setCaptionFb] = useState("");
  const [captionIg, setCaptionIg] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [heldDraft, setHeldDraft] = useState<{ id: string; number: number; mediaId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        const list = Array.isArray(me.pages) ? me.pages : [];
        setPages(list);
        setPageId(me.active_page_id || list[0]?.page_id || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, "Could not load connected pages."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onFile(file: File) {
    setEnhancing(true);
    setError("");
    setStatus("Gemini is grading the still. Crop, deblur, strip the corner mark, then 4:5 / 9:16 variants.");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name);
      const result = await api.upload(form);
      if (!result.media?.id) throw new Error("The agent did not return the still.");
      setMedia(result.media);
      setHeldDraft(null);
      setStatus("Still is on the light table.");
    } catch (err) {
      setStatus("");
      setError(errorText(err, "Upload failed."));
    } finally {
      setEnhancing(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!media) {
      setError("Upload a still first.");
      return;
    }
    if (heldDraft && heldDraft.mediaId === media.id) {
      setError(
        `Draft #${heldDraft.number} is already in the inbox. Approve it there. Sending again would create a second cue.`,
      );
      return;
    }
    const missing = DEFAULT_FIELDS.filter((field) => field.required && !(facts[field.key] ?? "").trim());
    if (missing.length) {
      setError(`Fill ${missing.map((field) => field.label.toLowerCase()).join(" and ")} before saving.`);
      return;
    }
    let scheduled: string | null = null;
    if (when) {
      const hold = new Date(when);
      if (Number.isNaN(hold.getTime())) {
        setError("That hold time is not a real date.");
        return;
      }
      if (hold.getTime() < Date.now() - 60_000) {
        setError("That hold time is already past. Pick a later time, or leave it empty to post now.");
        return;
      }
      scheduled = hold.toISOString();
    }
    const facebook = captionFb.trim();
    const instagram = captionIg.trim();
    setError("");
    setSubmitting(true);
    try {
      const instruction = Object.entries(facts)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v.trim()}`)
        .join(". ");
      const created = await api.createDraft({
        page_id: pageId || null,
        media_ids: [media.id],
        instruction,
        facts,
        caption: facebook,
        caption_fb: facebook,
        caption_ig: instagram,
        scheduled_for: scheduled,
      });
      if (!created.draft?.id) throw new Error("The agent did not return the draft.");
      setHeldDraft({ id: created.draft.id, number: created.draft.number, mediaId: media.id });
      if (!facebook) {
        setStatus("Draft saved in the inbox. Add a caption and approve there.");
        return;
      }
      try {
        const approved = await api.approve(created.draft.id);
        setStatus(
          approved.draft.status === "scheduled"
            ? `Held for ${when}. It will not post until that clock.`
            : "In the 10-second cancel window, then Instagram and Facebook.",
        );
      } catch (err) {
        setStatus("");
        setError(
          `Draft #${created.draft.number} is in the inbox, but approval failed. ${errorText(err, "Open the inbox to approve it. Sending again would create a second cue.")}`,
        );
      }
    } catch (err) {
      setError(errorText(err, "Could not create the draft."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="02" title="New cue" blurb="Fill the call sheet. The still is graded before you ever see a preview." />
      <form onSubmit={onSubmit} className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-10">
        <div>
          <label htmlFor="still" className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted">
            Still
          </label>
          <input
            id="still"
            type="file"
            accept="image/*,video/*"
            disabled={enhancing}
            aria-busy={enhancing}
            className="mt-2 block w-full text-sm disabled:opacity-60"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          {enhancing ? (
            <p className="mt-3 text-studio-tungsten font-studio-mono text-sm" aria-live="polite">
              Grading on the truck… {status}
            </p>
          ) : null}
          <div className="mt-6">
            <DualPreview
              image={pickPreview(media ?? undefined)}
              imageAlt={media?.title}
              captionFb={captionFb}
              captionIg={captionIg}
              pageName={pages.find((p) => p.page_id === pageId)?.name}
            />
          </div>
        </div>
        <fieldset className="border border-studio-line p-5 bg-studio-tape/30">
          <legend className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-tungsten px-1">Call sheet</legend>
          <label className="block text-xs text-studio-muted mt-2" htmlFor="page">
            Page
          </label>
          <select id="page" value={pageId} onChange={(e) => setPageId(e.target.value)} className={fieldClass}>
            {pages.length === 0 ? <option value="">No page connected</option> : null}
            {pages.map((p) => (
              <option key={p.page_id} value={p.page_id}>
                {p.name}
              </option>
            ))}
          </select>
          {DEFAULT_FIELDS.map((field) => (
            <div key={field.key} className="mt-4">
              <label className="text-xs text-studio-muted" htmlFor={field.key}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <input
                id={field.key}
                value={facts[field.key] ?? ""}
                onChange={(e) => setFacts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.hint}
                aria-required={field.required || undefined}
                className={fieldClass}
              />
            </div>
          ))}
          <label className="block text-xs text-studio-muted mt-4" htmlFor="fb">
            Facebook caption
          </label>
          <textarea id="fb" rows={4} value={captionFb} onChange={(e) => setCaptionFb(e.target.value)} className={fieldClass} />
          <label className="block text-xs text-studio-muted mt-4" htmlFor="ig">
            Instagram caption
          </label>
          <textarea id="ig" rows={3} value={captionIg} onChange={(e) => setCaptionIg(e.target.value)} className={fieldClass} />
          <label className="block text-xs text-studio-muted mt-4" htmlFor="when">
            Hold until (optional)
          </label>
          <input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={fieldClass} />
          {error ? (
            <p role="alert" className="mt-3 text-sm text-studio-cue">
              {error}
            </p>
          ) : null}
          {status && !enhancing ? (
            <p className="mt-3 text-sm text-studio-gel" role="status">
              {status}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={enhancing || submitting}
            aria-busy={submitting}
            className="mt-6 w-full bg-studio-tungsten text-studio-ink font-studio-display py-3 disabled:opacity-60"
          >
            {submitting ? "Sending…" : captionFb.trim() ? "Approve to both platforms" : "Save as draft"}
          </button>
        </fieldset>
      </form>
    </main>
  );
}

export function LibraryPage() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [active, setActive] = useState<MediaRow | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .media()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.media)) throw new Error("The agent sent a library the studio could not read.");
        setRows(data.media);
        setActive(data.media[0] ?? null);
        setDescription(data.media[0]?.description ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, "Could not load the library."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!active || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.patchMedia(active.id, { description });
      if (!result.media?.id) throw new Error("The agent did not return the updated still.");
      setRows((prev) => prev.map((m) => (m.id === result.media.id ? result.media : m)));
      setActive(result.media);
      setDescription(result.media.description ?? "");
    } catch (err) {
      setError(errorText(err, "Could not save the description."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="03" title="Library" blurb="Every still the agent can reach. Descriptions are how recipes know what they're posting." />
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <p className="text-studio-muted" role="status">
          Pulling the light table…
        </p>
      ) : rows.length === 0 ? (
        error ? null : (
          <p className="text-studio-muted">Empty light table. Upload from New cue or send a photo in Messenger.</p>
        )
      ) : (
        <div className="grid lg:grid-cols-[1fr_20rem] gap-8">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rows.map((row) => {
              const used = row.last_used_at ? "used" : "unused";
              const name = row.title?.trim() || "Untitled still";
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className="block w-full text-left"
                    aria-pressed={active?.id === row.id}
                    aria-label={`${name}, ${used}`}
                    onClick={() => {
                      setActive(row);
                      setDescription(row.description);
                    }}
                  >
                    <img src={row.ig_feed_url || row.url} alt="" className="aspect-[4/5] w-full object-cover border border-studio-line" />
                    <span className="font-studio-mono text-[10px] text-studio-muted">{row.last_used_at ? "Used" : "Unused"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {active ? (
            <aside className="border border-studio-line p-4 bg-studio-tape/30">
              <p className="font-studio-mono text-[10px] text-studio-tungsten">{active.kind}</p>
              <label className="block mt-3 text-xs text-studio-muted" htmlFor="desc">
                Description for the agent
              </label>
              <textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="mt-4 bg-studio-tungsten text-studio-ink px-4 py-2 font-studio-display disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save description"}
              </button>
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}

export function CalendarPage() {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .calendar()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.drafts)) throw new Error("The agent sent a calendar the studio could not read.");
        setRows(data.drafts);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, "Could not load the calendar."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="04" title="Calendar" blurb="Scheduled holds and recent airings. Instagram has no native schedule — this clock is ours." />
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <p className="text-studio-muted" role="status">
          Pulling the board…
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ol className="divide-y divide-studio-line border-y border-studio-line">
          {rows.map((row) => (
            <li key={row.id} className="py-4 flex gap-4">
              <time
                className="font-studio-mono text-studio-tungsten text-sm w-40 shrink-0"
                dateTime={row.scheduled_for || row.updated_at || undefined}
              >
                {(row.scheduled_for || row.updated_at || "Unscheduled").slice(0, 16).replace("T", " ")}
              </time>
              <div>
                <p className="font-studio-display">
                  #{row.number} {row.label}
                </p>
                <p className="text-sm text-studio-muted">
                  {row.status} · {row.source}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {!loading && !error && rows.length === 0 ? <p className="text-studio-muted mt-6">Nothing on the board.</p> : null}
    </main>
  );
}

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 7, label: "Sun" },
];

function dayNames(weekdays: number[]) {
  return weekdays.map((n) => DAYS.find((day) => day.n === n)?.label ?? String(n)).join(", ");
}

export function RecipesPage() {
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [name, setName] = useState("Throwback Tuesday");
  const [postType, setPostType] = useState("throwback");
  const [weekdays, setWeekdays] = useState<number[]>([2]);
  const [hour, setHour] = useState(10);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .recipes()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.recipes)) throw new Error("The agent sent recipes the studio could not read.");
        setRows(data.recipes);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorText(err, "Could not load recipes. The list below may be incomplete."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Name the recipe.");
      return;
    }
    if (weekdays.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      setError("Hour needs to be a whole number from 0 to 23.");
      return;
    }
    setBusy("create");
    setError("");
    try {
      const created = await api.createRecipe({
        name: name.trim(),
        post_type: postType,
        weekdays,
        hour,
        minute: 0,
      });
      if (!created.recipe?.id) throw new Error("The agent did not return the recipe.");
      setRows((prev) => [...prev, created.recipe]);
    } catch (err) {
      setError(errorText(err, "Could not add that recipe."));
    } finally {
      setBusy("");
    }
  }

  async function toggle(row: RecipeRow) {
    if (busy) return;
    setBusy(row.id);
    setError("");
    try {
      const updated = await api.patchRecipe(row.id, { ...row, enabled: !row.enabled });
      if (!updated.recipe?.id) throw new Error("The agent did not return the recipe.");
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated.recipe : r)));
    } catch (err) {
      setError(errorText(err, row.enabled ? "Could not pause that recipe." : "Could not enable that recipe."));
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header
        cue="05"
        title="Engagement recipes"
        blurb="The worker drafts on this clock. You still approve every post. Throwbacks, recognition, hardware — your week."
      />
      {loadError ? <Alert>{loadError}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <p className="text-studio-muted mb-10" role="status">
          Pulling recipes…
        </p>
      ) : null}
      {!loading && !loadError && rows.length === 0 ? (
        <p className="text-studio-muted mb-10">No recipes yet. Add one below. You still approve every draft they make.</p>
      ) : null}
      {rows.length > 0 ? (
      <ul className="divide-y divide-studio-line border-y border-studio-line mb-10">
        {rows.map((row) => (
          <li key={row.id} className="py-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-studio-display">{row.name}</p>
              <p className="text-sm text-studio-muted">
                {row.post_type} · {Array.isArray(row.weekdays) ? dayNames(row.weekdays) : "no days"} ·{" "}
                {Number.isInteger(row.hour) ? String(row.hour).padStart(2, "0") : "--"}:00
                {row.enabled ? "" : " · paused"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggle(row)}
              disabled={busy !== ""}
              aria-label={`${row.enabled ? "Pause" : "Enable"} ${row.name}`}
              className="font-studio-mono text-[10px] uppercase text-studio-tungsten disabled:opacity-60"
            >
              {busy === row.id ? "Saving…" : row.enabled ? "Pause" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
      ) : null}
      <form onSubmit={(event) => void onSubmit(event)} className="border border-studio-line p-5 bg-studio-tape/30 max-w-md">
        <label htmlFor="recipe-name" className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-tungsten">
          New recipe
        </label>
        <input id="recipe-name" className={`${fieldClass} mt-3`} value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="recipe-type" className="sr-only">
          Post type
        </label>
        <select id="recipe-type" className={`${fieldClass} mt-3`} value={postType} onChange={(e) => setPostType(e.target.value)}>
          <option value="throwback">Throwback</option>
          <option value="recognition">Recognition</option>
          <option value="hardware">Hardware</option>
          <option value="random">Random from library</option>
        </select>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <label key={day.n} className="font-studio-mono text-xs">
              <input
                type="checkbox"
                className="mr-1"
                checked={weekdays.includes(day.n)}
                onChange={() =>
                  setWeekdays((prev) => (prev.includes(day.n) ? prev.filter((x) => x !== day.n) : [...prev, day.n]))
                }
              />
              {day.label}
            </label>
          ))}
        </div>
        <label className="block mt-3 text-xs text-studio-muted" htmlFor="recipe-hour">
          Hour
          <input
            id="recipe-hour"
            type="number"
            min={0}
            max={23}
            step={1}
            value={Number.isNaN(hour) ? "" : hour}
            onChange={(e) => setHour(e.target.value === "" ? Number.NaN : Number(e.target.value))}
            className="ml-2 w-16 bg-studio-void border border-studio-line px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={busy !== ""}
          className="mt-4 bg-studio-tungsten text-studio-ink px-4 py-2 font-studio-display disabled:opacity-60"
        >
          {busy === "create" ? "Adding…" : "Add recipe"}
        </button>
      </form>
    </main>
  );
}

export function CollectionsPage() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .collections()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.collections)) throw new Error("The agent sent jobs the studio could not read.");
        setRows(data.collections);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorText(err, "Could not load job buckets. The list below may be incomplete."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await api.createCollection({ title: title.trim(), venue, event_type: eventType });
      if (!created.collection?.id) throw new Error("The agent did not return the job.");
      setRows((prev) => [created.collection, ...prev]);
      setTitle("");
    } catch (err) {
      setError(errorText(err, "Could not create that job."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="06" title="Job buckets" blurb="One collection per shoot. Throwbacks become “the Rialto gala,” not a random file." />
      {loadError ? <Alert>{loadError}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={(event) => void onSubmit(event)} className="grid sm:grid-cols-4 gap-3 mb-10">
        <div>
          <label htmlFor="job-title" className="sr-only">
            Title
          </label>
          <input id="job-title" required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2" />
        </div>
        <div>
          <label htmlFor="job-venue" className="sr-only">
            Venue
          </label>
          <input id="job-venue" placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2" />
        </div>
        <div>
          <label htmlFor="job-type" className="sr-only">
            Type
          </label>
          <input id="job-type" placeholder="Type" value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2" />
        </div>
        <button type="submit" disabled={busy} className="bg-studio-tungsten text-studio-ink font-studio-display disabled:opacity-60">
          {busy ? "Creating…" : "Create job"}
        </button>
      </form>
      {loading ? (
        <p className="text-studio-muted" role="status">
          Pulling jobs…
        </p>
      ) : null}
      {!loading && !loadError && rows.length === 0 ? (
        <p className="text-studio-muted">No jobs yet. Create one above so throwbacks keep a shoot name.</p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="divide-y divide-studio-line border-y border-studio-line">
          {rows.map((row) => (
            <li key={row.id} className="py-3">
              <p className="font-studio-display">{row.title}</p>
              <p className="text-sm text-studio-muted">{[row.event_type, row.venue, row.client].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

export function RosterPage() {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [kind, setKind] = useState("person");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .roster()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.roster)) throw new Error("The agent sent a roster the studio could not read.");
        setRows(data.roster);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(errorText(err, "Could not load the roster. The list below may be incomplete."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await api.createRoster({ kind, name: name.trim(), notes });
      if (!created.item?.id) throw new Error("The agent did not return the roster entry.");
      setRows((prev) => [...prev, created.item]);
      setName("");
      setNotes("");
    } catch (err) {
      setError(errorText(err, "Could not add that name."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="07" title="Roster" blurb="People, venues, gear. Recognition posts spell names from here — never from a face." />
      {loadError ? <Alert>{loadError}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={(event) => void onSubmit(event)} className="grid sm:grid-cols-4 gap-3 mb-10">
        <div>
          <label htmlFor="roster-kind" className="sr-only">
            Kind
          </label>
          <select id="roster-kind" value={kind} onChange={(e) => setKind(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2">
            <option value="person">Person</option>
            <option value="venue">Venue</option>
            <option value="gear">Gear</option>
          </select>
        </div>
        <div>
          <label htmlFor="roster-name" className="sr-only">
            Name
          </label>
          <input id="roster-name" required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2" />
        </div>
        <div>
          <label htmlFor="roster-notes" className="sr-only">
            Notes
          </label>
          <input id="roster-notes" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-studio-void border border-studio-line px-2 py-2" />
        </div>
        <button type="submit" disabled={busy} className="bg-studio-tungsten text-studio-ink font-studio-display disabled:opacity-60">
          {busy ? "Adding…" : "Add"}
        </button>
      </form>
      {loading ? (
        <p className="text-studio-muted" role="status">
          Pulling the roster…
        </p>
      ) : null}
      {!loading && !loadError && rows.length === 0 ? (
        <p className="text-studio-muted">No names yet. Add people, venues, and gear so captions do not guess.</p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="divide-y divide-studio-line border-y border-studio-line">
          {rows.map((row) => (
            <li key={row.id} className="py-3 flex gap-4">
              <span className="font-studio-mono text-[10px] uppercase text-studio-gel w-16">{row.kind}</span>
              <div>
                <p className="font-studio-display">{row.name}</p>
                {row.notes ? <p className="text-sm text-studio-muted">{row.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

const SECTIONS = ["about", "voice", "people", "places", "always", "never"] as const;

export function BrandPage() {
  const [pageId, setPageId] = useState("");
  const [pages, setPages] = useState<{ page_id: string; name: string }[]>([]);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [example, setExample] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [loadingVoice, setLoadingVoice] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const voiceReq = useRef(0);

  const showVoice = useCallback(async (id: string) => {
    const ticket = ++voiceReq.current;
    setPageId(id);
    setSaved("");
    setError("");
    setVoiceReady(false);
    setLoadingVoice(true);
    setSections({});
    setExample("");
    if (!id) {
      if (ticket === voiceReq.current) setLoadingVoice(false);
      return;
    }
    try {
      const brand = await api.brand(id);
      if (ticket !== voiceReq.current) return;
      if (!brand.profile) throw new Error("The agent did not return a voice for this page.");
      const nextSections = brand.profile.sections;
      setSections(
        nextSections && typeof nextSections === "object" && !Array.isArray(nextSections) ? nextSections : {},
      );
      setExample(typeof brand.profile.example === "string" ? brand.profile.example : "");
      setVoiceReady(true);
    } catch (err) {
      if (ticket !== voiceReq.current) return;
      setError(errorText(err, "Could not load this page's voice. Saving stays off until it loads."));
    } finally {
      if (ticket === voiceReq.current) setLoadingVoice(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        const list = Array.isArray(me.pages) ? me.pages : [];
        setPages(list);
        const id = me.active_page_id || list[0]?.page_id || "";
        void showVoice(id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(errorText(err, "Could not load connected pages."));
        setLoadingVoice(false);
      });
    return () => {
      cancelled = true;
      voiceReq.current += 1;
    };
  }, [showVoice]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loadingVoice || saving || !voiceReady) return;
    if (!pageId) {
      setError("Connect a page before saving a voice.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved("");
    try {
      await api.saveBrand({ page_id: pageId, sections, fields: DEFAULT_FIELDS, example });
      setSaved("Voice saved. Captions will follow it.");
    } catch (err) {
      setError(errorText(err, "Could not save this voice."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-3xl">
      <Header cue="08" title="Brand voice" blurb="About, voice, people, places, always, never. The drafting model reads this on every cue." />
      {error ? <Alert>{error}</Alert> : null}
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
        <div>
          <label htmlFor="brand-page" className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted">
            Page
          </label>
          <select
            id="brand-page"
            value={pageId}
            onChange={(e) => void showVoice(e.target.value)}
            disabled={saving}
            className="mt-1 bg-studio-void border border-studio-line px-2 py-2 disabled:opacity-60"
          >
            {pages.length === 0 ? <option value="">No page connected</option> : null}
            {pages.map((p) => (
              <option key={p.page_id} value={p.page_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {SECTIONS.map((key) => (
          <div key={key}>
            <label className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted" htmlFor={key}>
              {key}
            </label>
            <textarea
              id={key}
              rows={3}
              value={sections[key] ?? ""}
              disabled={loadingVoice}
              onChange={(e) => setSections((prev) => ({ ...prev, [key]: e.target.value }))}
              className={fieldClass}
            />
          </div>
        ))}
        <div>
          <label className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted" htmlFor="example">
            Example post
          </label>
          <textarea
            id="example"
            rows={3}
            value={example}
            disabled={loadingVoice}
            onChange={(e) => setExample(e.target.value)}
            className={fieldClass}
          />
        </div>
        {loadingVoice ? (
          <p className="text-studio-muted text-sm" role="status">
            Loading this page’s voice…
          </p>
        ) : null}
        {saved ? (
          <p className="text-studio-gel text-sm" role="status">
            {saved}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loadingVoice || saving || !pageId || !voiceReady}
          className="bg-studio-tungsten text-studio-ink px-5 py-3 font-studio-display disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save voice"}
        </button>
      </form>
    </main>
  );
}

export function BoostsPage() {
  const [rows, setRows] = useState<BoostRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .boosts()
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.posts)) throw new Error("The agent sent a boost list the studio could not read.");
        setRows(data.posts);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, "Could not load the boost list."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-6 lg:p-10 max-w-3xl">
      <Header
        cue="09"
        title="Boost list"
        blurb="Not an ads manager. These three earned the cheapest attention. Put twenty dollars behind one of them in Meta’s own boost flow."
      />
      {error ? <Alert>{error}</Alert> : null}
      {loading ? (
        <p className="text-studio-muted" role="status">
          Scoring recent posts…
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ol className="space-y-4">
          {rows.map((row, i) => {
            const href = externalHref(row.link);
            return (
              <li key={row.id} className="border border-studio-line p-4 bg-studio-tape/30">
                <p className="font-studio-mono text-[10px] text-studio-tungsten">
                  {String(i + 1).padStart(2, "0")} · score {row.boost_score}
                </p>
                <p className="mt-2">{row.caption || "(no caption)"}</p>
                {href ? (
                  <a href={href} className="mt-3 inline-block text-studio-gel text-sm" target="_blank" rel="noopener noreferrer">
                    Open on Facebook
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-studio-muted">No scored posts yet. Insights fill in after something airs.</p>
      ) : null}
    </main>
  );
}
