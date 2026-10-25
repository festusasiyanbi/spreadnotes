"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Megaphone, PenLine } from "lucide-react";
import { useDemoStore } from "../demo/store";
import type { AppView } from "../shell/AppShell";

export function CalendarView({ onOpenPost, onOpenCampaign, onNavigate }: { onOpenPost: (id: string) => void; onOpenCampaign: (id: string) => void; onNavigate: (view: AppView) => void }) {
  const { posts, campaigns } = useDemoStore();
  const [offset, setOffset] = useState(0);
  const date = new Date(); date.setMonth(date.getMonth() + offset);
  const year = date.getFullYear(), month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const events = [
    ...posts.filter((post) => post.scheduledAt).map((post) => ({ id: post.id, name: post.title, date: post.scheduledAt!, kind: "post" as const })),
    ...campaigns.filter((campaign) => campaign.startAt).map((campaign) => ({ id: campaign.id, name: campaign.name, date: campaign.startAt, kind: "ad" as const })),
  ];
  return <div className="calendar-page"><section className="panel-card padded"><div className="calendar-heading"><div><span className="eyebrow">CONTENT TIMELINE</span><h3>{date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3></div><div className="calendar-controls"><button className="icon-only bordered" onClick={() => setOffset(offset - 1)} aria-label="Previous month"><ArrowLeft size={17} /></button><button className="button button-outline small" onClick={() => setOffset(0)}>Today</button><button className="icon-only bordered" onClick={() => setOffset(offset + 1)} aria-label="Next month"><ArrowRight size={17} /></button></div></div><div className="calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <div key={label} className="calendar-weekday">{label}</div>)}{Array.from({ length: first }, (_, index) => <div className="calendar-day muted" key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const dayEvents = events.filter((event) => event.date.slice(0, 10) === dateKey); return <div className={`calendar-day ${new Date().toDateString() === new Date(year, month, day).toDateString() ? "today" : ""}`} key={day}><span>{day}</span>{dayEvents.map((event) => <button key={event.id} className={`calendar-event ${event.kind}`} onClick={() => event.kind === "post" ? onOpenPost(event.id) : onOpenCampaign(event.id)} title={event.name}>{event.kind === "post" ? <PenLine size={12} /> : <Megaphone size={12} />}{event.name}</button>)}</div>; })}</div></section><aside className="calendar-aside"><div className="panel-card padded"><span className="eyebrow">UPCOMING</span><h3>On the horizon</h3>{events.length ? <div className="mini-event-list">{events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((event) => <button key={event.id} onClick={() => event.kind === "post" ? onOpenPost(event.id) : onOpenCampaign(event.id)}><span className="row-icon">{event.kind === "post" ? <PenLine size={17} /> : <Megaphone size={17} />}</span><span><strong>{event.name}</strong><small>{new Date(event.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</small></span></button>)}</div> : <div className="empty-panel compact"><CalendarDays size={26} /><h4>A clean slate.</h4><p>Schedule a post or campaign to place it on the calendar.</p><button className="inline-link" onClick={() => onNavigate("compose")}>Create a post <ArrowRight size={15} /></button></div>}</div></aside></div>;
}
