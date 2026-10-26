import { pageMetadata, requestOrigin } from "../../features/seo/metadata";
import { SignInPage } from "../../features/auth/sign-in-page";
import { headers } from "next/headers";
export async function generateMetadata() {
  const origin = requestOrigin((await headers()).get("host") ?? "");
  return pageMetadata("signIn", origin);
}
export default function Page() { return <SignInPage />; }
