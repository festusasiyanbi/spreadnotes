"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, ImagePlus, PenLine, Send, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { demoId, type DemoMedia, type Post, useDemoStore } from "../demo/store";
import { mediaKind, platforms, postIssues } from "../platforms/catalog";
import { NetworkMark } from "../platforms/NetworkMark";
import type { PlatformId } from "../platforms/types";
import { PostPreview } from "../previews/PostPreview";
import type { AppView } from "../shell/AppShell";

type PublishChoice = "draft" | "schedule" | "now";
type Outcome = "success" | "partial" | "failure";

export function PostComposer({ postId, onNavigate, onNotice }: { postId: string | null; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const { posts, connected, upsertPost } = useDemoStore();
  const existing = posts.find((post) => post.id === postId);
  const [text, setText] = useState(existing?.text ?? "");
  const [selected, setSelected] = useState<PlatformId[]>(existing?.channels ?? connected.slice(0, 2));
  const [variants, setVariants] = useState<Partial<Record<PlatformId, string>>>(existing?.variants ?? {});
  const [media, setMedia] = useState<DemoMedia[]>(existing?.media ?? []);
  const [active, setActive] = useState<PlatformId>(existing?.channels[0] ?? connected[0] ?? "linkedin");
  const [choice, setChoice] = useState<PublishChoice>(existing?.status === "scheduled" ? "schedule" : "draft");
  const [scheduledAt, setScheduledAt] = useState(existing?.scheduledAt ?? "");
  const [outcome, setOutcome] = useState<Outcome>("success");
  const [step, setStep] = useState<"compose" | "review">("compose");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ tone: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const issues = useMemo(() => postIssues(text, media, selected, variants), [text, media, selected, variants]);
  const connectedPlatforms = platforms.filter((platform) => connected.includes(platform.id));
  const selectedPlatforms = platforms.filter((platform) => selected.includes(platform.id));
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function toggleChannel(id: PlatformId) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setSelected(next);
    setActive(next.includes(id) ? id : next[0] ?? id);
    setError("");
  }
  function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 10 - media.length));
    const next: DemoMedia[] = [];
    for (const file of files) {
      const kind = mediaKind(file);
      if (!kind) { setError(`${file.name} is not a supported image, video, or PDF.`); continue; }
      next.push({ id: demoId(), name: file.name, kind, url: URL.createObjectURL(file), type: file.type });
    }
    setMedia((current) => [...current, ...next]);
    if ((event.target.files?.length ?? 0) > files.length) setError("You can add up to 10 media files.");
    event.target.value = "";
  }
  function removeMedia(id: string) {
    const item = media.find((file) => file.id === id);
    if (item?.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
    setMedia((current) => current.filter((file) => file.id !== id));
  }
  function addSample(kind: "image" | "video") {
    if (media.length >= 10) { setError("You can add up to 10 media files."); return; }
    setMedia((current) => [...current, {
      id: demoId(),
      name: kind === "video" ? "Sample video concept" : "Sample image",
      kind,
      type: kind === "video" ? "video/demo" : "image/svg+xml",
      url: kind === "video" ? "/demo-video-poster.svg" : "/demo-creative.svg",
    }]);
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
    setAiSuggestion({ tone, text: suggestion });
  }
  function buildPost(status: Post["status"], channelStatus: Post["channelStatus"]): Post {
    return { id: existing?.id ?? demoId(), title: text.trim().split("\n")[0].slice(0, 56) || "Untitled post", text: text.trim(), variants, channels: selected, media, status, channelStatus, scheduledAt: choice === "schedule" ? scheduledAt : undefined, createdAt: existing?.createdAt ?? new Date().toISOString() };
  }
  function saveDraft() {
    if (!text.trim() && media.length === 0) { setError("Add some text or media before saving a draft."); return; }
    upsertPost(buildPost("draft", Object.fromEntries(selected.map((id) => [id, "draft"])) as Post["channelStatus"]));
    onNotice("Draft saved in your demo library.");
    onNavigate("library");
  }
  function review() {
    if (!text.trim()) { setError("Write a post before continuing."); return; }
    if (!selected.length) { setError("Select at least one connected channel."); return; }
    if (issues.length) { setError("Resolve the channel compatibility notes before continuing."); return; }
    if (choice === "schedule" && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) { setError("Choose a future date and time."); return; }
    setError("");
    setStep("review");
  }
  function confirm() {
    const direct = selected.filter((id) => platforms.find((platform) => platform.id === id)?.postingMode === "direct");
    const manual = selected.filter((id) => !direct.includes(id));
    if (choice === "schedule") {
      upsertPost(buildPost("scheduled", Object.fromEntries(selected.map((id) => [id, "scheduled"])) as Post["channelStatus"]));
      onNotice("Post scheduled in this demo. Open Calendar to see it.");
      onNavigate("calendar");
      return;
    }
    if (choice === "draft") { saveDraft(); return; }
    setBusy(true);
    const queued = buildPost("queued", {});
    upsertPost(queued);
    window.setTimeout(() => useDemoStore.getState().setPostStatus(queued.id, "publishing"), 450);
    window.setTimeout(() => {
      const failed = outcome === "failure" ? direct : outcome === "partial" ? direct.slice(-1) : [];
      const channelStatus = Object.fromEntries(selected.map((id) => [id, manual.includes(id) ? "handoff" : failed.includes(id) ? "failed" : "published"])) as Post["channelStatus"];
      const finalStatus: Post["status"] = failed.length === direct.length && !manual.length ? "failed" : failed.length ? "partial" : manual.length ? "handoff" : "published";
      useDemoStore.getState().upsertPost({ ...queued, status: finalStatus, channelStatus });
      setBusy(false);
      onNotice(finalStatus === "published" ? "Demo post published across selected channels." : "Demo outcome ready. Review each channel in the library.");
      onNavigate("library");
    }, 1450);
  }

  if (step === "review") return <div className="review-layout"><div className="panel-card padded"><button className="back-link" onClick={() => setStep("compose")}><ArrowLeft size={16} /> Back to editing</button><span className="eyebrow">FINAL REVIEW</span><h2>Everything in its right place?</h2><p className="muted-copy">Review what each channel will receive. Nothing is sent to an actual social platform.</p><div className="review-summary"><div><span>DELIVERY</span><strong>{choice === "schedule" ? "Schedule post" : choice === "now" ? "Publish now" : "Save draft"}</strong></div><div><span>CHANNELS</span><strong>{selected.length} selected</strong></div>{choice === "schedule" && <div><span>WHEN</span><strong>{new Date(scheduledAt).toLocaleString()} · {timezone}</strong></div>}</div><div className="review-channels">{selectedPlatforms.map((platform) => <div key={platform.id}><NetworkMark id={platform.id} /><span><strong>{platform.name}</strong><small>{platform.postingMode === "manual" ? "Manual handoff required" : "Simulated direct publishing"}</small></span><Check size={17} /></div>)}</div>{choice === "now" && <div className="form-stack scenario-field"><label>Demo outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as Outcome)}><option value="success">Success where direct publishing is available</option><option value="partial">One channel fails</option><option value="failure">Direct publishing fails</option></select></label><small className="field-hint">Use this selector to explore failure and retry screens.</small></div>}<div className="review-footer"><button className="button button-outline" onClick={() => setStep("compose")}>Edit post</button><button disabled={busy} className="button button-primary" onClick={confirm}>{busy ? "Publishing in demo…" : choice === "now" ? "Confirm demo publish" : choice === "schedule" ? "Confirm schedule" : "Save draft"} <ArrowRight size={16} /></button></div></div><PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={media} /></div>;

  return <div className="compose-layout"><div className="compose-main">
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">01 / THE IDEA</span><h3>Begin with your thought.</h3></div><button className="small-icon-button" onClick={() => setAiOpen((value) => !value)}><Sparkles size={16} /> Demo assistant</button></div><label className="editor-label" htmlFor="master-post">MASTER POST</label><textarea id="master-post" className="master-editor" placeholder="What would you like to share?" value={text} maxLength={70000} onChange={(event) => { setText(event.target.value); setError(""); }} /><div className="editor-bottom"><span>Write your idea freely. Tailor it by channel below.</span><strong>{text.length} characters</strong></div>
      {aiOpen && <div className="ai-panel"><div className="ai-panel-heading"><WandSparkles size={18} /><div><strong>A little help shaping the thought</strong><small>Sample output only. Review every word before using it.</small></div></div><div className="ai-actions">{["Clearer", "Warmer", "Concise"].map((tone) => <button key={tone} onClick={() => suggest(tone)}>{tone}</button>)}</div>{aiSuggestion && <div className="ai-comparison"><div><span>YOUR ORIGINAL</span><p>{text}</p></div><div><span>SUGGESTED · {aiSuggestion.tone.toUpperCase()}</span><p>{aiSuggestion.text}</p></div><div className="ai-comparison-actions"><button onClick={() => setAiSuggestion(null)}>Discard</button><button className="button button-dark small" onClick={() => { setText(aiSuggestion.text); setAiSuggestion(null); onNotice("Suggestion applied. Review it before publishing."); }}>Use suggestion <Check size={14} /></button></div></div>}</div>}
      <div className="media-section"><div><strong>Add media</strong><span>Up to 10 files · image, video, or PDF · temporary demo previews</span></div><label className="media-add"><ImagePlus size={18} /> Add files<input type="file" accept="image/*,video/*,application/pdf" multiple onChange={addMedia} /></label></div><div className="sample-assets"><span>OR TRY A SAMPLE</span><button onClick={() => addSample("image")}>Sample image</button><button onClick={() => addSample("video")}>Sample video concept</button></div>{media.length > 0 && <div className="media-list">{media.map((item) => <div key={item.id} className="media-item">{item.kind === "image" || item.url.endsWith(".svg") ? <img src={item.url} alt={item.name} /> : item.kind === "video" ? <video src={item.url} muted /> : <span className="pdf-mark">PDF</span>}<div><strong>{item.name}</strong><small>{item.kind === "video" && item.url.endsWith(".svg") ? "video concept" : item.kind}</small></div><button className="icon-only" onClick={() => removeMedia(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></div>)}</div>}
    </section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">02 / THE DESTINATIONS</span><h3>Choose where it belongs.</h3></div><span className="count-chip">{selected.length} selected</span></div>{connectedPlatforms.length ? <div className="channel-picker">{connectedPlatforms.map((platform) => <button key={platform.id} className={`channel-choice ${selected.includes(platform.id) ? "selected" : ""}`} onClick={() => toggleChannel(platform.id)}><NetworkMark id={platform.id} /><span>{platform.name}</span><span className="choice-check">{selected.includes(platform.id) ? <Check size={13} /> : null}</span></button>)}</div> : <div className="inline-empty"><AlertCircle size={19} /><span>Choose demo social accounts before publishing.</span><button className="inline-link" onClick={() => onNavigate("connections")}>Open connections <ArrowRight size={15} /></button></div>}
      {selected.length > 0 && <div className="variant-editor"><div className="variant-tabs">{selectedPlatforms.map((platform) => <button key={platform.id} className={active === platform.id ? "active" : ""} onClick={() => setActive(platform.id)}><NetworkMark id={platform.id} />{platform.name}</button>)}</div><div className="variant-body"><label htmlFor="variant-text">VERSION FOR {active.toUpperCase()}</label><textarea id="variant-text" value={variants[active] ?? text} onChange={(event) => setVariants((current) => ({ ...current, [active]: event.target.value }))} placeholder="Tailor this version…" /><div><span>{(variants[active] ?? text).length} / {platforms.find((platform) => platform.id === active)?.limit.toLocaleString()} characters</span><button className="inline-link" onClick={() => setVariants((current) => { const next = { ...current }; delete next[active]; return next; })}>Reset to master</button></div></div></div>}
      {issues.length > 0 && <div className="validation-note"><AlertCircle size={18} /><div><strong>Needs your attention</strong>{issues.map((issue) => <p key={issue}>{issue}</p>)}</div></div>}
    </section>
    <section className="panel-card padded"><span className="eyebrow">03 / THE MOMENT</span><h3>Choose what happens next.</h3><div className="delivery-options">{([{ id: "draft", icon: PenLine, title: "Keep as draft", description: "Give it another look later" }, { id: "schedule", icon: CalendarDays, title: "Schedule it", description: "Pick a future date and time" }, { id: "now", icon: Send, title: "Publish now", description: "Simulate sending it today" }] as const).map((option) => <button key={option.id} className={`delivery-choice ${choice === option.id ? "selected" : ""}`} onClick={() => setChoice(option.id)}><option.icon size={19} /><span><strong>{option.title}</strong><small>{option.description}</small></span><span className="radio-dot" /></button>)}</div>{choice === "schedule" && <div className="schedule-fields"><label>Publish date & time<input type="datetime-local" value={scheduledAt} min={localDateTimeMin()} onChange={(event) => setScheduledAt(event.target.value)} /></label><small><Clock3 size={14} /> Timezone: {timezone}</small></div>}
      {error && <div className="form-error" role="alert"><AlertCircle size={17} />{error}</div>}
      <div className="composer-footer"><button className="button button-outline" onClick={saveDraft}>Save draft</button><button className="button button-primary" onClick={review}>Review post <ArrowRight size={17} /></button></div>
    </section>
  </div><aside className="compose-preview"><div className="preview-sticky"><div className="preview-heading"><span className="eyebrow">LIVE PREVIEW</span><h3>See it in context.</h3><p>Illustrative layout; the final platform may display content differently.</p></div><PostPreview platform={platforms.find((item) => item.id === active) ?? selectedPlatforms[0]} text={variants[active] ?? text} media={media} /><div className="preview-under"><Sparkles size={18} /><span>One master idea, with space to make each version feel at home.</span></div></div></aside></div>;
}

function localDateTimeMin() {
  const date = new Date(Date.now() + 60_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
