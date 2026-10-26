import { pageMetadata, requestOrigin } from "../../features/seo/metadata";
import { SimulationApp } from "../../features/simulation/simulation-app";
import { headers } from "next/headers";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-spreadnotes-host") || requestHeaders.get("host") || "").split(":")[0].toLowerCase();
  const origin = requestOrigin(requestHeaders.get("host") ?? "");
  const productHost = host === "app.spreadnotes.app" || host === "staging.spreadnotes.app" || host === "staging.localhost";
  return pageMetadata("workspace", origin, productHost ? "/" : "/workspace");
}
export default function Page() { return <SimulationApp />; }
