# Open Graph and social sharing

SpreadNotes serves static, brand-level preview images. They never include a visitor's email, workspaces, posts, campaigns, or other in-memory content.

| Host and route | Purpose | Search indexing |
| --- | --- | --- |
| `spreadnotes.app/` | Public product page | Indexable, self canonical |
| `app.spreadnotes.app/sign-in` | Workspace sign-in | `noindex, nofollow` |
| `app.spreadnotes.app/` | Interactive workspace | `noindex, nofollow` |
| `staging.spreadnotes.app/` | Test workspace | `noindex, nofollow` |

The workspace is implemented at `/workspace` internally. The root `proxy.ts` rewrites the exact app and staging hosts there. Local development can open `/workspace` directly. The marketing host redirects `/sign-in` to the app host. The former `/demo` path redirects to staging; on localhost, it redirects to `/workspace`. Asset requests bypass the hostname rewrite. Proxy routing is not authentication.

Pages declare Open Graph title, description, URL, site name, locale, type, image and image alt text, plus X's large-image card. The public page has a canonical URL; sign-in and workspace pages are excluded from indexing. `features/seo/content.json` holds copy and `features/seo/metadata.ts` builds metadata. The image files under `app/`, `app/sign-in/`, and `app/workspace/` are generated static 1200 × 630 PNGs. The app and staging workspace share the same illustration but produce host-specific `og:url` values.

## Updating images

1. Edit the page copy and image text in `features/seo/content.json`.
2. Run `npm run assets:og` to regenerate the PNG and alt-text files.
3. Inspect the generated images, then run `npm run typecheck` and `npm run build`.

Image generation uses Sharp during development. Visiting the site does not call an image service. The images describe the product, not social posts created in the workspace.

## Deployment and release checks

The production public origin defaults to `https://spreadnotes.app`; set `NEXT_PUBLIC_SITE_URL` if deploying the marketing site elsewhere. Set `NEXT_PUBLIC_APP_ORIGIN` and `NEXT_PUBLIC_STAGING_ORIGIN` when links should point to different app or staging hosts. Configure the three hostnames on the same Next.js deployment while this UI simulation is shared.

After deployment, run `npm run check:og -- https://spreadnotes.app`. The checker visits the public page and both product hosts, validates `og:url`, X card fields, indexing policy, and the public canonical URL, then opens each image and checks its dimensions. For a local server, pass its local URL instead. Also confirm marketing `/sign-in`, legacy `/demo`, and app/staging root routing. Public debugger previews may need refreshing because social platforms cache images.

References: [Open Graph protocol](https://ogp.me/), [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy).
