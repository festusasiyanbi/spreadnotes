# Open Graph and social sharing

SpreadNotes serves static, brand-level preview images. They never include a visitor's email, workspaces, posts, campaigns, or other in-memory content.

| Host and route | Purpose | Search indexing |
| --- | --- | --- |
| `spreadnotes.app/` | Public product page | Indexable, self canonical |
| `app.spreadnotes.app/sign-in` | Workspace sign-in | `noindex, nofollow` |
| `app.spreadnotes.app/` | Interactive workspace | `noindex, nofollow` |
| `staging.spreadnotes.app/` | Test workspace | `noindex, nofollow` |

The workspace is implemented at `/workspace` internally. The root `proxy.ts` rewrites the exact app and staging hosts there. Local development uses `http://localhost:3000/` for marketing and `http://staging.localhost:3000/` for the workspace. Local marketing `/sign-in`, legacy `/workspace` and `/demo` entry points redirect to local staging; `app.localhost` also redirects there. The production marketing host redirects `/sign-in` to the app host, and production `/demo` redirects to staging. Asset requests bypass the hostname rewrite. Proxy routing is not authentication.

Vercel preview deployments use their own `*.vercel.app` host in `og:url`, `og:image`, and `twitter:image`, so link previews work before the custom domain is configured. Preview pages are `noindex` and have no production canonical URL. The custom-domain page uses its own host once public DNS resolves.

Pages declare Open Graph title, description, URL, site name, locale, type, and an absolute image URL with dimensions and alt text, plus X's large-image card. The public page has a canonical URL; sign-in and workspace pages are excluded from indexing. `features/seo/content.json` holds copy and `features/seo/metadata.ts` builds metadata. The image files under `public/brand/` are generated static 1200 × 630 PNGs. The app and staging workspace share the same illustration but produce host-specific metadata URLs.

## Updating images

1. Edit the page copy and image text in `features/seo/content.json`.
2. Run `npm run assets:og` to regenerate the PNG files. Alt text comes from the same content file at render time.
3. Inspect the generated images, then run `npm run typecheck` and `npm run build`.

Image generation uses Sharp during development. Visiting the site does not call an image service. The images describe the product, not social posts created in the workspace.

## Deployment and release checks

The production public origin defaults to `https://spreadnotes.app`; set `NEXT_PUBLIC_SITE_URL` if deploying the marketing site elsewhere. Set `NEXT_PUBLIC_APP_ORIGIN` and `NEXT_PUBLIC_STAGING_ORIGIN` when links should point to different app or staging hosts. Configure the three hostnames on the same Next.js deployment while this UI simulation is shared.

After deployment, run `npm run check:og -- https://spreadnotes.app` when its DNS is active. The checker visits the public page and both product hosts, validates `og:url`, X card fields, indexing policy, and the public canonical URL, then opens each image and checks its dimensions. For a local server, pass its local URL instead. For a Vercel preview, inspect the preview page's raw metadata and request its image URL directly; its image must use the preview host. Also confirm marketing `/sign-in`, legacy `/demo`, and app/staging root routing. Public debugger previews may need refreshing because social platforms cache images.

References: [Open Graph protocol](https://ogp.me/), [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy).
