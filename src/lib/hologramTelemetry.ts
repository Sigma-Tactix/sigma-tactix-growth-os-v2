/**
 * Growth Matrix telemetry — real module health, derived from the workspace.
 *
 * Everything the HUD prints comes from here, and everything here comes from
 * `SecondBrain`, `AgentTask[]`, `Connector[]` or the plan entitlement check.
 * Nothing is invented: a module with no signal reports `unknown`, never a
 * plausible-looking number (guardrail 6, "never fabricate module output").
 *
 * Health is deliberately close to the RED model used by service maps — is it
 * running, is it blocked, how stale is it — because that is what an operator
 * needs from an architecture view. Colour is never the only channel: every
 * state also carries a glyph and a word.
 */
import type { SecondBrain, AgentTask, Connector } from '../types';
import type { TabId } from '../components/shell/navigation';
import { GROWTH_MATRIX_MODULES } from './hologramGraph';

export type ModuleHealth =
  | 'active'    // has data, recently touched
  | 'pending'   // work waiting on a human approval
  | 'stale'     // has data, nothing has happened in STALE_AFTER_DAYS
  | 'blocked'   // a dependency is missing, the module cannot produce output
  | 'locked'    // not in the workspace's plan
  | 'unknown';  // no signal reaches this module yet

/** Colour is never alone: each state carries a glyph and a word too. */
export const HEALTH_GLYPH: Record<ModuleHealth, string> = {
  active: '●',
  pending: '◆',
  stale: '▲',
  blocked: '■',
  locked: '✕',
  unknown: '○',
};

export const HEALTH_LABEL: Record<ModuleHealth, string> = {
  active: 'ACTIVE',
  pending: 'NEEDS APPROVAL',
  stale: 'STALE',
  blocked: 'NEEDS DATA',
  locked: 'LOCKED',
  unknown: 'NO SIGNAL',
};

export const HEALTH_COLOR: Record<ModuleHealth, string> = {
  active: '#35C9A5', // Signal Mint
  pending: '#FF481B', // Sigma Orange — a human is the blocker
  stale: '#F59E0B', // Amber
  blocked: '#EC4899', // Pink
  locked: '#6B6B6B', // Neutral 600
  unknown: '#4F7CFF', // Signal Blue
};

export const STALE_AFTER_DAYS = 30;

/** Agents outside the built-in roster (the discovered agency registry) still
 *  need a home, or their approvals vanish from the orbit. */
export const DEFAULT_AGENT_MODULE: TabId = 'agents';

/** Which agents' work lands in which module, for the HITL queue split. */
export const AGENT_MODULE: Partial<Record<AgentTask['agentName'], TabId>> = {
  'Marketing Agent': 'performance',
  'AI SDR (Sales Agent)': 'crm',
  'Customer Success Agent': 'crm',
  'Operations Agent': 'agents',
  'Audit Diagnostic Agent': 'growth',
  'Creative Director Agent': 'content',
  'SEO & Authority Agent': 'authority',
};

export interface ModuleStatus {
  moduleKey: TabId;
  label: string;
  health: ModuleHealth;
  /** One line, safe to print in a HUD row. */
  headline: string;
  /** Longer lines for the info box when a node is highlighted. */
  detail: string[];
  /** Everything this module runs on, met or not — the moons in the Matrix. */
  dependencies: string[];
  /** The subset it is still missing. */
  missing: string[];
  pendingApprovals: number;
  lastActivityAt: string | null;
  /** First unmet dependency and where to go fix it, when there is one. */
  primaryFix: { label: string; tab: TabId } | null;
  /** 0..1, drives the waveform band height. Real work, not animation. */
  activity: number;
}

export interface TelemetryInput {
  brain?: SecondBrain;
  agentTasks?: AgentTask[];
  connectors?: Connector[];
  isModuleUnlocked?: (moduleKey: string) => boolean;
  /** Injectable for tests. */
  now?: number;
}

