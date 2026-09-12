// Agent vault RBAC — least-privilege scope per agent type.
//
// Ported from the (now removed) Python backend stub `backend/api/routes/agents.py`
// during backend consolidation to Node. This is the concrete guardrail matrix
// referenced in docs/SECURITY.md: which vaults each agent may read, which are
// hard-blocked. Secret vaults (Executive, Credentials) are blocked for every
// agent. Wire `evaluateAgentRequest` into the /api/workspace/run-agent route so
// a task requesting an out-of-scope vault is rejected before it runs.

export type VaultName =
  | "Executive Vault"
  | "Credentials Vault"
  | "Brand Vault"
  | "Customer Vault"
  | "Marketing Vault"
  | "Website Vault"
  | "Authority Vault"
  | "Operations Vault"
  | "AI Workflow Vault"
  | "Audit Vault";

export interface VaultPolicy {
  allowed: VaultName[];
  blocked: VaultName[];
}

import type { SecondBrain } from "../types.js";

// Explicit policies. The first three are ported verbatim from the Python stub;
// the last two are derived from the per-agent constraints seeded in
// backend/database/migrations/init.sql (provision_workspace_agents).
export const AGENT_VAULT_POLICIES: Record<string, VaultPolicy> = {
  "Marketing Agent": {
    allowed: ["Brand Vault", "Customer Vault", "Marketing Vault", "Authority Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Operations Vault"],
  },
  "AI SDR (Sales Agent)": {
    allowed: ["Brand Vault", "Customer Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Marketing Vault", "Website Vault", "Authority Vault", "Operations Vault"],
  },
  "Authority Agent": {
    allowed: ["Brand Vault", "Authority Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Customer Vault", "Marketing Vault", "Website Vault"],
  },
  "Customer Success Agent": {
    allowed: ["Brand Vault", "Customer Vault", "Marketing Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Operations Vault"],
  },
  "Operations Agent": {
    allowed: ["Operations Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Marketing Vault", "Customer Vault"],
  },
  // The 3 below match src/types.ts AgentTask["agentName"] / init.sql's
  // agent_type_enum exactly. They were previously missing entirely (the old
  // "Authority Agent" key never matched any real agentName the UI sends —
  // dead policy, renamed to "SEO & Authority Agent" below) — any run-agent
  // call using one of these 3 real names got silently default-denied
  // (getAgentPolicy falls back to {allowed:[],blocked:[]} for unknown keys).
  "Audit Diagnostic Agent": {
    allowed: ["Website Vault", "Marketing Vault", "Authority Vault", "Audit Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Customer Vault", "Operations Vault"],
  },
  "Creative Director Agent": {
    allowed: ["Brand Vault", "Customer Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Operations Vault", "Authority Vault"],
  },
  "SEO & Authority Agent": {
    allowed: ["Brand Vault", "Authority Vault", "AI Workflow Vault"],
    blocked: ["Executive Vault", "Credentials Vault", "Customer Vault", "Marketing Vault", "Website Vault"],
  },
};

// Vaults no agent may ever touch, regardless of explicit policy.
const ALWAYS_BLOCKED: VaultName[] = ["Executive Vault", "Credentials Vault"];

// There are TWO vault namespaces in this codebase and they do not match.
// `VaultName` above is the display form used by the policy matrix ("Brand
// Vault"). `documents.vault_id` is a lowercase short key written by the upload
// route and by every module that calls saveDocument() ("brand", "marketing",
// "audit", "performance", "competitor", "authority", ...). Filtering RAG by
// VaultName directly would match zero rows and look like "RAG is broken"
// rather than "RAG is over-permissive", so the mapping is explicit here.
const VAULT_NAME_TO_DOCUMENT_IDS: Record<VaultName, string[]> = {
  "Brand Vault": ["brand"],
  "Customer Vault": ["customer"],
  // Marketing owns paid-media artefacts too: indexPerformanceHook() writes
  // winning ad copy under vault_id 'marketing', and the Performance module
  // writes uploaded reports under 'performance'.
  "Marketing Vault": ["marketing", "performance"],
  "Website Vault": ["website"],
  "Authority Vault": ["authority"],
  "Operations Vault": ["operations"],
  // The audit modules write their findings under 'audit', and Competitor
  // Analysis under 'competitor'.
  "Audit Vault": ["audit", "competitor"],
  "AI Workflow Vault": ["ai_workflow"],
  // Never reachable — both are in ALWAYS_BLOCKED — but mapped so the record is
  // exhaustive and a future vault addition is a type error, not a silent gap.
  "Executive Vault": ["executive"],
  "Credentials Vault": ["credentials"],
};

// Documents uploaded without a vault classification land here (the upload route
// defaults vaultId to "general"). Deliberately readable by any agent that has
// at least one authorized vault: 'general' means "the user put this in the
// workspace at large", not "this belongs to a restricted vault". Excluding it
// would make RAG return nothing for the most common upload path, which reads as
// a broken feature rather than a security control. Nothing sensitive should be
// filed as 'general' — the vault-tagged upload path exists for that.
const UNCLASSIFIED_DOCUMENT_VAULT = "general";

