"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  localizePath,
  stripLocale,
  type Locale,
} from "@/lib/i18n/config";

/**
 * The language selector.
 *
 * Two presentations, one state machine. Above `lg` it is a dropdown anchored to
 * the header; below it, a bottom sheet with a search field, because a dropdown
 * pinned to the top of a phone is a thumb-hostile place to put a list.
 *
 * What makes this more than a `<select>`:
 *
 *   · It navigates rather than reloads. `router.replace` on the translated path
 *     is a soft navigation — the React tree is reconciled, the film canvas and
 *     the scroll position survive, and only the text changes. `location.href =`
 *     would be four lines shorter and would blow away the whole page.
 *   · It writes the cookie and localStorage *before* navigating, so the
 *     middleware sees the new choice on the very next request rather than one
 *     navigation later. Getting that order wrong produces the classic bug where
 *     the first click appears to do nothing.
 *   · The trigger is `aria-haspopup="listbox"`, the panel is a real `listbox`
 *     with roving `aria-selected`, and focus is trapped while it is open. Arrows
 *     move, Home/End jump, Enter commits, Escape closes and returns focus to the
 *     trigger. Typing a letter jumps to the next match — what a native select
 *     does, and what people expect from anything shaped like one.
 *
 * Every user-visible string arrives as a prop from a Server Component. This file
 * imports no dictionary on purpose: a client component that loaded translations
 * would ship every language's JSON to every visitor.
 */

export interface LanguageSelectorStrings {
  label: string;
  change: string;
  current: string;
  select: string;
  searchPlaceholder: string;
  chooseHint: string;
  close: string;
  searchLabel: string;
  noResults: string;
}

