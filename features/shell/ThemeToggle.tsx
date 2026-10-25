"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useThemeStore } from "./themeStore";

export function ThemeToggle({ label = true }: { label?: boolean }) {
  const dark = useThemeStore((state) => state.dark);
  const setDark = useThemeStore((state) => state.setDark);
  useEffect(() => {
    if (dark !== null) {
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      return;
    }
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(preferred);
    document.documentElement.dataset.theme = preferred ? "dark" : "light";
  }, [dark, setDark]);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }
  return <button className="theme-button" type="button" onClick={toggle} aria-label={dark ? "Use light theme" : "Use dark theme"} title={dark ? "Use light theme" : "Use dark theme"}>
    {dark ? <Sun size={17} /> : <Moon size={17} />}
    {label && <span>{dark ? "Light" : "Dark"}</span>}
  </button>;
}
