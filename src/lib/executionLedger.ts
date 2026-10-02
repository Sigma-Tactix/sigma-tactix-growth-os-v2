/**
 * Phase 1: Transactional Execution Ledger & State Machine
 *
 * Implements durable runs, monotonic transition events, explicit approvals/rejections,
 * node attempts, artifacts, and multi-tenant workspace isolation.
 */

export type RunStatus =
  | 'requested'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export interface ExecutionRun {
  id: string;
  workspaceId: string;
  objective: string;
  workflowVersion?: string;
  requester: string;
  status: RunStatus;
  createdAt: number;
  updatedAt: number;
  budgetCap?: number;
  correlationId?: string;
  idempotencyKey?: string;
  taskIds: string[];
}

export interface NodeAttempt {
  id: string;
  runId: string;
  nodeId: string;
  attempt: number;
  executorVersion: string;
  inputRef?: string;
  outputRef?: string;
  startedAt: number;
  endedAt?: number;
  error?: string;
}

export interface LedgerEvent {
  id: string;
  sequence: number;
  runId: string;
  workspaceId: string;
  actor: string;
  transition: string;
  details?: string;
  timestamp: number;
}

export interface ApprovalRecord {
  id: string;
  runId: string;
  actor: string;
  decision: 'APPROVED' | 'REJECTED';
  scope: string[];
  rationale?: string;
  approvedContentHash?: string;
  timestamp: number;
}

export interface ArtifactReportRecord {
  id: string;
  runId: string;
  version: string;
  contentHash: string;
  storageKey: string;
  byteSize: number;
  createdAt: number;
}

export interface DeliveryAttemptRecord {
  id: string;
  runId: string;
  artifactId: string;
  destination: string;
  idempotencyKey: string;
  requestedAt: number;
  receipt?: string;
  state: 'queued' | 'transmitted' | 'failed';
  error?: string;
}

const ALLOWED_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  requested: ['pending_approval', 'queued', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['queued', 'cancelled'],
  rejected: [],
  queued: ['running', 'cancelled', 'blocked'],
  running: ['succeeded', 'failed', 'blocked', 'cancelled'],
  blocked: ['queued', 'cancelled', 'failed'],
  succeeded: [],
  failed: ['queued'], // retryable
  cancelled: [],
};

export function isValidTransition(from: RunStatus, to: RunStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export class ExecutionLedger {
  private runs = new Map<string, ExecutionRun>();
  private events: LedgerEvent[] = [];
  private approvals: ApprovalRecord[] = [];
  private idempotencyIndex = new Map<string, string>(); // idempotencyKey -> runId
  private globalSequence = 0;

  createRun(params: {
    workspaceId: string;
    objective: string;
    requester: string;
    workflowVersion?: string;
    budgetCap?: number;
    idempotencyKey?: string;
    correlationId?: string;
    taskIds?: string[];
  }): ExecutionRun {
    if (params.idempotencyKey) {
      const existingId = this.idempotencyIndex.get(params.idempotencyKey);
      if (existingId) {
        const existingRun = this.runs.get(existingId);
        if (existingRun && existingRun.workspaceId === params.workspaceId) {
          return existingRun;
        }
      }
    }

    const id = `run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = Date.now();
    const run: ExecutionRun = {
      id,
      workspaceId: params.workspaceId,
      objective: params.objective,
      workflowVersion: params.workflowVersion || 'v1.0.0',
      requester: params.requester,
      status: 'requested',
      createdAt: now,
      updatedAt: now,
      budgetCap: params.budgetCap,
      correlationId: params.correlationId || id,
      idempotencyKey: params.idempotencyKey,
      taskIds: params.taskIds || [],
    };

    this.runs.set(id, run);
    if (params.idempotencyKey) {
      this.idempotencyIndex.set(params.idempotencyKey, id);
    }

    this.recordEvent({
      runId: id,
      workspaceId: params.workspaceId,
      actor: params.requester,
      transition: 'created (status: requested)',
      details: params.objective,
    });

    return run;
  }

  getRun(runId: string): ExecutionRun | undefined {
    return this.runs.get(runId);
  }

  listRuns(workspaceId: string): ExecutionRun[] {
    return Array.from(this.runs.values()).filter(r => r.workspaceId === workspaceId);
  }

  transitionRun(runId: string, toStatus: RunStatus, actor: string, details?: string): ExecutionRun {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run "${runId}" not found in ledger.`);
    }

    if (!isValidTransition(run.status, toStatus)) {
      throw new Error(
        `Invalid ledger state transition from "${run.status}" to "${toStatus}" for run "${runId}".`
      );
    }

    const previousStatus = run.status;
    run.status = toStatus;
    run.updatedAt = Date.now();

    this.recordEvent({
      runId,
      workspaceId: run.workspaceId,
      actor,
      transition: `${previousStatus} -> ${toStatus}`,
      details,
    });

    return run;
  }

  recordApproval(params: {
    runId: string;
    actor: string;
    decision: 'APPROVED' | 'REJECTED';
    scope: string[];
    rationale?: string;
    approvedContentHash?: string;
  }): ApprovalRecord {
    const run = this.runs.get(params.runId);
    if (!run) {
      throw new Error(`Run "${params.runId}" not found.`);
    }

    const approval: ApprovalRecord = {
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      runId: params.runId,
      actor: params.actor,
      decision: params.decision,
      scope: params.scope,
      rationale: params.rationale,
      approvedContentHash: params.approvedContentHash,
      timestamp: Date.now(),
    };

    this.approvals.push(approval);
    return approval;
  }

  private recordEvent(params: {
    runId: string;
    workspaceId: string;
    actor: string;
    transition: string;
    details?: string;
  }): LedgerEvent {
    this.globalSequence += 1;
    const event: LedgerEvent = {
      id: `evt-${Date.now()}-${this.globalSequence}`,
      sequence: this.globalSequence,
      runId: params.runId,
      workspaceId: params.workspaceId,
      actor: params.actor,
      transition: params.transition,
      details: params.details,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  getEventsForRun(runId: string): LedgerEvent[] {
    return this.events.filter(e => e.runId === runId);
  }

  getEventsForWorkspace(workspaceId: string): LedgerEvent[] {
    return this.events.filter(e => e.workspaceId === workspaceId);
  }
}

// Global server-side singleton ledger instance
export const globalExecutionLedger = new ExecutionLedger();
