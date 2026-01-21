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

  icons: {
    icon: "/favicon.ico",
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
          {/* Ash + embers canvas */}
          <canvas
            id="row-bg-canvas"
            className="absolute inset-0 h-full w-full opacity-[0.95]"
          />

          {/* Fire wash */}
          <div className="row-fire-wash" />
        </div>

        {/* Injected CSS for background stack */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
/* ================= ROOT BACKGROUND STACK ================= */

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

/* ================= REDUCED MOTION ================= */

@media (prefers-reduced-motion: reduce) {
  .row-fire-wash {
    animation: none;
  }
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

        {/* ================= ASH + EMBERS CANVAS ================= */}
        <Script id="row-ash-embers" strategy="afterInteractive">
          {`
(() => {
  const canvas = document.getElementById("row-bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // Particle system (embers + ash)
  const rand = (a, b) => a + Math.random() * (b - a);

  const EMBERS = 26;
  const ASH = 90;

  const embers = Array.from({ length: EMBERS }, () => ({
    x: rand(0, W()),
    y: rand(0, H()),
    r: rand(1.4, 2.8),
    vx: rand(-0.15, 0.15),
    vy: rand(-0.45, -0.15),
    a: rand(0.22, 0.55),
    tw: rand(0.7, 1.6),
    ph: rand(0, Math.PI * 2),
  }));

  const ash = Array.from({ length: ASH }, () => ({
    x: rand(0, W()),
    y: rand(0, H()),
    r: rand(0.8, 1.6),
    vx: rand(-0.08, 0.08),
    vy: rand(-0.22, -0.08),
    a: rand(0.06, 0.16),
    drift: rand(0.4, 1.2),
    ph: rand(0, Math.PI * 2),
  }));

  function step(list, type) {
    const w = W();
    const h = H();
    for (const p of list) {
      p.x += p.vx + Math.sin(p.ph) * (type === "ash" ? 0.15 : 0.3);
      p.y += p.vy;
      p.ph += type === "ash" ? 0.01 * p.drift : 0.02 * p.tw;

      // wrap
      if (p.y < -20) {
        p.y = h + rand(10, 40);
        p.x = rand(0, w);
      }
      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
    }
  }

  function draw() {
    const w = W();
    const h = H();
    ctx.clearRect(0, 0, w, h);

    // subtle dark vignette
    const g = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // ash
    for (const p of ash) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(220,220,220," + p.a + ")";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // embers
    for (const p of embers) {
      const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.ph));
      const alpha = p.a * pulse;

      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      glow.addColorStop(0, "rgba(255,140,80," + (alpha * 0.55) + ")");
      glow.addColorStop(1, "rgba(255,140,80,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,170,120," + alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    step(ash, "ash");
    step(embers, "ember");

    requestAnimationFrame(draw);
  }

  // Respect reduced motion
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    // draw once, no animation
    const w = W(), h = H();
    ctx.clearRect(0, 0, w, h);
    return;
  }

  draw();
})();
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
