import type { MediaKind, Platform, PlatformId } from "./types";
export const platforms: Platform[] = [
  { id: "linkedin", name: "LinkedIn", short: "in", tone: "blue", supports: ["image", "video", "document"], limit: 3000, postingMode: "direct" },
  { id: "instagram", name: "Instagram", short: "ig", tone: "pink", supports: ["image", "video", "carousel"], limit: 2200, postingMode: "direct" },
  { id: "facebook", name: "Facebook", short: "f", tone: "blue", supports: ["image", "video", "carousel"], limit: 63206, postingMode: "direct" },
  { id: "threads", name: "Threads", short: "@", tone: "ink", supports: ["image", "video"], limit: 500, postingMode: "direct" },
  { id: "x", name: "X", short: "𝕏", tone: "ink", supports: ["image", "video"], limit: 280, postingMode: "manual" },
  { id: "tiktok", name: "TikTok", short: "♪", tone: "cyan", supports: ["image", "video", "carousel"], limit: 2200, postingMode: "manual" },
  { id: "youtube", name: "YouTube", short: "▶", tone: "red", supports: ["video"], limit: 5000, postingMode: "manual" },
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
  return selected.flatMap((id) => {
    const platform = platforms.find((item) => item.id === id);
    if (!platform) return [];
    const issues: string[] = [];
    const version = variants[id] ?? text;
    if (version.length > platform.limit) issues.push(`${platform.name}: text is ${version.length - platform.limit} characters over the preview limit.`);
    for (const item of media) if (!platform.supports.includes(item.kind)) issues.push(`${platform.name}: ${item.kind} is not supported in this demo format.`);
    if (id === "instagram" && media.length === 0) issues.push("Instagram needs an image or video.");
    if (id === "tiktok" && !media.some((item) => item.kind === "video")) issues.push("TikTok needs a video for this demo flow.");
    if (id === "youtube" && !media.some((item) => item.kind === "video")) issues.push("YouTube needs a video.");
    return issues;
  });
}
