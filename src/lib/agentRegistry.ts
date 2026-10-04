/**
 * The agent hierarchy — the single source of truth.
 *
 * Vanta (T0) owns seven system agents (T1), which between them own 39
 * sub-agents (T2). Sub-agents are scoped, bounded workers: they inherit their
 * owner's vault grants minus the secret vaults, and may never widen them.
 *
 * This file is the runtime mirror of `docs/AGENT_ARCHITECTURE.md`. Agent
 * markdown under `agents/` is GENERATED from it by
 * `scripts/generateAgentDocs.mjs` — never hand-edit those files, or the two
 * will drift.
 *
 * `agentRegistry.test.ts` cross-checks this file against the real RBAC matrix
 * in `agentPolicies.ts` and the category map in `decisionEngine.ts`.
 */

import type { CategoryKey } from './decisionEngine.js';

export type Tier = 0 | 1 | 2;
export type Plane = 'read' | 'write';

export const MASTER_AGENT_ID = 'VANTA';

export interface SubAgentSpec {
  /** Stable kebab-case id, unique across the hierarchy. */
  id: string;
  owner: SystemAgentId;
  /** One bounded responsibility. If it needs an "and", it is two sub-agents. */
  purpose: string;
  plane: Plane;
  inputContract: string;
  outputContract: string;
  timeoutMs: number;
}

export interface SystemAgentSpec {
  id: SystemAgentId;
  name: SystemAgentName;
  codename: string;
  mission: string;
  /** Mirrors AGENT_VAULT_POLICIES. Verified by test, never widened by hand. */
  vaultScope: string[];
  categories: CategoryKey[];
  entrySubAgent: string;
  subAgents: SubAgentSpec[];
}

export const SYSTEM_AGENT_NAMES = [
  'Marketing Agent',
  'AI SDR (Sales Agent)',
  'Customer Success Agent',
  'Operations Agent',
  'Audit Diagnostic Agent',
  'Creative Director Agent',
  'SEO & Authority Agent',
] as const;

export type SystemAgentName = (typeof SYSTEM_AGENT_NAMES)[number];
export type SystemAgentId = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7';

export const MASTER_AGENT = {
  id: MASTER_AGENT_ID,
  tier: 0 as Tier,
  codename: 'VANTA-00',
  name: 'VANTA Master Agent',
  mission:
    'Decompose operator intent into owned work, dispatch to the right system agent, and explain what happened. Never executes, never writes, never authorizes.',
  /** Metadata-only visibility. Content stays behind each owning agent. */
  vaultScope: [
    'Brand Vault', 'Customer Vault', 'Marketing Vault', 'Website Vault',
    'Authority Vault', 'Operations Vault', 'Audit Vault', 'AI Workflow Vault',
  ],
  blocked: ['Executive Vault', 'Credentials Vault'],
} as const;

function sub(
  id: string, owner: SystemAgentId, purpose: string, plane: Plane,
  inputContract: string, outputContract: string, timeoutMs = 30_000,
): SubAgentSpec {
  return { id, owner, purpose, plane, inputContract, outputContract, timeoutMs };
}

