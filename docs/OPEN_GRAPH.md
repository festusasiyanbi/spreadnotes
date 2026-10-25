# Open Graph and social sharing

SpreadNotes has static sharing previews for its three current routes. The previews are brand-level images and never contain an email address, workspace, post, campaign, or other demo state.

## What is published

| Route | Share preview | Search indexing | Link behavior |
| --- | --- | --- | --- |
| `/` | Product introduction | Indexable, self canonical | Public landing page |
| `/sign-in` | Invitation to try the demo | `noindex, nofollow` | Demo entry page |
| `/demo` | Generic interactive demo preview | `noindex, nofollow` | Visitors without a demo session go to `/sign-in` |

Every route declares `og:title`, `og:type=website`, `og:url`, `og:image`, `og:description`, `og:site_name`, and `og:locale=en_US`. Each image has an alt description, PNG type, and 1200 × 630 dimensions. X receives a `summary_large_image` card with its own title, description, image, and image alt text. The home page also declares a canonical URL. These are server-rendered metadata tags, so sharing crawlers do not need to run the client-side demo.

The copy and route settings live in `features/seo/content.json`. `features/seo/metadata.ts` converts them to Next.js metadata; each route's `page.tsx` exports its metadata. Static PNGs and matching `.alt.txt` files in `app/`, `app/sign-in/`, and `app/demo/` supply the route-specific images. Next.js generates the final image URLs and image dimensions from those files. The vector mark used in the cards is `public/brand/spreadnotes-mark.svg`.

## Change a preview

1. Edit the route's title, description, image headline, subtitle, or alt text in `features/seo/content.json`. Keep headlines short enough to fit inside a 1200 × 630 card.
2. Run `npm run assets:og`. The script regenerates the three `public/brand/` exports and copies them to the route-specific Open Graph and X image files, along with their alt text.
3. Inspect the PNGs visually, then run `npm run typecheck` and `npm run build`.
4. For a new public route, add its copy to the JSON, export `pageMetadata("newKey")` from the route's server `page.tsx`, and generate its image. Extend the key typing or route logic as needed. Keep private or user-specific state out of static previews.

The images are generated at development time using Sharp. They are served as static files; opening a page does not run image rendering or call a paid service.

## Production site URL

Set `NEXT_PUBLIC_SITE_URL` in the deployment environment to the **public HTTPS origin**, for example `https://your-actual-domain.example`. Do not include a page path, query, or fragment. Redeploy after changing it. Local development defaults to `http://localhost:3000`.

The value supplies the absolute `og:url`, canonical, and generated image URLs. A production build without this variable can emit `localhost` URLs, which external sharing crawlers cannot fetch. Do not publish a deployment until its HTML shows the real origin and the image URLs return publicly over HTTPS. The project's real production domain has not yet been selected.

## Release check

Run `npm run check:og -- https://your-actual-domain.example` against the deployed site. For local testing while `npm run dev` is running, use `npm run check:og -- http://localhost:3000`. This checks the served tags and both image responses for every current route.

For `/`, `/sign-in`, and `/demo` on the deployed origin:

1. View the page source or fetch its HTML. Check title, description, `og:type`, `og:url`, `og:image`, `og:image:alt`, X card fields, and the route's indexing policy. The home page must have a self canonical.
2. Open each `og:image` and `twitter:image` URL in a fresh browser session. Confirm HTTP 200, PNG content, 1200 × 630 dimensions, and the correct route-specific card. No authentication should be needed to fetch these files.
3. Paste each public URL into the sharing debugger for the target platform. If an old image appears, request a refresh there because platforms may cache previews. A localhost preview cannot be tested from an external debugger.
4. Confirm that `/demo` without an in-memory session takes the visitor to `/sign-in` and that no personal demo content appears in HTML metadata or images.

Open Graph describes a **shared page**, not posts or advertisements that users create in SpreadNotes. Per-post share cards are intentionally absent until the product has a backend, public post URLs, access controls, and a privacy model.

References: [Open Graph protocol](https://ogp.me/), [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [Next.js image file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image).
