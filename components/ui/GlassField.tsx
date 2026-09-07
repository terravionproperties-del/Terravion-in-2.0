"use client";

import { useId, type ReactNode } from "react";
import { usePointerLight } from "./usePointerLight";

type Base = {
  label: string;
  /** shown only once the floating label has moved out of the way */
  placeholder?: string;
  className?: string;
};

/**
 * Transparent glass field with a floating label, gold focus ring and a glow
 * that tracks the cursor inside the field. The label is a sibling *after* the
 * control so CSS can lift it with :not(:placeholder-shown) — which is why
 * every control carries a placeholder of " ".
 */
export function GlassField({
  label,
  placeholder,
  className = "",
  ...input
}: Base & Omit<React.ComponentPropsWithoutRef<"input">, "placeholder" | "className">) {
  const id = useId();
  const light = usePointerLight<HTMLDivElement>();
  // date/time inputs render their own format text, so the label must move out
  // of the way permanently rather than waiting for focus
  const alwaysFloat = ["date", "time", "datetime-local", "month"].includes(
    String(input.type)
  );
  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      className={`vfield ${alwaysFloat ? "vfield--float" : ""} ${className}`}
    >
      <input id={id} placeholder={placeholder ?? " "} {...input} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function GlassTextarea({
  label,
  placeholder,
  className = "",
  ...ta
}: Base & Omit<React.ComponentPropsWithoutRef<"textarea">, "placeholder" | "className">) {
  const id = useId();
  const light = usePointerLight<HTMLDivElement>();
  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      className={`vfield ${className}`}
    >
      <textarea id={id} placeholder={placeholder ?? " "} {...ta} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function GlassSelect({
  label,
  className = "",
  children,
  value,
  ...sel
}: Base & { children: ReactNode } & Omit<
    React.ComponentPropsWithoutRef<"select">,
    "className"
  >) {
  const id = useId();
  const light = usePointerLight<HTMLDivElement>();
  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      // a select always displays an option, so its label lives floated
      className={`vfield vfield--float ${className}`}
    >
      <select id={id} value={value} {...sel}>
        {children}
      </select>
      <label htmlFor={id}>{label}</label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gold-ink"
      >
        <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
          <path
            d="M1 1l4.5 4.5L10 1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </div>
  );
}