// Translates an agent's authorized scope into the document vault_ids it may
// retrieve. Returns [] for an agent with no scope, which match_documents_scoped
// treats as "match nothing" (`= ANY('{}')` is false for every row) — fail
// closed, not open.
export function documentVaultIdsForScope(allowedScope: string[]): string[] {
  const ids = new Set<string>();
  for (const name of allowedScope) {
    if (ALWAYS_BLOCKED.includes(name as VaultName)) continue;
    for (const id of VAULT_NAME_TO_DOCUMENT_IDS[name as VaultName] ?? []) ids.add(id);
  }
  if (ids.size > 0) ids.add(UNCLASSIFIED_DOCUMENT_VAULT);
  return [...ids];
}

export function getAgentPolicy(agentName: string): VaultPolicy {
  // Default-deny: an unknown agent gets no vault access.
  return AGENT_VAULT_POLICIES[agentName] ?? { allowed: [], blocked: [] };
}

export interface AgentScopeResult {
  authorized: boolean;
  allowedScope: VaultName[];
  unauthorizedRequests: VaultName[];
}

// Returns which requested vaults are out of scope for the agent. Empty
// unauthorizedRequests => the task may proceed (still subject to HITL approval).
export function evaluateAgentRequest(
  agentName: string,
  requestedVaults: VaultName[],
): AgentScopeResult {
  const policy = getAgentPolicy(agentName);
  const unauthorizedRequests = requestedVaults.filter(
    (v) => ALWAYS_BLOCKED.includes(v) || policy.blocked.includes(v) || !policy.allowed.includes(v),
  );
  return {
    authorized: unauthorizedRequests.length === 0,
    allowedScope: policy.allowed,
    unauthorizedRequests,
  };
}

export interface ScopedContextOptions {
  performanceMetrics?: {
    targetRoas?: number | string;
    targetCpa?: number | string;
    targetCpl?: number | string;
    targetCac?: number | string;
    monthlyBudget?: number | string;
  };
  ragSnippets?: string[];
}

export function buildScopedBrainContext(
  allowedScope: string[],
  brain: SecondBrain,
  options?: ScopedContextOptions,
): string {
  const lines: string[] = [];
  const has = (v: VaultName) => allowedScope.includes(v);

  if (has("Brand Vault")) {
    lines.push(`Brand positioning: ${brain.brandVault.corePositioning}`);
    lines.push(`Brand voice/tone: ${brain.brandVault.voiceAndTone}`);
    lines.push(`Brand slogan: ${brain.brandVault.brandSlogan}`);
    lines.push(`Offers and pricing: ${brain.brandVault.offersAndPricing}`);
  }
  if (has("Customer Vault")) {
    lines.push(`Ideal customer profile: ${brain.customerVault.idealCustomerProfile}`);
  }
  if (has("Marketing Vault")) {
    lines.push(`Marketing channel history: ${brain.marketingVault.campaignHistory}`);
    lines.push(`Current channels: ${(brain.marketingVault.currentChannels || []).join(", ")}`);
  }
  if (has("Website Vault")) {
    lines.push(`Website: ${brain.websiteVault.siteUrl} (${brain.websiteVault.cmsType})`);
  }
  if (has("Authority Vault")) {
    lines.push(`Target keywords: ${(brain.authorityVault.targetKeywords || []).join(", ")}`);
  }
  if (has("Operations Vault")) {
    lines.push(`SOPs: ${JSON.stringify(brain.operationsVault.standardOperatingProcedures, null, 2)}`);
  }

  // Active Performance KPI Targets Injection
  if ((has("Marketing Vault") || has("Brand Vault")) && options?.performanceMetrics) {
    const pm = options.performanceMetrics;
    const targets: string[] = [];
    if (pm.targetRoas) targets.push(`Target ROAS: ${pm.targetRoas}x`);
    if (pm.targetCpa) targets.push(`Target CPA: $${pm.targetCpa}`);
    if (pm.targetCpl) targets.push(`Target CPL: $${pm.targetCpl}`);
    if (pm.targetCac) targets.push(`Target CAC: $${pm.targetCac}`);
    if (pm.monthlyBudget) targets.push(`Monthly Ad Budget: $${pm.monthlyBudget}`);
    if (targets.length > 0) {
      lines.push(`Active Performance KPI Benchmarks: ${targets.join(" | ")}`);
    }
  }

  // RAG Historical Memory Snippets Injection
  if (options?.ragSnippets && options.ragSnippets.length > 0) {
    lines.push(`\n### Historical Top-Performing Memory & Winning Copy Hooks (RAG Vector Store):`);
    options.ragSnippets.forEach((snippet, idx) => {
      lines.push(`- Hook ${idx + 1}: ${snippet}`);
    });
  }

  return lines.length > 0 ? lines.join("\n") : "(No vault context authorized for this agent.)";
}

