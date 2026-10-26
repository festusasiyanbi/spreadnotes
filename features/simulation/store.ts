"use client";

import { create } from "zustand";
import type { AdNetworkId, MediaKind, PlatformId } from "../platforms/types";

export type PostStatus = "draft" | "needs_approval" | "scheduled" | "queued" | "publishing" | "published" | "partial" | "failed";
export type CampaignStatus = "draft" | "scheduled" | "review" | "live" | "rejected" | "paused" | "completed" | "partial";
export type ConnectionState = "ready" | "approval_needed" | "expired";
export type ChannelStatus = "draft" | "needs_approval" | "scheduled" | "queued" | "publishing" | "published" | "failed";
export type SimulationMedia = { id: string; name: string; kind: MediaKind; url: string; type: string; bytes?: number; width?: number; height?: number; altText?: string };
export type GeoSelection = { countryCode: string; countryName: string; stateId?: string; stateName?: string; cityId?: string; cityName?: string };
export type AgeTarget = { min?: number; max?: number; groups?: string[] };
export type SocialProfile = { name: string; username: string };
export type AiOrigin = { kind: "post"; id: string; field: "text" | "variant"; channel?: PlatformId } | { kind: "campaign"; field: "creative" | "networkCreative"; network?: AdNetworkId };
export type AiSession = { origin?: AiOrigin; original: string; brief: string; channels: PlatformId[]; networks: AdNetworkId[]; suggestion: string; sourcePostIds: string[]; feedback: "useful" | "off-target" | null; generation: number; mode: "create" | "rewrite"; target: "post" | "campaign" };
export type Post = {
  id: string;
  title: string;
  text: string;
  variants: Partial<Record<PlatformId, string>>;
  channels: PlatformId[];
  media: SimulationMedia[];
  mediaVariants?: Partial<Record<PlatformId, SimulationMedia[]>>;
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
  geo?: GeoSelection;
  networkGeo?: Partial<Record<AdNetworkId, GeoSelection>>;
  networkAge?: Partial<Record<AdNetworkId, AgeTarget>>;
  networks: AdNetworkId[];
  placements: Partial<Record<AdNetworkId, string[]>>;
  networkAudience?: Partial<Record<AdNetworkId, string>>;
  networkLocation?: Partial<Record<AdNetworkId, string>>;
  networkCreative?: Partial<Record<AdNetworkId, string>>;
  networkMedia?: Partial<Record<AdNetworkId, SimulationMedia>>;
  networkStartAt?: Partial<Record<AdNetworkId, string>>;
  networkEndAt?: Partial<Record<AdNetworkId, string>>;
  budgets: Partial<Record<AdNetworkId, number>>;
  spent: Partial<Record<AdNetworkId, number>>;
  currency: string;
  startAt: string;
  endAt: string;
  creative: string;
  writingContext?: { profileVersion: number; sourcePostIds: string[] };
  media: SimulationMedia | null;
  status: CampaignStatus;
  networkStatus: Partial<Record<AdNetworkId, CampaignStatus>>;
  sampleMetricsReady?: boolean;
  sampleReportedAt?: string;
  createdAt: string;
};
type SimulationState = {
  email: string;
  displayName: string;
  workspaceName: string;
  onboardingStep: number;
  connected: PlatformId[];
  socialProfiles: Partial<Record<PlatformId, SocialProfile>>;
  adConnected: AdNetworkId[];
  adAccountNames: Partial<Record<AdNetworkId, string>>;
  connectionStates: Partial<Record<PlatformId, ConnectionState>>;
  adConnectionStates: Partial<Record<AdNetworkId, ConnectionState>>;
  weeklySlots: { day: number; time: string }[];
  timezone: string;
  onboardingDismissed: boolean;
  writingProfile: { enabled: boolean; topics: string; audience: string; goals: string; voice: string; preferredTerms: string; bannedTerms: string; examplePostIds: string[]; excludedPostIds: string[] };
  posts: Post[];
  campaigns: Campaign[];
  aiSession: AiSession | null;
  aiArea: "create" | "rewrite" | "voice";
  aiCampaignDraft: Partial<Campaign> | null;
  activeWorkspaceId: string;
  savedWorkspaces: Record<string, WorkspaceSnapshot>;
  createWorkspace: (name: string) => void;
  switchWorkspace: (id: string) => void;
  signIn: (email: string, name: string) => void;
  setSocialProfile: (id: PlatformId, profile: SocialProfile) => void;
  setDisplayName: (value: string) => void;
  setWorkspaceName: (value: string) => void;
  setOnboardingStep: (step: number) => void;
  toggleConnection: (id: PlatformId) => void;
  toggleAdConnection: (id: AdNetworkId) => void;
  setAdAccountName: (id: AdNetworkId, name: string) => void;
  setConnectionState: (id: PlatformId, value: ConnectionState) => void;
  setAdConnectionState: (id: AdNetworkId, value: ConnectionState) => void;
  setWeeklySlots: (slots: { day: number; time: string }[]) => void;
  setTimezone: (value: string) => void;
  setOnboardingDismissed: (value: boolean) => void;
  setWritingProfile: (value: Partial<SimulationState["writingProfile"]>) => void;
  setAiSession: (value: AiSession | null) => void;
  setAiArea: (value: SimulationState["aiArea"]) => void;
  setAiCampaignDraft: (value: Partial<Campaign> | null) => void;
  upsertPost: (post: Post) => void;
  upsertPostForWorkspace: (workspaceId: string, post: Post) => void;
  removePost: (id: string) => void;
  setPostStatus: (id: string, status: PostStatus) => void;
  setChannelStatus: (id: string, channel: PlatformId, status: ChannelStatus) => void;
  upsertCampaign: (campaign: Campaign) => void;
  upsertCampaignForWorkspace: (workspaceId: string, campaign: Campaign) => void;
  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  reset: () => void;
};

