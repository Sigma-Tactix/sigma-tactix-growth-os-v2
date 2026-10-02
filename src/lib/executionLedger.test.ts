import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExecutionLedger,
  ExecutionRun,
  LedgerEvent,
  ApprovalRecord,
  isValidTransition,
} from './executionLedger';

describe('Phase 1 Execution Ledger & State Machine', () => {
  let ledger: ExecutionLedger;

  beforeEach(() => {
    ledger = new ExecutionLedger();
  });

  it('enforces strict state transition rules', () => {
    expect(isValidTransition('requested', 'pending_approval')).toBe(true);
    expect(isValidTransition('pending_approval', 'approved')).toBe(true);
    expect(isValidTransition('pending_approval', 'rejected')).toBe(true);
    expect(isValidTransition('approved', 'queued')).toBe(true);
    expect(isValidTransition('queued', 'running')).toBe(true);
    expect(isValidTransition('running', 'succeeded')).toBe(true);
    expect(isValidTransition('running', 'failed')).toBe(true);
    expect(isValidTransition('running', 'blocked')).toBe(true);
    expect(isValidTransition('running', 'cancelled')).toBe(true);

    // Invalid transitions must be rejected
    expect(isValidTransition('requested', 'succeeded')).toBe(false);
    expect(isValidTransition('pending_approval', 'running')).toBe(false);
    expect(isValidTransition('rejected', 'approved')).toBe(false);
    expect(isValidTransition('succeeded', 'running')).toBe(false);
  });

  it('creates a durable run and returns a collision-resistant run ID', () => {
    const run = ledger.createRun({
      workspaceId: 'ws-test-1',
      objective: 'Authority Growth Strategy Execution',
      requester: 'usr-admin-1',
      idempotencyKey: 'idemp-ws-test-1-strat-01',
    });

    expect(run.id).toMatch(/^run-[a-z0-9_-]+$/i);
    expect(run.status).toBe('requested');
    expect(run.workspaceId).toBe('ws-test-1');
  });

  it('deduplicates simultaneous submissions using idempotency key', () => {
    const run1 = ledger.createRun({
      workspaceId: 'ws-test-1',
      objective: 'Run diagnostic audit',
      requester: 'usr-admin-1',
      idempotencyKey: 'idemp-diag-001',
    });

    const run2 = ledger.createRun({
      workspaceId: 'ws-test-1',
      objective: 'Run diagnostic audit',
      requester: 'usr-admin-1',
      idempotencyKey: 'idemp-diag-001',
    });

    expect(run1.id).toBe(run2.id);
    expect(ledger.listRuns('ws-test-1')).toHaveLength(1);
  });

  it('records immutable transition events in monotonic sequence', () => {
    const run = ledger.createRun({
      workspaceId: 'ws-test-1',
      objective: 'Content leak fixing',
      requester: 'usr-admin-1',
    });

    ledger.transitionRun(run.id, 'pending_approval', 'usr-admin-1', 'Awaiting HITL review');
    ledger.recordApproval({
      runId: run.id,
      actor: 'usr-lead-approver',
      decision: 'APPROVED',
      scope: ['Marketing Vault', 'Authority Vault'],
      rationale: 'Approved budget and strategy scope',
    });

    ledger.transitionRun(run.id, 'approved', 'usr-lead-approver', 'HITL approval granted');
    ledger.transitionRun(run.id, 'queued', 'system', 'Dispatched to queue');

    const events = ledger.getEventsForRun(run.id);
    expect(events.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].sequence).toBeGreaterThan(events[i - 1].sequence);
      expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp);
    }
  });

  it('records explicit rejection and prevents duplicate approvals', () => {
    const run = ledger.createRun({
      workspaceId: 'ws-test-1',
      objective: 'High risk budget adjustment',
      requester: 'usr-analyst-2',
    });

    ledger.transitionRun(run.id, 'pending_approval', 'usr-analyst-2', 'Requires signoff');
    const rejection = ledger.recordApproval({
      runId: run.id,
      actor: 'usr-owner-1',
      decision: 'REJECTED',
      scope: [],
      rationale: 'Budget cap exceeded ceiling',
    });

    expect(rejection.decision).toBe('REJECTED');
    ledger.transitionRun(run.id, 'rejected', 'usr-owner-1', 'Rejected by owner');

    // Attempting to approve after rejection must fail
    expect(() => {
      ledger.transitionRun(run.id, 'approved', 'usr-analyst-2', 'Bypassing rejection');
    }).toThrow();
  });

  it('isolates ledger runs and events by workspace', () => {
    ledger.createRun({
      workspaceId: 'ws-alpha',
      objective: 'Alpha initiative',
      requester: 'usr-a',
    });

    ledger.createRun({
      workspaceId: 'ws-beta',
      objective: 'Beta initiative',
      requester: 'usr-b',
    });

    expect(ledger.listRuns('ws-alpha')).toHaveLength(1);
    expect(ledger.listRuns('ws-beta')).toHaveLength(1);
    expect(ledger.listRuns('ws-gamma')).toHaveLength(0);
  });
});
