const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 180;
const MAX_WEBP_SECONDS = 15;

export { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MAX_WEBP_SECONDS };
export type ExportFormat = "mp4" | "mov" | "webm" | "webp";

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;
declare global { interface Window { FFmpegWASM?: { FFmpeg: new () => FFmpegInstance } } }

async function loadWrapper(): Promise<new () => FFmpegInstance> {
  if (window.FFmpegWASM?.FFmpeg) return window.FFmpegWASM.FFmpeg;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/video-core/ffmpeg.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("The local video editor could not be loaded."));
    document.head.append(script);
  });
  if (!window.FFmpegWASM?.FFmpeg) throw new Error("The local video editor is unavailable.");
  return window.FFmpegWASM.FFmpeg;
}

export async function trimVideo(file: File, start: number, end: number | null, onProgress: (progress: number) => void, signal?: AbortSignal, format: ExportFormat = "mp4"): Promise<File> {
  if (!Number.isFinite(start) || start < 0 || end !== null && (!Number.isFinite(end) || end <= start)) throw new Error("Choose a valid start and end time.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("This video exceeds the 75 MB local editing limit.");
  if (format === "webp" && end !== null && end - start > MAX_WEBP_SECONDS) throw new Error("Animated WebP is limited to 15 seconds. Shorten the selection or choose a video format.");
  const FFmpeg = await loadWrapper();
  const ffmpeg = new FFmpeg();
  const recentLogs: string[] = [];
  ffmpeg.on("log", ({ message }) => { recentLogs.push(message); if (recentLogs.length > 12) recentLogs.shift(); });
  const abort = () => ffmpeg.terminate();
  signal?.addEventListener("abort", abort, { once: true });
  ffmpeg.on("progress", ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))));
  const input = `input.${file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webm"}`;
  const output = `trimmed.${format}`;
  const codecArgs = format === "webp"
    ? ["-an", "-vf", "fps=8,scale=640:-2", "-c:v", "libwebp_anim", "-loop", "0"]
    : format === "webm"
      ? ["-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "5", "-b:v", "1M", "-c:a", "libopus"]
      : ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart"];
  const mime = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", webp: "image/webp" }[format];
  try {
    if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
    await ffmpeg.load({ coreURL: "/video-core/ffmpeg-core.js", wasmURL: "/video-core/ffmpeg-core.wasm" });
    if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
    await ffmpeg.writeFile(input, new Uint8Array(await file.arrayBuffer()));
    const clipSeconds = end === null ? format === "webp" ? MAX_WEBP_SECONDS : null : end - start;
    const result = await ffmpeg.exec(["-ss", start.toFixed(3), "-i", input, ...(clipSeconds === null ? [] : ["-t", clipSeconds.toFixed(3)]), ...codecArgs, output]);
    if (result !== 0) throw new Error(`The ${format.toUpperCase()} export failed: ${recentLogs.slice(-3).join(" ").slice(0, 280) || "this browser could not process the file"}`);
    const data = await ffmpeg.readFile(output);
    if (typeof data === "string") throw new Error("The exported video was unreadable.");
    const bytes = new Uint8Array(data.byteLength);
    bytes.set(data);
    onProgress(1);
    return new File([bytes], `${file.name.replace(/\.[^.]+$/, "")}-export.${format}`, { type: mime });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    const detail = recentLogs.slice(-3).join(" ").slice(0, 280);
    throw new Error(detail || (cause instanceof Error ? cause.message : `The ${format.toUpperCase()} encoder is unavailable on this device.`));
  } finally {
    signal?.removeEventListener("abort", abort);
    ffmpeg.terminate();
  }
}
