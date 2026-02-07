import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Digest",
  description: "AI-curated news digest with podcast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cyber-bg text-cyber-text antialiased">
        {children}
      </body>
    </html>
  );
}
