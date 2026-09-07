"use client";
/**
 * components/gis/PlotMesh.tsx
 * Individual plot 3D mesh — the fundamental building block of the digital twin.
 * Features: status-colored material, hover glow, animated elevation, corner highlight,
 * facing indicator, soft shadow, animated borders.
 */

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Plot } from "@/lib/types/gis";
import { PLOT_STATUS_COLORS, PLOT_FACING_COLORS } from "@/lib/types/gis";
import { useGISStore, getPlotColor } from "@/lib/stores/gisStore";
import { formatINR } from "@/lib/engines/PlotEngine";

interface PlotMeshProps {
  plot: Plot;
  isFiltered?: boolean; // dimmed when not matching current filter
}

const PLOT_HEIGHT = 0.18;
const HOVER_LIFT = 0.3;
const SELECT_LIFT = 0.5;

export function PlotMesh({ plot, isFiltered = false }: PlotMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  const {
    selectedPlot,
    hoveredPlotId,
    selectPlot,
    setHoveredPlotId,
  } = useGISStore();

  const isSelected = selectedPlot?.id === plot.id;
  const isHovered = hoveredPlotId === plot.id;

  const [posX, posY, posZ] = plot.position3D ?? [0, 0, 0];
  const w = plot.width3D ?? 10;
  const d = plot.depth3D ?? 10;

  // Material color
  const baseColor = useMemo(() => {
    const c = PLOT_STATUS_COLORS[plot.status];
    return new THREE.Color(c?.hex ?? 0x888888);
  }, [plot.status]);

  const borderColor = useMemo(() => {
    if (plot.isCorner) return new THREE.Color(0x60a5fa); // blue for corner
    const c = PLOT_STATUS_COLORS[plot.status];
    return new THREE.Color(c?.border ?? "#666666");
  }, [plot.status, plot.isCorner]);

  // Facing glow color
  const facingColor = useMemo(() => {
    return new THREE.Color(PLOT_FACING_COLORS[plot.facing] ?? "#ffffff");
  }, [plot.facing]);

  // Animated elevation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = posY + (isSelected ? SELECT_LIFT : isHovered ? HOVER_LIFT : 0);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.12);

    // Pulse for selected
    if (isSelected) {
      const t = Date.now() * 0.003;
      const pulse = 1 + Math.sin(t) * 0.04;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(isFiltered ? 0.85 : 1);
    }
  });

  const handlePointerEnter = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      setHoveredPlotId(plot.id);
      setTooltip(true);
      document.body.style.cursor = "pointer";
    },
    [plot.id, setHoveredPlotId]
  );

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    setHoveredPlotId(null);
    setTooltip(false);
    document.body.style.cursor = "default";
  }, [setHoveredPlotId]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectPlot(isSelected ? null : plot);
    },
    [plot, isSelected, selectPlot]
  );

  const opacity = isFiltered ? 0.25 : 1;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Main plot mesh */}
      <mesh
        ref={meshRef}
        position={[0, PLOT_HEIGHT / 2, 0]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w - 0.2, PLOT_HEIGHT, d - 0.2]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={opacity}
          roughness={0.6}
          metalness={0.1}
          emissive={isHovered || isSelected ? baseColor : new THREE.Color(0x000000)}
          emissiveIntensity={isHovered ? 0.3 : isSelected ? 0.5 : 0}
        />
      </mesh>

      {/* Ground shadow disc */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.1, d - 0.1]} />
        <meshStandardMaterial color={baseColor} transparent opacity={opacity * 0.25} />
      </mesh>

      {/* Corner highlight border (blue) */}
      {plot.isCorner && (
        <lineSegments position={[0, PLOT_HEIGHT + 0.01, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(w, 0.02, d)]} />
          <lineBasicMaterial color={0x60a5fa} linewidth={2} />
        </lineSegments>
      )}

      {/* Facing indicator strip at leading edge */}
      <mesh
        position={[0, PLOT_HEIGHT + 0.015, -(d / 2 - 0.1)]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[w - 0.3, 0.25]} />
        <meshStandardMaterial color={facingColor} transparent opacity={0.7} emissive={facingColor} emissiveIntensity={0.4} />
      </mesh>

      {/* Plot number label */}
      {(isHovered || isSelected) && !isFiltered && (
        <Html
          position={[0, PLOT_HEIGHT + 0.8, 0]}
          center
          style={{ pointerEvents: "none" }}
          distanceFactor={80}
        >
          <div
            style={{
              background: "rgba(10,10,15,0.92)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666"}`,
              borderRadius: "10px",
              padding: "8px 14px",
              color: "#fff",
              fontSize: "13px",
              lineHeight: "1.5",
              whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#fbbf24" }}>
              Plot #{plot.plotNumber}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "11px" }}>{plot.facing} FACING · {plot.dimension.areaSqYards} SY</div>
            <div style={{ color: "#22c55e", fontWeight: 600, fontSize: "13px" }}>
              {formatINR(plot.totalPrice)}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: "4px",
                padding: "2px 8px",
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: 700,
                background: PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666",
                color: "#000",
              }}
            >
              {plot.status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
