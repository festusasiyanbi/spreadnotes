"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, CalendarDays, Check, CircleDollarSign, Clock3, Megaphone, Pause, Play, Plus, RotateCcw, Send, Sparkles } from "lucide-react";
import { demoId, type Campaign, type CampaignStatus, type DemoMedia, useDemoStore } from "../demo/store";
import { adMetrics, campaignSnapshot, formatMetric } from "../analytics/model";
import { adNetworks, mediaKind } from "../platforms/catalog";
import { NetworkMark } from "../platforms/NetworkMark";
import type { AdNetworkId } from "../platforms/types";
import type { AppView } from "../shell/AppShell";

type Mode = "overview" | "create" | "review" | "detail";
type Objective = Campaign["objective"];
const objectives: { id: Objective; title: string; description: string }[] = [
  { id: "traffic", title: "Website visits", description: "Bring people to a destination" },
];

export function AdsWorkspace({ campaignId, onOpenCampaign, onNavigate, onNotice }: { campaignId: string | null; onOpenCampaign: (id: string) => void; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const { campaigns, posts, adConnected, adConnectionStates, upsertCampaign, setCampaignStatus } = useDemoStore();
  const existing = campaigns.find((campaign) => campaign.id === campaignId);
  const [mode, setMode] = useState<Mode>(existing ? "detail" : "overview");
  const [name, setName] = useState(existing?.name ?? "");
  const [objective, setObjective] = useState<Objective>(existing?.objective ?? "traffic");
  const [destination, setDestination] = useState(existing?.destination ?? "");
  const [audience, setAudience] = useState(existing?.audience ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [selected, setSelected] = useState<AdNetworkId[]>(existing?.networks ?? adConnected.filter((id) => (adConnectionStates[id] ?? "ready") === "ready").slice(0, 2));
  const [placements, setPlacements] = useState<Campaign["placements"]>(existing?.placements ?? {});
  const [networkAudience, setNetworkAudience] = useState<NonNullable<Campaign["networkAudience"]>>(existing?.networkAudience ?? {});
  const [networkLocation, setNetworkLocation] = useState<NonNullable<Campaign["networkLocation"]>>(existing?.networkLocation ?? {});
  const [networkCreative, setNetworkCreative] = useState<NonNullable<Campaign["networkCreative"]>>(existing?.networkCreative ?? {});
  const [networkMedia, setNetworkMedia] = useState<NonNullable<Campaign["networkMedia"]>>(existing?.networkMedia ?? {});
  const [networkStartAt, setNetworkStartAt] = useState<NonNullable<Campaign["networkStartAt"]>>(existing?.networkStartAt ?? {});
  const [networkEndAt, setNetworkEndAt] = useState<NonNullable<Campaign["networkEndAt"]>>(existing?.networkEndAt ?? {});
  const [budgets, setBudgets] = useState<Campaign["budgets"]>(existing?.budgets ?? {});
  const [currency, setCurrency] = useState(existing?.currency ?? "CAD");
  const [startAt, setStartAt] = useState(existing?.startAt ?? "");
  const [endAt, setEndAt] = useState(existing?.endAt ?? "");
  const [creative, setCreative] = useState(existing?.creative ?? "");
  const [media, setMedia] = useState<DemoMedia | null>(existing?.media ?? null);
  const [sourcePost, setSourcePost] = useState("");
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"approved" | "partial" | "rejected">("approved");
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState(existing?.id ?? "");
  const detail = campaigns.find((campaign) => campaign.id === detailId);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const totalDaily = selected.reduce((sum, id) => sum + Number(budgets[id] ?? 0), 0);
  const selectedNetworks = adNetworks.filter((network) => selected.includes(network.id));
  const connectedNetworks = adNetworks.filter((network) => adConnected.includes(network.id) && (adConnectionStates[network.id] ?? "ready") === "ready");

  function toggleNetwork(id: AdNetworkId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError("");
  }
  function togglePlacement(id: AdNetworkId, placement: string) {
    setPlacements((current) => {
      const values = current[id] ?? [];
      return { ...current, [id]: values.includes(placement) ? values.filter((item) => item !== placement) : [...values, placement] };
    });
  }
  function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const kind = mediaKind(file);
    if (kind !== "image" && kind !== "video") { setError("Ad creative needs an image or video."); return; }
    if (file.size > (kind === "image" ? 5 : 250) * 1024 * 1024) { setError("The demo accepts images under 5 MB and videos under 250 MB."); return; }
    if (media?.url.startsWith("blob:")) URL.revokeObjectURL(media.url);
    setMedia({ id: demoId(), name: file.name, kind, type: file.type, bytes: file.size, url: URL.createObjectURL(file) });
    event.target.value = "";
  }
  function addNetworkMedia(id: AdNetworkId, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const kind = mediaKind(file);
    if (kind !== "image" && kind !== "video") { setError("Choose an image or video for this network."); return; }
    if (file.size > (kind === "image" ? 5 : 250) * 1024 * 1024) { setError("The demo accepts images under 5 MB and videos under 250 MB."); return; }
    setNetworkMedia((current) => ({ ...current, [id]: { id: demoId(), name: file.name, kind, type: file.type, bytes: file.size, url: URL.createObjectURL(file) } }));
    event.target.value = "";
  }
  function useSampleAsset(kind: "image" | "video") {
    if (media?.url.startsWith("blob:")) URL.revokeObjectURL(media.url);
    setMedia({
      id: demoId(),
      name: kind === "video" ? "Sample video concept" : "Sample campaign image",
      kind,
      type: kind === "video" ? "video/demo" : "image/jpeg",
      url: kind === "video" ? "/demo-video-poster.svg" : "/demo-creative.jpg",
    });
  }
  function usePost(id: string) {
    setSourcePost(id);
    const post = posts.find((item) => item.id === id);
    if (!post) return;
    setCreative(post.text);
    setMedia(post.media.find((item) => item.kind === "image" || item.kind === "video") ?? null);
    onNotice("Post content copied into this separate ad draft.");
  }
  function validate() {
    if (!name.trim()) return "Give your campaign a name.";
    if (!selected.length) return "Select at least one demo ad account.";
    if (selected.some((id) => !adConnected.includes(id) || (adConnectionStates[id] ?? "ready") !== "ready")) return "Select ready ad accounts in Connections.";
    if (objective === "traffic" && (!/^https?:\/\//.test(destination) || !isValidUrl(destination))) return "Enter a valid http or https destination URL.";
    if (!audience.trim() || !location.trim()) return "Describe the audience and location.";
    if (selected.some((id) => !(networkAudience[id] ?? audience).trim() || !(networkLocation[id] ?? location).trim())) return "Complete the audience and location for each network.";
    if (selected.some((id) => !placements[id]?.length)) return "Choose at least one placement for every network.";
    if (selected.some((id) => !Number.isFinite(Number(budgets[id])) || Number(budgets[id]) <= 0)) return "Enter a daily budget greater than zero for every network.";
    if (!startAt || !endAt || new Date(startAt).getTime() <= Date.now() || new Date(endAt).getTime() <= new Date(startAt).getTime()) return "Choose a future start time and an end time after it.";
    if (selected.some((id) => new Date(networkStartAt[id] ?? startAt).getTime() <= Date.now() || new Date(networkEndAt[id] ?? endAt).getTime() <= new Date(networkStartAt[id] ?? startAt).getTime())) return "Each network needs a future start and a later end time.";
    if (!creative.trim()) return "Add ad copy.";
    if (selected.some((id) => !(networkCreative[id] ?? creative).trim())) return "Complete ad copy for each network.";
    if (selected.some((id) => !(networkMedia[id] ?? media))) return "Add an image or video for every selected network.";
    if (selected.some((id) => (networkMedia[id] ?? media)?.type === "video/demo")) return "The sample video concept is a preview only. Upload a playable video for each selected network using it.";
    if (selected.includes("tiktok") && (networkMedia.tiktok ?? media)?.kind !== "video") return "TikTok Ads needs a video creative in this demo flow.";
    return "";
  }
  function save(status: CampaignStatus) {
    const campaign: Campaign = {
      id: existing?.id ?? demoId(), name: name.trim(), objective, destination: destination.trim(), audience: audience.trim(), location: location.trim(), networks: selected,
      placements, networkAudience, networkLocation, networkCreative, networkMedia, networkStartAt, networkEndAt, budgets, spent: existing?.spent ?? {}, currency, startAt, endAt, creative: creative.trim(), media, status,
      networkStatus: Object.fromEntries(selected.map((id) => [id, status])) as Campaign["networkStatus"],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    upsertCampaign(campaign);
    return campaign;
  }
  function saveDraft() {
    if (!name.trim()) { setError("Give your campaign a name before saving it."); return; }
    save("draft");
    setMode("overview");
    onNotice("Campaign draft saved in this demo.");
  }
  function review() {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError("");
    setMode("review");
  }
  function submit() {
    const campaign = save("review");
    setBusy(true);
    setMode("detail");
    setDetailId(campaign.id);
    onNotice("Campaign submitted to simulated platform review.");
    window.setTimeout(() => {
      const networkStatus = Object.fromEntries(campaign.networks.map((id, index) => [id, outcome === "rejected" ? "rejected" : outcome === "partial" && index === campaign.networks.length - 1 ? "rejected" : "scheduled"])) as Campaign["networkStatus"];
      const status: CampaignStatus = outcome === "rejected" || outcome === "partial" && campaign.networks.length === 1 ? "rejected" : outcome === "partial" ? "partial" : "scheduled";
      useDemoStore.getState().upsertCampaign({ ...campaign, status, networkStatus });
      setBusy(false);
    }, 1500);
  }
  function advance() {
    if (!detail) return;
    const next: CampaignStatus = detail.status === "scheduled" || detail.status === "partial" ? "live" : detail.status === "live" ? "completed" : "review";
    const networkStatus = Object.fromEntries(detail.networks.map((id) => [id, detail.networkStatus[id] === "rejected" ? "rejected" : next])) as Campaign["networkStatus"];
    const spent = next === "live" || next === "completed" ? Object.fromEntries(detail.networks.map((id) => [id, Math.round(Number(detail.budgets[id] ?? 0) * (next === "live" ? 0.34 : 1) * 100) / 100])) as Campaign["spent"] : detail.spent;
    upsertCampaign({ ...detail, status: next, networkStatus, spent, sampleMetricsReady: false });
    onNotice(`Demo campaign moved to ${next}.`);
  }
  function retryRejected() {
    if (!detail) return;
    const pending = Object.fromEntries(detail.networks.map((id) => [id, detail.networkStatus[id] === "rejected" ? "review" : detail.networkStatus[id]])) as Campaign["networkStatus"];
    upsertCampaign({ ...detail, status: "review", networkStatus: pending });
    onNotice("Rejected network submitted for simulated re-review.");
    window.setTimeout(() => {
      const latest = useDemoStore.getState().campaigns.find((item) => item.id === detail.id);
      if (!latest) return;
      const approved = Object.fromEntries(latest.networks.map((id) => [id, latest.networkStatus[id] === "review" ? "scheduled" : latest.networkStatus[id]])) as Campaign["networkStatus"];
      const status: CampaignStatus = Object.values(approved).includes("live") ? "live" : "scheduled";
      useDemoStore.getState().upsertCampaign({ ...latest, networkStatus: approved, status });
    }, 1200);
  }

  if (mode === "overview") return <div className="ads-overview"><div className="ads-intro-card"><div><span className="eyebrow">A SPACE FOR PAID REACH</span><h2>Give the right ideas<br /><em>room to grow.</em></h2><p>Build campaigns with distinct budgets and schedules for each ad network. Review everything before a simulated submission.</p><button className="button button-light" onClick={() => { setMode("create"); setError(""); }}>Create campaign <Plus size={17} /></button></div><div className="ads-intro-art"><span>THE NEXT<br />GOOD IDEA<br /><em>GOES FURTHER.</em></span></div></div>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">CAMPAIGN LIST</span><h3>All campaigns</h3></div><span className="count-chip">{campaigns.length} total</span></div>{campaigns.length ? <div className="library-list">{campaigns.map((campaign) => <button key={campaign.id} className="campaign-row" onClick={() => onOpenCampaign(campaign.id)}><span className="row-icon"><Megaphone size={18} /></span><span><strong>{campaign.name}</strong><small>{campaign.networks.length} ad network{campaign.networks.length === 1 ? "" : "s"} · {campaign.currency} {campaign.networks.reduce((sum, id) => sum + Number(campaign.budgets[id] ?? 0), 0).toFixed(2)} / day</small></span><span className={`status-pill status-${campaign.status}`}>{campaign.status}</span><ArrowRight size={17} /></button>)}</div> : <div className="empty-panel"><div className="empty-panel-icon"><Megaphone size={24} /></div><h4>No campaigns yet.</h4><p>Start with a goal, then set an audience and budget for each network.</p><button className="button button-outline" onClick={() => setMode("create")}>Create campaign <ArrowRight size={15} /></button></div>}</section>
    <div className="ads-disclaimer"><CircleDollarSign size={18} /><span>No ad is submitted and no money is spent in this demo. Real ad spend would be charged by your connected ad platforms.</span></div>
  </div>;

  if (mode === "detail" && detail) return <div className="campaign-detail"><button className="back-link" onClick={() => setMode("overview")}><ArrowLeft size={16} /> All campaigns</button><div className="campaign-detail-heading"><div><span className="eyebrow">CAMPAIGN / {detail.id.slice(0, 8).toUpperCase()}</span><h2>{detail.name}</h2><p>Delivery and spend shown here are simulated.</p></div><span className={`status-pill status-${detail.status}`}>{busy ? "under review" : detail.status}</span></div><div className="metric-grid"><div className="metric-card"><span><CircleDollarSign size={18} /> DAILY BUDGET</span><strong>{detail.currency} {detail.networks.reduce((sum, id) => sum + Number(detail.budgets[id] ?? 0), 0).toFixed(0)}</strong><small>Across selected networks</small></div><div className="metric-card"><span><CircleDollarSign size={18} /> DEMO SPEND</span><strong>{detail.currency} {detail.networks.reduce((sum, id) => sum + Number(detail.spent[id] ?? 0), 0).toFixed(2)}</strong><small>Sample value · not real billing</small></div><div className="metric-card"><span><CalendarDays size={18} /> DEFAULT WINDOW</span><strong className="metric-date">{new Date(detail.startAt).toLocaleDateString()}</strong><small>Until {new Date(detail.endAt).toLocaleDateString()}</small></div></div>
    <div className="dashboard-columns"><section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">PER NETWORK</span><h3>Review & delivery</h3></div></div><div className="network-status-list">{detail.networks.map((id) => { const snapshot = campaignSnapshot(detail, id); return <div className="network-report" key={id}><div className="network-status-heading"><NetworkMark id={id} /><span><strong>{adNetworks.find((item) => item.id === id)?.name}</strong><small>{detail.currency} {Number(detail.budgets[id] ?? 0).toFixed(2)} / day · {detail.placements[id]?.join(", ")}</small><small>{new Date(detail.networkStartAt?.[id] ?? detail.startAt).toLocaleString()} – {new Date(detail.networkEndAt?.[id] ?? detail.endAt).toLocaleString()}</small></span><span className={`status-pill status-${detail.networkStatus[id] ?? detail.status}`}>{detail.networkStatus[id] ?? detail.status}</span></div><p className="field-hint">{detail.networkCreative?.[id] ?? detail.creative}</p>{detail.networkMedia?.[id] && <div className="campaign-media network-creative-preview">{detail.networkMedia[id]?.kind === "image" ? <img src={detail.networkMedia[id]?.url} alt={detail.networkMedia[id]?.name} /> : <video src={detail.networkMedia[id]?.url} controls />}</div>}{snapshot ? <div className="analytics-inline-metrics">{snapshot.metrics.map((metric) => <span key={metric.key}>{metric.label}: {formatMetric(metric, detail.currency)}</span>)}</div> : <p className="field-hint">{adMetrics[id].note} Sample reporting appears after the demo run is live.</p>}</div>; })}</div></section><section className="panel-card padded"><span className="eyebrow">CREATIVE</span><h3>Campaign message</h3><p className="campaign-copy">{detail.creative}</p>{detail.media && <div className="campaign-media">{detail.media.kind === "image" || detail.media.url.endsWith(".svg") ? <img src={detail.media.url} alt={detail.media.name} /> : <video src={detail.media.url} controls />}</div>}<small className="field-hint">This is a creative preview, not a platform-generated ad rendering.</small></section></div>
    <div className="campaign-actions">{detail.status === "draft" && <button className="button button-primary" onClick={() => { setMode("create"); setError(""); }}>Continue editing <ArrowRight size={16} /></button>}{["scheduled", "partial", "live"].includes(detail.status) && <button className="button button-primary" onClick={advance}>{detail.status === "live" ? "Complete demo run" : "Advance demo to live"} <ArrowRight size={16} /></button>}{detail.networks.some((id) => detail.networkStatus[id] === "rejected") && <button className="button button-outline" onClick={retryRejected}><RotateCcw size={16} /> Resubmit rejected network{detail.networks.filter((id) => detail.networkStatus[id] === "rejected").length > 1 ? "s" : ""}</button>}{detail.status === "live" && <button className="button button-outline" onClick={() => { setCampaignStatus(detail.id, "paused"); onNotice("Demo campaign paused."); }}><Pause size={16} /> Pause</button>}{detail.status === "paused" && <button className="button button-primary" onClick={() => { setCampaignStatus(detail.id, "live"); onNotice("Demo campaign resumed."); }}><Play size={16} /> Resume</button>}{detail.status === "rejected" && <button className="button button-outline" onClick={() => setMode("create")}><RotateCcw size={16} /> Revise creative</button>}{detail.status === "review" && <span className="muted-copy">Simulated review in progress…</span>}{["live", "paused", "completed"].includes(detail.status) && <button className="button button-outline" onClick={() => detail.sampleMetricsReady ? onNavigate("analytics") : (upsertCampaign({ ...detail, sampleMetricsReady: true, sampleReportedAt: new Date().toISOString() }), onNotice("Illustrative ad metrics added to Analytics."))}><BarChart3 size={16} /> {detail.sampleMetricsReady ? "View analytics" : "Reveal sample metrics"}</button>}</div>
  </div>;

  if (mode === "review") return <div className="review-layout"><section className="panel-card padded"><button className="back-link" onClick={() => setMode("create")}><ArrowLeft size={16} /> Back to campaign</button><span className="eyebrow">FINAL REVIEW</span><h2>Check every detail.</h2><p className="muted-copy">Each network receives its own campaign configuration. Platform review may delay the requested start.</p><div className="review-summary"><div><span>OBJECTIVE</span><strong>{objectives.find((item) => item.id === objective)?.title}</strong></div><div><span>AUDIENCE</span><strong>{audience} · {location}</strong></div><div><span>DEFAULT DATES</span><strong>{new Date(startAt).toLocaleDateString()} – {new Date(endAt).toLocaleDateString()}</strong></div><div><span>DAILY BUDGET</span><strong>{currency} {totalDaily.toFixed(2)}</strong></div></div><div className="review-channels">{selectedNetworks.map((network) => <div key={network.id}><NetworkMark id={network.id} /><span><strong>{network.name}</strong><small>{currency} {Number(budgets[network.id] ?? 0).toFixed(2)} / day · {placements[network.id]?.join(", ")} · {networkAudience[network.id] ?? audience} · {networkLocation[network.id] ?? location}</small><small>Copy: {networkCreative[network.id] ?? creative}</small><small>Destination: {destination} · Creative asset: {(networkMedia[network.id] ?? media)?.name}</small><small>Runs {new Date(networkStartAt[network.id] ?? startAt).toLocaleString()} – {new Date(networkEndAt[network.id] ?? endAt).toLocaleString()}</small></span><Check size={17} /></div>)}</div><div className="scenario-field form-stack"><label>Demo review outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)}><option value="approved">All networks approve</option><option value="partial">One network rejects</option><option value="rejected">All networks reject</option></select></label><small className="field-hint">Explore approval and failure states without a live ad account.</small></div><div className="review-footer"><button className="button button-outline" onClick={() => setMode("create")}>Edit campaign</button><button className="button button-primary" onClick={submit}>Submit to demo review <Send size={16} /></button></div></section><aside className="review-side-note"><Sparkles size={21} /><h3>A thoughtful pause before launch.</h3><p>Real ad networks review campaigns on their own timelines. A scheduled start does not guarantee immediate delivery.</p><strong>NO REAL SUBMISSION · NO CHARGES</strong></aside></div>;

  return <div className="ads-builder"><div className="builder-intro"><button className="back-link" onClick={() => setMode("overview")}><ArrowLeft size={16} /> All campaigns</button><div><span className="eyebrow">NEW PAID CAMPAIGN</span><h2>Start with a purpose.</h2><p>Set up a campaign that can be reviewed by each network later.</p></div></div><div className="builder-grid"><div className="builder-main">
    <section className="panel-card padded"><span className="eyebrow">01 / THE GOAL</span><h3>What should this campaign do?</h3><div className="form-stack"><label>Campaign name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Autumn launch" maxLength={100} /></label></div><div className="objective-grid">{objectives.map((item) => <button key={item.id} className={`objective-card ${objective === item.id ? "selected" : ""}`} onClick={() => setObjective(item.id)}><span className="radio-dot" /><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>{objective === "traffic" && <div className="form-stack"><label>Destination URL<input type="url" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="https://example.com" /></label></div>}</section>
    <section className="panel-card padded"><span className="eyebrow">02 / THE AUDIENCE</span><h3>Who should see it?</h3><p className="muted-copy">A useful starting brief. Exact targeting options are set per network during real integration.</p><div className="form-grid"><label>Audience description<input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="e.g. Independent makers" /></label><label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Canada" /></label></div></section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">03 / THE NETWORKS</span><h3>Where should it run?</h3></div><span className="count-chip">{selected.length} selected</span></div>{connectedNetworks.length ? <div className="channel-picker">{connectedNetworks.map((network) => <button key={network.id} className={`channel-choice ${selected.includes(network.id) ? "selected" : ""}`} onClick={() => toggleNetwork(network.id)}><NetworkMark id={network.id} /><span>{network.name}</span><span className="choice-check">{selected.includes(network.id) ? <Check size={13} /> : null}</span></button>)}</div> : <div className="inline-empty"><AlertCircle size={18} /><span>Choose ready demo ad accounts in Connections.</span><button className="inline-link" onClick={() => onNavigate("connections")}>Open connections <ArrowRight size={15} /></button></div>}{selected.filter((id) => !adConnected.includes(id) || (adConnectionStates[id] ?? "ready") !== "ready").map((id) => <div className="analytics-capability" key={id}>{adNetworks.find((item) => item.id === id)?.name} needs account access. <button className="inline-link" onClick={() => toggleNetwork(id)}>Remove network</button></div>)}{selectedNetworks.map((network) => <div className="network-configuration" key={network.id}><div><NetworkMark id={network.id} /><strong>{network.name}</strong></div><p className="field-hint">Adapt this brief to the account. Actual targeting options require the platform API.</p><div className="form-grid"><label>Audience for {network.name}<input value={networkAudience[network.id] ?? audience} onChange={(event) => setNetworkAudience((current) => ({ ...current, [network.id]: event.target.value }))} /></label><label>Location for {network.name}<input value={networkLocation[network.id] ?? location} onChange={(event) => setNetworkLocation((current) => ({ ...current, [network.id]: event.target.value }))} /></label></div><label className="channel-extra-label">Ad copy for {network.name}<textarea value={networkCreative[network.id] ?? creative} onChange={(event) => setNetworkCreative((current) => ({ ...current, [network.id]: event.target.value }))} /></label><span className="form-label">PLACEMENTS</span><div className="placement-list">{network.placements.map((placement) => <label key={placement}><input type="checkbox" checked={placements[network.id]?.includes(placement) ?? false} onChange={() => togglePlacement(network.id, placement)} />{placement}</label>)}</div><label className="budget-label">Daily budget ({currency})<input type="number" min="1" step="0.01" value={budgets[network.id] ?? ""} onChange={(event) => setBudgets((current) => ({ ...current, [network.id]: event.target.value === "" ? undefined : Number(event.target.value) }))} placeholder="25.00" /></label><div className="network-media-field"><strong>Creative for {network.name}</strong><p>{(networkMedia[network.id] ?? media)?.name ?? "No asset selected"} · {(networkMedia[network.id] ?? media)?.kind ?? "Add a shared or network asset"}</p><label className="media-add">Use a different asset<input type="file" accept="image/jpeg,image/png,video/*" onChange={(event) => addNetworkMedia(network.id, event)} /></label>{networkMedia[network.id] && <button className="inline-link" onClick={() => setNetworkMedia((current) => { const next = { ...current }; delete next[network.id]; return next; })}>Use shared asset</button>}</div><div className="form-grid network-schedule-fields"><label>Start for {network.name}<input type="datetime-local" value={networkStartAt[network.id] ?? startAt} onChange={(event) => setNetworkStartAt((current) => ({ ...current, [network.id]: event.target.value }))} /></label><label>End for {network.name}<input type="datetime-local" value={networkEndAt[network.id] ?? endAt} onChange={(event) => setNetworkEndAt((current) => ({ ...current, [network.id]: event.target.value }))} /></label></div><button className="inline-link" onClick={() => { setNetworkStartAt((current) => { const next = { ...current }; delete next[network.id]; return next; }); setNetworkEndAt((current) => { const next = { ...current }; delete next[network.id]; return next; }); }}>Use shared dates</button></div>)}</section>
    <section className="panel-card padded"><span className="eyebrow">04 / THE CREATIVE</span><h3>Give it the right words.</h3>{posts.length > 0 && <label className="source-post-label">Start from a post<select value={sourcePost} onChange={(event) => usePost(event.target.value)}><option value="">Write new creative</option>{posts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}</select></label>}<label className="form-label" htmlFor="ad-copy">AD COPY</label><textarea id="ad-copy" className="ad-copy-field" value={creative} onChange={(event) => setCreative(event.target.value)} placeholder="Write a clear message for your audience…" /><div className="media-section"><div><strong>Creative asset</strong><span>Image or video; TikTok requires video in this demo.</span></div><label className="media-add">Add media<input type="file" accept="image/jpeg,image/png,video/*" onChange={addMedia} /></label></div><div className="sample-assets"><span>OR TRY A SAMPLE</span><button onClick={() => useSampleAsset("image")}>Sample image</button><button onClick={() => useSampleAsset("video")}>Sample video concept</button></div>{media && <div className="media-item ad-media-item">{media.kind === "image" || media.url.endsWith(".svg") ? <img src={media.url} alt={media.name} /> : <video src={media.url} muted />}<div><strong>{media.name}</strong><small>{media.kind === "video" && media.url.endsWith(".svg") ? "video concept · no playback" : media.kind}</small></div><button className="inline-link" onClick={() => { if (media.url.startsWith("blob:")) URL.revokeObjectURL(media.url); setMedia(null); }}>Remove</button></div>}</section>
    <section className="panel-card padded"><span className="eyebrow">05 / THE TIMING</span><h3>Choose the window.</h3><div className="form-grid"><label>Start date & time<input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label>End date & time<input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label></div><div className="time-note"><Clock3 size={15} /> Dates use your device timezone: {timezone}. Network review can affect actual delivery.</div></section>
    {error && <div className="form-error" role="alert"><AlertCircle size={17} />{error}</div>}<div className="builder-actions"><button className="button button-outline" onClick={saveDraft}>Save draft</button><button className="button button-primary" onClick={review}>Review campaign <ArrowRight size={17} /></button></div>
  </div><aside className="builder-sidebar"><div className="panel-card padded sticky-summary"><span className="eyebrow">CAMPAIGN AT A GLANCE</span><h3>{name || "Untitled campaign"}</h3><div className="summary-line"><span>Networks</span><strong>{selected.length}</strong></div><div className="summary-line"><span>Daily budget</span><strong>{currency} {totalDaily.toFixed(2)}</strong></div><div className="summary-line"><span>Objective</span><strong>{objectives.find((item) => item.id === objective)?.title}</strong></div><div className="summary-line"><span>Run window</span><strong>{startAt && endAt ? `${new Date(startAt).toLocaleDateString()} – ${new Date(endAt).toLocaleDateString()}` : "Choose dates"}</strong></div><label className="currency-select">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="CAD">CAD</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label><p>Budget values are planning inputs only. No ad spend occurs in this demo.</p></div></aside></div></div>;
}

function isValidUrl(value: string) { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
