/**
 * Growth Matrix — module graph and camera math.
 *
 * The 3D visualizer used to carry its own hand-written list of 12 modules, which
 * drifted the moment `GROWTH_MODULES` grew (Agentic AI Cockpit and OS Simulation
 * Center existed in the sidebar but not in the orbit). The orbit is now derived
 * from `GROWTH_MODULES`, so a module added to the nav appears in the Matrix and
 * routes back to its own tab. `HOLO_MODULE_META` must cover every growth module
 * except `hologram` itself — `hologramGraph.test.ts` fails if it does not.
 *
 * Kept free of three.js/react imports so the graph and framing rules are testable
 * without a WebGL context.
 */
import { GROWTH_MODULES, type TabId } from '../components/shell/navigation';

export interface HoloNode3D {
  id: string;
  label: string;
  type: 'core' | 'module' | 'vault' | 'agent' | 'connector';
  tier?: string;
  description: string;
  color: string;
  size: number;
  position: [number, number, number];
  subKey?: string;
  moduleKey?: string;
  metrics?: Record<string, string | number>;
}

export interface HoloLink3D {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active?: boolean;
}

export interface HoloModuleDef {
  id: string;
  /** The nav `TabId` this node launches — the link back into the cockpit. */
  moduleKey: TabId;
  label: string;
  color: string;
  tier: string;
  description: string;
  metrics: Record<string, string | number>;
}

/** Module ids that are not satellites: the Matrix does not orbit itself. */
export const EXCLUDED_FROM_ORBIT: TabId[] = ['hologram'];

export const CORE_NODE_ID = 'core-celestial';
export const ORBIT_RADIUS = 8.6;
/** Photosphere radius of the central star. Filaments start on the surface. */
export const CORE_RADIUS = 2.15;
/** Orbit radius plus node radius and billboard labels — what the camera must frame. */
export const SCENE_RADIUS = 11.6;

/**
 * Per-module visual identity and telemetry. Keyed by `TabId` so a nav rename
 * cannot silently orphan an entry.
 */
export const HOLO_MODULE_META: Partial<Record<TabId, Omit<HoloModuleDef, 'id' | 'moduleKey' | 'label'>>> = {
  overview: {
    color: '#FF481B', // Sigma Orange
    tier: 'wisdom',
    description: 'Executive command dashboard displaying real-time Growth Scores, priority diagnostic findings, and multi-channel metrics.',
    metrics: { DATA_FEED: 'Audit vault + channel metrics' },
  },
  roadmap: {
    color: '#38BDF8', // Aqua
    tier: 'wisdom',
    description: 'Autonomous strategic execution timeline with prioritized milestone sprints across brand, SEO, ads, and conversion funnels.',
    metrics: { DATA_FEED: 'Audit findings + milestone plan' },
  },
  brain: {
    color: '#8B5CF6', // Signal Violet
    tier: 'wisdom',
    description: 'Central contextual knowledge matrix housing all 10 Relational Vaults, encrypted credentials, and SOP guidelines.',
    metrics: { DATA_FEED: '10 relational vaults + uploads' },
  },
  growth: {
    color: '#00E5FF', // Cyan
    tier: 'processing',
    description: 'AI-driven fullstack diagnostic engine analyzing acquisition funnels, conversion friction, and growth bottlenecks.',
    metrics: { DATA_FEED: 'Website vault + crawl results' },
  },
  uiux: {
    color: '#35C9A5', // Signal Mint
    tier: 'processing',
    description: 'Automated visual hierarchy, typography contrast, mobile responsiveness, and interaction friction audit suite.',
    metrics: { DATA_FEED: 'Website vault + headless capture' },
  },
  content: {
    color: '#E040FB', // Neon Magenta
    tier: 'project',
    description: 'High-velocity AI copy generation, content asset pipeline, and omnichannel campaign playbook studio.',
    metrics: { DATA_FEED: 'Brand vault + customer vault' },
  },
  performance: {
    color: '#FF2A85', // Vivid Fuchsia
    tier: 'project',
    description: 'Paid media budget pacing, ROAS forecasting, ad spend allocation, and cross-channel campaign optimization.',
    metrics: { DATA_FEED: 'Ad platform credentials' },
  },
  reporting: {
    color: '#4F7CFF', // Signal Blue
    tier: 'wisdom',
    description: 'Unified client reporting, automated executive summaries, and multi-touch attribution analytics.',
    metrics: { DATA_FEED: 'Analytics property + connectors' },
  },
  authority: {
    color: '#F59E0B', // Amber
    tier: 'wisdom',
    description: 'Keyword dominance tracking, search ranking velocity, backlink index, and organic authority moat.',
    metrics: { DATA_FEED: 'Authority vault keywords' },
  },
  crm: {
    color: '#10B981', // Emerald
    tier: 'project',
    description: 'Ideal Customer Profile (ICP) lead scoring, pipeline health tracking, and deal conversion velocity.',
    metrics: { DATA_FEED: 'CRM credentials + pipeline sync' },
  },
  competitors: {
    color: '#EC4899', // Pink
    tier: 'processing',
    description: 'Continuous intelligence tracking competitor ad creatives, pricing shifts, and technology stack changes.',
    metrics: { DATA_FEED: 'Brand positioning + competitor set' },
  },
  social: {
    color: '#6366F1', // Indigo
    tier: 'ingestion',
    description: 'Brand sentiment monitoring, social mention velocity, and audience reaction telemetry.',
    metrics: { DATA_FEED: 'Social credentials + mention stream' },
  },
  agents: {
    color: '#22D3EE', // Signal Ice
    tier: 'processing',
    description: 'Autonomous agent fleet with RBAC scopes and human-in-the-loop approval on every external action.',
    metrics: { DATA_FEED: 'AI workflow vault + HITL queue' },
  },
  simulation: {
    color: '#A3E635', // Lime
    tier: 'processing',
    description: 'Scenario sandbox projecting budget, channel mix, and roadmap changes before they touch a live workspace.',
    metrics: { DATA_FEED: 'Audit baseline + scenario inputs' },
  },
};

