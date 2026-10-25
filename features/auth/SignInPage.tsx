"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useDemoStore } from "../demo/store";
import { Brand } from "../shell/Brand";
import { ThemeToggle } from "../shell/ThemeToggle";

export function SignInPage() {
  const router = useRouter();
  const signIn = useDemoStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    signIn(email.trim());
    router.push("/demo");
  }
  return <main className="auth-page"><div className="auth-main"><header className="auth-header"><Brand /><ThemeToggle label={false} /></header><Link className="back-link" href="/"><ArrowLeft size={16} /> Back to home</Link><div className="auth-content"><span className="eyebrow">WELCOME TO SPREADNOTES</span><h1>A clearer place<br />to <em>begin.</em></h1><p>Enter an email to explore the interactive product demo. You can shape posts, plan ads, and see the whole journey.</p><form onSubmit={submit} className="auth-form"><label htmlFor="email">Your email address</label><div className="input-icon"><Mail size={18} /><input id="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div><button className="button button-primary" type="submit">Continue to demo <ArrowRight size={17} /></button></form><div className="auth-disclaimer"><LockKeyhole size={16} /><span>Demo only. No email is sent or stored, and no social account is connected.</span></div></div></div><aside className="auth-aside"><div className="auth-aside-inner"><div className="auth-quote-mark">“</div><blockquote>Good ideas travel further when you have room to shape them.</blockquote><span className="tiny-label">CREATE WITH INTENTION · SHARE WITH CLARITY</span><div className="auth-aside-lines"><i /><i /><i /></div></div></aside></main>;
}
