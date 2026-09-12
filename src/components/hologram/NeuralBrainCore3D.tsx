import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import * as THREE from 'three';
import { computeCameraFit, type HoloNode3D, type HoloLink3D } from '../../lib/hologramGraph';
import SigmaSunCore, { SUN_RADIUS } from './SigmaSunCore';
import Starfield from './Starfield';
import PlanetSystem from './PlanetSystem';
import UltronJarvisNeuralCore, { ConsciousnessMode } from './UltronJarvisNeuralCore';
import { systemRadius, type PlanetAssignment } from '../../lib/hologramPlanets';
import type { HoloCameraPreset } from './HoloTelemetryHUD';
import { isWebGLAvailable } from '../../lib/webglDetection';
import WebGLErrorBoundary from './WebGLErrorBoundary';
import NeuralBrainFallback2D from './NeuralBrainFallback2D';

export type { HoloNode3D, HoloLink3D };

interface NeuralBrainCore3DProps {
  nodes: HoloNode3D[];
  links: HoloLink3D[];
  selectedId: string | null;
  onSelectNode: (node: HoloNode3D | null) => void;
  resetSignal: number;
  zoomInSignal: number;
  zoomOutSignal: number;
  cameraPreset: HoloCameraPreset;
  onHoverNode?: (node: HoloNode3D | null) => void;
  healthColors?: Record<string, string>;
  coreActivity?: number;
  onCameraChange?: (readout: { azimuth: number; elevation: number; distance: number }) => void;
  planets: PlanetAssignment[];
  orbitMotion: boolean;
  consciousnessMode?: ConsciousnessMode;
  onModeChange?: (mode: ConsciousnessMode) => void;
}

function createGlowPointTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 120, 255, 0.9)');
  gradient.addColorStop(0.55, 'rgba(224, 64, 251, 0.5)');
  gradient.addColorStop(0.8, 'rgba(124, 58, 237, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 1. CELESTIAL ULTRON PARTICLE ORB CORE (VOLUMETRIC POINTS & EMBER HAZE)
function CelestialUltronOrbCore({ isInspecting }: { isInspecting: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const tendrilPointsRef = useRef<THREE.Points>(null);
  const coreGlowRef = useRef<THREE.Mesh>(null);
  const outerAuraRef = useRef<THREE.Mesh>(null);
  const glowTexture = useMemo(() => createGlowPointTexture(), []);

  const { positions, colors, sizes } = useMemo(() => {
    const particleCount = 4800;
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    const cMagenta = new THREE.Color('#FF481B');
    const cFuchsia = new THREE.Color('#FF7A3C');
    const cViolet = new THREE.Color('#E03A10');
    const cCyan = new THREE.Color('#FFB088');
    const cWhite = new THREE.Color('#FFF7ED');
    const cOrange = new THREE.Color('#FF481B');
    const cSignalBlue = new THREE.Color('#FFD6C2');

    let idx = 0;

    // Organic Amorphous Orb Body
    const orbCount = 3400;
    for (let i = 0; i < orbCount; i++) {
      const u = Math.random() * Math.PI;
      const v = Math.random() * Math.PI * 2;

      const baseR = 2.1 + Math.sin(u * 5) * 0.35 + Math.cos(v * 4) * 0.4;
      const noise = (Math.random() - 0.5) * 0.35;
      const r = (baseR + noise) * 0.85;

      const px = r * Math.sin(u) * Math.cos(v);
      const py = r * Math.cos(u) * 0.95;
      const pz = r * Math.sin(u) * Math.sin(v) * 1.15;

      pos[idx * 3] = px;
      pos[idx * 3 + 1] = py;
      pos[idx * 3 + 2] = pz;

      const distFromCenter = Math.sqrt(px * px + py * py + pz * pz) / 2.5;
      const chosenColor = new THREE.Color();

      if (distFromCenter < 0.35 && Math.random() > 0.4) {
        chosenColor.copy(cWhite);
      } else if (distFromCenter < 0.65) {
        chosenColor.lerpColors(cFuchsia, cMagenta, Math.random());
      } else if (Math.random() > 0.85) {
        chosenColor.copy(cCyan);
      } else if (Math.random() > 0.7) {
        chosenColor.copy(cOrange);
      } else {
        chosenColor.lerpColors(cMagenta, cViolet, Math.random());
      }

      col[idx * 3] = chosenColor.r;
      col[idx * 3 + 1] = chosenColor.g;
      col[idx * 3 + 2] = chosenColor.b;

      sz[idx] = 0.09 + Math.random() * 0.14;
      idx++;
    }

    // Inner Stellar Core
    const hotCoreCount = 800;
    for (let i = 0; i < hotCoreCount; i++) {
      const radius = Math.random() * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[idx * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[idx * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.9;
      pos[idx * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = Math.random() > 0.4 ? cWhite : cFuchsia;
      col[idx * 3] = chosenColor.r;
      col[idx * 3 + 1] = chosenColor.g;
      col[idx * 3 + 2] = chosenColor.b;

      sz[idx] = 0.14 + Math.random() * 0.18;
      idx++;
    }

    // Ethereal Corona & Micro-Grid Halo
    const haloCount = 600;
    for (let i = 0; i < haloCount; i++) {
      const radius = 2.4 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[idx * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[idx * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
      pos[idx * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = Math.random() > 0.5 ? cSignalBlue : cViolet;
      col[idx * 3] = chosenColor.r;
      col[idx * 3 + 1] = chosenColor.g;
      col[idx * 3 + 2] = chosenColor.b;

      sz[idx] = 0.05 + Math.random() * 0.08;
      idx++;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, []);

  // Plasma tendrils
  const { tendrilPositions, tendrilColors, tendrilSizes } = useMemo(() => {
    const tendrilCount = 1400;
    const pos = new Float32Array(tendrilCount * 3);
    const col = new Float32Array(tendrilCount * 3);
    const sz = new Float32Array(tendrilCount);

    const cMagenta = new THREE.Color('#E040FB');
    const cFuchsia = new THREE.Color('#FF2A85');
    const cCyan = new THREE.Color('#00E5FF');

    for (let i = 0; i < tendrilCount; i++) {
      const armIndex = i % 6;
      const baseAngle = (armIndex / 6) * Math.PI * 2;
      const t = (i / tendrilCount);
      const dist = 1.6 + t * 2.8;

      const angle = baseAngle + Math.sin(t * 8) * 0.6;
      const px = Math.cos(angle) * dist + (Math.random() - 0.5) * 0.4;
      const py = Math.sin(t * 12) * 0.8 + (Math.random() - 0.5) * 0.3;
      const pz = Math.sin(angle) * dist + (Math.random() - 0.5) * 0.4;

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      const chosenColor = i % 3 === 0 ? cCyan : i % 2 === 0 ? cMagenta : cFuchsia;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      sz[i] = 0.07 + Math.random() * 0.11;
    }

    return { tendrilPositions: pos, tendrilColors: col, tendrilSizes: sz };
  }, []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.09;
      pointsRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
      const pulse = 1.0 + Math.sin(time * 2.4) * 0.04;
      pointsRef.current.scale.set(pulse, pulse, pulse);
    }
    if (tendrilPointsRef.current) {
      tendrilPointsRef.current.rotation.y = -time * 0.06;
      const tendrilScale = 1.0 + Math.cos(time * 3.0) * 0.06;
      tendrilPointsRef.current.scale.set(tendrilScale, tendrilScale, tendrilScale);
    }
    if (coreGlowRef.current) {
      const glowScale = 1.5 + Math.sin(time * 3.2) * 0.25;
      coreGlowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
    if (outerAuraRef.current) {
      outerAuraRef.current.rotation.z = time * 0.04;
    }
  });

  return (
    <group position={[0, 0, 0]} scale={1.7}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          vertexColors
          transparent
          opacity={0.3}
          map={glowTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={tendrilPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[tendrilPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[tendrilColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[tendrilSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.5}
          map={glowTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <mesh ref={coreGlowRef}>
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshBasicMaterial
          color="#FF2A85"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// 2. CONCENTRIC CYBERNETIC GAUGE RINGS
function CyberneticGaugeRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const ring4Ref = useRef<THREE.Group>(null);
  const triadNodesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.14;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.09;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.05;
    if (ring4Ref.current) ring4Ref.current.rotation.z -= delta * 0.03;
    if (triadNodesRef.current) triadNodesRef.current.rotation.z += delta * 0.08;
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      {/* Inner Concentric Ring (R = 3.6) */}
      <group ref={ring1Ref}>
        <mesh>
          <ringGeometry args={[3.56, 3.64, 128]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={`inner-tick-${deg}`} position={[Math.cos(rad) * 3.6, Math.sin(rad) * 3.6, 0]}>
              <boxGeometry args={[0.22, 0.035, 0.02]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* 3 Linked Circular Nodes on left flank */}
      <group position={[-3.6, 0, 0]} ref={triadNodesRef}>
        {[-0.55, 0, 0.55].map((offset, idx) => (
          <mesh key={`triad-ring-${idx}`} position={[offset, 0, 0]}>
            <ringGeometry args={[0.22, 0.26, 32]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Second Orbital Ring (R = 5.8) */}
      <group ref={ring2Ref}>
        <mesh>
          <ringGeometry args={[5.76, 5.84, 128]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[5.55, 6.05, 96]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.03} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Third Ring for 12 Growth OS Modules (R = 8.6) */}
      <group ref={ring3Ref}>
        <mesh>
          <ringGeometry args={[8.55, 8.64, 128]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const rad = (i / 12) * Math.PI * 2;
          return (
            <group key={`mod-tick-${i}`} position={[Math.cos(rad) * 8.6, Math.sin(rad) * 8.6, 0]}>
              <mesh>
                <boxGeometry args={[0.35, 0.04, 0.02]} />
                <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Outer Telemetry Ring (R = 11.4) */}
      <group ref={ring4Ref}>
        <mesh>
          <ringGeometry args={[11.35, 11.42, 128]} />
          <meshBasicMaterial color="#1D4ED8" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// 4. CAMERA RIG (ORBITCONTROLS + GSAP LERP)
function HoloCameraRig({
  sceneRadius,
  onCameraChange,
  resetSignal,
  zoomInSignal,
  zoomOutSignal,
  cameraPreset,
  selectedNode,
}: {
  resetSignal: number;
  zoomInSignal: number;
  zoomOutSignal: number;
  cameraPreset: HoloCameraPreset;
  selectedNode: HoloNode3D | null;
  sceneRadius: number;
  onCameraChange?: (readout: { azimuth: number; elevation: number; distance: number }) => void;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const fit = useMemo(
    () =>
      computeCameraFit(
        (camera as THREE.PerspectiveCamera).fov ?? 45,
        size.width,
        size.height,
        sceneRadius,
        sceneRadius * 0.42
      ),
    [camera, size.width, size.height, sceneRadius]
  );

  useEffect(() => {
    camera.position.set(0, fit.y * 1.4, fit.dist * 1.55);
    gsap.to(camera.position, {
      x: 0,
      y: fit.y,
      z: fit.dist,
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => camera.lookAt(0, 0, 0),
    });
  }, []);

  useEffect(() => {
    gsap.to(camera.position, {
      x: 0,
      y: fit.y,
      z: fit.dist,
      duration: 0.8,
      ease: 'power2.inOut',
    });
    controlsRef.current?.target.set(0, 0, 0);
  }, [fit.dist]);

  useEffect(() => {
    if (resetSignal === 0) return;
    gsap.to(camera.position, {
      x: 0,
      y: fit.y,
      z: fit.dist,
      duration: 1.2,
      ease: 'power2.inOut',
    });
    controlsRef.current?.target.set(0, 0, 0);
  }, [resetSignal]);

  useEffect(() => {
    if (zoomInSignal === 0) return;
    const dir = new THREE.Vector3().subVectors(controlsRef.current?.target || new THREE.Vector3(0, 0, 0), camera.position).normalize();
    gsap.to(camera.position, {
      x: camera.position.x + dir.x * 3.5,
      y: camera.position.y + dir.y * 3.5,
      z: camera.position.z + dir.z * 3.5,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, [zoomInSignal]);

  useEffect(() => {
    if (zoomOutSignal === 0) return;
    const dir = new THREE.Vector3().subVectors(camera.position, controlsRef.current?.target || new THREE.Vector3(0, 0, 0)).normalize();
    gsap.to(camera.position, {
      x: camera.position.x + dir.x * 3.5,
      y: camera.position.y + dir.y * 3.5,
      z: camera.position.z + dir.z * 3.5,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, [zoomOutSignal]);

  useEffect(() => {
    let targetPos = { x: 0, y: fit.y, z: fit.dist };
    const targetLook = { x: 0, y: 0, z: 0 };

    if (cameraPreset === 'core') {
      targetPos = { x: 0, y: fit.dist * 0.08, z: fit.dist * 0.42 };
    } else if (cameraPreset === 'orbit') {
      targetPos = { x: 0, y: fit.dist * 0.62, z: fit.dist * 0.72 };
    } else if (cameraPreset === 'flank') {
      targetPos = { x: fit.dist * 0.42, y: fit.dist * 0.22, z: fit.dist * 0.6 };
    } else if (cameraPreset === 'wide') {
      targetPos = { x: 0, y: fit.y * 1.25, z: fit.dist * 1.18 };
    }

    gsap.to(camera.position, {
      ...targetPos,
      duration: 1.4,
      ease: 'power2.inOut',
    });
    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        ...targetLook,
        duration: 1.4,
        ease: 'power2.inOut',
      });
    }
  }, [cameraPreset]);

  useEffect(() => {
    if (!selectedNode) return;
    const [nx, ny, nz] = selectedNode.position;
    const offsetDir = new THREE.Vector3(nx, ny, nz).normalize().multiplyScalar(5.5);
    gsap.to(camera.position, {
      x: nx + offsetDir.x + 1.5,
      y: ny + 2.5,
      z: nz + offsetDir.z + 3.5,
      duration: 1.2,
      ease: 'power2.out',
    });
    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: nx,
        y: ny,
        z: nz,
        duration: 1.2,
        ease: 'power2.out',
      });
    }
  }, [selectedNode]);

  const lastReport = useRef({ azimuth: 0, elevation: 0, distance: 0 });
  useFrame(() => {
    if (!onCameraChange) return;
    const target = controlsRef.current?.target ?? new THREE.Vector3(0, 0, 0);
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    const distance = offset.length();
    const azimuth = ((Math.atan2(offset.x, offset.z) * 180) / Math.PI + 360) % 360;
    const elevation = (Math.asin(THREE.MathUtils.clamp(offset.y / (distance || 1), -1, 1)) * 180) / Math.PI;
    const last = lastReport.current;
    if (
      Math.abs(last.azimuth - azimuth) > 0.5 ||
      Math.abs(last.elevation - elevation) > 0.5 ||
      Math.abs(last.distance - distance) > 0.15
    ) {
      lastReport.current = { azimuth, elevation, distance };
      onCameraChange({ azimuth, elevation, distance });
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={3.5}
      maxDistance={Math.max(45, fit.dist * 2.2)}
      maxPolarAngle={Math.PI * 0.88}
      target={[0, 0, 0]}
    />
  );
}

// 5. MAIN NEURAL BRAIN CORE 3D COMPONENT
export default function NeuralBrainCore3D({
  nodes,
  links,
  selectedId,
  onSelectNode,
  resetSignal,
  zoomInSignal,
  zoomOutSignal,
  cameraPreset,
  onHoverNode,
  healthColors = {},
  coreActivity = 0.4,
  onCameraChange,
  planets,
  orbitMotion,
  consciousnessMode = 'ULTRON',
  onModeChange,
}: NeuralBrainCore3DProps) {
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);
  const sceneRadius = useMemo(() => systemRadius(planets) + 1.6, [planets]);
  const [activeMode, setActiveMode] = useState<ConsciousnessMode>(consciousnessMode);

  useEffect(() => {
    if (consciousnessMode) {
      setActiveMode(consciousnessMode);
    }
  }, [consciousnessMode]);

  const handleToggleMode = (nextMode: ConsciousnessMode) => {
    setActiveMode(nextMode);
    onModeChange?.(nextMode);
  };
  
  // Guard WebGL availability immediately on mount
  const [webGLSupported, setWebGLSupported] = useState<boolean>(() => isWebGLAvailable());

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  const fallback2D = (
    <NeuralBrainFallback2D
      activeMode={activeMode}
      nodes={nodes}
      links={links}
      selectedId={selectedId}
      onSelectNode={onSelectNode}
      resetSignal={resetSignal}
      zoomInSignal={zoomInSignal}
      zoomOutSignal={zoomOutSignal}
      cameraPreset={cameraPreset}
      onHoverNode={onHoverNode}
      healthColors={healthColors}
      coreActivity={coreActivity}
      onCameraChange={onCameraChange}
      planets={planets}
      orbitMotion={orbitMotion}
    />
  );

  return (
    <div className="w-full h-full relative bg-[#050515]">
      {/* Floating Cinematic Consciousness Switcher (Jarvis vs Ultron) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 bg-[#09090B]/90 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl font-mono text-xs">
        <button
          onClick={() => handleToggleMode('JARVIS')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMode === 'JARVIS'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
          JARVIS PROTOCOL (Order)
        </button>

        <button
          onClick={() => handleToggleMode('ULTRON')}
          className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMode === 'ULTRON'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.35)]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
          ULTRON CONSCIOUSNESS (Synapse)
        </button>
      </div>

      {!webGLSupported ? (
        fallback2D
      ) : (

      <WebGLErrorBoundary
        fallback={fallback2D}
        onError={(err) => {
          console.warn('[GrowthOS] WebGL context failed, switching to 2D canvas:', err.message);
          setWebGLSupported(false);
        }}
      >
        <Canvas
          camera={{ fov: 45, position: [0, 8, 28] }}
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
          onPointerMissed={() => onSelectNode(null)}
        >
          <color attach="background" args={['#050515']} />

          <ambientLight intensity={0.35} color="#12060A" />
          <pointLight position={[0, 12, 14]} intensity={26} color="#38BDF8" distance={44} />
          <pointLight position={[0, -10, -14]} intensity={18} color="#7C3AED" distance={40} />

          {/* 0. Deep starfield backdrop */}
          <Starfield />

          {/* 1. Cinematic Ultron vs Jarvis Neural Consciousness Core & Second Brain Vault Synapse Clusters */}
          <UltronJarvisNeuralCore
            nodes={nodes}
            selectedId={selectedId}
            onSelectNode={onSelectNode}
            onHoverNode={onHoverNode}
            coreActivity={coreActivity}
            consciousnessMode={activeMode}
            onModeChange={handleToggleMode}
          />

          {/* 2. Concentric Cybernetic HUD Gauge Rings */}
          <CyberneticGaugeRings />

          {/* 3. Interactive Camera Controls Rig */}
          <HoloCameraRig
            sceneRadius={sceneRadius}
            onCameraChange={onCameraChange}
            resetSignal={resetSignal}
            zoomInSignal={zoomInSignal}
            zoomOutSignal={zoomOutSignal}
            cameraPreset={cameraPreset}
            selectedNode={selectedNode}
          />
        </Canvas>
      </WebGLErrorBoundary>
      )}
    </div>
  );
}
