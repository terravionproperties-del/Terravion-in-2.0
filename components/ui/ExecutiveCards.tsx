"use client";

import { useState } from "react";
import Image from "next/image";

export interface Executive {
  name: string;
  role: string;
  phone: string;
  phoneRaw: string;
  email: string;
  location: string;
  cardImage: string;
}

export const EXECUTIVES: Executive[] = [
  {
    name: "P. Ramya Sri",
    role: "Associate Vice President (Sales)",
    phone: "+91 93472 59638",
    phoneRaw: "919347259638",
    email: "info@terravionproperties.com",
    location: "Shankarpally Experience Centre, Hyderabad - 500084",
    cardImage: "/assets/ramya-business-card.png",
  },
  {
    name: "P. Vijay Bhasker",
    role: "Chief General Manager",
    phone: "+91 97058 81997",
    phoneRaw: "919705881997",
    email: "vijaybhaskarponnaganti1999@gmail.com",
    location: "8th Floor, Pardha Picasa, Madhapur, Hyderabad - 500084",
    cardImage: "/assets/bhaskar-business-card.png",
  },
];

export default function ExecutiveCards({
  title = "Executive Advisory & Leadership",
  subtitle = "Direct access to our senior leadership team for verified masterplans, transparent pricing, and VIP site visit arrangements.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [zoomedCard, setZoomedCard] = useState<string | null>(null);

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="mb-10 text-left">
          <p className="label text-[#b88d23]">Direct Leadership Desk</p>
          {title && (
            <h3 className="font-serif text-3xl md:text-4xl font-bold mt-2 text-charcoal">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {EXECUTIVES.map((exec) => (
          <div
            key={exec.name}
            className="group relative flex flex-col overflow-hidden rounded-3xl border bg-white border-charcoal/10 hover:border-gold shadow-sm transition-all duration-300 hover:shadow-xl"
          >
            {/* Clickable Card Visual */}
            <div
              className="relative aspect-[16/10] w-full overflow-hidden bg-travertine cursor-pointer"
              onClick={() => setZoomedCard(exec.cardImage)}
            >
              <Image
                src={exec.cardImage}
                alt={`${exec.name} — ${exec.role}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-charcoal backdrop-blur-xs border border-charcoal/15">
                Click to Zoom 🔍
              </span>
            </div>

            {/* Content & Direct Action Bar */}
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xl font-bold font-serif text-charcoal">
                      {exec.name}
                    </h4>
                    <p className="text-xs font-bold text-[#b88d23] mt-0.5 tracking-wide uppercase">
                      {exec.role}
                    </p>
                  </div>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-[#b88d23] border border-amber-400/30">
                    Official
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="text-text-secondary">{exec.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>✉️</span>
                    <a
                      href={`mailto:${exec.email}`}
                      className="text-slate-500 hover:text-[#b88d23] transition-colors truncate"
                    >
                      {exec.email}
                    </a>
                  </p>
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2.5">
                <a
                  href={`tel:${exec.phoneRaw}`}
                  className="flex-1 rounded-xl bg-gold-dark hover:bg-gold text-white px-3.5 py-2.5 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <span>📞</span>
                  <span>Call {exec.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${exec.phoneRaw}?text=${encodeURIComponent(
                    `Hello ${exec.name}, I am reaching out from Terravion website regarding villa plot opportunities.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
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
