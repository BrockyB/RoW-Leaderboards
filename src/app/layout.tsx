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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {/* Background stack */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: -3 }}
        >
          {/* Smoke texture layers (kept) */}
          <div className="row-smoke-wrap">
            <div className="row-smoke row-smoke-a" />
            <div className="row-smoke row-smoke-b" />
          </div>

          {/* Fire wash (kept) */}
          <div className="row-fire-wash absolute inset-0" />
        </div>

        {/* Page content */}
        {children}

        {/* ================= BACKGROUND STYLES ================= */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
/* ================= SMOKE (TEXTURE LAYERS) ================= */

.row-smoke-wrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

:root {
  --row-smoke-tex: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='900' height='520' viewBox='0 0 900 520'>\
  <defs>\
    <filter id='f' x='-20%' y='-20%' width='140%' height='140%'>\
      <feTurbulence type='fractalNoise' baseFrequency='0.011 0.022' numOctaves='4' seed='7' stitchTiles='stitch'/>\
      <feGaussianBlur stdDeviation='10'/>\
    </filter>\
    <linearGradient id='fade' x1='0' y1='0' x2='0' y2='1'>\
      <stop offset='0' stop-color='rgba(255,255,255,0)'/>\
      <stop offset='0.6' stop-color='rgba(255,255,255,0.5)'/>\
      <stop offset='1' stop-color='rgba(255,255,255,0.9)'/>\
    </linearGradient>\
    <mask id='m'>\
      <rect width='900' height='520' fill='url(%23fade)'/>\
    </mask>\
  </defs>\
  <rect width='900' height='520' filter='url(%23f)' mask='url(%23m)' fill='white' opacity='0.9'/>\
</svg>");
}

.row-smoke {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -12%;
  height: 78vh;

  background-image: var(--row-smoke-tex);
  background-repeat: repeat-x;
  background-position: 0% 100%;
  background-size: 980px auto;

  transform-origin: 50% 100%;
  mix-blend-mode: screen;
}

.row-smoke-a {
  opacity: 0.16;
  filter: blur(3px);
  animation: rowSmokeBreatheA 11s ease-in-out infinite;
}

.row-smoke-b {
  opacity: 0.11;
  filter: blur(1.5px);
  animation: rowSmokeBreatheB 15s ease-in-out infinite;
}

@keyframes rowSmokeBreatheA {
  0%   { transform: translateY(0px) scale(1.02); background-position: 0% 100%; }
  50%  { transform: translateY(-10px) scale(1.04); background-position: 45% 100%; }
  100% { transform: translateY(0px) scale(1.02); background-position: 0% 100%; }
}

@keyframes rowSmokeBreatheB {
  0%   { transform: translateY(0px) scale(1.03); background-position: 0% 100%; }
  50%  { transform: translateY(-14px) scale(1.06); background-position: 60% 100%; }
  100% { transform: translateY(0px) scale(1.03); background-position: 0% 100%; }
}

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
  .row-smoke-a, .row-smoke-b { animation: none; }
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
