"use client";

import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, Check, ChevronDown, LayoutDashboard, Link2, Megaphone, Menu, PanelLeftClose, PanelLeftOpen, Pause, PenLine, Play, Plus, Settings2, Sparkles, Square, X, Layers3, Video } from "lucide-react";
import { useSimulationStore } from "../simulation/store";
import { useRecordingUiStore } from "../creator-hub/recording-ui-store";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export type AppView = "home" | "compose" | "ai" | "creator" | "calendar" | "library" | "ads" | "analytics" | "connections" | "settings";
const links: { id: AppView; name: string; icon: typeof PenLine; group: "main" | "workspace" }[] = [
  { id: "home", name: "Overview", icon: LayoutDashboard, group: "main" },
  { id: "compose", name: "Create post", icon: PenLine, group: "main" },
  { id: "ai", name: "SpreadNotes AI", icon: Sparkles, group: "main" },
  { id: "creator", name: "Creator Hub", icon: Video, group: "main" },
  { id: "calendar", name: "Calendar", icon: CalendarDays, group: "main" },
  { id: "library", name: "Post library", icon: Layers3, group: "main" },
  { id: "ads", name: "Ads workspace", icon: Megaphone, group: "main" },
  { id: "analytics", name: "Analytics", icon: BarChart3, group: "main" },
  { id: "connections", name: "Connections", icon: Link2, group: "workspace" },
  { id: "settings", name: "Settings", icon: Settings2, group: "workspace" },
];
const titles: Record<AppView, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: "YOUR WORKSPACE", title: "A clearer view of what’s next.", description: "Ideas in motion, all in one thoughtful place." },
  compose: { eyebrow: "PUBLISHING DESK", title: "Create a post.", description: "Write once, then make it right for every channel." },
  ai: { eyebrow: "WRITING STUDIO", title: "SpreadNotes AI.", description: "Create and rewrite text for posts and campaigns." },
  creator: { eyebrow: "CREATOR HUB", title: "Make a video.", description: "Record, trim, and save a video locally, then shape it for your channels." },
  calendar: { eyebrow: "YOUR CALENDAR", title: "The shape of your week.", description: "See what’s scheduled, and give each idea its moment." },
  library: { eyebrow: "POST LIBRARY", title: "Everything you’ve made.", description: "Find a draft, revisit a post, or pick up where you left off." },
  ads: { eyebrow: "PAID CAMPAIGNS", title: "Plan your reach.", description: "Build and follow campaigns across your ad accounts." },
  analytics: { eyebrow: "SAMPLE INSIGHTS", title: "See what resonates.", description: "Explore organic and paid performance with clearly labelled sample data." },
  connections: { eyebrow: "YOUR CHANNELS", title: "Connected accounts.", description: "Choose the social and ad accounts for your workspace." },
  settings: { eyebrow: "PREFERENCES", title: "Make it yours.", description: "Your workspace details and appearance in one place." },
};

