import { useMemo, useRef, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { NOISE_GLSL } from './noiseGlsl';
import { CORE_RADIUS } from '../../lib/hologramGraph';
import { planetPosition, type PlanetAssignment, type PlanetMoon } from '../../lib/hologramPlanets';
import type { HoloNode3D } from '../../lib/hologramGraph';

const PLANET_VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const PLANET_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uEquator;
  uniform vec3 uPole;
  uniform vec3 uBand;
  uniform int uSurface;      // 0 rocky, 1 gas, 2 ice, 3 dwarf
  uniform vec3 uStarPos;
  uniform float uSelected;
  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vLocalPos);
    float lat = p.y;
    vec3 base;

    if (uSurface == 1) {
      // Gas giant: latitude bands sheared by turbulence
      float turbulence = fbm(vec3(p.x * 2.0, p.y * 9.0, p.z * 2.0) + vec3(uTime * 0.03, 0.0, 0.0));
      float bands = sin(lat * 18.0 + turbulence * 2.4);
      float belt = smoothstep(-0.25, 0.65, bands);
      base = mix(uEquator, uBand, belt);
      float storm = smoothstep(0.86, 1.0, 1.0 - length(p - normalize(vec3(0.55, -0.32, 0.7))));
      base = mix(base, uPole, storm * 0.85);
      base = mix(base, uPole, smoothstep(0.55, 1.0, abs(lat)) * 0.6);
    } else if (uSurface == 2) {
      // Ice giant: smooth, faint banding, limb haze
      float bands = sin(lat * 7.0 + fbm(p * 2.0) * 1.2);
      base = mix(uEquator, uBand, smoothstep(-0.2, 0.9, bands) * 0.35);
      base = mix(base, uPole, smoothstep(0.4, 1.0, abs(lat)) * 0.5);
    } else {
      // Rocky / dwarf: mottled terrain, polar caps
      float terrain = fbm(p * 3.4) * 0.6 + fbm(p * 9.0) * 0.4;
      base = mix(uPole, uEquator, smoothstep(-0.4, 0.5, terrain));
      base = mix(base, uBand, smoothstep(0.25, 0.75, terrain) * 0.6);
      float caps = smoothstep(0.78, 0.95, abs(lat));
      base = mix(base, vec3(0.92, 0.94, 0.97), caps * 0.55);
    }

    vec3 toStar = normalize(uStarPos - vWorldPos);
    float lambert = dot(normalize(vNormal), toStar);
    float light = smoothstep(-0.35, 0.85, lambert);
    vec3 color = base * (0.16 + light * 1.05);

    // Warm rim grazing
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition - vWorldPos))), 3.0);
    color += vec3(1.0, 0.45, 0.18) * rim * (0.25 + light * 0.5);
    color += base * uSelected * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const SURFACE_INDEX: Record<string, number> = { rocky: 0, gas: 1, ice: 2, dwarf: 3 };

function Moon({ moon, moving }: { moon: PlanetMoon; moving: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const angle = moon.phase + (moving ? state.clock.elapsedTime * moon.speed : 0);
    ref.current.position.set(
      Math.cos(angle) * moon.orbitRadius,
      Math.sin(angle) * moon.orbitRadius * Math.sin(moon.inclination),
      Math.sin(angle) * moon.orbitRadius * Math.cos(moon.inclination)
    );
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[moon.radius, 16, 16]} />
        <meshStandardMaterial color={moon.color} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

function MoonOrbitRing({ radius, inclination }: { radius: number; inclination: number }) {
  return (
    <mesh rotation={[Math.PI / 2 - inclination, 0, 0]}>
      <ringGeometry args={[radius - 0.004, radius + 0.004, 64]} />
      <meshBasicMaterial color="#8FA3B8" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Planet({
  planet,
  node,
  moving,
  isSelected,
  healthColor,
  labelTier,
  onSelect,
  onHover,
}: {
  planet: PlanetAssignment;
  node: HoloNode3D;
  labelTier: number;
  moving: boolean;
  isSelected: boolean;
  healthColor?: string;
  onSelect: (node: HoloNode3D) => void;
  onHover?: (node: HoloNode3D | null) => void;
}) {
  const orbitGroup = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEquator: { value: new THREE.Color(planet.body.colors[0]) },
      uPole: { value: new THREE.Color(planet.body.colors[1]) },
      uBand: { value: new THREE.Color(planet.body.colors[2]) },
      uSurface: { value: SURFACE_INDEX[planet.body.surface] ?? 0 },
      uStarPos: { value: new THREE.Vector3(0, 0, 0) },
      uSelected: { value: 0 },
    }),
    [planet]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    uniforms.uSelected.value = isSelected ? 1 : hovered ? 0.5 : 0;

    if (orbitGroup.current) {
      const [x, y, z] = planetPosition(planet, t, moving);
      orbitGroup.current.position.set(x, y, z);
      const scale = isSelected ? 1.25 : hovered ? 1.12 : 1;
      orbitGroup.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15);
    }
    if (spinRef.current) spinRef.current.rotation.y += planet.spinSpeed * state.clock.getDelta() * 12;
  });

  const tilt = (planet.body.tiltDeg * Math.PI) / 180;

  return (
    <group ref={orbitGroup}>
      <group rotation={[0, 0, tilt]}>
        <mesh
          ref={spinRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            onHover?.(node);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            onHover?.(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[planet.radius, 48, 48]} />
          <shaderMaterial uniforms={uniforms} vertexShader={PLANET_VERT} fragmentShader={PLANET_FRAG} />
        </mesh>

        {/* Rings */}
        {planet.body.hasRings && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius * 1.45, planet.radius * 2.3, 96]} />
            <meshBasicMaterial
              color={planet.body.colors[2]}
              transparent
              opacity={0.42}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Moons */}
        {planet.moons.map((moon) => (
          <group key={moon.id}>
            <MoonOrbitRing radius={moon.orbitRadius} inclination={moon.inclination} />
            <Moon moon={moon} moving={moving} />
          </group>
        ))}
      </group>

      {/* Health ring */}
      {healthColor && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[planet.radius * 1.32, 0.022, 8, 48]} />
          <meshBasicMaterial
            color={healthColor}
            transparent
            opacity={isSelected ? 1 : hovered ? 0.9 : 0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3D Billboard Label */}
      <Billboard position={[0, planet.radius * 2.4 + 0.3 + (labelTier % 3) * 0.55, 0]}>
        <Suspense fallback={null}>
          <Text
            fontSize={isSelected || hovered ? 0.32 : 0.26}
            color={isSelected ? '#FFB088' : '#F5F5F3'}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.03}
            outlineColor="#050515"
          >
            {node.label}
          </Text>
        </Suspense>
      </Billboard>
    </group>
  );
}