export const SYSTEM_AGENTS: SystemAgentSpec[] = [
  {
    id: 'A1', name: 'Audit Diagnostic Agent', codename: 'DIAGNOSTIC-01',
    mission: 'Diagnose site, funnel and competitive health; produce scored, evidence-backed findings and a remediation roadmap.',
    vaultScope: ['Website Vault', 'Marketing Vault', 'Authority Vault', 'Audit Vault', 'AI Workflow Vault'],
    categories: ['growth', 'uiux', 'reporting', 'simulation'],
    entrySubAgent: 'evidence-collector',
    subAgents: [
      sub('evidence-collector', 'A1', 'Fetch and parse a bounded list of target URLs into evidence contracts', 'read', 'URLs[] (SSRF-checked)', 'evidenceContract[] with provenance'),
      sub('web-vitals-scorer', 'A1', 'Score Core Web Vitals for target pages', 'read', 'page URLs[]', 'score records'),
      sub('competitor-gap-mapper', 'A1', 'Diff the client against rivals on positioning and funnel surface', 'read', 'client + competitor evidence', 'ranked gap list'),
      sub('funnel-analyst', 'A1', 'Model conversion stages from analytics data', 'read', 'funnel event data', 'funnel model'),
      sub('audit-score-composer', 'A1', 'Fuse subscores into one auditable overall score', 'write', 'subscore records', 'audit_vault draft (HITL)'),
      sub('roadmap-synthesizer', 'A1', 'Turn ranked gaps into a 90-day remediation plan', 'write', 'gap list', 'roadmap artifact (HITL)'),
    ],
  },
  {
    id: 'A2', name: 'Marketing Agent', codename: 'GROWTH-02',
    mission: 'Allocate budget and effort across channels; produce campaign briefs and creative direction grounded in measured performance.',
    vaultScope: ['Brand Vault', 'Customer Vault', 'Marketing Vault', 'Authority Vault', 'AI Workflow Vault'],
    categories: ['performance', 'competitors'],
    entrySubAgent: 'spend-efficiency-scorer',
    subAgents: [
      sub('channel-mix-analyst', 'A2', 'Score channels against budget and ICP fit', 'read', 'channel performance history', 'channel mix recommendation'),
      sub('spend-efficiency-scorer', 'A2', 'Compute ROAS/CPA/CAC per campaign over a window', 'read', 'campaign metrics[]', 'efficiency table'),
      sub('creative-fatigue-detector', 'A2', 'Detect frequency and decay signals per creative', 'read', 'impression frequency + CTR trend', 'fatigue flags'),
      sub('kpi-tracker', 'A2', 'Compare actuals against target KPIs', 'read', 'targets + actuals', 'KPI snapshot'),
      sub('budget-allocator', 'A2', 'Propose spend reallocation between campaigns', 'write', 'efficiency table + targets', 'allocation plan (HITL)'),
      sub('bid-strategist', 'A2', 'Propose bidding adjustments', 'write', 'campaign + auction data', 'bid plan (HITL)'),
    ],
  },
  {
    id: 'A3', name: 'SEO & Authority Agent', codename: 'AUTHORITY-03',
    mission: 'Grow discoverability and topical authority; close keyword and answer-engine citation gaps.',
    vaultScope: ['Brand Vault', 'Authority Vault', 'AI Workflow Vault'],
    categories: ['authority'],
    entrySubAgent: 'keyword-gap-finder',
    subAgents: [
      sub('query-intent', 'A3', 'Cluster a head term by search intent', 'read', 'head keyword', 'intent clusters'),
      sub('keyword-gap-finder', 'A3', 'Diff client keywords against competitors', 'read', 'client + competitor keyword sets', 'gap list'),
      sub('citation-gap', 'A3', 'Find answer-engine citation opportunities', 'read', 'AEO/SERP snapshot', 'ranked citation gaps'),
      sub('backlink-prospector', 'A3', 'Identify link acquisition opportunities', 'read', 'authority vault + link data', 'prospect list'),
      sub('schema-emitter', 'A3', 'Emit JSON-LD structured data for target pages', 'write', 'page inventory', 'schema artifacts (HITL)'),
      sub('content-brief-writer', 'A3', 'Write content briefs from gaps plus brand voice', 'write', 'gap list + brand voice', 'briefs (HITL)'),
    ],
  },
  {
    id: 'A4', name: 'Creative Director Agent', codename: 'CREATIVE-04',
    mission: 'Produce brand-faithful creative specifications and derivative assets for every channel.',
    vaultScope: ['Brand Vault', 'Customer Vault', 'AI Workflow Vault'],
    categories: ['content', 'social'],
    entrySubAgent: 'creative-variant',
    subAgents: [
      sub('brand-voice-enforcer', 'A4', 'Validate copy against the Brand Vault voice', 'read', 'draft copy', 'pass/fail + deltas'),
      sub('carousel-architect', 'A4', 'Structure social carousel sequences', 'write', 'approved brief', 'carousel specs (HITL)'),
      sub('video-storyboarder', 'A4', 'Produce shot lists and voiceover', 'write', 'approved brief', 'storyboard (HITL)'),
      sub('creative-variant', 'A4', 'Produce N variants from an approved brief', 'write', 'approved brief', 'variant specs (HITL)'),
      sub('visual-prompt-engineer', 'A4', 'Synthesize image and video prompts', 'write', 'approved brief', 'prompt set (HITL)'),
      sub('repurposer', 'A4', 'Cut long-form into per-channel fragments', 'write', 'source content', 'fragments (HITL)'),
    ],
  },
  {
    id: 'A5', name: 'AI SDR (Sales Agent)', codename: 'SDR-05',
    mission: 'Qualify leads, research accounts and draft outreach. HARD INVARIANT: never sends. No sub-agent may hold a connector write grant.',
    vaultScope: ['Brand Vault', 'Customer Vault', 'AI Workflow Vault'],
    categories: ['crm'],
    entrySubAgent: 'lead-qualifier',
    subAgents: [
      sub('lead-qualifier', 'A5', 'Score a lead against the ICP', 'read', 'lead record + ICP', 'score + rationale'),
      sub('account-researcher', 'A5', 'Assemble firmographics and buying signals', 'read', 'company domain', 'account brief'),
      sub('pipeline-hygienist', 'A5', 'Detect stage and field hygiene issues', 'read', 'deal records', 'cleanup list'),
      sub('sequence-drafter', 'A5', 'Draft a first-touch outreach sequence (draft only)', 'write', 'account brief + brand voice', 'DRAFT sequence (HITL, never sent)'),
      sub('handoff-composer', 'A5', 'Compose context for a human rep', 'write', 'qualified lead record', 'handoff note (HITL)'),
    ],
  },
  {
    id: 'A6', name: 'Customer Success Agent', codename: 'SUCCESS-06',
    mission: 'Track account health, surface churn and expansion risk, and propose save plays.',
    vaultScope: ['Brand Vault', 'Customer Vault', 'Marketing Vault', 'AI Workflow Vault'],
    categories: ['customer_success'],
    entrySubAgent: 'health-scorer',
    subAgents: [
      sub('health-scorer', 'A6', 'Derive an account health score from usage and support signals', 'read', 'usage + support data', 'health score'),
      sub('churn-risk-analyst', 'A6', 'Estimate renewal risk with named drivers', 'read', 'account history', 'risk record'),
      sub('expansion-signal-finder', 'A6', 'Identify upsell and upgrade triggers', 'read', 'usage + plan data', 'opportunity list'),
      sub('save-play-designer', 'A6', 'Propose a retention intervention', 'write', 'risk record', 'save play (HITL)'),
      sub('qbr-composer', 'A6', 'Write the quarterly business review narrative', 'write', 'account evidence', 'QBR document (HITL)'),
    ],
  },
  {
    id: 'A7', name: 'Operations Agent', codename: 'OPERATIONS-07',
    mission: 'Run the machine: schedules, templates, connector health, knowledge ingestion, retrospectives and policy audits.',
    vaultScope: ['Operations Vault', 'AI Workflow Vault'],
    categories: ['cockpit', 'brain', 'second_brain', 'operations', 'security', 'engineering'],
    entrySubAgent: 'policy-auditor',
    subAgents: [
      sub('connector-health-monitor', 'A7', 'Report truthful connector and checkpoint states', 'read', 'connector registry', 'health report'),
      sub('policy-auditor', 'A7', 'Audit RBAC and RLS coverage against the agent registry', 'read', 'agent registry + policies', 'audit findings'),
      sub('retrospective-analyst', 'A7', 'Review outcomes from the execution ledger', 'read', 'ledger runs + events', 'learnings'),
      sub('workflow-template-author', 'A7', 'Author SOP and workflow templates', 'write', 'operating intent', 'template (HITL)'),
      sub('schedule-planner', 'A7', 'Build cron and heartbeat schedules', 'write', 'task cadence requirements', 'schedule spec (HITL)'),
      sub('kb-vectorizer', 'A7', 'Chunk and embed uploads into pgvector', 'write', 'uploaded documents', 'pgvector embeddings (system write)'),
    ],
  },
];

