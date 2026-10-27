export type CaptureMode = "screen" | "camera" | "screen-camera";
export type CaptureSession = { stream: MediaStream; preview: MediaStream; sourceTrack: MediaStreamTrack; surface: string; audioLevel: () => number; stop: () => void };

export async function startCapture(mode: CaptureMode, microphone: boolean, sharedAudio: boolean): Promise<CaptureSession> {
  if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") throw new Error("Recording is unavailable in this browser. Import a video instead.");
  if (mode !== "camera" && !navigator.mediaDevices.getDisplayMedia) throw new Error("Screen recording is unavailable here. Use your camera or import a screen recording.");
  const screen = mode === "camera" ? null : await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "monitor" },
    audio: sharedAudio,
    preferCurrentTab: false,
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
  } as DisplayMediaStreamOptions);
  let camera: MediaStream | null = null;
  let audio: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animation = 0;
  let backgroundFrames = 0;
  const elements: HTMLVideoElement[] = [];
  try {
    if (mode !== "screen" || microphone) camera = await navigator.mediaDevices.getUserMedia({ video: mode !== "screen", audio: microphone });
    let videoTrack = screen?.getVideoTracks()[0] ?? camera?.getVideoTracks()[0];
    if (!videoTrack) throw new Error("No video source was selected.");
    if (mode === "screen-camera" && screen && camera) {
      const canvas = document.createElement("canvas");
      const settings = screen.getVideoTracks()[0].getSettings();
      canvas.width = Math.min(settings.width || 1280, 1920);
      canvas.height = Math.min(settings.height || 720, 1080);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The video canvas could not be started.");
      const screenElement = document.createElement("video");
      const cameraElement = document.createElement("video");
      for (const [element, source] of [[screenElement, screen], [cameraElement, camera]] as const) {
        element.srcObject = source;
        element.muted = true;
        element.playsInline = true;
        elements.push(element);
        await element.play();
      }
      const drawFrame = () => {
        context.drawImage(screenElement, 0, 0, canvas.width, canvas.height);
        const width = Math.round(canvas.width * .22);
        const height = Math.round(width * .75);
        const x = canvas.width - width - 22;
        const y = canvas.height - height - 22;
        context.fillStyle = "#170e1b";
        context.fillRect(x - 3, y - 3, width + 6, height + 6);
        context.drawImage(cameraElement, x, y, width, height);
      };
      const draw = () => {
        if (document.visibilityState === "visible") drawFrame();
        animation = requestAnimationFrame(draw);
      };
      draw();
      backgroundFrames = window.setInterval(() => { if (document.visibilityState === "hidden") drawFrame(); }, 250);
      videoTrack = canvas.captureStream(30).getVideoTracks()[0];
    }
    const stream = new MediaStream([videoTrack]);
    const audioSources = [screen, camera].flatMap((source) => source?.getAudioTracks() ?? []);
    if (audioSources.length) {
      audio = new AudioContext();
      await audio.resume();
      const destination = audio.createMediaStreamDestination();
      for (const track of audioSources) {
        const source = audio.createMediaStreamSource(new MediaStream([track]));
        source.connect(destination);
        if (camera?.getAudioTracks().includes(track)) {
          analyser = audio.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
        }
      }
      destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    return {
      stream,
      preview: mode === "screen-camera" ? stream : screen ?? camera ?? stream,
      sourceTrack: screen?.getVideoTracks()[0] ?? camera!.getVideoTracks()[0],
      surface: mode === "camera" ? "camera" : String(screen?.getVideoTracks()[0].getSettings().displaySurface ?? "unknown"),
      audioLevel: () => {
        if (!analyser) return 0;
        const samples = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(samples);
        return Math.min(100, Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length * 1.5));
      },
      stop: () => {
        cancelAnimationFrame(animation);
        window.clearInterval(backgroundFrames);
        elements.forEach((element) => { element.pause(); element.srcObject = null; });
        stream.getTracks().forEach((track) => track.stop());
        screen?.getTracks().forEach((track) => track.stop());
        camera?.getTracks().forEach((track) => track.stop());
        void audio?.close();
      },
    };
  } catch (error) {
    cancelAnimationFrame(animation);
    window.clearInterval(backgroundFrames);
    screen?.getTracks().forEach((track) => track.stop());
    camera?.getTracks().forEach((track) => track.stop());
    void audio?.close();
    throw error;
  }
}

export function supportedRecordingType(): string | undefined {
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
}
