"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Layers3, PenLine, Search, Trash2 } from "lucide-react";
import { useDemoStore } from "../demo/store";
import type { AppView } from "../shell/AppShell";
import { PostDetail } from "./PostDetail";

const filters = ["All posts", "Drafts", "Scheduled", "Published", "Needs attention"] as const;
export function PostsLibrary({ postId, onEditPost, onNavigate, onNotice }: { postId: string | null; onEditPost: (id: string) => void; onNavigate: (view: AppView) => void; onNotice: (message: string) => void }) {
  const posts = useDemoStore((state) => state.posts);
  const remove = useDemoStore((state) => state.removePost);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All posts");
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(postId);
  useEffect(() => { setDetailId(postId); }, [postId]);
  const detail = posts.find((post) => post.id === detailId);
  const filtered = posts.filter((post) => {
    const match = filter === "All posts" || (filter === "Drafts" && post.status === "draft") || (filter === "Scheduled" && post.status === "scheduled") || (filter === "Published" && post.status === "published") || (filter === "Needs attention" && ["failed", "partial", "handoff"].includes(post.status));
    return match && `${post.title} ${post.text}`.toLowerCase().includes(query.toLowerCase());
  });

  if (detail) return <PostDetail post={detail} onBack={() => setDetailId(null)} onEdit={onEditPost} onNotice={onNotice} />;
  return <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">YOUR WORDS, IN ONE PLACE</span><h3>Post library</h3></div><span className="count-chip">{posts.length} total</span></div><div className="library-toolbar"><div className="filter-row">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="search-field"><Search size={16} /><input aria-label="Search posts" placeholder="Search posts" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>{filtered.length ? <div className="library-list">{filtered.map((post) => <article className="library-item" key={post.id}><button className="library-main" onClick={() => setDetailId(post.id)}><span className="row-icon"><PenLine size={19} /></span><span><strong>{post.title}</strong><small>{post.text.slice(0, 112)}{post.text.length > 112 ? "…" : ""}</small><em>{post.channels.length} channel{post.channels.length === 1 ? "" : "s"} · {new Date(post.createdAt).toLocaleDateString()}</em></span></button><span className={`status-pill status-${post.status}`}>{post.status}</span><button className="icon-only" aria-label={`Delete ${post.title}`} onClick={() => { remove(post.id); onNotice("Post removed from this demo."); }}><Trash2 size={16} /></button><button className="icon-only" aria-label={`Open ${post.title}`} onClick={() => setDetailId(post.id)}><ArrowRight size={17} /></button></article>)}</div> : <div className="empty-panel"><div className="empty-panel-icon"><Layers3 size={24} /></div><h4>{posts.length === 0 ? "A library ready for ideas." : "No posts match this view."}</h4><p>{posts.length === 0 ? "Create a post and it will show up here." : "Try another filter or search term."}</p><button className="button button-outline" onClick={() => posts.length ? (setFilter("All posts"), setQuery("")) : onNavigate("compose")}>{posts.length ? "Clear filters" : "Create a post"} <ArrowRight size={15} /></button></div>}</section>;
}
