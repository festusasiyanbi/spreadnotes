import { pageMetadata } from "../../features/seo/metadata";
import { SignInPage } from "../../features/auth/SignInPage";
export const metadata = pageMetadata("signIn");
export default function Page() { return <SignInPage />; }
