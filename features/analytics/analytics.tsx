"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Info } from "lucide-react";
import { useSimulationStore } from "../simulation/store";
import { adNetworks, platforms } from "../platforms/catalog";
import type { AdNetworkId, PlatformId } from "../platforms/types";
import { NetworkMark } from "../platforms/network-mark";
import { adMetrics, campaignSnapshot, formatMetric, organicMetrics, postSnapshot, type Metric } from "./model";

type ReportRow = {
  key: string;
  title: string;
  channel: PlatformId | AdNetworkId;
  date: string;
  metrics: Metric[];
  currency?: string;
  source: "spreadnotes" | "platform";
  open?: () => void;
};

type BarItem = { key: string; label: string; value: number; display?: string };

const nativeExamples: Partial<Record<PlatformId, { title: string; values: number[] }>> = {
  linkedin: { title: "Sample LinkedIn member post", values: [1420, 980, 48, 11, 6] },
  instagram: { title: "Sample Instagram media post", values: [2120, 116, 14] },
  facebook: { title: "Sample Facebook Page post", values: [1730, 88, 12] },
  threads: { title: "Sample Threads post", values: [1150, 72, 9, 7, 2, 5] },
  x: { title: "Sample X post", values: [980, 42, 9, 5, 7, 3] },
  tiktok: { title: "Sample TikTok video", values: [2840, 170, 25, 19] },
  youtube: { title: "Sample YouTube video", values: [3650, 126, 37, 940] },
};

const reachKeys = ["Impressions", "Views", "Video views"];
const engagementKeys = new Set(["Reactions", "Likes", "Comments", "Replies", "Reposts", "Shares", "Quotes", "Bookmarks"]);

