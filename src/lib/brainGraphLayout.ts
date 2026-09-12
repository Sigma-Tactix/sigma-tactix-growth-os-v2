import { BrainTierKey } from './palette';

// Pure layout constants, kept out of BrainGraph3D.tsx on purpose: that module
// pulls in three.js/@react-three/fiber/drei/gsap (~2MB), so anything that
// only needs these numbers (BrainGraphView's data-layout useMemo) must not
// import from it, or the lazy-loaded 3D chunk would load eagerly anyway.
export const TIER_ORDER: BrainTierKey[] = ['ingestion', 'processing', 'project', 'wisdom'];
export const TIER_SPACING = 4.6;
export const RING_RADIUS = 5.4;

export const tierY = (tier: BrainTierKey) => TIER_ORDER.indexOf(tier) * TIER_SPACING;
