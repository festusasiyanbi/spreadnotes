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
  store.getState().upsertPost({ id: "post-one", title: "First", status: "draft" });
  store.getState().upsertCampaign({ id: "ad-one", name: "First campaign", status: "draft" });

  store.getState().createWorkspace("Second studio");
  const second = store.getState().activeWorkspaceId;
  assert.notEqual(second, first);
  assert.equal(store.getState().workspaceName, "Second studio");
  assert.deepEqual(store.getState().connected, []);
  assert.deepEqual(store.getState().socialProfiles, {});
  assert.deepEqual(store.getState().posts, []);
  assert.deepEqual(store.getState().campaigns, []);

  store.getState().upsertPostForWorkspace(first, { id: "post-one", title: "First", status: "published" });
  store.getState().upsertCampaignForWorkspace(first, { id: "ad-one", name: "First campaign", status: "scheduled" });
  assert.deepEqual(store.getState().posts, []);
  assert.deepEqual(store.getState().campaigns, []);

  store.getState().switchWorkspace(first);
  assert.deepEqual(store.getState().connected, ["linkedin"]);
  assert.deepEqual(store.getState().socialProfiles.linkedin, { name: "First account", username: "@first" });
  assert.equal(store.getState().posts[0].status, "published");
  assert.equal(store.getState().campaigns[0].status, "scheduled");
  store.getState().switchWorkspace(second);
  assert.deepEqual(store.getState().posts, []);
  store.getState().reset();
});
