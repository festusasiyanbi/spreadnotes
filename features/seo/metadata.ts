import type { Metadata } from "next";
import socialPages from "./content.json";

export const siteName = "SpreadNotes";
export const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || (process.env.NODE_ENV === "production" ? "https://spreadnotes.app" : "http://localhost:3000"));

export function requestOrigin(rawHost: string): URL {
  const host = rawHost.trim().toLowerCase();
  const hostname = host.split(":")[0];
  if (hostname === "localhost" || hostname === "staging.localhost" || hostname === "app.localhost") return new URL(`http://${host}`);
  if (["spreadnotes.app", "www.spreadnotes.app", "app.spreadnotes.app", "staging.spreadnotes.app"].includes(hostname) || /^[a-z0-9-]+\.vercel\.app$/.test(hostname)) return new URL(`https://${host}`);
  return siteOrigin;
}

export const homeTitle = socialPages.home.title;
export const homeDescription = socialPages.home.description;

export function pageMetadata(key: keyof typeof socialPages, origin: URL = siteOrigin, pathOverride?: string): Metadata {
  const { path, title, description, indexable } = socialPages[key];
  const url = new URL(pathOverride ?? path, origin).toString();
  const image = new URL(`/brand/${socialPages[key].imageFile}`, origin).toString();

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
      images: [{ url: image, width: 1200, height: 630, type: "image/png", alt: socialPages[key].imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, type: "image/png", alt: socialPages[key].imageAlt }],
    },
  };
}
