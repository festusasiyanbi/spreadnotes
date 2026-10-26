import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = JSON.parse(await readFile(join(root, "features/seo/content.json"), "utf8"));
const mark = await sharp(join(root, "public/brand/spreadnotes-mark.svg"))
  .resize(158, 158)
  .png()
  .toBuffer();

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function cardSvg(page) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#faf7f0"/>
    <rect x="46" y="46" width="1108" height="538" rx="22" fill="#fffdf9" stroke="#e4dce0" stroke-width="2"/>
    <text x="250" y="205" fill="#2b1233" font-family="Arial,Helvetica,sans-serif" font-size="80" font-weight="700" letter-spacing="-4">SpreadNotes<tspan fill="#8000a0">.</tspan></text>
    <text x="105" y="357" fill="#2b1233" font-family="Arial,Helvetica,sans-serif" font-size="55" font-weight="700" letter-spacing="-2">${escapeXml(page.imageTitle)}</text>
    <text x="105" y="427" fill="#514353" font-family="Arial,Helvetica,sans-serif" font-size="27">${escapeXml(page.imageSubtitle)}</text>
    <rect x="105" y="497" width="109" height="7" rx="3.5" fill="#8000a0"/>
  </svg>`;
}

for (const page of Object.values(pages)) {
  const publicImage = join(root, "public/brand", page.imageFile);
  await sharp(Buffer.from(cardSvg(page)))
    .composite([{ input: mark, left: 100, top: 95 }])
    .png({ compressionLevel: 9 })
    .toFile(publicImage);
}

console.log("Generated home, sign-in, and simulation Open Graph and X preview images.");
