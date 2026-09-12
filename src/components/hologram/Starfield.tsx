import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Deep starfield behind the Matrix.
 * Three depth shells drift at different rates.
 * Twinkle is per-star: each point carries its own phase and irregular frequency pair.
 */

interface ShellConfig {
  count: number;
  radius: number;
  drift: number;
  sizeRange: [number, number];
  brightness: number;
}

const SHELLS: ShellConfig[] = [
  { count: 2400, radius: 260, drift: 0.0035, sizeRange: [1.0, 2.0], brightness: 0.7 },
  { count: 1400, radius: 180, drift: 0.0075, sizeRange: [1.4, 3.0], brightness: 0.9 },
  { count: 520, radius: 120, drift: 0.014, sizeRange: [2.0, 4.2], brightness: 1.0 },
];

const STAR_COLORS: Array<[number, number, number]> = [
  [1.0, 0.96, 0.92], // white
  [1.0, 0.98, 1.0],
  [0.86, 0.91, 1.0], // blue-white
  [1.0, 0.89, 0.76], // warm
  [1.0, 0.8, 0.62], // orange dwarf
];

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aFreqA;
  attribute float aFreqB;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uBrightness;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float t = uTime;
    float flicker = 0.72
      + 0.20 * sin(t * aFreqA + aPhase)
      + 0.12 * sin(t * aFreqB + aPhase * 2.3);
    vAlpha = clamp(flicker, 0.12, 1.0) * uBrightness;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * 2.2;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float halo = pow(core, 6.0);
    float intensity = halo * 0.85 + core * 0.15;
    gl_FragColor = vec4(vColor * intensity, intensity * vAlpha);
  }
