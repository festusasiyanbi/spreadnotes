import test from "node:test";
import assert from "node:assert/strict";
import { generateWriting } from "../features/ai/writing.ts";

const profile = { enabled: false, topics: "", audience: "", goals: "", voice: "", preferredTerms: "", bannedTerms: "", examplePostIds: [], excludedPostIds: [] };

test("basic post and ad suggestions work without a voice profile", () => {
  const post = generateWriting({ mode: "create", target: "post", source: "", brief: "small teams", generation: 0, profile, examples: [] });
  const ad = generateWriting({ mode: "create", target: "campaign", source: "", brief: "clear planning", generation: 0, profile, examples: [] });
  assert.match(post, /small teams/);
  assert.match(ad, /clear planning/);
});

test("regeneration changes local copy and profile exclusions apply", () => {
  const first = generateWriting({ mode: "rewrite", target: "post", source: "A new idea", brief: "", generation: 0, profile, examples: [] });
  const second = generateWriting({ mode: "rewrite", target: "post", source: "A new idea", brief: "", generation: 1, profile, examples: [] });
  assert.notEqual(first, second);
  const personalized = generateWriting({ mode: "create", target: "campaign", source: "", brief: "launch", generation: 0, profile: { ...profile, enabled: true, preferredTerms: "simple", bannedTerms: "today" }, examples: [] });
  assert.match(personalized, /simple/);
  assert.doesNotMatch(personalized, /today/i);
});
