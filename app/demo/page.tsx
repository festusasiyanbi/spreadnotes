import { permanentRedirect } from "next/navigation";
export default function Page() { permanentRedirect(process.env.NEXT_PUBLIC_STAGING_ORIGIN?.trim() || "https://staging.spreadnotes.app"); }
