"use client";
/**
 * components/gis/TownshipScene.tsx
 * The complete 3D township scene — plots, roads, amenities, lighting, shadows, sky.
 * Orchestrates all scene objects and day/night cycle.
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Sky,
  Stars,
  Grid,
  ContactShadows,
  Preload,
} from "@react-three/drei";
import * as THREE from "three";
import { PlotMesh } from "./PlotMesh";
import { useGISStore } from "@/lib/stores/gisStore";
import type { Plot, DayMode } from "@/lib/types/gis";

// ─── Sky & Lighting per day mode ──────────────────────────────────────────────

const DAY_CONFIGS: Record<DayMode, {
  sunPosition: [number, number, number];
  skyColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  stars: boolean;
}> = {
  morning: {
    sunPosition: [10, 15, 5],
    skyColor: "#e0f2fe",
    ambientIntensity: 0.6,
    fogColor: "#f0f9ff",
    fogNear: 200,
    fogFar: 600,
    stars: false,
  },
  sunset: {
    sunPosition: [5, 2, 10],
    skyColor: "#fde68a",
    ambientIntensity: 0.35,
    fogColor: "#fde68a",
    fogNear: 150,
    fogFar: 450,
    stars: false,
  },
  night: {
    sunPosition: [-10, -5, -10],
    skyColor: "#0c0e1a",
    ambientIntensity: 0.08,
    fogColor: "#0c0e1a",
    fogNear: 80,
    fogFar: 300,
    stars: true,
  },
};

// ─── Ground Plane ─────────────────────────────────────────────────────────────

function Ground({ bounds }: { bounds: [number, number] }) {
  const size = Math.max(...bounds) * 2.5;
  return (
    <>
      {/* Main grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#4a7c59" roughness={0.9} metalness={0} />
      </mesh>
      {/* Plot zone lighter ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[bounds[0] + 30, bounds[1] + 30]} />
        <meshStandardMaterial color="#6b9e7a" roughness={0.85} />
      </mesh>
    </>
  );
}

// ─── Road Network ─────────────────────────────────────────────────────────────

function Roads({ cols, rows, spacingX, spacingZ }: {
  cols: number; rows: number; spacingX: number; spacingZ: number;
}) {
  const roadW = 3;
  const totalW = cols * spacingX;
  const totalD = rows * spacingZ;
  const offsetX = -((cols - 1) * spacingX) / 2;
  const offsetZ = -((rows - 1) * spacingZ) / 2;

  return (
    <group>
      {/* Horizontal roads */}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <mesh
          key={`h-${i}`}
          position={[0, 0.005, offsetZ - spacingZ / 2 + i * spacingZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[totalW + roadW * 2, roadW]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      ))}
      {/* Vertical roads */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <mesh
          key={`v-${i}`}
          position={[offsetX - spacingX / 2 + i * spacingX, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[roadW, totalD + roadW * 2]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Street Lights ────────────────────────────────────────────────────────────

function StreetLight({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={isNight ? "#fde68a" : "#9ca3af"}
          emissive={isNight ? new THREE.Color("#fde68a") : new THREE.Color("#000000")}
          emissiveIntensity={isNight ? 3 : 0}
        />
      </mesh>
      {isNight && (
        <pointLight
          position={[0, 5, 0]}
          intensity={0.8}
          distance={20}
          decay={2}
          color="#fde68a"
        />
      )}
    </group>
  );
}

// ─── Amenity Object ───────────────────────────────────────────────────────────

function AmenityObject({ type, position }: { type: string; position: [number, number, number] }) {
  const color = useMemo(() => {
    const map: Record<string, string> = {
      CLUBHOUSE: "#1d4ed8",
      TEMPLE: "#d97706",
      PARK: "#15803d",
      WATER_TANK: "#0ea5e9",
      ENTRANCE: "#7c3aed",
      PARKING: "#374151",
    };
    return map[type] ?? "#6b7280";
  }, [type]);

  const height = type === "CLUBHOUSE" ? 6 : type === "TEMPLE" ? 5 : 2.5;

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[8, height, 8]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
      </mesh>
      {/* Roof */}
      {type === "TEMPLE" && (
        <mesh position={[0, height + 1.5, 0]}>
          <coneGeometry args={[5, 3, 4]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
      )}
      {type === "CLUBHOUSE" && (
        <mesh position={[0, height + 0.5, 0]}>
          <boxGeometry args={[8.4, 1, 8.4]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ─── Camera Auto-orbit ────────────────────────────────────────────────────────

function AutoOrbit({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (!enabled) return;
    const angle = Date.now() * 0.0001;
    const radius = 120;
    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
    camera.position.y = 80;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Main Scene ───────────────────────────────────────────────────────────────

function Scene() {
  const { filteredPlots, plots, dayMode, project } = useGISStore();
  const filteredIds = useMemo(() => new Set(filteredPlots.map((p) => p.id)), [filteredPlots]);

  const dayConfig = DAY_CONFIGS[dayMode];
  const isNight = dayMode === "night";
  const cols = 15, rows = 10, spacingX = 15, spacingZ = 15;
  const bounds: [number, number] = [cols * spacingX, rows * spacingZ];

  // Street light positions (along main road perimeter)
  const streetLights = useMemo<[number, number, number][]>(() => {
    const lights: [number, number, number][] = [];
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;
    for (let i = 0; i <= cols; i += 3) {
      lights.push([startX + i * spacingX, 0, startZ - spacingZ]);
      lights.push([startX + i * spacingX, 0, startZ + rows * spacingZ]);
    }
    for (let j = 0; j <= rows; j += 3) {
      lights.push([startX - spacingX, 0, startZ + j * spacingZ]);
      lights.push([startX + cols * spacingX, 0, startZ + j * spacingZ]);
    }
    return lights;
  }, []);

  return (
    <>
      {/* Fog */}
      <fog attach="fog" args={[dayConfig.fogColor, dayConfig.fogNear, dayConfig.fogFar]} />

      {/* Sky / Stars */}
      {!isNight ? (
        <Sky
          sunPosition={dayConfig.sunPosition}
          rayleigh={dayMode === "sunset" ? 3 : 0.5}
          turbidity={dayMode === "sunset" ? 10 : 2}
        />
      ) : (
        <>
          <color attach="background" args={["#0c0e1a"]} />
          <Stars radius={200} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />
        </>
      )}

      {/* Ambient */}
      <ambientLight intensity={dayConfig.ambientIntensity} />

      {/* Sun / directional light */}
      <directionalLight
        position={dayConfig.sunPosition}
        intensity={isNight ? 0 : 1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        color={dayMode === "sunset" ? "#fbbf24" : "#ffffff"}
      />

      {/* Ground */}
      <Ground bounds={bounds} />

      {/* Roads */}
      <Roads cols={cols} rows={rows} spacingX={spacingX} spacingZ={spacingZ} />

      {/* Street Lights */}
      {streetLights.map((pos, i) => (
        <StreetLight key={`sl-${i}`} position={pos} isNight={isNight} />
      ))}

      {/* Amenities */}
      {project?.amenities.map((a) => (
        <AmenityObject
          key={a.id}
          type={a.type}
          position={(a.position3D as [number, number, number]) ?? [0, 0, 0]}
        />
      ))}

      {/* Contact shadows on ground */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={bounds[0]}
        blur={2}
        far={10}
        color="#000000"
      />

      {/* All Plots */}
      {plots.map((plot) => (
        <PlotMesh
          key={plot.id}
          plot={plot}
          isFiltered={!filteredIds.has(plot.id)}
        />
      ))}
    </>
  );
}

// ─── Exported Component ───────────────────────────────────────────────────────

interface TownshipSceneProps {
  autoOrbit?: boolean;
  onCanvasClick?: () => void;
}

export function TownshipScene({ autoOrbit = false, onCanvasClick }: TownshipSceneProps) {
  return (
    <div className="w-full h-full" onClick={onCanvasClick}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 120, 100], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "#0c0e1a" }}
      >
        <Suspense fallback={null}>
          <Scene />
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={15}
            maxDistance={400}
            maxPolarAngle={Math.PI / 2.1}
            enablePan
            panSpeed={0.8}
            zoomSpeed={1.2}
            rotateSpeed={0.6}
          />
          <AutoOrbit enabled={autoOrbit} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
