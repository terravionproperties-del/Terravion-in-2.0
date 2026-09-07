"use client";
/**
 * components/gis/PlotDetailPanel.tsx
 * Right-side detail drawer — opens on plot click with cinematic slide animation.
 * Shows: image, price, EMI calculator, specifications, nearby amenities, CTA buttons.
 */

import { useState, useCallback } from "react";
import { useGISStore } from "@/lib/stores/gisStore";
import { formatINR, calculateEMI } from "@/lib/engines/PlotEngine";
import { PLOT_STATUS_COLORS, PLOT_FACING_COLORS } from "@/lib/types/gis";

export function PlotDetailPanel() {
  const { selectedPlot, selectPlot, project } = useGISStore();
  const [emiRate, setEmiRate] = useState(9);
  const [emiTenure, setEmiTenure] = useState(120); // 10 years

  const handleClose = useCallback(() => selectPlot(null), [selectPlot]);

  const isOpen = selectedPlot !== null;
  const plot = selectedPlot;
  const statusColor = plot ? PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666" : "#666";
  const facingColor = plot ? PLOT_FACING_COLORS[plot.facing] ?? "#fff" : "#fff";

  const emiAmount = plot
    ? calculateEMI(plot.totalPrice * 0.8, emiRate, emiTenure)
    : 0;

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          width: isOpen ? "min(420px, 100vw)" : "0px",
          background: "linear-gradient(180deg, rgba(8,8,16,0.98) 0%, rgba(12,12,24,0.98) 100%)",
          borderLeft: isOpen ? "1px solid rgba(255,215,0,0.15)" : "none",
          backdropFilter: "blur(20px)",
        }}
      >
        {isOpen && plot && (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>

            {/* Status image header */}
            <div
              className="relative h-48 flex-shrink-0 flex items-end p-5"
              style={{
                background: `linear-gradient(135deg, ${statusColor}40, ${statusColor}10)`,
                borderBottom: `1px solid ${statusColor}30`,
              }}
            >
              {/* Plot number large */}
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Plot Number</p>
                <h2 className="text-6xl font-black text-white leading-none">#{plot.plotNumber}</h2>
              </div>

              {/* Status badge */}
              <div
                className="absolute top-5 left-5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
                style={{ background: statusColor, color: "#000" }}
              >
                {plot.status}
              </div>

              {/* Corner/Premium badges */}
              <div className="absolute top-5 right-12 flex gap-2">
                {plot.isCorner && (
                  <span className="px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold">CORNER</span>
                )}
                {plot.isPremium && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">PREMIUM</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {/* Price section */}
              <div
                className="rounded-2xl p-4 border"
                style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}
              >
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Price</p>
                <p className="text-3xl font-black text-green-400">{formatINR(plot.totalPrice)}</p>
                {plot.offerPrice && (
                  <p className="text-sm text-white/40 mt-0.5">Offer: {formatINR(plot.offerPrice)}</p>
                )}
                <p className="text-xs text-white/50 mt-1">₹{plot.price.toLocaleString("en-IN")} per sq yard</p>
                {plot.bookingAmount && (
                  <p className="mt-2 text-xs text-amber-400 font-semibold">
                    Booking Amount: {formatINR(plot.bookingAmount)}
                  </p>
                )}
              </div>

              {/* Specifications */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Plot Specifications</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Area", value: `${plot.dimension.areaSqYards} Sq Yards` },
                    { label: "Sq Ft", value: `${plot.dimension.areaSqFt} Sq Ft` },
                    { label: "Dimensions", value: `${plot.dimension.length}ft × ${plot.dimension.breadth}ft` },
                    { label: "Road Width", value: `${plot.roadWidth} ft wide` },
                    {
                      label: "Facing",
                      value: <span style={{ color: facingColor }}>{plot.facing}</span>,
                    },
                    { label: "PLC Charge", value: plot.plcCharge ? formatINR(plot.plcCharge) : "None" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 border"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{label}</p>
                      <p className="text-sm text-white font-semibold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attributes */}
              <div className="flex flex-wrap gap-2">
                {plot.isParkFacing && (
                  <span className="px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-400/20 text-green-300 text-xs font-semibold">🌳 Park Facing</span>
                )}
                {plot.isClubhouseFacing && (
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">🏛️ Clubhouse View</span>
                )}
                {plot.isEntranceFacing && (
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold">🚪 Near Entrance</span>
                )}
              </div>

              {/* EMI Calculator */}
              <div
                className="rounded-2xl p-4 border"
                style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">EMI Calculator (80% Loan)</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Interest Rate</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={6} max={15} step={0.5}
                        value={emiRate}
                        onChange={(e) => setEmiRate(Number(e.target.value))}
                        className="flex-1 accent-indigo-400"
                      />
                      <span className="text-white text-xs font-bold w-10">{emiRate}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Tenure</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={12} max={240} step={12}
                        value={emiTenure}
                        onChange={(e) => setEmiTenure(Number(e.target.value))}
                        className="flex-1 accent-indigo-400"
                      />
                      <span className="text-white text-xs font-bold w-12">{emiTenure / 12}yr</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Monthly EMI</span>
                  <span className="text-2xl font-black text-indigo-400">{formatINR(emiAmount)}<span className="text-sm font-normal">/mo</span></span>
                </div>
              </div>

              {/* CTA Buttons */}
              {plot.status === "AVAILABLE" || plot.status === "PREMIUM" ? (
                <div className="space-y-3">
                  <a
                    href={`tel:+919876543210`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", boxShadow: "0 4px 24px rgba(34,197,94,0.3)" }}
                  >
                    📞 Call Now — Reserve Plot #{plot.plotNumber}
                  </a>
                  <a
                    href={`https://wa.me/919876543210?text=Hi, I'm interested in Plot #${plot.plotNumber} (${plot.dimension.areaSqYards} SY, ${plot.facing} facing) at ${project?.name ?? "Terravion"}. Please share more details.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                    style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", color: "#fff", boxShadow: "0 4px 24px rgba(37,211,102,0.3)" }}
                  >
                    💬 WhatsApp Enquiry
                  </a>
                  <a
                    href="/site-visit"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm border transition-all"
                    style={{ borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24", background: "rgba(251,191,36,0.06)" }}
                  >
                    🏡 Book a Site Visit
                  </a>
                </div>
              ) : (
                <div
                  className="text-center py-4 rounded-2xl border text-sm font-semibold"
                  style={{ borderColor: `${PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666"}30`, color: PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666", background: `${PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666"}08` }}
                >
                  This plot is {plot.status.toLowerCase()}
                </div>
              )}

              {/* Notes */}
              {plot.notes && (
                <div
                  className="rounded-xl p-4 border text-xs text-white/50 leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Notes</p>
                  {plot.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
