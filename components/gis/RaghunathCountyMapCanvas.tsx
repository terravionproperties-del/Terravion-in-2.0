"use client";
/**
 * components/gis/RaghunathCountyMapCanvas.tsx
 *
 * Custom 2D Canvas Renderer for Southpride's Raghunath County (Shankarpally).
 * Accurately replicates the DTCP Approved Layout (TLP No. 176/2024/H):
 *  - Lower Entrance Corridor (Plots 1-50, 100' Shankarpally Highway, 40' Spine Road, Park 0.263 Cents)
 *  - Upper Township Grid (Plots 51-202, 40' Spine & 33' Cross Roads, North Parks, East Buffer)
 *  - Status coloring with distinct Mortgage Plot markers (Plots 3-10, 13-22, 41-50)
 *  - Interactive Zoom, Pan, Plot Selection, Hover Tooltip & Compass Rose
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { Plot, Project } from "@/lib/types/gis";

// Coordinate boundaries for Raghunath County DTCP layout (Canvas coordinate space)
const WORLD = { minX: -260, maxX: 260, minY: -280, maxY: 260 };
const WORLD_W = WORLD.maxX - WORLD.minX; // 520
const WORLD_H = WORLD.maxY - WORLD.minY; // 540

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  AVAILABLE:  { fill: "#22c55e", stroke: "#16a34a", text: "#ffffff" }, // Green
  MORTGAGE:   { fill: "#f97316", stroke: "#ea580c", text: "#ffffff" }, // Orange / Salmon
  BOOKED:     { fill: "#f59e0b", stroke: "#d97706", text: "#ffffff" }, // Amber
  SOLD:       { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff" }, // Purple
  RESERVED:   { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff" }, // Blue
  PREMIUM:    { fill: "#eab308", stroke: "#ca8a04", text: "#ffffff" }, // Gold
};

const MORTGAGE_SET = new Set([
  3, 4, 5, 6, 7, 8, 9, 10,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
]);

interface View {
  scale: number;
  panX: number;
  panY: number;
}

interface Props {
  project: Project;
  onPlotSelect: (plot: Plot | null) => void;
  selectedPlot: Plot | null;
  filterFn?: (plot: Plot) => boolean;
}

export default function RaghunathCountyMapCanvas({
  project,
  onPlotSelect,
  selectedPlot,
  filterFn = () => true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [view, setView] = useState<View>({ scale: 1, panX: 0, panY: 0 });
  const [hoveredPlot, setHoveredPlot] = useState<Plot | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Map 2D plot bounding geometry
  const plotRects = useRef<Map<string, { x: number; y: number; w: number; h: number; plot: Plot }>>(new Map());

  // Convert World to Canvas Pixels
  const worldToCanvas = useCallback(
    (wx: number, wy: number, v: View) => {
      const normX = (wx - WORLD.minX) / WORLD_W;
      const normY = (wy - WORLD.minY) / WORLD_H;
      return {
        x: normX * WORLD_W * v.scale + v.panX,
        y: normY * WORLD_H * v.scale + v.panY,
      };
    },
    []
  );

  // Convert Canvas Pixels to World Coordinates
  const canvasToWorld = useCallback(
    (cx: number, cy: number, v: View) => {
      const normX = (cx - v.panX) / (WORLD_W * v.scale);
      const normY = (cy - v.panY) / (WORLD_H * v.scale);
      return {
        x: normX * WORLD_W + WORLD.minX,
        y: normY * WORLD_H + WORLD.minY,
      };
    },
    []
  );

  // Auto-fit layout onto the user's viewport on load or resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const scale = Math.min(width / WORLD_W, height / WORLD_H) * 0.95;
    const panX = (width - WORLD_W * scale) / 2;
    const panY = (height - WORLD_H * scale) / 2;
    setView({ scale, panX, panY });
  }, []);

  // Compute exact coordinates for each of the 202 plots according to the DTCP Blueprint
  const computePlotGeometry = useCallback(() => {
    plotRects.current.clear();
    const plotMap = new Map<number, Plot>();
    project.plots.forEach((p) => {
      plotMap.set(parseInt(p.plotNumber, 10), p);
    });

    const addPlot = (num: number, wx: number, wy: number, ww: number, wh: number) => {
      const plot = plotMap.get(num);
      if (!plot) return;
      plotRects.current.set(plot.id, { x: wx, y: wy, w: ww, h: wh, plot });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 1. LOWER ENTRANCE BLOCK (Plots 1 - 50)
    // ─────────────────────────────────────────────────────────────────────────
    // Plots 1 & 2 (Left Corner Entrance)
    addPlot(1, -220, 110, 18, 28);
    addPlot(2, -220, 78, 18, 28);

    // Row 1 (Plots 3 - 12, along 33' road)
    for (let i = 0; i < 10; i++) {
      const num = 3 + i; // 3..12
      addPlot(num, -195 + i * 15, 82, 14, 22);
    }
    // Row 2 (Plots 13 - 22, along 40' road)
    for (let i = 0; i < 10; i++) {
      const num = 13 + i; // 13..22
      addPlot(num, -195 + i * 15, 110, 14, 22);
    }

    // Plots 23 - 31 (Lower Middle East-facing Row)
    for (let i = 0; i < 9; i++) {
      const num = 23 + i; // 23..31
      addPlot(num, -35 + i * 16, 120, 15, 20);
    }
    // Plots 32 - 40 (Upper Middle Row)
    for (let i = 0; i < 9; i++) {
      const num = 32 + i; // 32..40
      addPlot(num, -35 + i * 16, 95, 15, 20);
    }

    // Vertical Connector Strip (Plots 41 - 45 Mortgage)
    for (let i = 0; i < 5; i++) {
      const num = 41 + i; // 41..45
      addPlot(num, 30, 70 - i * 18, 18, 16);
    }
    // Plots 46 - 50 (Mortgage West Facing)
    for (let i = 0; i < 5; i++) {
      const num = 46 + i; // 46..50
      addPlot(num, 8, 70 - i * 18, 18, 16);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. UPPER MAIN TOWNSHIP BLOCK (Plots 51 - 202)
    // ─────────────────────────────────────────────────────────────────────────
    // Pocket Left (Plots 51 - 70)
    // 51..53
    addPlot(51, -12, 10, 13, 16);
    addPlot(52, -26, 10, 13, 16);
    addPlot(53, -40, 10, 13, 16);

    // 54..57
    addPlot(54, -40, -18, 13, 16);
    addPlot(55, -26, -18, 13, 16);
    addPlot(56, -12, -18, 13, 16);
    addPlot(57, 2, -18, 13, 16);

    // 58..61
    addPlot(58, 2, -45, 13, 16);
    addPlot(59, -12, -45, 13, 16);
    addPlot(60, -26, -45, 13, 16);
    addPlot(61, -40, -45, 13, 16);

    // 62..65
    addPlot(62, -40, -72, 13, 16);
    addPlot(63, -26, -72, 13, 16);
    addPlot(64, -12, -72, 13, 16);
    addPlot(65, 2, -72, 13, 16);

    // 66..70
    addPlot(66, 2, -98, 13, 16);
    addPlot(67, 2, -114, 13, 16);
    addPlot(68, -12, -98, 13, 16);
    addPlot(69, -26, -98, 13, 16);
    addPlot(70, -40, -98, 13, 16);

    // Top North Corner Cluster (Plots 71 - 75)
    addPlot(71, -40, -150, 14, 25);
    addPlot(72, -25, -150, 14, 25);
    addPlot(73, -10, -140, 14, 18);
    addPlot(74, -10, -162, 18, 18);
    addPlot(75, 10, -150, 14, 25);

    // Central Grid (Plots 76 - 135)
    // Row: Plots 76 - 84
    for (let i = 0; i < 9; i++) {
      addPlot(76 + i, 22 + i * 14, -105, 13, 18);
    }
    // Row: Plots 85 - 93
    for (let i = 0; i < 9; i++) {
      addPlot(93 - i, 22 + i * 14, -84, 13, 18);
    }
    // Row: Plots 94 - 103
    for (let i = 0; i < 10; i++) {
      addPlot(94 + i, 22 + i * 13, -50, 12, 18);
    }
    // Row: Plots 104 - 114
    for (let i = 0; i < 11; i++) {
      addPlot(114 - i, 22 + i * 12, -28, 11, 18);
    }
    // Row: Plots 115 - 125
    for (let i = 0; i < 11; i++) {
      addPlot(115 + i, 22 + i * 12, 5, 11, 18);
    }
    // Row: Plots 126 - 135
    for (let i = 0; i < 10; i++) {
      addPlot(135 - i, 22 + i * 13, 27, 12, 18);
    }

    // Southern Strip of Upper Block (Plots 136 - 148)
    for (let i = 0; i < 10; i++) {
      addPlot(136 + i, 22 + i * 12, 55, 11, 15);
    }
    addPlot(146, 148, 55, 14, 14);
    addPlot(147, 148, 38, 14, 14);
    addPlot(148, 148, 22, 14, 14);

    // Right Sector (Plots 149 - 202)
    // Plots 149 - 156
    for (let i = 0; i < 8; i++) {
      addPlot(156 - i, 168 + i * 12, 27, 11, 18);
    }
    // Plots 157 - 164
    for (let i = 0; i < 8; i++) {
      addPlot(157 + i, 168 + i * 12, 5, 11, 18);
    }
    // Plots 165 - 173
    for (let i = 0; i < 9; i++) {
      addPlot(173 - i, 168 + i * 11, -28, 10, 18);
    }
    // Plots 174 - 182
    for (let i = 0; i < 9; i++) {
      addPlot(174 + i, 168 + i * 11, -50, 10, 18);
    }
    // Plots 183 - 192
    for (let i = 0; i < 10; i++) {
      addPlot(192 - i, 168 + i * 10, -84, 9.5, 18);
    }
    // Plots 193 - 202
    for (let i = 0; i < 10; i++) {
      addPlot(193 + i, 168 + i * 10, -105, 9.5, 18);
    }
  }, [project.plots]);

  // Main Render Loop
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    computePlotGeometry();

    const w = canvas.width;
    const h = canvas.height;

    // Clear Canvas with luxury dark backdrop
    ctx.fillStyle = "#0c0f1d";
    ctx.fillRect(0, 0, w, h);

    // ─────────────────────────────────────────────────────────────────────────
    // DRAW BACKGROUND LAND PARCELS (Realistic DTCP Master Plan Boundaries)
    // ─────────────────────────────────────────────────────────────────────────
    ctx.save();

    // 1. Lower Entrance Parcel
    const lp1 = worldToCanvas(-245, 60, view);
    const lp2 = worldToCanvas(140, 60, view);
    const lp3 = worldToCanvas(140, 160, view);
    const lp4 = worldToCanvas(-245, 160, view);

    ctx.fillStyle = "#1e2438";
    ctx.strokeStyle = "#384166";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lp1.x, lp1.y);
    ctx.lineTo(lp2.x, lp2.y);
    ctx.lineTo(lp3.x, lp3.y);
    ctx.lineTo(lp4.x, lp4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Upper Township Main Parcel
    const up1 = worldToCanvas(-55, -180, view);
    const up2 = worldToCanvas(275, -180, view);
    const up3 = worldToCanvas(275, 80, view);
    const up4 = worldToCanvas(-55, 80, view);

    ctx.fillStyle = "#1b2133";
    ctx.strokeStyle = "#384166";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(up1.x, up1.y);
    ctx.lineTo(up2.x, up2.y);
    ctx.lineTo(up3.x, up3.y);
    ctx.lineTo(up4.x, up4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ─────────────────────────────────────────────────────────────────────────
    // DRAW GREEN BUFFER & DEDICATED PARKS (DTCP Reserved Open Spaces)
    // ─────────────────────────────────────────────────────────────────────────
    const drawPark = (x: number, y: number, width: number, height: number, label: string) => {
      const p = worldToCanvas(x, y, view);
      const pw = width * view.scale;
      const ph = height * view.scale;

      ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.fillRect(p.x, p.y, pw, ph);
      ctx.strokeRect(p.x, p.y, pw, ph);

      // Park Label
      if (view.scale > 0.8) {
        ctx.fillStyle = "#6ee7b7";
        ctx.font = `bold ${Math.max(9, Math.min(13, 11 * view.scale))}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, p.x + pw / 2, p.y + ph / 2);
      }
    };

    // North-Central Park
    drawPark(30, -170, 115, 45, "🌳 OPEN SPACE (PARK)");
    // North-East Park
    drawPark(165, -170, 100, 45, "🌳 OPEN SPACE (PARK)");
    // South-East Lower Park (Ac. 0.263 Cents)
    drawPark(40, 115, 90, 35, "🌿 PARK (Ac. 0.263)");
    // East Buffer Park (Upper Block)
    drawPark(175, 48, 90, 26, "🌳 OPEN SPACE (PARK)");

    // ─────────────────────────────────────────────────────────────────────────
    // DRAW ROADS (40' Main Spine & 33' Cross Roads)
    // ─────────────────────────────────────────────────────────────────────────
    const drawRoad = (x1: number, y1: number, x2: number, y2: number, width: number, name: string) => {
      const start = worldToCanvas(x1, y1, view);
      const end = worldToCanvas(x2, y2, view);
      const rw = width * view.scale;

      ctx.save();
      ctx.strokeStyle = "#2e344e";
      ctx.lineWidth = rw;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Road edge borders
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Yellow Center Dash
      if (rw > 10) {
        ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    };

    // 100' Highway along entrance
    drawRoad(-245, 145, 140, 145, 20, "100' SHANKARPALLY ROAD");
    // 40' Lower Spine Road
    drawRoad(-200, 106, -30, 106, 14, "40' WIDE ROAD");
    drawRoad(-40, 110, 50, 110, 14, "40' WIDE ROAD");
    // 40' Central Vertical Spine
    drawRoad(17, -170, 17, 75, 15, "PROPOSED 40'-0\" WIDE ROAD");
    // 33' Vertical East Spine
    drawRoad(162, -170, 162, 75, 13, "PROP. 33'-0\" WIDE ROAD");
    // 33' Cross Roads
    drawRoad(20, -118, 270, -118, 12, "33' ROAD");
    drawRoad(20, -64, 270, -64, 12, "33' ROAD");
    drawRoad(20, -7, 270, -7, 12, "33' ROAD");
    drawRoad(20, 47, 160, 47, 12, "33' ROAD");

    // ─────────────────────────────────────────────────────────────────────────
    // DRAW ALL 202 INDIVIDUAL PLOTS
    // ─────────────────────────────────────────────────────────────────────────
    plotRects.current.forEach(({ x, y, w: pw, h: ph, plot }) => {
      const isVisible = filterFn(plot);
      const isSelected = selectedPlot?.id === plot.id;
      const isHovered = hoveredPlot?.id === plot.id;
      const num = parseInt(plot.plotNumber, 10);
      const isMortgage = MORTGAGE_SET.has(num);

      const pt = worldToCanvas(x, y, view);
      const plotW = pw * view.scale;
      const plotH = ph * view.scale;

      const palette = isMortgage
        ? STATUS_COLORS.MORTGAGE
        : STATUS_COLORS[plot.status] || STATUS_COLORS.AVAILABLE;

      ctx.save();
      if (!isVisible) {
        ctx.globalAlpha = 0.2;
      }

      // Plot Box
      ctx.fillStyle = palette.fill;
      ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? "#fde047" : palette.stroke;
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;

      // Glow effect on selected/hovered plot
      if (isSelected || isHovered) {
        ctx.shadowColor = isSelected ? "#38bdf8" : "#fde047";
        ctx.shadowBlur = 12;
      }

      ctx.fillRect(pt.x, pt.y, plotW, plotH);
      ctx.strokeRect(pt.x, pt.y, plotW, plotH);

      // Plot Number Label
      if (plotW > 10 && plotH > 8) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(7, Math.min(11, plotW * 0.45))}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(plot.plotNumber, pt.x + plotW / 2, pt.y + plotH / 2);
      }

      // Corner Indicator Dot
      if (plot.isCorner && plotW > 12) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(pt.x + 3, pt.y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // DRAW NORTH COMPASS & SCALE
    // ─────────────────────────────────────────────────────────────────────────
    ctx.save();
    const compassX = 45;
    const compassY = h - 50;

    ctx.fillStyle = "rgba(6, 8, 16, 0.85)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.arc(compassX, compassY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // North Pointer
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 18);
    ctx.lineTo(compassX - 6, compassY);
    ctx.lineTo(compassX + 6, compassY);
    ctx.closePath();
    ctx.fill();

    // South Pointer
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY + 18);
    ctx.lineTo(compassX - 6, compassY);
    ctx.lineTo(compassX + 6, compassY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", compassX, compassY - 20);
    ctx.fillText("S", compassX, compassY + 28);
    ctx.restore();

    ctx.restore();
  }, [computePlotGeometry, filterFn, hoveredPlot, project.plots, selectedPlot, view, worldToCanvas]);

  // Handle Resize and Initial Layout
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderMap();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderMap]);

  // Re-render when view state or selection changes
  useEffect(() => {
    renderMap();
  }, [renderMap, view, selectedPlot, hoveredPlot]);

  // Mouse Interactivity: Pan, Click, Hover Tooltip
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setView((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
      return;
    }

    // Hit-test for hover
    let foundPlot: Plot | null = null;
    plotRects.current.forEach(({ x, y, w: pw, h: ph, plot }) => {
      const pt = worldToCanvas(x, y, view);
      const plotW = pw * view.scale;
      const plotH = ph * view.scale;

      if (mouseX >= pt.x && mouseX <= pt.x + plotW && mouseY >= pt.y && mouseY <= pt.y + plotH) {
        foundPlot = plot;
      }
    });

    if (foundPlot !== hoveredPlot) {
      setHoveredPlot(foundPlot);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedPlot: Plot | null = null;
    plotRects.current.forEach(({ x, y, w: pw, h: ph, plot }) => {
      const pt = worldToCanvas(x, y, view);
      const plotW = pw * view.scale;
      const plotH = ph * view.scale;

      if (mouseX >= pt.x && mouseX <= pt.x + plotW && mouseY >= pt.y && mouseY <= pt.y + plotH) {
        clickedPlot = plot;
      }
    });

    onPlotSelect(clickedPlot);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(0.3, Math.min(5, view.scale * zoomFactor));

    const panX = mouseX - (mouseX - view.panX) * (newScale / view.scale);
    const panY = mouseY - (mouseY - view.panY) * (newScale / view.scale);

    setView({ scale: newScale, panX, panY });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-[#0c0f1d]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Floating Blueprint Header Banner */}
      <div
        className="absolute top-4 right-4 z-20 rounded-2xl px-4 py-3 pointer-events-auto flex items-center gap-3 border shadow-2xl"
        style={{ background: "rgba(6, 8, 16, 0.9)", borderColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            DTCP Layout TLP No. 176/2024/H
          </span>
          <span className="text-xs font-bold text-white">TS RERA: P01100009248 (202 Plots)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setView((v) => ({ ...v, scale: Math.min(5, v.scale * 1.25) }))}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setView((v) => ({ ...v, scale: Math.max(0.3, v.scale * 0.8) }))}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* Hover Plot Badge Tooltip */}
      {hoveredPlot && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none rounded-xl px-4 py-2 flex items-center gap-3 border shadow-2xl transition-all"
          style={{ background: "rgba(6, 8, 16, 0.95)", borderColor: "#fbbf24", backdropFilter: "blur(12px)" }}
        >
          <span className="text-sm font-black text-amber-400">Plot #{hoveredPlot.plotNumber}</span>
          <span className="text-xs text-white font-medium">
            {hoveredPlot.dimension.areaSqYards} Sq. Yds ({hoveredPlot.facing} Facing)
          </span>
          <span
            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
            style={{
              background: MORTGAGE_SET.has(parseInt(hoveredPlot.plotNumber, 10))
                ? "rgba(249, 115, 22, 0.2)"
                : "rgba(34, 197, 94, 0.2)",
              color: MORTGAGE_SET.has(parseInt(hoveredPlot.plotNumber, 10)) ? "#fb923c" : "#4ade80",
            }}
          >
            {MORTGAGE_SET.has(parseInt(hoveredPlot.plotNumber, 10)) ? "MORTGAGE PLOT" : hoveredPlot.status}
          </span>
        </div>
      )}
    </div>
  );
}