// ── Lookups ────────────────────────────────────────────────────────────────

export const ALL_SUB_AGENTS: SubAgentSpec[] = SYSTEM_AGENTS.flatMap(a => a.subAgents);

export const SUB_AGENT_IDS: string[] = ALL_SUB_AGENTS.map(s => s.id);

export function getSystemAgent(id: SystemAgentId): SystemAgentSpec {
  const found = SYSTEM_AGENTS.find(a => a.id === id);
  if (!found) throw new Error(`Unknown system agent: ${id}`);
  return found;
}

export function getSubAgent(id: string): SubAgentSpec {
  const found = ALL_SUB_AGENTS.find(s => s.id === id);
  if (!found) throw new Error(`Unknown sub-agent: ${id}`);
  return found;
}

export function getAgentByName(name: string): SystemAgentSpec | undefined {
  return SYSTEM_AGENTS.find(a => a.name === name);
}

/** The owning agent for a category key, derived from the registry itself. */
export function ownerForCategory(category: string): SystemAgentSpec | undefined {
  return SYSTEM_AGENTS.find(a => (a.categories as string[]).includes(category));
}

/** Write-plane sub-agents require an approval token before they execute. */
export function requiresApproval(subAgentId: string): boolean {
  return getSubAgent(subAgentId).plane === 'write';
}
