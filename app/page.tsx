import { headers } from "next/headers";
import { pageMetadata, requestOrigin } from "../features/seo/metadata";
import { LandingPage } from "../features/marketing/landing-page";
export async function generateMetadata() {
  const origin = requestOrigin((await headers()).get("host") ?? "");
  const preview = origin.hostname.endsWith(".vercel.app");
  return { ...pageMetadata("home", origin), ...(preview ? { alternates: undefined, robots: { index: false, follow: false } } : {}) };
}
export default function Page() { return <LandingPage />; }
