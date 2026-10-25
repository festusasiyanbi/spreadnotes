import test from "node:test";
import assert from "node:assert/strict";
import { postIssues } from "../features/platforms/catalog.ts";
import { campaignSnapshot, postSnapshot } from "../features/analytics/model.ts";

test("Instagram rejects an unsupported image format and aspect ratio before review", () => {
  const issues = postIssues("A caption", [{ kind: "image", type: "image/png", width: 400, height: 800 }], ["instagram"]);
  assert.ok(issues.some((issue) => issue.includes("JPEG")));
  assert.ok(issues.some((issue) => issue.includes("aspect ratio")));
});

test("sample video poster cannot be scheduled as a playable video", () => {
  const issues = postIssues("Watch this", [{ kind: "video", type: "video/demo" }], ["youtube"]);
  assert.ok(issues.some((issue) => issue.includes("preview only")));
});

test("TikTok photo posts do not claim Display API video analytics", () => {
  const post = { id: "p1", createdAt: new Date().toISOString(), channelStatus: { tiktok: "published" }, media: [{ kind: "image" }], sampleMetricsReady: true };
  assert.equal(postSnapshot(post, "tiktok"), null);
});

test("X owner-only clicks leave the 30-day reporting window", () => {
  const post = { id: "p2", createdAt: new Date().toISOString(), channelStatus: { x: "published" }, channelPublishedAt: { x: new Date(Date.now() - 31 * 86400000).toISOString() }, media: [], sampleMetricsReady: true };
  const snapshot = postSnapshot(post, "x");
  assert.ok(snapshot?.metrics.some((metric) => metric.key === "Impressions"));
  assert.ok(!snapshot?.metrics.some((metric) => metric.key === "URL clicks"));
});

test("ad reporting remains empty until a network has sample spend", () => {
  const campaign = { id: "c1", createdAt: new Date().toISOString(), networkStatus: { meta: "live" }, spent: { meta: 0 }, sampleMetricsReady: true };
  assert.equal(campaignSnapshot(campaign, "meta"), null);
  const ready = campaignSnapshot({ ...campaign, spent: { meta: 20 } }, "meta");
  assert.equal(ready?.metrics.find((metric) => metric.key === "Spend")?.value, 20);
  assert.ok((ready?.metrics.find((metric) => metric.key === "Clicks")?.value ?? 0) > 0);
});
