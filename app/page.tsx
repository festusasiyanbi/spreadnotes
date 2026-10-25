import { pageMetadata } from "../features/seo/metadata";
import { LandingPage } from "../features/marketing/LandingPage";
export const metadata = pageMetadata("home");
export default function Page() { return <LandingPage />; }
