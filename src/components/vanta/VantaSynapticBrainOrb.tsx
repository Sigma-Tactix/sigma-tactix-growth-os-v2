import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Billboard, Text, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import type { VantaPhase, VantaTopologyFocus } from '@/src/lib/vanta';

export type NeuralSequenceFrame = 1 | 2 | 3 | 4 | 5;

export interface VaultFileNode {
  id: string;
  name: string;
  vault: string;
  vaultColor: string;
  size: string;
  position: [number, number, number];
  summary: string;
}

export const PHASE_TO_SEQUENCE_FRAME: Record<VantaPhase, NeuralSequenceFrame> = {
  offline: 1,
  idle: 1,
  listening: 1,
  transcribing: 2,
  thinking: 4,
  speaking: 4,
  inspecting: 2,
  proposing: 3,
  awaiting_confirmation: 3,
  success: 5,
  warning: 3,
  error: 5,
};

export interface VantaSynapticBrainOrbProps {
  sequenceFrame?: NeuralSequenceFrame;
  phase?: VantaPhase;
  audioLevel?: number;
  selectedFileId?: string | null;
  selectedNodeId?: string | null;
  onSelectFile?: (file: VaultFileNode | null) => void;
  onSelectNode?: (id: string) => void;
  topology?: VantaTopologyFocus;
  showSphereLayers?: boolean;
  className?: string;
  interactive?: boolean;
}

/* ─── Vault Data organized in Sphere Layers ─── */
export const VAULT_SECTORS = [
  { id: 'strategy', label: 'Strategic Foundations', color: '#FF481B', icon: '✦' },
  { id: 'analytics', label: 'Growth Analytics & Economics', color: '#38BDF8', icon: '◈' },
  { id: 'creative', label: 'Campaign & Creative Engine', color: '#F59E0B', icon: '⚡' },
  { id: 'agents', label: 'Autonomous Agent Swarm', color: '#A855F7', icon: '⚙' },
  { id: 'intelligence', label: 'Lead Intelligence & Pipelines', color: '#35C9A5', icon: '◎' },
  { id: 'governance', label: 'HITL Governance & Policies', color: '#EC4899', icon: '🛡' },
];