export default function LanguageSelector({
  locale,
  strings,
  className = "",
  tone = "dark",
}: {
  locale: Locale;
  strings: LanguageSelectorStrings;
  className?: string;
  /** `dark` sits on the charcoal header; `light` on ivory editorial pages. */
  tone?: "dark" | "light";
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, LOCALES.indexOf(locale)));
  const [pending, setPending] = useState<Locale | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef({ buffer: "", at: 0 });

  const listboxId = useId();

  /** The path with any locale prefix removed — what every alternate builds on. */
  const canonicalPath = useMemo(() => stripLocale(pathname).path, [pathname]);

  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = LOCALES.map((code) => ({ code, ...LOCALE_META[code] }));
    if (!needle) return all;
    return all.filter(
      (o) =>
        o.nativeName.toLowerCase().includes(needle) ||
        o.englishName.toLowerCase().includes(needle) ||
        o.searchAliases.some((a) => a.includes(needle))
    );
  }, [query]);

  /** Keep the highlight on a row that still exists after a search narrows it. */
  useEffect(() => {
    if (activeIndex >= options.length) setActiveIndex(Math.max(0, options.length - 1));
  }, [options.length, activeIndex]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setQuery("");
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const choose = useCallback(
    (next: Locale) => {
      // Guard against a second navigation. A double click, or Enter landing on
      // an already-committed option, used to fire router.replace twice.
      if (next === locale || pending !== null) {
        close();
        return;
      }

      // Persist before navigating. The middleware reads the cookie on the very
      // next request, and localStorage lets a later first paint agree with it
      // without waiting for a round trip.
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // Safari private mode throws on setItem. The cookie still carries the
        // choice, so this is a degraded path rather than a broken one.
      }
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;

      setPending(next);
      close(false);

      // Soft navigation. `replace` rather than `push`, so the back button does
      // not walk the reader through every language they sampled.
      router.replace(localizePath(canonicalPath, next), { scroll: false });
    },
    [locale, canonicalPath, router, close, pending]
  );

  /** The pending flag drives the spinner only; clear it once the route swapped. */
  useEffect(() => {
    setPending(null);
  }, [pathname]);

  // ── keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          close();
          return;
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((i) => (i + 1) % Math.max(1, options.length));
          return;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((i) => (i - 1 + options.length) % Math.max(1, options.length));
          return;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          return;
        case "End":
          event.preventDefault();
          setActiveIndex(Math.max(0, options.length - 1));
          return;
        case "Enter":
        case " ": {
          // Space must stay typeable inside the search field.
          if (event.key === " " && document.activeElement === searchRef.current) return;
          event.preventDefault();
          const option = options[activeIndex];
          if (option) choose(option.code);
          return;
        }
        case "Tab": {
          // The sheet is modal, so Tab cycles inside it.
          const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'button, input, [href], [tabindex]:not([tabindex="-1"])'
          );
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          return;
        }
        default:
          break;
      }

      // Type-ahead, but never while the search box has focus — there the
      // keystroke belongs to the query.
      if (
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        document.activeElement !== searchRef.current
      ) {
        const now = Date.now();
        typeahead.current.buffer =
          now - typeahead.current.at > 700 ? event.key : typeahead.current.buffer + event.key;
        typeahead.current.at = now;
        const needle = typeahead.current.buffer.toLowerCase();
        const hit = options.findIndex(
          (o) =>
            o.englishName.toLowerCase().startsWith(needle) ||
            o.nativeName.toLowerCase().startsWith(needle)
        );
        if (hit >= 0) setActiveIndex(hit);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, options, activeIndex, choose, close]);

  /** Click-away. `pointerdown` rather than `click`, so it fires before focus moves. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  /** Move real focus with the highlight, so a screen reader follows along. */
  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus({ preventScroll: true });
  }, [open, activeIndex]);

  /** Lock the page behind the mobile sheet. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const active = LOCALE_META[locale];
  const isDark = tone === "dark";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setActiveIndex(Math.max(0, LOCALES.indexOf(locale)));
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`${strings.change}. ${strings.current.replace("{language}", active.englishName)}`}
        className="group inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300"
        style={{
          borderColor: isDark ? "rgba(184,138,68,.38)" : "rgba(29,29,29,.14)",
          color: isDark ? "#F1EBE2" : "#1D1D1D",
          backgroundColor: open
            ? isDark
              ? "rgba(184,138,68,.12)"
              : "rgba(29,29,29,.04)"
            : "transparent",
        }}
      >
        <GlobeIcon />
        <span className="hidden sm:inline">{active.nativeName}</span>
        <span className="sm:hidden">{locale.toUpperCase()}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed inset-x-0 bottom-0 z-[70] lg:absolute lg:inset-x-auto lg:bottom-auto lg:end-0 lg:top-[calc(100%+12px)] lg:w-[320px]"
        >
          {/* Scrim exists only at the sheet breakpoint. */}
          <div
            aria-hidden="true"
            onClick={() => close(false)}
            className="fixed inset-0 -z-10 lg:hidden"
            style={{ background: "rgba(20,20,20,.55)", animation: "lang-fade 200ms ease-out" }}
          />

          <div
            id={listboxId}
            role="listbox"
            aria-label={strings.select}
            className="overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(0,0,0,.18)] lg:rounded-[20px] lg:shadow-[0_8px_24px_rgba(0,0,0,.08),0_30px_80px_rgba(0,0,0,.12)]"
            style={{
              border: "1px solid rgba(184,138,68,.18)",
              animation: "lang-in 260ms cubic-bezier(.16,1,.3,1)",
            }}
          >
            {/* Grab handle — sheet only. */}
            <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full" style={{ background: "#DDD6CB" }} />
            </div>

            <div className="flex items-center justify-between px-6 pb-3 pt-4 lg:px-5">
              <p
                className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#8A6736" }}
              >
                {strings.label}
              </p>
              <button
                type="button"
                onClick={() => close()}
                aria-label={strings.close}
                className="grid h-8 w-8 place-items-center rounded-full lg:hidden"
                style={{ background: "#F1EBE2", color: "#1D1D1D" }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Search. The brief asks for it on mobile; it is useful and harmless
                on desktop, so it is not hidden behind a breakpoint. */}
            <div className="px-6 pb-3 lg:px-5">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                aria-label={strings.searchLabel}
                className="h-11 w-full rounded-full px-4 text-[0.9375rem] outline-none transition-shadow"
                style={{ background: "#FAF8F4", border: "1.5px solid #DDD6CB", color: "#222222" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#B88A44";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,138,68,.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#DDD6CB";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <ul className="max-h-[52vh] overflow-y-auto px-2 pb-3 lg:max-h-none lg:pb-2">
              {options.length === 0 && (
                <li className="px-4 py-6 text-center text-[0.9375rem]" style={{ color: "#777777" }}>
                  {strings.noResults}
                </li>
              )}

              {options.map((option, index) => {
                const selected = option.code === locale;
                const highlighted = index === activeIndex;
                return (
                  <li key={option.code} role="none">
                    <button
                      ref={(el) => {
                        optionRefs.current[index] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      lang={option.bcp47}
                      onClick={() => choose(option.code)}
                      onPointerEnter={() => setActiveIndex(index)}
                      // 60px clears the 44px minimum comfortably. This is the
                      // main reason the sheet exists rather than a dropdown.
                      className="flex w-full items-center gap-4 rounded-2xl px-4 text-start transition-colors duration-200"
                      style={{
                        minHeight: 60,
                        background: highlighted ? "#F7F4EE" : "transparent",
                        color: "#1D1D1D",
                      }}
                    >
                      <span aria-hidden="true" className="text-xl leading-none">
                        {option.flag}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[1.0625rem] font-medium leading-tight">
                          {option.nativeName}
                        </span>
                        {option.nativeName !== option.englishName && (
                          <span
                            className="block truncate text-[0.8125rem] leading-tight"
                            style={{ color: "#777777" }}
                          >
                            {option.englishName}
                          </span>
                        )}
                      </span>
                      {selected && <CheckIcon />}
                      {pending === option.code && <SpinnerIcon />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p
              className="border-t px-6 py-3 text-[0.75rem] leading-relaxed lg:px-5"
              style={{ borderColor: "rgba(0,0,0,.06)", color: "#777777" }}
            >
              {strings.chooseHint}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lang-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lang-fade { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          [role="listbox"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M2 8h12M8 1.8c1.7 1.9 2.5 3.9 2.5 6.2s-.8 4.3-2.5 6.2C6.3 12.3 5.5 10.3 5.5 8S6.3 3.7 8 1.8Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="transition-transform duration-300"
      style={{ transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M2 3.5 5 6.5 8 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#B88A44" strokeWidth="2" aria-hidden="true">
      <path d="M3.5 9.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="8" cy="8" r="6.5" stroke="rgba(184,138,68,.25)" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="#B88A44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
    </svg>
  );
}
