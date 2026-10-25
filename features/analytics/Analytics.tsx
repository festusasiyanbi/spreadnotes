"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Info } from "lucide-react";
import { useSimulationStore } from "../simulation/store";
import { adNetworks, platforms } from "../platforms/catalog";
import type { AdNetworkId, PlatformId } from "../platforms/types";
import { NetworkMark } from "../platforms/network-mark";
import { adMetrics, campaignSnapshot, formatMetric, organicMetrics, postSnapshot, type Metric } from "./model";

type ReportRow = { key: string; title: string; channel: PlatformId | AdNetworkId; date: string; metrics: Metric[]; currency?: string; open: () => void };

export function Analytics({ onOpenPost, onOpenCampaign }: { onOpenPost: (id: string) => void; onOpenCampaign: (id: string) => void }) {
  const { posts, campaigns, connected, adConnected, connectionStates, adConnectionStates } = useSimulationStore();
  const [tab, setTab] = useState<"organic" | "ads">("organic");
  const [channel, setChannel] = useState("all");
  const [period, setPeriod] = useState<7 | 30>(7);
  const [showScenario, setShowScenario] = useState(true);
  const options = tab === "organic" ? platforms.filter((item) => connected.includes(item.id)) : adNetworks.filter((item) => adConnected.includes(item.id));
  const rows = useMemo<ReportRow[]>(() => {
    if (tab === "organic") return posts.flatMap((post) => post.channels.flatMap((id) => {
      if (channel !== "all" && id !== channel) return [];
      if (!connected.includes(id) || (connectionStates[id] ?? "ready") !== "ready") return [];
      const snapshot = postSnapshot(post, id);
      return snapshot ? [{ key: `${post.id}:${id}`, title: post.title, channel: id, date: snapshot.updatedAt, metrics: snapshot.metrics, open: () => onOpenPost(post.id) }] : [];
    }));
    return campaigns.flatMap((campaign) => campaign.networks.flatMap((id) => {
      if (channel !== "all" && id !== channel) return [];
      if (!adConnected.includes(id) || (adConnectionStates[id] ?? "ready") !== "ready") return [];
      const snapshot = campaignSnapshot(campaign, id);
      return snapshot ? [{ key: `${campaign.id}:${id}`, title: campaign.name, channel: id, date: snapshot.updatedAt, metrics: snapshot.metrics, currency: campaign.currency, open: () => onOpenCampaign(campaign.id) }] : [];
    }));
  }, [tab, posts, campaigns, channel, connected, adConnected, connectionStates, adConnectionStates, onOpenPost, onOpenCampaign]);
  const allowedRows = rows.filter((row) => Date.now() - new Date(row.date).getTime() <= period * 86400000);
  const headlineKeys = tab === "organic" ? ["Impressions", "Views", "Video views", "Reactions", "Likes", "Comments"] : ["Spend", "Impressions", "Clicks"];
  const totals = channel === "all" ? [] : headlineKeys.map((key) => ({ key, value: allowedRows.reduce((sum, row) => sum + (row.metrics.find((metric) => metric.key === key)?.value ?? 0), 0) })).filter((item) => item.value > 0);
  const selectedCatalog = tab === "organic" ? channel === "all" ? null : organicMetrics[channel as PlatformId] : channel === "all" ? null : adMetrics[channel as AdNetworkId];
  const accessState = channel === "all" ? "ready" : tab === "organic" ? connectionStates[channel as PlatformId] ?? "ready" : adConnectionStates[channel as AdNetworkId] ?? "ready";
  const insufficientCurrency = tab === "ads" && new Set(allowedRows.map((row) => row.currency)).size > 1;
  const primary = tab === "organic" ? ["Impressions", "Views", "Video views"] : ["Clicks"];
  const daily = Array.from({ length: period }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (period - 1 - index));
    const value = allowedRows.filter((row) => new Date(row.date).toDateString() === date.toDateString()).reduce((sum, row) => sum + row.metrics.filter((metric) => primary.includes(metric.key)).reduce((count, metric) => count + metric.value, 0), 0);
    return { label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: showScenario && allowedRows.length === 0 ? 18 + (index * 13 + 7) % 46 : value };
  });
  const max = Math.max(...daily.map((item) => item.value), 1);

  return <div className="analytics-page stack-gap">
    <div className="info-callout"><BarChart3 size={21} /><div><strong>Sample reporting, no live accounts</strong><p>All numbers here are simulated. Platform permissions, media type, and reporting delays determine what a future connection can return.</p></div></div>
    <div className="analytics-tabs" role="tablist" aria-label="Analytics type"><button role="tab" aria-selected={tab === "organic"} className={tab === "organic" ? "active" : ""} onClick={() => { setTab("organic"); setChannel("all"); }}>Organic posts</button><button role="tab" aria-selected={tab === "ads"} className={tab === "ads" ? "active" : ""} onClick={() => { setTab("ads"); setChannel("all"); }}>Advertising</button></div>
    <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">REPORT CONTROLS</span><h3>{tab === "organic" ? "Content performance" : "Campaign performance"}</h3></div></div><div className="analytics-filters"><label>Account or network<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">All selected</option>{options.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label><label>Date range<select value={period} onChange={(event) => setPeriod(Number(event.target.value) as 7 | 30)}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label><label className="analytics-toggle"><input type="checkbox" checked={showScenario} onChange={(event) => setShowScenario(event.target.checked)} /> Show example trend when there are no reports</label></div>{selectedCatalog && <p className="analytics-capability"><Info size={16} /> {selectedCatalog.note} <a href={selectedCatalog.reference} target="_blank" rel="noreferrer">Official API ↗</a></p>}</section>
    {options.length === 0 ? <section className="panel-card padded empty-panel"><h4>Select a simulation account first.</h4><p>Analytics needs at least one selected social or advertising account.</p></section> : accessState !== "ready" ? <section className="panel-card padded empty-panel"><h4>{accessState === "expired" ? "Reconnect required" : "Reporting permission required"}</h4><p>This simulation account cannot show a report until its access state is ready. Change it in Connections to explore the available metrics.</p></section> : <>
      <div className="analytics-summary">{totals.length ? totals.filter((item) => !(item.key === "Spend" && insufficientCurrency)).slice(0, 4).map((item) => <div className="analytics-stat" key={item.key}><span>{item.key}</span><strong>{item.key === "Spend" ? formatMetric({ ...item, label: item.key, unit: "money" }, allowedRows[0]?.currency) : item.value.toLocaleString()}</strong><small>Session sample reports · selected account</small></div>) : <div className="analytics-stat"><span>REPORTS</span><strong>{allowedRows.length}</strong><small>{channel === "all" ? "Select one account to inspect metrics and trends without blending platform definitions." : "Publish a post or run a campaign, then reveal a sample report in its detail view."}</small></div>}</div>
      {insufficientCurrency && <p className="analytics-capability">Spend totals are separated because these ad accounts use different currencies.</p>}
      <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">{allowedRows.length ? "SESSION TREND" : "EXAMPLE SCENARIO"}</span><h3>{tab === "organic" ? "Views or impressions over time" : "Clicks over time"}</h3></div><span className="count-chip">{period} days</span></div>{channel === "all" ? <p className="analytics-capability">Choose one account above to inspect a trend. Platform view and click definitions are not blended.</p> : <>{allowedRows.length === 0 && <p className="analytics-capability">{showScenario ? "Illustrative pattern only; it is not account performance." : "No session reports yet."}</p>}<div className="analytics-bars" role="img" aria-label={daily.map((item) => `${item.label}: ${item.value}`).join(", ")}>{daily.map((item) => <div key={item.label} title={`${item.label}: ${item.value}`}><span style={{ height: `${item.value ? Math.max(5, item.value / max * 100) : 2}%` }} /><small>{period === 7 ? item.label : ""}</small></div>)}</div><div className="analytics-chart-caption"><span>{daily[0]?.label}</span><span>{daily[daily.length - 1]?.label}</span></div></>}</section>
      <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">BREAKDOWN</span><h3>{tab === "organic" ? "Posts by channel" : "Campaigns by network"}</h3></div><span className="count-chip">{allowedRows.length} reports</span></div>{allowedRows.length ? <div className="analytics-report-list">{allowedRows.map((row) => <button className="analytics-report" key={row.key} onClick={row.open}><NetworkMark id={row.channel} /><span><strong>{row.title}</strong><small>{platforms.find((item) => item.id === row.channel)?.name ?? adNetworks.find((item) => item.id === row.channel)?.name} · Updated {new Date(row.date).toLocaleString()} · {Date.now() - new Date(row.date).getTime() > 86400000 ? "stale sample" : "sample"}</small></span><b>{formatMetric(row.metrics.find((metric) => primary.includes(metric.key)) ?? row.metrics[0], row.currency)}</b><ArrowRight size={17} /></button>)}</div> : <div className="empty-panel compact"><h4>{tab === "organic" && posts.some((post) => post.channels.some((id) => post.channelStatus[id] === "published")) ? "Reporting is processing" : "No report data yet"}</h4><p>Open a published post or live campaign and select “Reveal sample metrics.” Unsupported formats remain unavailable.</p></div>}</section>
    </>}
    <p className="analytics-disclaimer">Metrics have different definitions across platforms. Conversions and return on ad spend are omitted until conversion tracking and attribution are configured.</p>
  </div>;
}