/** Module that owns a task, falling back to the cockpit for unknown agents. */
export const moduleForAgent = (agentName: AgentTask['agentName']): TabId =>
  AGENT_MODULE[agentName] ?? DEFAULT_AGENT_MODULE;

const has = (value: unknown): boolean =>
  typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : !!value;

const daysSince = (iso: string | null | undefined, now: number): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (now - t) / 86_400_000;
};

const newest = (dates: Array<string | null | undefined>): string | null => {
  const valid = dates.filter((d): d is string => !!d && !Number.isNaN(Date.parse(d)));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b));
};

/** A credential of this category that is actually usable. */
const credentialReady = (brain: SecondBrain | undefined, category: string): boolean =>
  !!brain?.credentialsVault?.some((c) => c.category === category && c.status === 'Connected');

const connectorReady = (connectors: Connector[] | undefined, platform?: string): boolean =>
  !!connectors?.some((c) => c.status === 'Connected' && (!platform || c.platform === platform));

/**
 * What each module needs before it can do anything real. Kept as data so the
 * info box can name the missing piece instead of saying "not configured".
 */
interface Requirement {
  name: string;
  met: (i: TelemetryInput) => boolean;
  /** Where the user goes to satisfy it. */
  fix: string;
  /** The tab that resolves it, so the inspector can offer a one-click jump. */
  fixTab: TabId;
}

const REQUIREMENTS: Partial<Record<TabId, Requirement[]>> = {
  overview: [
    { name: 'Completed diagnostic audit', met: (i) => has(i.brain?.auditVault?.lastAuditedAt), fix: 'Run the Growth Audit Engine', fixTab: 'growth' },
  ],
  roadmap: [
    { name: 'Audit findings to sequence', met: (i) => Array.isArray(i.brain?.auditVault?.findings) && i.brain!.auditVault.findings.length > 0, fix: 'Run the Growth Audit Engine', fixTab: 'growth' },
  ],
  brain: [
    { name: 'Brand voice & positioning', met: (i) => has(i.brain?.brandVault?.voiceAndTone), fix: 'Fill the Brand Vault', fixTab: 'brain' },
  ],
  growth: [
    { name: 'Target site URL', met: (i) => has(i.brain?.websiteVault?.siteUrl), fix: 'Set the site URL in the Website Vault', fixTab: 'brain' },
  ],
  uiux: [
    { name: 'Target site URL', met: (i) => has(i.brain?.websiteVault?.siteUrl), fix: 'Set the site URL in the Website Vault', fixTab: 'brain' },
  ],
  content: [
    { name: 'Brand voice & tone', met: (i) => has(i.brain?.brandVault?.voiceAndTone), fix: 'Fill the Brand Vault', fixTab: 'brain' },
    { name: 'Customer profile', met: (i) => has(i.brain?.customerVault?.idealCustomerProfile), fix: 'Fill the Customer Vault', fixTab: 'brain' },
  ],
  performance: [
    { name: 'Connected ad platform', met: (i) => credentialReady(i.brain, 'Ads') || connectorReady(i.connectors), fix: 'Connect Meta or Google Ads', fixTab: 'integrations' },
  ],
  reporting: [
    { name: 'Analytics property', met: (i) => has(i.brain?.websiteVault?.analyticsId) || credentialReady(i.brain, 'Analytics'), fix: 'Connect GA4 in Integrations', fixTab: 'integrations' },
  ],
  authority: [
    { name: 'Target keywords', met: (i) => has(i.brain?.authorityVault?.targetKeywords), fix: 'Add target keywords to the Authority Vault', fixTab: 'brain' },
  ],
  crm: [
    { name: 'Connected CRM', met: (i) => credentialReady(i.brain, 'CRM'), fix: 'Connect HubSpot or your CRM', fixTab: 'integrations' },
  ],
  competitors: [
    { name: 'Core positioning to benchmark', met: (i) => has(i.brain?.brandVault?.corePositioning), fix: 'Fill the Brand Vault', fixTab: 'brain' },
  ],
  social: [
    { name: 'Connected social account', met: (i) => credentialReady(i.brain, 'Social'), fix: 'Connect a social account in Integrations', fixTab: 'integrations' },
  ],
  agents: [
    { name: 'Configured agent workflow', met: (i) => has(i.brain?.aiWorkflowVault), fix: 'Configure an agent in the AI Workflow Vault', fixTab: 'brain' },
  ],
  simulation: [
    { name: 'Baseline growth score', met: (i) => (i.brain?.auditVault?.overallScore ?? 0) > 0, fix: 'Run the Growth Audit Engine', fixTab: 'growth' },
  ],
};

