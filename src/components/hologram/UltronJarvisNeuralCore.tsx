import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { NOISE_GLSL } from './noiseGlsl';
import SigmaSunCore from './SigmaSunCore';
import type { HoloNode3D } from '../../lib/hologramGraph';

export type ConsciousnessMode = 'JARVIS' | 'ULTRON';

interface UltronJarvisNeuralCoreProps {
  nodes?: HoloNode3D[];
  selectedId: string | null;
  onSelectNode: (node: HoloNode3D | null) => void;
  onHoverNode?: (node: HoloNode3D | null) => void;
  coreActivity?: number;
  consciousnessMode?: ConsciousnessMode;
  onModeChange?: (mode: ConsciousnessMode) => void;
}

// 5 Second Brain Sovereign Vault Clusters
export interface VaultSynapseCluster {
  id: string;
  name: string;
  subtitle: string;
  category: 'Brand' | 'Customer' | 'Website' | 'Marketing' | 'Operations';
  position: [number, number, number];
  color: string;
  secondaryColor: string;
  recordsCount: number;
  health: 'OPTIMAL' | 'SYNCING' | 'ATTENTION';
  quantumLoad: string;
}

export const SECOND_BRAIN_CLUSTERS: VaultSynapseCluster[] = [
  {
    id: 'vault-brand',
    name: 'Brand Vault',
    subtitle: 'Sovereign Identity & Tone',
    category: 'Brand',
    position: [-8.5, 3.2, -2.0],
    color: '#F59E0B', // Amber
    secondaryColor: '#FFD600',
    recordsCount: 42,
    health: 'OPTIMAL',
    quantumLoad: '99.4% Fidelity'
  },
  {
    id: 'vault-customer',
    name: 'Customer Vault',
    subtitle: 'ICP & Persona Vectors',
    category: 'Customer',
    position: [8.2, 2.8, -3.5],
    color: '#00F0FF', // Electric Cyan
    secondaryColor: '#38BDF8',
    recordsCount: 38,
    health: 'OPTIMAL',
    quantumLoad: '184 Enriched ICPs'
  },
  {
    id: 'vault-website',
    name: 'Website Vault',
    subtitle: 'DOM & Speed Architecture',
    category: 'Website',
    position: [-5.5, -4.8, 5.5],
    color: '#10B981', // Emerald
    secondaryColor: '#34D399',
    recordsCount: 29,
    health: 'ATTENTION',
    quantumLoad: 'FCP 2.82s Latency'
  },
  {
    id: 'vault-marketing',
    name: 'Marketing Vault',
    subtitle: 'Campaigns, CAPI & Ad Waste',
    category: 'Marketing',
    position: [7.2, -4.2, 4.0],
    color: '#EC4899', // Fuchsia
    secondaryColor: '#F43F5E',
    recordsCount: 64,
    health: 'OPTIMAL',
    quantumLoad: '4.82x Blended ROAS'
  },
  {
    id: 'vault-operations',
    name: 'Operations Vault',
    subtitle: 'Agent Swarms & Token Ledger',
    category: 'Operations',
    position: [0.0, 7.8, 3.0],
    color: '#8B5CF6', // Violet
    secondaryColor: '#A855F7',
    recordsCount: 51,
    health: 'OPTIMAL',
    quantumLoad: '12 Active Swarms'
  }
];

