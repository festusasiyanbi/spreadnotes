"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { demoId, type Post, useDemoStore } from "../demo/store";

export function QuickCreate({ onEditPost }: { onEditPost: (id: string) => void }) {
  const { connected, connectionStates, upsertPost } = useDemoStore();
  const [thought, setThought] = useState("");
  function start() {
    if (!thought.trim()) return;
    const id = demoId();
    const channels = connected.filter((channel) => (connectionStates[channel] ?? "ready") === "ready");
    const post: Post = { id, title: thought.trim().split("\n")[0].slice(0, 56), text: thought.trim(), variants: {}, channels, media: [], status: "draft", channelStatus: Object.fromEntries(channels.map((channel) => [channel, "draft"])), createdAt: new Date().toISOString() };
    upsertPost(post);
    onEditPost(id);
  }
  return <section className="panel-card padded quick-create"><div><span className="eyebrow">QUICK CREATE</span><h3>Catch the thought now.</h3><p>Start a draft here, then finish channel versions in the full composer.</p></div><label htmlFor="quick-thought">Your idea</label><textarea id="quick-thought" value={thought} onChange={(event) => setThought(event.target.value)} placeholder="What would you like to share?" maxLength={3000} /><button className="button button-primary" disabled={!thought.trim()} onClick={start}>Continue in composer <ArrowRight size={17} /></button></section>;
}
