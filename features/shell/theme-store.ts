"use client";

import { create } from "zustand";

type ThemeState = {
  dark: boolean | null;
  setDark: (dark: boolean) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  dark: null,
  setDark: (dark) => set({ dark }),
}));
