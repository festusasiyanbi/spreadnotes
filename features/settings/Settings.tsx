"use client";

import { RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { useDemoStore } from "../demo/store";
import { ThemeToggle } from "../shell/ThemeToggle";

export function Settings({ onNotice }: { onNotice: (message: string) => void }) {
  const { email, displayName, workspaceName, setDisplayName, setWorkspaceName, reset } = useDemoStore();
  function resetDemo() { reset(); window.location.assign("/"); }
  return <div className="settings-layout"><section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">PROFILE & WORKSPACE</span><h3>The essentials</h3></div><UserRound size={20} /></div><div className="form-stack"><label>Display name<input value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Workspace name<input value={workspaceName} maxLength={60} onChange={(event) => setWorkspaceName(event.target.value)} /></label><label>Email address<input value={email} readOnly aria-describedby="demo-email-note" /></label><small id="demo-email-note" className="field-hint">Your email is only used to personalize this demo.</small></div><button className="button button-outline" onClick={() => onNotice("Demo preferences updated for this visit.")}>Done</button></section><div className="settings-side"><section className="panel-card padded"><span className="eyebrow">APPEARANCE</span><h3>Choose your light.</h3><p className="muted-copy">SpreadNotes follows your device preference when you open it. Switch themes for this visit.</p><ThemeToggle /></section><section className="panel-card padded"><span className="eyebrow">START FRESH</span><h3>Reset the demo.</h3><p className="muted-copy">Clear this visit’s simulated workspace, drafts, campaigns, and connections.</p><button className="button button-outline" onClick={resetDemo}><RotateCcw size={16} /> Reset demo</button></section><div className="soft-note"><ShieldCheck size={20} /><span>No backend is connected. Reloading also starts the demo again.</span></div></div></div>;
}
