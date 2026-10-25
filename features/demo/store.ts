"use client";

import { create } from "zustand";
import type { AdNetworkId, MediaKind, PlatformId } from "../platforms/types";

export type PostStatus = "draft" | "needs_approval" | "scheduled" | "queued" | "publishing" | "published" | "partial" | "failed";
export type CampaignStatus = "draft" | "scheduled" | "review" | "live" | "rejected" | "paused" | "completed" | "partial";
export type ConnectionState = "ready" | "approval_needed" | "expired";
export type ChannelStatus = "draft" | "needs_approval" | "scheduled" | "queued" | "publishing" | "published" | "failed";
export type DemoMedia = { id: string; name: string; kind: MediaKind; url: string; type: string; bytes?: number; width?: number; height?: number; altText?: string };
export type Post = {
  id: string;
  title: string;
  text: string;
  variants: Partial<Record<PlatformId, string>>;
  channels: PlatformId[];
  media: DemoMedia[];
  mediaVariants?: Partial<Record<PlatformId, DemoMedia[]>>;
  youtubeTitle?: string;
  youtubePrivacy?: "public" | "private";
  sourcePostId?: string;
  writingContext?: { profileVersion: number; sourcePostIds: string[] };
  sampleMetricsReady?: boolean;
  sampleReportedAt?: string;
  status: PostStatus;
  channelStatus: Partial<Record<PlatformId, ChannelStatus>>;
  channelPublishedAt?: Partial<Record<PlatformId, string>>;
  scheduledAt?: string;
  timezone?: string;
  createdAt: string;
};
export type Campaign = {
  id: string;
  name: string;
  objective: "traffic";
  destination: string;
  audience: string;
  location: string;
  networks: AdNetworkId[];
  placements: Partial<Record<AdNetworkId, string[]>>;
  networkAudience?: Partial<Record<AdNetworkId, string>>;
  networkLocation?: Partial<Record<AdNetworkId, string>>;
  networkCreative?: Partial<Record<AdNetworkId, string>>;
  networkMedia?: Partial<Record<AdNetworkId, DemoMedia>>;
  networkStartAt?: Partial<Record<AdNetworkId, string>>;
  networkEndAt?: Partial<Record<AdNetworkId, string>>;
  budgets: Partial<Record<AdNetworkId, number>>;
  spent: Partial<Record<AdNetworkId, number>>;
  currency: string;
  startAt: string;
  endAt: string;
  creative: string;
  media: DemoMedia | null;
  status: CampaignStatus;
  networkStatus: Partial<Record<AdNetworkId, CampaignStatus>>;
  sampleMetricsReady?: boolean;
  sampleReportedAt?: string;
  createdAt: string;
};
type DemoState = {
  email: string;
  displayName: string;
  workspaceName: string;
  onboardingStep: number;
  connected: PlatformId[];
  adConnected: AdNetworkId[];
  connectionStates: Partial<Record<PlatformId, ConnectionState>>;
  adConnectionStates: Partial<Record<AdNetworkId, ConnectionState>>;
  weeklySlots: { day: number; time: string }[];
  timezone: string;
  onboardingDismissed: boolean;
  writingProfile: { enabled: boolean; topics: string; audience: string; goals: string; voice: string; preferredTerms: string; bannedTerms: string; examplePostIds: string[]; excludedPostIds: string[] };
  posts: Post[];
  campaigns: Campaign[];
  signIn: (email: string) => void;
  setDisplayName: (value: string) => void;
  setWorkspaceName: (value: string) => void;
  setOnboardingStep: (step: number) => void;
  toggleConnection: (id: PlatformId) => void;
  toggleAdConnection: (id: AdNetworkId) => void;
  setConnectionState: (id: PlatformId, value: ConnectionState) => void;
  setAdConnectionState: (id: AdNetworkId, value: ConnectionState) => void;
  setWeeklySlots: (slots: { day: number; time: string }[]) => void;
  setTimezone: (value: string) => void;
  setOnboardingDismissed: (value: boolean) => void;
  setWritingProfile: (value: Partial<DemoState["writingProfile"]>) => void;
  upsertPost: (post: Post) => void;
  removePost: (id: string) => void;
  setPostStatus: (id: string, status: PostStatus) => void;
  setChannelStatus: (id: string, channel: PlatformId, status: ChannelStatus) => void;
  upsertCampaign: (campaign: Campaign) => void;
  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  reset: () => void;
};

