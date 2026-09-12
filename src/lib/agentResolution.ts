// Dispatch resolution: registry persona -> system agent type.
//
// There are two agent namespaces in this codebase and, until this module
// existed, only one of the two dispatch paths crossed between them.
//
//   1. The 7 SYSTEM agents (src/types.ts AgentTask["agentName"]). These are
//      the only names the vault RBAC matrix in agentPolicies.ts knows, and the
//      only ones executeAgentTask can grant Second Brain scope to.
//   2. The 182 REGISTRY personas (src/data/agencyAgentsRegistry.ts), which is
//      what ModuleAgentHub and the Cockpit library actually show the operator.
//
// Not one of the 182 registry names matches a policy key, so posting a registry
// name to /run-agent hit getAgentPolicy's default-deny fallback, landed a task
// with allowedScope: [], and executeAgentTask then ran it anyway — logging "No
// vault scope authorized ... proceeding with no Second Brain context" and
// producing an ungrounded artifact. Fail-closed on the data, fail-OPEN on the
// run: the deliverable still shipped, just with none of the client context that
// is the entire point of the product.
//
// /run-swarm already crossed the namespaces correctly via MODULE_TO_SYSTEM_AGENT
// (target_module -> system type). This module lifts that map out of server.ts so
// both dispatch paths share it and it can be tested, and adds the name-based
// resolution the hub path needs.

import type { AgentTask } from "../types.js";
import { DISCOVERED_AGENCY_AGENTS, type DiscoveredAgent } from "../data/agencyAgentsRegistry.js";

export type SystemAgentName = AgentTask["agentName"];

export const SYSTEM_AGENT_NAMES = [
  "Marketing Agent",
  "AI SDR (Sales Agent)",
  "Customer Success Agent",
  "Operations Agent",
  "Audit Diagnostic Agent",
  "Creative Director Agent",
  "SEO & Authority Agent",
] as const satisfies readonly SystemAgentName[];

// Compile-time exhaustiveness: adding a name to AgentTask["agentName"] without
// listing it above is a type error here, not a silent runtime default-deny.
type UncoveredSystemAgent = Exclude<SystemAgentName, (typeof SYSTEM_AGENT_NAMES)[number]>;
const _allSystemAgentsCovered: UncoveredSystemAgent extends never ? true : never = true;
void _allSystemAgentsCovered;

export function isSystemAgentName(name: string): name is SystemAgentName {
  return (SYSTEM_AGENT_NAMES as readonly string[]).includes(name);
}

// Maps a module key to the system agent type whose vault scope that module's
// work actually needs.
//
// The first block is the live key set — these are the exact `moduleKey` values
// the ModuleAgentHub instances pass and the exact `targetModules` values in the
// registry. agentResolution.test.ts asserts that correspondence, so a new module
// cannot be added to the registry without landing here.
//
// The second block is legacy aliases. `agents.target_module` is free text
// persisted in Postgres (POST /api/workspace/agents takes it straight from the
// client), so rows written before the registry was renamed still carry the old
// keys and must keep resolving to the same agent type they always did.
export const MODULE_TO_SYSTEM_AGENT: Record<string, SystemAgentName> = {
  // --- live registry / UI module keys ---
  growth: "Audit Diagnostic Agent",
  uiux: "Audit Diagnostic Agent",
  content: "Creative Director Agent",
  performance: "Marketing Agent",
  authority: "SEO & Authority Agent",
  crm: "AI SDR (Sales Agent)",
  cockpit: "Operations Agent",
  // Second Brain's agents are infrastructure roles (Data Engineer, RAG Pipeline
  // Engineer, Data Privacy Officer) — Operations scope, same as the legacy
  // `second_brain` key below always gave them.
  brain: "Operations Agent",
  // Channel strategists and community builders — Brand + Customer, same as the
  // legacy `social_listening` key.
  social: "Creative Director Agent",
  // Pricing, trend and paid-media analysis — needs the Marketing Vault, same as
  // the legacy `competitor` key.
  competitors: "Marketing Agent",
  // Reporting and Simulation had no mapping at all and fell through to
  // run-swarm's `|| "Marketing Agent"` default, which grants Brand + Customer
  // but NOT the Audit Vault. Both modules read from the audit findings and the
  // performance history: Analytics Reporter / Executive Summary Generator
  // summarize audits, and Growth Scenario Simulator / Experiment Tracker model
  // forward from them. Audit Diagnostic Agent is the only policy holding both
  // Audit Vault and Marketing Vault.
  reporting: "Audit Diagnostic Agent",
  simulation: "Audit Diagnostic Agent",

  // --- legacy target_module values persisted before the registry rename ---
  second_brain: "Operations Agent",
  social_listening: "Creative Director Agent",
  competitor: "Marketing Agent",
  sales: "AI SDR (Sales Agent)",
  customer_success: "Customer Success Agent",
  operations: "Operations Agent",
  security: "Operations Agent",
  engineering: "Operations Agent",
};

