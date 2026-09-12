/**
 * Growth Matrix — planetary bodies.
 *
 * Each Growth OS module is a real solar-system body, ordered outward from the
 * Sigma star in sidebar order. Two things are deliberately *not* to scale:
 *
 *  - **Radius** is compressed. Jupiter is 28x Mercury by radius; at true ratio
 *    Mercury would be two pixels next to a beach ball. Sizes run through a
 *    cube-root compression that preserves the *ordering* and the obvious
 *    gas-giant-vs-rocky split while keeping every module clickable.
 *  - **Orbit spacing** is compressed the same way. True AU spacing would put
 *    Neptune 77x further out than Mercury and leave the inner four modules
 *    stacked on the star.
 *
 * Everything else — relative order, axial tilt, ring systems, rotation
 * direction (Venus and Uranus turn retrograde), moon counts — follows the real
 * bodies. `REAL` keeps the source numbers so the compression stays auditable.
 */
import type { TabId } from '../components/shell/navigation';
import { GROWTH_MATRIX_MODULES } from './hologramGraph';
import type { ModuleStatus } from './hologramTelemetry';

export type PlanetSurface = 'rocky' | 'gas' | 'ice' | 'dwarf';

export interface PlanetBody {
  /** The real body this module is rendered as. */
  name: string;
  surface: PlanetSurface;
  /** Real equatorial radius in km — the source for the compressed size. */
  realRadiusKm: number;
  /** Real semi-major axis in AU — the source for the compressed orbit. */
  realOrbitAu: number;
  /** Real axial tilt in degrees. */
  tiltDeg: number;
  /** Real sidereal day in Earth hours; negative means retrograde. */
  dayHours: number;
  /** Palette: [equator, pole, band accent]. */
  colors: [string, string, string];
  hasRings: boolean;
  /** Real moon count, for the "we invented one" note in the inspector. */
  realMoons: number;
}

/** Bodies in orbital order, then dwarf planets for the outermost modules. */
export const PLANET_BODIES: PlanetBody[] = [
  { name: 'Mercury', surface: 'rocky', realRadiusKm: 2440, realOrbitAu: 0.39, tiltDeg: 0.03, dayHours: 1408, colors: ['#8C7853', '#5A4A38', '#B5A183'], hasRings: false, realMoons: 0 },
  { name: 'Venus', surface: 'rocky', realRadiusKm: 6052, realOrbitAu: 0.72, tiltDeg: 177.4, dayHours: -5832, colors: ['#E8B96B', '#C98F3E', '#FFDCA3'], hasRings: false, realMoons: 0 },
  { name: 'Earth', surface: 'rocky', realRadiusKm: 6371, realOrbitAu: 1.0, tiltDeg: 23.4, dayHours: 24, colors: ['#2E6FA8', '#1B4C7A', '#3FA34D'], hasRings: false, realMoons: 1 },
  { name: 'Mars', surface: 'rocky', realRadiusKm: 3390, realOrbitAu: 1.52, tiltDeg: 25.2, dayHours: 24.6, colors: ['#C1440E', '#8A3208', '#E27B48'], hasRings: false, realMoons: 2 },
  { name: 'Jupiter', surface: 'gas', realRadiusKm: 69911, realOrbitAu: 5.2, tiltDeg: 3.1, dayHours: 9.9, colors: ['#D8A15C', '#A9713C', '#F0DCC0'], hasRings: true, realMoons: 95 },
  { name: 'Saturn', surface: 'gas', realRadiusKm: 58232, realOrbitAu: 9.58, tiltDeg: 26.7, dayHours: 10.7, colors: ['#E3C88E', '#B79A63', '#FBEBC8'], hasRings: true, realMoons: 146 },
  { name: 'Uranus', surface: 'ice', realRadiusKm: 25362, realOrbitAu: 19.2, tiltDeg: 97.8, dayHours: -17.2, colors: ['#8FD6E1', '#5BA8B8', '#C8F0F5'], hasRings: true, realMoons: 28 },
  { name: 'Neptune', surface: 'ice', realRadiusKm: 24622, realOrbitAu: 30.05, tiltDeg: 28.3, dayHours: 16.1, colors: ['#3B5FC0', '#26408A', '#7FA0E8'], hasRings: true, realMoons: 16 },
  { name: 'Pluto', surface: 'dwarf', realRadiusKm: 1188, realOrbitAu: 39.5, tiltDeg: 122.5, dayHours: -153.3, colors: ['#C9B8A3', '#8F8071', '#E8DCCA'], hasRings: false, realMoons: 5 },
  { name: 'Ceres', surface: 'dwarf', realRadiusKm: 473, realOrbitAu: 2.77, tiltDeg: 4, dayHours: 9.1, colors: ['#9A9086', '#6B635B', '#C4BCB2'], hasRings: false, realMoons: 0 },
  { name: 'Haumea', surface: 'dwarf', realRadiusKm: 780, realOrbitAu: 43.1, tiltDeg: 126, dayHours: 3.9, colors: ['#D6D2CC', '#9C9892', '#F2F0EC'], hasRings: true, realMoons: 2 },
  { name: 'Makemake', surface: 'dwarf', realRadiusKm: 715, realOrbitAu: 45.8, tiltDeg: 29, dayHours: 22.5, colors: ['#C2724B', '#8E4F32', '#E4A184'], hasRings: false, realMoons: 1 },
  { name: 'Eris', surface: 'dwarf', realRadiusKm: 1163, realOrbitAu: 67.8, tiltDeg: 44, dayHours: 25.9, colors: ['#D8D8D8', '#A0A0A0', '#F5F5F5'], hasRings: false, realMoons: 1 },
  { name: 'Sedna', surface: 'dwarf', realRadiusKm: 500, realOrbitAu: 76.0, tiltDeg: 0, dayHours: 10.3, colors: ['#B3543C', '#7E3527', '#DC8467'], hasRings: false, realMoons: 0 },
];

