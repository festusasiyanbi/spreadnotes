"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, Download, FileVideo, Mic, Monitor, Pause, Play, Scissors, Square, Upload, Video } from "lucide-react";
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MAX_WEBP_SECONDS, trimVideo, type ExportFormat } from "./export-video";
import { startCapture, supportedRecordingType, type CaptureMode, type CaptureSession } from "./recording";
import { useRecordingUiStore } from "./recording-ui-store";
import { SharingPreview } from "./sharing-preview";

export function CreatorHub({ onUseInPost }: { onUseInPost: (file: File, posterUrl?: string) => void }) {
  const [mode, setMode] = useState<CaptureMode>("screen");
  const [microphone, setMicrophone] = useState(true);
  const [sharedAudio, setSharedAudio] = useState(false);
  const recording = useRecordingUiStore((state) => state.status);
  const elapsed = useRecordingUiStore((state) => state.elapsed);
  const setRecording = useRecordingUiStore((state) => state.setStatus);
  const setElapsed = useRecordingUiStore((state) => state.setElapsed);
  const [audioLevel, setAudioLevel] = useState(0);
  const [captureSurface, setCaptureSurface] = useState("");
  const [captureInterrupted, setCaptureInterrupted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [finished, setFinished] = useState<File | null>(null);
  const [finishedUrl, setFinishedUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sessionRef = useRef<CaptureSession | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);
  const recordedDurationRef = useRef(0);
  const fileRef = useRef<File | null>(null);
  const savedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const recordingRef = useRef(recording);

  useEffect(() => {
    fileRef.current = file;
    savedRef.current = hasSaved;
    recordingRef.current = recording;
  }, [file, hasSaved, recording]);
  useEffect(() => {
    useRecordingUiStore.getState().setControls({ stop: stopRecording, togglePause });
    return () => useRecordingUiStore.getState().setControls({ stop: () => {}, togglePause: () => {} });
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (recordingRef.current !== "idle" || fileRef.current && !savedRef.current) { event.preventDefault(); event.returnValue = ""; }
    };
    const beforeWorkspaceSwitch = (event: Event) => {
      if (recordingRef.current !== "idle" || fileRef.current && !savedRef.current) {
        event.preventDefault();
        window.alert("Stop and save your recording before switching workspaces.");
        return;
      }
      setFile(null);
      setFinished(null);
      setPosterUrl("");
      setVideoName("");
      setHasSaved(false);
      fileRef.current = null;
      savedRef.current = false;
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("spreadnotes:before-workspace-switch", beforeWorkspaceSwitch);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("spreadnotes:before-workspace-switch", beforeWorkspaceSwitch);
      if (tickRef.current) window.clearInterval(tickRef.current);
      abortRef.current?.abort();
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      sessionRef.current?.stop();
    };
  }, []);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => { URL.revokeObjectURL(url); setFileUrl(""); };
  }, [file]);
  useEffect(() => {
    if (!finished) return;
    const url = URL.createObjectURL(finished);
    setFinishedUrl(url);
    return () => { URL.revokeObjectURL(url); setFinishedUrl(""); };
  }, [finished]);
  useEffect(() => {
    if (previewRef.current) previewRef.current.srcObject = recording === "idle" ? null : sessionRef.current?.preview ?? null;
  }, [recording]);

  function chooseFile(next: File, preserveLarge = false, recordedDuration = 0) {
    if (!next.type.startsWith("video/")) { setError("Choose a video file."); return; }
    if (next.size > MAX_VIDEO_BYTES && !preserveLarge) { setError("Use a video under 75 MB for local editing."); return; }
    fileRef.current = next;
    savedRef.current = false;
    setFile(next);
    setVideoName(next.name.replace(/\.[^.]+$/, ""));
    setFinished(null);
    setPosterUrl("");
    recordedDurationRef.current = recordedDuration;
    setDuration(recordedDuration);
    setStart(0);
    setEnd(Math.min(recordedDuration, MAX_VIDEO_SECONDS));
    setFormat("mp4");
    setHasSaved(false);
    setError(next.size > MAX_VIDEO_BYTES ? "This recording is over 75 MB. Download the original; local trimming is unavailable." : "");
  }
  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (next) chooseFile(next);
    event.target.value = "";
  }
  function stopRecording() {
    const activeMilliseconds = elapsedBeforePauseRef.current + (recordingRef.current === "recording" ? Date.now() - startedRef.current : 0);
    recordedDurationRef.current = Math.min(MAX_VIDEO_SECONDS, Math.max(.1, activeMilliseconds / 1000));
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording("idle");
    recordingRef.current = "idle";
    setAudioLevel(0);
  }
  async function beginRecording() {
    setError("");
    recordedDurationRef.current = 0;
    setCaptureInterrupted(false);
    try {
      const session = await startCapture(mode, microphone, sharedAudio);
      sessionRef.current = session;
      setCaptureSurface(session.surface);
      const type = supportedRecordingType();
      const recorder = new MediaRecorder(session.stream, type ? { mimeType: type } : undefined);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => setError("Recording stopped unexpectedly. You can try again or import a video.");
      recorder.onstop = () => {
        const actualType = recorder.mimeType || type || "video/webm";
        const extension = actualType.includes("mp4") ? "mp4" : "webm";
        const next = new File(chunks, `spreadnotes-recording-${Date.now()}.${extension}`, { type: actualType });
        if (next.size) chooseFile(next, true, recordedDurationRef.current);
        else setError("No recording was captured. Please try again.");
        session.stop();
        sessionRef.current = null;
        recorderRef.current = null;
      };
      session.sourceTrack.addEventListener("mute", () => setCaptureInterrupted(true));
      session.sourceTrack.addEventListener("unmute", () => setCaptureInterrupted(false));
      session.sourceTrack.addEventListener("ended", () => {
        setError("Screen sharing ended in the browser. Select Entire screen next time if you want to follow other tabs or apps.");
        stopRecording();
      }, { once: true });
      recorder.start(1000);
      startedRef.current = Date.now();
      elapsedBeforePauseRef.current = 0;
      setElapsed(0);
      setRecording("recording");
      recordingRef.current = "recording";
      tickRef.current = window.setInterval(() => {
        const seconds = Math.floor((elapsedBeforePauseRef.current + (recordingRef.current === "paused" ? 0 : Date.now() - startedRef.current)) / 1000);
        setElapsed(seconds);
        setAudioLevel(session.audioLevel());
        if (seconds >= MAX_VIDEO_SECONDS) stopRecording();
      }, 250);
    } catch (cause) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setError(cause instanceof Error ? cause.message : "Recording could not start. Check browser permissions and try again.");
    }
  }
  function togglePause() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      elapsedBeforePauseRef.current += Date.now() - startedRef.current;
      setRecording("paused");
      recordingRef.current = "paused";
    } else if (recorder.state === "paused") {
      recorder.resume();
      startedRef.current = Date.now();
      setRecording("recording");
      recordingRef.current = "recording";
    }
  }
  function updateTrim(nextStart: number, nextEnd: number) {
    savedRef.current = false;
    setStart(nextStart);
    setEnd(nextEnd);
    setFinished(null);
    setPosterUrl("");
    setHasSaved(false);
  }
  async function exportTrim() {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const trimmed = await trimVideo(file, start, duration > 0 ? end : null, setProgress, controller.signal, format);
      setFinished(trimmed);
      setProgress(1);
    } catch (cause) {
      setError(controller.signal.aborted ? "Export cancelled. Your original video is still available." : cause instanceof Error ? cause.message : "Export failed on this device. Your original video is still available.");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }
  function download(target: File) {
    const url = URL.createObjectURL(target);
    const link = document.createElement("a");
    link.href = url;
    link.download = target.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    savedRef.current = true;
    setHasSaved(true);
  }
  function namedFile(target: File) {
    const safeName = videoName.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, "-").slice(0, 80) || "spreadnotes-video";
    const extension = target.type === "image/webp" ? "webp" : target.type.includes("quicktime") ? "mov" : target.type.includes("mp4") ? "mp4" : target.type.includes("webm") ? "webm" : target.name.split(".").pop() || "video";
    return new File([target], `${safeName}.${extension}`, { type: target.type });
  }
  function capturePoster() {
    const video = resultRef.current;
    if (!video?.videoWidth || !video.videoHeight) { setError("Play the finished video before choosing a preview frame."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 640);
    canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPosterUrl(canvas.toDataURL("image/jpeg", .8));
    setError("");
  }
  const canRecord = typeof navigator !== "undefined" && !!navigator.mediaDevices && typeof MediaRecorder !== "undefined";

  return <div className="creator-hub stack-gap">
    <div className="creator-grid">
      <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">01 / CAPTURE</span><h3>Record your idea.</h3><p>Record locally. Nothing is uploaded or shared.</p></div></div>
        <div className="creator-modes" role="group" aria-label="Recording mode">{([{ id: "screen", label: "Screen", icon: Monitor }, { id: "screen-camera", label: "Screen + camera", icon: Video }, { id: "camera", label: "Camera", icon: Camera }] as const).map((item) => <button key={item.id} type="button" disabled={recording !== "idle"} className={mode === item.id ? "selected" : ""} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}><item.icon size={18} />{item.label}</button>)}</div>
        <div className="creator-options"><label><input type="checkbox" checked={microphone} disabled={recording !== "idle"} onChange={(event) => setMicrophone(event.target.checked)} /><Mic size={17} /> Microphone</label>{mode !== "camera" && <label><input type="checkbox" checked={sharedAudio} disabled={recording !== "idle"} onChange={(event) => setSharedAudio(event.target.checked)} /> Tab or system audio, if offered</label>}</div>{recording !== "idle" && microphone && <div className="creator-audio-meter" role="meter" aria-label="Microphone level" aria-valuenow={audioLevel} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${audioLevel}%` }} /></div>}
        <div className="creator-live">{recording !== "idle" && <video ref={previewRef} autoPlay muted playsInline aria-label="Live recording preview" />}{recording === "idle" && <span><Monitor size={30} /> Your preview appears here when recording starts.</span>}{recording !== "idle" && <strong className="creator-timer">{recording === "paused" ? "Paused" : "Recording"} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</strong>}</div>
        {recording !== "idle" && captureSurface !== "camera" && <p className="field-hint" role="status">{captureInterrupted ? "The browser has paused this capture source. Return to the shared tab or choose Entire screen for the next recording." : captureSurface === "monitor" ? "Entire screen selected. You can move between tabs and apps while keeping the SpreadNotes tab open." : captureSurface === "browser" ? "A single browser tab is selected. To record another tab, use the browser’s switch-sharing control or restart and select Entire screen." : captureSurface === "window" ? "One window is selected. To follow other apps, restart and select Entire screen." : "To follow other tabs and apps, choose Entire screen in the browser’s sharing picker."}</p>}
        <div className="creator-actions">{recording === "idle" ? <button className="button button-primary" disabled={!canRecord || busy} onClick={beginRecording}>Start recording <Video size={17} /></button> : <><button className="button button-outline" onClick={togglePause}>{recording === "paused" ? <Play size={17} /> : <Pause size={17} />}{recording === "paused" ? "Resume" : "Pause"}</button><button className="button button-primary" onClick={stopRecording}>Stop <Square size={16} /></button></>}{recording === "idle" && <label className="button button-outline creator-upload"><Upload size={17} /> Import video<input type="file" accept="video/*" onChange={importFile} /></label>}</div>
        <p className="field-hint">Up to 3 minutes and 75 MB. Choose Entire screen to capture other apps, and keep this browser tab open. On phones without screen capture, use the camera or import a recording.</p>
      </section>
      <section className="panel-card padded"><div className="panel-heading"><div><span className="eyebrow">02 / EDIT</span><h3>Keep the best part.</h3><p>Trim the beginning and end, then make a real local file.</p></div></div>
        {file ? <><video className="creator-playback" ref={playbackRef} src={fileUrl || undefined} controls playsInline onLoadedMetadata={(event) => { const length = event.currentTarget.duration; if (Number.isFinite(length) && length > 0) { setDuration(length); setEnd(Math.min(length, MAX_VIDEO_SECONDS)); } }} />
          <label className="creator-file-name">Video name<input value={videoName} maxLength={80} onChange={(event) => { setVideoName(event.target.value); savedRef.current = false; setHasSaved(false); }} aria-describedby="creator-file-note" /></label><small id="creator-file-note" className="field-hint">{(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type || "video"}</small>
          {duration > 0 && file.size <= MAX_VIDEO_BYTES && <><div className="creator-trim"><label>Start <input type="number" min={0} max={Math.max(0, end - .1)} step="0.1" value={Number(start.toFixed(1))} onChange={(event) => updateTrim(Math.max(0, Math.min(Number(event.target.value), end - .1)), end)} /> seconds</label><label>End <input type="number" min={start + .1} max={Math.min(duration, MAX_VIDEO_SECONDS)} step="0.1" value={Number(end.toFixed(1))} onChange={(event) => updateTrim(start, Math.max(start + .1, Math.min(Number(event.target.value), duration, MAX_VIDEO_SECONDS)))} /> seconds</label></div><input className="creator-range" aria-label="Trim start" type="range" min={0} max={Math.max(0, end - .1)} step="0.1" value={start} onChange={(event) => { const value = Number(event.target.value); updateTrim(value, end); if (playbackRef.current) playbackRef.current.currentTime = value; }} /><input className="creator-range" aria-label="Trim end" type="range" min={start + .1} max={Math.min(duration, MAX_VIDEO_SECONDS)} step="0.1" value={end} onChange={(event) => { const value = Number(event.target.value); updateTrim(start, value); if (playbackRef.current) playbackRef.current.currentTime = value; }} /><p className="field-hint">Selected {Math.max(0, end - start).toFixed(1)} seconds. Local processing may take time, especially on a phone.</p></>}
          {duration <= 0 && <p className="field-hint">This video has no readable duration. You can still export the full file; trimming will become available when a duration is known.</p>}
          {file.size <= MAX_VIDEO_BYTES && <><label className="creator-format">Save format<select value={format} onChange={(event) => { setFormat(event.target.value as ExportFormat); setFinished(null); setPosterUrl(""); setHasSaved(false); savedRef.current = false; }}><option value="mp4">MP4 · widely compatible</option><option value="mov">MOV · QuickTime movie</option><option value="webm">WebM · web video</option><option value="webp">Animated WebP · silent image</option></select></label>{format === "webp" && <p className="field-hint">Animated WebP has no audio and is limited to {MAX_WEBP_SECONDS} seconds. It is an image, so channel support differs from video.</p>}<div className="creator-actions"><button className="button button-primary" disabled={busy || duration > 0 && (end <= start || format === "webp" && end - start > MAX_WEBP_SECONDS)} onClick={exportTrim}><Scissors size={17} />{busy ? `Exporting ${Math.round(progress * 100)}%` : `Export ${format.toUpperCase()}`}</button>{busy && <button className="button button-outline" onClick={() => abortRef.current?.abort()}>Cancel export</button>}</div></>}
          {finished && <div className="creator-finished" role="status"><strong>{finished.type === "image/webp" ? "Animation" : "Video"} ready · {finished.type}</strong><p>Review the finished file, then download it or attach it to a new editable post.</p>{finished.type === "image/webp" ? <img className="creator-result-preview" src={finishedUrl} alt="Finished animated WebP preview" /> : <video ref={resultRef} className="creator-result-preview" src={finishedUrl || undefined} controls playsInline aria-label="Finished video preview" />}{finished.type !== "image/webp" && <div className="creator-actions"><button className="button button-outline" onClick={capturePoster}>Use current frame as preview thumbnail</button></div>}{posterUrl && <p className="field-hint">Thumbnail selected for SpreadNotes previews. The downloaded file and social platforms may use a different cover.</p>}<div className="creator-actions"><button className="button button-primary" onClick={() => download(namedFile(finished))}><Download size={17} /> Save to computer</button><button className="button button-outline" onClick={() => { savedRef.current = true; setHasSaved(true); onUseInPost(namedFile(finished), posterUrl || undefined); }}>Use in post <ArrowRight size={17} /></button></div></div>}
          {error && <button className="button button-outline small" onClick={() => download(namedFile(file))}>Download original video</button>}</> : <div className="creator-empty"><FileVideo size={35} /><strong>Your video will appear here.</strong><p>Record or import a video to preview, trim, and export it.</p></div>}
      </section>
    </div>
    {error && <p className="creator-error" role="alert">{error}</p>}
    {finished ? <SharingPreview key={finishedUrl} file={finished} fileUrl={finishedUrl} title={videoName} /> : <section className="panel-card padded creator-hosting"><div><span className="eyebrow">03 / SHARE</span><h3>Viewing links and website embeds</h3><p>Finish a video to choose access, preview its watch page, and prepare embed code.</p></div></section>}
  </div>;
}
