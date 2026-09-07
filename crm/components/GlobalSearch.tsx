"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit, SearchKind } from "@/lib/repos/search";

/**
 * The command palette.
 *
 * Cmd/Ctrl-K from anywhere, or `/` when the caret is not already in a field.
 * It is the fastest route to a record when someone is on the phone and has
 * only a name or the last five digits of a number.
 *
 * Two decisions worth stating:
 *
 *   · Every keystroke would otherwise be a query, so the fetch is debounced and
 *     the in-flight request is aborted the moment the term changes. Without the
 *     abort a slow "sh" can land after a fast "shankarpally" and replace the
 *     right answer with a stale one.
 *   · The rows are not buttons. They are `role="option"` inside a listbox
 *     driven by `aria-activedescendant`, so focus never leaves the input —
 *     arrow keys move the selection while typing keeps working, and a screen
 *     reader announces the highlighted row instead of a focus jump.
 */

const DEBOUNCE_MS = 180;
const MIN_TERM = 2;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const KIND_LABEL: Record<SearchKind, string> = {
  lead: "Leads",
  project: "Projects",
};

interface Group {
  kind: SearchKind;
  items: SearchHit[];
}

export default function GlobalSearch() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const q = term.trim();
  const ready = q.length >= MIN_TERM;

  // After mount, so the first render matches the server's and hydration holds.
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  /* ── opening and closing ─────────────────────────────────────────── */

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      // `/` is a shortcut only where it is not a character someone is typing
      if (e.key === "/" && !isTyping(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = priorOverflow;
      restoreTo?.focus?.();
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setTerm("");
    setHits([]);
    setFailed(false);
    setActive(0);
  }, []);

  /* ── fetching ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!open) return;
    if (!ready) {
      setHits([]);
      setBusy(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setBusy(true);

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) =>
          res.ok ? res.json() : Promise.reject(new Error(String(res.status)))
        )
        .then((data: { results?: SearchHit[] }) => {
          if (controller.signal.aborted) return;
          setHits(data.results ?? []);
          setFailed(false);
          setBusy(false);
          setActive(0);
        })
        .catch(() => {
          // an abort is the expected outcome of typing, not a failure
          if (controller.signal.aborted) return;
          setHits([]);
          setFailed(true);
          setBusy(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, ready, open]);

  /* ── selection ───────────────────────────────────────────────────── */

  const groups = useMemo<Group[]>(() => {
    const order: SearchKind[] = [];
    const byKind = new Map<SearchKind, SearchHit[]>();
    for (const hit of hits) {
      let bucket = byKind.get(hit.kind);
      if (!bucket) {
        bucket = [];
        byKind.set(hit.kind, bucket);
        order.push(hit.kind);
      }
      bucket.push(hit);
    }
    return order.map((kind) => ({ kind, items: byKind.get(kind) ?? [] }));
  }, [hits]);

  // Grouping reorders the rows, so the keyboard index has to follow what is
  // rendered rather than the order the server returned.
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const optionCount = ready ? flat.length + 1 : 0;

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, flat.length]);

  const go = useCallback(
    (index: number) => {
      const hit = flat[index];
      const href = hit ? hit.href : `/search?q=${encodeURIComponent(q)}`;
      close();
      router.push(href);
    },
    [flat, q, close, router]
  );

  function onPanelKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === "Tab") {
      trapTab(e, panelRef.current);
      return;
    }

    if (!optionCount) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + optionCount) % optionCount);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(optionCount - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    }
  }

  /* ── render ──────────────────────────────────────────────────────── */

  let index = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[0.8125rem] text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
      >
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search CRM...</span>
        </span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-slate-500 shadow-2xs">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 px-4">
          <div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onKeyDown={onPanelKeyDown}
            className="relative mx-auto mt-[11vh] w-full max-w-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4">
              <span aria-hidden="true" className="text-[0.9375rem] text-slate-400">
                ⌕
              </span>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={optionCount > 0}
                aria-controls="global-search-results"
                aria-autocomplete="list"
                aria-activedescendant={
                  optionCount > 0 ? `global-search-option-${active}` : undefined
                }
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Name, phone, reference, email, remark or project"
                maxLength={120}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent py-4 text-[0.9375rem] text-slate-900 outline-none placeholder:text-slate-400"
              />
              {busy && (
                <span className="shrink-0 text-[0.6875rem] text-slate-400">Searching</span>
              )}
            </div>

            <div
              ref={listRef}
              id="global-search-results"
              role="listbox"
              aria-label="Results"
              className="max-h-[54vh] overflow-y-auto p-2"
            >
              {!ready && (
                <p className="px-3 py-6 text-center text-[0.8125rem] text-slate-500">
                  Type two characters. A phone number finds its lead however it is
                  written.
                </p>
              )}

              {ready && failed && (
                <p className="px-3 py-6 text-center text-[0.8125rem] text-rose-600">
                  Search is unavailable. Try again in a moment.
                </p>
              )}

              {ready &&
                !failed &&
                groups.map((group) => (
                  <div key={group.kind} role="group" aria-labelledby={`gs-${group.kind}`}>
                    <div id={`gs-${group.kind}`} className="label px-3 pb-1 pt-3 text-slate-400">
                      {KIND_LABEL[group.kind]}
                    </div>
                    {group.items.map((hit) => {
                      index += 1;
                      const i = index;
                      return (
                        <div
                          key={`${hit.kind}-${hit.id}`}
                          id={`global-search-option-${i}`}
                          role="option"
                          aria-selected={i === active}
                          data-active={i === active}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(i)}
                          className={`flex cursor-pointer items-baseline justify-between gap-4 rounded-lg px-3 py-2 ${
                            i === active ? "bg-slate-100 text-slate-900" : "text-slate-700"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[0.875rem] font-medium">{hit.title}</span>
                            {hit.subtitle && (
                              <span className="block truncate text-[0.75rem] text-slate-500">
                                {hit.subtitle}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            {hit.matchedOn.toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {ready && !failed && (
                <div
                  id={`global-search-option-${flat.length}`}
                  role="option"
                  aria-selected={active === flat.length}
                  data-active={active === flat.length}
                  onMouseMove={() => setActive(flat.length)}
                  onClick={() => go(flat.length)}
                  className={`mt-2 cursor-pointer rounded-lg border-t border-slate-100 px-3 py-2.5 text-[0.8125rem] text-slate-600 ${
                    active === flat.length ? "bg-slate-100 text-slate-900" : ""
                  }`}
                >
                  {flat.length === 0 && !busy
                    ? `Nothing matched “${q}”. Open the full search`
                    : `See every match for “${q}”`}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-[0.6875rem] text-slate-400 bg-slate-50">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Keeps Tab inside the dialog; without it, focus walks the page behind it. */
function trapTab(e: React.KeyboardEvent, panel: HTMLElement | null) {
  const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (!nodes || nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
