"use client";

import { useRef, type ReactNode, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** seconds of stagger between direct children when > 0 */
  stagger?: number;
  delay?: number;
  y?: number;
  once?: boolean;
};

/**
 * Scroll-linked entrance: children rise and fade as the element enters the
 * viewport. With `stagger`, direct children cascade. Respects reduced motion
 * (gsap.matchMedia leaves content fully visible).
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  stagger = 0,
  delay = 0,
  y = 44,
  once = true,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger > 0 ? Array.from(el.children) : el;
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            delay,
            ease: "power3.out",
            stagger,
            scrollTrigger: {
              trigger: el,
              start: "top 84%",
              toggleActions: once ? "play none none none" : "play none none reverse",
            },
          }
        );
      });
    },
    { scope: ref }
  );

  const Component = Tag as any;

  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