function BarList({ items, label }: { items: BarItem[]; label: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return <div className="analytics-bar-list" role="img" aria-label={`${label}: ${items.map((item) => `${item.label} ${item.display ?? item.value.toLocaleString()}`).join(", ")}`}>
    {items.map((item) => <div className="analytics-bar-row" key={item.key}>
      <span className="analytics-bar-label" title={item.label}>{item.label}</span>
      <span className="analytics-bar-track"><span style={{ width: `${item.value ? Math.max(3, item.value / max * 100) : 0}%` }} /></span>
      <strong>{item.display ?? item.value.toLocaleString()}</strong>
    </div>)}
  </div>;
}

export function Analytics({ onOpenPost, onOpenCampaign }: { onOpenPost: (id: string) => void; onOpenCampaign: (id: string) => void }) {
  const { posts, campaigns, connected, adConnected, connectionStates, adConnectionStates } = useSimulationStore();
  const [tab, setTab] = useState<"organic" | "ads">("organic");
  const [channel, setChannel] = useState("all");
  const [period, setPeriod] = useState<7 | 30>(7);
  const [source, setSource] = useState<"all" | "spreadnotes" | "platform">("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const options = tab === "organic" ? platforms.filter((item) => connected.includes(item.id)) : adNetworks.filter((item) => adConnected.includes(item.id));

  const rows = useMemo<ReportRow[]>(() => {
    if (tab === "organic") return [
      ...posts.flatMap((post) => post.channels.flatMap((id) => {
        if (channel !== "all" && id !== channel) return [];
        if (!connected.includes(id) || (connectionStates[id] ?? "ready") !== "ready") return [];
        const snapshot = postSnapshot(post, id);
        return snapshot ? [{ key: `${post.id}:${id}`, title: post.title, channel: id, date: snapshot.updatedAt, metrics: snapshot.metrics, source: "spreadnotes" as const, open: () => onOpenPost(post.id) }] : [];
      })),
      ...platforms.flatMap((platform) => {
        const id = platform.id;
        const example = nativeExamples[id];
        if (!example || (channel !== "all" && channel !== id) || !connected.includes(id) || (connectionStates[id] ?? "ready") !== "ready") return [];
        return [{ key: `native:${id}`, title: example.title, channel: id, date: new Date().toISOString(), metrics: organicMetrics[id].labels.map((label, index) => ({ key: label, label, value: example.values[index] ?? 0 })), source: "platform" as const }];
      }),
    ];
    return campaigns.flatMap((campaign) => campaign.networks.flatMap((id) => {
      if (channel !== "all" && id !== channel) return [];
      if (!adConnected.includes(id) || (adConnectionStates[id] ?? "ready") !== "ready") return [];
      const snapshot = campaignSnapshot(campaign, id);
      return snapshot ? [{ key: `${campaign.id}:${id}`, title: campaign.name, channel: id, date: snapshot.updatedAt, metrics: snapshot.metrics, currency: campaign.currency, source: "spreadnotes" as const, open: () => onOpenCampaign(campaign.id) }] : [];
    }));
  }, [tab, posts, campaigns, channel, connected, adConnected, connectionStates, adConnectionStates, onOpenPost, onOpenCampaign]);

  const visibleRows = rows.filter((row) => Date.now() - new Date(row.date).getTime() <= period * 86400000
    && (tab === "ads" || source === "all" || row.source === source)
    && (tab === "ads" || row.title.toLowerCase().includes(search.trim().toLowerCase())));
  const selectedCatalog = channel === "all" ? null : tab === "organic" ? organicMetrics[channel as PlatformId] : adMetrics[channel as AdNetworkId];
  const accessState = channel === "all" ? "ready" : tab === "organic" ? connectionStates[channel as PlatformId] ?? "ready" : adConnectionStates[channel as AdNetworkId] ?? "ready";
  const activeReport = visibleRows.find((row) => row.key === selectedReport) ?? visibleRows[0];
  const activePlatformName = activeReport && (tab === "organic" ? platforms.find((item) => item.id === activeReport.channel)?.name : adNetworks.find((item) => item.id === activeReport.channel)?.name);
  const reportCountLabel = tab === "organic" ? "Post reports" : "Campaign reports";
  const countByPlatform = options.map((option) => ({ key: option.id, label: option.name, value: visibleRows.filter((row) => row.channel === option.id).length }));
  const selectedMetricKeys = selectedCatalog?.labels.slice(0, 3) ?? [];
  const currencies = new Set(visibleRows.map((row) => row.currency).filter(Boolean));
  const overviewCards = channel === "all" ? [
    { label: reportCountLabel, value: String(visibleRows.length).padStart(2, "0"), note: "In this sample view" },
    { label: tab === "organic" ? "Social platforms" : "Ad networks", value: String(countByPlatform.filter((item) => item.value > 0).length).padStart(2, "0"), note: "With available reports" },
    { label: tab === "organic" ? "Direct post examples" : "Currencies", value: String(tab === "organic" ? visibleRows.filter((row) => row.source === "platform").length : currencies.size).padStart(2, "0"), note: tab === "organic" ? "Illustrative, not imported" : "Spend stays separate by currency" },
  ] : [
    { label: reportCountLabel, value: String(visibleRows.length).padStart(2, "0"), note: "Selected account" },
    ...selectedMetricKeys.map((key) => {
      const values = visibleRows.flatMap((row) => row.metrics.filter((metric) => metric.key === key));
      const total = values.reduce((sum, metric) => sum + metric.value, 0);
      const mixedSpend = key === "Spend" && currencies.size > 1;
      return { label: key, value: mixedSpend ? "—" : values.length ? formatMetric({ key, label: key, value: total, unit: key === "Spend" ? "money" as const : undefined }, visibleRows[0]?.currency) : "—", note: mixedSpend ? "Multiple currencies" : values.length ? "Selected account · sample" : "Unavailable" };
    }),
  ];
  const comparisonKey = channel === "all" ? null : tab === "ads" ? "Clicks" : reachKeys.find((key) => selectedCatalog?.labels.includes(key));
  const comparison = channel === "all" ? countByPlatform : visibleRows.map((row) => ({ key: row.key, label: row.title, value: comparisonKey ? row.metrics.find((metric) => metric.key === comparisonKey)?.value ?? 0 : 1 }));
  const engagement = activeReport?.metrics.filter((metric) => engagementKeys.has(metric.key)) ?? [];

  return <div className="analytics-page stack-gap">
    <div className="analytics-tabs" role="tablist" aria-label="Analytics type">
      <button role="tab" aria-selected={tab === "organic"} className={tab === "organic" ? "active" : ""} onClick={() => { setTab("organic"); setChannel("all"); setSelectedReport(null); }}>Organic posts</button>
      <button role="tab" aria-selected={tab === "ads"} className={tab === "ads" ? "active" : ""} onClick={() => { setTab("ads"); setChannel("all"); setSelectedReport(null); }}>Advertising</button>
    </div>
    <section className="panel-card padded analytics-filter-panel">
      <div className="panel-heading"><div><span className="eyebrow">SAMPLE REPORTS</span><h3>Choose what to explore.</h3></div><span className="count-chip">No live data</span></div>
      <div className="analytics-filters">
        <label>Platform or network<select value={channel} onChange={(event) => { setChannel(event.target.value); setSelectedReport(null); }}><option value="all">All connected</option>{options.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label>
        <label>Date range<select value={period} onChange={(event) => { setPeriod(Number(event.target.value) as 7 | 30); setSelectedReport(null); }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label>
        {tab === "organic" && <><label>Find a post<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles" /></label><label>Published through<select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="all">All sample sources</option><option value="spreadnotes">SpreadNotes</option><option value="platform">Directly on platform</option></select></label></>}
      </div>
      {selectedCatalog && <p className="analytics-capability"><Info size={16} /> {selectedCatalog.note} <a href={selectedCatalog.reference} target="_blank" rel="noreferrer">Official API ↗</a></p>}
    </section>
    {options.length === 0 ? <section className="panel-card padded empty-panel"><h4>Connect a simulation account first.</h4><p>Choose a social channel or ad account in Connections to explore its sample reports.</p></section> : accessState !== "ready" ? <section className="panel-card padded empty-panel"><h4>{accessState === "expired" ? "Reconnect required" : "Reporting permission required"}</h4><p>This simulation account cannot show reports until its access state is ready. Change it in Connections.</p></section> : <>
      <div className="analytics-overview-cards">{overviewCards.map((card) => <div className="analytics-overview-card" key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small></div>)}</div>
      <div className="analytics-content-grid">
        <section className="panel-card padded analytics-comparison"><div className="panel-heading"><div><span className="eyebrow">AT A GLANCE</span><h3>{channel === "all" ? "Reports by platform" : `${comparisonKey ?? "Reports"} by ${tab === "organic" ? "post" : "campaign"}`}</h3></div></div>
          {comparison.some((item) => item.value > 0) ? <><BarList items={comparison} label={channel === "all" ? "Report counts by platform" : `${comparisonKey ?? "Report counts"} by item`} /><p className="analytics-chart-note">{channel === "all" ? "Counts show coverage. Platform views and engagement are never added together." : `Comparison uses ${comparisonKey?.toLowerCase() ?? "report counts"} from this selected network only.`}</p></> : <div className="empty-panel compact"><BarChart3 size={23} /><h4>No comparison yet.</h4><p>Reports will appear here after a simulated post or campaign has sample metrics.</p></div>}
        </section>
        <section className="panel-card padded analytics-reports"><div className="panel-heading"><div><span className="eyebrow">EXPLORE</span><h3>{tab === "organic" ? "Post reports" : "Campaign reports"}</h3></div><span className="count-chip">{visibleRows.length} shown</span></div>
          {visibleRows.length ? <div className="analytics-card-grid">{visibleRows.map((row) => {
            const platformName = tab === "organic" ? platforms.find((item) => item.id === row.channel)?.name : adNetworks.find((item) => item.id === row.channel)?.name;
            return <button className={`analytics-item-card ${activeReport?.key === row.key ? "selected" : ""}`} key={row.key} onClick={() => setSelectedReport(row.key)} aria-pressed={activeReport?.key === row.key}>
              <span className="analytics-item-top"><NetworkMark id={row.channel} /><small>{platformName}</small><ArrowRight size={15} /></span>
              <strong>{row.title}</strong>
              <small>{row.source === "platform" ? "Direct post example" : "SpreadNotes sample"} · Updated {new Date(row.date).toLocaleDateString()}</small>
              <span className="analytics-item-metrics">{row.metrics.slice(0, 3).map((metric) => <span key={metric.key}><b>{formatMetric(metric, row.currency)}</b><small>{metric.label}</small></span>)}</span>
            </button>;
          })}</div> : <div className="empty-panel compact"><h4>No reports match these filters.</h4><p>{tab === "organic" ? "Try another date, account, or source. Simulated published posts can reveal sample metrics here." : "Try another date or ad account. Simulated campaigns can reveal sample metrics here."}</p></div>}
        </section>
      </div>
      {activeReport && <section className="panel-card padded analytics-detail"><div className="panel-heading"><div><span className="eyebrow">REPORT DETAIL · {activePlatformName?.toUpperCase()}</span><h3>{activeReport.title}</h3><p>{activeReport.source === "platform" ? "Example of a directly published post. No account was queried." : "SpreadNotes simulation report."} Updated {new Date(activeReport.date).toLocaleString()}.</p></div>{activeReport.open && <button className="button button-outline small" onClick={activeReport.open}>Open {tab === "organic" ? "post" : "campaign"} <ArrowRight size={15} /></button>}</div>
        <div className="analytics-detail-layout"><div className="analytics-detail-metrics">{activeReport.metrics.map((metric) => <div key={metric.key}><span>{metric.label}</span><strong>{formatMetric(metric, activeReport.currency)}</strong></div>)}</div>{tab === "organic" && engagement.length > 1 && <div className="analytics-engagement"><h4>Engagement actions</h4><BarList items={engagement.map((metric) => ({ key: metric.key, label: metric.label, value: metric.value }))} label="Engagement actions" /><small>Actions are compared within this post only.</small></div>}</div>
        {tab === "organic" && <p className="analytics-capability">Other metric types are unavailable in this simulated integration. {organicMetrics[activeReport.channel as PlatformId].note}</p>}
      </section>}
    </>}
    <p className="analytics-disclaimer">All figures are simulated. Direct platform posts are examples, not imported account data. Available metrics and post history depend on platform permissions, account type, media format, and reporting windows. Cross-platform view totals and ad return are omitted until comparable data and attribution exist.</p>
  </div>;
}
