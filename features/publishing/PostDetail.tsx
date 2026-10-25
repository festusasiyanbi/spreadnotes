"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Copy, RotateCcw } from "lucide-react";
import { demoId, type Post, useDemoStore } from "../demo/store";
import { platforms } from "../platforms/catalog";
import { NetworkMark } from "../platforms/NetworkMark";
import { MediaGallery } from "../previews/MediaGallery";

export function PostDetail({ post, onBack, onEdit, onNotice }: { post: Post; onBack: () => void; onEdit: (id: string) => void; onNotice: (message: string) => void }) {
  const upsert = useDemoStore((state) => state.upsertPost);
  const [reschedule, setReschedule] = useState("");
  const [error, setError] = useState("");
  function publishScheduled() {
    const channelStatus = Object.fromEntries(post.channels.map((id) => [id, platforms.find((platform) => platform.id === id)?.postingMode === "manual" ? "handoff" : "published"])) as Post["channelStatus"];
    upsert({ ...post, status: Object.values(channelStatus).includes("handoff") ? "handoff" : "published", channelStatus, scheduledAt: undefined });
    onNotice("Scheduled post advanced through the demo publish flow.");
  }
  function retry() {
    const channelStatus = { ...post.channelStatus };
    for (const id of post.channels) if (channelStatus[id] === "failed") channelStatus[id] = platforms.find((platform) => platform.id === id)?.postingMode === "manual" ? "handoff" : "published";
    upsert({ ...post, channelStatus, status: Object.values(channelStatus).includes("handoff") ? "handoff" : "published" });
    onNotice("Failed demo channels retried successfully.");
  }
  function duplicate() {
    const id = demoId();
    upsert({ ...post, id, title: `Copy of ${post.title}`, status: "draft", scheduledAt: undefined, createdAt: new Date().toISOString(), channelStatus: Object.fromEntries(post.channels.map((channel) => [channel, "draft"])) as Post["channelStatus"] });
    onEdit(id);
  }
  function reschedulePost() {
    if (!reschedule || new Date(reschedule).getTime() <= Date.now()) { setError("Choose a future date and time."); return; }
    upsert({ ...post, scheduledAt: reschedule, status: "scheduled", channelStatus: Object.fromEntries(post.channels.map((id) => [id, "scheduled"])) as Post["channelStatus"] });
    setError("");
    onNotice("Post rescheduled in the demo calendar.");
  }
  async function copyChannel(id: Post["channels"][number]) {
    try {
      await navigator.clipboard.writeText(post.variants[id] ?? post.text);
      onNotice(`${platforms.find((platform) => platform.id === id)?.name} version copied for manual handoff.`);
    } catch {
      onNotice("Clipboard access is unavailable in this browser.");
    }
  }
  return <div className="post-detail">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> All posts</button>
    <div className="campaign-detail-heading"><div><span className="eyebrow">POST / {post.id.slice(0, 8).toUpperCase()}</span><h2>{post.title}</h2><p>Created {new Date(post.createdAt).toLocaleString()} · Demo activity only</p></div><span className={`status-pill status-${post.status}`}>{post.status}</span></div>
    <div className="post-detail-grid"><section className="panel-card padded"><span className="eyebrow">THE MASTER MESSAGE</span><p className="detail-message">{post.text}</p>
      {post.media.length > 0 && <div className="detail-media"><MediaGallery media={post.media} label="Post" /></div>}
      <div className="post-detail-actions">{["draft", "scheduled"].includes(post.status) ? <button className="button button-outline" onClick={() => onEdit(post.id)}>Edit post <ArrowRight size={15} /></button> : <button className="button button-outline" onClick={duplicate}>Duplicate as draft <ArrowRight size={15} /></button>}{post.status === "scheduled" && <button className="button button-primary" onClick={publishScheduled}>Run demo publish <ArrowRight size={15} /></button>}{["failed", "partial"].includes(post.status) && <button className="button button-primary" onClick={retry}><RotateCcw size={15} /> Retry failed</button>}</div>
      {post.status === "scheduled" && <div className="reschedule-box"><span className="eyebrow">MOVE THE MOMENT</span><p>Currently scheduled for {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "a future date"}.</p><div><input type="datetime-local" value={reschedule} onChange={(event) => setReschedule(event.target.value)} aria-label="New schedule date and time" /><button className="button button-outline small" onClick={reschedulePost}>Reschedule</button></div>{error && <span className="error-text" role="alert">{error}</span>}</div>}
    </section><section className="panel-card padded"><span className="eyebrow">CHANNEL OUTCOMES</span><h3>One post, each destination.</h3><div className="channel-result-list">{post.channels.map((id) => {
      const platform = platforms.find((item) => item.id === id)!;
      const status = post.channelStatus[id] ?? "draft";
      return <div className="channel-result" key={id}><div className="channel-result-top"><NetworkMark id={id} /><span><strong>{platform.name}</strong><small>{platform.postingMode === "manual" ? "Manual handoff" : "Direct path in demo"}</small></span><span className={`status-pill status-${status}`}>{status}</span></div><p>{post.variants[id] ?? post.text}</p>{status === "handoff" && <button className="inline-link" onClick={() => copyChannel(id)}><Copy size={14} /> Copy {platform.name} version</button>}</div>;
    })}</div>{post.channels.some((id) => post.channelStatus[id] === "handoff") && <div className="handoff-note"><AlertCircle size={17} /><div><strong>Manual handoff ready</strong><p>Use the channel-specific copy above and complete posting in that platform. SpreadNotes cannot confirm an external post in this demo.</p></div></div>}</section></div>
  </div>;
}
