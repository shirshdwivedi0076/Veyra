import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VEYRA — Your Business. Smarter.",
  description: "AI-powered business intelligence and decision support.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}