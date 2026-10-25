import { pageMetadata } from "../../features/seo/metadata";
import { SignInPage } from "../../features/auth/sign-in-page";
import { headers } from "next/headers";
export async function generateMetadata() {
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  const origin = host === "app.spreadnotes.app" || host === "staging.spreadnotes.app" ? new URL(`https://${host}`) : new URL("http://localhost:3000");
  return pageMetadata("signIn", origin);
}
export default function Page() { return <SignInPage />; }
