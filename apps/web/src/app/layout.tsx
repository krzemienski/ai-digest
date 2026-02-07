import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MiniPlayer } from "@/components/podcast/mini-player";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`dark ${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cyber-bg text-cyber-text font-sans antialiased flex flex-col">
        <Header />
        <main className="flex-1 pb-16">{children}</main>
        <Footer />
        <MiniPlayer />
      </body>
    </html>
  );
}
