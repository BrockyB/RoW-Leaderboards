// src/app/StickyFooter.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function StickyFooter({
  children,
  threshold = 24,
  className = "",
}: {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    setMounted(true);

    const getScrollTop = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const update = () => {
      ticking.current = false;
      setVisible(getScrollTop() > threshold);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  // Avoid hydration mismatch: don't portal until mounted.
  if (!mounted) return null;

  return createPortal(
    <div
      className={[
        // IMPORTANT: portaled to body so it pins to the viewport, not the panel/frame
        "fixed left-0 right-0 bottom-0 z-[9999]",
        "px-6 pt-3 pb-4",
        "border-t border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md",
        "footer-reveal",
        visible ? "is-visible" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>,
    document.body
  );
}
