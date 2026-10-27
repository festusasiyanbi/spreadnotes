import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(root, "public", "video-core");
const source = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");
await mkdir(destination, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  await copyFile(join(source, file), join(destination, file));
}
const wrapper = join(root, "node_modules", "@ffmpeg", "ffmpeg", "dist", "umd");
for (const file of ["ffmpeg.js", "814.ffmpeg.js"]) {
  await copyFile(join(wrapper, file), join(destination, file));
}
