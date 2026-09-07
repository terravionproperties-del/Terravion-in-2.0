"use client";

import type { ReactNode } from "react";
import LeadForm from "@/components/forms/LeadForm";
import { usePointerLight } from "@/components/ui/usePointerLight";
import { stillUrl } from "@/lib/film";
import { site } from "@/lib/site";

/**
 * The invitation.
 *
 * One cinematic frame runs the full width — there is no split panel and no
 * coloured rectangle. The enquiry floats above the architecture on a single
 * glass card sized to its own contents, overlapping the scene so the two
 * layers read as one space rather than two boxes side by side. The card's
 * reflections track the pointer.
 */
export default function BookingExperience({
  aside,
}: {
  /** replaces the default left column — used by /site-visit for its itinerary */
  aside?: ReactNode;
}) {
  const light = usePointerLight<HTMLDivElement>();

  return (
    <section
      id="book-visit"
      aria-label="Book a site visit"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-32 lg:py-24"
    >
      {/* background: the experience centre at dusk, edge to edge */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${stillUrl(1876)})` }}
      />
      {/* Depth, in three layers: a ground for the copy on the left (it would
          otherwise sit on the lit clubhouse), a haze behind the card, and a
          base gradient to seat the whole frame. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: [
            "linear-gradient(95deg, rgba(247,244,238,.97) 0%, rgba(247,244,238,.92) 26%, rgba(247,244,238,.6) 46%, transparent 62%)",
            "linear-gradient(rgba(247,244,238,.6), rgba(247,244,238,.7))",
            "linear-gradient(to top, rgba(247,244,238,.9) 0%, rgba(247,244,238,.35) 38%, transparent 62%)",
          ].join(", "),
        }}
      />

      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-y-12 px-6 md:px-10 lg:grid-cols-[1.1fr_minmax(400px,540px)] lg:gap-x-12">
        {/* the big visual executive leadership cards on the left */}
        <div className="w-full">{aside ?? <DefaultAside />}</div>

        {/* the card — sized to the form, floating, overlapping the scene */}
        <div
          ref={light.ref}
          onPointerMove={light.onPointerMove}
          onPointerLeave={light.onPointerLeave}
          className="w-full max-w-[560px] rounded-[32px] bg-white p-8 sm:p-10 lg:-ms-8 lg:p-12"
          style={{
            border: "1px solid #E6E0D6",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08), 0 35px 90px rgba(0,0,0,.10)",
          }}
        >
          <div className="mb-10 text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.25em] text-[#9C6D28]">
              Book a site visit
            </p>
            <p className="display mt-4 text-[clamp(2rem,3.4vw,3rem)] font-normal leading-[1.1] text-[#222222]">
              Reserve your afternoon
            </p>
            <p className="mt-4 text-[20px] leading-[1.7] text-[#666666]">
              Two hours on the land, documents in hand.
            </p>
          </div>
          <LeadForm intent="Site visit" />
        </div>
      </div>
    </section>
  );
}

import { EXECUTIVES } from "@/components/ui/ExecutiveCards";
import Image from "next/image";
import { useState } from "react";

function DefaultAside() {
  const [zoomedCard, setZoomedCard] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="label text-gold-ink">Direct Leadership & Site Advisory</p>
        <h2 className="display mt-2 text-[clamp(2rem,3.5vw,3.2rem)] font-bold leading-[1.05] text-charcoal">
          Executive Advisory Desk
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Connect directly with senior leadership for verified layout files, priority plot booking, and scheduled site visits.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {EXECUTIVES.map((exec) => (
          <div
            key={exec.name}
            className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white/90 backdrop-blur-md shadow-xl transition-all hover:border-gold/60"
          >
            {/* Big High-Res Visual Card */}
            <div
              className="relative aspect-[16/10] w-full overflow-hidden bg-travertine cursor-pointer"
              onClick={() => setZoomedCard(exec.cardImage)}
            >
              <Image
                src={exec.cardImage}
                alt={`${exec.name} — ${exec.role}`}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[9px] font-bold text-charcoal backdrop-blur-xs border border-charcoal/15">
                🔍 Click to Expand
              </span>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-col justify-between p-4 bg-white flex-1">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-charcoal font-serif">{exec.name}</h3>
                    <p className="text-[11px] font-bold text-gold-ink uppercase tracking-wide">
                      {exec.role}
                    </p>
                  </div>
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold-ink border border-gold/40">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5 truncate">
                  <span>📍</span> {exec.location}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-charcoal/10 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${exec.phoneRaw}`}
                  className="rounded-xl bg-gold-dark hover:bg-gold text-white text-xs font-bold py-2 text-center transition-all flex items-center justify-center gap-1 border border-gold-dark"
                >
                  <span>📞</span> Call
                </a>
                <a
                  href={`https://wa.me/${exec.phoneRaw}?text=${encodeURIComponent(
                    `Hello ${exec.name}, I am reaching out from Terravion website regarding a site visit.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 text-center transition-all flex items-center justify-center gap-1 shadow-md"
                >
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setZoomedCard(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedCard(null)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            <div className="relative h-[70vh] w-full">
              <Image
                src={zoomedCard}
                alt="Business Card Full Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
