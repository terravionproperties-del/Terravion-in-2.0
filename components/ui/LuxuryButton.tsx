"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { usePointerLight } from "./usePointerLight";

type Variant = "glass" | "gold";

type Common = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type Props = Common &
  (
    | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">)
    | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className">)
  );

/**
 * A button with a material rather than a fill: glass body, champagne rim, a
 * reflection that follows the pointer, an 8px lift on hover and a natural
 * compress-and-spring on press (see .btn-lux in globals.css).
 */
export default function LuxuryButton({
  children,
  variant = "glass",
  className = "",
  ...rest
}: Props) {
  const light = usePointerLight<HTMLElement>();
  const cls = `btn-lux sheen ${variant === "gold" ? "btn-lux--gold" : ""} ${className}`;
  const inner = <span className="relative z-[2]">{children}</span>;

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkRest } = rest as { href: string } & Record<string, unknown>;
    return (
      <Link
        href={href}
        className={cls}
        ref={light.ref as React.Ref<HTMLAnchorElement>}
        onPointerMove={light.onPointerMove}
        onPointerLeave={light.onPointerLeave}
        {...linkRest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      className={cls}
      ref={light.ref as React.Ref<HTMLButtonElement>}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {inner}
    </button>
  );
}
