"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useSimulationStore } from "../simulation/store";
import { Brand } from "../shell/brand";
import { ThemeToggle } from "../shell/theme-toggle";

type Method = "password" | "google" | "magic";

export function SignInPage() {
  const router = useRouter();
  const signIn = useSimulationStore((state) => state.signIn);
  const [method, setMethod] = useState<Method>("password");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicRequested, setMagicRequested] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (method === "magic") { setMagicRequested(true); return; }
    signIn(email.trim(), name.trim());
    setPassword("");
    router.push(window.location.hostname === "localhost" ? "/workspace" : "/");
  }

  return <main className="auth-page"><div className="auth-main"><header className="auth-header"><Brand /><ThemeToggle label={false} /></header><Link className="back-link" href="https://spreadnotes.app/"><ArrowLeft size={16} /> Back to home</Link><div className="auth-content"><span className="eyebrow">WELCOME TO SPREADNOTES</span><h1>A clearer place<br />to <em>begin.</em></h1><p>Choose how you would sign in. These paths show the planned experience; authentication is not connected yet.</p>
    <div className="auth-methods" role="group" aria-label="Sign-in method"><button type="button" className={method === "password" ? "active" : ""} aria-pressed={method === "password"} onClick={() => { setMethod("password"); setMagicRequested(false); }}>Email & password</button><button type="button" className={method === "google" ? "active" : ""} aria-pressed={method === "google"} onClick={() => { setMethod("google"); setMagicRequested(false); }}>Google</button><button type="button" className={method === "magic" ? "active" : ""} aria-pressed={method === "magic"} onClick={() => setMethod("magic")}>Magic link</button></div>
    {method === "magic" && magicRequested ? <div className="info-callout auth-magic-result" role="status"><Mail size={19} /><div><strong>Magic link request previewed. No link was sent.</strong><p>Email delivery will be available when authentication is connected.</p><button className="inline-link" onClick={() => setMagicRequested(false)}>Use a different email</button></div></div> : <form onSubmit={submit} className="auth-form">{method !== "magic" && <label>Your name<input type="text" autoComplete="name" required minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}<label>Your email address<div className="input-icon"><Mail size={18} /><input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>{method === "password" && <label>Password<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>}{method === "google" && <p className="auth-provider-note">Google account selection is simulated here. Enter a name and email to preview the signed-in workspace.</p>}<button className="button button-primary" type="submit">{method === "magic" ? "Preview magic link request" : method === "google" ? "Continue with Google simulation" : "Sign in to simulation"} <ArrowRight size={17} /></button></form>}
    <div className="auth-disclaimer"><LockKeyhole size={16} /><span>Simulation only. Passwords are not checked or stored; Google is not contacted; magic links are not sent. Your name and email live in browser memory until reload.</span></div></div></div><aside className="auth-aside"><div className="auth-aside-inner"><div className="auth-quote-mark">“</div><blockquote>Good ideas travel further when you have room to shape them.</blockquote><span className="tiny-label">CREATE WITH INTENTION · SHARE WITH CLARITY</span><div className="auth-aside-lines"><i /><i /><i /></div></div></aside></main>;
}
