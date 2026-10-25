import { pageMetadata } from "../../features/seo/metadata";
import { SimulationApp } from "../../features/simulation/simulation-app";
import { headers } from "next/headers";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-spreadnotes-host") || requestHeaders.get("host") || "").split(":")[0].toLowerCase();
  const publicHost = host === "app.spreadnotes.app" || host === "staging.spreadnotes.app";
  return pageMetadata("workspace", new URL(publicHost ? `https://${host}` : "http://localhost:3000"), publicHost ? "/" : "/workspace");
}
export default function Page() { return <SimulationApp />; }
