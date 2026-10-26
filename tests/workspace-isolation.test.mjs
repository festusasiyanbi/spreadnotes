import test from "node:test";
import assert from "node:assert/strict";
import { useSimulationStore } from "../features/simulation/store.ts";

test("workspaces isolate connections, posts, campaigns, and delayed outcomes", () => {
  const store = useSimulationStore;
  store.getState().reset();
  const first = store.getState().activeWorkspaceId;
  store.getState().setWorkspaceName("First studio");
  store.getState().toggleConnection("linkedin");
  store.getState().setSocialProfile("linkedin", { name: "First account", username: "@first" });
  store.getState().toggleAdConnection("meta");
  store.getState().setAdAccountName("meta", "Primary advertiser (sample)");
  store.getState().upsertPost({ id: "post-one", title: "First", status: "draft" });
  store.getState().upsertCampaign({ id: "ad-one", name: "First campaign", status: "draft" });
  store.getState().setAiSession({ original: "First workspace copy", brief: "", channels: ["linkedin"], networks: [], suggestion: "First suggestion", sourcePostIds: [], feedback: "useful", generation: 0, mode: "rewrite", target: "post" });
  store.getState().setAiCampaignDraft({ name: "Unlisted first campaign", creative: "Draft copy" });

  store.getState().createWorkspace("Second studio");
  const second = store.getState().activeWorkspaceId;
  assert.notEqual(second, first);
  assert.equal(store.getState().workspaceName, "Second studio");
  assert.deepEqual(store.getState().connected, []);
  assert.deepEqual(store.getState().socialProfiles, {});
  assert.deepEqual(store.getState().adConnected, []);
  assert.deepEqual(store.getState().adAccountNames, {});
  assert.deepEqual(store.getState().posts, []);
  assert.deepEqual(store.getState().campaigns, []);
  assert.equal(store.getState().aiSession, null);
  assert.equal(store.getState().aiCampaignDraft, null);

  store.getState().upsertPostForWorkspace(first, { id: "post-one", title: "First", status: "published" });
  store.getState().upsertCampaignForWorkspace(first, { id: "ad-one", name: "First campaign", status: "scheduled" });
  assert.deepEqual(store.getState().posts, []);
  assert.deepEqual(store.getState().campaigns, []);

  store.getState().switchWorkspace(first);
  assert.deepEqual(store.getState().connected, ["linkedin"]);
  assert.deepEqual(store.getState().socialProfiles.linkedin, { name: "First account", username: "@first" });
  assert.deepEqual(store.getState().adConnected, ["meta"]);
  assert.equal(store.getState().adAccountNames.meta, "Primary advertiser (sample)");
  assert.equal(store.getState().posts[0].status, "published");
  assert.equal(store.getState().campaigns[0].status, "scheduled");
  assert.equal(store.getState().aiSession?.suggestion, "First suggestion");
  assert.equal(store.getState().aiCampaignDraft?.creative, "Draft copy");
  store.getState().switchWorkspace(second);
  assert.deepEqual(store.getState().posts, []);
  assert.equal(store.getState().aiSession, null);
  store.getState().reset();
});
