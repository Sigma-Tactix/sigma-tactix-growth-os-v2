import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Instance, Instances, Line, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { VantaPhase, VantaTopologyFocus } from '@/src/lib/vanta';
import { isWebGLAvailable } from '@/src/lib/webglDetection';

interface VantaOrbProps {
  phase: VantaPhase;
  amplitude?: number;
  inspectMode?: boolean;
  topology?: VantaTopologyFocus;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

const PHASE_COLOR: Record<VantaPhase, string> = {
  offline: '#B83E18',
  idle: '#FF481B',
  listening: '#4F7CFF',
  transcribing: '#38BDF8',
  thinking: '#FF7A34',
  speaking: '#FFF7ED',
  inspecting: '#35C9A5',
  proposing: '#F59E0B',
  awaiting_confirmation: '#F59E0B',
  success: '#35C9A5',
  warning: '#F59E0B',
  error: '#EF4444',
};

const VANTA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uActivity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vPulse;

  void main() {
    vec3 p = position;
    float waveA = sin(p.y * 4.7 + uTime * 0.7);
    float waveB = sin((p.x + p.z) * 5.9 - uTime * 0.52);
    float neural = waveA * waveB * (0.035 + uActivity * 0.065);
    p += normal * neural;
    vPulse = neural;
    vNormal = normalize(normalMatrix * normal);
    vPosition = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const VANTA_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActivity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vPulse;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.4);
    float lattice = smoothstep(0.72, 0.98, abs(sin(vPosition.x * 8.0) * sin(vPosition.y * 8.0) * sin(vPosition.z * 8.0)));
    vec3 hot = vec3(1.0, 0.97, 0.90);
    vec3 color = mix(uColor, hot, lattice * 0.52 + max(vPulse, 0.0) * 1.8);
    float alpha = 0.045 + fresnel * 0.22 + lattice * 0.075 + uActivity * 0.025;
    gl_FragColor = vec4(color, alpha);
  }
