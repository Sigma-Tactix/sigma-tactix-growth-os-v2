import {
  ShieldCheck,
  Search,
  Compass,
  Sparkles,
  CheckCircle,
  Play,
  BarChart2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export type LifecycleStageId =
  | 'setup'
  | 'understand'
  | 'plan'
  | 'create'
  | 'review'
  | 'execute'
  | 'measure'
  | 'learn';

export interface LifecycleStage {
  id: LifecycleStageId;
  order: number;
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  primaryRoute: string;
  deliverables: string[];
  icon: LucideIcon;
  relatedModuleKeys: string[];
}

export const MARKETING_LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'setup',
    order: 1,
    label: '1. Setup',
    shortLabel: 'Setup',
    tagline: 'Client Enclave, verified credentials, and storage boundaries',
    description: 'Establish isolated client workspace, verified API credentials, and sovereign vault partitions.',
    primaryRoute: '/vaults',
    deliverables: ['Client Enclave Isolation', 'Verified Connector Credentials', 'Sovereign Vault Routing'],
    icon: ShieldCheck,
    relatedModuleKeys: ['tenants', 'vaults', 'connectors'],
  },
  {
    id: 'understand',
    order: 2,
    label: '2. Understand',
    shortLabel: 'Understand',
    tagline: 'Market simulation, competitor intelligence, and search baseline',
    description: 'Analyze market dynamics, adversary positioning, search engine queries, and answer engine citation share.',
    primaryRoute: '/suite/intelligence?tab=intel-simulator',
    deliverables: ['Market Scenario Simulation', 'Competitor Battlecard', 'Search & Citation Baseline'],
    icon: Search,
    relatedModuleKeys: ['intel-simulator', 'intel-competitors', 'search-seo-aeo'],
  },
  {
    id: 'plan',
    order: 3,
    label: '3. Plan',
    shortLabel: 'Plan',
    tagline: 'Growth audit, revenue targets, and target ICP definition',
    description: 'Identify highest-leverage conversion friction points, model revenue targets, and define audience ICPs.',
    primaryRoute: '/diagnostics',
    deliverables: ['Calibrated Growth Diagnostic', 'Target ICP Definition', 'Prioritized Action Plan'],
    icon: Compass,
    relatedModuleKeys: ['diagnostics', 'demand-outreach'],
  },
  {
    id: 'create',
    order: 4,
    label: '4. Create',
    shortLabel: 'Create',
    tagline: 'Editorial articles, visual assets, video storyboards, and landing pages',
    description: 'Synthesize authoritative articles, campaign visual assets, deterministic video cuts, and conversion landing pages.',
    primaryRoute: '/suite/creative?tab=creative-editorial',
    deliverables: ['Editorial Draft & Repurposed Decks', 'Campaign Imagery', 'Deterministic Video Scene', 'Tailwind Landing Package'],
    icon: Sparkles,
    relatedModuleKeys: ['creative-editorial', 'creative-image', 'creative-video', 'search-cro'],
  },
  {
    id: 'review',
    order: 5,
    label: '5. Review',
    shortLabel: 'Review',
    tagline: 'Brand voice alignment, evidence inspection, and operator sign-off',
    description: 'Enforce human-in-the-loop review, verify tone alignment against Brand Vault vectors, and approve pending actions.',
    primaryRoute: '/queue',
    deliverables: ['Operator Approval Signature', 'Brand Voice Compliance Audit', 'Cryptographic Action Receipt'],
    icon: CheckCircle,
    relatedModuleKeys: ['queue', 'vanta'],
  },
  {
    id: 'execute',
    order: 6,
    label: '6. Execute',
    shortLabel: 'Execute',
    tagline: 'Guarded social distribution, ad budget pacing, and inbound intake',
    description: 'Publish approved multi-channel posts, execute ad pacing adjustments with hard budget caps, and qualify inbound leads.',
    primaryRoute: '/suite/social?tab=social-publishing',
    deliverables: ['Social Carousel Dispatch Receipt', 'Ad Budget Mutation Record', 'Sub-60s Inbound Qualification'],
    icon: Play,
    relatedModuleKeys: ['social-publishing', 'paid-ads', 'demand-intake'],
  },
  {
    id: 'measure',
    order: 7,
    label: '7. Measure',
    shortLabel: 'Measure',
    tagline: 'Blended CAC, multi-channel ROAS, and conversion attribution',
    description: 'Reconcile ad spend against verified conversion records, compute blended unit economics, and export client reports.',
    primaryRoute: '/attribution',
    deliverables: ['Blended CAC Ledger', 'Cross-Channel Attribution Matrix', 'Immutable PDF/PPTX/XLSX Deliverables'],
    icon: BarChart2,
    relatedModuleKeys: ['measurement', 'reports'],
  },
  {
    id: 'learn',
    order: 8,
    label: '8. Learn',
    shortLabel: 'Learn',
    tagline: 'Team retrospectives, knowledge vault capture, and policy updates',
    description: 'Record verified campaign outcomes, update institutional memory in Knowledge Vault, and refine calibration baselines.',
    primaryRoute: '/team-learnings',
    deliverables: ['Validated Growth Retrospective', 'Knowledge Vault Asset', 'Decision Engine Weight Refinement'],
    icon: BookOpen,
    relatedModuleKeys: ['team-learnings'],
  },
];

export function getLifecycleStage(id: string): LifecycleStage | undefined {
  return MARKETING_LIFECYCLE_STAGES.find((s) => s.id === id);
}

export function getStageForModule(moduleKey: string): LifecycleStage {
  for (const stage of MARKETING_LIFECYCLE_STAGES) {
    if (stage.relatedModuleKeys.some((k) => k.toLowerCase() === moduleKey.toLowerCase())) {
      return stage;
    }
  }
  return MARKETING_LIFECYCLE_STAGES[0]; // Default to Setup
}
