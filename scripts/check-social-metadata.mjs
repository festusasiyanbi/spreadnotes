import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = JSON.parse(await readFile(join(root, "features/seo/content.json"), "utf8"));
const origin = new URL(process.argv[2] || "http://localhost:3000");

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

for (const page of Object.values(pages)) {
  const pageUrl = new URL(page.path, origin);
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
  assert.equal(new URL(singleMeta(meta, "og:url")).pathname, page.path);
  assert.equal(new URL(singleMeta(meta, "og:url")).origin, origin.origin);
  assert.equal(singleMeta(meta, "og:image:alt"), page.imageAlt);
  assert.equal(singleMeta(meta, "og:image:type"), "image/png");
  assert.equal(singleMeta(meta, "og:image:width"), "1200");
  assert.equal(singleMeta(meta, "og:image:height"), "630");
  assert.equal(singleMeta(meta, "twitter:card"), "summary_large_image");
  assert.equal(singleMeta(meta, "twitter:title"), page.title);
  assert.equal(singleMeta(meta, "twitter:description"), page.description);
  assert.equal(singleMeta(meta, "twitter:image:alt"), page.imageAlt);
  assert.equal(singleMeta(meta, "twitter:image:type"), "image/png");

  if (page.indexable) {
    assert.equal(canonical.length, 1, `${page.path} must have one canonical URL`);
    assert.equal(new URL(canonical[0].href).origin, origin.origin);
    assert.equal(new URL(canonical[0].href).pathname, page.path);
    assert.ok(!meta.some((tag) => tag.name === "robots" && tag.content.includes("noindex")));
  } else {
    assert.equal(canonical.length, 0, `${page.path} should not set a canonical URL`);
    assert.match(singleMeta(meta, "robots"), /noindex/);
    assert.match(singleMeta(meta, "robots"), /nofollow/);
  }

  for (const key of ["og:image", "twitter:image"]) {
    const imageUrl = new URL(singleMeta(meta, key));
    assert.equal(imageUrl.origin, origin.origin, `${key} points to another origin`);
    const imageResponse = await fetch(imageUrl);
    assert.equal(imageResponse.status, 200, `${key} did not return HTTP 200`);
    assert.match(imageResponse.headers.get("content-type") || "", /^image\/png/);
    const image = sharp(Buffer.from(await imageResponse.arrayBuffer()));
    const { width, height } = await image.metadata();
    assert.deepEqual([width, height], [1200, 630]);
  }

  console.log(`✓ ${page.path} metadata and images`);
}