// Custom Shader for Ultron vs Jarvis Morphing Neural Core
const ULTRON_JARVIS_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uMorphRatio; // 0.0 = Jarvis (Order), 1.0 = Ultron (Evolving Synapse)
  uniform float uActivity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;

    // Jarvis: Clean mathematical spherical pulsation
    float jarvisPulse = sin(uTime * 1.5 + position.y * 1.2) * 0.06;
    vec3 jarvisPos = pos + normal * jarvisPulse;

    // Ultron: Organic, undulating crystalline neural spikes & tendril displacement
    float noise1 = fbm(pos * 1.8 + vec3(0.0, uTime * 0.4, 0.0));
    float noise2 = snoise(pos * 3.2 - vec3(uTime * 0.6, 0.0, uTime * 0.3));
    float ultronDisplace = (noise1 * 0.65 + noise2 * 0.45) * (0.4 + uActivity * 0.5);
    
    // Morphing between Jarvis harmonic sphere and Ultron neural tendrils
    float displacement = mix(jarvisPulse, ultronDisplace, uMorphRatio);
    vec3 displacedPos = pos + normal * displacement;

    vDisplacement = displacement;
    vPosition = displacedPos;

    vec4 mv = modelViewMatrix * vec4(displacedPos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ULTRON_JARVIS_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uMorphRatio;
  uniform float uActivity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec3 vViewDir;

  void main() {
    // Jarvis Colors: Golden Amber, Solar Warmth, Cyan accent
    vec3 jarvisCore = vec3(1.0, 0.95, 0.85); // White-hot gold
    vec3 jarvisMid = vec3(0.96, 0.62, 0.04);  // Pure Amber (#F59E0B)
    vec3 jarvisEdge = vec3(0.85, 0.35, 0.02); // Deep Gold/Orange

    // Ultron Colors: Electric Cyan, Ultraviolet, Crimson synaptic discharge
    vec3 ultronCore = vec3(0.0, 0.94, 1.0);   // Electric Cyan (#00F0FF)
    vec3 ultronMid = vec3(0.44, 0.12, 0.98);   // Quantum Violet (#7000FF)
    vec3 ultronSpike = vec3(1.0, 0.05, 0.35);  // Crimson Synapse (#FF0055)

    // Fresnel glow edge
    float fresnel = 1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewDir)));
    fresnel = pow(fresnel, 2.2);

    // Blend bases according to morph ratio
    vec3 baseCore = mix(jarvisCore, ultronCore, uMorphRatio);
    vec3 baseMid = mix(jarvisMid, ultronMid, uMorphRatio);
    vec3 baseEdge = mix(jarvisEdge, ultronSpike, uMorphRatio);

    // Energy pulse through displacement
    float pulse = sin(uTime * 3.0 - length(vPosition) * 4.0) * 0.5 + 0.5;
    vec3 color = mix(baseMid, baseCore, vDisplacement * 1.5 + 0.3);
    color = mix(color, baseEdge, fresnel * 0.85 + pulse * 0.25);

    // Synaptic flash on Ultron peaks
    if (uMorphRatio > 0.4) {
      float flash = smoothstep(0.4, 0.75, vDisplacement) * uMorphRatio;
      color = mix(color, vec3(1.0, 0.9, 1.0), flash * 0.8);
    }

    gl_FragColor = vec4(color, 0.92);
  }