`;

function StarShell({ config }: { config: ShellConfig }) {
  const ref = useRef<THREE.Points>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBrightness: { value: config.brightness },
      uPixelRatio: { value: 1 },
    }),
    [config.brightness]
  );

  const geometry = useMemo(() => {
    const { count, radius, sizeRange } = config;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count);
    const freqA = new Float32Array(count);
    const freqB = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const jitter = radius * (0.92 + Math.random() * 0.16);

      positions[i * 3] = r * Math.cos(theta) * jitter;
      positions[i * 3 + 1] = u * jitter;
      positions[i * 3 + 2] = r * Math.sin(theta) * jitter;

      const bias = Math.pow(Math.random(), 3);
      sizes[i] = sizeRange[0] + bias * (sizeRange[1] - sizeRange[0]);

      const [cr, cg, cb] = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;

      phase[i] = Math.random() * Math.PI * 2;
      freqA[i] = 0.6 + Math.random() * 2.2;
      freqB[i] = 0.35 + Math.random() * 1.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aFreqA', new THREE.BufferAttribute(freqA, 1));
    geo.setAttribute('aFreqB', new THREE.BufferAttribute(freqB, 1));
    return geo;
  }, [config]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * config.drift;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export const FALLING_STAR_INTERVAL = 5;
export const METEOR_SHOWER_INTERVAL = 10;
const SHOWER_SIZE = 7;

const METEOR_COLORS = [
  '#FFF4E8', // magnesium white
  '#FFD27F', // sodium yellow
  '#FF8A4C', // iron orange
  '#9CF0C0', // nickel green
  '#8FD0FF', // ionised blue
  '#FF6A9C', // rose
  '#C89CFF', // violet
];

const SHOWER_GRADIENTS: Array<[string, string]> = [
  ['#FFF4E8', '#FF6A34'],
  ['#8FD0FF', '#7C3AED'],
  ['#9CF0C0', '#3FA3A3'],
  ['#FFD27F', '#FF2A85'],
  ['#FFB088', '#FF481B'],
];

const TRAIL_SEGMENTS = 14;
const POOL = 14;

interface MeteorSlot {
  active: boolean;
  from: THREE.Vector3;
  to: THREE.Vector3;
  startAt: number;
  duration: number;
  head: THREE.Color;
  tail: THREE.Color;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function meteorPath(side: number, spread: number) {
  const from = new THREE.Vector3(
    side * randomBetween(45, 105) + spread,
    randomBetween(35, 70),
    randomBetween(-110, -45)
  );
  const to = from
    .clone()
    .add(new THREE.Vector3(-side * randomBetween(55, 95), -randomBetween(45, 80), randomBetween(30, 70)));
  return { from, to };
}

function MeteorField() {
  const slots = useMemo<MeteorSlot[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        active: false,
        from: new THREE.Vector3(),
        to: new THREE.Vector3(),
        startAt: 0,
        duration: 1,
        head: new THREE.Color('#FFFFFF'),
        tail: new THREE.Color('#FF8A4C'),
      })),
    []
  );

  const trails = useMemo(
    () =>
      slots.map(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_SEGMENTS * 3), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL_SEGMENTS * 3), 3));
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        return { geometry, material };
      }),
    [slots]
  );

  const lineObjects = useMemo(
    () => trails.map(t => new THREE.Line(t.geometry, t.material)),
    [trails]
  );

  const timers = useRef({ nextSolo: 2.5, nextShower: METEOR_SHOWER_INTERVAL });
  const scratch = useMemo(
    () => ({ head: new THREE.Vector3(), point: new THREE.Vector3(), color: new THREE.Color() }),
    []
  );

  const arm = (slot: MeteorSlot, now: number, delay: number, headHex: string, tailHex: string, side: number, spread: number) => {
    const { from, to } = meteorPath(side, spread);
    slot.active = true;
    slot.from.copy(from);
    slot.to.copy(to);
    slot.startAt = now + delay;
    slot.duration = randomBetween(0.75, 1.4);
    slot.head.set(headHex);
    slot.tail.set(tailHex);
  };

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const t = timers.current;

    if (now >= t.nextSolo) {
      t.nextSolo = now + FALLING_STAR_INTERVAL;
      const free = slots.find((s) => !s.active);
      if (free) {
        const hex = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];
        arm(free, now, 0, '#FFFFFF', hex, Math.random() > 0.5 ? 1 : -1, 0);
        free.head.lerp(new THREE.Color(hex), 0.5);
      }
    }

    if (now >= t.nextShower) {
      t.nextShower = now + METEOR_SHOWER_INTERVAL;
      const [headHex, tailHex] = SHOWER_GRADIENTS[Math.floor(Math.random() * SHOWER_GRADIENTS.length)];
      const side = Math.random() > 0.5 ? 1 : -1;
      let armed = 0;
      for (const slot of slots) {
        if (armed >= SHOWER_SIZE) break;
        if (slot.active) continue;
        arm(slot, now, armed * randomBetween(0.07, 0.24), headHex, tailHex, side, randomBetween(-30, 30));
        armed++;
      }
    }

    slots.forEach((slot, i) => {
      const { geometry, material } = trails[i];
      if (!slot.active) {
        material.opacity = 0;
        return;
      }

      const progress = (now - slot.startAt) / slot.duration;
      if (progress < 0) {
        material.opacity = 0;
        return;
      }
      if (progress > 1) {
        slot.active = false;
        material.opacity = 0;
        return;
      }

      const position = geometry.getAttribute('position') as THREE.BufferAttribute;
      const color = geometry.getAttribute('color') as THREE.BufferAttribute;

      for (let v = 0; v < TRAIL_SEGMENTS; v++) {
        const along = v / (TRAIL_SEGMENTS - 1);
        scratch.point.lerpVectors(slot.from, slot.to, Math.max(0, progress - along * 0.12));
        position.setXYZ(v, scratch.point.x, scratch.point.y, scratch.point.z);
        scratch.color.copy(slot.head).lerp(slot.tail, along);
        const falloff = Math.pow(1 - along, 1.8);
        color.setXYZ(v, scratch.color.r * falloff, scratch.color.g * falloff, scratch.color.b * falloff);
      }
      position.needsUpdate = true;
      color.needsUpdate = true;
      material.opacity = Math.sin(Math.PI * Math.min(1, progress * 1.15)) * 0.95;
    });
  });

  return (
    <group>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

export default function Starfield() {
  return (
    <group>
      {SHELLS.map((config, i) => (
        <StarShell key={i} config={config} />
      ))}
      <MeteorField />
    </group>
  );
}
