# SpreadNotes brand assets

The three-stroke mark is based on the site's current CSS logo. The SVG is the editable vector master; PNGs are ready-to-use exports.

| Asset | Use |
| --- | --- |
| `spreadnotes-mark.svg` and `spreadnotes-mark-{32,64,128,256,512,1024}.png` | Transparent primary mark |
| `spreadnotes-mark-dark.svg` / `spreadnotes-mark-dark-512.png` | Brighter mark for dark surfaces |
| `spreadnotes-mark-white.svg` / `spreadnotes-mark-white-512.png` | White mark for colored backgrounds |
| `spreadnotes-lockup.svg` / `spreadnotes-lockup-1320.png` | Horizontal logo for light backgrounds |
| `spreadnotes-lockup-dark.svg` / `spreadnotes-lockup-dark-1320.png` | Horizontal logo for dark backgrounds |
| `spreadnotes-app-{192,512}.png` | Square app icons with a warm background |
| `spreadnotes-maskable-512.png` | Safe-area icon for a future web app manifest |
| `spreadnotes-favicon-{16,32,48}.png` | Small browser-tab icons |
| `spreadnotes-social-*-1200x630.png` | Route-specific Open Graph and social sharing previews |

The installed site icons in `app/` (`favicon.ico`, `icon.png`, `icon.svg`, and `apple-icon.png`) come from the generated favicon set. The matching `public/site.webmanifest` references `public/web-app-manifest-{192x192,512x512}.png`. These are the live browser, Apple, and installable web app icons; the files in this folder remain the editable brand kit. Next.js also serves the route-specific `opengraph-image.png` and `twitter-image.png` files in `app/`.
Set `NEXT_PUBLIC_SITE_URL` to the deployed site's HTTPS origin so social previews use the correct absolute image URL. Local development defaults to `http://localhost:3000`.
See `docs/open-graph.md` for the route map, generation command, and release checks.

Primary colors: purple `#8000a0`, gold `#b18a48`, ink `#2b1233`, warm background `#faf7f0`. Use the transparent mark when a surface already provides its own background. Keep the mark centered and preserve its proportions. The horizontal lockup uses an Arial-compatible font for portable SVG rendering.