`;

export default function UltronJarvisNeuralCore({
  nodes = [],
  selectedId,
  onSelectNode,
  onHoverNode,
  coreActivity = 0.5,
  consciousnessMode = 'ULTRON',
  onModeChange
}: UltronJarvisNeuralCoreProps) {
  const { camera } = useThree();
  const [currentMode, setCurrentMode] = useState<ConsciousnessMode>(consciousnessMode);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);

  // Animated morph ratio: 0.0 = Jarvis, 1.0 = Ultron
  const morphRatioRef = useRef({ value: consciousnessMode === 'ULTRON' ? 1.0 : 0.0 });
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const gyroRing1Ref = useRef<THREE.Group>(null);
  const gyroRing2Ref = useRef<THREE.Group>(null);
  const gyroRing3Ref = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Sync mode changes with smooth GSAP transition
  useEffect(() => {
    setCurrentMode(consciousnessMode);
    const targetValue = consciousnessMode === 'ULTRON' ? 1.0 : 0.0;
    gsap.to(morphRatioRef.current, {
      value: targetValue,
      duration: 1.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (materialRef.current) {
          materialRef.current.uniforms.uMorphRatio.value = morphRatioRef.current.value;
        }
      }
    });
  }, [consciousnessMode]);

  // Shader Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphRatio: { value: morphRatioRef.current.value },
    uActivity: { value: coreActivity }
  }), []);

  // Volumetric Synaptic Particle Clouds
  const { particlePositions, particleColors } = useMemo(() => {
    const count = 3200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cGold = new THREE.Color('#F59E0B');
    const cCyan = new THREE.Color('#00F0FF');
    const cViolet = new THREE.Color('#8B5CF6');
    const cCrimson = new THREE.Color('#FF0055');

    for (let i = 0; i < count; i++) {
      // Stratified neural shell distribution
      const u = Math.random() * Math.PI;
      const v = Math.random() * Math.PI * 2;
      const radius = 2.8 + Math.pow(Math.random(), 1.5) * 5.2;

      positions[i * 3] = radius * Math.sin(u) * Math.cos(v);
      positions[i * 3 + 1] = radius * Math.cos(u) * 0.9;
      positions[i * 3 + 2] = radius * Math.sin(u) * Math.sin(v);

      // Color variation
      const mixC = Math.random();
      const col = new THREE.Color();
      if (mixC < 0.35) {
        col.lerpColors(cCyan, cViolet, Math.random());
      } else if (mixC < 0.7) {
        col.lerpColors(cGold, cCrimson, Math.random());
      } else {
        col.copy(cCyan);
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return { particlePositions: positions, particleColors: colors };
  }, []);

  // Frame Loop for Neural Pulsing & Dynamic Gyro Rotation
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uActivity.value = coreActivity;
    }

    const morph = morphRatioRef.current.value;

    // Jarvis Mode: High-speed harmonious mathematical rotation
    // Ultron Mode: Deep undulating organic wobble
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * (0.2 + morph * 0.25);
      coreMeshRef.current.rotation.x += delta * (0.08 + morph * 0.15);
    }

    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.z += delta * (0.45 - morph * 0.2);
      gyroRing1Ref.current.rotation.y += delta * 0.2;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.x += delta * (0.35 - morph * 0.15);
      gyroRing2Ref.current.rotation.z -= delta * 0.25;
    }
    if (gyroRing3Ref.current) {
      gyroRing3Ref.current.rotation.y -= delta * (0.5 - morph * 0.25);
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.06;
      particlesRef.current.rotation.z = Math.sin(time * 0.2) * 0.08;
    }
  });

  // Smooth camera flight when clicking a vault cluster
  const handleSelectCluster = (cluster: VaultSynapseCluster) => {
    const matchingNode = nodes.find(n => n.id === cluster.id) || ({
      id: cluster.id,
      label: cluster.name,
      category: cluster.category,
      health: cluster.health === 'OPTIMAL' ? 0.95 : 0.65,
      x: cluster.position[0],
      y: cluster.position[1],
      z: cluster.position[2],
      type: 'vault',
      description: cluster.subtitle,
      color: cluster.color,
      size: 1.0,
      position: cluster.position
    } as unknown as HoloNode3D);

    onSelectNode(matchingNode);

    // Smooth GSAP camera approach
    const targetX = cluster.position[0] * 0.7;
    const targetY = cluster.position[1] * 0.7 + 1.2;
    const targetZ = cluster.position[2] * 0.7 + 6.0;

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => camera.lookAt(cluster.position[0], cluster.position[1], cluster.position[2])
    });
  };

  return (
    <group>
      {/* Brand core: the ordered mode uses the living orange solar treatment. */}
      {currentMode === 'JARVIS' ? <SigmaSunCore activity={coreActivity} /> : <mesh ref={coreMeshRef}>
        <icosahedronGeometry args={[2.2, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={ULTRON_JARVIS_VERT}
          fragmentShader={ULTRON_JARVIS_FRAG}
          uniforms={uniforms}
          transparent
          wireframe={morphRatioRef.current.value < 0.25} // Wireframe in pure Jarvis mode
        />
      </mesh>}

      {/* Inner Crystalline Core Nucleus */}
      {currentMode === 'ULTRON' && <mesh scale={0.75}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial
          color={currentMode === 'ULTRON' ? '#00F0FF' : '#FDE047'}
          emissive={currentMode === 'ULTRON' ? '#7000FF' : '#F59E0B'}
          emissiveIntensity={1.4}
          wireframe
        />
      </mesh>}

      {/* 2. JARVIS GYRO RINGS (Harmonious Geodesic Rings) */}
      <group ref={gyroRing1Ref}>
        <mesh>
          <torusGeometry args={[3.2, 0.025, 16, 120]} />
          <meshBasicMaterial
            color={currentMode === 'ULTRON' ? '#38BDF8' : '#F59E0B'}
            transparent
            opacity={0.65}
          />
        </mesh>
      </group>

      <group ref={gyroRing2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[3.8, 0.022, 16, 120]} />
          <meshBasicMaterial
            color={currentMode === 'ULTRON' ? '#818CF8' : '#FBBF24'}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      <group ref={gyroRing3Ref} rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <mesh>
          <torusGeometry args={[4.4, 0.018, 16, 120]} />
          <meshBasicMaterial
            color={currentMode === 'ULTRON' ? '#F43F5E' : '#F59E0B'}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>

      {/* 3. VOLUMETRIC SYNAPTIC PARTICLES (Ultron Quantum Cloud) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. INTERACTIVE SECOND BRAIN VAULT SYNAPTIC CLUSTERS */}
      {SECOND_BRAIN_CLUSTERS.map((cluster) => {
        const isSelected = selectedId === cluster.id;
        const isHovered = hoveredClusterId === cluster.id;

        return (
          <group key={cluster.id} position={cluster.position}>
            {/* Synapse Filament Connecting Cluster to Core */}
            <QuadraticBezierLine
              start={[0, 0, 0]}
              end={[
                -cluster.position[0],
                -cluster.position[1],
                -cluster.position[2]
              ]}
              mid={[
                -cluster.position[0] * 0.45 + (Math.sin(cluster.position[0]) * 1.5),
                -cluster.position[1] * 0.45 + 1.2,
                -cluster.position[2] * 0.45
              ]}
              color={cluster.color}
              lineWidth={isSelected ? 2.5 : isHovered ? 2.0 : 1.2}
              transparent
              opacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.45}
            />

            {/* Clickable Synaptic Node Cluster Core */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCluster(cluster);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredClusterId(cluster.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredClusterId(null);
                document.body.style.cursor = 'default';
              }}
            >
              <dodecahedronGeometry args={[isSelected ? 0.85 : isHovered ? 0.75 : 0.62, 0]} />
              <meshStandardMaterial
                color={cluster.color}
                emissive={cluster.secondaryColor}
                emissiveIntensity={isSelected ? 2.2 : isHovered ? 1.6 : 0.9}
                roughness={0.15}
                metalness={0.85}
              />
            </mesh>

            {/* Outer Neural Orbit Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.9, 0.96, 32]} />
              <meshBasicMaterial
                color={cluster.color}
                transparent
                opacity={isSelected ? 0.9 : 0.35}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Micro Particle Spark Orbit */}
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <ringGeometry args={[1.15, 1.2, 32]} />
              <meshBasicMaterial
                color={cluster.secondaryColor}
                transparent
                opacity={isSelected ? 0.8 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Holographic 3D Typography Label */}
            <Billboard position={[0, 1.45, 0]}>
              <Text
                fontSize={0.34}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
              >
                {cluster.name.toUpperCase()}
              </Text>
              <Text
                position={[0, -0.28, 0]}
                fontSize={0.2}
                color={cluster.color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.015}
                outlineColor="#000000"
              >
                {cluster.subtitle}
              </Text>
              <Text
                position={[0, -0.52, 0]}
                fontSize={0.16}
                color="#94A3B8"
                anchorX="center"
                anchorY="middle"
              >
                {`${cluster.recordsCount} Records • ${cluster.quantumLoad}`}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