/** Signals that count as "this module did something", newest wins. */
function lastActivityFor(moduleKey: TabId, input: TelemetryInput): string | null {
  const { brain, agentTasks = [], connectors = [] } = input;
  const agentDates = agentTasks
    .filter((t) => moduleForAgent(t.agentName) === moduleKey && t.status !== 'Pending Approval')
    .map((t) => t.timestamp);

  switch (moduleKey) {
    case 'overview':
    case 'roadmap':
    case 'growth':
    case 'simulation':
      return newest([brain?.auditVault?.lastAuditedAt ?? null, ...agentDates]);
    case 'brain':
      return newest([...(brain?.uploadedFiles ?? []).map((f) => f.uploadedAt), ...agentDates]);
    case 'reporting':
    case 'performance':
    case 'social':
      return newest([...connectors.map((c) => c.lastSyncedAt ?? null), ...agentDates]);
    default:
      return newest(agentDates);
  }
}

/**
 * Precedence is deliberate: an approval waiting on a human outranks everything,
 * including a plan lock — the queue is actionable and hiding it would leave the
 * HITL count in the HUD with no module to point at. Then locked, then a missing
 * dependency, and staleness only means anything once dependencies are met.
 */
export function deriveModuleStatuses(input: TelemetryInput): ModuleStatus[] {
  const now = input.now ?? Date.now();
  const tasks = input.agentTasks ?? [];

  return GROWTH_MATRIX_MODULES.map((mod) => {
    const key = mod.moduleKey;
    const requirements = REQUIREMENTS[key] ?? [];
    const unmet = requirements.filter((r) => !r.met(input));
    const pending = tasks.filter(
      (t) => moduleForAgent(t.agentName) === key && t.status === 'Pending Approval'
    );
    const running = tasks.filter(
      (t) => moduleForAgent(t.agentName) === key && t.status === 'Running'
    );
    const lastActivityAt = lastActivityFor(key, input);
    const age = daysSince(lastActivityAt, now);
    const locked = input.isModuleUnlocked ? !input.isModuleUnlocked(key) : false;

    let health: ModuleHealth;
    let headline: string;

    if (pending.length) {
      health = 'pending';
      headline = `${pending.length} agent run${pending.length > 1 ? 's' : ''} waiting on your approval`;
    } else if (locked) {
      health = 'locked';
      headline = 'Not included in the current plan';
    } else if (unmet.length) {
      health = 'blocked';
      headline = `Needs ${unmet.map((r) => r.name.toLowerCase()).join(' + ')}`;
    } else if (age === null) {
      health = 'unknown';
      headline = 'Configured, no runs recorded yet';
    } else if (age > STALE_AFTER_DAYS) {
      health = 'stale';
      headline = `No activity in ${Math.floor(age)} days`;
    } else {
      health = 'active';
      headline = running.length
        ? `${running.length} agent run${running.length > 1 ? 's' : ''} in progress`
        : `Last activity ${Math.max(0, Math.floor(age))}d ago`;
    }

    const detail: string[] = [];
    if (locked) {
      detail.push('Upgrade the workspace plan in Admin to unlock this module.');
    }
    for (const req of unmet) {
      detail.push(`Missing: ${req.name} → ${req.fix}`);
    }
    if (pending.length) {
      for (const task of pending.slice(0, 3)) {
        detail.push(`Awaiting approval: ${task.agentName} — ${task.goal}`);
      }
    }
    if (!locked && !unmet.length && requirements.length) {
      detail.push(`Dependencies satisfied: ${requirements.map((r) => r.name).join(', ')}.`);
    }
    if (lastActivityAt) {
      detail.push(`Last activity: ${new Date(lastActivityAt).toISOString().slice(0, 10)}.`);
    }

    // Activity is bounded work, not decoration: approvals and in-flight runs
    // raise it, age lowers it, and a module with no signal sits flat.
    const recency = age === null ? 0 : Math.max(0, 1 - age / STALE_AFTER_DAYS);
    const load = Math.min(1, (pending.length + running.length) / 3);
    const activity = health === 'locked' ? 0 : Math.min(1, recency * 0.7 + load * 0.6);

    return {
      moduleKey: key,
      label: mod.label,
      health,
      primaryFix: unmet.length ? { label: unmet[0].fix, tab: unmet[0].fixTab } : null,
      dependencies: requirements.map((r) => r.name),
      headline,
      detail,
      missing: unmet.map((r) => r.name),
      pendingApprovals: pending.length,
      lastActivityAt,
      activity,
    };
  });
}

