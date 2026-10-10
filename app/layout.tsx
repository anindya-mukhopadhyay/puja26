import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puja26 — Find your pujo",
  description: "Discover pandals, plan routes, and celebrate together.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#780D19", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
