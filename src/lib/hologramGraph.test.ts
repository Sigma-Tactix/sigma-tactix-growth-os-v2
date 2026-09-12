import { describe, it, expect } from 'vitest';
import {
  GROWTH_MATRIX_MODULES,
  HOLO_MODULE_META,
  EXCLUDED_FROM_ORBIT,
  CORE_NODE_ID,
  ORBIT_RADIUS,
  CORE_RADIUS,
  SCENE_RADIUS,
  buildHoloGraph,
  computeCameraFit,
  orbitPosition,
} from './hologramGraph';
import { GROWTH_MODULES, type TabId } from '../components/shell/navigation';

const orbitable = GROWTH_MODULES.filter((m) => !EXCLUDED_FROM_ORBIT.includes(m.id));

describe('Growth Matrix — module linkage', () => {
  it('orbits every growth module in the sidebar, in sidebar order', () => {
    expect(GROWTH_MATRIX_MODULES.map((m) => m.moduleKey)).toEqual(orbitable.map((m) => m.id));
  });

  it('excludes the Matrix itself so it does not orbit its own core', () => {
    expect(GROWTH_MATRIX_MODULES.some((m) => m.moduleKey === 'hologram')).toBe(false);
  });

  it('routes every satellite to a real cockpit tab', () => {
    const navIds = new Set<TabId>(GROWTH_MODULES.map((m) => m.id));
    for (const mod of GROWTH_MATRIX_MODULES) {
      expect(navIds.has(mod.moduleKey)).toBe(true);
    }
  });

  it('labels satellites with the sidebar label so the two views cannot disagree', () => {
    for (const mod of GROWTH_MATRIX_MODULES) {
      const nav = GROWTH_MODULES.find((m) => m.id === mod.moduleKey);
      expect(mod.label).toBe(nav?.label);
    }
  });

  it('carries no orphan metadata for modules the nav does not have', () => {
    const navIds = new Set<string>(GROWTH_MODULES.map((m) => m.id));
    for (const key of Object.keys(HOLO_MODULE_META)) {
      expect(navIds.has(key)).toBe(true);
    }
  });

  it('gives the inspector something real to render for every module', () => {
    for (const mod of GROWTH_MATRIX_MODULES) {
      expect(mod.description.length).toBeGreaterThan(20);
      expect(Object.keys(mod.metrics).length).toBeGreaterThan(0);
      expect(mod.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(mod.tier).toBeTruthy();
    }
  });

  it('assigns each satellite a distinct id', () => {
    const ids = GROWTH_MATRIX_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Growth Matrix — graph construction', () => {
  const { nodes, links } = buildHoloGraph();

  it('builds one core plus one satellite per module', () => {
    expect(nodes).toHaveLength(GROWTH_MATRIX_MODULES.length + 1);
    expect(nodes.filter((n) => n.type === 'core')).toHaveLength(1);
    expect(nodes.filter((n) => n.type === 'module')).toHaveLength(GROWTH_MATRIX_MODULES.length);
    expect(nodes[0].id).toBe(CORE_NODE_ID);
  });

  it('connects every satellite back to the core with its own filament', () => {
    expect(links).toHaveLength(GROWTH_MATRIX_MODULES.length);
    for (const link of links) {
      // Starts on the photosphere, pointing at its own module.
      const [fx, fy, fz] = link.from;
      expect(Math.hypot(fx, fy, fz)).toBeCloseTo(CORE_RADIUS, 5);
      const [tx, ty, tz] = link.to;
      const dot = (fx * tx + fy * ty + fz * tz) / (Math.hypot(fx, fy, fz) * Math.hypot(tx, ty, tz));
      expect(dot).toBeCloseTo(1, 5);
    }
    const targets = links.map((l) => l.to.join(','));
    expect(new Set(targets).size).toBe(links.length);
  });

  it('places every satellite on the orbit radius', () => {
    for (const node of nodes.filter((n) => n.type === 'module')) {
      const [x, , z] = node.position;
      expect(Math.hypot(x, z)).toBeCloseTo(ORBIT_RADIUS, 5);
    }
  });

  it('keeps every node inside the radius the camera frames', () => {
    for (const node of nodes) {
      const [x, y, z] = node.position;
      expect(Math.hypot(x, y, z)).toBeLessThan(SCENE_RADIUS);
    }
  });

  it('activates only the selected module’s filament', () => {
    const target = GROWTH_MATRIX_MODULES[3];
    const selected = buildHoloGraph(target.id);
    const active = selected.links.filter((l) => l.active);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(`link-core-${target.id}`);
  });

  it('does not change the graph shape when a node is selected', () => {
    const selected = buildHoloGraph(GROWTH_MATRIX_MODULES[0].id);
    expect(selected.nodes.map((n) => n.id)).toEqual(nodes.map((n) => n.id));
  });

  it('spaces satellites evenly around the ring', () => {
    const total = 4;
    const angles = Array.from({ length: total }, (_, i) => {
      const [x, , z] = orbitPosition(i, total);
      return Math.atan2(z, x);
    });
    expect(angles[0]).toBeCloseTo(0, 5);
    expect(angles[1]).toBeCloseTo(Math.PI / 2, 5);
  });
});

describe('Growth Matrix — camera framing', () => {
  const FOV = 45;
  const halfExtents = (dist: number, width: number, height: number) => {
    const halfH = Math.tan((FOV * Math.PI) / 360) * dist;
    return { halfH, halfW: halfH * (width / height) };
  };

  // Regression: a fixed camera z framed the orbit only in a wide viewport. In the
  // 705x738 panel the outer modules fell outside the frustum.
  it.each([
    [705, 738],
    [420, 900],
    [1600, 700],
    [1200, 1200],
  ])('fits the whole scene at %ix%i', (width, height) => {
    const { dist } = computeCameraFit(FOV, width, height);
    const { halfW, halfH } = halfExtents(dist, width, height);
    expect(halfH).toBeGreaterThanOrEqual(SCENE_RADIUS - 1e-6);
    expect(halfW).toBeGreaterThanOrEqual(SCENE_RADIUS - 1e-6);
  });

  it('pulls the camera further back the narrower the panel gets', () => {
    const wide = computeCameraFit(FOV, 1600, 700).dist;
    const square = computeCameraFit(FOV, 900, 900).dist;
    const portrait = computeCameraFit(FOV, 705, 738).dist;
    const narrow = computeCameraFit(FOV, 420, 900).dist;
    expect(narrow).toBeGreaterThan(portrait);
    expect(portrait).toBeGreaterThan(square);
    // At or above 1:1 the vertical extent binds, so widening changes nothing.
    expect(square).toBeCloseTo(wide, 6);
  });

  it('keeps the camera above the orbit plane', () => {
    const { dist, y } = computeCameraFit(FOV, 705, 738);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(dist);
  });

  it('survives a zero-sized container instead of returning NaN', () => {
    const { dist, y } = computeCameraFit(FOV, 0, 0);
    expect(Number.isFinite(dist)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
    expect(dist).toBeGreaterThan(0);
  });
});
