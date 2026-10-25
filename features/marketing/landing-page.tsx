"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChartNoAxesCombined, Megaphone, PenLine } from "lucide-react";
import { Brand } from "../shell/brand";
import { ThemeToggle } from "../shell/theme-toggle";
import { NetworkMark } from "../platforms/network-mark";

const workspaceHref = process.env.NEXT_PUBLIC_APP_ORIGIN ? `${process.env.NEXT_PUBLIC_APP_ORIGIN.replace(/\/$/, "")}/sign-in` : "/sign-in";

const channels = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "threads", name: "Threads" },
  { id: "x", name: "X" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
] as const;

const steps = [
  { number: "01", icon: PenLine, title: "Create your post", description: "Write one starting draft, add media, and tailor the copy for each destination." },
  { number: "02", icon: CalendarDays, title: "Plan what goes live", description: "Review each version, then keep scheduled posts visible in your queue and calendar." },
  { number: "03", icon: ChartNoAxesCombined, title: "Understand the results", description: "Explore post and campaign reporting with clear, platform-specific metrics." },
];

function ProductPreview() {
  return <div className="landing-preview" role="img" aria-label="Illustrative SpreadNotes workspace showing upcoming scheduled posts and channel-specific editing">
    <div className="landing-preview-top"><span className="landing-preview-brand">SpreadNotes<span>.</span></span><span>Workspace preview</span></div>
    <div className="landing-preview-body">
      <div className="landing-preview-sidebar" aria-hidden="true"><span className="selected">Overview</span><span>Compose</span><span>Queue</span><span>Calendar</span><span>Analytics</span></div>
      <div className="landing-preview-content">
        <div className="landing-preview-heading"><div><small>PUBLISHING WORKSPACE</small><strong>Good morning, Alex</strong><span>Everything in one clear view.</span></div><span className="landing-preview-create">+ New post</span></div>
        <div className="landing-preview-columns">
          <div className="landing-preview-panel"><div className="landing-preview-panel-title"><span>Upcoming posts</span><span>View queue →</span></div><div className="landing-preview-post"><span className="landing-preview-date">MON<br /><strong>27</strong></span><div><strong>Behind the next big idea</strong><small>9:00 AM · LinkedIn, Instagram</small></div><span className="landing-preview-status">Scheduled</span></div><div className="landing-preview-post"><span className="landing-preview-date">WED<br /><strong>29</strong></span><div><strong>A note from the studio</strong><small>11:30 AM · Threads, Facebook</small></div><span className="landing-preview-status">Scheduled</span></div></div>
          <div className="landing-preview-panel landing-preview-note"><span>One idea, every channel</span><p>Write once. Make each version feel right where it appears.</p><div className="landing-preview-networks"><NetworkMark id="linkedin" /><NetworkMark id="instagram" /><NetworkMark id="threads" /></div></div>
        </div>
      </div>
    </div>
  </div>;
}

export function LandingPage() {
  return <div className="marketing-page">
    <header className="marketing-header"><div className="marketing-container header-inner">
      <Brand />
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#channels">Channels</a><a href="#ads-reporting">Ads & reporting</a></nav>
      <div className="header-actions"><ThemeToggle label={false} /><Link className="marketing-sign-in" href={workspaceHref}>Sign in</Link><Link className="button button-primary small" href="/request-demo"><span className="landing-header-cta-long">Request a demo</span><span className="landing-header-cta-short">Request demo</span><ArrowRight size={15} /></Link></div>
    </div></header>
    <main>
      <section className="landing-hero marketing-container">
        <div className="landing-hero-copy"><span className="landing-kicker">YOUR SOCIAL PUBLISHING WORKSPACE</span><h1>One place to plan what you share.</h1><p>Draft posts, tailor them for each channel, and see what is coming next. Bring paid campaigns and reporting into the same clear workflow.</p><Link className="button button-primary" href={workspaceHref}>Open the workspace <ArrowRight size={17} /></Link><span className="landing-simulation-note">Simulation · No account or payment required</span></div>
        <ProductPreview />
      </section>
      <section id="how-it-works" className="landing-section marketing-container"><div className="landing-section-heading"><span className="landing-kicker">HOW IT WORKS</span><h2>From idea to insight.</h2><p>The tools you need to plan thoughtfully, without losing track of the details.</p></div><div className="landing-steps">{steps.map(({ number, icon: Icon, title, description }) => <article key={number} className="landing-step"><div className="landing-step-top"><span>{number}</span><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section id="channels" className="landing-channels"><div className="marketing-container"><div className="landing-section-heading"><span className="landing-kicker">CHANNELS</span><h2>Make every version count.</h2><p>Preview and adapt posts for each social channel before scheduling them.</p></div><div className="landing-channel-list">{channels.map(({ id, name }) => <div key={id} className="landing-channel"><NetworkMark id={id} /><span>{name}</span></div>)}</div></div></section>
      <section id="ads-reporting" className="landing-section marketing-container"><div className="landing-section-heading"><span className="landing-kicker">MORE THAN PUBLISHING</span><h2>Plan the full picture.</h2><p>Keep organic content and paid work distinct, with a clear view of both.</p></div><div className="landing-more-grid"><article><Megaphone size={24} strokeWidth={1.7} aria-hidden="true" /><h3>Ads workspace</h3><p>Prepare website traffic campaigns for Meta, LinkedIn, and TikTok with network-specific creative, budgets, and dates.</p><span><Check size={15} /> Review each network before submission</span></article><article><ChartNoAxesCombined size={24} strokeWidth={1.7} aria-hidden="true" /><h3>Reporting</h3><p>Examine post and campaign results by platform, using only metrics that each connection can provide.</p><span><Check size={15} /> Organic and paid views stay separate</span></article></div><p className="landing-simulation-disclosure">The current workspace simulates publishing, ad delivery, and analytics. It does not connect accounts, publish posts, or spend money.</p></section>
      <section className="landing-cta"><div className="marketing-container"><div><h2>See how it all comes together.</h2><p>Explore the SpreadNotes workflow in a guided conversation.</p></div><Link className="button button-primary" href="/request-demo">Request a demo <ArrowRight size={17} /></Link></div></section>
    </main>
    <footer className="marketing-footer marketing-container"><Brand compact /><span>© {new Date().getFullYear()} SpreadNotes</span><Link href="/request-demo">Request a demo <ArrowRight size={15} /></Link></footer>
  </div>;
}
