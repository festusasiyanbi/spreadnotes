"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronRight, Layers3, Megaphone, Moon, PenLine, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "../shell/Brand";
import { ThemeToggle } from "../shell/ThemeToggle";
import { NetworkMark } from "../platforms/NetworkMark";

export function LandingPage() {
  return <div className="marketing-page">
    <header className="marketing-header"><div className="marketing-container header-inner">
      <Brand />
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#channels">Channels</a><a href="#ads">Ads workspace</a></nav>
      <div className="header-actions"><ThemeToggle label={false} /><Link className="text-action" href="/sign-in">Sign in</Link><Link className="button button-dark small" href="/sign-in">Explore the demo <ArrowRight size={15} /></Link></div>
    </div></header>
    <main>
      <section className="hero marketing-container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A BETTER WAY TO SHOW UP</div>
          <h1>Make room for the <em>good ideas.</em></h1>
          <p className="hero-description">One considered space to shape your content, tailor it for every channel, and plan what goes live next. Posts and paid campaigns, brought into focus.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/sign-in">Explore the interactive demo <ArrowRight size={17} /></Link><a className="underline-link" href="#how-it-works">See how it works <ChevronRight size={17} /></a></div>
          <div className="hero-footnote"><span className="dot" /> FRONTEND DEMO · NO ACCOUNT OR PAYMENT REQUIRED</div>
        </div>
        <div className="hero-visual" aria-label="Illustration of the SpreadNotes publishing workspace">
          <div className="hero-visual-heading"><span className="tiny-label">YOUR PUBLISHING DESK</span><span className="hero-visual-date">A calmer way to create ↗</span></div>
          <div className="hero-art-text">A thought worth sharing<br /><em>deserves a little space.</em></div>
          <div className="hero-art-bottom"><span>01 / 03</span><div className="hero-art-dots"><i /><i /><i /></div></div>
          <div className="hero-floating-card"><div className="floating-icon"><Layers3 size={19} /></div><div><strong>One idea, many places</strong><small>Tailor each version with care</small></div><Check size={17} /></div>
        </div>
      </section>
      <div className="marquee-line"><div className="marketing-container"><span>CREATE</span><i>✳</i><span>ADAPT</span><i>✳</i><span>SCHEDULE</span><i>✳</i><span>SHOW UP</span></div></div>
      <section id="how-it-works" className="marketing-section marketing-container">
        <div className="section-heading"><div><span className="eyebrow">THE WORKFLOW</span><h2>Less tab-hopping.<br /><em>More momentum.</em></h2></div><p>Move an idea from the first sentence to its next destination without losing the thread.</p></div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-number">01</span><div className="feature-icon"><PenLine size={25} /></div><h3>Write once, shape for each.</h3><p>Start with a master post, then fine-tune the words and media for the channels you choose.</p><span className="feature-rule" /></article>
          <article className="feature-card"><span className="feature-number">02</span><div className="feature-icon"><CalendarDays size={25} /></div><h3>See what comes next.</h3><p>Put drafts and scheduled content into a clear calendar. Know what is ready and what needs attention.</p><span className="feature-rule" /></article>
          <article className="feature-card"><span className="feature-number">03</span><div className="feature-icon"><Megaphone size={25} /></div><h3>Plan your paid reach.</h3><p>Prepare campaigns with budgets, dates, and platform-specific creative in a dedicated Ads workspace.</p><span className="feature-rule" /></article>
        </div>
      </section>
      <section id="channels" className="channels-section"><div className="marketing-container channels-inner"><div><span className="eyebrow">THE CHANNELS</span><h2>One home for your<br /><em>many voices.</em></h2><p>Explore a post across seven social channels. Each version can have its own wording and a clear preview before it goes anywhere.</p><Link className="underline-link" href="/sign-in">Try the composer <ArrowRight size={16} /></Link></div><div className="channel-board">
        {(["linkedin", "instagram", "facebook", "threads", "x", "tiktok", "youtube"] as const).map((id) => <div key={id} className="channel-tile"><NetworkMark id={id} size="large" /><span>{{ linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook", threads: "Threads", x: "X", tiktok: "TikTok", youtube: "YouTube" }[id]}</span></div>)}
      </div></div></section>
      <section id="ads" className="ads-section marketing-container"><div className="ads-art"><div className="ads-art-orbit one" /><div className="ads-art-orbit two" /><span className="tiny-label">PAID CAMPAIGNS · A CLEARER VIEW</span><div className="ads-art-card"><div className="ads-card-top"><span>CAMPAIGN OVERVIEW</span><Megaphone size={18} /></div><h3>Launch with intention.</h3><div className="ads-card-progress"><i /></div><div className="ads-card-footer"><span>Meta Ads</span><span>LinkedIn Ads</span><span>TikTok Ads</span></div></div></div><div className="ads-copy"><span className="eyebrow">BEYOND ORGANIC</span><h2>Content and campaigns, <em>in one place.</em></h2><p>Build a separate plan for paid reach. Choose your ad accounts, set budgets and run dates per network, then follow each campaign through review and delivery.</p><div className="ads-note"><ShieldCheck size={18} /><span>Ad spend stays with the connected advertising platforms. The demo never submits or charges for an ad.</span></div><Link className="button button-outline" href="/sign-in">Explore the Ads workspace <ArrowRight size={16} /></Link></div></section>
      <section className="marketing-cta"><div className="marketing-container"><div><span className="eyebrow">YOUR NEXT IDEA IS WAITING</span><h2>A little more clarity.<br /><em>A lot more possibility.</em></h2></div><Link className="button button-light" href="/sign-in">Open the demo <ArrowRight size={17} /></Link></div></section>
    </main>
    <footer className="marketing-footer marketing-container"><Brand compact /><span>© {new Date().getFullYear()} SpreadNotes · A separate product in the making.</span><Link href="/sign-in">Interactive demo <ArrowRight size={15} /></Link></footer>
  </div>;
}
