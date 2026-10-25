import type { MediaKind, Platform, PlatformId } from "./types";
export const capabilityVersion = "2026-10";
export const platforms: Platform[] = [
  { id: "linkedin", name: "LinkedIn", short: "in", tone: "blue", supports: ["image", "video", "document"], maxImages: 10, limit: 3000, postingMode: "direct", accountRequirement: "Member or organization account", publishingRequirement: "Authorized posting scope; some features require Community Management approval", analyticsRequirement: "Community Management access and post analytics permission", apiReference: "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api" },
  { id: "instagram", name: "Instagram", short: "ig", tone: "pink", supports: ["image", "video"], maxImages: 10, limit: 2200, postingMode: "direct", accountRequirement: "Professional Business or Creator account", publishingRequirement: "Content publishing permission and an eligible professional account", analyticsRequirement: "Professional account and insights permission; metrics depend on media type", apiReference: "https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api" },
  { id: "facebook", name: "Facebook", short: "f", tone: "blue", supports: ["image", "video"], maxImages: 10, limit: 63206, postingMode: "direct", accountRequirement: "Page with content access, not a personal profile", publishingRequirement: "Page access token and content permissions", analyticsRequirement: "Page insights access; available metrics vary by API version", apiReference: "https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api" },
  { id: "threads", name: "Threads", short: "@", tone: "ink", supports: ["image", "video"], maxImages: 10, limit: 500, postingMode: "direct", accountRequirement: "Threads account", publishingRequirement: "Threads content publishing permission", analyticsRequirement: "Threads insights permission", apiReference: "https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api" },
  { id: "x", name: "X", short: "𝕏", tone: "ink", supports: ["image", "video"], maxImages: 4, limit: 280, postingMode: "direct", accountRequirement: "X account and developer project", publishingRequirement: "User authorization and API access; usage may cost money", analyticsRequirement: "Private click metrics require user access and have a 30-day window", apiReference: "https://docs.x.com/x-api/posts/manage-tweets/introduction" },
  { id: "tiktok", name: "TikTok", short: "♪", tone: "cyan", supports: ["image", "video"], maxImages: 10, limit: 2200, postingMode: "direct", accountRequirement: "TikTok creator account", publishingRequirement: "Content Posting API approval and creator authorization", analyticsRequirement: "Video list permission for owned-video counts; photo insights unavailable here", apiReference: "https://developers.tiktok.com/docs/en/content-posting-api-get-started" },
  { id: "youtube", name: "YouTube", short: "▶", tone: "red", supports: ["video"], maxImages: 0, limit: 5000, postingMode: "direct", accountRequirement: "YouTube channel", publishingRequirement: "Authorized video upload; scheduled publish uses private video state", analyticsRequirement: "YouTube Analytics authorization", apiReference: "https://developers.google.com/youtube/data/reference/rest/v3/videos/insert" },
];

export const adNetworks = [
  { id: "meta", name: "Meta Ads", description: "Facebook + Instagram", placements: ["Facebook Feed", "Instagram Feed", "Instagram Stories"] },
  { id: "linkedin", name: "LinkedIn Ads", description: "Professional audiences", placements: ["LinkedIn Feed", "LinkedIn Audience Network"] },
  { id: "tiktok", name: "TikTok Ads", description: "Short-form video", placements: ["TikTok Feed"] },
] as const;

export function mediaKind(file: File): MediaKind | null {
  if (["image/jpeg", "image/png"].includes(file.type)) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "document";
  return null;
}

export function postIssues(text: string, media: { kind: MediaKind; type?: string; bytes?: number; width?: number; height?: number }[], selected: PlatformId[], variants: Partial<Record<PlatformId, string>> = {}) {
  const imageCount = media.filter((item) => item.kind === "image").length;
  const videoCount = media.filter((item) => item.kind === "video").length;
  const documentCount = media.filter((item) => item.kind === "document").length;
  return selected.flatMap((id) => {
    const platform = platforms.find((item) => item.id === id);
    if (!platform) return [];
    const issues: string[] = [];
    const version = variants[id] ?? text;
    if (version.length > platform.limit) issues.push(`${platform.name} does not support ${version.length} characters here. Remove ${version.length - platform.limit} characters to meet its ${platform.limit}-character limit.`);
    for (const kind of new Set(media.map((item) => item.kind))) if (!platform.supports.includes(kind)) issues.push(`${platform.name} does not support ${kind} posts through this publishing flow. Remove the ${kind} or deselect ${platform.name}.`);
    if (imageCount > platform.maxImages) issues.push(`${platform.name} does not support ${imageCount} images in one post here. Use at most ${platform.maxImages}.`);
    if (media.some((item) => item.kind === "image" && (item.bytes ?? 0) > 5 * 1024 * 1024)) issues.push(`${platform.name}: use images under the simulation's 5 MB per-file limit.`);
    if (media.some((item) => item.kind === "video" && (item.bytes ?? 0) > 250 * 1024 * 1024)) issues.push(`${platform.name}: use videos under the simulation's 250 MB per-file limit.`);
    if (media.some((item) => item.kind === "document" && (item.bytes ?? 0) > 20 * 1024 * 1024)) issues.push(`${platform.name}: use PDFs under the simulation's 20 MB per-file limit.`);
    if (videoCount > 1) issues.push(`${platform.name}: this simulation supports one video per post.`);
    if (media.some((item) => item.kind === "video" && item.type === "video/simulation")) issues.push(`${platform.name}: the sample video concept is a preview only. Upload a video file before scheduling or publishing.`);
    if (documentCount > 1) issues.push(`${platform.name}: this simulation supports one document per post.`);
    if (imageCount && (videoCount || documentCount)) issues.push(`${platform.name}: choose images alone for a multi-image post, or use one video or document.`);
    if (videoCount && documentCount) issues.push(`${platform.name}: a video and document cannot share one post in this simulation.`);
    if (id === "instagram" && media.length === 0) issues.push("Instagram does not support a text-only post here. Add an image or video.");
    if (id === "instagram" && media.some((item) => item.kind === "image" && item.type !== "image/jpeg")) issues.push("Instagram image publishing needs JPEG files. Export a JPEG or select a different channel asset.");
    if (id === "instagram" && media.some((item) => item.kind === "image" && item.width && item.height && (item.width / item.height < .8 || item.width / item.height > 1.91))) issues.push("Instagram images need an aspect ratio between 4:5 and 1.91:1 in this simulation.");
    if (id === "tiktok" && imageCount === 0 && videoCount === 0) issues.push("TikTok needs an image or video.");
    if (id === "youtube" && !media.some((item) => item.kind === "video")) issues.push("YouTube needs a video.");
    return issues;
  });
}
