"use client";

import { create } from "zustand";

type RecordingStatus = "idle" | "recording" | "paused";
type RecordingUiState = {
  status: RecordingStatus;
  elapsed: number;
  setStatus: (status: RecordingStatus) => void;
  setElapsed: (elapsed: number) => void;
  stop: () => void;
  togglePause: () => void;
  setControls: (controls: Pick<RecordingUiState, "stop" | "togglePause">) => void;
};

export const useRecordingUiStore = create<RecordingUiState>((set) => ({
  status: "idle",
  elapsed: 0,
  setStatus: (status) => set({ status }),
  setElapsed: (elapsed) => set({ elapsed }),
  stop: () => {},
  togglePause: () => {},
  setControls: (controls) => set(controls),
}));
