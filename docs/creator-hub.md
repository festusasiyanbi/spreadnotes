# Creator Hub

## Working local release

The Creator Hub records a browser screen, camera, or both; imports a video; trims a short interval locally; downloads the finished file; and can attach it to an editable post draft. The Hub stays mounted while the user navigates the workspace, and a recording dock provides pause, resume, stop, and return controls from other screens. Entire-screen capture can continue while the user works in another tab or app as long as the SpreadNotes browser tab stays open. Sharing a single browser tab follows only that tab unless the browser offers its switch-sharing control. The browser chooses the actual capture source, so the UI identifies what was selected. Replacing or closing the SpreadNotes tab ends browser capture. Screen-plus-camera compositing uses a timer fallback while backgrounded because browsers pause animation frames in hidden tabs; frame rate may still drop under browser throttling.

Capture uses `MediaRecorder`. A locally served, lazily loaded FFmpeg WebAssembly worker exports MP4, QuickTime MOV, WebM (VP8/Opus), and silent animated WebP. WebP exports are limited to 15 seconds. The worker assets are copied from installed packages into ignored `public/video-core/` files before development and production builds, so no third-party CDN is needed at runtime.

Recording and editing are limited to three minutes and 75 MB. The browser chooses screen sources and available audio. Unsupported mobile screen capture falls back to camera recording or import. Recordings stay in browser memory; a reload loses them, so the UI warns before leaving with unsaved work. Users can choose a frame from the finished video as its SpreadNotes preview thumbnail; that choice does not change the downloaded file or guarantee a social platform cover. Download and post handoff are real local actions. Account connections and publishing remain simulated.

MediaRecorder WebM files can omit readable duration metadata. For a recording made here, the editor uses its measured active recording time so trim controls remain available. Imported files with unknown duration can still select MP4, MOV, WebM, or animated WebP and export the full file; trimming requires a known duration. A full-file animated WebP export is capped at 15 seconds.

## Sharing interface preview

A finished file opens the full sharing interface. The user can switch between Restricted and Anyone with the link, add or remove preview viewers, allow downloads, regenerate or revoke the example link, copy a sample URL or iframe snippet, and open watch or embedded-player previews. The previews play the local file. URL and iframe examples deliberately use the reserved `.example` domain and cannot be used as public links. No invite email is sent, and the access controls do not secure a hosted file.

## Hosted sharing release gate

Do not turn the example links into live links without real authentication, workspace membership checks, durable video records, and private object storage. Upload completed files with a resumable transfer; keep the original and the playable export separately. Serve bytes from storage or a CDN with byte-range support, rather than proxying video through a Vercel function. Process only files that need a compatible playback version, and set workspace storage, recording, and playback limits.

A video starts Restricted. Its owner can grant workspace access or enable Anyone with the link, rotate or revoke the link, and show or hide the download control. A restricted video opens on the authenticated watch page; a link-accessible video can use `/watch/{id}` and `/embed/{id}`. The embed page needs its own frame policy, while the workspace app remains non-embeddable. Resolve the video and its current sharing policy on every watch or embed request; issue short-lived media delivery URLs after authorization. A revoked link must stop new playback requests, including previously copied iframe snippets. The watch page supplies a thumbnail, title, and Open Graph metadata; a social platform decides how it renders a shared link.

## Native social delivery

The finished recording is a source asset in the post composer. Each selected account must pass the existing capability checks and, once live publishing exists, its own video upload and permission flow. An iframe is for websites; social posts require platform-native media uploads where supported. Record per-network upload and processing status independently so a failed destination never removes the original or duplicates successful deliveries.

## Verification before hosted release

Test recording permissions, stopped screen sharing, microphone levels, local trimming, MP4 playback and exact duration, failed and cancelled exports, mobile import, workspace isolation, link revocation, restricted access, external iframe playback, and native platform upload failures. Browser and device support should be verified on current desktop Safari, Firefox, Chrome, and Edge, plus iPhone and Android devices.
