"use client";
/**
 * components/gis/GISToolbar.tsx
 * Top-right floating toolbar — day/night cycle, map mode, camera presets, search.
 */

import { useState } from "react";
import { useGISStore } from "@/lib/stores/gisStore";
import type { DayMode, CameraView } from "@/lib/types/gis";

export function GISToolbar() {
  const {
    dayMode, setDayMode,
    mapMode, setMapMode,
    cameraView, setCameraView,
    showFilterPanel, toggleFilterPanel,
    showNearbyPlaces, toggleNearbyPlaces,
    searchQuery, setSearchQuery,
    project,
  } = useGISStore();

  const [searchOpen, setSearchOpen] = useState(false);

  const dayModes: { mode: DayMode; icon: string; label: string }[] = [
    { mode: "morning", icon: "☀️", label: "Morning" },
    { mode: "sunset",  icon: "🌅", label: "Sunset" },
    { mode: "night",   icon: "🌙", label: "Night" },
  ];

  const cameraPresets: { view: CameraView; icon: string; label: string }[] = [
    { view: "bird_eye",   icon: "🦅", label: "Bird Eye" },
    { view: "entrance",   icon: "🚪", label: "Entrance" },
    { view: "park",       icon: "🌳", label: "Park" },
    { view: "clubhouse",  icon: "🏛️", label: "Clubhouse" },
  ];

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 items-end pointer-events-none">
      {/* All items need pointer-events-auto */}

      {/* Search bar */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {searchOpen && (
          <input
            autoFocus
            type="text"
            placeholder="Search plot number, facing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-4 py-2.5 rounded-2xl text-sm text-white placeholder-white/30 outline-none"
            style={{
              background: "rgba(10,10,20,0.92)",
              border: "1px solid rgba(251,191,36,0.25)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          />
        )}
        <button
          onClick={() => { setSearchOpen((p) => !p); if (searchOpen) setSearchQuery(""); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all"
          style={{
            background: "rgba(10,10,20,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
          }}
          title="Search"
        >
          🔍
        </button>
      </div>

      {/* Toolbar group */}
      <div
        className="flex flex-col gap-2 p-3 rounded-2xl pointer-events-auto"
        style={{
          background: "rgba(10,10,20,0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Filter toggle */}
        <button
          onClick={toggleFilterPanel}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
          style={{
            background: showFilterPanel ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showFilterPanel ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: showFilterPanel ? "#fbbf24" : "rgba(255,255,255,0.5)",
          }}
          title="Toggle Filters"
        >
          ⚙️
        </button>

        {/* Nearby Places toggle */}
        <button
          onClick={toggleNearbyPlaces}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
          style={{
            background: showNearbyPlaces ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showNearbyPlaces ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: showNearbyPlaces ? "#22c55e" : "rgba(255,255,255,0.5)",
          }}
          title="Nearby Places"
        >
          📍
        </button>

        <div className="w-full h-px bg-white/10 my-0.5" />

        {/* Day/Night cycle */}
        {dayModes.map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setDayMode(mode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
            style={{
              background: dayMode === mode ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${dayMode === mode ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
            }}
            title={label}
          >
            {icon}
          </button>
        ))}

        <div className="w-full h-px bg-white/10 my-0.5" />

        {/* Camera presets */}
        {cameraPresets.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => setCameraView(view)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all"
            style={{
              background: cameraView === view ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${cameraView === view ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
            }}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
