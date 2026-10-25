"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, RotateCcw } from "lucide-react";
import { simulationId, type Post, useSimulationStore } from "../simulation/store";
import { formatMetric, organicMetrics, postSnapshot } from "../analytics/model";
import { platforms } from "../platforms/catalog";
import { NetworkMark } from "../platforms/network-mark";
import { MediaGallery } from "../previews/media-gallery";

export function PostDetail({ post, onBack, onEdit, onAnalytics, onNotice }: { post: Post; onBack: () => void; onEdit: (id: string) => void; onAnalytics: () => void; onNotice: (message: string) => void }) {
  const upsert = useSimulationStore((state) => state.upsertPost);
  const [reschedule, setReschedule] = useState("");
  const [error, setError] = useState("");
  function publishScheduled() {
    upsert({ ...post, status: "queued", channelStatus: Object.fromEntries(post.channels.map((id) => [id, "queued"])) });
    window.setTimeout(() => {
      const latest = useSimulationStore.getState().posts.find((item) => item.id === post.id);
      if (latest?.status === "queued") useSimulationStore.getState().upsertPost({ ...latest, status: "publishing", channelStatus: Object.fromEntries(latest.channels.map((id) => [id, "publishing"])) });
    }, 450);
    window.setTimeout(() => {
      const latest = useSimulationStore.getState().posts.find((item) => item.id === post.id);
      if (latest?.status !== "publishing") return;
      useSimulationStore.getState().upsertPost({ ...latest, status: "published", channelStatus: Object.fromEntries(latest.channels.map((id) => [id, "published"])), channelPublishedAt: Object.fromEntries(latest.channels.map((id) => [id, new Date().toISOString()])), youtubePrivacy: "public", scheduledAt: undefined });
    }, 1300);
    onNotice("Scheduled post is moving through the simulation queue.");
  }
  function retry(channel?: Post["channels"][number]) {
    const channelStatus = { ...post.channelStatus };
    for (const id of post.channels) if (channelStatus[id] === "failed" && (!channel || id === channel)) channelStatus[id] = "published";
    upsert({ ...post, channelStatus, channelPublishedAt: { ...post.channelPublishedAt, ...Object.fromEntries(post.channels.filter((id) => post.channelStatus[id] === "failed" && (!channel || id === channel)).map((id) => [id, new Date().toISOString()])) }, status: post.channels.every((id) => channelStatus[id] === "published") ? "published" : "partial", sampleMetricsReady: false });
    onNotice(channel ? `${platforms.find((item) => item.id === channel)?.name} retried in the simulation.` : "Failed simulation channels retried successfully.");
  }
  function duplicate(adapt = false) {
    const id = simulationId();
    upsert({ ...post, id, sourcePostId: post.id, title: `${adapt ? "Adapt" : "Copy"} of ${post.title}`, channels: adapt ? [] : post.channels, variants: adapt ? {} : post.variants, status: "draft", scheduledAt: undefined, channelPublishedAt: {}, sampleMetricsReady: false, sampleReportedAt: undefined, createdAt: new Date().toISOString(), channelStatus: adapt ? {} : Object.fromEntries(post.channels.map((channel) => [channel, "draft"])) as Post["channelStatus"] });
    onEdit(id);
  }
  function reschedulePost() {
    if (!reschedule || new Date(reschedule).getTime() <= Date.now()) { setError("Choose a future date and time."); return; }
    upsert({ ...post, scheduledAt: reschedule, status: "scheduled", channelStatus: Object.fromEntries(post.channels.map((id) => [id, "scheduled"])) as Post["channelStatus"] });
    setError("");
    onNotice("Post rescheduled in the simulation calendar.");
  }
  function revealMetrics() { upsert({ ...post, sampleMetricsReady: true, sampleReportedAt: new Date().toISOString() }); onNotice("Illustrative sample metrics added to Analytics."); }
  return <div className="post-detail">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> All posts</button>
    <div className="campaign-detail-heading"><div><span className="eyebrow">POST / {post.id.slice(0, 8).toUpperCase()}</span><h2>{post.title}</h2><p>Created {new Date(post.createdAt).toLocaleString()} · Simulation activity only</p></div><span className={`status-pill status-${post.status}`}>{post.status}</span></div>
    <div className="post-detail-grid"><section className="panel-card padded"><span className="eyebrow">THE MASTER MESSAGE</span><p className="detail-message">{post.text}</p>
      {post.media.length > 0 && <div className="detail-media"><MediaGallery media={post.media} label="Post" /></div>}
      {post.sourcePostId && <p className="field-hint">Adapted from an earlier SpreadNotes post.</p>}
      <div className="post-detail-actions">{["draft", "scheduled", "needs_approval"].includes(post.status) ? <button className="button button-outline" onClick={() => onEdit(post.id)}>Edit post <ArrowRight size={15} /></button> : <><button className="button button-outline" onClick={() => duplicate()}>Duplicate as draft <ArrowRight size={15} /></button><button className="button button-outline" onClick={() => duplicate(true)}>Adapt for another channel</button></>}{post.status === "needs_approval" && <button className="button button-primary" onClick={() => { upsert({ ...post, status: "draft", channelStatus: Object.fromEntries(post.channels.map((id) => [id, "draft"])) }); onNotice("Suggestion approved as a draft. Review it before scheduling."); }}>Approve as draft</button>}{post.status === "scheduled" && <button className="button button-primary" onClick={publishScheduled}>Run simulation publish <ArrowRight size={15} /></button>}{["failed", "partial"].includes(post.status) && <button className="button button-primary" onClick={() => retry()}><RotateCcw size={15} /> Retry failed</button>}{post.channels.some((id) => post.channelStatus[id] === "published") && <button className="button button-outline" onClick={post.sampleMetricsReady ? onAnalytics : revealMetrics}><BarChart3 size={16} /> {post.sampleMetricsReady ? "View analytics" : "Reveal sample metrics"}</button>}</div>
      {post.status === "scheduled" && <div className="reschedule-box"><span className="eyebrow">MOVE THE MOMENT</span><p>Currently scheduled for {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "a future date"}.</p><div><input type="datetime-local" value={reschedule} onChange={(event) => setReschedule(event.target.value)} aria-label="New schedule date and time" /><button className="button button-outline small" onClick={reschedulePost}>Reschedule</button></div>{error && <span className="error-text" role="alert">{error}</span>}</div>}
    </section><section className="panel-card padded"><span className="eyebrow">CHANNEL OUTCOMES</span><h3>One post, each destination.</h3><div className="channel-result-list">{post.channels.map((id) => {
      const platform = platforms.find((item) => item.id === id)!;
      const status = post.channelStatus[id] ?? "draft";
      const snapshot = postSnapshot(post, id);
      return <div className="channel-result" key={id}><div className="channel-result-top"><NetworkMark id={id} /><span><strong>{platform.name}</strong><small>Simulated direct path</small></span><span className={`status-pill status-${status}`}>{status.replaceAll("_", " ")}</span></div>{id === "youtube" && <p><strong>{post.youtubeTitle}</strong> · {post.youtubePrivacy === "private" ? "Private until scheduled publish" : "Public"}</p>}<p>{post.variants[id] ?? post.text}</p>{(post.mediaVariants?.[id] ?? post.media).length > 0 && <div className="detail-media"><MediaGallery media={post.mediaVariants?.[id] ?? post.media} label={`${platform.name} post`} /></div>}{status === "failed" && <button className="inline-link" onClick={() => retry(id)}><RotateCcw size={14} /> Retry {platform.name} only</button>}{status === "published" && <div className="analytics-inline"><strong>Organic analytics · sample</strong>{snapshot ? <div className="analytics-inline-metrics">{snapshot.metrics.map((metric) => <span key={metric.key}>{metric.label}: {formatMetric(metric)}</span>)}</div> : <p>{id === "tiktok" && !(post.mediaVariants?.[id] ?? post.media).some((item) => item.kind === "video") ? "Photo metrics are unavailable through this TikTok API path." : organicMetrics[id].note}</p>}</div>}</div>;
    })}</div></section></div>
  </div>;
}
