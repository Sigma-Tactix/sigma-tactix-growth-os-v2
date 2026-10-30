/**
 * Bounded Workflow Graph & DAG Execution Engine (Phase 2)
 *
 * Enforces topological DAG execution, explicit artifact hash forwarding,
 * downstream blocking on dependency failures (never inventing data),
 * deduplication key tracking for findings, index-free verification joins,
 * and checkpoint-based idempotent resumption.
 */

export interface Finding {
  id: string;
  dedupeKey: string;
  summary: string;
  verificationStatus?: string;
}

export interface WorkflowNodeResult {
  status: 'succeeded' | 'failed' | 'blocked' | 'skipped';
  outputArtifactId?: string;
  outputArtifactHash?: string;
  tokenUsage?: number;
  findings?: Finding[];
  error?: string;
}

export interface WorkflowContext {
  workspaceId: string;
  nodeId: string;
}

export interface WorkflowNodeDefinition {
  id: string;
  title: string;
  inputSchema: string;
  outputSchema: string;
  permittedTools: string[];
  timeoutMs: number;
  maxRetries: number;
  dependencies: string[];
  budgetCap?: { maxTokens?: number; maxCostUsd?: number };
  execute: (
    ctx: WorkflowContext,
    upstream: Record<string, WorkflowNodeResult>
  ) => Promise<WorkflowNodeResult>;
}

export interface BoundedWorkflowGraphConfig {
  nodes: WorkflowNodeDefinition[];
  workspaceId: string;
  checkpoint?: Record<string, WorkflowNodeResult>;
  maxTotalTokens?: number;
  /** Hard ceiling for independent node execution within this process. */
  maxConcurrentNodes?: number;
}

export interface WorkflowExecutionSummary {
  status: 'succeeded' | 'failed' | 'blocked';
  completedNodeIds: string[];
  nodeResults: Record<string, WorkflowNodeResult>;
  totalTokensUsed: number;
  error?: string;
}

export class BoundedWorkflowGraph {
  private nodes: Map<string, WorkflowNodeDefinition> = new Map();
  private workspaceId: string;
  private checkpoint: Record<string, WorkflowNodeResult>;
  private maxTotalTokens?: number;
  private maxConcurrentNodes: number;
  private discoveredFindings: Map<string, Finding> = new Map();

