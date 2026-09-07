"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stillUrl } from "@/lib/film";

gsap.registerPlugin(ScrollTrigger);

export interface Chapter {
  n: string;
  kicker: string;
  title: string;
  /** two or three short paragraphs — this is a film, not an essay */
  body: string[];
  /** original frame number from the reel */
  frame: number;
  /** which third of the frame the type sits in */
  side: "left" | "right";
  /** an optional pulled fact, set like a plaque */
  plaque?: { label: string; value: string };
}

/**
 * A chapter stack.
 *
 * Each chapter holds the full viewport with one architectural frame behind it.
 * The frame pushes in slowly while the type travels over it, so the reader
 * moves through the building rather than past a column of cards. Nothing is
 * boxed and no chapter shares a layout with its neighbour.
 */
export default function Chapters({ chapters }: { chapters: Chapter[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Scoped to this component's own root. The selector used to query the
      // whole document, so on a client-side navigation it could still match
      // chapter nodes from the page being unmounted and build triggers against
      // elements that were about to disappear.
      const scope = root.current;
      if (!scope) return;
      const sections = gsap.utils.toArray<HTMLElement>(
        scope.querySelectorAll("[data-chapter]")
      );
      sections.forEach((section) => {
        const image = section.querySelector("[data-chapter-image]");
        const copy = section.querySelector("[data-chapter-copy]");

        if (image) {
          gsap.fromTo(
            image,
            { scale: 1.14 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.1,
              },
            }
          );
        }
        if (copy) {
          gsap.fromTo(
            copy,
            { autoAlpha: 0, y: 60 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1.2,
              ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 62%" },
            }
          );
          // Drifts away as the chapter leaves, so chapters overlap in memory.
          //
          // Written as `fromTo` with an explicit `autoAlpha: 1` start, not as a
          // `to`. This is the fix for "the text vanishes when I scroll back up".
          //
          // A scrubbed `to` has to infer where it is scrubbing *back* to, and it
          // infers it from whatever the element's value happens to be the first
          // time the tween renders. The reveal tween above sets the copy to
          // `autoAlpha: 0` before it animates in, so the fade-out could capture
          // 0 — or, on a fast scroll where both triggers fire close together,
          // some half-finished value mid-transition. Scrolling up then scrubbed
          // toward invisible and stayed there; only a reload, which replayed the
          // reveal, brought the copy back.
          //
          // Stating both ends removes the guess. Progress 0 is always fully
          // visible, whatever the scroll speed or the order the triggers fire in.
          gsap.fromTo(
            copy,
            { autoAlpha: 1, y: 0 },
            {
              autoAlpha: 0,
              y: -50,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: section,
                start: "bottom 78%",
                end: "bottom 32%",
                scrub: true,
              },
            }
          );
        }
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root}>
      {chapters.map((c) => (
        <section
          key={c.n}
          data-chapter
          aria-label={`${c.n} — ${c.title}`}
          className="relative isolate flex min-h-[100svh] items-center overflow-hidden"
        >
          <div
            data-chapter-image
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-center will-change-transform"
            style={{ backgroundImage: `url(${stillUrl(c.frame)})` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                c.side === "left"
                  ? "linear-gradient(95deg, rgba(247,244,238,.97) 0%, rgba(247,244,238,.92) 28%, rgba(247,244,238,.55) 52%, transparent 72%)"
                  : "linear-gradient(265deg, rgba(247,244,238,.97) 0%, rgba(247,244,238,.92) 28%, rgba(247,244,238,.55) 52%, transparent 72%)",
            }}
          />

          <div
            className={`mx-auto flex w-full max-w-[1500px] px-7 md:px-12 ${
              c.side === "right" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              data-chapter-copy
              className={`max-w-[46ch] ${c.side === "right" ? "text-right" : ""}`}
            >
              <div
                className={`flex items-baseline gap-5 ${
                  c.side === "right" ? "justify-end" : ""
                }`}
              >
                <span className="display text-5xl text-gold-ink/45 md:text-6xl">
                  {c.n}
                </span>
                <span className="label text-gold-ink">{c.kicker}</span>
              </div>

              <h2 className="display mt-7 text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.0] text-charcoal">
                {c.title}
              </h2>

              <div className="mt-8 space-y-5">
                {c.body.map((p, i) => (
                  <p
                    key={i}
                    className="text-[1.02rem] leading-relaxed text-text-secondary md:text-lg"
                  >
                    {p}
                  </p>
                ))}
              </div>

              {c.plaque && (
                <div
                  className={`mt-10 inline-block border-t border-charcoal/20 pt-5 ${
                    c.side === "right" ? "text-right" : ""
                  }`}
                >
                  <p className="label text-text-muted">{c.plaque.label}</p>
                  <p className="display mt-2 text-3xl text-charcoal">
                    {c.plaque.value}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
