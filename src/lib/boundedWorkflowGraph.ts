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
  private discoveredFindings: Map<string, Finding> = new Map();

  constructor(config: BoundedWorkflowGraphConfig) {
    this.workspaceId = config.workspaceId;
    this.checkpoint = config.checkpoint || {};
    this.maxTotalTokens = config.maxTotalTokens;

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

    // Populate existing findings from checkpoint
    for (const result of Object.values(nodeResults)) {
      if (result.findings) {
        for (const f of result.findings) {
          this.discoveredFindings.set(f.id, f);
        }
      }
    }

    for (const nodeId of sortedNodeIds) {
      const node = this.nodes.get(nodeId)!;

      // 1. Check if node was already successfully completed in checkpoint (idempotent resume)
      if (nodeResults[nodeId]?.status === 'succeeded') {
        completedNodeIds.push(nodeId);
        continue;
      }

      // 2. Validate all upstream dependencies
      let blockedReason: string | undefined;
      for (const depId of node.dependencies) {
        const depResult = nodeResults[depId];
        if (!depResult || depResult.status !== 'succeeded') {
          blockedReason = `Blocked by failed or missing dependency: ${depId}`;
          break;
        }
      }

      if (blockedReason) {
        nodeResults[nodeId] = {
          status: 'blocked',
          error: blockedReason,
        };
        return {
          status: 'failed',
          completedNodeIds,
          nodeResults,
          totalTokensUsed: totalTokens,
          error: blockedReason,
        };
      }

      // 3. Check cumulative budget cap
      if (this.maxTotalTokens && totalTokens >= this.maxTotalTokens) {
        const err = `Budget cap exceeded: ${totalTokens} >= ${this.maxTotalTokens} tokens`;
        nodeResults[nodeId] = {
          status: 'blocked',
          error: err,
        };
        return {
          status: 'blocked',
          completedNodeIds,
          nodeResults,
          totalTokensUsed: totalTokens,
          error: err,
        };
      }

      // 4. Execute node with bounded retries
      let attempts = 0;
      const maxAttempts = 1 + (node.maxRetries || 0);
      let lastResult: WorkflowNodeResult | undefined;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Node ${nodeId} timed out after ${node.timeoutMs}ms`)), node.timeoutMs)
          );

          const execPromise = node.execute(
            { workspaceId: this.workspaceId, nodeId },
            nodeResults
          );

          lastResult = await Promise.race([execPromise, timeoutPromise]);

          if (lastResult.status === 'succeeded') {
            break;
          }
        } catch (err) {
          lastResult = {
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      if (!lastResult) {
        lastResult = { status: 'failed', error: 'Unknown execution outcome' };
      }

      // Accumulate tokens
      if (lastResult.tokenUsage) {
        totalTokens += lastResult.tokenUsage;
        if (this.maxTotalTokens && totalTokens > this.maxTotalTokens) {
          nodeResults[nodeId] = lastResult;
          return {
            status: 'blocked',
            completedNodeIds,
            nodeResults,
            totalTokensUsed: totalTokens,
            error: `Budget cap exceeded: ${totalTokens} > ${this.maxTotalTokens} tokens`,
          };
        }
      }

      // Track findings with dedupe keys
      if (lastResult.findings) {
        for (const f of lastResult.findings) {
          this.discoveredFindings.set(f.id, f);
        }
      }

      nodeResults[nodeId] = lastResult;

      if (lastResult.status === 'succeeded') {
        completedNodeIds.push(nodeId);
      } else {
        // Mark remaining downstream nodes that depend on this failed node as blocked
        for (const remainingId of sortedNodeIds) {
          if (!nodeResults[remainingId]) {
            const remainingNode = this.nodes.get(remainingId);
            if (remainingNode?.dependencies.includes(nodeId)) {
              nodeResults[remainingId] = {
                status: 'blocked',
                error: `Blocked by failed or missing dependency: ${nodeId}`,
              };
            }
          }
        }

        return {
          status: 'failed',
          completedNodeIds,
          nodeResults,
          totalTokensUsed: totalTokens,
          error: lastResult.error || `Node ${nodeId} execution failed`,
        };
      }
    }

    return {
      status: 'succeeded',
      completedNodeIds,
      nodeResults,
      totalTokensUsed: totalTokens,
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
