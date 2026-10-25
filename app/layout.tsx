import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpreadNotes — Make room for the good ideas.",
  description: "One considered space to shape social content, plan posts, and prepare paid campaigns.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