type WorkspaceSnapshot = Pick<SimulationState, "workspaceName" | "onboardingStep" | "connected" | "socialProfiles" | "adConnected" | "adAccountNames" | "connectionStates" | "adConnectionStates" | "weeklySlots" | "timezone" | "onboardingDismissed" | "writingProfile" | "posts" | "campaigns" | "aiSession" | "aiArea" | "aiCampaignDraft">;
const workspaceKeys = ["workspaceName", "onboardingStep", "connected", "socialProfiles", "adConnected", "adAccountNames", "connectionStates", "adConnectionStates", "weeklySlots", "timezone", "onboardingDismissed", "writingProfile", "posts", "campaigns", "aiSession", "aiArea", "aiCampaignDraft"] as const;
function snapshot(state: SimulationState): WorkspaceSnapshot {
  return Object.fromEntries(workspaceKeys.map((key) => [key, state[key]])) as WorkspaceSnapshot;
}

const initial = () => ({
  email: "",
  displayName: "",
  workspaceName: "",
  onboardingStep: 0,
  connected: [] as PlatformId[],
  socialProfiles: {} as Partial<Record<PlatformId, SocialProfile>>,
  adConnected: [] as AdNetworkId[],
  adAccountNames: {} as Partial<Record<AdNetworkId, string>>,
  connectionStates: {} as Partial<Record<PlatformId, ConnectionState>>,
  adConnectionStates: {} as Partial<Record<AdNetworkId, ConnectionState>>,
  weeklySlots: [{ day: 1, time: "09:00" }, { day: 3, time: "09:00" }, { day: 5, time: "09:00" }],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  onboardingDismissed: false,
  writingProfile: { enabled: false, topics: "", audience: "", goals: "", voice: "", preferredTerms: "", bannedTerms: "", examplePostIds: [] as string[], excludedPostIds: [] as string[] },
  posts: [] as Post[],
  campaigns: [] as Campaign[],
  aiSession: null as AiSession | null,
  aiArea: "create" as const,
  aiCampaignDraft: null as Partial<Campaign> | null,
  activeWorkspaceId: "workspace-default",
  savedWorkspaces: {} as Record<string, WorkspaceSnapshot>,
});

