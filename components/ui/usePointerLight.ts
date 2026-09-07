"use client";

import { useCallback, useRef } from "react";

/**
 * Writes the pointer's position within an element as `--mx` / `--my`
 * percentages, so CSS can put a highlight exactly where the light would fall.
 *
 * Values are written straight to style (no React state) and only while the
 * pointer is over the element — a reflection that costs a re-render per
 * mousemove is not worth having.
 */
export function usePointerLight<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const frame = useRef(0);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) return; // coalesce to one write per frame
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((clientY - r.top) / r.height) * 100}%`);
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
