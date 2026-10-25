# SpreadNotes product adoption plan

Status: frontend simulation in progress. This document maps the product journey to the local UI. It does not authorize live publishing integrations, AI spending, analytics ingestion, or ad delivery.

## Product direction

SpreadNotes is a standalone product for preparing one idea, tailoring it to several channels, reviewing the result, and scheduling delivery. Keep its own identity. Borrow useful workflow patterns from Hypefury without copying its branding or filling the app with unfinished tools.

The current project is an interactive, frontend-only simulation. The carousel and channel preview update is already implemented. Future UI must have a plausible backend contract and clearly distinguish simulated behavior from real publishing.

## Phase 1 — Make publishing states unambiguous

- [x] Define one simulated direct-publishing lifecycle: draft, needs approval, scheduled, queued, publishing, published, partial failure, and failed.
- [x] Show the same status and scheduled time in Overview, Calendar, and Post Library.
- [x] Separate unscheduled drafts and writing suggestions from the confirmed publishing queue.
- [x] Add a compact queue with day groups and actions appropriate to each status.
- [x] Provide per-channel delivery details and retry only the failed channel.
- [ ] Verify desktop, tablet, and mobile layouts; keyboard use; visible focus; and empty/error states.

**Done when:** A user can explain what will publish, where, and when from any post card, and can recover from a simulated partial failure without duplicating successful deliveries.

## Phase 2 — Channel-specific preparation

- [x] Select multiple channels and edit each text variant.
- [x] Upload multiple images, reorder them, add alt text, and preview each channel.
- [x] Allow channel-specific media variants where formats differ; preserve a shared master asset set.
- [ ] Model image, video, PDF, aspect-ratio, size, count, caption, and account-eligibility rules as versioned platform capabilities.
- [ ] Explain unsupported combinations beside the affected channel and offer a clear resolution.
- [x] Add a compact quick-create entry point while retaining the full composer for detailed review.
- [ ] Test real device widths and long content with multi-image previews.

**Done when:** The review screen accurately describes the payload each selected channel would receive, including media order and any manual handoff.

## Phase 3 — Schedule and account settings

- [x] Split settings into General, Connections, Publishing, Schedule, Writing profile, and Workspace.
- [ ] Give each social account a status, owner, permissions summary, reconnection action, and disconnect flow. Simulation status and prerequisite summaries are present; real owner and OAuth flows remain backend work.
- [ ] Add account-specific posting defaults and weekly time slots with an explicit timezone. Weekly slots use the device timezone; account-specific defaults remain.
- [x] Let a user choose an exact time or the next available slot, with a final preview of resolved delivery times.
- [x] Add a short, dismissible onboarding checklist based on incomplete setup steps.
- [ ] Keep manager roles hidden until collaboration is functional and permission rules exist.

**Done when:** A user can see which account receives a post and how its scheduled time was determined.

## Phase 4 — History and repurposing

- [x] Search and filter previous SpreadNotes posts by channel, date, and status.
- [x] Duplicate a previous post into a new editable draft; retain a link to its source.
- [x] Add an explicit "Adapt for another channel" action that opens the composer with channel-specific previews.
- [ ] Allow imported platform history only where API access and user consent permit it; show source and import date.
- [x] Keep original published content immutable in history.

**Done when:** Reusing a post never silently republishes it or changes the original.

## Phase 5 — AI writing assistance

- [x] Add an opt-in Writing profile: topics, audience, goals, tone, preferred terms, banned terms, and selected example posts.
- [x] Show which prior SpreadNotes posts are eligible as examples and let users remove them.
- [ ] Generate a small batch of ideas on demand, then channel variants on demand.
- [x] Keep saved suggestions editable and in "needs approval" until a user explicitly approves them.
- [ ] Provide regenerate, discard, and useful/off-target feedback; disclose when there is too little history for voice matching.
- [x] Record the profile version and source post IDs for saved suggestions without exposing examples in public output.
- [ ] Add per-workspace request quotas, token ceilings, cancellation, result caching, and cost monitoring before enabling a paid model.

**Done when:** No AI action automatically schedules or publishes, and a user can understand and control the writing context used for each suggestion.

## Phase 6 — Backend and delivery

- [ ] Replace the in-memory simulation store with authenticated workspace and post APIs while retaining Zustand for local UI state.
- [ ] Store master content, channel variants, ordered assets, approvals, accounts, schedules, and per-channel delivery jobs separately.
- [ ] Use direct platform adapters only for approved integrations; provide manual handoff where direct publishing is unavailable.
- [ ] Queue jobs with idempotency keys, rate-limit handling, retries, audit events, and token refresh.
- [ ] Secure media in object storage and validate formats before sending them to platform APIs.
- [ ] Add status reconciliation and alerting for failed jobs before accepting real schedules.
- [ ] Launch one supported platform at a time through staging and end-to-end publish tests.

**Done when:** A scheduled post reaches its intended account once, and failures are visible and recoverable.

## Organic and paid analytics UI

- [x] Provide a distinct Analytics area for organic posts and Meta, LinkedIn, and TikTok ads, with account filters, date ranges, a sample trend, and post or campaign detail.
- [x] Use platform capability maps to show only supported sample metrics and explain permission, format, and reporting-window limits.
- [x] Keep simulated spend and performance clearly labelled; do not combine platform-specific view or click definitions into one cross-network total.
- [ ] Replace sample reports with approved, cached platform reporting adapters when the backend is built.

## Cost discipline

1. Finish core publishing without AI, engagement feeds, direct-message automation, or paid analytics.
2. Keep analytics as local sample UI first. Later, use each platform's own reporting API with cached reads rather than a paid analytics vendor.
3. Keep generated media and video conversion out of the first AI release; text suggestions are cheaper to run and simpler to review.
4. Generate only after an explicit user action; cache results and enforce per-workspace limits.
5. Import only user-approved history needed for writing examples instead of repeatedly processing an entire account.
6. Add a service only after its real API access, approval requirements, and operating cost are known.

## Deliberately later

- Automatic DMs, keyword engagement feeds, auto replies, evergreen reposting, and link-in-bio.
- Live cross-platform analytics ingestion, attribution, and conversion reporting.
- Live ad submission; keep the Ads workspace clearly in planning mode until separate ad-account permissions and review workflows are built.

## Next implementation slice

Complete the remaining responsive/device review, then add backend adapters one approved platform at a time. Keep Zustand for UI state and retain the current simulation-only paths until real authentication, publishing jobs, and reporting permissions are ready.