/** Scene units. The star's photosphere is 2.15, so the first orbit clears it. */
export const INNER_ORBIT = 4.4;
export const ORBIT_STEP = 1.12;
export const MIN_PLANET_RADIUS = 0.38;
export const MAX_PLANET_RADIUS = 1.02;

export interface PlanetMoon {
  id: string;
  /** The dependency this moon represents. */
  label: string;
  /** True when the module had no real dependency and we minted one. */
  invented: boolean;
  radius: number;
  orbitRadius: number;
  /** Radians per second. */
  speed: number;
  /** Orbit plane tilt, so moons do not all share one disc. */
  inclination: number;
  phase: number;
  color: string;
}

export interface PlanetAssignment {
  moduleKey: TabId;
  label: string;
  body: PlanetBody;
  /** Compressed display radius, scene units. */
  radius: number;
  /** Compressed orbital radius, scene units. */
  orbitRadius: number;
  /** Orbit plane inclination in radians. */
  inclination: number;
  /** Starting angle, radians. */
  phase: number;
  /** Orbital angular velocity, radians/sec — outer bodies move slower. */
  orbitSpeed: number;
  /** Spin rate, radians/sec; negative for retrograde bodies. */
  speed: number;
  spinSpeed: number;
  moons: PlanetMoon[];
}

/** Cube-root compression: keeps ordering and the giant/rocky split, loses the
 *  extremes that would make the small bodies unclickable. */
function compress(value: number, min: number, max: number, outMin: number, outMax: number): number {
  const t = (Math.cbrt(value) - Math.cbrt(min)) / (Math.cbrt(max) - Math.cbrt(min));
  return outMin + t * (outMax - outMin);
}

const MOON_COLORS = ['#D8D3CB', '#B9C4CE', '#E0C9A6', '#C9D8D3', '#CBBFD8'];

/**
 * Moons carry the module's dependencies. A module whose dependencies are all
 * satisfied still gets its moons — they are the things it runs on, not a list
 * of problems — and a module with no declared dependency gets one minted moon
 * so no planet orbits alone.
 */
