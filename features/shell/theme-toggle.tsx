"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useThemeStore } from "./theme-store";

export function ThemeToggle({ label = true }: { label?: boolean }) {
  const dark = useThemeStore((state) => state.dark);
  const setDark = useThemeStore((state) => state.setDark);
  useEffect(() => {
    if (dark === null) {
      let saved: string | null = null;
      try {
        saved = document.cookie.split("; ").find((item) => item.startsWith("spreadnotes-theme="))?.split("=")[1] ?? window.localStorage.getItem("spreadnotes-theme");
      } catch { /* Storage can be unavailable in private browsing. */ }
      setDark(saved === "dark");
      return;
    }
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { window.localStorage.setItem("spreadnotes-theme", dark ? "dark" : "light"); } catch { /* Keep the in-memory preference. */ }
    const host = window.location.hostname;
    const domain = host === "localhost" || host.endsWith(".localhost") ? "; Domain=localhost" : host === "spreadnotes.app" || host.endsWith(".spreadnotes.app") ? "; Domain=spreadnotes.app" : "";
    document.cookie = `spreadnotes-theme=${dark ? "dark" : "light"}; Path=/; Max-Age=31536000; SameSite=Lax${domain}`;
  }, [dark, setDark]);
  function toggle() {
    const next = !dark;
    setDark(next);
  }
  return <button className="theme-button" type="button" onClick={toggle} aria-label={dark ? "Use light theme" : "Use dark theme"} title={dark ? "Use light theme" : "Use dark theme"}>
    {dark ? <Sun size={17} /> : <Moon size={17} />}
    {label && <span>{dark ? "Light" : "Dark"}</span>}
  </button>;
}
