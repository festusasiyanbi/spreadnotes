"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Layers3, PenLine, Search, Trash2 } from "lucide-react";
import { useSimulationStore } from "../simulation/store";
import type { AppView } from "../shell/app-shell";
import { PostDetail } from "./post-detail";
import { platforms } from "../platforms/catalog";
import type { PlatformId } from "../platforms/types";

const filters = ["All posts", "Drafts", "Needs approval", "Scheduled", "Published", "Needs attention"] as const;
export function PostsLibrary({ postId, onEditPost, onNavigate, onNotice }: { postId: string | null; onEditPost: (id: string) => void; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const posts = useSimulationStore((state) => state.posts);
  const remove = useSimulationStore((state) => state.removePost);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All posts");
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<PlatformId | "all">("all");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [detailId, setDetailId] = useState<string | null>(postId);
  useEffect(() => { setDetailId(postId); }, [postId]);
  const detail = posts.find((post) => post.id === detailId);
  const filtered = posts.filter((post) => {
    const match = filter === "All posts" || (filter === "Drafts" && post.status === "draft") || (filter === "Needs approval" && post.status === "needs_approval") || (filter === "Scheduled" && post.status === "scheduled") || (filter === "Published" && post.status === "published") || (filter === "Needs attention" && ["failed", "partial"].includes(post.status));
    return match && (channel === "all" || post.channels.includes(channel)) && (!after || post.createdAt.slice(0, 10) >= after) && (!before || post.createdAt.slice(0, 10) <= before) && `${post.title} ${post.text}`.toLowerCase().includes(query.toLowerCase());
  });

  if (detail) return <PostDetail post={detail} onBack={() => setDetailId(null)} onEdit={onEditPost} onAnalytics={() => onNavigate("analytics")} onNotice={onNotice} />;
  return <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">YOUR WORDS, IN ONE PLACE</span><h3>Post library</h3></div><span className="count-chip">{posts.length} total</span></div><div className="library-toolbar"><div className="filter-row">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="search-field"><Search size={16} /><input aria-label="Search posts" placeholder="Search posts" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div><div className="library-extra-filters"><label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}><option value="all">All channels</option>{platforms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>From<input type="date" value={after} onChange={(event) => setAfter(event.target.value)} /></label><label>To<input type="date" value={before} onChange={(event) => setBefore(event.target.value)} /></label></div>{filtered.length ? <div className="library-list">{filtered.map((post) => <article className="library-item" key={post.id}><button className="library-main" onClick={() => setDetailId(post.id)}><span className="row-icon"><PenLine size={19} /></span><span><strong>{post.title}</strong><small>{post.text.slice(0, 112)}{post.text.length > 112 ? "…" : ""}</small><em>{post.channels.length} channel{post.channels.length === 1 ? "" : "s"} · {new Date(post.createdAt).toLocaleDateString()}</em></span></button><span className={`status-pill status-${post.status}`}>{post.status.replaceAll("_", " ")}</span><button className="icon-only" aria-label={`Delete ${post.title}`} onClick={() => { remove(post.id); onNotice("Post removed from this simulation."); }}><Trash2 size={16} /></button><button className="icon-only" aria-label={`Open ${post.title}`} onClick={() => setDetailId(post.id)}><ArrowRight size={17} /></button></article>)}</div> : <div className="empty-panel"><div className="empty-panel-icon"><Layers3 size={24} /></div><h4>{posts.length === 0 ? "A library ready for ideas." : "No posts match this view."}</h4><p>{posts.length === 0 ? "Create a post and it will show up here." : "Try another filter or search term."}</p><button className="button button-outline" onClick={() => posts.length ? (setFilter("All posts"), setQuery(""), setChannel("all"), setAfter(""), setBefore("")) : onNavigate("compose")}>{posts.length ? "Clear filters" : "Create a post"} <ArrowRight size={15} /></button></div>}</section>;
}
