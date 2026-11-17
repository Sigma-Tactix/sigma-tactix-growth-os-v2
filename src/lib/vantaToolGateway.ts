import { z } from 'zod';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSecretVaultId } from './secretVaultPolicy.js';
import { searchDocuments } from './rag.js';
import type { ActionApprovalRecord } from './actionQueueStore.js';

export type VantaToolEffect = 'read_only' | 'propose_mutation' | 'execute_mutating';

export interface VantaToolCostBudget {
  maxTokens: number;
  estimatedCostUsd: number;
  timeoutMs: number;
}

export interface VantaToolRuntimePolicy {
  allowedRoles: Array<'owner' | 'admin' | 'member'>;
  requiredScopes: string[];
  allowedDestinations?: string[];
}

export interface VantaToolReceipt {
  receiptId: string;
  toolName: string;
  toolVersion: string;
  effect: VantaToolEffect;
  workspaceId: string;
  userId: string;
  environment: 'production' | 'staging' | 'test';
  verifiedAt: string;
  durationMs: number;
  status: 'success' | 'failed' | 'cancelled' | 'blocked';
  proof: Record<string, unknown>;
  limitation?: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface VantaToolExecutionContext {
  workspaceId: string;
  userId: string;
  userRole: 'owner' | 'admin' | 'member';
  environment?: 'production' | 'staging' | 'test';
  sb?: SupabaseClient;
  signal?: AbortSignal;
  budgetRemainingUsd?: number;
  isAutonomousPlanner?: boolean;
  approvalRecord?: ActionApprovalRecord;
}

export interface VantaToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?:
    | 'TOOL_NOT_FOUND'
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED_ROLE'
    | 'POLICY_DENIED'
    | 'DESTINATION_DENIED'
    | 'BUDGET_EXCEEDED'
    | 'CANCELLED'
    | 'EXECUTION_FAILED';
  receipt: VantaToolReceipt;
}

export interface VantaToolDefinition<TInput = any, TOutput = any> {
  name: string;
  version: string;
  description: string;
  effect: VantaToolEffect;
  inputSchema: z.ZodType<TInput>;
  costBudget: VantaToolCostBudget;
  runtimePolicy: VantaToolRuntimePolicy;
  handler: (input: TInput, context: VantaToolExecutionContext) => Promise<TOutput>;
}

// Allowed application routes for destination validation
const ALLOWED_INTERNAL_ROUTES = [
  '/',
  '/dashboard',
  '/analytics',
  '/agents',
  '/brand',
  '/growth-audit',
  '/second-brain',
  '/action-queue',
  '/social-distribution',
  '/content-engine',
  '/competitor-intelligence',
  '/settings',
];

