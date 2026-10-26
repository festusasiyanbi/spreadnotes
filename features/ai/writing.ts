import type { Post } from "../simulation/store";

export type WritingProfile = { enabled: boolean; topics: string; audience: string; goals: string; voice: string; preferredTerms: string; bannedTerms: string; examplePostIds: string[]; excludedPostIds: string[] };

export function eligibleExamples(posts: Post[], profile: WritingProfile) {
  return posts.filter((post) => post.status === "published" && profile.examplePostIds.includes(post.id) && !profile.excludedPostIds.includes(post.id));
}

// Deterministic local copy makes the simulated interaction honest and free of model calls.
export function generateIdea(profile: WritingProfile, examples: Post[], variant = 0) {
  const topic = profile.topics.split(",").map((item) => item.trim()).find(Boolean) ?? "your next idea";
  const audience = profile.audience.trim() || "your audience";
  const goal = profile.goals.trim() || "make the next step clearer";
  const example = examples[0];
  const opening = example ? `A thought worth revisiting: ${example.title.replace(/[.!?]$/, "")}.` : `Here is a thought about ${topic}.`;
  const preferred = profile.preferredTerms.split(",").map((item) => item.trim()).find(Boolean);
  const detail = preferred ? `Keep ${preferred} in focus.` : "Use one concrete example.";
  const endings = profile.voice.toLowerCase().includes("warm") ? "I’d love to hear what has worked for you." : "What would you try next?";
  const versions = [
    `${opening}\n\nWhat could help ${audience} ${goal}? ${detail} ${endings}`,
    `For ${audience}, ${topic} can start with a simple question: what makes the next step easier?\n\n${detail} ${endings}`,
    `One practical thought about ${topic}: ${goal}.\n\n${detail} Share a specific example and invite a response.`,
  ];
  const text = versions[variant % versions.length];
  const banned = profile.bannedTerms.split(",").map((item) => item.trim()).filter(Boolean);
  return banned.reduce((result, term) => result.replaceAll(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[edit this phrase]"), text);
}

export function generateWriting(input: { mode: "create" | "rewrite"; target: "post" | "campaign"; source: string; brief: string; generation: number; profile: WritingProfile; examples: Post[] }) {
  const { mode, target, source, brief, generation, profile, examples } = input;
  const clean = source.trim();
  const topic = brief.trim() || profile.topics.trim() || (target === "campaign" ? "your offer" : "your idea");
  let result: string;
  if (mode === "create") {
    result = target === "post" ? generateIdea({ ...profile, topics: topic }, examples, generation) : [
      `Make the next step easier with ${topic}. See what is possible and explore the details today.`,
      `Looking for a simpler way forward? Discover ${topic} and find the right fit for you.`,
      `${topic}: a clear next step for people ready to get started. Learn more today.`,
    ][generation % 3];
  } else {
    result = [
      `${clean}\n\n${target === "post" ? "What would you try next?" : "Explore the details today."}`,
      `${clean.split(/[.!?]/)[0].trim()}. ${target === "post" ? "Share your perspective." : "Learn more today."}`,
      `${clean}\n\n${target === "post" ? "Here is one practical place to start." : "Take the next step when you are ready."}`,
    ][generation % 3];
  }
  if (!profile.enabled) return result;
  const preferred = profile.preferredTerms.split(",").map((term) => term.trim()).find(Boolean);
  if (preferred && !result.toLowerCase().includes(preferred.toLowerCase())) result += `\n\n${preferred}.`;
  for (const term of profile.bannedTerms.split(",").map((item) => item.trim()).filter(Boolean)) result = result.replaceAll(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[edit this phrase]");
  return result;
}
