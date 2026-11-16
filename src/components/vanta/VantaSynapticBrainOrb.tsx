import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Text, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import type { VantaPhase, VantaTopologyFocus, VantaTopologyNode } from '@/src/lib/vanta';

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

type Point3 = [number, number, number];

interface PositionedTopologyNode {
  node: VantaTopologyNode;
  position: Point3;
}

const NODE_KIND_COLOR: Record<VantaTopologyNode['kind'], string> = {
  core: '#FFF7ED',
  decision: '#C084FC',
  connector: '#38BDF8',
  agent: '#FF8A4C',
  document: '#FBBF24',
  task: '#34D399',
};

const MEMBRANE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudio;
  uniform float uEnergy;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying float vSignal;

  void main() {
    vec3 p = position;
    vec3 direction = normalize(p);
    float azimuth = atan(direction.y, direction.x);
    float latitude = asin(clamp(direction.z, -1.0, 1.0));
    float breath = sin(uTime * 1.35) * 0.055;
    float lobes = sin(azimuth * 6.0 + uTime * 0.28) * cos(latitude * 4.0 - uTime * 0.19);
    float neuralRipple = sin((p.x + p.y + p.z) * 5.5 - uTime * 1.8) * 0.045;
    float displacement = breath + lobes * (0.13 + uEnergy * 0.045) + neuralRipple + uAudio * 0.14;
    p += normal * displacement;
    p.x *= 1.0 + sin(latitude * 3.0 + uTime * 0.17) * 0.055;
    p.y *= 1.0 + cos(azimuth * 2.0 - uTime * 0.13) * 0.045;

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    vSignal = lobes * 0.5 + 0.5;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const MEMBRANE_FRAGMENT_SHADER = `
  uniform float uEnergy;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying float vSignal;

  void main() {
    vec3 viewDirection = normalize(-vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vViewNormal, viewDirection)), 2.25);
    float vein = smoothstep(0.64, 0.94, vSignal);
    vec3 ember = vec3(1.0, 0.105, 0.012);
    vec3 molten = vec3(1.0, 0.45, 0.12);
    vec3 hot = vec3(1.0, 0.91, 0.76);
    vec3 color = mix(ember, molten, fresnel);
    color = mix(color, hot, vein * (0.25 + uEnergy * 0.16));
    float alpha = 0.12 + fresnel * 0.68 + vein * 0.16;
    gl_FragColor = vec4(color, alpha);
  }
`;

function hashUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function topologyLayout(topology: VantaTopologyFocus): PositionedTopologyNode[] {
  const visibleNodes = topology.nodes.filter((node) => node.kind !== 'core').slice(0, 42);
  const total = Math.max(visibleNodes.length, 1);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return visibleNodes.map((node, index) => {
    const y = 1 - ((index + 0.5) / total) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index * goldenAngle;
    const radius = 3.7 + (index % 3) * 0.22;
    return {
      node,
      position: [
        Math.cos(angle) * radial * radius,
        y * radius,
        Math.sin(angle) * radial * radius,
      ],
    };
  });
}

/* ─── Procedural Volumetric Crystalline Brain Lobes ─── */
function CrystallineBrainCore({
  frame,
  audioLevel,
}: {
  frame: NeuralSequenceFrame;
  audioLevel: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const membraneRef = useRef<THREE.ShaderMaterial>(null);
  const wireRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.62, 5), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uEnergy: { value: 0 },
    }),
    [],
  );
  const wireUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uEnergy: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (!groupRef.current || !membraneRef.current || !wireRef.current) return;
    const t = state.clock.getElapsedTime();
    const energy = frame === 4 ? 1 : frame === 3 ? 0.72 : frame === 2 ? 0.48 : 0.24;
    for (const material of [membraneRef.current, wireRef.current]) {
      material.uniforms.uTime.value = t;
      material.uniforms.uAudio.value = audioLevel;
      material.uniforms.uEnergy.value = energy;
    }
    const breath = 1 + Math.sin(t * 1.35) * 0.035 + audioLevel * 0.07;
    groupRef.current.scale.setScalar(breath * (frame === 4 ? 1.12 : 1));
    groupRef.current.rotation.y = t * 0.11;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={membraneRef}
          uniforms={uniforms}
          vertexShader={MEMBRANE_VERTEX_SHADER}
          fragmentShader={MEMBRANE_FRAGMENT_SHADER}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={geometry} scale={1.018}>
        <shaderMaterial
          ref={wireRef}
          uniforms={wireUniforms}
          vertexShader={MEMBRANE_VERTEX_SHADER}
          fragmentShader={MEMBRANE_FRAGMENT_SHADER}
          wireframe
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Outer Synaptic Mantle & Electrical Fiber Web ─── */
function OuterFilamentMantle({ frame }: { frame: NeuralSequenceFrame }) {
  const groupRef = useRef<THREE.Group>(null);
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
      const u = hashUnit(i * 5 + 1);
      const v = hashUnit(i * 5 + 2);
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.1 + (hashUnit(i * 5 + 3) - 0.5) * 0.6;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorSeed = hashUnit(i * 5 + 4);
      const col = colorSeed > 0.8 ? cHot : colorSeed > 0.4 ? cAmber : cRed;
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
      const idx1 = Math.floor(hashUnit(j * 7 + 17) * count);
      const idx2 = (idx1 + Math.floor(hashUnit(j * 7 + 23) * 20) + 1) % count;
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
    if (groupRef.current) {
      const breath = 1 + Math.sin(t * 1.35) * 0.025;
      groupRef.current.scale.setScalar(breath);
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -t * 0.08;
      pointsRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = -t * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
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
      const u = hashUnit(i * 11 + 5);
      const v = hashUnit(i * 11 + 9);
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = 3.8 + hashUnit(i * 11 + 13) * 0.6;
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
            target[0] * 0.5 + (hashUnit(idx * 3 + 41) - 0.5) * 0.4,
            target[1] * 0.5 + (hashUnit(idx * 3 + 42) - 0.5) * 0.4,
            target[2] * 0.5 + (hashUnit(idx * 3 + 43) - 0.5) * 0.4,
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

function FacetedContainmentShell({ frame }: { frame: NeuralSequenceFrame }) {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(3.15, 2), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = -time * 0.045;
    groupRef.current.rotation.z = Math.sin(time * 0.11) * 0.08;
    const breath = 1 + Math.sin(time * 1.35 + 0.8) * 0.012;
    groupRef.current.scale.setScalar(breath);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#FF5B24"
          emissive="#7A1705"
          emissiveIntensity={frame === 4 ? 1.1 : 0.55}
          roughness={0.08}
          metalness={0.05}
          transmission={0.72}
          thickness={0.35}
          transparent
          opacity={frame === 4 ? 0.12 : 0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={geometry} scale={1.008}>
        <meshBasicMaterial
          color="#FF7A3D"
          wireframe
          transparent
          opacity={frame === 4 ? 0.24 : 0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function AmbientDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 720;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const ember = new THREE.Color('#FF5A24');
    const hot = new THREE.Color('#FFD2B3');

    for (let index = 0; index < count; index++) {
      const theta = hashUnit(index * 7 + 1) * Math.PI * 2;
      const phi = Math.acos(hashUnit(index * 7 + 2) * 2 - 1);
      const radius = 5.3 + hashUnit(index * 7 + 3) * 7.5;
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
      const color = hashUnit(index * 7 + 4) > 0.86 ? hot : ember;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const dust = new THREE.BufferGeometry();
    dust.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dust.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return dust;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.006;
    pointsRef.current.rotation.x = Math.sin(time * 0.04) * 0.04;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function TopologyNetwork({
  topology,
  selectedNodeId,
  onSelectNode,
}: {
  topology: VantaTopologyFocus;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const positionedNodes = useMemo(() => topologyLayout(topology), [topology]);
  const positionById = useMemo(() => {
    const positions = new Map<string, Point3>();
    for (const node of topology.nodes) {
      if (node.kind === 'core') positions.set(node.id, [0, 0, 0]);
    }
    for (const item of positionedNodes) positions.set(item.node.id, item.position);
    return positions;
  }, [positionedNodes, topology.nodes]);
  const visibleEdges = useMemo(
    () => topology.edges.flatMap((edge) => {
      const start = positionById.get(edge.from);
      const end = positionById.get(edge.to);
      if (!start || !end) return [];
      const bend = (hashUnit(edge.id.length * 17) - 0.5) * 0.9;
      const mid: Point3 = [
        (start[0] + end[0]) * 0.5 + bend,
        (start[1] + end[1]) * 0.5 + 0.18,
        (start[2] + end[2]) * 0.5 - bend,
      ];
      return [{ ...edge, start, end, mid }];
    }),
    [positionById, topology.edges],
  );

  return (
    <group>
      {visibleEdges.map((edge, index) => (
        <QuadraticBezierLine
          key={edge.id}
          start={edge.start}
          end={edge.end}
          mid={edge.mid}
          color={index % 5 === 0 ? '#FFD8C2' : '#FF612A'}
          lineWidth={selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId) ? 2.3 : 0.75}
          transparent
          opacity={selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId) ? 0.92 : 0.28}
        />
      ))}

      {positionedNodes.map(({ node, position }) => {
        const selected = node.id === selectedNodeId;
        const hovered = node.id === hoveredNodeId;
        const color = NODE_KIND_COLOR[node.kind];
        const unavailable = node.status === 'unavailable';
        const radius = node.kind === 'document' ? 0.1 : node.kind === 'agent' ? 0.14 : 0.12;
        return (
          <group key={node.id} position={position}>
            <mesh
              scale={selected ? 1.65 : hovered ? 1.3 : 1}
              onClick={(event) => {
                event.stopPropagation();
                onSelectNode?.(node.id);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredNodeId(node.id);
              }}
              onPointerOut={() => setHoveredNodeId(null)}
            >
              <sphereGeometry args={[radius, 18, 18]} />
              <meshBasicMaterial color={selected ? '#FFFFFF' : color} transparent opacity={unavailable ? 0.35 : 0.96} />
            </mesh>
            <mesh scale={selected ? 2.6 : hovered ? 2.1 : 1.65}>
              <sphereGeometry args={[radius * 1.08, 14, 14]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={selected ? 0.38 : 0.12}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {(selected || hovered) && (
              <Billboard>
                <Text
                  position={[0, radius + 0.28, 0]}
                  fontSize={0.14}
                  color={selected ? '#FFFFFF' : '#FFD8C2'}
                  outlineColor="#050101"
                  outlineWidth={0.012}
                  anchorX="center"
                  maxWidth={2.4}
                >
                  {node.label}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
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
  topology,
  showSphereLayers = true,
  className = '',
  interactive = true,
}: VantaSynapticBrainOrbProps) {
  const effectiveFrame: NeuralSequenceFrame =
    sequenceFrame ?? (phase ? PHASE_TO_SEQUENCE_FRAME[phase] : 1);
  const activeFileId = selectedFileId ?? selectedNodeId;
  const hasLiveTopology = Boolean(topology?.nodes.some((node) => node.kind !== 'core'));

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
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.35;
        }}
      >
        <color attach="background" args={['#020101']} />
        <fog attach="fog" args={['#020101', 8, 18]} />

        {/* Sparse spatial dust makes camera movement and depth legible. */}
        <AmbientDust />

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

        {/* 3b. Slow faceted containment shell from the reference silhouette. */}
        <FacetedContainmentShell frame={effectiveFrame} />

        {/* 4. Synaptic Axon Filaments (The 5 Frames Sequence) */}
        <DynamicSynapticAxons frame={effectiveFrame} targetedFile={targetedFile} />

        {/* 5. Live system graph in-app; deterministic sample files only in the isolated visual lab. */}
        {topology && hasLiveTopology ? (
          <TopologyNetwork
            topology={topology}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ) : (
          /* No topology supplied = isolated lab: decorative vault rings + sample files.
             A topology IS supplied but has no entities yet (in-app): honest empty state,
             never fabricated sample files presented as the user's vault. */
          <SphereVaultLayers
            files={topology ? [] : SAMPLE_VAULT_FILES}
            selectedFileId={topology ? null : activeFileId}
            onSelectFile={topology ? undefined : handleSelect}
            showRings={showSphereLayers}
          />
        )}

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
