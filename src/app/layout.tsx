// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

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
          {/* Smoke texture layers */}
          <div className="row-smoke-wrap">
            <div className="row-smoke row-smoke-a" />
            <div className="row-smoke row-smoke-b" />
          </div>

          {/* Ash + embers canvas */}
          <canvas
            id="row-bg-canvas"
            className="absolute inset-0 h-full w-full opacity-[0.95]"
          />

          {/* Fire wash */}
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
  animation:
    rowSmokeDriftA 26s linear infinite,
    rowSmokeBreatheA 9.5s ease-in-out infinite;
}

.row-smoke-b {
  opacity: 0.11;
  filter: blur(1.5px);
  background-size: 760px auto;
  animation:
    rowSmokeDriftB 34s linear infinite,
    rowSmokeBreatheB 12.5s ease-in-out infinite;
}

@keyframes rowSmokeDriftA {
  0% {
    transform: translateY(0) scaleY(1);
    background-position-x: 0;
  }
  100% {
    transform: translateY(-46px) scaleY(1.08);
    background-position-x: -520px;
  }
}

@keyframes rowSmokeDriftB {
  0% {
    transform: translateY(0) scaleY(1);
    background-position-x: 0;
  }
  100% {
    transform: translateY(-64px) scaleY(1.1);
    background-position-x: -460px;
  }
}

@keyframes rowSmokeBreatheA {
  0%,100% { opacity: 0.16; }
  50% { opacity: 0.21; }
}

@keyframes rowSmokeBreatheB {
  0%,100% { opacity: 0.11; }
  50% { opacity: 0.15; }
}

/* ================= FIRE WASH ================= */

@keyframes rowFireFlicker {
  0% { opacity: 0.38; }
  50% { opacity: 0.5; }
  100% { opacity: 0.4; }
}

.row-fire-wash {
  opacity: 0.44;
  animation: rowFireFlicker 4.2s ease-in-out infinite;
  background:
    radial-gradient(42% 42% at 18% 102%, rgba(255,130,70,0.22), transparent 62%),
    radial-gradient(38% 38% at 82% 102%, rgba(255,145,80,0.18), transparent 62%),
    radial-gradient(55% 55% at 50% 110%, rgba(239,68,68,0.08), transparent 70%);
  pointer-events: none;
}

/* ================= REDUCED MOTION ================= */

@media (prefers-reduced-motion: reduce) {
  .row-smoke-a,
  .row-smoke-b,
  .row-fire-wash {
    animation: none;
  }
}
`,
          }}
        />

        {/* ================= ASH + EMBERS CANVAS ================= */}
        <Script id="row-ash-embers" strategy="afterInteractive">
          {`
(() => {
  const canvas = document.getElementById("row-bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0;
  const TAU = Math.PI * 2;

  const ASH_COUNT = 420;
  const SPARK_COUNT = 120;

  const ash = [];
  const sparks = [];

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function spawnAsh(i) {
    ash[i] = {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 2.2,
      a: 0.06 + Math.random() * 0.12,
      vy: -(0.18 + Math.random() * 0.42),
      vx: (Math.random() - 0.5) * 0.26,
      wob: Math.random() * 2,
      ph: Math.random() * TAU,
    };
  }

  function spawnSpark(i, t) {
    sparks[i] = {
      x: Math.random() * w,
      y: h * (0.6 + Math.random() * 0.4),
      r: 1 + Math.random() * 3,
      a: 0.25 + Math.random() * 0.3,
      vy: -(1 + Math.random() * 1.5),
      vx: (Math.random() - 0.5) * 0.7,
      born: t,
      life: 1500 + Math.random() * 2500,
    };
  }

  function drawAsh(t) {
    ctx.globalCompositeOperation = "lighter";
    ash.forEach(p => {
      p.x += p.vx + Math.sin(t * 0.001 + p.ph) * 0.12;
      p.y += p.vy;

      if (p.y < -20) p.y = h + 20;
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      ctx.fillStyle = \`rgba(240,230,220,\${p.a})\`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    });
  }

  function drawSparks(t) {
    ctx.globalCompositeOperation = "lighter";
    sparks.forEach((p, i) => {
      const age = t - p.born;
      const k = Math.max(0, 1 - age / p.life);

      p.x += p.vx;
      p.y += p.vy;

      if (k <= 0 || p.y < -80) {
        spawnSpark(i, t);
        return;
      }

      ctx.fillStyle = \`rgba(255,160,90,\${p.a * k})\`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    });
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    drawAsh(t);
    drawSparks(t);
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  function init() {
    resize();
    for (let i = 0; i < ASH_COUNT; i++) spawnAsh(i);
    for (let i = 0; i < SPARK_COUNT; i++) spawnSpark(i, performance.now());
    requestAnimationFrame(frame);
  }

  init();
  window.addEventListener("resize", resize);
})();
          `}
        </Script>
      </body>
    </html>
  );
}
