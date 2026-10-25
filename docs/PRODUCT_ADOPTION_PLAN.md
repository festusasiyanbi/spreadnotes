# SpreadNotes product adoption plan

Status: planning. This document maps observations from the Hypefury review to SpreadNotes work. It does not authorize publishing integrations, AI spending, or ad delivery.

## Product direction

SpreadNotes is a standalone product for preparing one idea, tailoring it to several channels, reviewing the result, and scheduling delivery. Keep its own identity. Borrow useful workflow patterns from Hypefury without copying its branding or filling the app with unfinished tools.

The current project is an interactive, frontend-only simulation. The carousel and channel preview update is already implemented. Future UI must have a plausible backend contract and clearly distinguish simulated behavior from real publishing.

## Phase 1 — Make publishing states unambiguous

- [ ] Define one post lifecycle: draft, needs approval, scheduled, queued, publishing, published, partial failure, failed, and manual handoff.
- [ ] Show the same status and scheduled time in Overview, Calendar, and Post Library.
- [ ] Separate unscheduled drafts and AI suggestions from the confirmed publishing queue.
- [ ] Add a compact queue with day groups and actions appropriate to each status.
- [ ] Provide per-channel delivery details and retry only the failed channel.
- [ ] Verify desktop, tablet, and mobile layouts; keyboard use; visible focus; and empty/error states.

**Done when:** A user can explain what will publish, where, and when from any post card, and can recover from a simulated partial failure without duplicating successful deliveries.

## Phase 2 — Channel-specific preparation

- [x] Select multiple channels and edit each text variant.
- [x] Upload multiple images, reorder them, add alt text, and preview each channel.
- [ ] Allow channel-specific media variants where formats differ; preserve a shared master asset set.
- [ ] Model image, video, PDF, aspect-ratio, size, count, caption, and account-eligibility rules as versioned platform capabilities.
- [ ] Explain unsupported combinations beside the affected channel and offer a clear resolution.
- [ ] Add a compact quick-create entry point while retaining the full composer for detailed review.
- [ ] Test real device widths and long content with multi-image previews.

**Done when:** The review screen accurately describes the payload each selected channel would receive, including media order and any manual handoff.

## Phase 3 — Schedule and account settings

- [ ] Split settings into General, Connections, Publishing, Schedule, and Workspace; add AI only when that feature is introduced.
- [ ] Give each social account a status, owner, permissions summary, reconnection action, and disconnect flow.
- [ ] Add account-specific posting defaults and weekly time slots with an explicit timezone.
- [ ] Let a user choose an exact time or the next available slot, with a final preview of resolved delivery times.
- [ ] Add a short, dismissible onboarding checklist based on incomplete setup steps.
- [ ] Keep manager roles hidden until collaboration is functional and permission rules exist.

**Done when:** A user can see which account receives a post and how its scheduled time was determined.

## Phase 4 — History and repurposing

- [ ] Search and filter previous SpreadNotes posts by channel, date, and status.
- [ ] Duplicate a previous post into a new editable draft; retain a link to its source.
- [ ] Add an explicit "Adapt for another channel" action that opens the composer with channel-specific previews.
- [ ] Allow imported platform history only where API access and user consent permit it; show source and import date.
- [ ] Keep original published content immutable in history.

**Done when:** Reusing a post never silently republishes it or changes the original.

## Phase 5 — AI writing assistance

- [ ] Add an opt-in Writing profile: topics, audience, goals, tone, preferred terms, banned terms, and selected example posts.
- [ ] Show which prior posts are eligible as examples; let users exclude or delete them.
- [ ] Generate a small batch of ideas on demand, then channel variants on demand.
- [ ] Keep every result editable and in "needs approval" until a user explicitly approves it.
- [ ] Provide regenerate, discard, and useful/off-target feedback; disclose when there is too little history for voice matching.
- [ ] Record the prompt/profile version and source post IDs for reproducibility without exposing private examples in public output.
- [ ] Add per-workspace request quotas, token ceilings, cancellation, result caching, and cost monitoring before enabling a paid model.

**Done when:** No AI action automatically schedules or publishes, and a user can understand and control the writing context used for each suggestion.

## Phase 6 — Backend and delivery

- [ ] Replace the in-memory demo store with authenticated workspace and post APIs while retaining Zustand for local UI state.
- [ ] Store master content, channel variants, ordered assets, approvals, accounts, schedules, and per-channel delivery jobs separately.
- [ ] Use direct platform adapters only for approved integrations; provide manual handoff where direct publishing is unavailable.
- [ ] Queue jobs with idempotency keys, rate-limit handling, retries, audit events, and token refresh.
- [ ] Secure media in object storage and validate formats before sending them to platform APIs.
- [ ] Add status reconciliation and alerting for failed jobs before accepting real schedules.
- [ ] Launch one supported platform at a time through staging and end-to-end publish tests.

**Done when:** A scheduled post reaches its intended account once, and failures are visible and recoverable.

## Cost discipline

1. Finish core publishing without AI, engagement feeds, direct-message automation, or paid analytics.
2. Use the platform's own insights rather than building analytics ingestion initially.
3. Keep generated media and video conversion out of the first AI release; text suggestions are cheaper to run and simpler to review.
4. Generate only after an explicit user action; cache results and enforce per-workspace limits.
5. Import only user-approved history needed for writing examples instead of repeatedly processing an entire account.
6. Add a service only after its real API access, approval requirements, and operating cost are known.

## Deliberately later

- Automatic DMs, keyword engagement feeds, auto replies, evergreen reposting, and link-in-bio.
- Detailed cross-platform analytics.
- Live ad submission; keep the Ads workspace clearly in planning mode until separate ad-account permissions and review workflows are built.

## Next implementation slice

Start with **Phase 1**. It makes the existing simulation coherent and creates the state model needed for future backend work. Review the lifecycle and queue UI before coding Phases 3–6.