  constructor(config: BoundedWorkflowGraphConfig) {
    this.workspaceId = config.workspaceId;
    this.checkpoint = config.checkpoint || {};
    this.maxTotalTokens = config.maxTotalTokens;
    this.maxConcurrentNodes = Math.max(1, Math.floor(config.maxConcurrentNodes ?? 4));

    for (const node of config.nodes) {
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Topological sorting of nodes
   */
  private getTopologicalOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visiting.has(id)) {
        throw new Error(`Cycle detected in workflow graph involving node: ${id}`);
      }
      if (!visited.has(id)) {
        visiting.add(id);
        const node = this.nodes.get(id);
        if (node) {
          for (const depId of node.dependencies) {
            if (!this.nodes.has(depId)) {
              throw new Error(`Node ${id} references unknown dependency ${depId}`);
            }
            visit(depId);
          }
        }
        visiting.delete(id);
        visited.add(id);
        order.push(id);
      }
    };

    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    return order;
  }

  /**
   * Runs the workflow DAG with dependency validation, bounds, and checkpointing.
   */
  async run(): Promise<WorkflowExecutionSummary> {
    const nodeResults: Record<string, WorkflowNodeResult> = { ...this.checkpoint };
    const completedNodeIds: string[] = [];
    let totalTokens = 0;
    const sortedNodeIds = this.getTopologicalOrder();
    const pendingNodeIds = new Set<string>();
    let hasFailure = false;

    // Populate existing findings from checkpoint
    for (const result of Object.values(nodeResults)) {
      if (result.findings) {
        for (const f of result.findings) {
          this.discoveredFindings.set(f.id, f);
        }
      }
    }

    for (const nodeId of sortedNodeIds) {
      if (nodeResults[nodeId]?.status === 'succeeded') completedNodeIds.push(nodeId);
      else pendingNodeIds.add(nodeId);
    }

    const executeNode = async (node: WorkflowNodeDefinition): Promise<WorkflowNodeResult> => {
      let attempts = 0;
      const maxAttempts = 1 + (node.maxRetries || 0);
      let lastResult: WorkflowNodeResult | undefined;
      while (attempts < maxAttempts) {
        attempts++;
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Node ${node.id} timed out after ${node.timeoutMs}ms`)), node.timeoutMs),
          );
          lastResult = await Promise.race([
            node.execute({ workspaceId: this.workspaceId, nodeId: node.id }, nodeResults),
            timeoutPromise,
          ]);
          if (lastResult.status === 'succeeded') break;
        } catch (err) {
          lastResult = { status: 'failed', error: err instanceof Error ? err.message : String(err) };
        }
      }
      return lastResult || { status: 'failed', error: 'Unknown execution outcome' };
    };

    while (pendingNodeIds.size > 0) {
      if (this.maxTotalTokens && totalTokens >= this.maxTotalTokens) {
        const error = `Budget cap exceeded: ${totalTokens} >= ${this.maxTotalTokens} tokens`;
        for (const nodeId of pendingNodeIds) nodeResults[nodeId] = { status: 'blocked', error };
        return { status: 'blocked', completedNodeIds, nodeResults, totalTokensUsed: totalTokens, error };
      }

      // Never schedule a node after an upstream failure. This loop propagates
      // blocking through every downstream generation while unrelated branches
      // remain eligible to finish in parallel.
      let blockedAny = false;
      for (const nodeId of sortedNodeIds) {
        if (!pendingNodeIds.has(nodeId)) continue;
        const node = this.nodes.get(nodeId)!;
        const failedDependency = node.dependencies.find((dependencyId) => {
          const dependency = nodeResults[dependencyId];
          return dependency && dependency.status !== 'succeeded';
        });
        if (failedDependency) {
          nodeResults[nodeId] = { status: 'blocked', error: `Blocked by failed or missing dependency: ${failedDependency}` };
          pendingNodeIds.delete(nodeId);
          blockedAny = true;
          hasFailure = true;
        }
      }
      if (blockedAny) continue;

      const ready = sortedNodeIds
        .filter((nodeId) => pendingNodeIds.has(nodeId))
        .filter((nodeId) => this.nodes.get(nodeId)!.dependencies.every((dependencyId) => nodeResults[dependencyId]?.status === 'succeeded'));
      if (ready.length === 0) {
        const error = 'Workflow has no runnable nodes; dependencies are missing or unresolved.';
        for (const nodeId of pendingNodeIds) nodeResults[nodeId] = { status: 'blocked', error };
        return { status: 'failed', completedNodeIds, nodeResults, totalTokensUsed: totalTokens, error };
      }

      const batch = ready.slice(0, this.maxConcurrentNodes);
      const outcomes = await Promise.all(batch.map(async (nodeId) => ({ nodeId, result: await executeNode(this.nodes.get(nodeId)!) })));
      for (const { nodeId, result } of outcomes) {
        pendingNodeIds.delete(nodeId);
        nodeResults[nodeId] = result;
        totalTokens += result.tokenUsage || 0;
        for (const finding of result.findings || []) this.discoveredFindings.set(finding.id, finding);
        if (result.status === 'succeeded') completedNodeIds.push(nodeId);
        else hasFailure = true;
      }

      if (this.maxTotalTokens && totalTokens > this.maxTotalTokens) {
        const error = `Budget cap exceeded: ${totalTokens} > ${this.maxTotalTokens} tokens`;
        for (const nodeId of pendingNodeIds) nodeResults[nodeId] = { status: 'blocked', error };
        return { status: 'blocked', completedNodeIds, nodeResults, totalTokensUsed: totalTokens, error };
      }
    }

    return {
      status: hasFailure ? 'failed' : 'succeeded',
      completedNodeIds,
      nodeResults,
      totalTokensUsed: totalTokens,
      error: hasFailure ? 'One or more workflow nodes failed or were blocked.' : undefined,
    };
  }

  /**
   * Joins verifier results by finding ID, NEVER by array position.
   */
  joinVerificationResults(
    verifications: Array<{ findingId: string; status: string }>
  ): Map<string, Finding> {
    const joined = new Map<string, Finding>();

    for (const v of verifications) {
      const existing = this.discoveredFindings.get(v.findingId);
      if (existing) {
        joined.set(v.findingId, {
          ...existing,
          verificationStatus: v.status,
        });
      }
    }

    return joined;
  }
}
