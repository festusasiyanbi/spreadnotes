"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, type AppView } from "../shell/app-shell";
import { Onboarding } from "../onboarding/onboarding";
import { Dashboard } from "../dashboard/dashboard";
import { PostComposer } from "../composer/post-composer";
import { PostsLibrary } from "../publishing/posts-library";
import { CalendarView } from "../calendar/calendar-view";
import { Connections } from "../connections/connections";
import { AdsWorkspace } from "../ads/ads-workspace";
import { Analytics } from "../analytics/analytics";
import { Settings } from "../settings/settings";
import { AiHub } from "../ai/ai-hub";
import { useSimulationStore } from "./store";

export function SimulationApp() {
  const router = useRouter();
  const email = useSimulationStore((state) => state.email);
  const onboardingStep = useSimulationStore((state) => state.onboardingStep);
  const [view, setView] = useState<AppView>("home");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignFromAi, setCampaignFromAi] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => { if (!email) router.replace("/sign-in"); }, [email, router]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4300);
    return () => window.clearTimeout(timer);
  }, [notice]);
  if (!email) return <div className="simulation-loading">Opening SpreadNotes…</div>;
  if (onboardingStep < 3) return <Onboarding />;

  function navigate(next: AppView) {
    setView(next);
    if (next === "compose") setEditingPostId(null);
    if (next === "library") setSelectedPostId(null);
    if (next === "ads") { setEditingCampaignId(null); setCampaignFromAi(false); }
  }
  function openPost(id: string) { setSelectedPostId(id); setView("library"); }
  function editPost(id: string) { setEditingPostId(id); setView("compose"); }
  function openCampaign(id: string) { setEditingCampaignId(id); setCampaignFromAi(false); setView("ads"); }
  function returnToCampaign(id?: string) { setEditingCampaignId(id ?? null); setCampaignFromAi(!id); setView("ads"); }
  const content = {
    home: <Dashboard onNavigate={navigate} onOpenPost={openPost} onOpenCampaign={openCampaign} onEditPost={editPost} />,
    compose: <PostComposer key={editingPostId ?? "new"} postId={editingPostId} onNavigate={navigate} onNotice={setNotice} />,
    ai: <AiHub onOpenPost={editPost} onOpenCampaign={returnToCampaign} />,
    calendar: <CalendarView onOpenPost={openPost} onOpenCampaign={openCampaign} onNavigate={navigate} />,
    library: <PostsLibrary postId={selectedPostId} onEditPost={editPost} onNavigate={navigate} onNotice={setNotice} />,
    ads: <AdsWorkspace key={editingCampaignId ?? "ads"} campaignId={editingCampaignId} resumeAiDraft={campaignFromAi} onOpenCampaign={openCampaign} onNavigate={navigate} onNotice={setNotice} />,
    analytics: <Analytics onOpenPost={openPost} onOpenCampaign={openCampaign} />,
    connections: <Connections />,
    settings: <Settings onNotice={setNotice} onNavigate={navigate} />,
  } satisfies Record<AppView, React.ReactNode>;
  return <AppShell view={view} onNavigate={navigate}>{content[view]}{notice && <div className="toast" role="status">{notice}</div>}</AppShell>;
}