function OrbitPath({ planet }: { planet: PlanetAssignment }) {
  return (
    <mesh rotation={[Math.PI / 2 - planet.inclination, 0, 0]}>
      <ringGeometry args={[planet.orbitRadius - 0.012, planet.orbitRadius + 0.012, 160]} />
      <meshBasicMaterial color="#4F7CFF" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function StarFilament({
  planet,
  color,
  active,
  moving,
}: {
  planet: PlanetAssignment;
  color: string;
  active: boolean;
  moving: boolean;
}) {
  const ref = useRef<{ setPoints: (a: THREE.Vector3, b: THREE.Vector3, c?: THREE.Vector3) => void }>(null);
  const vectors = useMemo(
    () => ({ start: new THREE.Vector3(), end: new THREE.Vector3(), mid: new THREE.Vector3() }),
    []
  );

  useFrame((state) => {
    if (!ref.current) return;
    const [x, y, z] = planetPosition(planet, state.clock.elapsedTime, moving);
    vectors.end.set(x, y, z);
    vectors.start.copy(vectors.end).normalize().multiplyScalar(CORE_RADIUS);
    vectors.mid.copy(vectors.start).add(vectors.end).multiplyScalar(0.5);
    vectors.mid.y += 0.5;
    ref.current.setPoints(vectors.start, vectors.end, vectors.mid);
  });

  return (
    <QuadraticBezierLine
      ref={ref as never}
      start={[0, 0, 0]}
      end={[0, 0, 0]}
      color={color}
      lineWidth={active ? 2.4 : 1.1}
      transparent
      opacity={active ? 0.95 : 0.3}
    />
  );
}

export default function PlanetSystem({
  planets,
  nodes,
  moving,
  selectedId,
  healthColors,
  onSelect,
  onHover,
}: {
  planets: PlanetAssignment[];
  nodes: HoloNode3D[];
  moving: boolean;
  selectedId: string | null;
  healthColors: Record<string, string>;
  onSelect: (node: HoloNode3D | null) => void;
  onHover?: (node: HoloNode3D | null) => void;
}) {
  const nodeByModule = useMemo(() => {
    const map = new Map<string, HoloNode3D>();
    for (const node of nodes) if (node.moduleKey) map.set(node.moduleKey, node);
    return map;
  }, [nodes]);

  const visible = planets.filter((p) => nodeByModule.has(p.moduleKey));

  return (
    <group>
      {visible.map((planet, index) => {
        const node = nodeByModule.get(planet.moduleKey)!;
        return (
          <group key={planet.moduleKey}>
            <OrbitPath planet={planet} />
            <StarFilament
              planet={planet}
              color={healthColors[node.id] ?? node.color}
              active={node.id === selectedId}
              moving={moving}
            />
            <Planet
              planet={planet}
              node={node}
              labelTier={index}
              moving={moving}
              isSelected={node.id === selectedId}
              healthColor={healthColors[node.id]}
              onSelect={onSelect}
              onHover={onHover}
            />
          </group>
        );
      })}
    </group>
  );
}