`;

function fibonacciPoint(index: number, total: number, radius: number): THREE.Vector3 {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  return new THREE.Vector3(
    Math.cos(theta) * Math.sin(phi) * radius,
    Math.cos(phi) * radius,
    Math.sin(theta) * Math.sin(phi) * radius,
  );
}

function NeuralFilament({ end, index, activity, color, reducedMotion }: {
  end: THREE.Vector3;
  index: number;
  activity: number;
  color: string;
  reducedMotion: boolean;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const { trunk, branches } = useMemo(() => {
    const radial = end.clone().normalize();
    const start = radial.clone().multiplyScalar(0.58 + (index % 3) * 0.04);
    const control = end.clone().multiplyScalar(0.52);
    control.x += Math.sin(index * 1.91) * 0.38;
    control.y += Math.cos(index * 1.37) * 0.34;
    control.z += Math.sin(index * 0.73) * 0.32;
    const trunk = new THREE.QuadraticBezierCurve3(start, control, end).getPoints(30);
    const fork = trunk[19];
    const tangent = new THREE.Vector3(-radial.y, radial.x + 0.12, radial.z * 0.35).normalize();
    const bitangent = new THREE.Vector3().crossVectors(radial, tangent).normalize();
    const branches = [-1, 1].map(direction => {
      const branchEnd = radial.clone()
        .multiplyScalar(1.48 + (index % 4) * 0.055)
        .addScaledVector(tangent, direction * (0.23 + (index % 2) * 0.05))
        .addScaledVector(bitangent, Math.sin(index * 0.83) * 0.16);
      const branchControl = fork.clone().lerp(branchEnd, 0.48)
        .addScaledVector(bitangent, direction * 0.13);
      return new THREE.QuadraticBezierCurve3(fork, branchControl, branchEnd).getPoints(12);
    });
    return { trunk, branches };
  }, [end, index]);

  useFrame(({ clock }) => {
    if (!pulseRef.current || reducedMotion) return;
    const t = (clock.elapsedTime * (0.13 + activity * 0.12) + index * 0.077) % 1;
    pulseRef.current.position.copy(trunk[Math.min(trunk.length - 1, Math.floor(t * trunk.length))]);
  });

  return (
    <group>
      <Line points={trunk} color={color} lineWidth={0.85 + activity * 0.9} transparent opacity={0.42 + activity * 0.3} />
      {branches.map((points, branchIndex) => (
        <Line
          key={branchIndex}
          points={points}
          color={branchIndex === 0 && index % 4 === 0 ? '#FFF0E0' : color}
          lineWidth={0.5 + activity * 0.45}
          transparent
          opacity={0.3 + activity * 0.25}
        />
      ))}
      <mesh ref={pulseRef} position={trunk[index % trunk.length]}>
        <sphereGeometry args={[0.025 + activity * 0.018, 8, 8]} />
        <meshBasicMaterial color="#FFF7ED" toneMapped={false} />
      </mesh>
    </group>
  );
}

function CameraDirector({ inspectMode, compact, reducedMotion }: { inspectMode: boolean; compact: boolean; reducedMotion: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, delta) => {
    if (compact || reducedMotion) return;
    const desiredZ = inspectMode ? 7.6 : 6.0;
    const desiredY = inspectMode ? 0.55 : 0;
    const factor = 1 - Math.exp(-delta * 2.6);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desiredZ, factor);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, factor);
    if (!inspectMode) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointer.x * 0.26, factor);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, state.pointer.y * 0.18, factor);
    }
    camera.lookAt(target);
  });
  return null;
}

function VantaScene({ phase, amplitude, inspectMode, topology, selectedNodeId, onSelectNode, compact, reducedMotion, qualityLow = false }: Required<Pick<VantaOrbProps, 'phase' | 'amplitude' | 'inspectMode' | 'compact'>> & {
  topology?: VantaTopologyFocus;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  reducedMotion: boolean;
  qualityLow?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const membraneRef = useRef<THREE.ShaderMaterial>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const color = PHASE_COLOR[phase];
  const activity = Math.min(1, Math.max(amplitude, ['thinking', 'speaking', 'listening'].includes(phase) ? 0.72 : phase === 'offline' ? 0.05 : 0.28));
  const nodeCount = compact ? 34 : qualityLow ? (inspectMode ? 52 : 42) : inspectMode ? 96 : 68;
  const shellPoints = useMemo(() => Array.from({ length: nodeCount }, (_, i) => fibonacciPoint(i, nodeCount, 1.72 + Math.sin(i * 1.7) * 0.10)), [nodeCount]);
  const filamentPoints = useMemo(() => shellPoints.filter((_, i) => i % (compact ? 5 : 3) === 0), [shellPoints, compact]);
  const visibleTopology = inspectMode ? topology?.nodes.slice(1, 20) ?? [] : [];

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uActivity: { value: activity },
    uColor: { value: new THREE.Color(color) },
  }), []);

  useFrame(({ clock }, delta) => {
    if (membraneRef.current) {
      membraneRef.current.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
      membraneRef.current.uniforms.uActivity.value = activity;
      membraneRef.current.uniforms.uColor.value.lerp(new THREE.Color(color), Math.min(1, delta * 4));
    }
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * (inspectMode ? 0.035 : 0.095);
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.19) * 0.045;
    }
    if (nucleusRef.current && !reducedMotion) {
      const scale = 1 + Math.sin(clock.elapsedTime * (1.3 + activity * 2.2)) * (0.025 + activity * 0.055);
      nucleusRef.current.scale.setScalar(scale);
    }
  });

  return (
    <>
      <CameraDirector inspectMode={inspectMode} compact={compact} reducedMotion={reducedMotion} />
      <ambientLight intensity={0.2} />
      <pointLight color="#FF6A2A" intensity={30 + activity * 45} distance={18} />
      <group ref={groupRef}>
        <mesh ref={nucleusRef}>
          <icosahedronGeometry args={[0.34, 5]} />
          <meshBasicMaterial color="#FFFDF8" toneMapped={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.54, 2]} />
          <meshBasicMaterial color="#FFB06D" wireframe transparent opacity={0.72} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.72, 3]} />
          <meshBasicMaterial color="#FF481B" wireframe transparent opacity={0.22 + activity * 0.12} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.18, compact || qualityLow ? 3 : 5]} />
          <shaderMaterial
            ref={membraneRef}
            uniforms={uniforms}
            vertexShader={VANTA_VERT}
            fragmentShader={VANTA_FRAG}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh scale={1.13}>
          <icosahedronGeometry args={[1.38, compact ? 2 : 3]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.16 + activity * 0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        {filamentPoints.map((point, index) => (
          <NeuralFilament key={index} end={point} index={index} activity={activity} color={color} reducedMotion={reducedMotion} />
        ))}

        <Instances limit={nodeCount + visibleTopology.length}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial toneMapped={false} />
          {shellPoints.map((point, index) => (
            <Instance key={`shell-${index}`} position={point} color={index % 7 === 0 ? '#FFF7ED' : color} scale={index % 5 === 0 ? 1.5 : 1} />
          ))}
          {visibleTopology.map((node, index) => {
            const point = fibonacciPoint(index, Math.max(visibleTopology.length, 1), 3.15);
            const selected = selectedNodeId === node.id;
            return (
              <Instance
                key={node.id}
                position={point}
                color={node.status === 'approval_required' ? '#F59E0B' : node.status === 'verified' ? '#35C9A5' : '#FF7A34'}
                scale={selected ? 3.2 : 2.1}
                onClick={(event) => { event.stopPropagation(); onSelectNode?.(node.id); }}
              />
            );
          })}
        </Instances>
        {!compact && <Sparkles count={qualityLow ? 38 : inspectMode ? 115 : 72} scale={7} size={1.5} speed={reducedMotion ? 0 : 0.22 + activity * 0.3} color={color} opacity={0.28} />}
      </group>
      {!compact && (
        <OrbitControls
          enabled={inspectMode}
          enablePan={false}
          minDistance={4.4}
          maxDistance={11}
          autoRotate={inspectMode && !reducedMotion}
          autoRotateSpeed={0.16}
        />
      )}
    </>
  );
}

function VantaFallback({ phase, compact }: { phase: VantaPhase; compact: boolean }) {
  const color = PHASE_COLOR[phase];
  const size = compact ? 100 : 330;
  const branches = Array.from({ length: compact ? 12 : 22 }, (_, index) => {
    const angle = (index / (compact ? 12 : 22)) * Math.PI * 2;
    const inner = 55 + (index % 3) * 7;
    const outer = 112 + (index % 5) * 7;
    return {
      x1: 150 + Math.cos(angle) * inner,
      y1: 150 + Math.sin(angle) * inner,
      cx: 150 + Math.cos(angle + 0.13 * (index % 2 ? 1 : -1)) * ((inner + outer) / 2),
      cy: 150 + Math.sin(angle + 0.13 * (index % 2 ? 1 : -1)) * ((inner + outer) / 2),
      x2: 150 + Math.cos(angle) * outer,
      y2: 150 + Math.sin(angle) * outer,
    };
  });
  return (
    <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[#080402]" role="img" aria-label={`VANTA is ${phase.replace('_', ' ')}`}>
      <svg width={size} height={size} viewBox="0 0 300 300" className="overflow-visible motion-safe:animate-[pulse_3s_ease-in-out_infinite]" aria-hidden="true">
        <defs>
          <radialGradient id={`vanta-core-${compact}`}><stop offset="0" stopColor="#fff" /><stop offset="0.18" stopColor="#fff7ed" /><stop offset="0.48" stopColor={color} /><stop offset="1" stopColor="#4a1204" stopOpacity="0" /></radialGradient>
          <filter id={`vanta-glow-${compact}`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={compact ? 5 : 9} result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="150" cy="150" r="132" fill="none" stroke={color} strokeOpacity="0.14" strokeWidth="1" strokeDasharray="3 8" />
        <circle cx="150" cy="150" r="105" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="1" />
        <g fill="none" stroke={color} strokeOpacity="0.58" strokeWidth={compact ? 2.2 : 1.2} filter={`url(#vanta-glow-${compact})`}>
          {branches.map((branch, index) => <path key={index} d={`M ${branch.x1} ${branch.y1} Q ${branch.cx} ${branch.cy} ${branch.x2} ${branch.y2}`} />)}
        </g>
        {branches.filter((_, index) => index % 2 === 0).map((branch, index) => <circle key={index} cx={branch.x2} cy={branch.y2} r={compact ? 3.5 : 2.4} fill={index % 3 === 0 ? '#fff7ed' : color} opacity="0.9" />)}
        <circle cx="150" cy="150" r="74" fill={`url(#vanta-core-${compact})`} filter={`url(#vanta-glow-${compact})`} />
        <circle cx="150" cy="150" r="34" fill="#fff7ed" opacity="0.96" filter={`url(#vanta-glow-${compact})`} />
        <circle cx="150" cy="150" r="58" fill="none" stroke="#fff7ed" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="18 7" />
      </svg>
    </div>
  );
}

