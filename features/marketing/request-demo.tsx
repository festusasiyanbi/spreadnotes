"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Brand } from "../shell/brand";
import { ThemeToggle } from "../shell/theme-toggle";

export function RequestDemo() {
  const [preview, setPreview] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (event.currentTarget.reportValidity()) setPreview(true); }
  return <main className="request-page"><header><Brand /><div className="request-header-actions"><ThemeToggle label={false} /><Link href="/">Back to SpreadNotes</Link></div></header><section className="panel-card padded request-card"><span className="eyebrow">REQUEST A DEMO</span><h1>See how SpreadNotes could work for you.</h1><p>Tell us what you would like to explore. This is a form simulation while request delivery is being built.</p>{preview ? <div role="status" className="info-callout"><strong>Request preview complete. Your request was not sent.</strong><p>Please check back when request delivery is available.</p><button className="button button-outline" onClick={() => setPreview(false)}>Edit request</button></div> : <form className="form-stack" onSubmit={submit}><label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label><label>Work email<input name="email" required type="email" autoComplete="email" /></label><label>What would you like to see?<textarea name="interest" required maxLength={1000} rows={5} placeholder="Publishing, scheduling, ads, or something else…" /></label><button className="button button-primary" type="submit">Preview request</button></form>}</section></main>;
}