export function moonsFor(
  moduleKey: TabId,
  planetRadius: number,
  status?: ModuleStatus
): PlanetMoon[] {
  const dependencies = status?.dependencies?.length
    ? status.dependencies
    : [`${moduleKey.toUpperCase()} runtime`];
  const invented = !status?.dependencies?.length;

  return dependencies.slice(0, 4).map((label, i) => {
    // Deterministic per module+index: the same moon every mount.
    const seed = Math.abs(Math.sin(moduleKey.length * 12.9898 + i * 78.233) * 43758.5453) % 1;
    return {
      id: `${moduleKey}-moon-${i}`,
      label,
      invented,
      radius: planetRadius * (0.17 + seed * 0.09),
      // Close in: at true scale a moon would sit outside the next planet's orbit.
      orbitRadius: planetRadius * (1.6 + i * 0.38 + seed * 0.12),
      speed: 0.55 - i * 0.09 + seed * 0.15,
      inclination: (seed - 0.5) * 0.9,
      phase: seed * Math.PI * 2,
      color: MOON_COLORS[i % MOON_COLORS.length],
    };
  });
}

const RADII = PLANET_BODIES.map((b) => b.realRadiusKm);
const MIN_KM = Math.min(...RADII);
const MAX_KM = Math.max(...RADII);

/**
 * One planet per module, in sidebar order, each on its own orbit.
 * `statuses` supplies the dependency list for the moons; without it every
 * planet still gets its minted moon.
 */
export function assignPlanets(statuses: ModuleStatus[] = []): PlanetAssignment[] {
  const byModule = new Map(statuses.map((s) => [s.moduleKey, s]));

  return GROWTH_MATRIX_MODULES.map((mod, index) => {
    const body = PLANET_BODIES[index % PLANET_BODIES.length];
    const radius = compress(body.realRadiusKm, MIN_KM, MAX_KM, MIN_PLANET_RADIUS, MAX_PLANET_RADIUS);
    const orbitRadius = INNER_ORBIT + index * ORBIT_STEP;

    // Kepler's third law in spirit: outer orbits are slower. Scaled to a full
    // inner lap in about 40 seconds so the system reads as moving, not racing.
    const orbitSpeed = 0.16 * Math.pow(INNER_ORBIT / orbitRadius, 1.5);
    // Real day length, compressed: a fast spinner still visibly out-turns a slow one.
    const spinSpeed = (body.dayHours < 0 ? -1 : 1) * (0.9 / Math.max(1, Math.cbrt(Math.abs(body.dayHours))));

    return {
      moduleKey: mod.moduleKey,
      label: mod.label,
      body,
      radius,
      orbitRadius,
      // Spread the orbits out of a single plane; real inclinations are small,
      // this is exaggerated so the discs read as separate.
      inclination: ((index % 5) - 2) * 0.055,
      phase: (index / GROWTH_MATRIX_MODULES.length) * Math.PI * 2,
      orbitSpeed,
      speed: orbitSpeed,
      spinSpeed,
      moons: moonsFor(mod.moduleKey, radius, byModule.get(mod.moduleKey)),
    };
  });
}

/** Position of a planet at `elapsed` seconds. `moving: false` freezes the phase. */
export function planetPosition(
  planet: PlanetAssignment,
  elapsed: number,
  moving: boolean
): [number, number, number] {
  const angle = planet.phase + (moving ? elapsed * planet.orbitSpeed : 0);
  return [
    Math.cos(angle) * planet.orbitRadius,
    Math.sin(angle) * planet.orbitRadius * Math.sin(planet.inclination),
    Math.sin(angle) * planet.orbitRadius * Math.cos(planet.inclination),
  ];
}

/** Furthest extent of the planetary system, for camera framing. */
export function systemRadius(planets: PlanetAssignment[] = assignPlanets()): number {
  // Orbit, plus the body, plus room for its moons and billboard label.
  return planets.reduce((max, p) => Math.max(max, p.orbitRadius + p.radius * 2 + 0.9), 0);
}
