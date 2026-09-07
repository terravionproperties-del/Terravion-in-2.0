"use client";
/**
 * components/gis/TownshipScene3D.tsx
 *
 * Advanced Three.js 3D Isometric Township Viewer
 *
 * Features:
 *  ✓ OrthographicCamera at isometric angle (like ArcGIS Scene)
 *  ✓ PCFSoftShadow mapping — premium quality shadows
 *  ✓ HemisphereLight + DirectionalLight (golden sunlight)
 *  ✓ InstancedMesh for 475 plots (single draw call per status)
 *  ✓ InstancedMesh for trees (trunk + canopy, both lit)
 *  ✓ InstancedMesh for animated cars on roads
 *  ✓ 3D buildings: Clubhouse (L-shape), Pool, Amphitheater etc.
 *  ✓ Ground plane (beige) + road surfaces (dark asphalt)
 *  ✓ Raycasting hover/click on instanced meshes
 *  ✓ Hover glow (separate wireframe box follower)
 *  ✓ Selected plot ring (pulsing ring animation)
 *  ✓ Mouse drag → orbit, Scroll → zoom, Middle drag → pan
 *  ✓ Auto-slow-rotate that stops on interaction
 *  ✓ 60fps RAF with delta-time car animation
 */

import { useEffect, useRef, useCallback } from "react";
import type * as THREE_TYPES from "three";
import type { Plot, Project } from "@/lib/types/gis";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLOT_HEIGHT: Record<string, number> = {
  AVAILABLE:  3.0,
  BOOKED:     2.5,
  SOLD:       1.0,
  RESERVED:   1.8,
  PREMIUM:    4.5,
  COMMERCIAL: 2.8,
};

const PLOT_COLOR_HEX: Record<string, number> = {
  AVAILABLE:  0xe0415b,
  BOOKED:     0xf97316,
  SOLD:       0x9333ea,
  RESERVED:   0x2563eb,
  PREMIUM:    0xca8a04,
  COMMERCIAL: 0x0891b2,
};

const PLOT_EMISSIVE: Record<string, number> = {
  AVAILABLE:  0x3a0010,
  BOOKED:     0x2a1000,
  SOLD:       0x150030,
  RESERVED:   0x00102a,
  PREMIUM:    0x2a1a00,
  COMMERCIAL: 0x00102a,
};

// Road definitions [x1, z1, x2, z2, widthFt]
const SPINE_X = [-160, -80, 0, 80, 160];
const ROAD_EW_Z = [0, -225, -170, -120, -70, 50, 100, 150, 230];

// Tree generation helper
function* genTrees(): Generator<[number, number, number]> {
  // top boundary
  for (let x = -220; x < 225; x += 16) yield [x, 0, -285];
  // bottom boundary
  for (let x = -220; x < 225; x += 16) yield [x, 0, 236];
  // west boundary (left of main road)
  for (let z = -280; z < 236; z += 16) yield [-238, 0, z];
  // east boundary strip (moved to x=222,232 so amenity zone at x=170-215 is clear)
  for (let z = -215; z < 220; z += 14) yield [222, 0, z];
  for (let z = -215; z < 220; z += 14) yield [232, 0, z];
  // street trees both sides of each spine (skip top zone where clubhouse is)
  for (const x of SPINE_X) {
    for (let z = -220; z < 220; z += 20) {
      yield [x - 9, 0, z];
      yield [x + 9, 0, z];
    }
  }
  // NW entrance trees (flanking gate, NOT over clubhouse)
  for (const [tx, tz] of [[-240,-285],[-240,-270],[-240,-258],[-240,-245],[-240,-232]]) {
    yield [tx as number, 0, tz as number];
  }
}

// Car route [x1, z1, x2, z2]
const CAR_ROUTES: [number, number, number, number][] = [
  [-230, -100, -230, 215],
  [-160, -275,  -160, 225],
  [ -80,  225,   -80,-275],
  [   0, -275,     0, 225],
  [  80,  225,    80,-275],
  [ 160, -275,   160, 225],
  [-230,    0,   215,   0],
  [ 215, -225,  -230,-225],
  [-230,   50,   215,  50],
];
const CAR_COLORS_HEX = [0xef4444,0x3b82f6,0x22c55e,0xf59e0b,0xec4899,0xffffff,0x94a3b8];

interface Props {
  project: Project;
  onPlotSelect: (p: Plot | null) => void;
  selectedPlot: Plot | null;
  filterFn: (p: Plot) => boolean;
}