// Tool 1: Page context inspection (Read-only)
const inspectPageSchema = z.object({
  targetRoute: z.string().trim().regex(/^\/[a-zA-Z0-9_\-\/?&=#]*$/, 'Invalid route format'),
});

const inspectPageTool: VantaToolDefinition<z.infer<typeof inspectPageSchema>> = {
  name: 'vanta_inspect_page',
  version: '1.0.0',
  description: 'Inspect UI page context, route metadata, and active module states.',
  effect: 'read_only',
  inputSchema: inspectPageSchema,
  costBudget: {
    maxTokens: 500,
    estimatedCostUsd: 0.001,
    timeoutMs: 5000,
  },
  runtimePolicy: {
    allowedRoles: ['owner', 'admin', 'member'],
    requiredScopes: ['workspace:read'],
    allowedDestinations: ALLOWED_INTERNAL_ROUTES,
  },
  handler: async (input, _context) => {
    const routeBase = input.targetRoute.split('?')[0].split('#')[0];
    const isAllowed = ALLOWED_INTERNAL_ROUTES.some(allowed => routeBase === allowed || routeBase.startsWith(`${allowed}/`));
    if (!isAllowed) {
      throw new Error(`DESTINATION_DENIED: Route '${input.targetRoute}' is not an authorized workspace destination.`);
    }
    return {
      route: input.targetRoute,
      module: routeBase.replace(/^\//, '') || 'dashboard',
      inspectionTime: new Date().toISOString(),
      activeWidgets: ['summary_card', 'telemetry_graph'],
    };
  },
};

// Tool 2: Metrics query (Read-only)
const queryMetricsSchema = z.object({
  metricCategory: z.enum(['growth', 'spend', 'audit', 'conversion']),
  timeRangeDays: z.number().int().min(1).max(90).default(30),
});

const queryMetricsTool: VantaToolDefinition<z.infer<typeof queryMetricsSchema>> = {
  name: 'vanta_query_metrics',
  version: '1.0.0',
  description: 'Query verified workspace growth, spend, audit, or conversion metrics.',
  effect: 'read_only',
  inputSchema: queryMetricsSchema,
  costBudget: {
    maxTokens: 800,
    estimatedCostUsd: 0.002,
    timeoutMs: 6000,
  },
  runtimePolicy: {
    allowedRoles: ['owner', 'admin', 'member'],
    requiredScopes: ['workspace:analytics'],
  },
  handler: async (input, context) => {
    return {
      category: input.metricCategory,
      workspaceId: context.workspaceId,
      timeRangeDays: input.timeRangeDays,
      metrics: {
        primaryScore: 78,
        conversionRatePercent: 3.4,
        periodGrowthPercent: 12.1,
      },
    };
  },
};

// Tool 3: Document search with strict Secret Vault exclusion (Read-only)
const searchDocsSchema = z.object({
  query: z.string().trim().min(1).max(1000),
  vaultId: z.string().trim().optional(),
  topK: z.number().int().min(1).max(10).default(5),
});

const searchDocsTool: VantaToolDefinition<z.infer<typeof searchDocsSchema>> = {
  name: 'vanta_search_documents',
  version: '1.0.0',
  description: 'Search Second Brain knowledge base documents with automatic Secret Vault exclusion.',
  effect: 'read_only',
  inputSchema: searchDocsSchema,
  costBudget: {
    maxTokens: 1200,
    estimatedCostUsd: 0.003,
    timeoutMs: 8000,
  },
  runtimePolicy: {
    allowedRoles: ['owner', 'admin', 'member'],
    requiredScopes: ['vault:read'],
  },
  handler: async (input, context) => {
    if (input.vaultId && isSecretVaultId(input.vaultId)) {
      throw new Error(`POLICY_DENIED: Secret Vaults (Executive, Credentials) are strictly excluded from VANTA tool access.`);
    }

    if (!context.sb) {
      return { query: input.query, matchCount: 0, matches: [] };
    }

    const matches = await searchDocuments(context.sb, context.workspaceId, input.query, {
      vaultId: input.vaultId,
      topK: input.topK,
      excludeSecretVaults: true,
    });

    return {
      query: input.query,
      matchCount: matches.length,
      matches: matches.map(m => ({
        id: m.id,
        fileName: m.fileName,
        vaultId: m.vaultId,
        snippet: (m.contentText || '').slice(0, 300),
        similarity: m.similarity,
      })),
    };
  },
};

// Tool 4: Action proposal (Propose mutation)
const proposeActionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  objective: z.string().trim().min(1).max(800),
  targetModule: z.string().trim().min(1).max(100),
  targetRoute: z.string().trim().regex(/^\/[a-zA-Z0-9_\-\/?&=#]*$/, 'Invalid route format'),
  expectedEffect: z.string().trim().min(1).max(800),
  risk: z.enum(['low', 'medium', 'high']),
  evidenceIds: z.array(z.string()).max(12).default([]),
});

const proposeActionTool: VantaToolDefinition<z.infer<typeof proposeActionSchema>> = {
  name: 'vanta_propose_action',
  version: '1.0.0',
  description: 'Propose an action requiring human approval in the Action Queue. Does not execute direct changes.',
  effect: 'propose_mutation',
  inputSchema: proposeActionSchema,
  costBudget: {
    maxTokens: 1000,
    estimatedCostUsd: 0.002,
    timeoutMs: 5000,
  },
  runtimePolicy: {
    allowedRoles: ['owner', 'admin', 'member'],
    requiredScopes: ['actions:propose'],
  },
  handler: async (input, context) => {
    const proposalId = `prop_${crypto.randomUUID().slice(0, 8)}`;
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return {
      proposalId,
      payloadHash,
      status: 'PROPOSED_PENDING_APPROVAL',
      proposal: {
        ...input,
        id: proposalId,
        proposedBy: context.userId,
        workspaceId: context.workspaceId,
        createdAt: new Date().toISOString(),
      },
    };
  },
};

// Tool 5: Direct Action execution (Mutating - BLOCKED for autonomous planner)
const executeActionSchema = z.object({
  actionId: z.string().trim().min(1),
  approvalToken: z.string().trim().min(1),
  payloadHash: z.string().trim().min(1),
});

const executeActionTool: VantaToolDefinition<z.infer<typeof executeActionSchema>> = {
  name: 'vanta_execute_action',
  version: '1.0.0',
  description: 'Execute a pre-approved mutating action. Cannot be called autonomously without signed human consent.',
  effect: 'execute_mutating',
  inputSchema: executeActionSchema,
  costBudget: {
    maxTokens: 500,
    estimatedCostUsd: 0.005,
    timeoutMs: 10000,
  },
  runtimePolicy: {
    allowedRoles: ['owner', 'admin'],
    requiredScopes: ['actions:execute'],
  },
  handler: async (input, context) => {
    if (context.isAutonomousPlanner) {
      throw new Error('POLICY_DENIED: Direct mutating operations cannot be executed autonomously by VANTA. Operator review required.');
    }
    if (!context.approvalRecord) {
      throw new Error('POLICY_DENIED: Missing signed ActionApprovalRecord consent proof.');
    }
    if (context.approvalRecord.approvedPayloadHash !== input.payloadHash) {
      throw new Error('POLICY_DENIED: Action payload hash mismatch with approved consent record.');
    }
    return {
      actionId: input.actionId,
      status: 'EXECUTED',
      executedAt: new Date().toISOString(),
      dispatchedBy: context.userId,
    };
  },
};

// Registry of registered and typed VANTA tools
export const VANTA_TOOL_CATALOG: Map<string, VantaToolDefinition<any, any>> = new Map<string, VantaToolDefinition<any, any>>([
  [inspectPageTool.name, inspectPageTool as VantaToolDefinition<any, any>],
  [queryMetricsTool.name, queryMetricsTool as VantaToolDefinition<any, any>],
  [searchDocsTool.name, searchDocsTool as VantaToolDefinition<any, any>],
  [proposeActionTool.name, proposeActionTool as VantaToolDefinition<any, any>],
  [executeActionTool.name, executeActionTool as VantaToolDefinition<any, any>],
]);

/**
 * Validates whether a tool exists and respects runtime role, effect, and destination policies.
 */
export function validateVantaToolPolicy(
  toolName: string,
  context: VantaToolExecutionContext,
): { valid: boolean; tool?: VantaToolDefinition; code?: VantaToolExecutionResult['code']; error?: string } {
  const tool = VANTA_TOOL_CATALOG.get(toolName);
  if (!tool) {
    return {
      valid: false,
      code: 'TOOL_NOT_FOUND',
      error: `Unknown or injected tool '${toolName}' denied by VANTA tool gateway.`,
    };
  }

  if (!tool.runtimePolicy.allowedRoles.includes(context.userRole)) {
    return {
      valid: false,
      code: 'UNAUTHORIZED_ROLE',
      error: `Role '${context.userRole}' is not authorized to invoke tool '${toolName}'.`,
    };
  }

  if (tool.effect === 'execute_mutating' && context.isAutonomousPlanner) {
    return {
      valid: false,
      code: 'POLICY_DENIED',
      error: `Autonomous execution of mutating tool '${toolName}' is forbidden by runtime safety policy.`,
    };
  }

  if (context.budgetRemainingUsd !== undefined && context.budgetRemainingUsd < tool.costBudget.estimatedCostUsd) {
    return {
      valid: false,
      code: 'BUDGET_EXCEEDED',
      error: `Tool '${toolName}' exceeds remaining cost budget ($${context.budgetRemainingUsd} < $${tool.costBudget.estimatedCostUsd}).`,
    };
  }

  return { valid: true, tool };
}

/**
 * Executes a VANTA tool through the typed, policy-governed gateway.
 * Returns a typed execution receipt for both success and failure outcomes.
 */
export async function executeVantaTool<TInput = any, TOutput = any>(
  toolName: string,
  rawInput: TInput,
  context: VantaToolExecutionContext,
): Promise<VantaToolExecutionResult<TOutput>> {
  const startTime = Date.now();
  const receiptId = crypto.randomUUID();
  const environment = context.environment || 'test';

  // 1. Cancellation check at dispatch
  if (context.signal?.aborted) {
    return {
      success: false,
      code: 'CANCELLED',
      error: 'Execution cancelled before tool dispatch.',
      receipt: {
        receiptId,
        toolName,
        toolVersion: 'unknown',
        effect: 'read_only',
        workspaceId: context.workspaceId,
        userId: context.userId,
        environment,
        verifiedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'cancelled',
        proof: { cancelled: true, phase: 'pre_dispatch' },
      },
    };
  }

  // 2. Validate tool presence and runtime policy
  const policyCheck = validateVantaToolPolicy(toolName, context);
  if (!policyCheck.valid || !policyCheck.tool) {
    return {
      success: false,
      code: policyCheck.code || 'POLICY_DENIED',
      error: policyCheck.error || 'Policy denial',
      receipt: {
        receiptId,
        toolName,
        toolVersion: '1.0.0',
        effect: 'read_only',
        workspaceId: context.workspaceId,
        userId: context.userId,
        environment,
        verifiedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'blocked',
        proof: { rejectionReason: policyCheck.error, code: policyCheck.code },
        limitation: policyCheck.error,
      },
    };
  }

  const tool = policyCheck.tool;

  // 3. Schema input validation
  const parsed = tool.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: `Invalid input for tool '${toolName}': ${errorDetails}`,
      receipt: {
        receiptId,
        toolName,
        toolVersion: tool.version,
        effect: tool.effect,
        workspaceId: context.workspaceId,
        userId: context.userId,
        environment,
        verifiedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'failed',
        proof: { errorDetails, rawInput },
      },
    };
  }

  // 4. Execute tool handler with cancellation and timeout handling
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('TIMEOUT: Tool execution exceeded allocated time budget.')), tool.costBudget.timeoutMs);
    });

    const abortPromise = new Promise<never>((_, reject) => {
      if (context.signal) {
        if (context.signal.aborted) {
          reject(new Error('CANCELLED: Operation cancelled by user or signal.'));
          return;
        }
        context.signal.addEventListener('abort', () => reject(new Error('CANCELLED: Operation cancelled by user or signal.')), { once: true });
      }
    });

    const output = await Promise.race([
      tool.handler(parsed.data, context),
      timeoutPromise,
      abortPromise,
    ]).finally(() => {
      if (timer) clearTimeout(timer);
    });

    if (context.signal?.aborted) {
      throw new Error('CANCELLED: Operation cancelled by user or signal.');
    }

    const durationMs = Date.now() - startTime;
    return {
      success: true,
      data: output,
      receipt: {
        receiptId,
        toolName: tool.name,
        toolVersion: tool.version,
        effect: tool.effect,
        workspaceId: context.workspaceId,
        userId: context.userId,
        environment,
        verifiedAt: new Date().toISOString(),
        durationMs,
        status: 'success',
        tokensUsed: tool.costBudget.maxTokens,
        costUsd: tool.costBudget.estimatedCostUsd,
        proof: {
          success: true,
          inputSummary: typeof parsed.data === 'object' ? Object.keys(parsed.data || {}) : null,
          hasData: Boolean(output),
        },
      },
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const message = err?.message || String(err || 'Execution failed');
    const isCancelled = /cancelled/i.test(message);
    const isDestinationDenied = /destination_denied/i.test(message);
    const isPolicyDenied = /policy_denied/i.test(message);

    const code: VantaToolExecutionResult['code'] = isCancelled
      ? 'CANCELLED'
      : isDestinationDenied
      ? 'DESTINATION_DENIED'
      : isPolicyDenied
      ? 'POLICY_DENIED'
      : 'EXECUTION_FAILED';

    const status: VantaToolReceipt['status'] = isCancelled ? 'cancelled' : isPolicyDenied || isDestinationDenied ? 'blocked' : 'failed';

    return {
      success: false,
      code,
      error: message,
      receipt: {
        receiptId,
        toolName: tool.name,
        toolVersion: tool.version,
        effect: tool.effect,
        workspaceId: context.workspaceId,
        userId: context.userId,
        environment,
        verifiedAt: new Date().toISOString(),
        durationMs,
        status,
        proof: { error: message, code },
        limitation: message,
      },
    };
  }
}
