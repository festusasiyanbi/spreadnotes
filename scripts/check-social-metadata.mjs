import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = JSON.parse(await readFile(join(root, "features/seo/content.json"), "utf8"));
const origin = new URL(process.argv[2] || "http://localhost:3000");
const local = ["localhost", "127.0.0.1"].includes(origin.hostname);
const preview = origin.hostname.endsWith(".vercel.app");
const localStaging = new URL(`${origin.protocol}//staging.localhost:${origin.port || "3000"}`);
const checks = local ? [
  { page: pages.home, url: new URL("/", origin) },
  { page: pages.signIn, url: new URL("/sign-in", localStaging) },
  { page: pages.workspace, url: new URL("/", localStaging) },
] : preview ? [
  { page: pages.home, url: new URL("/", origin) },
  { page: pages.signIn, url: new URL("/sign-in", origin) },
  { page: pages.workspace, url: new URL("/workspace", origin) },
] : [
  { page: pages.home, url: new URL("/", origin) },
  { page: pages.signIn, url: new URL("/sign-in", process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.spreadnotes.app") },
  { page: pages.workspace, url: new URL("/", process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.spreadnotes.app") },
  { page: pages.workspace, url: new URL("/", process.env.NEXT_PUBLIC_STAGING_ORIGIN || "https://staging.spreadnotes.app") },
];

function tags(html, element) {
  return [...html.matchAll(new RegExp(`<${element}\\s+[^>]*>`, "g"))].map(([tag]) =>
    Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value.replaceAll("&amp;", "&")]))
  );
}

function singleMeta(meta, key) {
  const matches = meta.filter((tag) => tag.property === key || tag.name === key);
  assert.equal(matches.length, 1, `Expected exactly one ${key} tag`);
  return matches[0].content;
}

for (const { page, url: pageUrl } of checks) {
  const response = await fetch(pageUrl);
  assert.equal(response.status, 200, `${page.path} did not return HTTP 200`);
  const html = await response.text();
  const meta = tags(html, "meta");
  const canonical = tags(html, "link").filter((tag) => tag.rel === "canonical");

  assert.equal(singleMeta(meta, "og:title"), page.title);
  assert.equal(singleMeta(meta, "og:description"), page.description);
  assert.equal(singleMeta(meta, "og:type"), "website");
  assert.equal(singleMeta(meta, "og:site_name"), "SpreadNotes");
  assert.equal(singleMeta(meta, "og:locale"), "en_US");
  assert.equal(new URL(singleMeta(meta, "og:url")).pathname, pageUrl.pathname);
  if (!local) assert.equal(new URL(singleMeta(meta, "og:url")).origin, pageUrl.origin);
  assert.equal(singleMeta(meta, "og:image:alt"), page.imageAlt);
  assert.equal(singleMeta(meta, "og:image:type"), "image/png");
  assert.equal(singleMeta(meta, "og:image:width"), "1200");
  assert.equal(singleMeta(meta, "og:image:height"), "630");
  assert.equal(singleMeta(meta, "twitter:card"), "summary_large_image");
  assert.equal(singleMeta(meta, "twitter:title"), page.title);
  assert.equal(singleMeta(meta, "twitter:description"), page.description);
  assert.equal(singleMeta(meta, "twitter:image:alt"), page.imageAlt);
  assert.equal(singleMeta(meta, "twitter:image:type"), "image/png");

  if (page.indexable && !preview) {
    assert.equal(canonical.length, 1, `${page.path} must have one canonical URL`);
    if (!local) assert.equal(new URL(canonical[0].href).origin, pageUrl.origin);
    assert.equal(new URL(canonical[0].href).pathname, page.path);
    assert.ok(!meta.some((tag) => tag.name === "robots" && tag.content.includes("noindex")));
  } else {
    assert.equal(canonical.length, 0, `${page.path} should not set a canonical URL`);
    assert.match(singleMeta(meta, "robots"), /noindex/);
    assert.match(singleMeta(meta, "robots"), /nofollow/);
  }

  for (const key of ["og:image", "twitter:image"]) {
    const imageUrl = new URL(singleMeta(meta, key));
    if (!local) assert.equal(imageUrl.origin, new URL(singleMeta(meta, "og:url")).origin, `${key} points to another origin`);
    const imageResponse = await fetch(local ? new URL(imageUrl.pathname + imageUrl.search, pageUrl.origin) : imageUrl);
    assert.equal(imageResponse.status, 200, `${key} did not return HTTP 200`);
    assert.match(imageResponse.headers.get("content-type") || "", /^image\/png/);
    const image = sharp(Buffer.from(await imageResponse.arrayBuffer()));
    const { width, height } = await image.metadata();
    assert.deepEqual([width, height], [1200, 630]);
  }

  console.log(`✓ ${pageUrl} metadata and images`);
}
