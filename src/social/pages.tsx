import { FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_FIELDS,
  api,
  type BoostRow,
  type CollectionRow,
  type DraftRow,
  type MediaRow,
  type RecipeRow,
  type RosterRow,
} from "./api";
import { DualPreview, Empty, Header, fieldClass, pickPreview } from "./ui";

export function InboxPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [active, setActive] = useState<DraftRow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const [d, m] = await Promise.all([api.drafts(), api.media()]);
    setDrafts(d.drafts);
    setMedia(m.media);
    setActive((current) => d.drafts.find((x) => x.id === current?.id) ?? d.drafts[0] ?? null);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  const still = media.find((m) => m.id === active?.media_ids[0]);

  async function approve() {
    if (!active) return;
    setBusy("approve");
    try {
      await api.approve(active.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "approve failed");
    } finally {
      setBusy("");
    }
  }

  async function cancel() {
    if (!active) return;
    setBusy("cancel");
    try {
      await api.cancel(active.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "cancel failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="01" title="Approval inbox" blurb="Recipes and Messenger land here. Nothing posts until you tap." />
      {error ? <p className="text-studio-cue text-sm mb-4">{error}</p> : null}
      {drafts.length === 0 ? (
        <Empty to="/social/post" action="Build a cue">
          No drafts waiting. Upload from New cue, or let a recipe draft a throwback.
        </Empty>
      ) : (
        <div className="grid lg:grid-cols-[16rem_1fr] gap-8">
          <ul className="border-y border-studio-line divide-y divide-studio-line">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  onClick={() => setActive(draft)}
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
              <DualPreview image={pickPreview(still)} captionFb={active.caption_fb} captionIg={active.caption_ig} />
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={approve}
                  disabled={busy !== ""}
                  className="bg-studio-tungsten text-studio-ink px-5 py-3 font-studio-display disabled:opacity-60"
                >
                  {busy === "approve" ? "Cueing…" : "Approve — Instagram + Facebook"}
                </button>
                <button type="button" onClick={cancel} className="border border-studio-line px-5 py-3 text-sm">
                  Drop it
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

  useEffect(() => {
    api.me().then((me) => {
      setPages(me.pages);
      setPageId(me.active_page_id || me.pages[0]?.page_id || "");
    });
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
      setMedia(result.media);
      setStatus("Still is on the light table.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setEnhancing(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!media) {
      setError("Upload a still first.");
      return;
    }
    setError("");
    try {
      const instruction = Object.entries(facts)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(". ");
      const created = await api.createDraft({
        page_id: pageId || null,
        media_ids: [media.id],
        instruction,
        facts,
        caption: captionFb,
        caption_fb: captionFb,
        caption_ig: captionIg,
        scheduled_for: when ? new Date(when).toISOString() : null,
      });
      if (captionFb) {
        const approved = await api.approve(created.draft.id);
        setStatus(
          approved.draft.status === "scheduled"
            ? `Held for ${when}. It will not post until that clock.`
            : "In the 10-second cancel window, then Instagram and Facebook.",
        );
      } else {
        setStatus("Draft saved in the inbox. Add a caption and approve there.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not create");
    }
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="02" title="New cue" blurb="Fill the call sheet. The still is graded before you ever see a preview." />
      <form onSubmit={onSubmit} className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-10">
        <div>
          <label className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted">Still</label>
          <input
            type="file"
            accept="image/*,video/*"
            className="mt-2 block w-full text-sm"
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
          {error ? <p className="mt-3 text-sm text-studio-cue">{error}</p> : null}
          {status && !enhancing ? <p className="mt-3 text-sm text-studio-gel">{status}</p> : null}
          <button type="submit" className="mt-6 w-full bg-studio-tungsten text-studio-ink font-studio-display py-3">
            {captionFb ? "Approve to both platforms" : "Save as draft"}
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

  useEffect(() => {
    api
      .media()
      .then((d) => {
        setRows(d.media);
        setActive(d.media[0] ?? null);
        setDescription(d.media[0]?.description ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function save() {
    if (!active) return;
    const result = await api.patchMedia(active.id, { description });
    setRows((prev) => prev.map((m) => (m.id === result.media.id ? result.media : m)));
    setActive(result.media);
  }

  return (
    <main className="p-6 lg:p-10 max-w-7xl">
      <Header cue="03" title="Library" blurb="Every still the agent can reach. Descriptions are how recipes know what they're posting." />
      {error ? <p className="text-studio-cue text-sm">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="text-studio-muted">Empty light table. Upload from New cue or send a photo in Messenger.</p>
      ) : (
        <div className="grid lg:grid-cols-[1fr_20rem] gap-8">
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => {
                    setActive(row);
                    setDescription(row.description);
                  }}
                >
                  <img src={row.ig_feed_url || row.url} alt={row.title || ""} className="aspect-[4/5] w-full object-cover border border-studio-line" />
                  <span className="font-studio-mono text-[10px] text-studio-muted">{row.last_used_at ? "Used" : "Unused"}</span>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <aside className="border border-studio-line p-4 bg-studio-tape/30">
              <p className="font-studio-mono text-[10px] text-studio-tungsten">{active.kind}</p>
              <label className="block mt-3 text-xs text-studio-muted" htmlFor="desc">
                Description for the agent
              </label>
              <textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
              <button type="button" onClick={() => void save()} className="mt-4 bg-studio-tungsten text-studio-ink px-4 py-2 font-studio-display">
                Save description
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
  useEffect(() => {
    api.calendar().then((d) => setRows(d.drafts));
  }, []);
  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="04" title="Calendar" blurb="Scheduled holds and recent airings. Instagram has no native schedule — this clock is ours." />
      <ol className="divide-y divide-studio-line border-y border-studio-line">
        {rows.map((row) => (
          <li key={row.id} className="py-4 flex gap-4">
            <span className="font-studio-mono text-studio-tungsten text-sm w-40 shrink-0">
              {(row.scheduled_for || row.updated_at || "").slice(0, 16).replace("T", " ")}
            </span>
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
      {rows.length === 0 ? <p className="text-studio-muted mt-6">Nothing on the board.</p> : null}
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

export function RecipesPage() {
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [name, setName] = useState("Throwback Tuesday");
  const [postType, setPostType] = useState("throwback");
  const [weekdays, setWeekdays] = useState<number[]>([2]);
  const [hour, setHour] = useState(10);

  useEffect(() => {
    api.recipes().then((d) => setRows(d.recipes));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const created = await api.createRecipe({
      name,
      post_type: postType,
      weekdays,
      hour,
      minute: 0,
    });
    setRows((prev) => [...prev, created.recipe]);
  }

  async function toggle(row: RecipeRow) {
    const updated = await api.patchRecipe(row.id, { ...row, enabled: !row.enabled });
    setRows((prev) => prev.map((r) => (r.id === row.id ? updated.recipe : r)));
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header
        cue="05"
        title="Engagement recipes"
        blurb="The worker drafts on this clock. You still approve every post. Throwbacks, recognition, hardware — your week."
      />
      <ul className="divide-y divide-studio-line border-y border-studio-line mb-10">
        {rows.map((row) => (
          <li key={row.id} className="py-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-studio-display">{row.name}</p>
              <p className="text-sm text-studio-muted">
                {row.post_type} · {row.weekdays.join(",")} · {String(row.hour).padStart(2, "0")}:00
                {row.enabled ? "" : " · paused"}
              </p>
            </div>
            <button type="button" onClick={() => void toggle(row)} className="font-studio-mono text-[10px] uppercase text-studio-tungsten">
              {row.enabled ? "Pause" : "Enable"}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className="border border-studio-line p-5 bg-studio-tape/30 max-w-md">
        <p className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-tungsten">New recipe</p>
        <input className={`${fieldClass} mt-3`} value={name} onChange={(e) => setName(e.target.value)} />
        <select className={`${fieldClass} mt-3`} value={postType} onChange={(e) => setPostType(e.target.value)}>
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
        <label className="block mt-3 text-xs text-studio-muted">
          Hour
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="ml-2 w-16 bg-studio-void border border-studio-line px-2 py-1"
          />
        </label>
        <button type="submit" className="mt-4 bg-studio-tungsten text-studio-ink px-4 py-2 font-studio-display">
          Add recipe
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

  useEffect(() => {
    api.collections().then((d) => setRows(d.collections));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const created = await api.createCollection({ title, venue, event_type: eventType });
    setRows((prev) => [created.collection, ...prev]);
    setTitle("");
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="06" title="Job buckets" blurb="One collection per shoot. Throwbacks become “the Rialto gala,” not a random file." />
      <form onSubmit={onSubmit} className="grid sm:grid-cols-4 gap-3 mb-10">
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2" />
        <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2" />
        <input placeholder="Type" value={eventType} onChange={(e) => setEventType(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2" />
        <button type="submit" className="bg-studio-tungsten text-studio-ink font-studio-display">
          Create job
        </button>
      </form>
      <ul className="divide-y divide-studio-line border-y border-studio-line">
        {rows.map((row) => (
          <li key={row.id} className="py-3">
            <p className="font-studio-display">{row.title}</p>
            <p className="text-sm text-studio-muted">{[row.event_type, row.venue, row.client].filter(Boolean).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function RosterPage() {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [kind, setKind] = useState("person");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    api.roster().then((d) => setRows(d.roster));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const created = await api.createRoster({ kind, name, notes });
    setRows((prev) => [...prev, created.item]);
    setName("");
    setNotes("");
  }

  return (
    <main className="p-6 lg:p-10 max-w-4xl">
      <Header cue="07" title="Roster" blurb="People, venues, gear. Recognition posts spell names from here — never from a face." />
      <form onSubmit={onSubmit} className="grid sm:grid-cols-4 gap-3 mb-10">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2">
          <option value="person">Person</option>
          <option value="venue">Venue</option>
          <option value="gear">Gear</option>
        </select>
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2" />
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2" />
        <button type="submit" className="bg-studio-tungsten text-studio-ink font-studio-display">
          Add
        </button>
      </form>
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

  useEffect(() => {
    api.me().then(async (me) => {
      setPages(me.pages);
      const id = me.active_page_id || me.pages[0]?.page_id || "";
      setPageId(id);
      if (id) {
        const brand = await api.brand(id);
        setSections(brand.profile.sections);
        setExample(brand.profile.example);
      }
    });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await api.saveBrand({ page_id: pageId, sections, fields: DEFAULT_FIELDS, example });
    setSaved("Voice saved. Captions will follow it.");
  }

  return (
    <main className="p-6 lg:p-10 max-w-3xl">
      <Header cue="08" title="Brand voice" blurb="About, voice, people, places, always, never. The drafting model reads this on every cue." />
      <form onSubmit={onSubmit} className="space-y-5">
        <select value={pageId} onChange={(e) => setPageId(e.target.value)} className="bg-studio-void border border-studio-line px-2 py-2">
          {pages.map((p) => (
            <option key={p.page_id} value={p.page_id}>
              {p.name}
            </option>
          ))}
        </select>
        {SECTIONS.map((key) => (
          <div key={key}>
            <label className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted" htmlFor={key}>
              {key}
            </label>
            <textarea
              id={key}
              rows={3}
              value={sections[key] ?? ""}
              onChange={(e) => setSections((prev) => ({ ...prev, [key]: e.target.value }))}
              className={fieldClass}
            />
          </div>
        ))}
        <div>
          <label className="font-studio-mono text-[10px] tracking-widest uppercase text-studio-muted" htmlFor="example">
            Example post
          </label>
          <textarea id="example" rows={3} value={example} onChange={(e) => setExample(e.target.value)} className={fieldClass} />
        </div>
        {saved ? <p className="text-studio-gel text-sm">{saved}</p> : null}
        <button type="submit" className="bg-studio-tungsten text-studio-ink px-5 py-3 font-studio-display">
          Save voice
        </button>
      </form>
    </main>
  );
}

export function BoostsPage() {
  const [rows, setRows] = useState<BoostRow[]>([]);
  useEffect(() => {
    api.boosts().then((d) => setRows(d.posts));
  }, []);
  return (
    <main className="p-6 lg:p-10 max-w-3xl">
      <Header
        cue="09"
        title="Boost list"
        blurb="Not an ads manager. These three earned the cheapest attention. Put twenty dollars behind one of them in Meta’s own boost flow."
      />
      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={row.id} className="border border-studio-line p-4 bg-studio-tape/30">
            <p className="font-studio-mono text-[10px] text-studio-tungsten">
              {String(i + 1).padStart(2, "0")} · score {row.boost_score}
            </p>
            <p className="mt-2">{row.caption || "(no caption)"}</p>
            {row.link ? (
              <a href={row.link} className="mt-3 inline-block text-studio-gel text-sm" target="_blank" rel="noreferrer">
                Open on Facebook →
              </a>
            ) : null}
          </li>
        ))}
      </ol>
      {rows.length === 0 ? <p className="text-studio-muted">No scored posts yet. Insights fill in after something airs.</p> : null}
    </main>
  );
}
