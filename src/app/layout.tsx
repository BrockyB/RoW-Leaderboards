// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoW Leaderboards",
  description: "Roots of War Leaderboards",
  openGraph: {
    title: "🏆 Roots of War Leaderboards",
    description: "Live RoW leaderboards updated automatically from Discord.",
    url: "https://row-leaderboards.vercel.app/",
    siteName: "RoW Leaderboards",
    type: "website",
    images: [
      {
        url: "https://row-leaderboards.vercel.app/og-plain.png",
        width: 1200,
        height: 630,
        alt: "Roots of War Leaderboards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🏆 Roots of War Leaderboards",
    description: "Live RoW leaderboards updated automatically from Discord.",
    images: ["https://row-leaderboards.vercel.app/og-plain.png"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="row-body text-zinc-100 antialiased">
        {/* Static background */}
        <div aria-hidden="true" className="row-bg" />
        {children}
      </body>
    </html>
  );
}
