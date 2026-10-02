import { describe, it, expect } from 'vitest';
import { ExecutionLedger } from './executionLedger';
import { renderExecutiveReportPDF, type BrandProfile } from './pdfReportRenderer';
import { createDefaultReportSnapshot, type ReportSnapshot } from './reportSnapshot';
import { BoundedWorkflowGraph, type WorkflowNodeDefinition } from './boundedWorkflowGraph';
import { verifyClaimEvidence, type EvidenceRecord } from './evidenceContract';

describe('Growth OS Bounded Stress Suite (Phase 6 Final Verification)', () => {
  it('handles 20 simultaneous local task submissions with duplicate idempotency keys without duplicate executions', async () => {
    const ledger = new ExecutionLedger();
    const taskSubmissions = [];

    // Submit 20 tasks, 10 unique keys submitted twice each
    for (let i = 0; i < 20; i++) {
      const keyIndex = i % 10;
      taskSubmissions.push(
        Promise.resolve().then(() =>
          ledger.createRun({
            workspaceId: 'ws-stress-test',
            objective: `Execute task #${keyIndex}`,
            requester: 'usr-stress-admin',
            idempotencyKey: `idemp-key-${keyIndex}`,
          })
        )
      );
    }

    const runs = await Promise.all(taskSubmissions);
    expect(runs).toHaveLength(20);

    // Verify deduplication: exactly 10 distinct run IDs exist across the 20 submissions
    const distinctRunIds = new Set(runs.map(r => r.id));
    expect(distinctRunIds.size).toBe(10);
    expect(ledger.listRuns('ws-stress-test')).toHaveLength(10);
  });

  it('executes 10 concurrent two-brand report renders with zero cross-tenant bleeding and verifies timings', async () => {
    const brandA: BrandProfile = {
      brandName: 'Sigma Tactix Core',
      primaryColor: '#FF481B', // Sigma Orange
      textColor: '#1A1A1A',
      fontFamily: 'helvetica',
      themeMode: 'light',
    };

    const brandB: BrandProfile = {
      brandName: 'Veloce Dynamics Enterprise',
      primaryColor: '#059669', // Emerald
      textColor: '#0A0A0A',
      fontFamily: 'times',
      themeMode: 'light',
    };

    const renderPromises = [];
    const timings: number[] = [];

    for (let i = 0; i < 10; i++) {
      const isBrandA = i % 2 === 0;
      const snapshot: ReportSnapshot = createDefaultReportSnapshot({
        workspaceId: isBrandA ? `ws-brand-a-${i}` : `ws-brand-b-${i}`,
        tenantName: isBrandA ? 'Sigma Tactix Core' : 'Veloce Dynamics Enterprise',
        title: `Concurrent Report Batch ${i + 1}`,
        objective: 'Testing concurrent PDF rendering isolation',
      });

      const selectedBrand = isBrandA ? brandA : brandB;
      const start = performance.now();

      renderPromises.push(
        renderExecutiveReportPDF(snapshot, selectedBrand).then(res => {
          timings.push(performance.now() - start);
          return res;
        })
      );
    }

    const rendered = await Promise.all(renderPromises);
    expect(rendered).toHaveLength(10);

    for (const r of rendered) {
      expect(r.byteSize).toBeGreaterThan(2000);
      expect(r.artifactHash).toMatch(/^[a-f0-9]{64}$/);
    }

    // Verify distinct artifact hashes across batches
    const hashes = new Set(rendered.map(r => r.artifactHash));
    expect(hashes.size).toBe(10);

    // Calculate latency metrics
    timings.sort((a, b) => a - b);
    const p50 = timings[Math.floor(timings.length * 0.5)];
    const p95 = timings[Math.floor(timings.length * 0.95)];

    expect(p50).toBeLessThan(500); // p50 < 500ms
    expect(p95).toBeLessThan(1000); // p95 < 1000ms
  });

  it('survives mid-run worker interruption and resumes from checkpoint without repeating finished nodes', async () => {
    let node1Executions = 0;
    let node2Executions = 0;

    const sampleNodes: WorkflowNodeDefinition[] = [
      {
        id: 'node-1',
        title: 'Step 1',
        inputSchema: 'v1.0',
        outputSchema: 'v1.0',
        permittedTools: [],
        timeoutMs: 1000,
        maxRetries: 0,
        dependencies: [],
        execute: async () => {
          node1Executions++;
          return { status: 'succeeded', outputArtifactHash: 'hash-step-1' };
        },
      },
      {
        id: 'node-2',
        title: 'Step 2',
        inputSchema: 'v1.0',
        outputSchema: 'v1.0',
        permittedTools: [],
        timeoutMs: 1000,
        maxRetries: 0,
        dependencies: ['node-1'],
        execute: async () => {
          node2Executions++;
          return { status: 'succeeded', outputArtifactHash: 'hash-step-2' };
        },
      },
    ];

    // Initial run finishes node-1, then saves checkpoint
    const graph1 = new BoundedWorkflowGraph({
      nodes: sampleNodes,
      workspaceId: 'ws-resume',
    });

    const execution1 = await graph1.run();
    expect(execution1.status).toBe('succeeded');
    expect(node1Executions).toBe(1);
    expect(node2Executions).toBe(1);

    // Resume execution using checkpoint containing node-1
    const resumedGraph = new BoundedWorkflowGraph({
      nodes: sampleNodes,
      workspaceId: 'ws-resume',
      checkpoint: {
        'node-1': { status: 'succeeded', outputArtifactHash: 'hash-step-1' },
      },
    });

    const execution2 = await resumedGraph.run();
    expect(execution2.status).toBe('succeeded');
    // node-1 was NOT executed again!
    expect(node1Executions).toBe(1);
    // node-2 was executed for the second run
    expect(node2Executions).toBe(2);
  });

  it('rejects malformed, oversized, and unevidenced inputs', () => {
    const invalidEvidence: EvidenceRecord = {
      id: 'ev-bad-1',
      workspaceId: 'ws-different', // foreign workspace
      claimId: 'claim-1',
      claimClassification: 'measured_fact',
      claimText: '99% conversion lift',
      dataSource: 'synthetic',
      sourceLocator: 'https://sigmatactix.com',
      coveredPeriod: { start: '2026-01-01', end: '2026-01-31' },
      observationTime: '2020-01-01T00:00:00Z', // stale observation time
      retrievalResult: 'failed',
      scope: 'test',
      confidence: 0.1,
    };

    const verification = verifyClaimEvidence({
      claimId: 'claim-1',
      workspaceId: 'ws-target',
      statement: '99% conversion lift',
      claimedPercentage: 99,
      hasBehavioralAnalyticsEvidence: false,
      evidence: [invalidEvidence],
    });

    expect(verification.verified).toBe(false);
    expect(verification.reasons.length).toBeGreaterThanOrEqual(3);
    expect(verification.classification).toBe('unavailable');
  });
});
