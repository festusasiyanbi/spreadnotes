# Codex project guide — SpreadNotes

## Current product boundary

The current application is a frontend-only, in-memory product simulation. It includes a public landing page, simulated email entry and workspace setup, an organic post journey, a calendar and library, simulated connections, an optional sample AI assistant, and a separate Ads campaign journey. Reloading resets the demo. No real account connection, publishing, upload, billing, or AI request occurs.

The first backend product slice is a calm publishing desk: authenticate, work inside a workspace, compose a master post, add supported media, select channels, preview variants, save drafts, and later publish through platform adapters. Ads are a distinct domain with ad account, audience, budget, schedule, creative, review, and delivery records.

The first public beta is invite-only and free. AI is optional and usage-capped. Direct integrations are added only when the platform API and approval path support the workflow; otherwise provide a manual handoff.

## Feature layout

Use feature-first modules such as:

```text
features/
  auth/
  workspaces/
  composer/
  media/
  previews/
  connections/
  publishing/
  platforms/
  ai/
  analytics/
```

Each feature should own its UI, state, validation, server operations, and tests where practical. Shared design primitives belong in `packages/ui`; shared domain types belong in `packages/shared` or `packages/platform-types`.

## Implementation rules

- Use lowercase kebab-case for new source, test, asset, data, and documentation filenames. Preserve required framework and conventional filenames.
- Keep `app/` routes thin.
- Use Zustand for client interaction state, not as a replacement for durable server state.
- Keep OAuth tokens and provider secrets server-only.
- Preserve the UI's clear distinction between demo activity and real integrations when adding the backend.
- Do not turn sample creative concepts into uploaded media or treat sample spending as actual billing.
- Apply workspace authorization to every read and write.
- Use one platform capability registry for validation, previews, and publishing.
- Make publishing idempotent and persist every publish attempt.
- Prefer Supabase Cron and Edge Functions before adding Redis or a dedicated worker.
- Store media in object storage, not Postgres.
- Keep AI actions user-confirmed, measurable, and budget-limited.
- Use accessible semantic HTML and responsive layouts.
- Keep analytics in the demo as clearly labelled sample data. Gate live organic and ads reporting by documented platform permissions, rate limits, and cost before connecting adapters.

## Validation

At minimum, run:

```text
npm run typecheck
npm run build
```

For feature work, also add or update focused unit, integration, or end-to-end tests and verify loading, empty, success, failure, retry, and authorization states.
