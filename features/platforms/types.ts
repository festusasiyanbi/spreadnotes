export type PlatformId = "linkedin" | "instagram" | "facebook" | "threads" | "x" | "tiktok" | "youtube";
export type MediaKind = "image" | "video" | "document";
export type AdNetworkId = "meta" | "linkedin" | "tiktok";

export type Platform = {
  id: PlatformId;
  name: string;
  short: string;
  tone: string;
  supports: MediaKind[];
  maxImages: number;
  limit: number;
  postingMode: "direct" | "manual";
};

export type AdNetwork = {
  id: AdNetworkId;
  name: string;
  description: string;
  placements: string[];
};
