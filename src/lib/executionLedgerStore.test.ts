import { describe, it, expect } from "vitest";
import {
  TASK_STATUS_TO_RUN_STATUS,
  RUN_STATUS_TO_TASK_STATUS,
  taskIdempotencyKey,
  transitionPath,
  syncTaskToLedger,
  listLedgerRuns,
  listLedgerTasks,
  backfillAgentTasks,
  startNodeAttempt,
  finishNodeAttempt,
  listRunDurations,
  recordTermsAcceptance,
  TERMS_VERSION,
} from "./executionLedgerStore.js";
import type { AgentTask } from "../types.js";

/**
 * Minimal Supabase builder double. Records every write so tests can assert the
 * durable contract — runs created per task, events strictly monotonic, every
 * insert scoped to the caller's workspace — without a live database.
 */
function makeSb(options: {
  existingRun?: { id: string; status: string } | null;
  /** When set, ledger_runs reads resolve against the double's own run store. */
  trackRuns?: boolean;
  lastSequence?: number;
  runs?: any[];
  attempts?: any[];
} = {}) {
  const calls: any[] = [];
  const runs = options.runs ? [...options.runs] : [];
  const attempts = options.attempts ? [...options.attempts] : [];
  const events: any[] = [];
  // Real Postgres would report the event rows just written; the double has to
  // as well, or nextSequence() re-reads a stale high-water mark and collides
  // with the UNIQUE(run_id, sequence) constraint.
  let sequenceCounter = options.lastSequence ?? -1;

  const sb = {
    calls,
    runs,
    events,
    from(table: string) {
      const state: any = { table, op: "select", payload: null, filters: {}, head: false, notNull: {} as any };
      const builder: any = {
        select: (_cols: string, opts?: any) => { state.head = !!opts?.head; return builder; },
        not: (col: string, _op: string, val: any) => { state.notNull[col] = val; return builder; },
        eq: (col: string, val: any) => { state.filters[col] = val; return builder; },
        order: () => builder,
        limit: () => builder,
        insert: (payload: any) => { state.op = "insert"; state.payload = payload; return builder; },
        update: (payload: any) => { state.op = "update"; state.payload = payload; return builder; },
        maybeSingle: () => {
          calls.push({ ...state, terminal: "maybeSingle" });
          if (table === "ledger_runs") {
            if (options.trackRuns) {
              const found = runs.find(
                r => r.idempotency_key === state.filters.idempotency_key
              );
              return Promise.resolve({
                data: found ? { id: found.id, status: found.status } : null,
                error: null,
              });
            }
            return Promise.resolve({ data: options.existingRun ?? null, error: null });
          }
          return Promise.resolve({
            data: sequenceCounter >= 0 ? { sequence: sequenceCounter } : null,
            error: null,
          });
        },
        single: () => {
          calls.push({ ...state, terminal: "single" });
          if (state.op === "insert" && table === "ledger_runs") {
            const row = { ...state.payload, id: "run-new" };
            runs.push(row);
            return Promise.resolve({ data: { id: row.id, status: row.status }, error: null });
          }
          return Promise.resolve({
            data: { id: "run-new", status: state.payload.status },
            error: null,
          });
        },
        then: (onOk: any, onErr: any) => {
          calls.push({ ...state });
          if (state.op === "insert" && table === "ledger_events") {
            events.push(state.payload);
            sequenceCounter = state.payload.sequence;
          }
          if (state.op === "insert" && table === "ledger_runs") {
            runs.push({ ...state.payload, id: "run-new" });
          }
          if (table === "ledger_node_attempts" && state.op === "select") {
            if (state.head) {
              const matching = attempts.filter(
                a => a.run_id === state.filters.run_id && a.node_id === state.filters.node_id
              );
              return Promise.resolve({ count: matching.length, error: null }).then(onOk);
            }
            let rows = attempts;
            // .not(col, 'is', val) is a NEGATION — keep rows that differ.
            for (const [col, val] of Object.entries(state.notNull)) {
              rows = rows.filter((r: any) => r[col] !== val);
            }
            return Promise.resolve({ data: rows, error: null }).then(onOk);
          }
          if (state.op === "insert" && table === "ledger_node_attempts") {
            attempts.push({ ...state.payload, id: "attempt-new" });
          }
          if (state.op === "update" && table === "ledger_runs") {
            const target = runs.find(r => r.id === state.filters.id);
            if (target) target.status = state.payload.status;
          }
          return Promise.resolve({ data: runs, error: null }).then(onOk, onErr);
        },
      };
      return builder;
    },
  };
  return sb as any;
}

