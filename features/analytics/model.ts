import type { Campaign, Post } from "../simulation/store";
import type { AdNetworkId, PlatformId } from "../platforms/types";

export type Metric = { key: string; label: string; value: number; unit?: "money" | "minutes"; note?: string };
export type Snapshot = { source: "sample"; updatedAt: string; metrics: Metric[] };

// A single capability map drives the simulation report and can later gate real API responses.
export const organicMetrics: Record<PlatformId, { labels: string[]; note: string; reference: string }> = {
  linkedin: { labels: ["Impressions", "Members reached", "Reactions", "Comments", "Reposts"], note: "Member post analytics needs approved Community Management access.", reference: "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics" },
  instagram: { labels: ["Views", "Likes", "Comments"], note: "Professional-account media insights vary by media type and API version.", reference: "https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api" },
  facebook: { labels: ["Views", "Reactions", "Comments"], note: "Page insights vary by permission and API version; personal profiles are excluded.", reference: "https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api" },
  threads: { labels: ["Views", "Likes", "Replies", "Reposts", "Quotes", "Shares"], note: "Post insights need Threads insights permission.", reference: "https://www.postman.com/meta/threads/request/434u2bd/get-post-insights" },
  x: { labels: ["Impressions", "Likes", "Replies", "Reposts", "Bookmarks", "URL clicks"], note: "URL clicks need owner authorization and are available within the documented 30-day window.", reference: "https://docs.x.com/x-api/fundamentals/metrics" },
  tiktok: { labels: ["Video views", "Likes", "Comments", "Shares"], note: "Owned-video counts require video.list; photo metrics are unavailable through this path.", reference: "https://developers.tiktok.com/docs/en/tiktok-api-v2-video-query" },
  youtube: { labels: ["Views", "Likes", "Comments", "Watch minutes"], note: "Authorized YouTube Analytics reports are video or channel specific.", reference: "https://developers.google.com/youtube/analytics/channel_reports" },
};

export const adMetrics: Record<AdNetworkId, { labels: string[]; note: string; reference: string }> = {
  meta: { labels: ["Spend", "Impressions", "Clicks", "CTR", "CPC"], note: "Marketing API Insights; results can be delayed or revised.", reference: "https://www.postman.com/meta/facebook-marketing-api/folder/zzd6d5p/insights-api" },
  linkedin: { labels: ["Spend", "Impressions", "Clicks", "CTR", "CPC"], note: "Ads reporting requires approved access and r_ads_reporting.", reference: "https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/ads-reporting" },
  tiktok: { labels: ["Spend", "Impressions", "Clicks", "CTR", "CPC"], note: "Basic reports can be delayed; click definitions are network specific.", reference: "https://business-api.tiktok.com/portal/docs/supported-metrics-for-a-dimension-in-basic-reports/v1.3" },
};

function hash(value: string) { return [...value].reduce((number, char) => (number * 31 + char.charCodeAt(0)) >>> 0, 17); }

export function postSnapshot(post: Post, id: PlatformId): Snapshot | null {
  if (post.channelStatus[id] !== "published" || !post.sampleMetricsReady) return null;
  if (id === "x" && post.channelPublishedAt?.x && Date.now() - new Date(post.channelPublishedAt.x).getTime() > 30 * 86400000) {
    // Public metrics remain available, but owner-only clicks leave the documented window.
    const previous = postSnapshot({ ...post, channelPublishedAt: { ...post.channelPublishedAt, x: undefined } }, id);
    return previous ? { ...previous, metrics: previous.metrics.filter((metric) => metric.key !== "URL clicks") } : null;
  }
  if (id === "tiktok" && !(post.mediaVariants?.[id] ?? post.media).some((item) => item.kind === "video")) return null;
  const seed = hash(post.id + id);
  const base = 300 + seed % 1700;
  const engagement = 12 + seed % 95;
  const values: Record<string, number> = {
    Impressions: base, "Members reached": Math.round(base * .72), Views: base, "Video views": base,
    Likes: engagement, Reactions: engagement, Comments: Math.round(engagement * .19), Replies: Math.round(engagement * .19),
    Reposts: Math.round(engagement * .12), Shares: Math.round(engagement * .12), Quotes: Math.round(engagement * .04),
    Bookmarks: Math.round(engagement * .09), "URL clicks": Math.round(base * .014), "Watch minutes": Math.round(base * .85),
  };
  return { source: "sample", updatedAt: post.sampleReportedAt ?? post.createdAt, metrics: organicMetrics[id].labels.map((label) => ({ key: label, label, value: values[label], unit: label === "Watch minutes" ? "minutes" : undefined })) };
}

export function campaignSnapshot(campaign: Campaign, id: AdNetworkId): Snapshot | null {
  if (!campaign.sampleMetricsReady || !["live", "paused", "completed"].includes(campaign.networkStatus[id] ?? "")) return null;
  const spend = Number(campaign.spent[id] ?? 0);
  if (spend <= 0) return null;
  const seed = hash(campaign.id + id);
  const impressions = Math.round(spend * (48 + seed % 36));
  const clicks = Math.max(1, Math.round(impressions * (.01 + seed % 8 / 1000)));
  return { source: "sample", updatedAt: campaign.sampleReportedAt ?? campaign.createdAt, metrics: [
    { key: "Spend", label: "Spend", value: spend, unit: "money" },
    { key: "Impressions", label: "Impressions", value: impressions },
    { key: "Clicks", label: "Clicks", value: clicks },
    { key: "CTR", label: "CTR", value: clicks / impressions * 100 },
    { key: "CPC", label: "CPC", value: spend / clicks, unit: "money" },
  ] };
}

export function formatMetric(metric: Metric, currency = "CAD") {
  if (metric.unit === "money") return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(metric.value);
  if (metric.key === "CTR") return `${metric.value.toFixed(2)}%`;
  return new Intl.NumberFormat().format(metric.value);
}
