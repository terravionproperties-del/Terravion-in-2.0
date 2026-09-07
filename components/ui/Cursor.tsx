"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Premium cursor: a brass dot that tracks instantly and a trailing ring that
 * eases behind it, expanding over interactive elements. Desktop pointers only;
 * hidden for touch and reduced-motion users via CSS.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    const move = (e: PointerEvent) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor]"
      );
      ring.classList.toggle("is-active", Boolean(target));
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
