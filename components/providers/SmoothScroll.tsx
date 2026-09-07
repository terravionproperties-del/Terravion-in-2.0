"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger and the
 * scroll position advance on the same rAF — one clock, no jank.
 * Honors prefers-reduced-motion by not instantiating Lenis at all.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || pathname.includes("/gis/")) return;

    let lenis: Lenis | null = null;
    try {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 1.6,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(tick);
        lenis?.destroy();
      };
    } catch {
      // Fallback to native scrolling if Lenis fails to attach
    }
  }, [pathname]);

  return <>{children}</>;
}
