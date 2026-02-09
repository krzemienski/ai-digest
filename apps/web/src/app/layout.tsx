import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { MiniPlayer } from "@/components/podcast/mini-player";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Digest",
  description: "AI-curated news digest with podcast",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <MiniPlayer />
      </body>
    </html>
  );
}