export default function VantaOrb({
  phase,
  amplitude = 0,
  inspectMode = false,
  topology,
  selectedNodeId,
  onSelectNode,
  className = '',
  compact = false,
}: VantaOrbProps) {
  const [webgl, setWebgl] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [qualityLow, setQualityLow] = useState(false);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const quality = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => setReducedMotion(media.matches);
    const updateQuality = () => setQualityLow(quality.matches);
    update();
    updateQuality();
    media.addEventListener?.('change', update);
    quality.addEventListener?.('change', updateQuality);
    return () => {
      media.removeEventListener?.('change', update);
      quality.removeEventListener?.('change', updateQuality);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_center,#1a0803_0%,#080301_52%,#020101_100%)] ${className}`}>
      {webgl ? (
        <Canvas
          camera={{ fov: compact ? 42 : 38, position: [0, 0, compact ? 6.4 : 6] }}
          dpr={compact ? 1 : qualityLow ? [1, 1.25] : [1, 1.7]}
          gl={{ antialias: !compact, alpha: true, powerPreference: compact ? 'low-power' : 'high-performance' }}
          aria-label={`VANTA neural orb, ${phase.replace('_', ' ')}`}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', event => {
              event.preventDefault();
              setWebgl(false);
            }, { once: true });
          }}
        >
          <Suspense fallback={null}>
            <VantaScene
              phase={phase}
              amplitude={amplitude}
              inspectMode={inspectMode}
              topology={topology}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              compact={compact}
              reducedMotion={reducedMotion}
              qualityLow={qualityLow}
            />
          </Suspense>
        </Canvas>
      ) : <VantaFallback phase={phase} compact={compact} />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,.54)_100%)]" />
    </div>
  );
}

export { PHASE_COLOR };