export interface MatrixSummary {
  total: number;
  byHealth: Record<ModuleHealth, number>;
  hitlQueue: number;
  runsInFlight: number;
  blockedModules: number;
  lockedModules: number;
  /** Share of modules whose dependencies are all satisfied, 0..1. */
  dependencyCoverage: number;
  vaultsFilled: number;
  vaultsTotal: number;
  connectorsOnline: number;
  connectorsTotal: number;
  lastAuditAt: string | null;
  growthScore: number | null;
}

const VAULT_KEYS: Array<keyof SecondBrain> = [
  'executiveVault', 'credentialsVault', 'brandVault', 'customerVault', 'marketingVault',
  'websiteVault', 'authorityVault', 'operationsVault', 'aiWorkflowVault', 'auditVault',
];

/** Everything the top-left status block prints, in one derived object. */
export function summarizeMatrix(statuses: ModuleStatus[], input: TelemetryInput): MatrixSummary {
  const byHealth = statuses.reduce((acc, s) => {
    acc[s.health] = (acc[s.health] ?? 0) + 1;
    return acc;
  }, {} as Record<ModuleHealth, number>);
  for (const key of Object.keys(HEALTH_LABEL) as ModuleHealth[]) byHealth[key] ??= 0;

  const tasks = input.agentTasks ?? [];
  const connectors = input.connectors ?? [];
  const vaultsFilled = input.brain
    ? VAULT_KEYS.filter((k) => {
        const v = input.brain?.[k];
        if (Array.isArray(v)) return v.length > 0;
        if (v && typeof v === 'object') return Object.values(v).some((x) => has(x));
        return has(v);
      }).length
    : 0;

  return {
    total: statuses.length,
    byHealth,
    hitlQueue: tasks.filter((t) => t.status === 'Pending Approval').length,
    runsInFlight: tasks.filter((t) => t.status === 'Running').length,
    blockedModules: byHealth.blocked,
    lockedModules: byHealth.locked,
    dependencyCoverage: statuses.length
      ? statuses.filter((s) => s.health !== 'blocked' && s.health !== 'locked').length / statuses.length
      : 0,
    vaultsFilled,
    vaultsTotal: VAULT_KEYS.length,
    connectorsOnline: connectors.filter((c) => c.status === 'Connected').length,
    connectorsTotal: connectors.length,
    lastAuditAt: input.brain?.auditVault?.lastAuditedAt ?? null,
    growthScore: input.brain?.auditVault?.overallScore ?? null,
  };
}
