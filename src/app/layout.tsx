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
        url: "https://row-leaderboards.vercel.app/og.png",
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
    images: ["https://row-leaderboards.vercel.app/og.png"],
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
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {/* Embers overlay (CSS-only, no video) */}

        {/* Background stack (NO SMOKE, NO CANVAS) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: -3 }}
        >
          {/* Fire wash only */}
          <div className="row-fire-wash absolute inset-0" />
        </div>

	<div className="row-embers" aria-hidden="true" />

        {children}

        {/* Background styles (NO SMOKE CSS) */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
/* ================= FIRE WASH ================= */

.row-fire-wash {
  position: absolute;
  inset: 0;
  opacity: 0.44;
  animation: rowFireFlicker 4.2s ease-in-out infinite;
  background:
    radial-gradient(28% 30% at 20% 102%, rgba(255,109,0,0.16), transparent 62%),
    radial-gradient(34% 34% at 50% 104%, rgba(255,59,48,0.10), transparent 70%),
    radial-gradient(38% 38% at 82% 102%, rgba(255,145,80,0.18), transparent 62%),
    radial-gradient(55% 55% at 50% 110%, rgba(239,68,68,0.08), transparent 70%);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .row-fire-wash { animation: none; }
}

@keyframes rowFireFlicker {
  0% { opacity: 0.38; }
  30% { opacity: 0.50; }
  60% { opacity: 0.42; }
  100% { opacity: 0.47; }
}
`,
          }}
        />
      </body>
    </html>
  );
}
