# SpreadNotes

A standalone social publishing and advertising workspace. This release is a frontend simulation: no real authentication, social connections, posts, ad spend, requests, payments, or analytics requests are sent.

## Run locally

```bash
npm install
npm run dev
```

Open `/` for the public site and `/workspace` for the interactive workspace. `/sign-in` asks for a name and offers email/password, Google, and magic-link simulations before workspace creation. Passwords are not verified or stored, Google is not contacted, and magic links are not sent. The public “Request a demo” form confirms that a request was **not sent**. Data lives in browser memory for the current visit and resets on reload.

## Explore

- Connect sample social and ad accounts during onboarding; switch between separate in-memory workspaces.
- Compose a post for all eligible channels or selected channels, tailor text per platform, upload shared media, and inspect illustrative platform previews and compatibility feedback. The All destination toggle can clear every selection. Each preview uses that channel’s editable sample account name and handle from Connections. Nonempty edits autosave as a draft during the visit.
- Save drafts, schedule with the calendar and time selector, or simulate immediate publishing. Calendar and Library show the results.
- Create a simulated Meta, LinkedIn, or TikTok campaign with network-specific age and location choices, then review each network's audience, creative, timing, and issues before simulated submission.
- Explore analytics sample data, writing tools, and light or dark appearance.

The app supports up to 10 media items in a post, subject to each selected channel's limits. Platform previews are illustrative because native social interfaces and final rendering can change.

## Deployment hosts

| Host | Role |
| --- | --- |
| `spreadnotes.app` | Public marketing site |
| `app.spreadnotes.app` | Interactive workspace |
| `staging.spreadnotes.app` | Labelled test workspace |

Root `proxy.ts` maps app and staging roots to the internal `/workspace` route and redirects the former `/demo` path to staging. This routing does not enforce access control. Both product hosts show the same simulation until a backend is connected. See [Open Graph and social sharing](docs/open-graph.md) for metadata and asset checks.

## Local geographic reference data

Ad audience selectors use a bundled country, state/province, and city dataset. It is reference geography only; a listed place is **not** guaranteed targetable on any ad account. Future platform adapters must resolve the stored place codes and IDs against each network's account-specific targeting catalogue. The source and license are documented in [Geography data](docs/geo-data.md).

## Checks

```bash
npm run typecheck
npm test
npm run build
```
