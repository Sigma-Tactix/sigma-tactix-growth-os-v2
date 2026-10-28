import { describe, it, expect, vi } from 'vitest';
import {
  BoundedWorkflowGraph,
  type WorkflowNodeDefinition,
  type WorkflowNodeResult,
} from './boundedWorkflowGraph';

describe('Bounded Workflow Graph & DAG Execution Engine (Phase 2)', () => {
  const sampleNodes: WorkflowNodeDefinition[] = [
    {
      id: 'node-evidence-collect',
      title: 'Collect Baseline Evidence',
      inputSchema: 'v1.0.0',
      outputSchema: 'v1.0.0',
      permittedTools: ['curl', 'dns_lookup'],
      timeoutMs: 5000,
      maxRetries: 2,
      dependencies: [],
      execute: async () => ({
        status: 'succeeded',
        outputArtifactId: 'art-baseline-1',
        outputArtifactHash: 'sha256-hash-baseline-verified',
        findings: [
          { id: 'finding-101', dedupeKey: 'hostinger-dns-missing-hsts', summary: 'HSTS missing' },
        ],
      }),
    },
    {
      id: 'node-specialist-audit',
      title: 'Audit Specialist Analysis',
      inputSchema: 'v1.0.0',
      outputSchema: 'v1.0.0',
      permittedTools: ['aeo_parser'],
      timeoutMs: 5000,
      maxRetries: 2,
      dependencies: ['node-evidence-collect'],
      execute: async (_ctx, upstream) => {
        const dep = upstream['node-evidence-collect'];
        if (dep.outputArtifactHash !== 'sha256-hash-baseline-verified') {
          throw new Error('Corrupted upstream artifact hash');
        }
        return {
          status: 'succeeded',
          outputArtifactId: 'art-audit-1',
          outputArtifactHash: 'sha256-hash-audit-verified',
          findings: [
            { id: 'finding-102', dedupeKey: 'perplexity-aeo-unstructured', summary: 'AEO 0/0 citations' },
          ],
        };
      },
    },
  ];

  it('executes nodes in topological order and passes verified artifact hashes downstream', async () => {
    const graph = new BoundedWorkflowGraph({
      nodes: sampleNodes,
      workspaceId: 'ws-sigmatactix',
    });

    const execution = await graph.run();
    expect(execution.status).toBe('succeeded');
    expect(execution.completedNodeIds).toEqual(['node-evidence-collect', 'node-specialist-audit']);
    expect(execution.nodeResults['node-specialist-audit'].status).toBe('succeeded');
  });

  it('runs independent ready nodes concurrently, then releases their shared dependent', async () => {
    let releaseIndependent!: () => void;
    const independentGate = new Promise<void>((resolve) => { releaseIndependent = resolve; });
    const started: string[] = [];
    const nodes: WorkflowNodeDefinition[] = [
      {
        ...sampleNodes[0],
        id: 'independent-a',
        dependencies: [],
        execute: async () => {
          started.push('a');
          await independentGate;
          return { status: 'succeeded' };
        },
      },
      {
        ...sampleNodes[0],
        id: 'independent-b',
        dependencies: [],
        execute: async () => {
          started.push('b');
          await independentGate;
          return { status: 'succeeded' };
        },
      },
      {
        ...sampleNodes[1],
        id: 'dependent',
        dependencies: ['independent-a', 'independent-b'],
        execute: async () => {
          started.push('dependent');
          return { status: 'succeeded' };
        },
      },
    ];
    const graph = new BoundedWorkflowGraph({ nodes, workspaceId: 'ws-sigmatactix' });
    const executionPromise = graph.run();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(started).toEqual(['a', 'b']);
    releaseIndependent();

    const execution = await executionPromise;
    expect(execution.status).toBe('succeeded');
    expect(started).toEqual(['a', 'b', 'dependent']);
  });

  it('blocks downstream nodes when an upstream dependency fails without inventing fake replacements', async () => {
    const failingNodes: WorkflowNodeDefinition[] = [
      {
        ...sampleNodes[0],
        execute: async () => ({
          status: 'failed',
          error: 'Connection timeout contacting provider',
        }),
      },
      sampleNodes[1],
    ];

    const graph = new BoundedWorkflowGraph({
      nodes: failingNodes,
      workspaceId: 'ws-sigmatactix',
    });

    const execution = await graph.run();
    expect(execution.status).toBe('failed');
    expect(execution.nodeResults['node-evidence-collect'].status).toBe('failed');
    // Downstream node must be blocked, NOT executed with hallucinated data
    expect(execution.nodeResults['node-specialist-audit'].status).toBe('blocked');
    expect(execution.nodeResults['node-specialist-audit'].error).toContain('Blocked by failed or missing dependency: node-evidence-collect');
  });

  it('blocks downstream node if upstream artifact hash has been altered', async () => {
    const tamperedNodes: WorkflowNodeDefinition[] = [
      {
        ...sampleNodes[0],
        execute: async () => ({
          status: 'succeeded',
          outputArtifactId: 'art-baseline-1',
          outputArtifactHash: 'sha256-hash-baseline-TAMPERED',
        }),
      },
      sampleNodes[1],
    ];

    const graph = new BoundedWorkflowGraph({
      nodes: tamperedNodes,
      workspaceId: 'ws-sigmatactix',
    });

    const execution = await graph.run();
    expect(execution.status).toBe('failed');
    expect(execution.nodeResults['node-specialist-audit'].status).toBe('failed');
    expect(execution.nodeResults['node-specialist-audit'].error).toContain('Corrupted upstream artifact hash');
  });

  it('joins verifier findings strictly by findingId, never by array index', async () => {
    const findingsCollector: WorkflowNodeDefinition = {
      id: 'node-findings',
      title: 'Collect findings',
      inputSchema: 'v1.0.0',
      outputSchema: 'v1.0.0',
      permittedTools: [],
      timeoutMs: 1000,
      maxRetries: 0,
      dependencies: [],
      execute: async () => ({
        status: 'succeeded',
        findings: [
          { id: 'f-2', dedupeKey: 'key-2', summary: 'Second finding' },
          { id: 'f-1', dedupeKey: 'key-1', summary: 'First finding' },
        ],
      }),
    };

    const graph = new BoundedWorkflowGraph({
      nodes: [findingsCollector],
      workspaceId: 'ws-sigmatactix',
    });

    await graph.run();

    // Verification results mapped by findingId
    const verifications = [
      { findingId: 'f-1', status: 'verified_fact' },
      { findingId: 'f-2', status: 'rejected_unsupported' },
    ];

    const joined = graph.joinVerificationResults(verifications);
    expect(joined.get('f-1')?.summary).toBe('First finding');
    expect(joined.get('f-1')?.verificationStatus).toBe('verified_fact');
    expect(joined.get('f-2')?.summary).toBe('Second finding');
    expect(joined.get('f-2')?.verificationStatus).toBe('rejected_unsupported');
  });

  it('resumes from existing checkpoint idempotently, skipping finished nodes and avoiding duplicate side effects', async () => {
    const upstreamSpy = vi.fn().mockResolvedValue({
      status: 'succeeded' as const,
      outputArtifactId: 'art-1',
      outputArtifactHash: 'sha-1',
    });
    const downstreamSpy = vi.fn().mockResolvedValue({
      status: 'succeeded' as const,
      outputArtifactId: 'art-2',
      outputArtifactHash: 'sha-2',
    });

    const checkpoint: Record<string, WorkflowNodeResult> = {
      'node-evidence-collect': {
        status: 'succeeded',
        outputArtifactId: 'art-1',
        outputArtifactHash: 'sha-1',
      },
    };

    const graph = new BoundedWorkflowGraph({
      nodes: [
        { ...sampleNodes[0], execute: upstreamSpy },
        { ...sampleNodes[1], execute: downstreamSpy },
      ],
      workspaceId: 'ws-sigmatactix',
      checkpoint,
    });

    const execution = await graph.run();
    expect(execution.status).toBe('succeeded');
    // First node was already finished in checkpoint -> must NOT be executed again!
    expect(upstreamSpy).not.toHaveBeenCalled();
    // Second node executed
    expect(downstreamSpy).toHaveBeenCalledTimes(1);
  });

  it('halts with budget-exceeded status when token or cost cap is breached', async () => {
    const expensiveNode: WorkflowNodeDefinition = {
      id: 'node-heavy',
      title: 'Heavy LLM task',
      inputSchema: 'v1.0.0',
      outputSchema: 'v1.0.0',
      permittedTools: [],
      timeoutMs: 1000,
      maxRetries: 0,
      dependencies: [],
      budgetCap: { maxTokens: 1000 },
      execute: async () => ({
        status: 'succeeded',
        tokenUsage: 1500, // Breached token budget cap!
      }),
    };

    const graph = new BoundedWorkflowGraph({
      nodes: [expensiveNode],
      workspaceId: 'ws-sigmatactix',
      maxTotalTokens: 1000,
    });

    const execution = await graph.run();
    expect(execution.status).toBe('blocked');
    expect(execution.error).toContain('Budget cap exceeded');
  });
});
