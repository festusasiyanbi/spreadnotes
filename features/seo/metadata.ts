import type { Metadata } from "next";
import socialPages from "./content.json";

export const siteName = "SpreadNotes";
export const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://spreadnotes.app" : "http://localhost:3000"));

export const homeTitle = socialPages.home.title;
export const homeDescription = socialPages.home.description;

export function pageMetadata(key: keyof typeof socialPages, origin: URL = siteOrigin, pathOverride?: string): Metadata {
  const { path, title, description, indexable } = socialPages[key];
  const url = new URL(pathOverride ?? path, origin).toString();

  return {
    title,
    description,
    metadataBase: origin,
    ...(indexable ? { alternates: { canonical: url } } : { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
