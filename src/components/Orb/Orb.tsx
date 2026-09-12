import React, { useEffect, useRef, useState } from 'react';
import { OrbProps, ProjectedSatellite } from './orb.types';
import { createOrbEngine } from './orbEngine';
import { useScrollProgress } from './useScrollProgress';

export default function Orb({
  progress,
  density,
  colors,
  rings = 3,
  spin = 0.0016,
  interactive = true,
  enableDragRotation = true,
  enableWheelZoom = true,
  zoom = 1.0,
  still = false,
  scrollIntensity = 1,
  satellites,
  onProjectedSatellites,
  className = '',
  style,
  onReady,
}: OrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createOrbEngine> | null>(null);

  const [hoveredSat, setHoveredSat] = useState<ProjectedSatellite | null>(null);
  const projectedList = useRef<ProjectedSatellite[]>([]);
  const projectedCallback = useRef(onProjectedSatellites);
  const readyCallback = useRef(onReady);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  projectedCallback.current = onProjectedSatellites;
  readyCallback.current = onReady;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  // Self-driven scroll progress if none provided
  const internalProgress = useScrollProgress(containerRef);
  const effectiveProgress = (progress !== undefined ? progress : internalProgress) * scrollIntensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createOrbEngine(canvas, {
      progress: effectiveProgress,
      density,
      colors,
      rings,
      spin,
      interactive,
      enableDragRotation,
      enableWheelZoom,
      zoom,
      still: still || reduceMotion,
      scrollIntensity,
      satellites,
      onProjectedSatellites: (sats) => {
        projectedList.current = sats;
        projectedCallback.current?.(sats);
      },
      onReady: () => readyCallback.current?.(),
    });

    engineRef.current = engine;

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
      if (still || reduceMotion) engine.start();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, [still, reduceMotion, density, rings, spin, interactive, enableDragRotation, enableWheelZoom]);

  // Update engine properties dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setProgress(effectiveProgress);
    }
  }, [effectiveProgress]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSatellites(satellites || []);
      if (still || reduceMotion) engineRef.current.start();
    }
  }, [satellites, still, reduceMotion]);

  useEffect(() => {
    if (engineRef.current && zoom !== undefined) {
      engineRef.current.setZoom(zoom);
      if (still || reduceMotion) engineRef.current.start();
    }
  }, [zoom, still, reduceMotion]);

  // Satellite interaction on hover
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!projectedList.current.length) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: ProjectedSatellite | null = null;
    let minDist = 18; // hit target radius

    for (const sat of projectedList.current) {
      if (!sat.isFront) continue;
      const dx = mx - sat.x;
      const dy = my - sat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = sat;
      }
    }

    setHoveredSat(closest);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoveredSat(null)}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{ touchAction: interactive && enableDragRotation ? 'none' : 'pan-y', ...style }}
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating Satellite Tooltip */}
      {hoveredSat && (
        <div
          className="absolute pointer-events-none z-20 px-2.5 py-1 rounded-md bg-[#050515]/90 border border-[#FF481B]/50 text-white font-mono text-[10px] shadow-[0_0_15px_rgba(255,72,27,0.3)] backdrop-blur-md -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: hoveredSat.x,
            top: hoveredSat.y,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-[#FFB088]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF481B] animate-ping" />
            <span>{hoveredSat.definition.label}</span>
          </div>
          {hoveredSat.definition.subLabel && (
            <div className="text-[9px] text-slate-400 mt-0.5">{hoveredSat.definition.subLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
