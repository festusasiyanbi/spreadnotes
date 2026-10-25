"use client";

import { Check, ExternalLink, Link2, Megaphone } from "lucide-react";
import { useDemoStore } from "../demo/store";
import { adNetworks, platforms } from "../platforms/catalog";
import { NetworkMark } from "../platforms/NetworkMark";

export function Connections() {
  const { connected, adConnected, toggleConnection, toggleAdConnection } = useDemoStore();
  return <div className="stack-gap">
    <div className="info-callout"><Link2 size={20} /><div><strong>Demo connections only</strong><p>These switches simulate account access for the current visit. No external sign-in or permissions are requested.</p></div></div>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">ORGANIC PUBLISHING</span><h3>Social channels</h3><p>Choose the destinations you want available in the composer.</p></div><span className="count-chip">{connected.length} selected</span></div><div className="account-grid">{platforms.map((platform) => <div className="account-card" key={platform.id}><NetworkMark id={platform.id} size="large" /><div className="account-card-copy"><strong>{platform.name}</strong><small>{platform.postingMode === "manual" ? "Manual handoff in demo" : "Simulated direct publishing"}</small></div><button type="button" className={`connect-button ${connected.includes(platform.id) ? "connected" : ""}`} onClick={() => toggleConnection(platform.id)}>{connected.includes(platform.id) ? <><Check size={14} /> Selected</> : "Select"}</button></div>)}</div></section>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">PAID CAMPAIGNS</span><h3>Advertising accounts</h3><p>Ad campaigns are built separately from organic posts.</p></div><span className="count-chip">{adConnected.length} selected</span></div><div className="account-grid">{adNetworks.map((network) => <div className="account-card" key={network.id}><NetworkMark id={network.id} size="large" /><div className="account-card-copy"><strong>{network.name}</strong><small>{network.description}</small></div><button type="button" className={`connect-button ${adConnected.includes(network.id) ? "connected" : ""}`} onClick={() => toggleAdConnection(network.id)}>{adConnected.includes(network.id) ? <><Check size={14} /> Selected</> : "Select"}</button></div>)}</div></section>
  </div>;
}