/**
 * The orbit, in sidebar order. One satellite per growth module, so every node
 * has a real destination and no module is missing from the architecture view.
 */
export const GROWTH_MATRIX_MODULES: HoloModuleDef[] = GROWTH_MODULES
  .filter((item) => !EXCLUDED_FROM_ORBIT.includes(item.id))
  .map((item) => {
    const meta = HOLO_MODULE_META[item.id];
    if (!meta) {
      throw new Error(
        `hologramGraph: no HOLO_MODULE_META entry for nav module "${item.id}". ` +
        'Add one, or list the id in EXCLUDED_FROM_ORBIT.'
      );
    }
    return {
      id: `mod-${item.id}`,
      moduleKey: item.id,
      label: item.label,
      ...meta,
    };
  });

/** Deterministic satellite position for the module at `index`. */
export function orbitPosition(index: number, total: number, radius = ORBIT_RADIUS): [number, number, number] {
  const angle = (index / total) * Math.PI * 2;
  return [
    Math.cos(angle) * radius,
    Math.sin(index * 1.6) * 1.5,
    Math.sin(angle) * radius,
  ];
}

/**
 * Central core plus one satellite and one filament per module.
 * `selectedId` only marks a link active; it never changes the graph shape.
 */
export function buildHoloGraph(
  selectedId: string | null = null,
  live?: {
    /** Real counts for the core node, from lib/hologramTelemetry. */
    coreMetrics?: Record<string, string | number>;
    /** Real per-module telemetry, keyed by moduleKey. */
    moduleMetrics?: Record<string, Record<string, string | number>>;
    /** Planet positions, keyed by moduleKey. The scene owns the layout once
     *  modules are on their own orbits (see lib/hologramPlanets). */
    positions?: Record<string, [number, number, number]>;
  }
): {
  nodes: HoloNode3D[];
  links: HoloLink3D[];
} {
  const nodes: HoloNode3D[] = [
    {
      id: CORE_NODE_ID,
      label: 'Sigma Neural Core',
      type: 'core',
      color: '#FF481B', // Sigma Orange — the star at the centre of the system
      size: 68,
      position: [0, 0, 0],
      description: `The central intelligence coordinating all ${GROWTH_MATRIX_MODULES.length} Growth OS modules, 10 Relational Vaults, and every agent run.`,
      metrics: live?.coreMetrics ?? { MODULES: GROWTH_MATRIX_MODULES.length },
    },
  ];
  const links: HoloLink3D[] = [];

  GROWTH_MATRIX_MODULES.forEach((mod, idx) => {
    const position = live?.positions?.[mod.moduleKey] ?? orbitPosition(idx, GROWTH_MATRIX_MODULES.length);
    // Filaments leave the star's surface, not its centre, so they read as
    // erupting from the photosphere rather than passing through it.
    const length = Math.hypot(position[0], position[1], position[2]) || 1;
    const surface: [number, number, number] = [
      (position[0] / length) * CORE_RADIUS,
      (position[1] / length) * CORE_RADIUS,
      (position[2] / length) * CORE_RADIUS,
    ];

    nodes.push({
      id: mod.id,
      moduleKey: mod.moduleKey,
      label: mod.label,
      type: 'module',
      tier: mod.tier,
      color: mod.color,
      size: 38,
      position,
      description: mod.description,
      metrics: live?.moduleMetrics?.[mod.moduleKey] ?? mod.metrics,
    });

    links.push({
      id: `link-core-${mod.id}`,
      from: surface,
      to: position,
      color: mod.color,
      active: selectedId === mod.id,
    });
  });

  return { nodes, links };
}

/**
 * Distance that fits a sphere of `sceneRadius` in both axes of the viewport.
 * A fixed camera z pushed the outer modules off-screen whenever the panel was
 * narrower than it was tall, which is the default with the sidebar open.
 */
export function computeCameraFit(
  fovDegrees: number,
  width: number,
  height: number,
  sceneRadius = SCENE_RADIUS,
  /** Half-height of the scene. The planetary system is a disc, so framing it as
   *  a sphere pushed the camera ~30% further back than it needed to be. */
  verticalRadius = sceneRadius
): { dist: number; y: number } {
  const vFov = (fovDegrees * Math.PI) / 180;
  const aspect = Math.max(0.35, width / Math.max(1, height));
  const distV = verticalRadius / Math.tan(vFov / 2);
  const distH = sceneRadius / (Math.tan(vFov / 2) * aspect);
  const dist = Math.max(distV, distH);
  return { dist, y: dist * 0.34 };
}