export const SAMPLE_VAULT_FILES: VaultFileNode[] = [
  // Sector 1: Strategy (r = 4.2, upper sector)
  {
    id: 'f-brand-dna',
    name: 'brand_positioning_matrix_2026.md',
    vault: 'Strategic Foundations',
    vaultColor: '#FF481B',
    size: '14.2 KB',
    position: [1.8, 3.4, 1.2],
    summary: 'Core enterprise value props, TAM wedge, ICP pain points, and category differentiation.',
  },
  {
    id: 'f-icp-tiers',
    name: 'enterprise_icp_segmentation.json',
    vault: 'Strategic Foundations',
    vaultColor: '#FF481B',
    size: '8.7 KB',
    position: [2.8, 2.7, 0.8],
    summary: 'Firmographic criteria: $10M-$100M ARR B2B SaaS, sales cycle telemetry, and budget gates.',
  },

  // Sector 2: Analytics (r = 4.2, right equator)
  {
    id: 'f-saas-econ',
    name: 'saas_unit_economics_audit.csv',
    vault: 'Growth Analytics & Economics',
    vaultColor: '#38BDF8',
    size: '34.5 KB',
    position: [3.8, 0.6, 1.5],
    summary: 'Blended CAC, Payback periods, Net Revenue Retention (124%), and cohort churn velocity.',
  },
  {
    id: 'f-attribution',
    name: 'multi_touch_attribution_model.sql',
    vault: 'Growth Analytics & Economics',
    vaultColor: '#38BDF8',
    size: '19.1 KB',
    position: [3.4, -1.8, 1.6],
    summary: 'Shapley-value cross-channel attribution across paid search, LinkedIn, and direct inbound.',
  },

  // Sector 3: Creative (r = 4.2, lower right)
  {
    id: 'f-ad-hooks',
    name: 'q4_meta_paid_hook_variants.json',
    vault: 'Campaign & Creative Engine',
    vaultColor: '#F59E0B',
    size: '22.0 KB',
    position: [1.2, -3.4, 2.0],
    summary: '42 tested angle hooks: Founder-problem vs. Architecture breakdown with ROAS telemetry.',
  },
  {
    id: 'f-social-carousels',
    name: 'thought_leadership_carousels.pdf',
    vault: 'Campaign & Creative Engine',
    vaultColor: '#F59E0B',
    size: '4.8 MB',
    position: [-0.5, -3.8, 1.4],
    summary: '10-slide visual teardowns of modern AI agent architectures and enterprise guardrails.',
  },

  // Sector 4: Agents (r = 4.2, lower left)
  {
    id: 'f-agent-personas',
    name: 'autonomous_agent_personas.json',
    vault: 'Autonomous Agent Swarm',
    vaultColor: '#A855F7',
    size: '45.1 KB',
    position: [-2.9, -2.6, 1.2],
    summary: 'Registry of 182 specialized agent system prompts, capabilities, and token allocations.',
  },
  {
    id: 'f-dispatch-router',
    name: 'swarm_dispatch_orchestration.ts',
    vault: 'Autonomous Agent Swarm',
    vaultColor: '#A855F7',
    size: '28.3 KB',
    position: [-3.8, -0.8, -1.1],
    summary: 'Dynamic task router selecting between fast heuristic triage and deep reasoning chains.',
  },

  // Sector 5: Intelligence (r = 4.2, upper left)
  {
    id: 'f-scraped-signals',
    name: 'competitor_hiring_and_funding_signals.parquet',
    vault: 'Lead Intelligence & Pipelines',
    vaultColor: '#35C9A5',
    size: '112.4 KB',
    position: [-3.0, 2.2, 1.6],
    summary: 'Live job posting triggers, tech stack changes, and executive transitions across target accounts.',
  },
  {
    id: 'f-pipeline-sync',
    name: 'hubspot_salesforce_enrichment.json',
    vault: 'Lead Intelligence & Pipelines',
    vaultColor: '#35C9A5',
    size: '16.8 KB',
    position: [-1.4, 3.6, -1.2],
    summary: 'Bidirectional sync logs, field mapping validations, and deduping heuristics.',
  },

  // Sector 6: Governance (r = 4.2, back upper)
  {
    id: 'f-hitl-policies',
    name: 'hitl_approval_guardrails.yaml',
    vault: 'HITL Governance & Policies',
    vaultColor: '#EC4899',
    size: '11.5 KB',
    position: [0.2, 3.7, -2.0],
    summary: 'Hard dollar spend ceilings, mandatory human signs for outbound campaigns, and PII filters.',
  },
];

/* ─── Procedural Volumetric Crystalline Brain Lobes ─── */
function CrystallineBrainCore({
  frame,
  audioLevel,
}: {
  frame: NeuralSequenceFrame;
  audioLevel: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);

  // Deformed crystalline icosahedron with brain-like organic lobes
  const { geometry, wireGeometry } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 3);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      // Dual hemispheric cleft & organic folds
      const hemisphere = Math.abs(vertex.x) * 0.15;
      const noise =
        Math.sin(vertex.x * 3.5) * Math.cos(vertex.y * 3.0) * Math.sin(vertex.z * 3.2) * 0.28;
      const lobeIndent = Math.sin(vertex.y * 2.0) * 0.15;
      const scale = 1.0 + noise + hemisphere - lobeIndent;
      vertex.multiplyScalar(scale);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();

    const wireGeo = new THREE.WireframeGeometry(geo);
    return { geometry: geo, wireGeometry: wireGeo };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !wireRef.current) return;
    const t = state.clock.getElapsedTime();

    // Breathing pulse + audio reactivity
    const pulseFactor = 1.0 + Math.sin(t * 2.2) * 0.04 + audioLevel * 0.12;
    const frameScale = frame === 4 ? 1.15 : frame === 3 ? 1.05 : 1.0;
    const s = pulseFactor * frameScale;

    meshRef.current.scale.set(s, s, s);
    wireRef.current.scale.set(s, s, s);

    // Slow organic tumble
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    wireRef.current.rotation.y = t * 0.15;
    wireRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <group>
      {/* Translucent faceted molten core */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#FF3800"
          emissive="#FF5510"
          emissiveIntensity={frame === 4 ? 1.8 : frame === 3 ? 1.2 : 0.8 + audioLevel * 0.8}
          roughness={0.2}
          transmission={0.7}
          thickness={1.2}
          transparent
          opacity={0.88}
          wireframe={false}
        />
      </mesh>

      {/* Intricate glowing crystalline edge facets */}
      <lineSegments ref={wireRef} geometry={wireGeometry}>
        <lineBasicMaterial
          color={frame === 4 ? '#FFE8D6' : '#FFA066'}
          transparent
          opacity={frame === 4 ? 0.95 : 0.65}
          linewidth={1.5}
        />
      </lineSegments>
    </group>
  );
}

