"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, CalendarDays, Check, CircleHelp, Clock3, ImagePlus, PenLine, Send, Sparkles, Trash2 } from "lucide-react";
import { simulationId, type SimulationMedia, type Post, useSimulationStore } from "../simulation/store";
import { mediaKind, platforms, postIssues } from "../platforms/catalog";
import { NetworkMark } from "../platforms/network-mark";
import type { PlatformId } from "../platforms/types";
import { PostPreview } from "../previews/post-preview";
import type { AppView } from "../shell/app-shell";
import { DateTimeSelector } from "../calendar/date-time-selector";

type PublishChoice = "draft" | "schedule" | "now";
type Outcome = "success" | "partial" | "failure";

export function PostComposer({ postId, onNavigate, onNotice }: { postId: string | null; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const { posts, connected, socialProfiles, connectionStates, weeklySlots, timezone, upsertPost, setAiSession, setAiArea } = useSimulationStore();
  const existing = posts.find((post) => post.id === postId);
  const [text, setText] = useState(existing?.text ?? "");
  const readyChannels = connected.filter((id) => (connectionStates[id] ?? "ready") === "ready");
  const [selected, setSelected] = useState<PlatformId[]>(existing?.channels ?? readyChannels);
  const [allMode, setAllMode] = useState(!existing);
  const [variants, setVariants] = useState<Partial<Record<PlatformId, string>>>(existing?.variants ?? {});
  const [media, setMedia] = useState<SimulationMedia[]>(existing?.media ?? []);
  const [youtubeTitle, setYoutubeTitle] = useState(existing?.youtubeTitle ?? "");
  const [active, setActive] = useState<PlatformId>(existing?.channels[0] ?? connected[0] ?? "linkedin");
  const [choice, setChoice] = useState<PublishChoice>(existing?.status === "scheduled" ? "schedule" : "draft");
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt ?? "");
  const [outcome, setOutcome] = useState<Outcome>("success");
  const [step, setStep] = useState<"compose" | "review">("compose");
  const [appliedWritingContext, setAppliedWritingContext] = useState<Post["writingContext"]>(existing?.writingContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tailorHelp, setTailorHelp] = useState(false);
  const draftId = useRef(existing?.id ?? simulationId());
  const composingWorkspaceId = useRef(useSimulationStore.getState().activeWorkspaceId);
  const committed = useRef(false);
  const pendingDraft = useRef<Post | null>(null);
  const issues = useMemo(() => selected.flatMap((id) => postIssues(text, media, [id], variants)), [text, media, selected, variants]);
  const connectedPlatforms = platforms.filter((platform) => connected.includes(platform.id) && (connectionStates[platform.id] ?? "ready") === "ready");
  const selectedPlatforms = platforms.filter((platform) => selected.includes(platform.id));
  const activeMedia = media;
  const previewSwitcher = selectedPlatforms.length > 0 && <div className="preview-channel-switcher" aria-label="Choose channel preview">{selectedPlatforms.map((platform) => <button type="button" key={platform.id} className={active === platform.id ? "active" : ""} aria-pressed={active === platform.id} onClick={() => setActive(platform.id)}><NetworkMark id={platform.id} /><span>{platform.name}</span></button>)}</div>;

  function toggleChannel(id: PlatformId) {
    const next = allMode ? [id] : selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setAllMode(false);
    setSelected(next);
    setActive(next.includes(id) ? id : next[0] ?? id);
    setError("");
  }
  async function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 10 - media.length));
    const next: SimulationMedia[] = [];
    for (const file of files) {
      const kind = mediaKind(file);
      if (!kind) { setError(`${file.name} must be a JPEG, PNG, video, or PDF.`); continue; }
      let dimensions: { width?: number; height?: number } = {};
      if (kind === "image") {
        try { const bitmap = await createImageBitmap(file); dimensions = { width: bitmap.width, height: bitmap.height }; bitmap.close(); }
        catch { setError(`${file.name} could not be read as an image.`); continue; }
      }
      next.push({ id: simulationId(), name: file.name, kind, url: URL.createObjectURL(file), type: file.type, bytes: file.size, ...dimensions });
    }
    setMedia((current) => [...current, ...next]);
    if ((event.target.files?.length ?? 0) > files.length) setError("You can add up to 10 media files.");
    event.target.value = "";
  }
  function removeMedia(id: string) {
    const item = media.find((file) => file.id === id);
    if (item?.url.startsWith("blob:") && !useSimulationStore.getState().posts.some((post) => post.media.some((file) => file.url === item.url))) URL.revokeObjectURL(item.url);
    setMedia((current) => current.filter((file) => file.id !== id));
  }
  function moveMedia(id: string, direction: -1 | 1) {
    setMedia((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function setAltText(id: string, altText: string) {
    setMedia((current) => current.map((item) => item.id === id ? { ...item, altText } : item));
  }
  function nextSlot() {
    const now = new Date();
    for (let offset = 0; offset < 21; offset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + offset);
      for (const slot of weeklySlots.filter((item) => item.day === day.getDay()).sort((a, b) => a.time.localeCompare(b.time))) {
        const [hour, minute] = slot.time.split(":").map(Number);
        day.setHours(hour, minute, 0, 0);
        if (day.getTime() > Date.now() + 60_000) {
          setScheduledAt(new Date(day.getTime() - day.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
          setChoice("schedule");
          return;
        }
      }
    }
    setError("Add a weekly slot in Settings first.");
  }
  function addSample(kind: "image" | "video") {
    if (media.length >= 10) { setError("You can add up to 10 media files."); return; }
    setMedia((current) => [...current, {
      id: simulationId(),
      name: kind === "video" ? "Sample video concept" : "Sample image",
      kind,
      type: kind === "video" ? "video/simulation" : "image/jpeg",
      url: kind === "video" ? "/sample-video-poster.svg" : "/sample-creative.jpg",
      width: kind === "image" ? 1080 : undefined,
      height: kind === "image" ? 1080 : undefined,
    }]);
  }
  function addSampleCarousel() {
    if (media.length > 7) { setError("A sample carousel needs three free media slots."); return; }
    setMedia((current) => [...current, ...["/sample-creative.jpg", "/sample-creative-2.jpg", "/sample-creative-3.jpg"].map((url, index) => ({ id: simulationId(), name: `Sample slide ${index + 1}`, kind: "image" as const, type: "image/jpeg", width: 1080, height: 1080, url, altText: `Sample carousel slide ${index + 1}` }))]);
    setError("");
  }
  function openAi(field: "text" | "variant") {
    if (existing && existing.status !== "draft") draftId.current = simulationId();
    if (text.trim() || media.length || Object.values(variants).some(Boolean)) {
      const draft = { ...buildPost("draft", Object.fromEntries(selected.map((id) => [id, "draft"])) as Post["channelStatus"]), scheduledAt: undefined, createdAt: existing && existing.status !== "draft" ? new Date().toISOString() : existing?.createdAt ?? new Date().toISOString(), sourcePostId: existing && existing.status !== "draft" ? existing.id : existing?.sourcePostId };
      upsertPost(draft);
      pendingDraft.current = null;
    }
    const mode = field === "variant" || text.trim() ? "rewrite" : "create";
    setAiArea(mode);
    setAiSession({ origin: { kind: "post", id: draftId.current, field, channel: field === "variant" ? active : undefined }, original: field === "variant" ? variants[active] ?? text : text, brief: text.slice(0, 300), channels: selected, networks: [], suggestion: "", sourcePostIds: [], feedback: null, generation: 0, mode, target: "post" });
    onNavigate("ai");
  }
  function buildPost(status: Post["status"], channelStatus: Post["channelStatus"]): Post {
    return { id: draftId.current, title: text.trim().split("\n")[0].slice(0, 56) || "Untitled post", text: text.trim(), variants, channels: selected, media, youtubeTitle: youtubeTitle.trim(), youtubePrivacy: choice === "schedule" ? "private" : "public", sourcePostId: existing?.sourcePostId, writingContext: appliedWritingContext, status, channelStatus, timezone, scheduledAt: choice === "schedule" ? scheduledAt : undefined, createdAt: existing?.createdAt ?? new Date().toISOString() };
  }
  useEffect(() => {
    if (committed.current || existing && existing.status !== "draft" || !text.trim() && media.length === 0) return;
    pendingDraft.current = buildPost("draft", Object.fromEntries(selected.map((id) => [id, "draft"])) as Post["channelStatus"]);
    setSaveState("saving");
    const timer = window.setTimeout(() => { if (pendingDraft.current && !committed.current && useSimulationStore.getState().activeWorkspaceId === composingWorkspaceId.current) { upsertPost(pendingDraft.current); setSaveState("saved"); } }, 550);
    return () => window.clearTimeout(timer);
  }, [text, selected, variants, media, youtubeTitle, scheduledAt, choice, appliedWritingContext, upsertPost]);
  useEffect(() => () => { if (pendingDraft.current && !committed.current && useSimulationStore.getState().activeWorkspaceId === composingWorkspaceId.current) useSimulationStore.getState().upsertPost(pendingDraft.current); }, []);
  useEffect(() => { const flush = () => { if (pendingDraft.current && !committed.current && useSimulationStore.getState().activeWorkspaceId === composingWorkspaceId.current) useSimulationStore.getState().upsertPost(pendingDraft.current); }; window.addEventListener("spreadnotes:before-workspace-switch", flush); return () => window.removeEventListener("spreadnotes:before-workspace-switch", flush); }, []);
  function saveDraft() {
    if (!text.trim() && media.length === 0) { setError("Add some text or media before saving a draft."); return; }
    const awaiting = existing?.status === "needs_approval";
    upsertPost(buildPost(awaiting ? "needs_approval" : "draft", Object.fromEntries(selected.map((id) => [id, awaiting ? "needs_approval" : "draft"])) as Post["channelStatus"]));
    committed.current = true;
    onNotice(awaiting ? "Suggestion saved. Approve it in the library before publishing." : "Draft saved in your simulation library.");
    onNavigate("library");
  }
  function review() {
    if (existing?.status === "needs_approval") { setError("Approve this suggestion in the Post library before scheduling or publishing."); return; }
    if (!text.trim() && media.length === 0) { setError("Add text or media before continuing."); return; }
    if (!selected.length) { setError("Select at least one connected channel."); return; }
    if (selected.some((id) => !connected.includes(id) || (connectionStates[id] ?? "ready") !== "ready")) { setError("Select eligible simulation accounts in Connections before continuing."); return; }
    if (selected.includes("youtube") && !youtubeTitle.trim()) { setError("Add a YouTube video title."); return; }
    if (issues.length) { setError("Resolve the channel compatibility notes before continuing."); return; }
    if (choice === "schedule" && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) { setError("Choose a future date and time."); return; }
    setError("");
    setStep("review");
  }
  function confirm() {
    const workspaceId = composingWorkspaceId.current;
    if (choice === "schedule") {
      committed.current = true;
      upsertPost(buildPost("scheduled", Object.fromEntries(selected.map((id) => [id, "scheduled"])) as Post["channelStatus"]));
      onNotice("Post scheduled in this simulation. Open Calendar to see it.");
      onNavigate("calendar");
      return;
    }
    if (choice === "draft") { saveDraft(); return; }
    committed.current = true;
    setBusy(true);
    const queued = buildPost("queued", Object.fromEntries(selected.map((id) => [id, "queued"])));
    upsertPost(queued);
    window.setTimeout(() => {
      const store = useSimulationStore.getState();
      const postsForWorkspace = store.activeWorkspaceId === workspaceId ? store.posts : store.savedWorkspaces[workspaceId]?.posts ?? [];
      const latest = postsForWorkspace.find((item) => item.id === queued.id);
      if (latest?.status === "queued") store.upsertPostForWorkspace(workspaceId, { ...latest, status: "publishing", channelStatus: Object.fromEntries(selected.map((id) => [id, "publishing"])) });
    }, 450);
    window.setTimeout(() => {
      const failed = outcome === "failure" ? selected : outcome === "partial" ? selected.slice(-1) : [];
      const channelStatus = Object.fromEntries(selected.map((id) => [id, failed.includes(id) ? "failed" : "published"])) as Post["channelStatus"];
      const finalStatus: Post["status"] = failed.length === selected.length ? "failed" : failed.length ? "partial" : "published";
      useSimulationStore.getState().upsertPostForWorkspace(workspaceId, { ...queued, status: finalStatus, channelStatus, channelPublishedAt: Object.fromEntries(selected.filter((id) => channelStatus[id] === "published").map((id) => [id, new Date().toISOString()])) });
      setBusy(false);
      if (useSimulationStore.getState().activeWorkspaceId === workspaceId) {
        onNotice(finalStatus === "published" ? "Simulation post published across selected channels." : "Simulation outcome ready. Review each channel in the library.");
        onNavigate("library");
      }
    }, 1450);
  }

  if (step === "review") return <div className="review-layout"><div className="panel-card padded"><button className="back-link" onClick={() => setStep("compose")}><ArrowLeft size={16} /> Back to editing</button><span className="eyebrow">FINAL REVIEW</span><h2>Everything in its right place?</h2><p className="muted-copy">Review what each channel will receive. Nothing is sent to an actual social platform.</p><div className="review-summary"><div><span>DELIVERY</span><strong>{choice === "schedule" ? "Schedule post" : choice === "now" ? "Publish now" : "Save draft"}</strong></div><div><span>CHANNELS</span><strong>{selected.length} selected</strong></div>{choice === "schedule" && <div><span>WHEN</span><strong>{new Date(scheduledAt).toLocaleString()} · {timezone}</strong></div>}</div><div className="review-channels">{selectedPlatforms.map((platform) => <div key={platform.id}><NetworkMark id={platform.id} /><span><strong>{platform.name}</strong><small>{media.length} asset(s) · simulated publishing</small></span><Check size={17} /></div>)}</div>{choice === "now" && <div className="form-stack scenario-field"><label>Simulation outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as Outcome)}><option value="success">All channels publish</option><option value="partial">One channel fails</option><option value="failure">All channels fail</option></select></label><small className="field-hint">Use this selector to explore failure and retry screens.</small></div>}<div className="review-footer"><button className="button button-outline" onClick={() => setStep("compose")}>Edit post</button><button disabled={busy} className="button button-primary" onClick={confirm}>{busy ? "Publishing in simulation…" : choice === "now" ? "Confirm simulated publish" : choice === "schedule" ? "Confirm schedule" : "Save draft"} <ArrowRight size={16} /></button></div></div><div className="review-preview"><span className="eyebrow">CHANNEL PREVIEW</span>{previewSwitcher}<PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={activeMedia} youtubeTitle={youtubeTitle} profile={socialProfiles[active]} /></div></div>;

  return <div className="compose-layout"><div className="compose-main">
    <section className="panel-card padded composer-start"><span className="eyebrow">POST SETUP</span><h3>Where and when?</h3><div className="delivery-options">{([{ id: "draft", icon: PenLine, title: "Draft" }, { id: "schedule", icon: CalendarDays, title: "Schedule" }, { id: "now", icon: Send, title: "Publish now" }] as const).map((option) => <button key={option.id} className={`delivery-choice ${choice === option.id ? "selected" : ""}`} aria-pressed={choice === option.id} onClick={() => setChoice(option.id)}><option.icon size={18} /><strong>{option.title}</strong></button>)}</div>{choice === "schedule" && <div className="schedule-fields"><DateTimeSelector value={scheduledAt} onChange={setScheduledAt} min={localDateTimeMin()} timezone={timezone} /><button className="button button-outline small" onClick={nextSlot}>Use next weekly slot</button></div>}<div className="panel-heading"><strong>Destinations</strong><span className="count-chip">{selected.length} selected</span></div>{connectedPlatforms.length ? <div className="channel-picker channel-picker-top"><button className={`channel-choice ${allMode ? "selected" : ""}`} aria-pressed={allMode} onClick={() => { const next = allMode ? [] : readyChannels; setAllMode(!allMode); setSelected(next); setActive(next[0] ?? "linkedin"); }}><span>All</span><span className="destination-check" aria-hidden="true">{allMode && <Check size={13} />}</span></button>{connectedPlatforms.map((platform) => <label key={platform.id} className={`channel-choice ${selected.includes(platform.id) ? "selected" : ""}`}><NetworkMark id={platform.id} /><span>{platform.name}</span><input type="checkbox" checked={selected.includes(platform.id)} onChange={() => toggleChannel(platform.id)} /></label>)}</div> : <div className="inline-empty"><AlertCircle size={19} /><span>Connect a social channel to choose destinations.</span><button className="inline-link" onClick={() => onNavigate("connections")}>Open connections <ArrowRight size={15} /></button></div>}<p className="field-hint" role="status">{saveState === "saving" ? "Saving draft…" : saveState === "saved" ? "Draft saved for this visit" : "Your draft saves as you write during this visit."}</p></section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">01 / THE IDEA</span><h3>Begin with your thought.</h3></div><button className="small-icon-button" onClick={() => openAi("text")}><Sparkles size={16} /> Open in SpreadNotes AI</button></div><label className="editor-label" htmlFor="master-post">MASTER POST</label><textarea id="master-post" className="master-editor" placeholder="What would you like to share?" value={text} maxLength={70000} onChange={(event) => { setText(event.target.value); setError(""); }} /><div className="editor-bottom"><span>Write your idea freely. Tailor it by channel below.</span><strong>{text.length} characters</strong></div>
      <div className="media-section"><div><strong>Add media</strong><span>Add JPEG or PNG images, one video, or a PDF. Channel rules are checked below.</span></div><label className="media-add"><ImagePlus size={18} /> Add files<input type="file" accept="image/jpeg,image/png,video/*,application/pdf" multiple onChange={addMedia} /></label></div>
      <div className="sample-assets"><span>OR TRY A SAMPLE</span><button onClick={() => addSample("image")}>Sample image</button><button onClick={addSampleCarousel}>Sample carousel</button><button onClick={() => addSample("video")}>Sample video concept</button></div>
      {media.length > 0 && <><div className="media-order-note">Media appears in this order on every selected channel. The first image is the cover.</div><div className="media-list">{media.map((item, index) => <div key={item.id} className="media-item"><span className="media-order-number">{index + 1}</span>{item.kind === "image" || item.url.endsWith(".svg") ? <img src={item.url} alt={item.altText || item.name} /> : item.kind === "video" ? <video src={item.url} muted /> : <span className="pdf-mark">PDF</span>}<div className="media-item-copy"><strong>{item.name}</strong><small>{item.kind === "video" && item.url.endsWith(".svg") ? "video concept" : item.kind}</small>{item.kind === "image" && <input type="text" value={item.altText ?? ""} maxLength={120} onChange={(event) => setAltText(item.id, event.target.value)} aria-label={`Alt text for ${item.name}`} placeholder="Describe this image (optional)" />}</div><div className="media-item-actions"><button className="icon-only" disabled={index === 0} onClick={() => moveMedia(item.id, -1)} aria-label={`Move ${item.name} earlier`}><ArrowUp size={15} /></button><button className="icon-only" disabled={index === media.length - 1} onClick={() => moveMedia(item.id, 1)} aria-label={`Move ${item.name} later`}><ArrowDown size={15} /></button><button className="icon-only" onClick={() => removeMedia(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></div></div>)}</div></>}
    </section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">TEXT TAILORING</span><h3>Shape the words for each channel.</h3></div><button className="icon-only bordered" aria-label="Explain platform text tailoring" aria-expanded={tailorHelp} onClick={() => setTailorHelp((value) => !value)}><CircleHelp size={18} /></button></div>{tailorHelp && <p className="info-callout">Start with one master post. Choose a platform tab to change only its text. The shared media stays the same for every selected channel. Reset returns that platform to the master text.</p>}{selected.length > 0 && <div className="variant-editor"><div className="variant-tabs">{selectedPlatforms.map((platform) => <button key={platform.id} className={active === platform.id ? "active" : ""} onClick={() => setActive(platform.id)}><NetworkMark id={platform.id} />{platform.name}</button>)}</div><div className="variant-body"><div className="panel-heading"><label htmlFor="variant-text">TEXT FOR {active.toUpperCase()}</label><button className="small-icon-button" onClick={() => openAi("variant")}><Sparkles size={15} /> Open in SpreadNotes AI</button></div><textarea id="variant-text" value={variants[active] ?? text} onChange={(event) => setVariants((current) => ({ ...current, [active]: event.target.value }))} placeholder="Tailor these words…" /><div><span>{(variants[active] ?? text).length} / {platforms.find((platform) => platform.id === active)?.limit.toLocaleString()} characters</span><button className="inline-link" onClick={() => setVariants((current) => { const next = { ...current }; delete next[active]; return next; })}>Reset to master</button></div>{active === "youtube" && <label className="channel-extra-label">YouTube video title<input value={youtubeTitle} maxLength={100} onChange={(event) => setYoutubeTitle(event.target.value)} placeholder="Title viewers will see" /></label>}</div></div>}{issues.length > 0 && <div className="validation-note" role="alert"><AlertCircle size={18} /><div><strong>Resolve these platform requirements</strong>{issues.map((issue) => <p key={issue}>{issue}</p>)}</div></div>}{error && <div className="form-error" role="alert"><AlertCircle size={17} />{error}</div>}<div className="composer-footer"><button className="button button-outline" onClick={saveDraft}>Save draft</button><button className="button button-primary" onClick={review}>Review post <ArrowRight size={17} /></button></div></section>
  </div><aside className="compose-preview"><div className="preview-sticky"><div className="preview-heading"><span className="eyebrow">LIVE PREVIEW</span><h3>See it in context.</h3><p>Illustrative layout; the final platform may display content differently.</p></div>{selected.length ? <>{previewSwitcher}<PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={activeMedia} youtubeTitle={youtubeTitle} profile={socialProfiles[active]} /><div className="preview-under"><Sparkles size={18} /><span>One master idea, with space to make each version feel at home.</span></div></> : <div className="panel-card padded"><p className="muted-copy">Select a destination to see its social post preview.</p></div>}</div></aside></div>;
}

function localDateTimeMin() {
  const date = new Date(Date.now() + 60_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
