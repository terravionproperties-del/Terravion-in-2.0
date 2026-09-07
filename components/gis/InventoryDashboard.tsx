"use client";
/**
 * components/gis/InventoryDashboard.tsx
 * Animated statistics bar — total plots, available, booked, sold, revenue.
 * Live updates when Supabase pushes plot status changes.
 */

import { useRef } from "react";
import { useGISStore } from "@/lib/stores/gisStore";
import { formatINR } from "@/lib/engines/PlotEngine";


// Animated counter hook
function useCountUp(target: number, duration = 800): number {
  const countRef = useRef(target);
  countRef.current = target;
  return countRef.current;
}


interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  glowColor: string;
  icon: string;
  suffix?: string;
}

function StatCard({ label, value, color, glowColor, icon, suffix }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border backdrop-blur-md min-w-[110px]"
      style={{
        background: `linear-gradient(135deg, ${glowColor}18, ${glowColor}08)`,
        borderColor: `${glowColor}30`,
        boxShadow: `0 0 20px ${glowColor}15, inset 0 1px 0 ${glowColor}20`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <span
        className="text-2xl font-black tracking-tight"
        style={{ color }}
      >
        {value}{suffix}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

interface InventoryDashboardProps {
  compact?: boolean;
}

export function InventoryDashboard({ compact = false }: InventoryDashboardProps) {
  const stats = useGISStore((s) => s.stats);

  if (!stats) return null;

  const s = stats;

  if (compact) {
    return (
      <div className="flex gap-3 items-center flex-wrap">
        <StatCard label="Total" value={s.total} color="#e2e8f0" glowColor="#e2e8f0" icon="📊" />
        <StatCard label="Available" value={s.available} color="#22c55e" glowColor="#22c55e" icon="✅" />
        <StatCard label="Booked" value={s.booked} color="#f97316" glowColor="#f97316" icon="📋" />
        <StatCard label="Sold" value={s.sold} color="#ef4444" glowColor="#ef4444" icon="🏷️" />
        <StatCard label="Reserved" value={s.reserved} color="#a855f7" glowColor="#a855f7" icon="🔒" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Primary stats row */}
      <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
        <StatCard label="Total Plots" value={s.total} color="#e2e8f0" glowColor="#e2e8f0" icon="📊" />
        <StatCard label="Available" value={s.available} color="#22c55e" glowColor="#22c55e" icon="✅" />
        <StatCard label="Booked" value={s.booked} color="#f97316" glowColor="#f97316" icon="📋" />
        <StatCard label="Sold" value={s.sold} color="#ef4444" glowColor="#ef4444" icon="🏷️" />
        <StatCard label="Reserved" value={s.reserved} color="#a855f7" glowColor="#a855f7" icon="🔒" />
        <StatCard label="Premium" value={s.premium} color="#eab308" glowColor="#eab308" icon="⭐" />
        <StatCard label="Corner" value={s.corner} color="#60a5fa" glowColor="#60a5fa" icon="🔷" />
      </div>

      {/* Financial row */}
      <div className="flex gap-3 flex-wrap mt-3 justify-center lg:justify-start">
        <div
          className="flex flex-col items-start gap-1 px-5 py-3 rounded-2xl border backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, #fbbf2418, #f59e0b08)",
            borderColor: "#fbbf2430",
            boxShadow: "0 0 20px #fbbf2415, inset 0 1px 0 #fbbf2420",
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Total Inventory Value</span>
          <span className="text-xl font-black text-amber-400">{formatINR(s.totalInventoryValue)}</span>
        </div>
        <div
          className="flex flex-col items-start gap-1 px-5 py-3 rounded-2xl border backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, #22c55e18, #16a34a08)",
            borderColor: "#22c55e30",
            boxShadow: "0 0 20px #22c55e15, inset 0 1px 0 #22c55e20",
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Revenue This Month</span>
          <span className="text-xl font-black text-green-400">{formatINR(s.revenueThisMonth || s.soldValue)}</span>
        </div>
        <div
          className="flex flex-col items-start gap-1 px-5 py-3 rounded-2xl border backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, #60a5fa18, #2563eb08)",
            borderColor: "#60a5fa30",
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Avg. Price / SY</span>
          <span className="text-xl font-black text-blue-400">₹{s.avgPricePerSqYard.toLocaleString("en-IN")}</span>
        </div>
        <div
          className="flex flex-col items-start gap-1 px-5 py-3 rounded-2xl border backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, #f4737318, #dc262608)",
            borderColor: "#ef444430",
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Sold This Month</span>
          <span className="text-xl font-black text-red-400">{s.soldThisMonth} Plots</span>
        </div>
      </div>
    </div>
  );
}