/* ─── Outer Synaptic Mantle & Electrical Fiber Web ─── */
function OuterFilamentMantle({ frame }: { frame: NeuralSequenceFrame }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { particles, lineGeometry } = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cRed = new THREE.Color('#FF481B');
    const cAmber = new THREE.Color('#FF8C38');
    const cHot = new THREE.Color('#FFF5EE');

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.1 + (Math.random() - 0.5) * 0.6;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const col = Math.random() > 0.8 ? cHot : Math.random() > 0.4 ? cAmber : cRed;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Outer fiber curves
    const linePositions: number[] = [];
    for (let j = 0; j < 120; j++) {
      const idx1 = Math.floor(Math.random() * count);
      const idx2 = (idx1 + Math.floor(Math.random() * 20) + 1) % count;
      linePositions.push(
        positions[idx1 * 3],
        positions[idx1 * 3 + 1],
        positions[idx1 * 3 + 2],
        positions[idx2 * 3],
        positions[idx2 * 3 + 1],
        positions[idx2 * 3 + 2]
      );
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    return { particles: geo, lineGeometry: lGeo };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -t * 0.08;
      pointsRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = -t * 0.12;
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={particles}>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={frame === 4 ? 0.9 : 0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#FF7A34"
          transparent
          opacity={frame === 4 ? 0.7 : 0.35}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

/* ─── Dynamic Synaptic Axon Filaments (The 5 Frames) ─── */
function DynamicSynapticAxons({
  frame,
  targetedFile,
}: {
  frame: NeuralSequenceFrame;
  targetedFile: VaultFileNode | null;
}) {
  const origin: [number, number, number] = [0, 0, 0];

  // Pre-calculated axon clusters for Frame 2 (upward cluster), Frame 4 (omnidirectional)
  const frame2Targets = useMemo(
    (): [number, number, number][] => [
      [0.8, 3.2, 0.4],
      [1.4, 2.9, 0.9],
      [0.4, 3.4, 1.1],
      [1.7, 2.4, 0.5],
      [0.2, 3.6, -0.3],
      [1.0, 3.1, -0.6],
    ],
    []
  );

  const frame4Targets = useMemo((): [number, number, number][] => {
    const targets: [number, number, number][] = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = 3.8 + Math.random() * 0.6;
      targets.push([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)]);
    }
    return targets;
  }, []);

  const frame5Targets = useMemo(
    (): [number, number, number][] => [
      [0.3, 1.8, 0.3],
      [-0.4, 1.7, -0.2],
    ],
    []
  );

  return (
    <group>
      {/* FRAME 2: Directed Upward Cluster */}
      {frame === 2 &&
        frame2Targets.map((target, idx) => {
          const mid: [number, number, number] = [
            target[0] * 0.5 + (Math.sin(idx) * 0.2),
            target[1] * 0.5 + 0.3,
            target[2] * 0.5 + (Math.cos(idx) * 0.2),
          ];
          return (
            <group key={`f2-${idx}`}>
              <QuadraticBezierLine
                start={origin}
                end={target}
                mid={mid}
                color="#FFC299"
                lineWidth={2.2}
                transparent
                opacity={0.9}
              />
              {/* Terminal Synaptic Bulb */}
              <mesh position={target}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color="#FFF5EE" />
              </mesh>
            </group>
          );
        })}

      {/* FRAME 3: Focused Singularity Beam (to selected file or default upper target) */}
      {frame === 3 && (() => {
        const target = targetedFile ? targetedFile.position : ([0.5, 3.4, 0.4] as [number, number, number]);
        const mid: [number, number, number] = [target[0] * 0.5, target[1] * 0.5 + 0.4, target[2] * 0.5];
        return (
          <group>
            {/* High-intensity primary beam */}
            <QuadraticBezierLine
              start={origin}
              end={target}
              mid={mid}
              color="#FFFFFF"
              lineWidth={3.5}
            />
            {/* Outer chromatic glow filament */}
            <QuadraticBezierLine
              start={origin}
              end={target}
              mid={mid}
              color="#FF5510"
              lineWidth={6.0}
              transparent
              opacity={0.65}
            />
            {/* Terminal Synaptic Node */}
            <mesh position={target}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
        );
      })()}

      {/* FRAME 4: Full Omnidirectional Synaptic Burst */}
      {frame === 4 &&
        frame4Targets.map((target, idx) => {
          const mid: [number, number, number] = [
            target[0] * 0.5 + (Math.random() - 0.5) * 0.4,
            target[1] * 0.5 + (Math.random() - 0.5) * 0.4,
            target[2] * 0.5 + (Math.random() - 0.5) * 0.4,
          ];
          return (
            <group key={`f4-${idx}`}>
              <QuadraticBezierLine
                start={origin}
                end={target}
                mid={mid}
                color={idx % 3 === 0 ? '#FFFFFF' : '#FF9955'}
                lineWidth={1.8}
                transparent
                opacity={0.85}
              />
              <mesh position={target}>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshBasicMaterial color="#FFE6CC" />
              </mesh>
            </group>
          );
        })}

      {/* FRAME 5: Retracting Synaptic Stems */}
      {frame === 5 &&
        frame5Targets.map((target, idx) => {
          const mid: [number, number, number] = [target[0] * 0.5, target[1] * 0.5, target[2] * 0.5];
          return (
            <group key={`f5-${idx}`}>
              <QuadraticBezierLine
                start={origin}
                end={target}
                mid={mid}
                color="#FF6B26"
                lineWidth={2.0}
                transparent
                opacity={0.6}
              />
              <mesh position={target}>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshBasicMaterial color="#FFB885" />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}

/* ─── White-Hot Singularity Nucleus ─── */
function WhiteHotSingularity({ audioLevel, frame }: { audioLevel: number; frame: NeuralSequenceFrame }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!meshRef.current || !auraRef.current) return;
    const pulse = 1.0 + Math.sin(t * 6.0) * 0.12 + audioLevel * 0.35;
    const baseScale = frame === 4 ? 0.45 : frame === 3 ? 0.38 : 0.32;
    meshRef.current.scale.setScalar(baseScale * pulse);
    auraRef.current.scale.setScalar(baseScale * 2.2 * pulse);
  });

  return (
    <group>
      {/* Central Singularity Point Light */}
      <pointLight color="#FFF3E0" intensity={frame === 4 ? 5.0 : 3.2} distance={8} />

      {/* Pure White Focal Singularity */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Warm Molten Emission Aura */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#FF5500" transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ─── Second Brain Sphere Layers (Vault Rings & Files) ─── */
function SphereVaultLayers({
  files,
  selectedFileId,
  onSelectFile,
  showRings = true,
}: {
  files: VaultFileNode[];
  selectedFileId?: string | null;
  onSelectFile?: (file: VaultFileNode | null) => void;
  showRings?: boolean;
}) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <group>
      {/* Equatorial & Meridian Vault Sector Guide Halos */}
      {showRings && (
        <group ref={ringsRef}>
          {/* Main Equator */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[4.2, 0.012, 16, 100]} />
            <meshBasicMaterial color="#FF481B" transparent opacity={0.25} />
          </mesh>
          {/* Inclined Orbit 1 */}
          <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
            <torusGeometry args={[4.2, 0.008, 16, 100]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.2} />
          </mesh>
          {/* Inclined Orbit 2 */}
          <mesh rotation={[-Math.PI / 4, -Math.PI / 5, 0]}>
            <torusGeometry args={[4.2, 0.008, 16, 100]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.2} />
          </mesh>
        </group>
      )}

      {/* Interactive Vault File Nodes */}
      {files.map((file) => {
        const isSelected = selectedFileId === file.id;
        return (
          <group key={file.id} position={file.position}>
            {/* Interactive Node Sphere */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectFile?.(isSelected ? null : file);
              }}
              scale={isSelected ? [1.6, 1.6, 1.6] : [1, 1, 1]}
            >
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#FFFFFF' : file.vaultColor}
                transparent
                opacity={0.95}
              />
            </mesh>

            {/* Glowing Halo for Node */}
            <mesh scale={isSelected ? [2.4, 2.4, 2.4] : [1.7, 1.7, 1.7]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshBasicMaterial
                color={file.vaultColor}
                transparent
                opacity={isSelected ? 0.5 : 0.22}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Billboard File Label */}
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
              <Text
                position={[0, 0.32, 0]}
                fontSize={0.16}
                color={isSelected ? '#FFF' : '#CCC'}
                anchorX="center"
                anchorY="middle"
                maxWidth={2.8}
              >
                {file.name}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

/* ─── Main Exported VantaSynapticBrainOrb Component ─── */
export default function VantaSynapticBrainOrb({
  sequenceFrame,
  phase,
  audioLevel = 0,
  selectedFileId = null,
  selectedNodeId = null,
  onSelectFile,
  onSelectNode,
  showSphereLayers = true,
  className = '',
  interactive = true,
}: VantaSynapticBrainOrbProps) {
  const effectiveFrame: NeuralSequenceFrame =
    sequenceFrame ?? (phase ? PHASE_TO_SEQUENCE_FRAME[phase] : 1);
  const activeFileId = selectedFileId ?? selectedNodeId;

  const targetedFile = useMemo(
    () => SAMPLE_VAULT_FILES.find((f) => f.id === activeFileId) ?? null,
    [activeFileId]
  );

  const handleSelect = (file: VaultFileNode | null) => {
    onSelectFile?.(file);
    if (file && onSelectNode) {
      onSelectNode(file.id);
    }
  };

  return (
    <div
      className={`relative w-full h-full bg-[#030101] overflow-hidden select-none ${className}`}
      role="region"
      aria-label="VANTA Synaptic Brain Orb — Intelligent Voice & Vault System"
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020101']} />

        {/* Dynamic Lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[5, 6, 4]} intensity={1.5} color="#FF7A34" />
        <pointLight position={[-5, -4, -3]} intensity={0.9} color="#FF3000" />

        {/* 1. White-Hot Singularity Nucleus */}
        <WhiteHotSingularity audioLevel={audioLevel} frame={effectiveFrame} />

        {/* 2. Crystalline Faceted Brain Lobes */}
        <CrystallineBrainCore frame={effectiveFrame} audioLevel={audioLevel} />

        {/* 3. Outer Synaptic Mantle & Electrical Filaments */}
        <OuterFilamentMantle frame={effectiveFrame} />

        {/* 4. Synaptic Axon Filaments (The 5 Frames Sequence) */}
        <DynamicSynapticAxons frame={effectiveFrame} targetedFile={targetedFile} />

        {/* 5. Second Brain Sphere Layers (Vault Sectors & Files) */}
        <SphereVaultLayers
          files={SAMPLE_VAULT_FILES}
          selectedFileId={activeFileId}
          onSelectFile={handleSelect}
          showRings={showSphereLayers}
        />

        {/* Interactive 3D Camera Controls */}
        {interactive && (
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={4.2}
            maxDistance={12}
            rotateSpeed={0.8}
            autoRotate={effectiveFrame === 1 && !activeFileId}
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>

      {/* Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,1,1,0.85)_100%)]" />
    </div>
  );
}
