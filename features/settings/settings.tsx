"use client";

import { useState } from "react";
import { Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useSimulationStore } from "../simulation/store";
import { Connections } from "../connections/connections";
import { ThemeToggle } from "../shell/theme-toggle";
import type { AppView } from "../shell/app-shell";

type Tab = "general" | "connections" | "publishing" | "schedule" | "writing" | "workspace";
const tabs: { id: Tab; name: string }[] = [
  { id: "general", name: "General" }, { id: "connections", name: "Connections" }, { id: "publishing", name: "Publishing" },
  { id: "schedule", name: "Schedule" }, { id: "writing", name: "Writing profile" }, { id: "workspace", name: "Workspace" },
];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function Settings({ onNotice, onNavigate }: { onNotice: (message: string) => void; onNavigate: (view: AppView) => void }) {
  const state = useSimulationStore();
  const { email, displayName, workspaceName, setDisplayName, setWorkspaceName, reset, weeklySlots, setWeeklySlots, timezone, setAiArea } = state;
  const [tab, setTab] = useState<Tab>("general");
  const [slotDay, setSlotDay] = useState(1);
  const [slotTime, setSlotTime] = useState("09:00");
  function resetSimulation() { reset(); window.location.assign("/"); }
  function addSlot() {
    if (weeklySlots.some((item) => item.day === slotDay && item.time === slotTime)) { onNotice("That weekly slot already exists."); return; }
    setWeeklySlots([...weeklySlots, { day: slotDay, time: slotTime }].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)));
    onNotice("Weekly slot added for this visit.");
  }
  return <div className="settings-page stack-gap"><nav className="settings-tabs" aria-label="Settings sections">{tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>{item.name}</button>)}</nav>
    {tab === "general" && <div className="settings-layout"><section className="panel-card padded"><span className="eyebrow">PROFILE</span><h3>The essentials</h3><div className="form-stack settings-form"><label>Display name<input value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Workspace name<input value={workspaceName} maxLength={60} onChange={(event) => setWorkspaceName(event.target.value)} /></label><label>Email address<input value={email} readOnly /></label><p className="field-hint">Your email is only used to personalize this simulation.</p></div><button className="button button-outline" onClick={() => onNotice("Simulation preferences updated for this visit.")}>Done</button></section><section className="panel-card padded"><span className="eyebrow">APPEARANCE</span><h3>Choose your light.</h3><p className="muted-copy">SpreadNotes follows your device preference when you open it. Switch themes for this visit.</p><ThemeToggle /></section></div>}
    {tab === "connections" && <Connections />}
    {tab === "publishing" && <section className="panel-card padded"><span className="eyebrow">PUBLISHING DEFAULTS</span><h3>Review each destination.</h3><p className="muted-copy">The master post never publishes automatically. Every channel version and media set is checked in the composer before you confirm a simulated schedule or publish.</p><div className="settings-guidance"><p><strong>Draft</strong> keeps work out of the queue.</p><p><strong>Needs approval</strong> remains available for suggestions created earlier in this visit.</p><p><strong>Partial failure</strong> lets you retry only failed channels.</p></div></section>}
    {tab === "schedule" && <section className="panel-card padded"><span className="eyebrow">WEEKLY PUBLISHING SLOTS</span><h3>Make room for your ideas.</h3><p className="muted-copy">Choose an exact date in the composer or use the next available weekly slot. The preview always shows the resolved time.</p><p className="analytics-capability">Timezone: {timezone} (this device). Simulation scheduling uses your device clock.</p><div className="slot-list">{weeklySlots.map((slot, index) => <div key={`${slot.day}-${slot.time}-${index}`}><strong>{days[slot.day]} · {slot.time}</strong><button className="icon-only" aria-label={`Remove ${days[slot.day]} ${slot.time}`} onClick={() => setWeeklySlots(weeklySlots.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button></div>)}</div><div className="slot-add"><label>Day<select value={slotDay} onChange={(event) => setSlotDay(Number(event.target.value))}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label>Time<input type="time" value={slotTime} onChange={(event) => setSlotTime(event.target.value)} /></label><button className="button button-outline" onClick={addSlot}><Plus size={16} /> Add slot</button></div></section>}
    {tab === "writing" && <section className="panel-card padded"><span className="eyebrow">WRITING PROFILE</span><h3>Your voice lives in SpreadNotes AI.</h3><p className="muted-copy">Set your topics, audience, preferred terms, and example posts in the writing studio.</p><button className="button button-primary" onClick={() => { setAiArea("voice"); onNavigate("ai"); }}>Open SpreadNotes AI</button></section>}
    {tab === "workspace" && <section className="panel-card padded"><span className="eyebrow">START FRESH</span><h3>Reset the simulation.</h3><p className="muted-copy">Clear this visit’s simulated workspace, drafts, campaigns, reports, and connections.</p><button className="button button-outline" onClick={resetSimulation}><RotateCcw size={16} /> Reset simulation</button><div className="soft-note"><ShieldCheck size={20} /><span>No backend is connected. Reloading also starts the simulation again.</span></div></section>}
  </div>;
}
