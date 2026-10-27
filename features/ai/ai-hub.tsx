"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { eligibleExamples, generateWriting } from "./writing";
import { simulationId, type Campaign, type Post, useSimulationStore } from "../simulation/store";
import { adNetworks, platforms } from "../platforms/catalog";

type Area = "create" | "rewrite" | "voice";

export function AiHub({ onOpenPost, onOpenCampaign }: { onOpenPost: (id: string) => void; onOpenCampaign: (id?: string) => void }) {
  const { aiSession, setAiSession, aiArea, setAiArea, aiCampaignDraft, setAiCampaignDraft, writingProfile, setWritingProfile, posts, connected, upsertPost } = useSimulationStore();
  const area: Area = aiArea;
  const [message, setMessage] = useState("");
  const published = posts.filter((post) => post.status === "published");
  const session = aiSession ?? { original: "", brief: "", channels: [], networks: [], suggestion: "", sourcePostIds: [], feedback: null, generation: 0, mode: "create" as const, target: "post" as const };
  const update = (patch: Partial<typeof session>) => setAiSession({ ...session, ...patch });
  const origin = aiSession?.origin;

  function generate() {
    if (area === "rewrite" && !session.original.trim()) { setMessage("Add text to rewrite first."); return; }
    if (area === "create" && !session.brief.trim() && !writingProfile.enabled) { setMessage("Add a short brief for this idea."); return; }
    const examples = writingProfile.enabled ? eligibleExamples(posts, writingProfile) : [];
    const generation = session.suggestion ? session.generation + 1 : session.generation;
    update({ mode: area === "rewrite" ? "rewrite" : "create", generation, suggestion: generateWriting({ mode: area === "rewrite" ? "rewrite" : "create", target: session.target, source: session.original, brief: session.brief, generation, profile: writingProfile, examples }), sourcePostIds: examples.map((post) => post.id), feedback: null });
    setMessage("");
  }

  function insert() {
    const value = session.suggestion.trim();
    if (!value) return;
    if (origin?.kind === "post") {
      const source = posts.find((post) => post.id === origin.id);
      const id = source && source.status !== "draft" ? simulationId() : origin.id;
      const channels = source?.channels ?? session.channels;
      const base: Post = source ? { ...source, id, status: "draft", channelStatus: Object.fromEntries(channels.map((channel) => [channel, "draft"])) as Post["channelStatus"], scheduledAt: undefined, createdAt: id === source.id ? source.createdAt : new Date().toISOString() } : { id, title: "Untitled post", text: "", variants: {}, channels, media: [], status: "draft", channelStatus: {}, createdAt: new Date().toISOString() };
      const next = origin.field === "variant" && origin.channel ? { ...base, variants: { ...base.variants, [origin.channel]: value } } : { ...base, text: value, title: value.split("\n")[0].slice(0, 56) || "Untitled post" };
      upsertPost({ ...next, writingContext: { profileVersion: 1, sourcePostIds: session.sourcePostIds } });
      setAiSession(null);
      onOpenPost(id);
    } else if (origin?.kind === "campaign") {
      const draft = aiCampaignDraft ?? {};
      const next = origin.field === "networkCreative" && origin.network ? { ...draft, networkCreative: { ...draft.networkCreative, [origin.network]: value } } : { ...draft, creative: value };
      setAiCampaignDraft({ ...next, writingContext: { profileVersion: 1, sourcePostIds: session.sourcePostIds } });
      setAiSession(null);
      onOpenCampaign();
    } else if (session.target === "post") {
      const id = simulationId();
      const channels = session.channels.length ? session.channels : connected;
      upsertPost({ id, title: value.split("\n")[0].slice(0, 56), text: value, variants: {}, channels, media: [], status: "draft", channelStatus: Object.fromEntries(channels.map((channel) => [channel, "draft"])) as Post["channelStatus"], createdAt: new Date().toISOString(), writingContext: { profileVersion: 1, sourcePostIds: session.sourcePostIds } });
      setAiSession(null);
      onOpenPost(id);
    } else {
      const draft: Partial<Campaign> = aiCampaignDraft ?? {};
      const id = simulationId();
      const networks = session.networks.length ? session.networks : draft.networks ?? [];
      const campaign: Campaign = { id, name: draft.name || session.brief.slice(0, 60) || "Untitled campaign", objective: "traffic", destination: draft.destination ?? "", audience: draft.audience ?? "", location: draft.location ?? "", geo: draft.geo, networkGeo: draft.networkGeo, networkAge: draft.networkAge, networks, placements: draft.placements ?? {}, networkAudience: draft.networkAudience, networkLocation: draft.networkLocation, networkCreative: draft.networkCreative, networkMedia: draft.networkMedia, networkStartAt: draft.networkStartAt, networkEndAt: draft.networkEndAt, budgets: draft.budgets ?? {}, spent: {}, currency: draft.currency ?? "CAD", startAt: draft.startAt ?? "", endAt: draft.endAt ?? "", creative: value, writingContext: { profileVersion: 1, sourcePostIds: session.sourcePostIds }, media: draft.media ?? null, status: "draft", networkStatus: {}, createdAt: new Date().toISOString() };
      setAiCampaignDraft(campaign);
      setAiSession(null);
      onOpenCampaign();
    }
  }

  return <div className="ai-hub stack-gap">
    <nav className="settings-tabs" aria-label="SpreadNotes AI sections">{(["create", "rewrite", "voice"] as Area[]).map((item) => <button key={item} className={area === item ? "active" : ""} aria-current={area === item ? "page" : undefined} onClick={() => { setAiArea(item); setMessage(""); }}>{item === "voice" ? "Voice profile" : item === "create" ? "Create" : "Rewrite"}</button>)}</nav>
    {area === "voice" ? <section className="panel-card padded ai-voice"><span className="eyebrow">OPTIONAL VOICE PROFILE</span><h3>Give ideas your voice.</h3><p className="muted-copy">Basic writing help works without this profile. Example posts are used only when you enable it.</p><label className="analytics-toggle"><input type="checkbox" checked={writingProfile.enabled} onChange={(event) => setWritingProfile({ enabled: event.target.checked })} /> Use my voice profile</label><div className="form-grid settings-form"><label>Topics<input value={writingProfile.topics} onChange={(event) => setWritingProfile({ topics: event.target.value })} /></label><label>Audience<input value={writingProfile.audience} onChange={(event) => setWritingProfile({ audience: event.target.value })} /></label><label>Goal<input value={writingProfile.goals} onChange={(event) => setWritingProfile({ goals: event.target.value })} /></label><label>Voice or tone<input value={writingProfile.voice} onChange={(event) => setWritingProfile({ voice: event.target.value })} /></label><label>Preferred terms<input value={writingProfile.preferredTerms} onChange={(event) => setWritingProfile({ preferredTerms: event.target.value })} /></label><label>Avoid these terms<input value={writingProfile.bannedTerms} onChange={(event) => setWritingProfile({ bannedTerms: event.target.value })} /></label></div><h4>Example posts</h4><p className="field-hint">Choose published posts from this workspace. Their IDs stay attached to accepted suggestions.</p>{published.length ? <div className="example-list">{published.map((post) => <label key={post.id}><input type="checkbox" checked={writingProfile.examplePostIds.includes(post.id)} onChange={(event) => setWritingProfile({ examplePostIds: event.target.checked ? [...writingProfile.examplePostIds, post.id] : writingProfile.examplePostIds.filter((id) => id !== post.id) })} /><span>{post.title}</span></label>)}</div> : <p className="analytics-capability">No published posts yet. You can still use the profile fields.</p>}</section> : <div className="ai-hub-layout"><section className="panel-card padded"><span className="eyebrow">{area === "create" ? "START AN IDEA" : "REWORK YOUR TEXT"}</span><h3>{area === "create" ? "What are we writing?" : "What should change?"}</h3>{origin && <p className="ai-source-note">Opened from {origin.kind === "post" ? origin.field === "variant" ? `${origin.channel} post text` : "master post text" : origin.field === "networkCreative" ? `${origin.network} ad copy` : "shared ad copy"}. Insert returns to that field.</p>}<div className="form-stack"><label>Content type<select value={session.target} disabled={!!origin} onChange={(event) => update({ target: event.target.value as "post" | "campaign", suggestion: "" })}><option value="post">Organic post</option><option value="campaign">Ad copy</option></select></label><label>Brief<textarea value={session.brief} onChange={(event) => update({ brief: event.target.value })} placeholder="What is the idea, audience, or goal?" /></label>{area === "rewrite" && <label>Original text<textarea value={session.original} onChange={(event) => update({ original: event.target.value })} placeholder="Paste or write text to reshape" /></label>}</div><div className="ai-context-chips">{session.channels.map((id) => <span key={id}>{platforms.find((item) => item.id === id)?.name}</span>)}{session.networks.map((id) => <span key={id}>{adNetworks.find((item) => item.id === id)?.name}</span>)}</div>{message && <p className="form-error" role="alert">{message}</p>}<button className="button button-primary" onClick={generate}><Sparkles size={16} /> {session.suggestion ? "Regenerate" : "Generate suggestion"}</button></section><section className="panel-card padded"><span className="eyebrow">SIDE BY SIDE</span><h3>Review before inserting.</h3><div className="ai-result-grid"><div><strong>Original</strong><p>{session.original || "No original text yet."}</p></div><div><strong>Suggested</strong><p>{session.suggestion || "Your suggestion will appear here."}</p></div></div>{session.suggestion && <><p className="field-hint">Example sources: {session.sourcePostIds.length || "none"} · Feedback: {session.feedback ?? "none"}</p><div className="ai-result-actions"><button className="button button-outline" onClick={() => update({ suggestion: "", feedback: null })}>Discard</button><button className="button button-outline" aria-pressed={session.feedback === "useful"} onClick={() => update({ feedback: "useful" })}>Useful</button><button className="button button-outline" aria-pressed={session.feedback === "off-target"} onClick={() => update({ feedback: "off-target" })}>Off target</button><button className="button button-primary" onClick={insert}>{origin ? "Insert and return" : "Create editable draft"} <ArrowRight size={16} /></button></div></>}</section></div>}
    {origin && <button className="back-link" onClick={() => { if (origin.kind === "post") onOpenPost(origin.id); else onOpenCampaign(); }}><ArrowLeft size={16} /> Return without inserting</button>}
  </div>;
}