export function AppShell({ view, onNavigate, children }: { view: AppView; onNavigate: (view: AppView) => void; children: React.ReactNode }) {
  const workspace = useSimulationStore((state) => state.workspaceName);
  const displayName = useSimulationStore((state) => state.displayName);
  const savedWorkspaces = useSimulationStore((state) => state.savedWorkspaces);
  const createWorkspace = useSimulationStore((state) => state.createWorkspace);
  const switchWorkspace = useSimulationStore((state) => state.switchWorkspace);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [addingWorkspace, setAddingWorkspace] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const recordingStatus = useRecordingUiStore((state) => state.status);
  const recordingElapsed = useRecordingUiStore((state) => state.elapsed);
  useEffect(() => { try { setCollapsed(window.localStorage.getItem("spreadnotes-sidebar-collapsed") === "true"); } catch { /* Keep the default. */ } }, []);
  const title = titles[view];
  function canLeave() { return window.dispatchEvent(new Event("spreadnotes:before-navigation", { cancelable: true })); }
  function canSwitchWorkspace() { return canLeave() && window.dispatchEvent(new Event("spreadnotes:before-workspace-switch", { cancelable: true })); }
  function go(next: AppView) { if (view !== next && !canLeave()) return; onNavigate(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function toggleSidebar() { setCollapsed((current) => { const next = !current; try { window.localStorage.setItem("spreadnotes-sidebar-collapsed", String(next)); } catch { /* Keep the in-memory choice. */ } return next; }); setWorkspaceOpen(false); }
  return <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={`app-sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Brand href="/" onClick={(event) => { event.preventDefault(); go("home"); }} /><button className="sidebar-collapse icon-only" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button><button className="mobile-close icon-only" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={21} /></button></div>
      <button className="workspace-card" aria-label={`${workspace} · switch workspace`} aria-expanded={workspaceOpen} onClick={() => { if (collapsed) setCollapsed(false); setWorkspaceOpen((value) => !value); }}><span className="workspace-avatar">{workspace.slice(0, 1).toUpperCase()}</span><span><strong>{workspace}</strong><small>Active workspace</small></span><ChevronDown size={15} /></button>
      {workspaceOpen && <div className="workspace-switcher"><strong>Workspaces</strong><button className="workspace-option current" onClick={() => setWorkspaceOpen(false)}><span>{workspace || "Your workspace"}</span><Check size={15} /></button>{Object.entries(savedWorkspaces).map(([id, item]) => <button key={id} className="workspace-option" onClick={() => { if (!canSwitchWorkspace()) return; switchWorkspace(id); setWorkspaceOpen(false); onNavigate("home"); }}>{item.workspaceName}</button>)}{addingWorkspace ? <form onSubmit={(event) => { event.preventDefault(); if (!workspaceDraft.trim() || !canSwitchWorkspace()) return; createWorkspace(workspaceDraft); setWorkspaceDraft(""); setAddingWorkspace(false); setWorkspaceOpen(false); onNavigate("home"); }}><label htmlFor="new-workspace-name">New workspace name</label><input id="new-workspace-name" autoFocus maxLength={60} required value={workspaceDraft} onChange={(event) => setWorkspaceDraft(event.target.value)} /><button className="button button-primary small" type="submit">Create workspace</button></form> : <button className="workspace-add" onClick={() => setAddingWorkspace(true)}><Plus size={16} /> Add workspace</button>}</div>}
      <div className="sidebar-group"><span className="sidebar-label">WORKSPACE</span>{links.filter((link) => link.group === "main").map((link) => <button key={link.id} className={`sidebar-link ${view === link.id ? "selected" : ""}`} aria-label={link.name} title={collapsed ? link.name : undefined} aria-current={view === link.id ? "page" : undefined} onClick={() => go(link.id)}><link.icon size={18} strokeWidth={1.8} /><span>{link.name}</span>{link.id === "ads" && <span className="nav-new">NEW</span>}</button>)}</div>
      <div className="sidebar-group"><span className="sidebar-label">MANAGE</span>{links.filter((link) => link.group === "workspace").map((link) => <button key={link.id} className={`sidebar-link ${view === link.id ? "selected" : ""}`} aria-label={link.name} title={collapsed ? link.name : undefined} aria-current={view === link.id ? "page" : undefined} onClick={() => go(link.id)}><link.icon size={18} strokeWidth={1.8} /><span>{link.name}</span></button>)}</div>
      <div className="sidebar-spacer" />
      <button className="sidebar-profile" aria-label={`${displayName} · settings`} onClick={() => go("settings")}><span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>Settings</small></span><ChevronDown size={15} /></button>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <div className="app-main">
      <header className="app-topbar"><button className="mobile-menu icon-only" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button><div className="app-breadcrumb"><span>{workspace}</span><span>/</span><strong>{view === "ads" ? "Ads workspace" : title.eyebrow.toLowerCase()}</strong></div><div className="topbar-actions"><ThemeToggle label={false} /><button className="topbar-avatar" onClick={() => go("settings")} aria-label="Open settings">{displayName.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="app-content"><div className="app-page-intro"><div><span className="eyebrow">{title.eyebrow}</span><h1>{title.title}</h1><p>{title.description}</p></div>{view !== "compose" && view !== "ads" && <button className="button button-primary intro-action" onClick={() => go("compose")}>New post <PenLine size={16} /></button>}</div>{children}</div>
    </div>
    {recordingStatus !== "idle" && view !== "creator" && <div className="recording-dock" role="status"><span className="recording-dot" aria-hidden="true" /><strong>{recordingStatus === "paused" ? "Paused" : "Recording"} · {Math.floor(recordingElapsed / 60)}:{String(recordingElapsed % 60).padStart(2, "0")}</strong><button type="button" onClick={() => go("creator")}>Open Creator Hub</button><button type="button" aria-label={recordingStatus === "paused" ? "Resume recording" : "Pause recording"} onClick={() => useRecordingUiStore.getState().togglePause()}>{recordingStatus === "paused" ? <Play size={17} /> : <Pause size={17} />}</button><button type="button" aria-label="Stop recording" onClick={() => useRecordingUiStore.getState().stop()}><Square size={16} /></button></div>}
  </div>;
}
