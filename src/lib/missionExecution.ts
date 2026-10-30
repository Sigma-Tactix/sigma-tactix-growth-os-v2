import type { AgentTask } from '../types.js';
import { randomUUID } from 'node:crypto';
import type { VantaActionProposal } from './vanta.js';
import {
  getAgentByName,
  getSubAgent,
  type SubAgentSpec,
  type SystemAgentSpec,
} from './agentRegistry.js';
import { CATEGORY_OWNERS, type CategoryKey } from './decisionEngine.js';
import { systemAgentForModule, type SystemAgentName } from './agentResolution.js';
import type {
  BoundedWorkflowGraphConfig,
  WorkflowNodeDefinition,
  WorkflowNodeResult,
} from './boundedWorkflowGraph.js';

export interface DispatchPlan {
  planId: string;
  missionId: string;
  intent: string;
  category: CategoryKey;
  ownerAgent: SystemAgentName;
  subAgents: SubAgentSpec[];
  entrySubAgent: string;
  executionSubAgentIds: string[];
  requiresApproval: boolean;
  evidenceRefs: string[];
  budgetCap?: { maxTokens?: number; maxCostUsd?: number };
}

export interface MissionTaskMetadata {
  missionId: string;
  planId: string;
  subAgentId: string;
  parentTaskId?: string;
  requiresApproval: boolean;
}

const VANTA_PROPOSAL_MODULES: Record<string, string> = {
  CONTENT: 'content',
  CREATIVE: 'content',
  SEO_AEO: 'authority',
  PAID_ADS: 'performance',
  OUTREACH: 'crm',
  DIAGNOSTICS: 'growth',
  CONNECTORS: 'operations',
  AGENTS: 'cockpit',
  INTAKE: 'growth',
};

function categoryFor(owner: SystemAgentSpec, moduleKey?: string): CategoryKey {
  const mappedOwner = moduleKey ? systemAgentForModule(moduleKey) : undefined;
  if (mappedOwner === owner.name && moduleKey && moduleKey in CATEGORY_OWNERS) {
    return moduleKey as CategoryKey;
  }
  return owner.categories[0];
}

export function createDispatchPlan(input: {
  intent: string;
  agentName: SystemAgentName;
  moduleKey?: string;
  planId?: string;
  missionId?: string;
  evidenceRefs?: string[];
  budgetCap?: { maxTokens?: number; maxCostUsd?: number };
  executionSubAgentIds?: string[];
}): DispatchPlan {
  const owner = getAgentByName(input.agentName);
  if (!owner) throw new Error(`No registered system agent for ${input.agentName}`);

  const subAgents = owner.subAgents;
  if (subAgents.length === 0) throw new Error(`${input.agentName} has no registered sub-agents`);
  const executionSubAgentIds = input.executionSubAgentIds ?? [owner.entrySubAgent];
  const registeredIds = new Set(subAgents.map((subAgent) => subAgent.id));
  if (executionSubAgentIds.length === 0 || executionSubAgentIds.some((id) => !registeredIds.has(id))) {
    throw new Error(`Dispatch plan contains an unregistered sub-agent for ${input.agentName}`);
  }

  return {
    planId: input.planId ?? `plan-${randomUUID()}`,
    missionId: input.missionId ?? `mission-${randomUUID()}`,
    intent: input.intent.slice(0, 2000),
    category: categoryFor(owner, input.moduleKey),
    ownerAgent: owner.name,
    subAgents,
    entrySubAgent: owner.entrySubAgent,
    executionSubAgentIds: [...new Set(executionSubAgentIds)],
    requiresApproval: subAgents.some((subAgent) => subAgent.plane === 'write'),
    evidenceRefs: input.evidenceRefs ?? [],
    budgetCap: input.budgetCap,
  };
}

/**
 * Converts VANTA's proposal into a server-derived plan. VANTA supplies intent
 * and evidence references; ownership and sub-agent scope come from the local
 * registry, so model output cannot widen execution authority.
 */
export function dispatchPlanFromVantaProposal(proposal: VantaActionProposal): DispatchPlan | null {
  const moduleKey = VANTA_PROPOSAL_MODULES[proposal.targetModule.toUpperCase()];
  const ownerAgent = moduleKey ? systemAgentForModule(moduleKey) : undefined;
  if (!moduleKey || !ownerAgent) return null;
  return createDispatchPlan({
    intent: proposal.objective,
    agentName: ownerAgent,
    moduleKey,
    planId: proposal.dispatchPlan?.planId,
    missionId: proposal.dispatchPlan?.missionId,
    evidenceRefs: proposal.evidenceIds,
  });
}

/**
 * Expands a plan into a small, deterministic read-first chain. The registry
 * remains authoritative; this only selects already-owned sub-agents and never
 * grants a model a new execution capability.
 */
export function expandDispatchPlan(plan: DispatchPlan, maxNodes = 3): DispatchPlan {
  const selected = [plan.entrySubAgent, ...plan.subAgents
    .filter((subAgent) => subAgent.id !== plan.entrySubAgent && subAgent.plane === 'read')
    .map((subAgent) => subAgent.id)]
    .slice(0, Math.max(1, maxNodes));
  return { ...plan, executionSubAgentIds: [...new Set(selected)] };
}

export function taskMetadata(plan: DispatchPlan, task: Pick<AgentTask, 'parentTaskId'>): MissionTaskMetadata {
  return {
    missionId: plan.missionId,
    planId: plan.planId,
    subAgentId: plan.entrySubAgent,
    parentTaskId: task.parentTaskId,
    requiresApproval: plan.requiresApproval,
  };
}

/**
 * Materializes the selected registered sub-agents behind the existing DAG
 * seam. The entry node establishes shared evidence; independent specialists
 * then fan out from that evidence under their own grants.
 */
export function materializeDispatchGraph<T>(
  plan: DispatchPlan,
  input: {
    workspaceId: string;
    execute: (subAgent: SubAgentSpec, ctx: { workspaceId: string; nodeId: string }, upstream: Record<string, WorkflowNodeResult>) => Promise<T>;
  },
): BoundedWorkflowGraphConfig {
  const nodes: WorkflowNodeDefinition[] = plan.executionSubAgentIds.map((subAgentId, index) => {
    const subAgent = getSubAgent(subAgentId);
    const nodeId = `sub-agent:${subAgent.id}`;
    const dependencies = index === 0 ? [] : [`sub-agent:${plan.executionSubAgentIds[0]}`];
    return {
      id: nodeId,
      title: subAgent.purpose,
      inputSchema: subAgent.inputContract,
      outputSchema: subAgent.outputContract,
      permittedTools: subAgent.permittedTools,
      timeoutMs: subAgent.timeoutMs,
      maxRetries: 0,
      dependencies,
      budgetCap: plan.budgetCap,
      execute: async (ctx, upstream): Promise<WorkflowNodeResult & { value?: T }> => {
        try {
          const value = await input.execute(subAgent, ctx, upstream);
          return { status: 'succeeded', value };
        } catch (error) {
          return {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    } satisfies WorkflowNodeDefinition;
  });
  return { workspaceId: input.workspaceId, nodes, maxTotalTokens: plan.budgetCap?.maxTokens };
}