const initial = () => ({
  email: "",
  displayName: "",
  workspaceName: "",
  onboardingStep: 0,
  connected: [] as PlatformId[],
  adConnected: [] as AdNetworkId[],
  connectionStates: {} as Partial<Record<PlatformId, ConnectionState>>,
  adConnectionStates: {} as Partial<Record<AdNetworkId, ConnectionState>>,
  weeklySlots: [{ day: 1, time: "09:00" }, { day: 3, time: "09:00" }, { day: 5, time: "09:00" }],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  onboardingDismissed: false,
  writingProfile: { enabled: false, topics: "", audience: "", goals: "", voice: "", preferredTerms: "", bannedTerms: "", examplePostIds: [] as string[], excludedPostIds: [] as string[] },
  posts: [] as Post[],
  campaigns: [] as Campaign[],
});

export const useDemoStore = create<DemoState>((set) => ({
  ...initial(),
  signIn: (email) => set({ email, displayName: email.split("@")[0].replace(/[._-]/g, " ") }),
  setDisplayName: (displayName) => set({ displayName }),
  setWorkspaceName: (workspaceName) => set({ workspaceName }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  toggleConnection: (id) => set((state) => ({ connected: state.connected.includes(id) ? state.connected.filter((item) => item !== id) : [...state.connected, id] })),
  toggleAdConnection: (id) => set((state) => ({ adConnected: state.adConnected.includes(id) ? state.adConnected.filter((item) => item !== id) : [...state.adConnected, id] })),
  setConnectionState: (id, value) => set((state) => ({ connectionStates: { ...state.connectionStates, [id]: value } })),
  setAdConnectionState: (id, value) => set((state) => ({ adConnectionStates: { ...state.adConnectionStates, [id]: value } })),
  setWeeklySlots: (weeklySlots) => set({ weeklySlots }),
  setTimezone: (timezone) => set({ timezone }),
  setOnboardingDismissed: (onboardingDismissed) => set({ onboardingDismissed }),
  setWritingProfile: (value) => set((state) => ({ writingProfile: { ...state.writingProfile, ...value } })),
  upsertPost: (post) => set((state) => ({ posts: [post, ...state.posts.filter((item) => item.id !== post.id)] })),
  removePost: (id) => set((state) => ({ posts: state.posts.filter((post) => post.id !== id) })),
  setPostStatus: (id, status) => set((state) => ({ posts: state.posts.map((post) => post.id === id ? { ...post, status } : post) })),
  setChannelStatus: (id, channel, status) => set((state) => ({ posts: state.posts.map((post) => {
    if (post.id !== id) return post;
    const channelStatus = { ...post.channelStatus, [channel]: status };
    const values = post.channels.map((item) => channelStatus[item]);
    const overall: PostStatus = values.every((value) => value === "published") ? "published" : values.every((value) => value === "failed") ? "failed" : values.includes("failed") ? "partial" : values.includes("publishing") ? "publishing" : values.includes("queued") ? "queued" : values.includes("scheduled") ? "scheduled" : post.status;
    return { ...post, channelStatus, status: overall };
  }) })),
  upsertCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns.filter((item) => item.id !== campaign.id)] })),
  setCampaignStatus: (id, status) => set((state) => ({ campaigns: state.campaigns.map((campaign) => campaign.id === id ? { ...campaign, status } : campaign) })),
  reset: () => set(initial()),
}));

export const demoId = () => crypto.randomUUID();
