import type { Metadata } from "next";
import { homeDescription, homeTitle, siteName, siteOrigin } from "../features/seo/metadata";
import "./globals.css";
import "../features/shell/product-theme.css";

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  applicationName: siteName,
  manifest: "/site.webmanifest",
  title: homeTitle,
  description: homeDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
