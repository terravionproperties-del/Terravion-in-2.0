"use client";

import {
  useRef,
  type ReactNode,
  type MouseEvent,
  type ComponentPropsWithoutRef,
} from "react";
import Link from "next/link";
import gsap from "gsap";

type Variant = "solid" | "outline" | "ghost" | "gold";

const variants: Record<Variant, string> = {
  solid:
    "bg-gold text-charcoal hover:bg-gold-dark hover:text-white border border-transparent",
  gold: "bg-brass text-white hover:bg-[#9a7a3a] border border-transparent",
  outline:
    "border border-ink/25 text-ink hover:border-ink/60 bg-transparent",
  ghost: "border border-ink/25 text-ink hover:border-ink/60 bg-transparent",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className">)
);

/**
 * Magnetic button — the label leans toward the pointer inside a fixed hit
 * area, springing back on leave. Pointer math is skipped for touch devices.
 */
export default function MagneticButton({
  children,
  variant = "solid",
  className = "",
  ...rest
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: MouseEvent) => {
    const el = wrapRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: x * 0.28, y: y * 0.34, duration: 0.4, ease: "power3.out" });
  };

  const onLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  };

  const cls = `group relative inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-[0.8125rem] font-medium tracking-[0.18em] uppercase transition-colors duration-300 ${variants[variant]} ${className}`;

  const inner = (
    <span ref={wrapRef} className="inline-flex items-center gap-3 will-change-transform">
      {children}
    </span>
  );

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkRest } = rest as { href: string } & Record<string, unknown>;
    return (
      <Link
        href={href}
        className={cls}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...linkRest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      className={cls}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {inner}
    </button>
  );
}
