"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, CalendarDays, Check, Clock3, ImagePlus, PenLine, Send, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { demoId, type DemoMedia, type Post, useDemoStore } from "../demo/store";
import { mediaKind, platforms, postIssues } from "../platforms/catalog";
import { NetworkMark } from "../platforms/NetworkMark";
import type { PlatformId } from "../platforms/types";
import { PostPreview } from "../previews/PostPreview";
import { eligibleExamples, generateIdea } from "../ai/writing";
import type { AppView } from "../shell/AppShell";

type PublishChoice = "draft" | "schedule" | "now";
type Outcome = "success" | "partial" | "failure";

export function PostComposer({ postId, onNavigate, onNotice }: { postId: string | null; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const { posts, connected, connectionStates, weeklySlots, timezone, writingProfile, upsertPost } = useDemoStore();
  const existing = posts.find((post) => post.id === postId);
  const [text, setText] = useState(existing?.text ?? "");
  const [selected, setSelected] = useState<PlatformId[]>(existing?.channels ?? connected.filter((id) => (connectionStates[id] ?? "ready") === "ready").slice(0, 2));
  const [variants, setVariants] = useState<Partial<Record<PlatformId, string>>>(existing?.variants ?? {});
  const [media, setMedia] = useState<DemoMedia[]>(existing?.media ?? []);
  const [mediaVariants, setMediaVariants] = useState<Post["mediaVariants"]>(existing?.mediaVariants ?? {});
  const [youtubeTitle, setYoutubeTitle] = useState(existing?.youtubeTitle ?? "");
  const [active, setActive] = useState<PlatformId>(existing?.channels[0] ?? connected[0] ?? "linkedin");
  const [choice, setChoice] = useState<PublishChoice>(existing?.status === "scheduled" ? "schedule" : "draft");
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt ?? "");
  const [outcome, setOutcome] = useState<Outcome>("success");
  const [step, setStep] = useState<"compose" | "review">("compose");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ tone: string; text: string; sourcePostIds: string[] } | null>(null);
  const [aiIdeas, setAiIdeas] = useState<{ text: string; sourcePostIds: string[] }[]>([]);
  const [appliedWritingContext, setAppliedWritingContext] = useState<Post["writingContext"]>(existing?.writingContext);
  const [aiFeedback, setAiFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const issues = useMemo(() => selected.flatMap((id) => postIssues(text, mediaVariants?.[id] ?? media, [id], variants)), [text, media, mediaVariants, selected, variants]);
  const connectedPlatforms = platforms.filter((platform) => connected.includes(platform.id) && (connectionStates[platform.id] ?? "ready") === "ready");
  const selectedPlatforms = platforms.filter((platform) => selected.includes(platform.id));
  const activeMedia = mediaVariants?.[active] ?? media;
  const previewSwitcher = selectedPlatforms.length > 0 && <div className="preview-channel-switcher" aria-label="Choose channel preview">{selectedPlatforms.map((platform) => <button type="button" key={platform.id} className={active === platform.id ? "active" : ""} aria-pressed={active === platform.id} onClick={() => setActive(platform.id)}><NetworkMark id={platform.id} /><span>{platform.name}</span></button>)}</div>;

  function toggleChannel(id: PlatformId) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setSelected(next);
    setActive(next.includes(id) ? id : next[0] ?? id);
    setError("");
  }
  async function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 10 - media.length));
    const next: DemoMedia[] = [];
    for (const file of files) {
      const kind = mediaKind(file);
      if (!kind) { setError(`${file.name} must be a JPEG, PNG, video, or PDF.`); continue; }
      let dimensions: { width?: number; height?: number } = {};
      if (kind === "image") {
        try { const bitmap = await createImageBitmap(file); dimensions = { width: bitmap.width, height: bitmap.height }; bitmap.close(); }
        catch { setError(`${file.name} could not be read as an image.`); continue; }
      }
      next.push({ id: demoId(), name: file.name, kind, url: URL.createObjectURL(file), type: file.type, bytes: file.size, ...dimensions });
    }
    setMedia((current) => [...current, ...next]);
    if ((event.target.files?.length ?? 0) > files.length) setError("You can add up to 10 media files.");
    event.target.value = "";
  }
  function removeMedia(id: string) {
    const item = media.find((file) => file.id === id);
    if (item?.url.startsWith("blob:") && !useDemoStore.getState().posts.some((post) => post.media.some((file) => file.url === item.url))) URL.revokeObjectURL(item.url);
    setMedia((current) => current.filter((file) => file.id !== id));
    setMediaVariants((current) => Object.fromEntries(Object.entries(current ?? {}).map(([channel, files]) => [channel, files?.filter((file) => file.id !== id)])) as Post["mediaVariants"]);
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
    setMediaVariants((current) => Object.fromEntries(Object.entries(current ?? {}).map(([channel, files]) => [channel, files?.map((item) => item.id === id ? { ...item, altText } : item)])) as Post["mediaVariants"]);
  }
  function toggleVariantMedia(id: string) {
    setMediaVariants((current) => {
      const next = { ...current };
      const currentItems = next[active] ?? media;
      next[active] = currentItems.some((item) => item.id === id) ? currentItems.filter((item) => item.id !== id) : [...currentItems, media.find((item) => item.id === id)!];
      return next;
    });
  }
  function moveVariantMedia(id: string, direction: -1 | 1) {
    setMediaVariants((current) => {
      const next = [...(current?.[active] ?? media)];
      const index = next.findIndex((item) => item.id === id), target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, [active]: next };
    });
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
      id: demoId(),
      name: kind === "video" ? "Sample video concept" : "Sample image",
      kind,
      type: kind === "video" ? "video/demo" : "image/jpeg",
      url: kind === "video" ? "/demo-video-poster.svg" : "/demo-creative.jpg",
      width: kind === "image" ? 1080 : undefined,
      height: kind === "image" ? 1080 : undefined,
    }]);
  }
  function addSampleCarousel() {
    if (media.length > 7) { setError("A sample carousel needs three free media slots."); return; }
    setMedia((current) => [...current, ...["/demo-creative.jpg", "/demo-creative-2.jpg", "/demo-creative-3.jpg"].map((url, index) => ({ id: demoId(), name: `Sample slide ${index + 1}`, kind: "image" as const, type: "image/jpeg", width: 1080, height: 1080, url, altText: `Sample carousel slide ${index + 1}` }))]);
    setError("");
  }
  function suggest(tone: string) {
    const source = text.trim();
    if (!source) { setError("Write a thought before asking the demo assistant to adapt it."); return; }
    const endings: Record<string, string> = {
      Clearer: "Here’s the idea in one sentence: clarity makes it easier to move forward.",
      Warmer: "I’d love to hear how you’re approaching this, too.",
      Concise: "What do you think?",
    };
    const suggestion = tone === "Concise" ? `${source.split(/[.!?]/)[0].slice(0, 180).trim()}. ${endings[tone]}` : `${source}\n\n${endings[tone]}`;
    setAiIdeas([]);
    setAiSuggestion({ tone, text: suggestion, sourcePostIds: [] });
    setAiFeedback("");
  }
  function suggestFromProfile() {
    const examples = eligibleExamples(posts, writingProfile);
    setAiIdeas([0, 1, 2].map((index) => ({ text: generateIdea(writingProfile, examples, index), sourcePostIds: examples.map((post) => post.id) })));
    setAiSuggestion(null);
    setAiFeedback("");
  }
  function saveSuggestion() {
    if (!aiSuggestion) return;
    const id = demoId();
    upsertPost({ id, title: aiSuggestion.text.split("\n")[0].slice(0, 56), text: aiSuggestion.text, variants: {}, channels: selected, media: [], status: "needs_approval", channelStatus: Object.fromEntries(selected.map((channel) => [channel, "needs_approval"])) as Post["channelStatus"], createdAt: new Date().toISOString(), writingContext: { profileVersion: 1, sourcePostIds: aiSuggestion.sourcePostIds } });
    setAiSuggestion(null);
    onNotice("Suggestion saved for explicit approval in the Post library.");
    onNavigate("library");
  }
  function buildPost(status: Post["status"], channelStatus: Post["channelStatus"]): Post {
    return { id: existing?.id ?? demoId(), title: text.trim().split("\n")[0].slice(0, 56) || "Untitled post", text: text.trim(), variants, channels: selected, media, mediaVariants, youtubeTitle: youtubeTitle.trim(), youtubePrivacy: choice === "schedule" ? "private" : "public", sourcePostId: existing?.sourcePostId, writingContext: appliedWritingContext, status, channelStatus, timezone, scheduledAt: choice === "schedule" ? scheduledAt : undefined, createdAt: existing?.createdAt ?? new Date().toISOString() };
  }
  function saveDraft() {
    if (!text.trim() && media.length === 0) { setError("Add some text or media before saving a draft."); return; }
    const awaiting = existing?.status === "needs_approval";
    upsertPost(buildPost(awaiting ? "needs_approval" : "draft", Object.fromEntries(selected.map((id) => [id, awaiting ? "needs_approval" : "draft"])) as Post["channelStatus"]));
    onNotice(awaiting ? "Suggestion saved. Approve it in the library before publishing." : "Draft saved in your demo library.");
    onNavigate("library");
  }
  function review() {
    if (existing?.status === "needs_approval") { setError("Approve this suggestion in the Post library before scheduling or publishing."); return; }
    if (!text.trim() && media.length === 0) { setError("Add text or media before continuing."); return; }
    if (!selected.length) { setError("Select at least one connected channel."); return; }
    if (selected.some((id) => !connected.includes(id) || (connectionStates[id] ?? "ready") !== "ready")) { setError("Select eligible demo accounts in Connections before continuing."); return; }
    if (selected.includes("youtube") && !youtubeTitle.trim()) { setError("Add a YouTube video title."); return; }
    if (issues.length) { setError("Resolve the channel compatibility notes before continuing."); return; }
    if (choice === "schedule" && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) { setError("Choose a future date and time."); return; }
    setError("");
    setStep("review");
  }
  function confirm() {
    if (choice === "schedule") {
      upsertPost(buildPost("scheduled", Object.fromEntries(selected.map((id) => [id, "scheduled"])) as Post["channelStatus"]));
      onNotice("Post scheduled in this demo. Open Calendar to see it.");
      onNavigate("calendar");
      return;
    }
    if (choice === "draft") { saveDraft(); return; }
    setBusy(true);
    const queued = buildPost("queued", Object.fromEntries(selected.map((id) => [id, "queued"])));
    upsertPost(queued);
    window.setTimeout(() => {
      const latest = useDemoStore.getState().posts.find((item) => item.id === queued.id);
      if (latest?.status === "queued") useDemoStore.getState().upsertPost({ ...latest, status: "publishing", channelStatus: Object.fromEntries(selected.map((id) => [id, "publishing"])) });
    }, 450);
    window.setTimeout(() => {
      const failed = outcome === "failure" ? selected : outcome === "partial" ? selected.slice(-1) : [];
      const channelStatus = Object.fromEntries(selected.map((id) => [id, failed.includes(id) ? "failed" : "published"])) as Post["channelStatus"];
      const finalStatus: Post["status"] = failed.length === selected.length ? "failed" : failed.length ? "partial" : "published";
      useDemoStore.getState().upsertPost({ ...queued, status: finalStatus, channelStatus, channelPublishedAt: Object.fromEntries(selected.filter((id) => channelStatus[id] === "published").map((id) => [id, new Date().toISOString()])) });
      setBusy(false);
      onNotice(finalStatus === "published" ? "Demo post published across selected channels." : "Demo outcome ready. Review each channel in the library.");
      onNavigate("library");
    }, 1450);
  }

  if (step === "review") return <div className="review-layout"><div className="panel-card padded"><button className="back-link" onClick={() => setStep("compose")}><ArrowLeft size={16} /> Back to editing</button><span className="eyebrow">FINAL REVIEW</span><h2>Everything in its right place?</h2><p className="muted-copy">Review what each channel will receive. Nothing is sent to an actual social platform.</p><div className="review-summary"><div><span>DELIVERY</span><strong>{choice === "schedule" ? "Schedule post" : choice === "now" ? "Publish now" : "Save draft"}</strong></div><div><span>CHANNELS</span><strong>{selected.length} selected</strong></div>{choice === "schedule" && <div><span>WHEN</span><strong>{new Date(scheduledAt).toLocaleString()} · {timezone}</strong></div>}</div><div className="review-channels">{selectedPlatforms.map((platform) => <div key={platform.id}><NetworkMark id={platform.id} /><span><strong>{platform.name}</strong><small>{(mediaVariants?.[platform.id] ?? media).length} asset(s) · simulated direct publishing</small></span><Check size={17} /></div>)}</div>{choice === "now" && <div className="form-stack scenario-field"><label>Demo outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as Outcome)}><option value="success">All channels publish</option><option value="partial">One channel fails</option><option value="failure">All channels fail</option></select></label><small className="field-hint">Use this selector to explore failure and retry screens.</small></div>}<div className="review-footer"><button className="button button-outline" onClick={() => setStep("compose")}>Edit post</button><button disabled={busy} className="button button-primary" onClick={confirm}>{busy ? "Publishing in demo…" : choice === "now" ? "Confirm demo publish" : choice === "schedule" ? "Confirm schedule" : "Save draft"} <ArrowRight size={16} /></button></div></div><div className="review-preview"><span className="eyebrow">CHANNEL PREVIEW</span>{previewSwitcher}<PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={activeMedia} youtubeTitle={youtubeTitle} /></div></div>;

  return <div className="compose-layout"><div className="compose-main">
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">01 / THE IDEA</span><h3>Begin with your thought.</h3></div><button className="small-icon-button" onClick={() => setAiOpen((value) => !value)}><Sparkles size={16} /> Demo assistant</button></div><label className="editor-label" htmlFor="master-post">MASTER POST</label><textarea id="master-post" className="master-editor" placeholder="What would you like to share?" value={text} maxLength={70000} onChange={(event) => { setText(event.target.value); setError(""); }} /><div className="editor-bottom"><span>Write your idea freely. Tailor it by channel below.</span><strong>{text.length} characters</strong></div>
      {aiOpen && <div className="ai-panel"><div className="ai-panel-heading"><WandSparkles size={18} /><div><strong>A little help shaping the thought</strong><small>Deterministic local sample. No model request or automatic publishing.</small></div></div>{writingProfile.enabled ? <><div className="ai-actions"><button onClick={suggestFromProfile}>Generate idea from profile</button>{["Clearer", "Warmer", "Concise"].map((tone) => <button key={tone} onClick={() => suggest(tone)}>{tone}</button>)}</div><p className="field-hint">{eligibleExamples(posts, writingProfile).length ? `${eligibleExamples(posts, writingProfile).length} selected post(s) available as examples.` : "No selected post history; ideas use profile fields only."}</p>{aiIdeas.length > 0 && <div className="ai-idea-list">{aiIdeas.map((idea, index) => <article key={index}><strong>Idea {index + 1}</strong><p>{idea.text}</p><button className="button button-outline small" onClick={() => { setAiSuggestion({ tone: `Profile idea ${index + 1}`, ...idea }); setAiIdeas([]); }}>Choose this idea</button></article>)}</div>}{aiSuggestion && <div className="ai-comparison"><div><span>YOUR ORIGINAL</span><p>{text || "No draft yet"}</p></div><div><span>SUGGESTED · {aiSuggestion.tone.toUpperCase()}</span><p>{aiSuggestion.text}</p><small>Example sources: {aiSuggestion.sourcePostIds.length || "none"}</small></div><div className="ai-comparison-actions"><button onClick={() => setAiSuggestion(null)}>Discard</button><button onClick={() => setAiFeedback("Marked useful for this visit.")}>Useful</button><button onClick={() => setAiFeedback("Marked off-target for this visit.")}>Off target</button><button onClick={saveSuggestion}>Save for approval</button><button className="button button-dark small" onClick={() => { setText(aiSuggestion.text); setAppliedWritingContext({ profileVersion: 1, sourcePostIds: aiSuggestion.sourcePostIds }); setAiSuggestion(null); onNotice("Suggestion applied. Review it before publishing."); }}>Use suggestion <Check size={14} /></button></div>{aiFeedback && <p role="status">{aiFeedback}</p>}</div>}</> : <p className="analytics-capability">Enable your Writing profile in Settings to explore sample suggestions.</p>}</div>}
      <div className="media-section"><div><strong>Add media</strong><span>Add JPEG or PNG images, one video, or a PDF. Channel rules are checked below.</span></div><label className="media-add"><ImagePlus size={18} /> Add files<input type="file" accept="image/jpeg,image/png,video/*,application/pdf" multiple onChange={addMedia} /></label></div>
      <div className="sample-assets"><span>OR TRY A SAMPLE</span><button onClick={() => addSample("image")}>Sample image</button><button onClick={addSampleCarousel}>Sample carousel</button><button onClick={() => addSample("video")}>Sample video concept</button></div>
      {media.length > 0 && <><div className="media-order-note">Media appears in this order on every selected channel. The first image is the cover.</div><div className="media-list">{media.map((item, index) => <div key={item.id} className="media-item"><span className="media-order-number">{index + 1}</span>{item.kind === "image" || item.url.endsWith(".svg") ? <img src={item.url} alt={item.altText || item.name} /> : item.kind === "video" ? <video src={item.url} muted /> : <span className="pdf-mark">PDF</span>}<div className="media-item-copy"><strong>{item.name}</strong><small>{item.kind === "video" && item.url.endsWith(".svg") ? "video concept" : item.kind}</small>{item.kind === "image" && <input type="text" value={item.altText ?? ""} maxLength={120} onChange={(event) => setAltText(item.id, event.target.value)} aria-label={`Alt text for ${item.name}`} placeholder="Describe this image (optional)" />}</div><div className="media-item-actions"><button className="icon-only" disabled={index === 0} onClick={() => moveMedia(item.id, -1)} aria-label={`Move ${item.name} earlier`}><ArrowUp size={15} /></button><button className="icon-only" disabled={index === media.length - 1} onClick={() => moveMedia(item.id, 1)} aria-label={`Move ${item.name} later`}><ArrowDown size={15} /></button><button className="icon-only" onClick={() => removeMedia(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></div></div>)}</div></>}
    </section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">02 / THE DESTINATIONS</span><h3>Choose where it belongs.</h3></div><span className="count-chip">{selected.length} selected</span></div>{connectedPlatforms.length ? <div className="channel-picker">{connectedPlatforms.map((platform) => <button key={platform.id} className={`channel-choice ${selected.includes(platform.id) ? "selected" : ""}`} onClick={() => toggleChannel(platform.id)}><NetworkMark id={platform.id} /><span>{platform.name}</span><span className="choice-check">{selected.includes(platform.id) ? <Check size={13} /> : null}</span></button>)}</div> : <div className="inline-empty"><AlertCircle size={19} /><span>Choose ready demo social accounts before publishing.</span><button className="inline-link" onClick={() => onNavigate("connections")}>Open connections <ArrowRight size={15} /></button></div>}{selected.filter((id) => (connectionStates[id] ?? "ready") !== "ready" || !connected.includes(id)).map((id) => <div className="analytics-capability" key={id}>{platforms.find((item) => item.id === id)?.name} needs account access. <button className="inline-link" onClick={() => toggleChannel(id)}>Remove channel</button></div>)}
      {selected.length > 0 && <div className="variant-editor"><div className="variant-tabs">{selectedPlatforms.map((platform) => <button key={platform.id} className={active === platform.id ? "active" : ""} onClick={() => setActive(platform.id)}><NetworkMark id={platform.id} />{platform.name}</button>)}</div><div className="variant-body"><label htmlFor="variant-text">VERSION FOR {active.toUpperCase()}</label><textarea id="variant-text" value={variants[active] ?? text} onChange={(event) => setVariants((current) => ({ ...current, [active]: event.target.value }))} placeholder="Tailor this version…" /><div><span>{(variants[active] ?? text).length} / {platforms.find((platform) => platform.id === active)?.limit.toLocaleString()} characters</span><button className="inline-link" onClick={() => setVariants((current) => { const next = { ...current }; delete next[active]; return next; })}>Reset to master</button></div>{active === "youtube" && <><label className="channel-extra-label">YouTube video title<input value={youtubeTitle} maxLength={100} onChange={(event) => setYoutubeTitle(event.target.value)} placeholder="Title viewers will see" /></label><p className="field-hint">Scheduled uploads are private until their publish time. Immediate demo posts are public.</p></>}{media.length > 0 && <div className="channel-media-controls"><div><strong>Media for {platforms.find((item) => item.id === active)?.name}</strong><button className="inline-link" onClick={() => setMediaVariants((current) => { const next = { ...current }; delete next[active]; return next; })}>Use shared order</button></div><p>Select assets from the master set and adjust their order for this channel.</p>{media.map((item) => { const index = activeMedia.findIndex((asset) => asset.id === item.id); return <div className="channel-media-row" key={item.id}><label><input type="checkbox" checked={index >= 0} onChange={() => toggleVariantMedia(item.id)} /> {item.name}</label><span>{index >= 0 ? `#${index + 1}` : "Excluded"}</span><button className="icon-only" disabled={index <= 0} onClick={() => moveVariantMedia(item.id, -1)} aria-label={`Move ${item.name} earlier for ${active}`}><ArrowUp size={15} /></button><button className="icon-only" disabled={index < 0 || index === activeMedia.length - 1} onClick={() => moveVariantMedia(item.id, 1)} aria-label={`Move ${item.name} later for ${active}`}><ArrowDown size={15} /></button></div>; })}</div>}</div></div>}
      {issues.length > 0 && <div className="validation-note"><AlertCircle size={18} /><div><strong>Needs your attention</strong>{issues.map((issue) => <p key={issue}>{issue}</p>)}</div></div>}
    </section>
    <section className="panel-card padded"><span className="eyebrow">03 / THE MOMENT</span><h3>Choose what happens next.</h3><div className="delivery-options">{([{ id: "draft", icon: PenLine, title: "Keep as draft", description: "Give it another look later" }, { id: "schedule", icon: CalendarDays, title: "Schedule it", description: "Pick a future date and time" }, { id: "now", icon: Send, title: "Publish now", description: "Simulate sending it today" }] as const).map((option) => <button key={option.id} className={`delivery-choice ${choice === option.id ? "selected" : ""}`} onClick={() => setChoice(option.id)}><option.icon size={19} /><span><strong>{option.title}</strong><small>{option.description}</small></span><span className="radio-dot" /></button>)}</div>{choice === "schedule" && <div className="schedule-fields"><label>Publish date & time<input type="datetime-local" value={scheduledAt} min={localDateTimeMin()} onChange={(event) => setScheduledAt(event.target.value)} /></label><button className="button button-outline small" onClick={nextSlot}>Use next weekly slot</button><small><Clock3 size={14} /> Device timezone: {timezone}</small></div>}
      {error && <div className="form-error" role="alert"><AlertCircle size={17} />{error}</div>}
      <div className="composer-footer"><button className="button button-outline" onClick={saveDraft}>Save draft</button><button className="button button-primary" onClick={review}>Review post <ArrowRight size={17} /></button></div>
    </section>
  </div><aside className="compose-preview"><div className="preview-sticky"><div className="preview-heading"><span className="eyebrow">LIVE PREVIEW</span><h3>See it in context.</h3><p>Illustrative layout; the final platform may display content differently.</p></div>{previewSwitcher}<PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={activeMedia} youtubeTitle={youtubeTitle} /><div className="preview-under"><Sparkles size={18} /><span>One master idea, with space to make each version feel at home.</span></div></div></aside></div>;
}

function localDateTimeMin() {
  const date = new Date(Date.now() + 60_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
