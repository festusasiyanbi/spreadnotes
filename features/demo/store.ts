"use client";

import { create } from "zustand";
import type { AdNetworkId, MediaKind, PlatformId } from "../platforms/types";

export type PostStatus = "draft" | "scheduled" | "queued" | "publishing" | "published" | "partial" | "failed" | "handoff";
export type CampaignStatus = "draft" | "scheduled" | "review" | "live" | "rejected" | "paused" | "completed" | "partial";
export type DemoMedia = { id: string; name: string; kind: MediaKind; url: string; type: string };
export type Post = {
  id: string;
  title: string;
  text: string;
  variants: Partial<Record<PlatformId, string>>;
  channels: PlatformId[];
  media: DemoMedia[];
  status: PostStatus;
  channelStatus: Partial<Record<PlatformId, "published" | "failed" | "handoff" | "scheduled" | "draft">>;
  scheduledAt?: string;
  createdAt: string;
};
export type Campaign = {
  id: string;
  name: string;
  objective: "traffic" | "awareness" | "engagement";
  destination: string;
  audience: string;
  location: string;
  networks: AdNetworkId[];
  placements: Partial<Record<AdNetworkId, string[]>>;
  budgets: Partial<Record<AdNetworkId, number>>;
  spent: Partial<Record<AdNetworkId, number>>;
  currency: string;
  startAt: string;
  endAt: string;
  creative: string;
  media: DemoMedia | null;
  status: CampaignStatus;
  networkStatus: Partial<Record<AdNetworkId, CampaignStatus>>;
  createdAt: string;
};
type DemoState = {
  email: string;
  displayName: string;
  workspaceName: string;
  onboardingStep: number;
  connected: PlatformId[];
  adConnected: AdNetworkId[];
  posts: Post[];
  campaigns: Campaign[];
  signIn: (email: string) => void;
  setDisplayName: (value: string) => void;
  setWorkspaceName: (value: string) => void;
  setOnboardingStep: (step: number) => void;
  toggleConnection: (id: PlatformId) => void;
  toggleAdConnection: (id: AdNetworkId) => void;
  upsertPost: (post: Post) => void;
  removePost: (id: string) => void;
  setPostStatus: (id: string, status: PostStatus) => void;
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
  upsertPost: (post) => set((state) => ({ posts: [post, ...state.posts.filter((item) => item.id !== post.id)] })),
  removePost: (id) => set((state) => ({ posts: state.posts.filter((post) => post.id !== id) })),
  setPostStatus: (id, status) => set((state) => ({ posts: state.posts.map((post) => post.id === id ? { ...post, status } : post) })),
  upsertCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns.filter((item) => item.id !== campaign.id)] })),
  setCampaignStatus: (id, status) => set((state) => ({ campaigns: state.campaigns.map((campaign) => campaign.id === id ? { ...campaign, status } : campaign) })),
  reset: () => set(initial()),
}));

export const demoId = () => crypto.randomUUID();
