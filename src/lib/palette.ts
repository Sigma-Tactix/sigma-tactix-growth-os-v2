/**
 * The only place in `src/` allowed to contain a raw hex value.
 *
 * SVG attributes (`fill`, `stroke`), canvas (html2canvas) and Recharts props take
 * resolved color strings, not Tailwind classes — so those call sites cannot use the
 * `@theme` tokens directly. Every value below mirrors a token declared in
 * `src/index.css`; change one and change the other.
 *
 * See `steering/design-system.md`. The guardrail grep only catches Tailwind's bracket
 * syntax (`bg-[#…]`), which is why 37 bare literals accumulated across the graph and
 * chart surfaces without tripping it — advisory finding A-8.
 */

/** Stitch core palette, verbatim. */
export const CORE = {
  black: '#000000',
  white: '#FFFFFF',
  brand: '#FF481B',
  brandStrong: '#E03A10',
} as const;

/** Neutral ramp. The 50/100/300/500/900 steps are the spec's locked values. */
export const NEUTRAL = {
  50: '#FAFAFA',
  100: '#F0F0F0',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#B0B0B0',
  500: '#8A8A8A',
  600: '#6B6B6B',
  700: '#3D3D3D',
  800: '#262626',
  900: '#1A1A1A',
  950: '#0A0A0A',
} as const;

/** Dashboard extension: muted status semantics. Never used as accents. */
export const STATUS = {
  positive: '#059669', // emerald-600
  caution: '#D97706',  // amber-600
  critical: '#BA1A1A', // rose-600 — the spec's error red
} as const;

/**
 * Second Brain graph, keyed by node type.
 *
 * Hue is deliberately NOT the type encoding here. The spec allows black/white, one
 * accent and five neutrals; ten rainbow hues (teal/blue/pink/violet/cyan/lime…) were
 * outside it entirely. Type now reads as *structural depth* down the neutral ramp —
 * hub is the anchor, vaults are containers, leaves get progressively lighter — and the
 * three sanctioned status colors are spent only where they carry real meaning:
 * credentials are a security surface, workflows are live automation, logs want
 * attention.
 *
 * Orange is absent on purpose. It stays reserved for the selected node, so the accent
 * keeps its one job and appears once per viewport.
 */
export const GRAPH_NODE = {
  hub: CORE.black,
  vault: NEUTRAL[900],
  file: NEUTRAL[700],
  tool: NEUTRAL[600],
  sop: NEUTRAL[500],
  connector: NEUTRAL[400],
  keyword: NEUTRAL[300],
  credential: STATUS.critical,
  workflow: STATUS.positive,
  log: STATUS.caution,
} as const;

/** Graph chrome: links, node outlines, labels. */
export const GRAPH = {
  link: NEUTRAL[300],
  linkActive: CORE.brand,
  nodeStroke: CORE.white,
  nodePip: CORE.white,
  selectedRing: CORE.brand,
  label: NEUTRAL[700],
  labelSelected: CORE.black,
} as const;

/**
 * Explicit, scoped exception to the black/white/neutral+brand-orange rule above.
 *
 * Applies ONLY to the 3D Brain Graph tiered-ring visualization
 * (`BrainGraph3D.tsx`) — nowhere else in `src/` may read from this object.
 * The 3D view encodes a real structural axis (raw intake -> AI processing ->
 * active project -> finalized wisdom) that the flat 2D graph's neutral-ramp
 * depth encoding can't carry once nodes are spread across a vertical stack;
 * four hues read that axis at a glance in a way grayscale can't in a
 * rotating/immersive scene. Every other surface in this app — including the
 * rest of the graph's own type-color legend above — stays on the locked
 * palette.
 */
export const BRAIN_TIER = {
  ingestion: { base: '#FF6A3D', glow: '#FFB088', ring: '#E5502A', label: 'Ingestion Vault' },
  processing: { base: '#E8C547', glow: '#FFF2B0', ring: '#C9A62E', label: 'Processing Vault' },
  project: { base: '#3DBEEE', glow: '#A6E6FF', ring: '#2196C9', label: 'Project Vault' },
  wisdom: { base: '#9B6BE0', glow: '#D3B8FF', ring: '#7C4FC4', label: 'Wisdom Vault' },
} as const;

export type BrainTierKey = keyof typeof BRAIN_TIER;

/**
 * Recharts series ramp. Deliberately monochrome after the first series: a report is
 * read for shape, not for hue, and the export path renders to PDF where color is
 * unreliable. `accent` is chosen by the report's own theme setting.
 */
export const CHART = {
  accentFor: (theme: string): string =>
    theme === 'black' ? CORE.black : theme === 'grey' ? NEUTRAL[500] : STATUS.positive,
  secondary: NEUTRAL[900],
  series: [NEUTRAL[900], NEUTRAL[500], NEUTRAL[300]] as const,
  axis: NEUTRAL[500],
  exportBackground: CORE.white,
} as const;
