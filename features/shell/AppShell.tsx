"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronDown, CircleHelp, LayoutDashboard, Link2, Megaphone, Menu, PenLine, Settings2, X, Layers3 } from "lucide-react";
import { useDemoStore } from "../demo/store";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export type AppView = "home" | "compose" | "calendar" | "library" | "ads" | "connections" | "settings";
const links: { id: AppView; name: string; icon: typeof PenLine; group: "main" | "workspace" }[] = [
  { id: "home", name: "Overview", icon: LayoutDashboard, group: "main" },
  { id: "compose", name: "Create post", icon: PenLine, group: "main" },
  { id: "calendar", name: "Calendar", icon: CalendarDays, group: "main" },
  { id: "library", name: "Post library", icon: Layers3, group: "main" },
  { id: "ads", name: "Ads workspace", icon: Megaphone, group: "main" },
  { id: "connections", name: "Connections", icon: Link2, group: "workspace" },
  { id: "settings", name: "Settings", icon: Settings2, group: "workspace" },
];
const titles: Record<AppView, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: "YOUR WORKSPACE", title: "A clearer view of what’s next.", description: "Ideas in motion, all in one thoughtful place." },
  compose: { eyebrow: "PUBLISHING DESK", title: "Create a post.", description: "Write once, then make it right for every channel." },
  calendar: { eyebrow: "YOUR CALENDAR", title: "The shape of your week.", description: "See what’s scheduled, and give each idea its moment." },
  library: { eyebrow: "POST LIBRARY", title: "Everything you’ve made.", description: "Find a draft, revisit a post, or pick up where you left off." },
  ads: { eyebrow: "PAID CAMPAIGNS", title: "Plan your reach.", description: "Build and follow campaigns across your ad accounts." },
  connections: { eyebrow: "YOUR CHANNELS", title: "Connected accounts.", description: "Choose which social and ad accounts to use in the demo." },
  settings: { eyebrow: "PREFERENCES", title: "Make it yours.", description: "Your workspace details and appearance in one place." },
};

export function AppShell({ view, onNavigate, children }: { view: AppView; onNavigate: (view: AppView) => void; children: React.ReactNode }) {
  const workspace = useDemoStore((state) => state.workspaceName);
  const displayName = useDemoStore((state) => state.displayName);
  const [menuOpen, setMenuOpen] = useState(false);
  const title = titles[view];
  function go(next: AppView) { onNavigate(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  return <div className="app-layout">
    <aside className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Brand href="/demo" onClick={(event) => { event.preventDefault(); go("home"); }} /><button className="mobile-close icon-only" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={21} /></button></div>
      <button className="workspace-card" onClick={() => go("settings")}><span className="workspace-avatar">{workspace.slice(0, 1).toUpperCase()}</span><span><strong>{workspace}</strong><small>Personal workspace</small></span><ChevronDown size={15} /></button>
      <div className="sidebar-group"><span className="sidebar-label">WORKSPACE</span>{links.filter((link) => link.group === "main").map((link) => <button key={link.id} className={`sidebar-link ${view === link.id ? "selected" : ""}`} aria-current={view === link.id ? "page" : undefined} onClick={() => go(link.id)}><link.icon size={18} strokeWidth={1.8} /><span>{link.name}</span>{link.id === "ads" && <span className="nav-new">NEW</span>}</button>)}</div>
      <div className="sidebar-group"><span className="sidebar-label">MANAGE</span>{links.filter((link) => link.group === "workspace").map((link) => <button key={link.id} className={`sidebar-link ${view === link.id ? "selected" : ""}`} aria-current={view === link.id ? "page" : undefined} onClick={() => go(link.id)}><link.icon size={18} strokeWidth={1.8} /><span>{link.name}</span></button>)}</div>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><CircleHelp size={18} /><span>Interactive demo</span><ArrowUpRight size={14} /></div>
      <button className="sidebar-profile" onClick={() => go("settings")}><span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>Demo workspace</small></span><ChevronDown size={15} /></button>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <div className="app-main">
      <header className="app-topbar"><button className="mobile-menu icon-only" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button><div className="app-breadcrumb"><span>{workspace}</span><span>/</span><strong>{view === "ads" ? "Ads workspace" : title.eyebrow.toLowerCase()}</strong></div><div className="topbar-actions"><span className="demo-badge">DEMO MODE</span><ThemeToggle label={false} /><button className="topbar-avatar" onClick={() => go("settings")} aria-label="Open settings">{displayName.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="app-content"><div className="app-page-intro"><div><span className="eyebrow">{title.eyebrow}</span><h1>{title.title}</h1><p>{title.description}</p></div>{view !== "compose" && view !== "ads" && <button className="button button-primary intro-action" onClick={() => go("compose")}>New post <PenLine size={16} /></button>}</div>{children}</div>
    </div>
  </div>;
}
