# SpreadNotes

A frontend-only simulation of a social publishing and Ads workspace. It is a standalone product, separate from the FPA personal website.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Start at the public landing page, enter any valid email, and complete the three-step demo onboarding. All data is held in browser memory and resets on reload.

## Explore

- Compose a master post, choose connected channels, customize variants, add and reorder temporary media, preview every image in a multi-image post, and review each channel before a simulated save, schedule, or publish.
- The demo allows up to 10 media items in one post and checks selected channel constraints. X is limited to four images in this UI; YouTube requires video. Platform previews are illustrative and may differ from the final native rendering.
- Use the scenario selector on the review screen to explore success, partial failure, and retry states. Calendar and Library show the results.
- Build a separate Ads campaign for Meta, LinkedIn, and TikTok demo accounts. Set objective, destination, audience, placements, daily budgets, dates, and creative, then simulate platform review and delivery.
- Toggle light and dark appearance for the visit. The initial theme follows your device preference.

No real authentication, social connection, ad submission, payment, analytics, or external AI request is performed.

## Checks

```bash
npm run typecheck
npm run build
```
