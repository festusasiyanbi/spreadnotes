"use client";

import { ArrowRight, Clock3 } from "lucide-react";
import type { Post } from "../demo/store";
import { NetworkMark } from "../platforms/NetworkMark";

export function Queue({ posts, onOpenPost }: { posts: Post[]; onOpenPost: (id: string) => void }) {
  const queued = posts.filter((post) => ["scheduled", "queued", "publishing"].includes(post.status) && post.scheduledAt).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  const grouped = Object.groupBy(queued, (post) => new Date(post.scheduledAt!).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }));
  return <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">CONFIRMED QUEUE</span><h3>What’s going out next</h3><p>Drafts and writing suggestions stay outside this queue.</p></div><span className="count-chip">{queued.length} posts</span></div>{queued.length ? <div className="queue-groups">{Object.entries(grouped).map(([day, items]) => <div key={day}><h4>{day}</h4>{items?.map((post) => <button className="queue-item" key={post.id} onClick={() => onOpenPost(post.id)}><span className="queue-time"><Clock3 size={15} />{new Date(post.scheduledAt!).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span><span className="queue-copy"><strong>{post.title}</strong><small>{post.channels.map((id) => <NetworkMark id={id} key={id} />)} {post.timezone ?? "Device timezone"}</small></span><span className={`status-pill status-${post.status}`}>{post.status}</span><ArrowRight size={17} /></button>)}</div>)}</div> : <div className="empty-panel compact"><h4>Nothing confirmed yet.</h4><p>Schedule a post to see exactly when and where it will go.</p></div>}</section>;
}