export const useSimulationStore = create<SimulationState>((set) => ({
  ...initial(),
  createWorkspace: (name) => set((state) => {
    const id = crypto.randomUUID();
    const fresh = initial();
    return { ...snapshot(fresh as SimulationState), workspaceName: name.trim(), onboardingStep: 1, activeWorkspaceId: id, savedWorkspaces: { ...state.savedWorkspaces, [state.activeWorkspaceId]: snapshot(state) } };
  }),
  switchWorkspace: (id) => set((state) => {
    if (id === state.activeWorkspaceId || !state.savedWorkspaces[id]) return state;
    const { [id]: target, ...other } = state.savedWorkspaces;
    return { ...target, activeWorkspaceId: id, savedWorkspaces: { ...other, [state.activeWorkspaceId]: snapshot(state) } };
  }),
  signIn: (email, name) => set({ email, displayName: name.trim() }),
  setSocialProfile: (id, profile) => set((state) => ({ socialProfiles: { ...state.socialProfiles, [id]: profile } })),
  setDisplayName: (displayName) => set({ displayName }),
  setWorkspaceName: (workspaceName) => set({ workspaceName }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
  toggleConnection: (id) => set((state) => ({ connected: state.connected.includes(id) ? state.connected.filter((item) => item !== id) : [...state.connected, id] })),
  toggleAdConnection: (id) => set((state) => ({ adConnected: state.adConnected.includes(id) ? state.adConnected.filter((item) => item !== id) : [...state.adConnected, id] })),
  setAdAccountName: (id, name) => set((state) => ({ adAccountNames: { ...state.adAccountNames, [id]: name } })),
  setConnectionState: (id, value) => set((state) => ({ connectionStates: { ...state.connectionStates, [id]: value } })),
  setAdConnectionState: (id, value) => set((state) => ({ adConnectionStates: { ...state.adConnectionStates, [id]: value } })),
  setWeeklySlots: (weeklySlots) => set({ weeklySlots }),
  setTimezone: (timezone) => set({ timezone }),
  setOnboardingDismissed: (onboardingDismissed) => set({ onboardingDismissed }),
  setWritingProfile: (value) => set((state) => ({ writingProfile: { ...state.writingProfile, ...value } })),
  setAiSession: (aiSession) => set({ aiSession }),
  setAiArea: (aiArea) => set({ aiArea }),
  setAiCampaignDraft: (aiCampaignDraft) => set({ aiCampaignDraft }),
  upsertPost: (post) => set((state) => ({ posts: [post, ...state.posts.filter((item) => item.id !== post.id)] })),
  upsertPostForWorkspace: (workspaceId, post) => set((state) => {
    if (workspaceId === state.activeWorkspaceId) return { posts: [post, ...state.posts.filter((item) => item.id !== post.id)] };
    const target = state.savedWorkspaces[workspaceId];
    if (!target) return state;
    return { savedWorkspaces: { ...state.savedWorkspaces, [workspaceId]: { ...target, posts: [post, ...target.posts.filter((item) => item.id !== post.id)] } } };
  }),
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
  upsertCampaignForWorkspace: (workspaceId, campaign) => set((state) => {
    if (workspaceId === state.activeWorkspaceId) return { campaigns: [campaign, ...state.campaigns.filter((item) => item.id !== campaign.id)] };
    const target = state.savedWorkspaces[workspaceId];
    if (!target) return state;
    return { savedWorkspaces: { ...state.savedWorkspaces, [workspaceId]: { ...target, campaigns: [campaign, ...target.campaigns.filter((item) => item.id !== campaign.id)] } } };
  }),
  setCampaignStatus: (id, status) => set((state) => ({ campaigns: state.campaigns.map((campaign) => campaign.id === id ? { ...campaign, status } : campaign) })),
  reset: () => set(initial()),
}));

export const simulationId = () => crypto.randomUUID();
