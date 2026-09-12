import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CORE_RADIUS } from '../../lib/hologramGraph';
import { NOISE_GLSL } from './noiseGlsl';

/**
 * The Sigma Tactix core, rendered as a star.
 *
 * Brand orange #FF481B is the photosphere; the centre runs white-hot and the
 * limb falls to #E03A10 and out into a corona. Surface detail is 3-octave
 * simplex fbm advected over time.
 */

export const SUN_RADIUS = CORE_RADIUS;

const CORE_WHITE = new THREE.Color('#FFF7ED');
const PHOTOSPHERE = new THREE.Color('#FF7A34'); // brand orange, lifted for emission
const LIMB = new THREE.Color('#FF481B'); // Sigma Orange at the limb

const SURFACE_VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const SURFACE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uActivity;
  uniform vec3 uCoreWhite;
  uniform vec3 uPhotosphere;
  uniform vec3 uLimb;
  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vLocalPos);

    // Two noise fields at different scales: large convection cells with smaller granules
    float cells = fbm(p * 2.4 + vec3(0.0, uTime * 0.045, 0.0));
    float granules = fbm(p * 7.5 - vec3(uTime * 0.075, 0.0, uTime * 0.03));
    float surface = cells * 0.65 + granules * 0.35;

    // Intergranular lanes
    float lanes = smoothstep(-0.15, 0.35, surface);

    // Limb darkening
    float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
    float limbDark = pow(facing, 0.55);

    vec3 color = mix(uLimb, uPhotosphere, 0.45 + lanes * 0.55);
    color = mix(color, uCoreWhite, pow(lanes, 1.6) * 0.9 * limbDark);
    color *= 1.35 + 0.9 * limbDark;
    color *= 0.92 + uActivity * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const CORONA_VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying float vRim;

  void main() {
    vLocalPos = position;
    vec3 n = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 viewDir = normalize(-mv.xyz);
    vRim = 1.0 - abs(dot(n, viewDir));
    gl_Position = projectionMatrix * mv;
  }
`;

const CORONA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uInner;
  uniform vec3 uOuter;
  varying vec3 vLocalPos;
  varying float vRim;

  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vLocalPos);
    float streamers = fbm(p * 3.1 + vec3(uTime * 0.05, uTime * 0.03, 0.0));
    float rim = pow(clamp(vRim, 0.0, 1.0), 2.2);
    float density = rim * (0.55 + 0.45 * smoothstep(-0.2, 0.6, streamers));
    vec3 color = mix(uOuter, uInner, rim);
    gl_FragColor = vec4(color, density * 0.42);
  }
`;

function FlareArc({ seed, activity }: { seed: number; activity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const { curve, axis } = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const theta = rand(1) * Math.PI * 2;
    const phi = Math.acos(2 * rand(2) - 1);
    const base = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
    const tangent = new THREE.Vector3(-base.z, 0, base.x).normalize();
    const spread = 0.35 + rand(3) * 0.4;
    const height = SUN_RADIUS * (0.28 + rand(4) * 0.4);

    const start = base.clone().multiplyScalar(SUN_RADIUS * 0.98).addScaledVector(tangent, -spread);
    const end = base.clone().multiplyScalar(SUN_RADIUS * 0.98).addScaledVector(tangent, spread);
    const apex = base.clone().multiplyScalar(SUN_RADIUS + height);

    return {
      curve: new THREE.QuadraticBezierCurve3(start, apex, end),
      axis: base,
    };
  }, [seed]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 28, 0.045, 6, false), [curve]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.28 + seed * 2.1;
    const cycle = (Math.sin(t) + 1) * 0.5;
    if (materialRef.current) {
      materialRef.current.opacity = Math.pow(cycle, 2.0) * (0.35 + activity * 0.45);
    }
    if (ref.current) {
      ref.current.scale.setScalar(0.96 + cycle * 0.08);
    }
  });

  return (
    <mesh ref={ref} geometry={geometry} up={axis}>
      <meshBasicMaterial
        ref={materialRef}
        color="#FF7A3C"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function SigmaSunCore({ activity = 0.5 }: { activity?: number }) {
  const surfaceUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: activity },
      uCoreWhite: { value: CORE_WHITE },
      uPhotosphere: { value: PHOTOSPHERE },
      uLimb: { value: LIMB },
    }),
    []
  );

  const coronaUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInner: { value: new THREE.Color('#FFB088') },
      uOuter: { value: new THREE.Color('#FF481B') },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    surfaceUniforms.uTime.value = t;
    surfaceUniforms.uActivity.value = activity;
    coronaUniforms.uTime.value = t;
  });

  return (
    <group>
      {/* Photosphere */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 96, 96]} />
        <shaderMaterial
          uniforms={surfaceUniforms}
          vertexShader={SURFACE_VERT}
          fragmentShader={SURFACE_FRAG}
        />
      </mesh>

      {/* Corona — two shells */}
      <mesh scale={1.16}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <shaderMaterial
          uniforms={coronaUniforms}
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.34}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <shaderMaterial
          uniforms={coronaUniforms}
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Prominence flare loops */}
      {[0, 1, 2, 3, 4].map((seed) => (
        <FlareArc key={seed} seed={seed + 1} activity={activity} />
      ))}

      {/* The star lights the modules around it */}
      <pointLight position={[0, 0, 0]} intensity={260} color="#FF9A5C" distance={46} decay={2} />
    </group>
  );
}