export default function TownshipScene3D({ project, onPlotSelect, selectedPlot, filterFn }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef     = useRef<SceneState | null>(null);
  const selectedRef  = useRef<Plot | null>(selectedPlot);
  const filterRef    = useRef<(p: Plot) => boolean>(filterFn);

  useEffect(() => { selectedRef.current = selectedPlot; }, [selectedPlot]);
  useEffect(() => { filterRef.current = filterFn; }, [filterFn]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let destroyed = false;

    async function init() {
      const THREE = await import("three");
      // Guaranteed non-null (checked above before scheduling init)
      const cvs = canvas!;
      const ctr = container!;

      // ── Renderer ─────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0c0e16, 1);

      // ── Scene ─────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0c18);
      scene.fog = new THREE.FogExp2(0x0a0c18, 0.0008);

      // ── Camera (Orthographic Isometric) ───────────────────────────────────
      const W = ctr.clientWidth, H = ctr.clientHeight;
      renderer.setSize(W, H);

      let frustum = 340;
      const aspect = W / H;
      const camera = new THREE.OrthographicCamera(
        -frustum * aspect, frustum * aspect,
        frustum, -frustum,
        0.1, 3000
      );
      // Classic isometric: 45° azimuth, ~35° elevation
      camera.position.set(550, 650, 550);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);

      // ── Lighting ──────────────────────────────────────────────────────────
      const hemi = new THREE.HemisphereLight(0x7090b0, 0x604030, 0.9);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffe8b0, 2.2);
      sun.position.set(-260, 500, -180);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far  = 1400;
      sun.shadow.camera.left  = -360;
      sun.shadow.camera.right =  360;
      sun.shadow.camera.top   =  400;
      sun.shadow.camera.bottom = -400;
      sun.shadow.bias = -0.0003;
      scene.add(sun);

      const fill = new THREE.DirectionalLight(0xb0c8e0, 0.5);
      fill.position.set(200, 300, 200);
      scene.add(fill);

      // ── Ground ────────────────────────────────────────────────────────────
      const groundGeo = new THREE.PlaneGeometry(520, 580);
      const groundMat = new THREE.MeshLambertMaterial({ color: 0xd0c49a });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Boundary edge (slightly raised rim)
      const rimMat = new THREE.MeshLambertMaterial({ color: 0xb8a87a });
      const rimGeo = new THREE.BoxGeometry(520, 0.5, 580);
      // Just 4 thin sides
      for (const [tx, tz, tw, td] of [
        [0, -290, 510, 4],
        [0,  290, 510, 4],
        [-256, 0, 4, 580],
        [ 232, 0, 4, 580],
      ] as [number,number,number,number][]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.6, td), rimMat);
        b.position.set(tx, 0.3, tz);
        b.receiveShadow = true;
        scene.add(b);
      }

      // ── Roads ─────────────────────────────────────────────────────────────
      const roadMat   = new THREE.MeshLambertMaterial({ color: 0x1a1d2a });
      const roadLineMat = new THREE.MeshLambertMaterial({ color: 0xffd040 });

      function addRoad(x: number, z: number, w: number, d: number) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), roadMat);
        m.position.set(x, 0.12, z);
        m.receiveShadow = true;
        scene.add(m);
        // centre dashes
        const dashCount = Math.floor(Math.max(w, d) / 20);
        const isH = d < w; // horizontal road
        for (let i = 0; i < dashCount; i++) {
          const dashL = 10, dashW = 0.35, gap = 10;
          const offset = -Math.max(w, d) / 2 + dashL / 2 + i * (dashL + gap);
          const dash = new THREE.Mesh(
            isH
              ? new THREE.BoxGeometry(dashL, 0.05, dashW)
              : new THREE.BoxGeometry(dashW, 0.05, dashL),
            roadLineMat
          );
          dash.position.set(
            isH ? x + offset : x,
            0.27,
            isH ? z : z + offset
          );
          scene.add(dash);
        }
      }

      // W main road (100ft = 25u)
      addRoad(-230, -25, 25, 540);

      // N-S spines (60ft = 15u)
      SPINE_X.forEach((x) => addRoad(x, -25, 15, 540));

      // E-W roads
      for (const z of ROAD_EW_Z) {
        const widthFt = (z === 0 || z === 230) ? 10 : 7.5;
        addRoad(0, z, 490, widthFt);
      }

      // ── Plots (InstancedMesh per status) ──────────────────────────────────
      const dummy = new THREE.Object3D();
      const plotsByStatus: Record<string, Plot[]> = {};
      for (const plot of project.plots) {
        if (!plotsByStatus[plot.status]) plotsByStatus[plot.status] = [];
        plotsByStatus[plot.status].push(plot);
      }

      // Map for raycasting: meshId+instanceId → plot
      const instanceMap = new Map<string, Plot>();
      const plotMeshes: THREE_TYPES.InstancedMesh[] = [];

      for (const [status, statusPlots] of Object.entries(plotsByStatus)) {
        const h     = PLOT_HEIGHT[status] ?? 2;
        const color = PLOT_COLOR_HEX[status as keyof typeof PLOT_COLOR_HEX] ?? 0x888888;
        const emissive = PLOT_EMISSIVE[status as keyof typeof PLOT_EMISSIVE] ?? 0x000000;
        const mat   = new THREE.MeshPhongMaterial({
          color,
          emissive,
          shininess: 40,
          specular: 0x333333,
        });
        const geo   = new THREE.BoxGeometry(1, 1, 1);
        const mesh  = new THREE.InstancedMesh(geo, mat, statusPlots.length);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        mesh.userData.status = status;
        mesh.userData.plots  = statusPlots;
        mesh.name = `plots_${status}`;

        statusPlots.forEach((plot, idx) => {
          if (!plot.position3D) return;
          const [wx, , wz] = plot.position3D;
          const pw = plot.dimension.breadth * 0.25 - 0.6;
          const pd = plot.dimension.length  * 0.25 - 0.6;
          dummy.position.set(wx, h / 2, wz);
          dummy.scale.set(pw, h, pd);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
          instanceMap.set(`${mesh.id}_${idx}`, plot);
        });
        mesh.instanceMatrix.needsUpdate = true;
        scene.add(mesh);
        plotMeshes.push(mesh);
      }

      // ── Trees (InstancedMesh: trunk + canopy) ─────────────────────────────
      const treePositions = [...genTrees()];
      const treeCount = treePositions.length;

      const trunkMat  = new THREE.MeshPhongMaterial({ color: 0x5c3a10, shininess: 5 });
      const canopyMat = new THREE.MeshPhongMaterial({ color: 0x2a5a22, emissive: 0x0a1a08, shininess: 15 });
      const canopy2Mat = new THREE.MeshPhongMaterial({ color: 0x3d7a30, emissive: 0x0d200a, shininess: 20 });

      const trunkMesh  = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 6), trunkMat, treeCount);
      const canopyMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 7), canopyMat, treeCount);
      const canopy2Mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 7), canopy2Mat, treeCount);
      trunkMesh.castShadow  = true;
      canopyMesh.castShadow = true;
      canopy2Mesh.castShadow = true;
      trunkMesh.receiveShadow  = true;
      canopyMesh.receiveShadow = true;

      treePositions.forEach(([tx, , tz], i) => {
        const seed  = Math.abs(Math.round(tx * 17 + tz * 13)) % 100;
        const tH    = 5 + (seed % 5);
        const cR    = 4 + (seed % 5) * 0.5;
        const jx    = ((seed % 7) - 3) * 0.3;
        const jz    = ((seed % 5) - 2) * 0.3;

        dummy.position.set(tx + jx, tH / 2, tz + jz);
        dummy.scale.set(0.8, tH / 5, 0.8);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx + jx, tH + cR * 0.5, tz + jz);
        dummy.scale.set(cR, cR * 1.1, cR);
        dummy.updateMatrix();
        canopyMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx + jx - cR * 0.2, tH + cR * 0.85, tz + jz - cR * 0.15);
        dummy.scale.set(cR * 0.65, cR * 0.65, cR * 0.65);
        dummy.updateMatrix();
        canopy2Mesh.setMatrixAt(i, dummy.matrix);
      });
      trunkMesh.instanceMatrix.needsUpdate  = true;
      canopyMesh.instanceMatrix.needsUpdate = true;
      canopy2Mesh.instanceMatrix.needsUpdate = true;
      scene.add(trunkMesh, canopyMesh, canopy2Mesh);

      // ── Buildings ────────────────────────────────────────────────────────
      function addBuilding(
        x: number, z: number, w: number, h: number, d: number,
        color: number, roofColor: number, name?: string
      ) {
        const mat   = new THREE.MeshPhongMaterial({ color, shininess: 30 });
        const roofMat = new THREE.MeshPhongMaterial({ color: roofColor, shininess: 80 });

        // Walls
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        body.position.set(x, h / 2, z);
        body.castShadow = true;
        body.receiveShadow = true;
        scene.add(body);

        // Flat roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.8, d + 1), roofMat);
        roof.position.set(x, h + 0.4, z);
        roof.castShadow = true;
        scene.add(roof);

        // Ridge (peak line)
        const ridgeGeo = new THREE.BoxGeometry(w * 0.7, 1.5, 0.6);
        const ridge = new THREE.Mesh(ridgeGeo, roofMat);
        ridge.position.set(x, h + 1.15, z);
        scene.add(ridge);
      }

      // ── AMENITY BUILDINGS ─────────────────────────────────────────────────
      // All positioned in the AMENITY ZONES (clear of plot blocks and trees)

      // Helper: add a premium building with walls + overhang roof + ridge spine
      function addPremiumBuilding(
        x: number, z: number, w: number, h: number, d: number,
        wallHex: number, roofHex: number, emissiveHex: number = 0x000000
      ) {
        const wallMat = new THREE.MeshPhongMaterial({
          color: wallHex, emissive: emissiveHex, shininess: 60,
        });
        const roofMat = new THREE.MeshPhongMaterial({
          color: roofHex, shininess: 100, specular: 0x222222,
        });

        // Base plinth (slightly wider)
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(w + 2, 0.6, d + 2),
          new THREE.MeshPhongMaterial({ color: 0xb0a080, shininess: 20 })
        );
        plinth.position.set(x, 0.3, z);
        plinth.receiveShadow = true;
        scene.add(plinth);

        // Walls
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        body.position.set(x, h / 2 + 0.6, z);
        body.castShadow = true;
        body.receiveShadow = true;
        scene.add(body);

        // Overhanging roof
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(w + 2.5, 1.2, d + 2.5), roofMat
        );
        roof.position.set(x, h + 0.6 + 0.6, z);
        roof.castShadow = true;
        scene.add(roof);

        // Triangular ridge peak
        const ridgeGeo = new THREE.BoxGeometry(w * 0.6, 2.0, 0.8);
        const ridge = new THREE.Mesh(ridgeGeo, roofMat);
        ridge.position.set(x, h + 0.6 + 1.6, z);
        scene.add(ridge);
      }

      // ──────────────────────────────────────────────────────
      // 1. CLUBHOUSE — NW corner, large L-shaped compound
      //    Positioned at (-190, -255) — clear of plots and trees
      // ──────────────────────────────────────────────────────
      // Main hall (60ft wide × 40ft deep × 14 units tall)
      addPremiumBuilding(-190, -255, 55, 14, 38, 0x4a2c08, 0xc8892e, 0x1a0a00);
      // Wing (side extension)
      addPremiumBuilding(-190, -280, 35, 9, 18, 0x3a2008, 0xb87820, 0x120800);

      // Compound wall outline
      {
        const wallMat2 = new THREE.MeshLambertMaterial({ color: 0x6b4c22 });
        // front wall
        const fw = new THREE.Mesh(new THREE.BoxGeometry(70, 2.5, 0.8), wallMat2);
        fw.position.set(-190, 1.25, -235); scene.add(fw);
        // back wall
        const bw = new THREE.Mesh(new THREE.BoxGeometry(70, 2.5, 0.8), wallMat2);
        bw.position.set(-190, 1.25, -295); scene.add(bw);
        // left wall
        const lw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 60), wallMat2);
        lw.position.set(-227, 1.25, -265); scene.add(lw);
      }

      // Pool deck (in front of clubhouse)
      {
        const deckMat = new THREE.MeshPhongMaterial({ color: 0xe8dcc0, shininess: 20 });
        const deck = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 12), deckMat);
        deck.position.set(-190, 0.8, -230);
        deck.receiveShadow = true; scene.add(deck);
      }

      // ──────────────────────────────────────────────────────
      // 2. ENTRANCE GATE — on main west road at x=-230, z=-100
      // ──────────────────────────────────────────────────────
      {
        const gMat = new THREE.MeshPhongMaterial({ color: 0x8b6914, emissive: 0x221200, shininess: 80 });
        const gCapMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24, emissive: 0x200c00, shininess: 120 });
        // Left pillar
        const lp = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 3), gMat);
        lp.position.set(-231, 5, -107); lp.castShadow = true; scene.add(lp);
        // Right pillar
        const rp = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 3), gMat);
        rp.position.set(-231, 5, -93); rp.castShadow = true; scene.add(rp);
        // Top arch bar
        const arch = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 20), gCapMat);
        arch.position.set(-231, 11, -100); arch.castShadow = true; scene.add(arch);
        // Gold cap orbs
        const orbMat = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0x2a1800, shininess: 200 });
        const orbGeo = new THREE.SphereGeometry(1.2, 8, 8);
        for (const [ox, oz] of [[-231, -107], [-231, -93]]) {
          const orb = new THREE.Mesh(orbGeo, orbMat);
          orb.position.set(ox, 12.5, oz);
          scene.add(orb);
        }
      }

      // ──────────────────────────────────────────────────────
      // 3. SWIMMING POOL — NE corner, between spine x=160 and east trees
      //    Positioned at (190, -258) — in NE amenity zone
      // ──────────────────────────────────────────────────────
      {
        // Surround deck
        const surroundMat = new THREE.MeshPhongMaterial({ color: 0xe0d0b0, shininess: 30 });
        const surround = new THREE.Mesh(new THREE.BoxGeometry(44, 0.6, 32), surroundMat);
        surround.position.set(190, 0.3, -258);
        surround.receiveShadow = true; scene.add(surround);

        // Pool water
        const poolWater = new THREE.MeshPhongMaterial({
          color: 0x1a7ab8, emissive: 0x003050, shininess: 200, specular: 0x88bbff,
        });
        const poolMesh = new THREE.Mesh(new THREE.BoxGeometry(36, 0.5, 22), poolWater);
        poolMesh.position.set(190, 0.55, -258);
        scene.add(poolMesh);

        // Lane dividers
        const laneMat = new THREE.MeshLambertMaterial({ color: 0x82c4ff });
        for (let i = -2; i <= 2; i++) {
          const lane = new THREE.Mesh(new THREE.BoxGeometry(36, 0.1, 0.4), laneMat);
          lane.position.set(190, 0.85, -258 + i * 4);
          scene.add(lane);
        }

        // Pool house
        addPremiumBuilding(190, -276, 30, 8, 10, 0x2a4080, 0x4a70c0, 0x060c20);
      }

      // ──────────────────────────────────────────────────────
      // 4. SPORTS COURT — east amenity strip at z=50
      //    x=185 (clear of plots at x=160+8=168, clear of trees at x=222)
      // ──────────────────────────────────────────────────────
      {
        const courtMat = new THREE.MeshPhongMaterial({ color: 0x286028, shininess: 40 });
        const court = new THREE.Mesh(new THREE.BoxGeometry(42, 0.5, 24), courtMat);
        court.position.set(185, 0.25, 50);
        court.receiveShadow = true; scene.add(court);

        // Court lines
        const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        // Net
        const net = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 22), lineMat);
        net.position.set(185, 2, 50); scene.add(net);
        // Sidelines
        for (const lz of [-10, 10]) {
          const side = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 0.3), lineMat);
          side.position.set(185, 0.55, 50 + lz); scene.add(side);
        }
        // Baseline
        for (const lx of [-20, 20]) {
          const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 22), lineMat);
          base.position.set(185 + lx, 0.55, 50); scene.add(base);
        }

        // Court surround
        addPremiumBuilding(185, 26, 16, 6, 10, 0x1a3a1a, 0x3a7a3a);
      }

      // ──────────────────────────────────────────────────────
      // 5. CHILDREN'S PLAY ZONE — east amenity strip at z=105
      // ──────────────────────────────────────────────────────
      {
        // Rubber floor
        const floorMat = new THREE.MeshPhongMaterial({ color: 0xd04010, shininess: 10 });
        const floor = new THREE.Mesh(new THREE.BoxGeometry(38, 0.4, 28), floorMat);
        floor.position.set(185, 0.2, 105);
        floor.receiveShadow = true; scene.add(floor);

        // Play structure (colorful block)
        addPremiumBuilding(185, 105, 22, 10, 16, 0x8b2808, 0xf97316, 0x1a0500);

        // Slide element (a ramp-like box)
        {
          const slideMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 80 });
          const slide = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 1.5), slideMat);
          slide.position.set(175, 3, 105);
          slide.rotation.z = 0.4;
          slide.castShadow = true; scene.add(slide);
        }
      }

      // ──────────────────────────────────────────────────────
      // 6. AMPHITHEATER — east amenity strip at z=158
      // ──────────────────────────────────────────────────────
      {
        // Stage base (concentric rings approximated)
        const stageMat = new THREE.MeshPhongMaterial({ color: 0x1a0830, emissive: 0x060015, shininess: 60 });
        const stage = new THREE.Mesh(new THREE.BoxGeometry(38, 1.5, 26), stageMat);
        stage.position.set(185, 0.75, 158);
        stage.receiveShadow = true; scene.add(stage);

        // Stage platform
        const platMat = new THREE.MeshPhongMaterial({ color: 0x4a0880, emissive: 0x100020, shininess: 80 });
        const plat = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 16), platMat);
        plat.position.set(185, 3, 158);
        plat.castShadow = true; scene.add(plat);

        // Seating rows (stepped boxes)
        for (let r = 0; r < 3; r++) {
          const rowMat = new THREE.MeshPhongMaterial({ color: 0x6b10c0 });
          const row = new THREE.Mesh(new THREE.BoxGeometry(36 - r * 4, 1.5, 4), rowMat);
          row.position.set(185, 1.5 + r * 1.5, 158 + 10 + r * 4);
          scene.add(row);
        }

        // Canopy arch
        addPremiumBuilding(185, 140, 22, 8, 10, 0x250850, 0x7c3aed, 0x0c0018);
      }

      // ──────────────────────────────────────────────────────
      // 7. SOCIAL INFRA / MARKET — top zone at z=-265
      // ──────────────────────────────────────────────────────
      addPremiumBuilding(40, -265, 40, 8, 22, 0x1c3a1c, 0x4a8a4a, 0x04100a);


      // ── Cars — proper 2-part body+cab instanced meshes ──────────────────────
      interface Car {
        routeIdx: number;
        t: number;
        speed: number;
      }
      const cars: Car[] = CAR_ROUTES.flatMap((_, ri) => {
        const count = 1 + (ri % 3);
        return Array.from({ length: count }, (__, i) => ({
          routeIdx: ri,
          t: (i / count + Math.random() * 0.1) % 1,
          speed: 20 + Math.random() * 10,
        }));
      });
      const carCount = cars.length;

      // ── Car body (low, full width) ────────────────────────────────────────
      const carBodyMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 150, specular: 0x444444 });
      const carBodyMesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(5.5, 1.2, 2.8), carBodyMat, carCount
      );
      carBodyMesh.castShadow = true;

      // ── Car cab (narrower, raised) ────────────────────────────────────────
      const carCabMat = new THREE.MeshPhongMaterial({ color: 0x88aacc, emissive: 0x040810, shininess: 200, specular: 0x888888 });
      const carCabMesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(2.8, 1.1, 2.4), carCabMat, carCount
      );
      carCabMesh.castShadow = true;

      // ── Headlights (tiny bright boxes front) ─────────────────────────────
      const headlightMat = new THREE.MeshPhongMaterial({ color: 0xffffee, emissive: 0xffffaa, shininess: 300 });
      const headlightMesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.15), headlightMat, carCount * 2
      );

      // Assign per-car body colours
      cars.forEach((car, i) => {
        const col = new THREE.Color(CAR_COLORS_HEX[i % CAR_COLORS_HEX.length]);
        carBodyMesh.setColorAt(i, col);
      });
      carBodyMesh.instanceColor!.needsUpdate = true;

      scene.add(carBodyMesh, carCabMesh, headlightMesh);


      // ── Hover/Selection helpers ───────────────────────────────────────────
      const hoverMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 });
      const hoverBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), hoverMat);
      hoverBox.visible = false;
      scene.add(hoverBox);

      const selRingMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true, transparent: true, opacity: 0.9 });
      const selRing    = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), selRingMat);
      selRing.visible  = false;
      scene.add(selRing);

      // ── State for scene ───────────────────────────────────────────────────
      const state: SceneState = {
        renderer, scene, camera, sun,
        plotMeshes, instanceMap,
        hoverBox, selRing, dummy,
        cars, carBodyMesh, carCabMesh, headlightMesh,
        frustum,
        orbitAzimuth: Math.PI * 1.25,
        orbitElevation: 0.62,
        orbitRadius: 950,
        targetPanX: 0, targetPanZ: 0,
        panX: 0, panZ: 0,
        autoRotate: true,
        interacting: false,
        interactingTimeout: null,
      };

      sceneRef.current = state;

      // ── Raycaster ─────────────────────────────────────────────────────────
      const raycaster = new THREE.Raycaster();
      const mouse2D   = new THREE.Vector2();

      cvs.addEventListener("mousemove", (e: MouseEvent) => {
        const rect = cvs.getBoundingClientRect();
        mouse2D.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse2D.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse2D, camera);
        const hits = raycaster.intersectObjects(plotMeshes, false);

        if (hits.length > 0) {
          const hit  = hits[0];
          const mesh = hit.object as THREE_TYPES.InstancedMesh;
          const idx  = hit.instanceId!;
          const plot = instanceMap.get(`${mesh.id}_${idx}`);
          if (plot && filterRef.current(plot)) {
            cvs.style.cursor = "pointer";
            const h = PLOT_HEIGHT[plot.status] ?? 2;
            const pw = plot.dimension.breadth * 0.25;
            const pd = plot.dimension.length  * 0.25;
            const [wx,, wz] = plot.position3D!;
            hoverBox.position.set(wx, h / 2, wz);
            hoverBox.scale.set(pw + 1.5, h + 1.5, pd + 1.5);
            hoverBox.visible = true;
          } else {
            cvs.style.cursor = "grab";
            hoverBox.visible = false;
          }
        } else {
          cvs.style.cursor = "grab";
          hoverBox.visible = false;
        }
      });

      cvs.addEventListener("click", (e: MouseEvent) => {
        if (Math.hypot(e.movementX, e.movementY) > 3) return;
        const rect = cvs.getBoundingClientRect();
        mouse2D.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse2D.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse2D, camera);
        const hits = raycaster.intersectObjects(plotMeshes, false);

        if (hits.length > 0) {
          const hit  = hits[0];
          const mesh = hit.object as THREE_TYPES.InstancedMesh;
          const idx  = hit.instanceId!;
          const plot = instanceMap.get(`${mesh.id}_${idx}`);
          if (plot && filterRef.current(plot)) {
            onPlotSelect(plot);
          }
        } else {
          onPlotSelect(null);
        }
      });

      // ── Orbit Controls ────────────────────────────────────────────────────
      let isDrag = false;
      let dragButton = 0;
      let lastMX = 0, lastMY = 0;

      cvs.addEventListener("mousedown", (e: MouseEvent) => {
        isDrag = true;
        dragButton = e.button;
        lastMX = e.clientX;
        lastMY = e.clientY;
        state.autoRotate = false;
        state.interacting = true;
        if (state.interactingTimeout) clearTimeout(state.interactingTimeout);
      });

      window.addEventListener("mousemove", (e: MouseEvent) => {
        if (!isDrag) return;
        const dx = e.clientX - lastMX;
        const dy = e.clientY - lastMY;
        lastMX = e.clientX; lastMY = e.clientY;

        if (dragButton === 0) {
          // Left drag: orbit
          state.orbitAzimuth   -= dx * 0.008;
          state.orbitElevation  = Math.max(0.25, Math.min(1.35, state.orbitElevation - dy * 0.006));
        } else if (dragButton === 1 || dragButton === 2) {
          // Middle/right drag: pan
          const panSpeed = state.frustum * 0.003;
          state.targetPanX -= dx * panSpeed;
          state.targetPanZ -= dy * panSpeed;
        }
        updateCamera(state, THREE);
      });

      window.addEventListener("mouseup", () => {
        isDrag = false;
        state.interactingTimeout = setTimeout(() => {
          state.autoRotate   = true;
          state.interacting  = false;
        }, 4000) as unknown as null;
      });

      cvs.addEventListener("wheel", (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1.1 : 0.91;
        state.frustum = Math.max(80, Math.min(600, state.frustum * delta));
        const asp = cvs.width / cvs.height;
        camera.left   = -state.frustum * asp;
        camera.right  =  state.frustum * asp;
        camera.top    =  state.frustum;
        camera.bottom = -state.frustum;
        camera.updateProjectionMatrix();
        state.autoRotate = false;
        if (state.interactingTimeout) clearTimeout(state.interactingTimeout);
        state.interactingTimeout = setTimeout(() => {
          state.autoRotate = true;
        }, 3000) as unknown as null;
      }, { passive: false });

      // Resize
      const ro = new ResizeObserver(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const W2 = containerRef.current.clientWidth;
        const H2 = containerRef.current.clientHeight;
        renderer.setSize(W2, H2);
        const asp2 = W2 / H2;
        camera.left   = -state.frustum * asp2;
        camera.right  =  state.frustum * asp2;
        camera.top    =  state.frustum;
        camera.bottom = -state.frustum;
        camera.updateProjectionMatrix();
      });
      ro.observe(ctr);

      // ── RAF loop ──────────────────────────────────────────────────────────
      let lastT = 0;
      let rafHandle = 0;

      function animate(t: number) {
        if (destroyed) return;
        rafHandle = requestAnimationFrame(animate);
        const dt = Math.min((t - lastT) / 1000, 0.05);
        lastT = t;

        // Auto-rotate
        if (state.autoRotate) {
          state.orbitAzimuth += 0.0012;
          updateCamera(state, THREE);
        }

        // Pan lerp
        state.panX += (state.targetPanX - state.panX) * 0.08;
        state.panZ += (state.targetPanZ - state.panZ) * 0.08;

        // Car animation — 3-part: body + cab + headlights
        for (let i = 0; i < state.cars.length; i++) {
          const car = state.cars[i];
          const route = CAR_ROUTES[car.routeIdx];
          const [x1, z1, x2, z2] = route;
          const routeLen = Math.hypot(x2 - x1, z2 - z1);
          car.t = (car.t + (car.speed * dt) / routeLen) % 1;
          const cx = x1 + (x2 - x1) * car.t;
          const cz = z1 + (z2 - z1) * car.t;
          const angle = Math.atan2(x2 - x1, z2 - z1);

          // Body (sits on road surface)
          dummy.position.set(cx, 0.6, cz);
          dummy.rotation.y = angle;
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          state.carBodyMesh.setMatrixAt(i, dummy.matrix);

          // Cab (narrower, sits on top of body, slightly forward)
          const cabFwd = 0.6; // forward offset in local space
          const cabLocalX = Math.sin(angle) * cabFwd;
          const cabLocalZ = Math.cos(angle) * cabFwd;
          dummy.position.set(cx + cabLocalX * 0.5, 1.75, cz + cabLocalZ * 0.5);
          dummy.rotation.y = angle;
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          state.carCabMesh.setMatrixAt(i, dummy.matrix);

          // Headlights (two, front of car)
          const fwdX = Math.sin(angle) * 2.7;
          const fwdZ = Math.cos(angle) * 2.7;
          // Left headlight
          const lx = -Math.cos(angle) * 0.7;
          const lz =  Math.sin(angle) * 0.7;
          dummy.position.set(cx + fwdX + lx, 0.6, cz + fwdZ + lz);
          dummy.rotation.y = angle;
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          state.headlightMesh.setMatrixAt(i * 2, dummy.matrix);
          // Right headlight
          dummy.position.set(cx + fwdX - lx, 0.6, cz + fwdZ - lz);
          dummy.updateMatrix();
          state.headlightMesh.setMatrixAt(i * 2 + 1, dummy.matrix);
        }
        state.carBodyMesh.instanceMatrix.needsUpdate = true;
        state.carCabMesh.instanceMatrix.needsUpdate  = true;
        state.headlightMesh.instanceMatrix.needsUpdate = true;

        // Selected plot ring (pulsing scale)
        const sel = selectedRef.current;
        if (sel?.position3D) {
          const [wx,, wz] = sel.position3D;
          const h  = PLOT_HEIGHT[sel.status] ?? 2;
          const pw = sel.dimension.breadth * 0.25;
          const pd = sel.dimension.length  * 0.25;
          const pulse = 1 + 0.08 * Math.sin(t * 0.004);
          selRing.position.set(wx, h / 2, wz);
          selRing.scale.set((pw + 2) * pulse, (h + 2) * pulse, (pd + 2) * pulse);
          selRing.visible = true;
        } else {
          selRing.visible = false;
        }

        // Update dim/glow per-mesh based on filter
        for (const mesh of state.plotMeshes) {
          const plots = mesh.userData.plots as Plot[];
          const mat   = mesh.material as THREE_TYPES.MeshPhongMaterial;
          // If any plot in this mesh passes filter, show fully; else dim
          const anyPass = plots.some((p: Plot) => filterRef.current(p));
          mat.opacity    = anyPass ? 1 : 0.18;
          mat.transparent = !anyPass;
        }

        renderer.render(scene, camera);
      }

      rafHandle = requestAnimationFrame(animate);
      updateCamera(state, THREE);

      // Store cleanup fn
      (canvas as HTMLCanvasElement & { _cleanup?: () => void })._cleanup = () => {
        cancelAnimationFrame(rafHandle);
        ro.disconnect();
        renderer.dispose();
        scene.clear();
      };
    }

    init().catch(console.error);

    return () => {
      destroyed = true;
      const c = canvasRef.current as (HTMLCanvasElement & { _cleanup?: () => void }) | null;
      c?._cleanup?.();
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Orbit hint */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10 pointer-events-none" style={{ opacity: 0.5 }}>
        <p className="text-[9px] text-white/50 text-right">Left drag: rotate</p>
        <p className="text-[9px] text-white/50 text-right">Right drag: pan</p>
        <p className="text-[9px] text-white/50 text-right">Scroll: zoom</p>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-1.5 z-10">
        {([
          { icon: "+", fn: () => zoomScene(-0.15) },
          { icon: "−", fn: () => zoomScene(0.15) },
          { icon: "⟳", fn: () => resetCamera() },
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
    </div>
  );

  function zoomScene(delta: number) {
    const s = sceneRef.current;
    if (!s) return;
    s.frustum = Math.max(80, Math.min(600, s.frustum * (1 + delta)));
    const canvas = canvasRef.current!;
    const asp = canvas.width / canvas.height;
    s.camera.left   = -s.frustum * asp;
    s.camera.right  =  s.frustum * asp;
    s.camera.top    =  s.frustum;
    s.camera.bottom = -s.frustum;
    s.camera.updateProjectionMatrix();
  }

  function resetCamera() {
    const s = sceneRef.current;
    if (!s) return;
    s.orbitAzimuth   = Math.PI * 1.25;
    s.orbitElevation = 0.62;
    s.frustum        = 340;
    s.targetPanX     = 0;
    s.targetPanZ     = 0;
    s.autoRotate     = true;
    const canvas = canvasRef.current!;
    const asp = canvas.width / canvas.height;
    s.camera.left   = -s.frustum * asp;
    s.camera.right  =  s.frustum * asp;
    s.camera.top    =  s.frustum;
    s.camera.bottom = -s.frustum;
    s.camera.updateProjectionMatrix();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCamera(s, null as any);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SceneState {
  renderer: import("three").WebGLRenderer;
  scene:    import("three").Scene;
  camera:   import("three").OrthographicCamera;
  sun:      import("three").DirectionalLight;
  plotMeshes: import("three").InstancedMesh[];
  instanceMap: Map<string, Plot>;
  hoverBox: import("three").Mesh;
  selRing:  import("three").Mesh;
  dummy:    import("three").Object3D;
  cars:     Array<{ routeIdx: number; t: number; speed: number }>;
  carBodyMesh:   import("three").InstancedMesh;
  carCabMesh:    import("three").InstancedMesh;
  headlightMesh: import("three").InstancedMesh;
  frustum:  number;
  orbitAzimuth:   number;
  orbitElevation: number;
  orbitRadius:    number;
  targetPanX: number; targetPanZ: number;
  panX: number; panZ: number;
  autoRotate: boolean;
  interacting: boolean;
  interactingTimeout: null | NodeJS.Timeout;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateCamera(s: SceneState, THREE: any) {
  const r   = s.orbitRadius;
  const az  = s.orbitAzimuth;
  const el  = s.orbitElevation;
  const cx  = r * Math.cos(el) * Math.sin(az) + s.panX;
  const cy  = r * Math.sin(el);
  const cz  = r * Math.cos(el) * Math.cos(az) + s.panZ;
  s.camera.position.set(cx, cy, cz);
  s.camera.lookAt(s.panX, 0, s.panZ);
  s.camera.updateProjectionMatrix();
}
