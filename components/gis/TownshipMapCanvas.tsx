"use client";
/**
 * components/gis/TownshipMapCanvas.tsx
 *
 * Premium 2D Canvas Township Map — Terravion GIS
 *
 * Visual quality targets:
 *  ✓ Warm beige ground with subtle texture
 *  ✓ Asphalt roads with yellow centre dashes + white edge lines
 *  ✓ Pedestrian crossings at main intersections
 *  ✓ Layered tree canopies with shadows (perimeter + street trees)
 *  ✓ Clubhouse building with roof detail + label
 *  ✓ Swimming pool (blue tiled)
 *  ✓ Sports court, amphitheater, children's play zone
 *  ✓ Animated cars (small rectangles gliding on roads)
 *  ✓ Status-coloured plots with rounded corners + plot numbers
 *  ✓ Corner dot indicator
 *  ✓ Hover glow + selected ring
 *  ✓ Compass rose + scale bar
 *  ✓ Pan / Zoom / Click
 *  ✓ 60fps RAF loop with dirty-flag
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { Plot, Project } from "@/lib/types/gis";

// ─── World bounds ─────────────────────────────────────────────────────────────
// All coordinates use the same unit system as sanctuary-shankarpally.ts
// 1 ft = 0.25 units | 60ft road = 15 units | 33ft plot = 8.25 units
const WORLD = { minX: -245, maxX: 240, minZ: -300, maxZ: 245 };
const WORLD_W = WORLD.maxX - WORLD.minX;  // 485
const WORLD_H = WORLD.maxZ - WORLD.minZ;  // 545

// ─── Status colours (canvas-rendered fills) ──────────────────────────────────
const FILL: Record<string, [string, string]> = {
  // [fill, stroke]
  AVAILABLE:  ["#e0415b", "#ff7088"],
  BOOKED:     ["#f97316", "#fba76a"],
  SOLD:       ["#9333ea", "#c084fc"],
  RESERVED:   ["#2563eb", "#60a5fa"],
  PREMIUM:    ["#ca8a04", "#fde047"],
  COMMERCIAL: ["#0891b2", "#22d3ee"],
};

// ─── Car colours ─────────────────────────────────────────────────────────────
const CAR_COLOURS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#ec4899","#ffffff","#94a3b8"];

// ─── View state ──────────────────────────────────────────────────────────────
interface View { scale: number; panX: number; panY: number; }

function w2c(wx: number, wz: number, v: View) {
  return {
    x: ((wx - WORLD.minX) / WORLD_W) * WORLD_W * v.scale + v.panX,
    y: ((wz - WORLD.minZ) / WORLD_H) * WORLD_H * v.scale + v.panY,
  };
}

function c2w(cx: number, cy: number, v: View) {
  return {
    x: ((cx - v.panX) / (WORLD_W * v.scale)) * WORLD_W + WORLD.minX,
    z: ((cy - v.panY) / (WORLD_H * v.scale)) * WORLD_H + WORLD.minZ,
  };
}

// ─── Drawing primitives ───────────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = Math.min(r, Math.min(Math.abs(w), Math.abs(h)) / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + R);
  ctx.lineTo(x + w, y + h - R);
  ctx.quadraticCurveTo(x + w, y + h, x + w - R, y + h);
  ctx.lineTo(x + R, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - R);
  ctx.lineTo(x, y + R);
  ctx.quadraticCurveTo(x, y, x + R, y);
  ctx.closePath();
}

function drawTree(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number) {
  if (r < 2) return;
  const hue = 100 + (seed % 30) - 15;
  // ground shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.25, cy + r * 0.55, r * 1.05, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  // outer canopy
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue},52%,20%)`;
  ctx.fill();
  // mid canopy
  ctx.beginPath();
  ctx.arc(cx - r * 0.1, cy - r * 0.12, r * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue},52%,28%)`;
  ctx.fill();
  // highlight
  ctx.beginPath();
  ctx.arc(cx - r * 0.22, cy - r * 0.22, r * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue+10},42%,40%)`;
  ctx.fill();
}

function drawRoadH(ctx: CanvasRenderingContext2D, x1: number, x2: number, yCtr: number, widthPx: number) {
  // Surface
  ctx.fillStyle = widthPx > 18 ? "#1a1d2a" : "#222538";
  ctx.fillRect(x1, yCtr - widthPx / 2, x2 - x1, widthPx);
  // Edge lines
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x1, yCtr - widthPx / 2 + 1); ctx.lineTo(x2, yCtr - widthPx / 2 + 1);
  ctx.moveTo(x1, yCtr + widthPx / 2 - 1); ctx.lineTo(x2, yCtr + widthPx / 2 - 1);
  ctx.stroke();
  // Centre dashes
  if (widthPx > 8) {
    ctx.save();
    ctx.setLineDash([10, 9]);
    ctx.strokeStyle = "rgba(255,210,0,0.45)";
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x1, yCtr); ctx.lineTo(x2, yCtr);
    ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
}

function drawRoadV(ctx: CanvasRenderingContext2D, z1: number, z2: number, xCtr: number, widthPx: number) {
  ctx.fillStyle = widthPx > 18 ? "#1a1d2a" : "#222538";
  ctx.fillRect(xCtr - widthPx / 2, z1, widthPx, z2 - z1);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(xCtr - widthPx / 2 + 1, z1); ctx.lineTo(xCtr - widthPx / 2 + 1, z2);
  ctx.moveTo(xCtr + widthPx / 2 - 1, z1); ctx.lineTo(xCtr + widthPx / 2 - 1, z2);
  ctx.stroke();
  if (widthPx > 8) {
    ctx.save();
    ctx.setLineDash([10, 9]);
    ctx.strokeStyle = "rgba(255,210,0,0.45)";
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(xCtr, z1); ctx.lineTo(xCtr, z2);
    ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
}

function drawCrosswalk(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  const stripes = 5;
  const sw = w / (stripes * 2 - 1);
  ctx.fillStyle = "#fff";
  for (let i = 0; i < stripes; i++) {
    ctx.fillRect(x + i * sw * 2, y, sw, h);
  }
  ctx.restore();
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  px: number, py: number,
  pw: number, ph: number,
  label: string, icon: string,
  wallColor: string, roofColor: string,
  s: number
) {
  // Shadow
  ctx.save(); ctx.globalAlpha = 0.22;
  rr(ctx, px + 3, py + 4, pw, ph, 4);
  ctx.fillStyle = "#000"; ctx.fill();
  ctx.restore();

  // Wall
  rr(ctx, px, py, pw, ph, 5);
  ctx.fillStyle = wallColor;
  ctx.fill();

  // Roof ridge lines
  ctx.save();
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  const ridgeCount = Math.max(2, Math.floor(pw / (8 * s)));
  for (let i = 1; i < ridgeCount; i++) {
    const rx = px + (pw / ridgeCount) * i;
    ctx.beginPath(); ctx.moveTo(rx, py); ctx.lineTo(rx, py + ph);
    ctx.stroke();
  }
  ctx.restore();

  // Border
  rr(ctx, px, py, pw, ph, 5);
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Icon + label
  if (pw > 20 && ph > 12) {
    const fs = Math.min(pw * 0.32, ph * 0.45, 14);
    ctx.font = `${Math.max(6, fs)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(icon, px + pw / 2, py + ph * 0.38);
    if (pw > 30) {
      ctx.font = `bold ${Math.max(5, fs * 0.55)}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(label, px + pw / 2, py + ph * 0.72);
    }
  }
}

function drawPool(ctx: CanvasRenderingContext2D, px: number, py: number, pw: number, ph: number) {
  // Water
  const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
  g.addColorStop(0, "#1e6fa8");
  g.addColorStop(1, "#0a3d6b");
  rr(ctx, px, py, pw, ph, 4);
  ctx.fillStyle = g;
  ctx.fill();

  // Lane lines
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#82c4f5";
  ctx.lineWidth = 0.6;
  const laneW = pw / 5;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(px + laneW * i, py + 2);
    ctx.lineTo(px + laneW * i, py + ph - 2);
    ctx.stroke();
  }
  ctx.restore();

  // Shimmer highlight
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#a8dff5";
  rr(ctx, px + pw * 0.1, py + ph * 0.12, pw * 0.4, ph * 0.18, 2);
  ctx.fill();
  ctx.restore();

  // Border
  rr(ctx, px, py, pw, ph, 4);
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (pw > 20) {
    ctx.font = `bold ${Math.max(5, pw * 0.16)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("🏊 POOL", px + pw / 2, py + ph / 2);
  }
}

function drawCompass(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,10,18,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251,191,36,0.6)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Tick marks
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const inner = i % 2 === 0 ? r * 0.7 : r * 0.82;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * inner, cy - Math.cos(a) * inner);
    ctx.lineTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r);
    ctx.strokeStyle = i % 2 === 0 ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = i % 2 === 0 ? 1.2 : 0.6;
    ctx.stroke();
  }

  // N arrow (red half)
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.68);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.1);
  ctx.lineTo(cx, cy - r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();

  // S arrow (white half)
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.68);
  ctx.lineTo(cx - r * 0.2, cy + r * 0.1);
  ctx.lineTo(cx, cy - r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  // S half (down)
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.68);
  ctx.lineTo(cx + r * 0.2, cy - r * 0.1);
  ctx.lineTo(cx, cy + r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.68);
  ctx.lineTo(cx - r * 0.2, cy - r * 0.1);
  ctx.lineTo(cx, cy + r * 0.05);
  ctx.closePath();
  ctx.fillStyle = "rgba(80,80,80,0.5)";
  ctx.fill();

  // Labels
  ctx.font = `bold ${r * 0.38}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("N", cx, cy - r * 1.22);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `${r * 0.3}px system-ui`;
  ctx.fillText("S", cx, cy + r * 1.22);
}

// ─── Car animation state ─────────────────────────────────────────────────────
interface Car {
  x: number; z: number;
  dx: number; dz: number;  // direction (normalised)
  speed: number;
  length: number;
  color: string;
  t: number; // position along route [0,1]
  route: [number, number, number, number]; // x1,z1,x2,z2
}

function makeCars(): Car[] {
  const cars: Car[] = [];
  const routes: [number, number, number, number][] = [
    [-230, -100, -230, 220, ], // main road south
    [-160, -280, -160, 220],   // spine 1 south
    [-80,  220,  -80, -280],   // spine 2 north
    [0,   -280,   0,  220],    // spine 3 south
    [80,   220,  80, -280],    // spine 4 north
    [160, -280, 160,  220],    // spine 5 south
    [-230, 0,   210,  0],      // E-W collector
    [210, -225, -230, -225],   // top road
  ] as [number, number, number, number][];

  routes.forEach((route, ri) => {
    const count = 1 + (ri % 3);
    for (let i = 0; i < count; i++) {
      const t = (i / count + Math.random() * 0.1) % 1;
      const dx = route[2] - route[0];
      const dz = route[3] - route[1];
      const len = Math.hypot(dx, dz);
      cars.push({
        x: route[0] + dx * t, z: route[1] + dz * t,
        dx: dx / len, dz: dz / len,
        speed: 0.3 + Math.random() * 0.25,
        length: 5 + Math.random() * 2,
        color: CAR_COLOURS[ri % CAR_COLOURS.length],
        t, route,
      });
    }
  });
  return cars;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  project: Project;
  onPlotSelect: (p: Plot | null) => void;
  selectedPlot: Plot | null;
  filterFn: (p: Plot) => boolean;
}

export default function TownshipMapCanvas({ project, onPlotSelect, selectedPlot, filterFn }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef      = useRef<View>({ scale: 1.2, panX: 0, panY: 0 });
  const hoveredId    = useRef<string | null>(null);
  const isDragging   = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dirty        = useRef(true);
  const rafId        = useRef(0);
  const carsRef      = useRef<Car[]>(makeCars());
  const lastTs       = useRef(0);

  const fitToCanvas = useCallback(() => {
    const c = canvasRef.current;
    const d = containerRef.current;
    if (!c || !d) return;
    const W = d.clientWidth, H = d.clientHeight;
    c.width = W; c.height = H;
    const scale = Math.min((W * 0.9) / WORLD_W, (H * 0.9) / WORLD_H);
    const panX  = (W - WORLD_W * scale) / 2;
    const panY  = (H - WORLD_H * scale) / 2;
    viewRef.current = { scale, panX, panY };
    dirty.current = true;
  }, []);

  // ─── Hit test ────────────────────────────────────────────────────────────
  const hitTest = useCallback((cx: number, cy: number): Plot | null => {
    const v = viewRef.current;
    const { x: wx, z: wz } = c2w(cx, cy, v);
    for (let i = project.plots.length - 1; i >= 0; i--) {
      const p = project.plots[i];
      if (!p.position3D) continue;
      const [px, , pz] = p.position3D;
      const hw = p.dimension.breadth * 0.25 / 2;
      const hd = p.dimension.length  * 0.25 / 2;
      if (wx >= px - hw && wx <= px + hw && wz >= pz - hd && wz <= pz + hd) return p;
    }
    return null;
  }, [project.plots]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const render = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = Math.min((ts - lastTs.current) / 1000, 0.05);
    lastTs.current = ts;

    // Animate cars
    const cars = carsRef.current;
    let carMoved = false;
    for (const car of cars) {
      const [x1, z1, x2, z2] = car.route;
      const routeLen = Math.hypot(x2 - x1, z2 - z1);
      car.t = (car.t + (car.speed * dt) / routeLen) % 1;
      car.x = x1 + (x2 - x1) * car.t;
      car.z = z1 + (z2 - z1) * car.t;
      carMoved = true;
    }

    if (!dirty.current && !carMoved) return;

    const v   = viewRef.current;
    const s   = v.scale;
    const W   = canvas.width;
    const H   = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // 1. ── DARK BACKGROUND ────────────────────────────────────────────────
    ctx.fillStyle = "#0c0e16";
    ctx.fillRect(0, 0, W, H);

    // 2. ── GROUND (inside boundary) ──────────────────────────────────────
    const g0 = w2c(WORLD.minX + 12, WORLD.minZ + 18, v);
    const g1 = w2c(WORLD.maxX - 15, WORLD.maxZ - 12, v);
    const gW = g1.x - g0.x, gH = g1.y - g0.y;

    // Warm beige gradient
    const gg = ctx.createLinearGradient(g0.x, g0.y, g1.x, g1.y);
    gg.addColorStop(0,   "#d6c9a8");
    gg.addColorStop(0.4, "#cfc29e");
    gg.addColorStop(1,   "#c8bb94");
    rr(ctx, g0.x, g0.y, gW, gH, 8);
    ctx.fillStyle = gg;
    ctx.fill();

    // Stipple texture
    if (s > 0.6) {
      ctx.save();
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = "#4a3d20";
      const dotSp = 14 * s;
      for (let dx = 2; dx < gW; dx += dotSp) {
        for (let dy = 2; dy < gH; dy += dotSp) {
          ctx.beginPath();
          ctx.arc(g0.x + dx, g0.y + dy, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 3. ── ROADS ─────────────────────────────────────────────────────────
    const SPINE_X = [-160, -80, 0, 80, 160];

    // W main road (100ft = 25 units)
    { const p = w2c(-230, -295, v); const p2 = w2c(-230, 240, v);
      drawRoadV(ctx, p.y, p2.y, p.x, 25 * s); }

    // N-S spine roads (60ft = 15 units)
    SPINE_X.forEach((x) => {
      const p  = w2c(x, -290, v);
      const p2 = w2c(x,  235, v);
      drawRoadV(ctx, p.y, p2.y, p.x, 15 * s);
    });

    // E-W collector (40ft = 10 units)
    { const p = w2c(-235, 0, v); const p2 = w2c(222, 0, v);
      drawRoadH(ctx, p.x, p2.x, p.y, 10 * s); }

    // Top road -225 (30ft = 7.5 units)
    { const p = w2c(-235, -225, v); const p2 = w2c(222, -225, v);
      drawRoadH(ctx, p.x, p2.x, p.y, 7.5 * s); }

    // N internal roads
    for (const z of [-170, -120, -70]) {
      const p  = w2c(-235, z, v);
      const p2 = w2c(222, z, v);
      drawRoadH(ctx, p.x, p2.x, p.y, 7.5 * s);
    }
    // S internal roads
    for (const z of [50, 100, 150]) {
      const p  = w2c(-235, z, v);
      const p2 = w2c(222, z, v);
      drawRoadH(ctx, p.x, p2.x, p.y, 7.5 * s);
    }
    // Bottom boundary (40ft)
    { const p = w2c(-235, 230, v); const p2 = w2c(222, 230, v);
      drawRoadH(ctx, p.x, p2.x, p.y, 10 * s); }

    // Crosswalks at main intersections (collector × spines)
    if (s > 0.8) {
      SPINE_X.forEach((x) => {
        const cw = 5 * s, ch = 9.5 * s;
        const c  = w2c(x, 0, v);
        drawCrosswalk(ctx, c.x - cw / 2, c.y - ch / 2, cw, ch);
      });
    }

    // 4. ── PERIMETER + STREET TREES ──────────────────────────────────────
    const TR = Math.max(2.5, 5 * s);

    // Top boundary strip
    for (let x = WORLD.minX + 20; x < WORLD.maxX - 20; x += 18) {
      const c = w2c(x, WORLD.minZ + 14, v);
      drawTree(ctx, c.x, c.y, TR, Math.round(x * 17));
    }
    // Bottom boundary
    for (let x = WORLD.minX + 20; x < WORLD.maxX - 20; x += 18) {
      const c = w2c(x, WORLD.maxZ - 14, v);
      drawTree(ctx, c.x, c.y, TR, Math.round(x * 19 + 200));
    }
    // West boundary (left of main road)
    for (let z = WORLD.minZ + 20; z < WORLD.maxZ - 20; z += 18) {
      const c = w2c(WORLD.minX + 8, z, v);
      drawTree(ctx, c.x, c.y, TR, Math.round(z * 11 + 500));
    }
    // East park side
    for (let z = -200; z < 200; z += 18) {
      const c = w2c(200, z, v);
      drawTree(ctx, c.x, c.y, TR * 1.1, Math.round(z * 13 + 700));
    }

    // Street trees alongside spine roads (both sides if space)
    if (s > 0.55) {
      SPINE_X.forEach((x, si) => {
        for (let z = -275; z < 225; z += 22) {
          const offset = 9.5 * 0.25; // half-road + tiny margin, in world units... but spines are in world units
          // Actually spine roads are 60ft = 15 world units wide, so half = 7.5
          // Trees at ±9 units from spine centre
          const c1 = w2c(x - 9, z, v);
          const c2 = w2c(x + 9, z, v);
          drawTree(ctx, c1.x, c1.y, TR * 0.68, si * 100 + Math.round(z));
          drawTree(ctx, c2.x, c2.y, TR * 0.68, si * 200 + Math.round(z) + 50);
        }
      });
    }

    // Corner/entrance tree cluster (NW near clubhouse)
    const NW_TREES = [[-210,-262],[-218,-248],[-205,-235],[-222,-270]] as const;
    NW_TREES.forEach(([x, z], i) => {
      const c = w2c(x, z, v);
      drawTree(ctx, c.x, c.y, TR * 1.3, i * 37 + 900);
    });

    // 5. ── AMENITY BUILDINGS ─────────────────────────────────────────────

    // Clubhouse (NW corner): world pos ~(-195, -248), size ~40×28 world units
    {
      const p0 = w2c(-215, -264, v);
      const p1 = w2c(-175, -236, v);
      drawBuilding(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y,
        "CLUBHOUSE", "🏛️", "#3d2a0e", "#c8923a", s);
    }

    // Entrance gate
    {
      const p0 = w2c(-234, -108, v);
      const p1 = w2c(-228, -92, v);
      drawBuilding(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y,
        "GATE", "🚪", "#6b4c12", "#fbbf24", s);
    }

    // Social Infra
    {
      const p0 = w2c(24, -270, v);
      const p1 = w2c(56, -254, v);
      drawBuilding(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y,
        "SOCIAL INFRA", "🏪", "#1e3d1e", "#5a9a5a", s);
    }

    // Swimming pool (NE)
    {
      const p0 = w2c(186, -238, v);
      const p1 = w2c(218, -218, v);
      drawPool(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    }

    // Tennis / sports (east strip)
    {
      const p0 = w2c(188, 44, v);
      const p1 = w2c(222, 64, v);
      // Tennis court green
      rr(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y, 3);
      ctx.fillStyle = "#1a4a1a"; ctx.fill();
      ctx.strokeStyle = "#4caf50"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = `${Math.max(5, (p1.x-p0.x)*0.2)}px system-ui`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      if (p1.x - p0.x > 18) ctx.fillText("🎾", p0.x + (p1.x - p0.x) / 2, p0.y + (p1.y - p0.y) / 2);
    }

    // Children's play (east)
    {
      const p0 = w2c(188, 96, v);
      const p1 = w2c(218, 114, v);
      drawBuilding(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y,
        "PLAY", "🎡", "#5a2a04", "#f97316", s);
    }

    // Amphitheater (east)
    {
      const p0 = w2c(188, 144, v);
      const p1 = w2c(220, 162, v);
      drawBuilding(ctx, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y,
        "AMPHIT.", "🎭", "#2a0a4a", "#9333ea", s);
    }

    // 6. ── CARS ───────────────────────────────────────────────────────────
    if (s > 0.5) {
      for (const car of cars) {
        const cp = w2c(car.x, car.z, v);
        const carL = car.length * s;
        const carW = carL * 0.55;
        ctx.save();
        ctx.translate(cp.x, cp.y);
        const angle = Math.atan2(car.dz, car.dx);
        ctx.rotate(angle);
        // Body
        rr(ctx, -carL / 2, -carW / 2, carL, carW, 1.5);
        ctx.fillStyle = car.color;
        ctx.fill();
        // Windshield glare
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#c8e8ff";
        ctx.fillRect(carL * 0.1, -carW * 0.3, carL * 0.28, carW * 0.6);
        ctx.restore();
      }
    }

    // 7. ── PLOTS ─────────────────────────────────────────────────────────
    const PR = Math.max(1.5, 2 * s);

    for (const plot of project.plots) {
      if (!plot.position3D) continue;
      const [wx, , wz] = plot.position3D;
      const ww = plot.dimension.breadth * 0.25;
      const wh = plot.dimension.length  * 0.25;
      const p0 = w2c(wx - ww / 2, wz - wh / 2, v);
      const pw = ww * s, ph = wh * s;
      if (pw < 0.5 || ph < 0.5) continue;

      const passFilter = filterFn(plot);
      const isHov = hoveredId.current === plot.id;
      const isSel = selectedPlot?.id === plot.id;
      const [fill, stroke] = FILL[plot.status] ?? ["#666","#888"];

      ctx.globalAlpha = passFilter ? 1 : 0.14;

      // Glow on hover/select
      if ((isHov || isSel) && passFilter && pw > 3) {
        ctx.shadowColor = isSel ? "#fff" : stroke;
        ctx.shadowBlur  = isSel ? 10 : 6;
      }

      // Body gradient
      const pg = ctx.createLinearGradient(p0.x, p0.y, p0.x, p0.y + ph);
      pg.addColorStop(0, fill + "f0");
      pg.addColorStop(1, fill + "c0");
      rr(ctx, p0.x + 1, p0.y + 1, pw - 2, ph - 2, PR);
      ctx.fillStyle = passFilter ? pg : fill + "30";
      ctx.fill();

      // Border
      ctx.strokeStyle = isSel ? "#ffffff" : isHov && passFilter ? stroke : stroke + "99";
      ctx.lineWidth   = isSel ? 2.2 : isHov && passFilter ? 1.5 : 0.7;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Plot number
      if (pw > 13 && ph > 9 && passFilter) {
        const fs = Math.min(pw * 0.38, ph * 0.52, 10);
        if (fs >= 4.5) {
          ctx.font = `bold ${fs}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.fillText(plot.plotNumber, p0.x + pw / 2, p0.y + ph / 2);
        }
      }

      // Corner gold dot
      if (plot.isCorner && pw > 7 && passFilter) {
        ctx.beginPath();
        ctx.arc(p0.x + pw - 2.5, p0.y + 2.5, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    // 8. ── SELECTED RING ─────────────────────────────────────────────────
    if (selectedPlot?.position3D) {
      const [wx, , wz] = selectedPlot.position3D;
      const ww = selectedPlot.dimension.breadth * 0.25;
      const wh = selectedPlot.dimension.length  * 0.25;
      const p0 = w2c(wx - ww / 2, wz - wh / 2, v);
      const pw = ww * s, ph = wh * s;
      rr(ctx, p0.x - 3, p0.y - 3, pw + 6, ph + 6, PR + 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 9. ── COMPASS ───────────────────────────────────────────────────────
    drawCompass(ctx, W - 58, H - 58, 30);

    // 10. ── SCALE BAR ────────────────────────────────────────────────────
    {
      const barPx = 50 * 0.25 * s;
      const bx = 20, by = H - 24;
      ctx.fillStyle = "rgba(8,10,18,0.7)";
      ctx.fillRect(bx - 4, by - 11, barPx + 55, 22);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(bx, by - 4, barPx / 2, 8);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(bx + barPx / 2, by - 4, barPx / 2, 8);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.6;
      ctx.strokeRect(bx, by - 4, barPx, 8);
      ctx.font = "9px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("≈ 50m", bx + barPx + 5, by);
    }

    // 11. ── PROJECT WATERMARK ────────────────────────────────────────────
    if (s < 0.8) {
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.font = `bold ${Math.min(W, H) * 0.12}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(project.name.toUpperCase(), W / 2, H / 2);
      ctx.restore();
    }

    dirty.current = false;
  }, [project, selectedPlot, filterFn]);

  // ─── RAF loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (ts: number) => {
      render(ts);
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [render]);

  // ─── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => fitToCanvas());
    ro.observe(container);
    fitToCanvas();
    return () => ro.disconnect();
  }, [fitToCanvas]);

  // Force re-render on filter/selection change
  useEffect(() => { dirty.current = true; }, [selectedPlot, filterFn]);

  // ─── Mouse events ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: viewRef.current.panX, panY: viewRef.current.panY };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 4) isDragging.current = true;
      viewRef.current = { ...viewRef.current, panX: dragStart.current.panX + dx, panY: dragStart.current.panY + dy };
      dirty.current = true;
    };

    const onUp = (ev: MouseEvent) => {
      if (!isDragging.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const hit = hitTest(ev.clientX - r.left, ev.clientY - r.top);
        onPlotSelect(hit);
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [hitTest, onPlotSelect]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - r.left, e.clientY - r.top);
    const newId = hit?.id ?? null;
    if (newId !== hoveredId.current) {
      hoveredId.current = newId;
      canvas.style.cursor = newId ? "pointer" : "grab";
      dirty.current = true;
    }
  }, [hitTest]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const v = viewRef.current;
    const factor = e.deltaY < 0 ? 1.14 : 0.88;
    const ns = Math.max(0.25, Math.min(7, v.scale * factor));
    const ratio = ns / v.scale;
    viewRef.current = { scale: ns, panX: mx - (mx - v.panX) * ratio, panY: my - (my - v.panY) * ratio };
    dirty.current = true;
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
      />

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-10">
        {([
          { icon: "+", fn: () => { viewRef.current = { ...viewRef.current, scale: Math.min(7, viewRef.current.scale * 1.3) }; dirty.current = true; } },
          { icon: "−", fn: () => { viewRef.current = { ...viewRef.current, scale: Math.max(0.25, viewRef.current.scale * 0.77) }; dirty.current = true; } },
          { icon: "⊡", fn: fitToCanvas },
        ] as { icon: string; fn: () => void }[]).map(({ icon, fn }) => (
          <button
            key={icon}
            onClick={fn}
            className="w-9 h-9 rounded-xl font-black text-base flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(8,10,18,0.88)", border: "1px solid rgba(251,191,36,0.35)", color: "#fbbf24" }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Instructions (fade hint) */}
      <div
        className="absolute bottom-12 right-3 text-right z-10 pointer-events-none"
        style={{ opacity: 0.35 }}
      >
        <p className="text-[9px] text-white/60">Scroll to zoom · Drag to pan</p>
        <p className="text-[9px] text-white/60">Click plot to view details</p>
      </div>
    </div>
  );
}
