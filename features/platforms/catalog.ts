import type { MediaKind, Platform, PlatformId } from "./types";
export const platforms: Platform[] = [
  { id: "linkedin", name: "LinkedIn", short: "in", tone: "blue", supports: ["image", "video", "document"], maxImages: 10, limit: 3000, postingMode: "direct" },
  { id: "instagram", name: "Instagram", short: "ig", tone: "pink", supports: ["image", "video"], maxImages: 10, limit: 2200, postingMode: "direct" },
  { id: "facebook", name: "Facebook", short: "f", tone: "blue", supports: ["image", "video"], maxImages: 10, limit: 63206, postingMode: "direct" },
  { id: "threads", name: "Threads", short: "@", tone: "ink", supports: ["image", "video"], maxImages: 10, limit: 500, postingMode: "direct" },
  { id: "x", name: "X", short: "𝕏", tone: "ink", supports: ["image", "video"], maxImages: 4, limit: 280, postingMode: "manual" },
  { id: "tiktok", name: "TikTok", short: "♪", tone: "cyan", supports: ["image", "video"], maxImages: 10, limit: 2200, postingMode: "manual" },
  { id: "youtube", name: "YouTube", short: "▶", tone: "red", supports: ["video"], maxImages: 0, limit: 5000, postingMode: "manual" },
];

export const adNetworks = [
  { id: "meta", name: "Meta Ads", description: "Facebook + Instagram", placements: ["Facebook Feed", "Instagram Feed", "Instagram Stories"] },
  { id: "linkedin", name: "LinkedIn Ads", description: "Professional audiences", placements: ["LinkedIn Feed", "LinkedIn Audience Network"] },
  { id: "tiktok", name: "TikTok Ads", description: "Short-form video", placements: ["TikTok Feed"] },
] as const;

export function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "document";
  return null;
}

export function postIssues(text: string, media: { kind: MediaKind }[], selected: PlatformId[], variants: Partial<Record<PlatformId, string>> = {}) {
  const imageCount = media.filter((item) => item.kind === "image").length;
  const videoCount = media.filter((item) => item.kind === "video").length;
  const documentCount = media.filter((item) => item.kind === "document").length;
  return selected.flatMap((id) => {
    const platform = platforms.find((item) => item.id === id);
    if (!platform) return [];
    const issues: string[] = [];
    const version = variants[id] ?? text;
    if (version.length > platform.limit) issues.push(`${platform.name}: text is ${version.length - platform.limit} characters over the preview limit.`);
    for (const kind of new Set(media.map((item) => item.kind))) if (!platform.supports.includes(kind)) issues.push(`${platform.name}: ${kind} is not supported in this demo format.`);
    if (imageCount > platform.maxImages && platform.maxImages > 0) issues.push(`${platform.name}: this demo supports up to ${platform.maxImages} images in one post.`);
    if (videoCount > 1) issues.push(`${platform.name}: this demo supports one video per post.`);
    if (documentCount > 1) issues.push(`${platform.name}: this demo supports one document per post.`);
    if (imageCount && (videoCount || documentCount)) issues.push(`${platform.name}: choose images alone for a multi-image post, or use one video or document.`);
    if (videoCount && documentCount) issues.push(`${platform.name}: a video and document cannot share one post in this demo.`);
    if (id === "instagram" && media.length === 0) issues.push("Instagram needs an image or video.");
    if (id === "tiktok" && imageCount === 0 && videoCount === 0) issues.push("TikTok needs an image or video.");
    if (id === "youtube" && !media.some((item) => item.kind === "video")) issues.push("YouTube needs a video.");
    return issues;
  });
}