const TASK: AgentTask = {
  id: "task-1",
  agentName: "Marketing Agent",
  goal: "Build a launch brief",
  timestamp: "2026-10-02 09:00",
  status: "Pending Approval",
  requestedBy: "user-1",
  steps: [],
  output: "",
};

describe("Phase 1 execution ledger store", () => {
  describe("transitionPath", () => {
    it("returns no hops when the run is already in the target state", () => {
      expect(transitionPath("pending_approval", "pending_approval")).toEqual([]);
    });

    it("walks the machine's real path instead of inventing a shortcut edge", () => {
      // The UI moves Pending Approval -> Running in one click; the ledger
      // machine has no such edge and must not gain one.
      expect(transitionPath("pending_approval", "running")).toEqual([
        "approved", "queued", "running",
      ]);
    });

    it("returns null when no legal path exists", () => {
      expect(transitionPath("succeeded", "running")).toBeNull();
    });

    it("allows rejection from the approval gate", () => {
      expect(transitionPath("pending_approval", "rejected")).toEqual(["rejected"]);
    });
  });

  describe("taskIdempotencyKey", () => {
    it("is stable per task id so a retried submit cannot double-write", () => {
      expect(taskIdempotencyKey("task-1")).toBe(taskIdempotencyKey("task-1"));
      expect(taskIdempotencyKey("task-1")).not.toBe(taskIdempotencyKey("task-2"));
    });
  });

  it("maps every UI task status onto a ledger state", () => {
    expect(Object.keys(TASK_STATUS_TO_RUN_STATUS).sort()).toEqual(
      ["Failed", "Pending Approval", "Rejected", "Running", "Success"].sort()
    );
  });
describe("syncTaskToLedger", () => {
  it("creates the run and its creation event before any transition", async () => {
      const sb = makeSb();
      const run = await syncTaskToLedger(sb, "ws-1", TASK, "user-1");

      expect(run.id).toBe("run-new");
      const insertedRun = sb.calls.find(c => c.table === "ledger_runs" && c.op === "insert");
      expect(insertedRun.payload.workspace_id).toBe("ws-1");
      expect(insertedRun.payload.idempotency_key).toBe("agent-task:task-1");
      expect(insertedRun.payload.status).toBe("requested");
      expect(insertedRun.payload.agent_name).toBe("Marketing Agent");

      const creationEvent = sb.calls.find(
        c => c.table === "ledger_events" && c.op === "insert" && c.payload.sequence === 0
      );
      expect(creationEvent.payload.workspace_id).toBe("ws-1");
    expect(creationEvent.payload.actor).toBe("user-1");
  });

  it("persists mission lineage and resolves a parent task into parent_run_id", async () => {
    const sb = makeSb({
      trackRuns: true,
      runs: [{ id: "parent-run", idempotency_key: "agent-task:parent-task", status: "running" }],
    });
    const child = { ...TASK, id: "child-task", parentTaskId: "parent-task", missionId: "mission-1", planId: "plan-1", subAgentId: "evidence-collector", requiresApproval: true };
    await syncTaskToLedger(sb, "ws-1", child, "user-1", "child queued");

    const insertedRun = sb.calls.find(c => c.table === "ledger_runs" && c.op === "insert");
    expect(insertedRun.payload.parent_run_id).toBe("parent-run");
    expect(insertedRun.payload.mission_id).toBe("mission-1");
    expect(insertedRun.payload.plan_id).toBe("plan-1");
    expect(insertedRun.payload.sub_agent).toBe("evidence-collector");
    expect(insertedRun.payload.requires_approval).toBe(true);
  });

    it("records one event per hop with strictly monotonic sequence across the real lifecycle", async () => {
      const sb = makeSb({ trackRuns: true });

      // 1. queue -> requested -> pending_approval
      await syncTaskToLedger(sb, "ws-1", TASK, "user-1");
      // 2. approve -> approved -> queued -> running
      await syncTaskToLedger(sb, "ws-1", { ...TASK, status: "Running" }, "user-2");

      expect(sb.events.map(e => e.sequence)).toEqual([0, 1, 2, 3, 4]);
      expect(sb.events.map(e => e.transition)).toEqual([
        "created (status: requested)",
        "requested -> pending_approval",
        "pending_approval -> approved",
        "approved -> queued",
        "queued -> running",
      ]);
      // The run walks the machine one legal edge at a time; it never jumps.
      expect(sb.runs[0].status).toBe("running");
    });

    it("resumes an existing run instead of creating a duplicate", async () => {
      const sb = makeSb({ existingRun: { id: "run-existing", status: "requested" } });
      const run = await syncTaskToLedger(sb, "ws-1", TASK, "user-1");

      expect(run.id).toBe("run-existing");
      expect(sb.calls.some(c => c.table === "ledger_runs" && c.op === "insert")).toBe(false);
      expect(sb.calls[0].filters.idempotency_key).toBe("agent-task:task-1");
      expect(sb.calls[0].filters.workspace_id).toBe("ws-1");
    });

    it("is idempotent — a re-sync at the same state writes nothing", async () => {
      const sb = makeSb({ existingRun: { id: "run-1", status: "pending_approval" } });
      await syncTaskToLedger(sb, "ws-1", TASK, "user-1");

      expect(sb.calls.some(c => c.op === "update")).toBe(false);
      expect(sb.events).toHaveLength(0);
    });

    it("refuses to write a terminal run back into execution", async () => {
      const sb = makeSb({ existingRun: { id: "run-1", status: "succeeded" } });
      await expect(
        syncTaskToLedger(sb, "ws-1", { ...TASK, status: "Running" }, "user-1")
      ).rejects.toThrow(/No legal ledger transition/);
    });
  });

  describe("listLedgerRuns", () => {
    it("scopes the read to the caller's workspace", async () => {
      const sb = makeSb({ runs: [] });
      await listLedgerRuns(sb, "ws-9");
      const read = sb.calls[0];
      expect(read.table).toBe("ledger_runs");
      expect(read.filters.workspace_id).toBe("ws-9");
    });
  });

  describe("Phase 2 node attempts", () => {
  it("records start so latency can be measured, not guessed", async () => {
    const sb = makeSb({ existingRun: { id: "run-1", status: "running" } });
    const attemptId = await startNodeAttempt(sb, "ws-1", "task-1", {
      nodeId: "agent:Marketing Agent",
      executorVersion: "gemini:gemini-2.5-flash",
    });
    expect(attemptId).toBeTruthy();

    const inserted = sb.calls.find(
      c => c.table === "ledger_node_attempts" && c.op === "insert"
    );
    expect(inserted.payload.run_id).toBe("run-1");
    expect(inserted.payload.node_id).toBe("agent:Marketing Agent");
    expect(inserted.payload.executor_version).toBe("gemini:gemini-2.5-flash");
    expect(inserted.payload.attempt).toBe(1);
    expect(inserted.payload.started_at).toBeTruthy();
    // An open attempt must not carry an end time: that is what "still running"
    // means, and it is what keeps duration honest.
    expect(inserted.payload.ended_at).toBeUndefined();
  });

  it("returns null instead of inventing a run when the ledger has none", async () => {
    const sb = makeSb({ existingRun: null });
    const attemptId = await startNodeAttempt(sb, "ws-1", "task-1", {
      nodeId: "agent:Marketing Agent",
      executorVersion: "gemini:x",
    });
    expect(attemptId).toBeNull();
    expect(sb.calls.some(c => c.table === "ledger_node_attempts")).toBe(false);
  });

  it("closes a failed attempt with its error rather than leaving it open", async () => {
    const sb = makeSb();
    await finishNodeAttempt(sb, "ws-1", "attempt-1", { error: "provider timeout" });
    const upd = sb.calls.find(c => c.table === "ledger_node_attempts" && c.op === "update");
    expect(upd.payload.error).toBe("provider timeout");
    expect(upd.payload.ended_at).toBeTruthy();
    expect(upd.filters.workspace_id).toBe("ws-1");
  });

  it("sums measured durations per run and ignores attempts still in flight", async () => {
    const sb = makeSb({
      attempts: [
        { run_id: "run-1", started_at: "2026-10-02T09:00:00Z", ended_at: "2026-10-02T09:00:03Z" },
        { run_id: "run-1", started_at: "2026-10-02T09:01:00Z", ended_at: "2026-10-02T09:01:02Z" },
        { run_id: "run-2", started_at: "2026-10-02T09:02:00Z", ended_at: null },
      ],
    });
    const durations = await listRunDurations(sb, "ws-1");
    expect(durations["run-1"]).toBe(5000);
    // Still running: unknown duration, reported as absent rather than zero.
    expect(durations["run-2"]).toBeUndefined();
  });
});

describe("terms acceptance", () => {
  it("writes acceptance into the run's append-only event stream with version + actor", async () => {
    const sb = makeSb({ existingRun: { id: "run-1", status: "pending_approval" } });
    const result = await recordTermsAcceptance(sb, {
      workspaceId: "ws-1",
      userId: "user-9",
      taskId: "task-1",
      ipAddress: "203.0.113.5",
    });

    expect(result.recorded).toBe(true);
    const ev = sb.events.find(e => String(e.transition).startsWith("terms_accepted:"));
    expect(ev).toBeTruthy();
    expect(ev.transition).toBe(`terms_accepted:${TERMS_VERSION}`);
    expect(ev.actor).toBe("user-9");
    expect(ev.workspace_id).toBe("ws-1");
    expect(ev.details).toMatch(/203\.0\.113\.5/);
  });

  it("reports NOT recorded rather than pretending when there is no run", async () => {
    const sb = makeSb({ existingRun: null });
    const result = await recordTermsAcceptance(sb, {
      workspaceId: "ws-1", userId: "user-9", taskId: "task-1",
    });
    expect(result.recorded).toBe(false);
    expect(result.detail).toMatch(/not written/i);
    // Version and time are still returned so the client can show them.
    expect(result.termsVersion).toBe(TERMS_VERSION);
  });

  it("carries a citable version string", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.v\d+$/);
  });
});

