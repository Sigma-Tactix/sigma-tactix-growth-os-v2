import { describe, it, expect } from 'vitest';
import {
  assignPlanets,
  planetPosition,
  systemRadius,
  moonsFor,
  PLANET_BODIES,
  INNER_ORBIT,
  MIN_PLANET_RADIUS,
  MAX_PLANET_RADIUS,
} from './hologramPlanets';
import { GROWTH_MATRIX_MODULES, CORE_RADIUS } from './hologramGraph';
import { deriveModuleStatuses } from './hologramTelemetry';

describe('planetary assignment', () => {
  const planets = assignPlanets();

  it('gives every module its own body', () => {
    expect(planets).toHaveLength(GROWTH_MATRIX_MODULES.length);
    expect(new Set(planets.map((p) => p.body.name)).size).toBe(planets.length);
    expect(PLANET_BODIES.length).toBeGreaterThanOrEqual(GROWTH_MATRIX_MODULES.length);
  });

  it('orders bodies outward from the star, clear of the photosphere', () => {
    for (let i = 1; i < planets.length; i++) {
      expect(planets[i].orbitRadius).toBeGreaterThan(planets[i - 1].orbitRadius);
    }
    expect(planets[0].orbitRadius - planets[0].radius).toBeGreaterThan(CORE_RADIUS);
    expect(INNER_ORBIT).toBeGreaterThan(CORE_RADIUS);
  });

  it('compresses radii but keeps the real ordering', () => {
    for (const p of planets) {
      expect(p.radius).toBeGreaterThanOrEqual(MIN_PLANET_RADIUS - 1e-9);
      expect(p.radius).toBeLessThanOrEqual(MAX_PLANET_RADIUS + 1e-9);
    }
    const jupiter = planets.find((p) => p.body.name === 'Jupiter')!;
    const mercury = planets.find((p) => p.body.name === 'Mercury')!;
    const earth = planets.find((p) => p.body.name === 'Earth')!;
    expect(jupiter.radius).toBeGreaterThan(earth.radius);
    expect(earth.radius).toBeGreaterThan(mercury.radius);
  });

  it('keeps outer orbits slower than inner ones', () => {
    for (let i = 1; i < planets.length; i++) {
      expect(planets[i].orbitSpeed).toBeLessThan(planets[i - 1].orbitSpeed);
    }
  });

  it('spins Venus and Uranus backwards, as they really do', () => {
    const venus = planets.find((p) => p.body.name === 'Venus')!;
    const uranus = planets.find((p) => p.body.name === 'Uranus')!;
    const earth = planets.find((p) => p.body.name === 'Earth')!;
    expect(venus.spinSpeed).toBeLessThan(0);
    expect(uranus.spinSpeed).toBeLessThan(0);
    expect(earth.spinSpeed).toBeGreaterThan(0);
  });
});

describe('moons carry dependencies', () => {
  it('turns each real dependency into a moon', () => {
    const statuses = deriveModuleStatuses({ now: Date.parse('2026-08-27T12:00:00Z') });
    const content = statuses.find((s) => s.moduleKey === 'content')!;
    expect(content.dependencies.length).toBeGreaterThan(1);

    const planets = assignPlanets(statuses);
    const contentPlanet = planets.find((p) => p.moduleKey === 'content')!;
    expect(contentPlanet.moons).toHaveLength(content.dependencies.length);
    expect(contentPlanet.moons.map((m) => m.label)).toEqual(content.dependencies);
    expect(contentPlanet.moons.every((m) => !m.invented)).toBe(true);
  });

  it('mints one moon when a module declares no dependency', () => {
    const moons = moonsFor('social', 0.5);
    expect(moons).toHaveLength(1);
    expect(moons[0].invented).toBe(true);
  });

  it('keeps moons outside their planet and inside its neighbours', () => {
    const planets = assignPlanets(deriveModuleStatuses({}));
    for (const planet of planets) {
      for (const moon of planet.moons) {
        expect(moon.orbitRadius).toBeGreaterThan(planet.radius);
        expect(moon.radius).toBeLessThan(planet.radius);
      }
    }
  });

  it('produces the same moons on every call', () => {
    expect(moonsFor('crm', 0.5)).toEqual(moonsFor('crm', 0.5));
  });
});

describe('orbital motion', () => {
  const planets = assignPlanets();

  it('holds position when motion is off', () => {
    const planet = planets[2];
    expect(planetPosition(planet, 0, false)).toEqual(planetPosition(planet, 99, false));
  });

  it('moves the planet when motion is on', () => {
    const planet = planets[2];
    const start = planetPosition(planet, 0, true);
    const later = planetPosition(planet, 8, true);
    expect(later).not.toEqual(start);
  });

  it('stays on its own orbit while moving', () => {
    for (const planet of planets) {
      const [x, y, z] = planetPosition(planet, 12.5, true);
      expect(Math.hypot(x, y, z)).toBeCloseTo(planet.orbitRadius, 5);
    }
  });

  it('reports a system radius that contains every body', () => {
    const radius = systemRadius(planets);
    for (const planet of planets) {
      expect(planet.orbitRadius + planet.radius).toBeLessThanOrEqual(radius);
    }
  });
});