export function systemAgentForModule(moduleKey: string | null | undefined): SystemAgentName | undefined {
  return moduleKey ? MODULE_TO_SYSTEM_AGENT[moduleKey] : undefined;
}

// The persona's own definition, rendered as the instruction line that gets
// prepended to the goal. Shared with POST /api/workspace/agents/import so an
// imported agent and a directly dispatched one describe themselves identically.
export function personaInstructionsFor(agent: DiscoveredAgent): string {
  return `Act as the specialized ${agent.name}. ${agent.description}`;
}

export interface ResolvedDispatch {
  /** A real system agent type — always a key the RBAC matrix knows. */
  agentName: SystemAgentName;
  /** Goal, with the registry persona folded in when one was resolved. */
  goal: string;
  /** The registry persona this came from, when it was not already a system agent. */
  persona?: DiscoveredAgent;
}

/**
 * Resolves whatever the client called an agent into a system agent type that
 * carries real vault scope.
 *
 * `dispatchModule` is the module key of the hub the run came from; it is used
 * only when the persona is actually tagged to it.
 *
 * Returns null when the name is neither a system agent nor a registry persona,
 * or when a persona's module has no mapping. Callers must reject on null rather
 * than substituting a default: silently picking an agent type hands the run a
 * vault scope nobody asked for, which is the failure this module exists to end.
 */
export function resolveAgentDispatch(
  agentName: string,
  goal: string,
  dispatchModule?: string,
): ResolvedDispatch | null {
  if (!agentName) return null;
  if (isSystemAgentName(agentName)) return { agentName, goal };

  const persona = DISCOVERED_AGENCY_AGENTS.find(
    a => a.name === agentName || a.id === agentName || a.folder === agentName,
  );
  if (!persona) return null;

  // 11 of the 182 personas are tagged to two or three modules, and the scope
  // they need depends on which hub dispatched them: Analytics Reporter is in
  // both `performance` and `reporting`, and only the latter maps to an agent
  // holding the Audit Vault. So prefer the module the operator actually
  // dispatched from, falling back to the persona's primary tag.
  //
  // dispatchModule is client-supplied, so it is honoured ONLY when the persona
  // genuinely targets it. Otherwise it would be a free escalation: any caller
  // could name whichever module maps to the widest vault scope.
  const preferred = dispatchModule && persona.targetModules.includes(dispatchModule)
    ? dispatchModule
    : persona.targetModules[0];

  const systemAgentName = systemAgentForModule(preferred);
  if (!systemAgentName) return null;

  // Same shape run-swarm already uses, so the two dispatch paths produce tasks
  // an operator reads the same way.
  return {
    agentName: systemAgentName,
    goal: `[Persona: ${persona.name} — ${persona.role}] ${personaInstructionsFor(persona)} ${goal}`.trim(),
    persona,
  };
}