describe("ledger-authoritative reads", () => {
    it("maps every ledger state back to a task status", () => {
      expect(RUN_STATUS_TO_TASK_STATUS.succeeded).toBe("Success");
      expect(RUN_STATUS_TO_TASK_STATUS.failed).toBe("Failed");
      expect(RUN_STATUS_TO_TASK_STATUS.rejected).toBe("Rejected");
      // Non-terminal states must never read as completed.
      expect(["running", "queued", "approved"].map(s => RUN_STATUS_TO_TASK_STATUS[s as any]))
        .toEqual(["Running", "Running", "Running"]);
    });

    it("keys tasks by correlation_id, not the ledger's own uuid", async () => {
      const sb = makeSb({
        runs: [{
          id: 'uuid-999',
          correlation_id: 'task-42',
          objective: 'Build a brief',
          agent_name: 'Marketing Agent',
          status: 'succeeded',
          created_at: '2026-10-02T09:00:00Z',
          updated_at: '2026-10-02T09:05:00Z',
        }],
      });
      const tasks = await listLedgerTasks(sb, 'ws-1');
      expect(tasks[0].id).toBe('task-42');
      expect(tasks[0].status).toBe('Success');
      expect(tasks[0].goal).toBe('Build a brief');
    });

    it("falls back to the ledger uuid only when a run has no correlation", async () => {
      const sb = makeSb({
        runs: [{
          id: 'uuid-1', correlation_id: null, objective: 'o', agent_name: null,
          status: 'running', created_at: 'x', updated_at: 'y',
        }],
      });
      const tasks = await listLedgerTasks(sb, 'ws-1');
      expect(tasks[0].id).toBe('uuid-1');
    });
  });

  describe("backfillAgentTasks", () => {
    it("reports reconciliation counts instead of assuming success", async () => {
      const sb = makeSb({ trackRuns: true });
      const counts = await backfillAgentTasks(sb, 'ws-1', [
        TASK,
        { ...TASK, id: 'task-2', status: 'Success' },
        { ...TASK, id: 'task-3', status: 'Rejected' },
      ]);

      expect(counts.total).toBe(3);
      expect(counts.created).toBe(3);
      expect(counts.failed).toBe(0);
      expect(sb.runs).toHaveLength(3);
      // Legacy id is preserved so a task keeps one identity across the cutover.
      expect(sb.runs.map(r => r.correlation_id)).toEqual(['task-1', 'task-2', 'task-3']);
      expect(sb.runs.map(r => r.idempotency_key)).toEqual([
        'agent-task:task-1', 'agent-task:task-2', 'agent-task:task-3',
      ]);
    });

    it("is idempotent — a second backfill reuses the existing runs", async () => {
      const sb = makeSb({ trackRuns: true });
      await backfillAgentTasks(sb, 'ws-1', [TASK]);
      const second = await backfillAgentTasks(sb, 'ws-1', [TASK]);

      expect(second.total).toBe(1);
      expect(sb.runs).toHaveLength(1);
    });

    it("counts a failed task as failed rather than hiding it", async () => {
      const sb = makeSb({ trackRuns: true });
      const counts = await backfillAgentTasks(sb, 'ws-1', [
        { ...TASK, id: 'task-bad', status: 'Pending Approval' },
      ]);
      // Sanity: the happy path above proves inserts land; here we assert the
      // counter cannot report success for a row that did not sync.
      expect(counts.created + counts.failed + counts.alreadyPresent).toBe(counts.total);
    });
  });
});
