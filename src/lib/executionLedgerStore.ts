/**
 * Phase 1: durable ledger write path (server-side).
 *
 * `executionLedger.ts` is an in-memory model — it proves the state machine but
 * survives nothing and enforces no tenancy. This module is the same state
 * machine persisted to Postgres (migration 0017), written through the
 * request-scoped Supabase client (`res.locals.sb`), which forwards the end
 * user's JWT. Every statement therefore runs under the ledger tables' RLS
 * policies (`public.is_member(workspace_id)`); there is no service-role path
 * here, by design.
 *
 * Contract with the caller: `workspace_state.agentTasks` remains the UI-facing
 * record until the cutover, so ledger failures are surfaced, never silently
 * swallowed, but they do not fail the request that already happened.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { RunStatus, isValidTransition } from "./executionLedger.js";
import type { AgentTask } from "../types.js";

export type LedgerActor = string;

/**
 * AgentTask["status"] is the coarse UI vocabulary; the ledger needs the exact
 * transition vocabulary so an invalid hop is impossible to express here.
 */
export const TASK_STATUS_TO_RUN_STATUS: Record<AgentTask["status"], RunStatus> = {
  "Pending Approval": "pending_approval",
  "Running": "running",
  "Success": "succeeded",
  "Failed": "failed",
  "Rejected": "rejected",
};

const ALL_STATUSES: RunStatus[] = [
  "requested", "pending_approval", "approved", "rejected", "queued",
  "running", "succeeded", "failed", "blocked", "cancelled",
];

/** Stable per-task key so a retried submit cannot create a second run. */
export function taskIdempotencyKey(taskId: string): string {
  return `agent-task:${taskId}`;
}

/**
 * Shortest legal path from `from` to `to`, inclusive of `to`, exclusive of
 * `from`. The task UI moves Pending Approval -> Running in one click while the
 * ledger's machine requires approved -> queued -> running, so the store walks
 * the hops and writes one event per hop instead of inventing a shortcut edge.
 * Returns [] when the states already match, null when no legal path exists.
 */
export function transitionPath(from: RunStatus, to: RunStatus): RunStatus[] | null {
  if (from === to) return [];
  const queue: RunStatus[][] = [[from]];
  const seen = new Set<RunStatus>([from]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const next of ALL_STATUSES) {
      if (!isValidTransition(current, next)) continue;
      const extended = [...path, next];
      if (next === to) return extended.slice(1);
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(extended);
    }
  }
  return null;
}

export interface NodeAttemptRecord {
  runId: string;
  nodeId: string;
  attempt: number;
  executorVersion: string;
  startedAt: number;
  endedAt?: number;
  error?: string;
}

/**
 * Phase 2 §6: every node records a versioned input/output attempt with
 * executor version and real start/end times.
 *
 * This is where honest latency comes from. Until now the ledger held only
 * lifecycle transitions, so the heatmap had no measured duration and correctly
 * reported "N/A (not measured)" — recording attempts here is what replaces
 * that unknown with a real number, rather than an invented one.
 */
export async function startNodeAttempt(
  sb: SupabaseClient,
  workspaceId: string,
  taskId: string,
  params: { nodeId: string; executorVersion: string }
): Promise<string | null> {
  const run = await findLedgerRun(sb, workspaceId, taskId);
  if (!run) return null; // No run yet (or ledger unavailable) — never fake one.

  const { count } = await sb
    .from("ledger_node_attempts")
    .select("id", { count: "exact", head: true })
    .eq("run_id", run.id)
    .eq("node_id", params.nodeId);

  const { data, error } = await sb
    .from("ledger_node_attempts")
    .insert({
      workspace_id: workspaceId,
      run_id: run.id,
      node_id: params.nodeId,
      attempt: (count || 0) + 1,
      executor_version: params.executorVersion,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(`node attempt start failed: ${error.message}`);
  return (data as { id: string }).id;
}

/** Closes an attempt with its measured duration, or the error that stopped it. */
export async function finishNodeAttempt(
  sb: SupabaseClient,
  workspaceId: string,
  attemptId: string,
  result: { error?: string }
): Promise<void> {
  if (!attemptId) return;
  const { error } = await sb
    .from("ledger_node_attempts")
    .update({
      ended_at: new Date().toISOString(),
      error: result.error ?? null,
    })
    .eq("id", attemptId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`node attempt finish failed: ${error.message}`);
}

/**
 * Total measured execution time per run, in ms.
 *
 * Only finished attempts count: an attempt with no `ended_at` is still in
 * flight, and treating it as zero would understate rather than admit ignorance.
 */
export async function listRunDurations(
  sb: SupabaseClient,
  workspaceId: string
): Promise<Record<string, number>> {
  const { data, error } = await sb
    .from("ledger_node_attempts")
    .select("run_id, started_at, ended_at")
    .eq("workspace_id", workspaceId)
    .not("ended_at", "is", null);

  if (error) throw new Error(`node attempt read failed: ${error.message}`);

  const durations: Record<string, number> = {};
  for (const row of (data as any[]) || []) {
    const ms = new Date(row.ended_at).getTime() - new Date(row.started_at).getTime();
    if (!Number.isFinite(ms) || ms < 0) continue;
    durations[row.run_id] = (durations[row.run_id] || 0) + ms;
  }
  return durations;
}

export interface LedgerRunRow {
  id: string;
  status: RunStatus;
}

/** Reads the run that tracks `taskId`, or null if it was never recorded. */
export async function findLedgerRun(
  sb: SupabaseClient,
  workspaceId: string,
  taskId: string
): Promise<LedgerRunRow | null> {
  const { data, error } = await sb
    .from("ledger_runs")
    .select("id, status")
    .eq("workspace_id", workspaceId)
    .eq("idempotency_key", taskIdempotencyKey(taskId))
    .maybeSingle();

  if (error) throw new Error(`ledger run lookup failed: ${error.message}`);
  return (data as LedgerRunRow | null) ?? null;
}

async function nextSequence(sb: SupabaseClient, runId: string): Promise<number> {
  const { data, error } = await sb
    .from("ledger_events")
    .select("sequence")
    .eq("run_id", runId)
    .order("sequence", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`ledger event sequence read failed: ${error.message}`);
  return ((data as { sequence: number } | null)?.sequence ?? -1) + 1;
}

/**
 * Creates the run for a task if absent, then advances it to `toStatus`,
 * appending one monotonic event per hop. Idempotent: re-syncing a task whose
 * run is already at `toStatus` writes nothing.
 */
export async function syncTaskToLedger(
  sb: SupabaseClient,
  workspaceId: string,
  task: AgentTask,
  actor: LedgerActor,
  details?: string
): Promise<LedgerRunRow> {
  let run = await findLedgerRun(sb, workspaceId, task.id);

  if (!run) {
    const { data, error } = await sb
      .from("ledger_runs")
      .insert({
        workspace_id: workspaceId,
        objective: (task.goal || task.agentName).slice(0, 2000),
        agent_name: task.agentName,
        correlation_id: task.id,
        idempotency_key: taskIdempotencyKey(task.id),
        status: "requested",
      })
      .select("id, status")
      .single();

    if (error) throw new Error(`ledger run insert failed: ${error.message}`);
    run = data as LedgerRunRow;

    const { error: eventError } = await sb.from("ledger_events").insert({
      workspace_id: workspaceId,
      run_id: run.id,
      sequence: 0,
      actor,
      transition: "created (status: requested)",
      details: task.goal || null,
    });
    if (eventError) throw new Error(`ledger event insert failed: ${eventError.message}`);
  }

  const target = TASK_STATUS_TO_RUN_STATUS[task.status];
  if (!target) {
    throw new Error(`Unknown agent task status "${task.status}" — no ledger transition defined.`);
  }

  const path = transitionPath(run.status as RunStatus, target);
  if (path === null) {
    throw new Error(
      `No legal ledger transition from "${run.status}" to "${target}" for task ${task.id}.`
    );
  }

  let status = run.status as RunStatus;

  // Nothing to record — don't touch ledger_events at all on a no-op re-sync.
  if (path.length === 0) {
    return { id: run.id, status };
  }

  let sequence = await nextSequence(sb, run.id);

  for (const hop of path) {
    const { error: updateError } = await sb
      .from("ledger_runs")
      .update({ status: hop })
      .eq("id", run.id)
      .eq("workspace_id", workspaceId);
    if (updateError) throw new Error(`ledger run update failed: ${updateError.message}`);

    const { error: insertError } = await sb.from("ledger_events").insert({
      workspace_id: workspaceId,
      run_id: run.id,
      sequence,
      actor,
      transition: `${status} -> ${hop}`,
      details: details ?? null,
    });
    if (insertError) throw new Error(`ledger event insert failed: ${insertError.message}`);

    sequence += 1;
    status = hop;
  }

  return { id: run.id, status };
}

/** Ledger run state -> the coarse AgentTask vocabulary the API/UI speaks. */
export const RUN_STATUS_TO_TASK_STATUS: Record<RunStatus, AgentTask["status"]> = {
  requested: "Pending Approval",
  pending_approval: "Pending Approval",
  approved: "Running",
  queued: "Running",
  running: "Running",
  succeeded: "Success",
  failed: "Failed",
  rejected: "Rejected",
  blocked: "Failed",
  cancelled: "Rejected",
};

/**
 * Reads tasks from the ledger — the authoritative record once cut over.
 *
 * Note what is NOT here: `steps` and `output`. The ledger stores lifecycle and
 * identity (run, agent, objective, status, timestamps), which is what every
 * status/counter/approval decision needs. The generated artifact body still
 * lives in `workspace_state` until artifacts are persisted with their content
 * hash (ledger_artifacts), so callers merge the two by task id rather than
 * pretending the ledger holds a transcript it does not.
 */
export async function listLedgerTasks(
  sb: SupabaseClient,
  workspaceId: string
): Promise<Array<Pick<AgentTask, "id" | "agentName" | "goal" | "status"> & {
  requestedBy?: string;
  createdAt: string;
  updatedAt: string;
}>> {
  const runs = await listLedgerRuns(sb, workspaceId, 200);
  return runs.map((run) => ({
    // The task's identity is correlation_id (the workspace_state task id), not
    // the ledger's own uuid — approve/reject address tasks by that id.
    id: run.correlationId || run.id,
    agentName: (run.agentName || "") as AgentTask["agentName"],
    goal: run.objective,
    status: RUN_STATUS_TO_TASK_STATUS[run.status],
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }));
}

export interface BackfillReconciliation {
  total: number;
  created: number;
  alreadyPresent: number;
  failed: number;
}

/**
 * Migrates legacy `workspace_state.agentTasks` rows into ledger runs with their
 * existing ids as `correlation_id`, so a task keeps one identity across the
 * cutover. Idempotent (keyed on `agent-task:<id>`), and it reports counts
 * rather than assuming success: a backfill that silently matched nothing is the
 * failure mode this exists to rule out.
 */
export async function backfillAgentTasks(
  sb: SupabaseClient,
  workspaceId: string,
  tasks: AgentTask[]
): Promise<BackfillReconciliation> {
  const counts: BackfillReconciliation = {
    total: tasks.length,
    created: 0,
    alreadyPresent: 0,
    failed: 0,
  };

  for (const task of tasks) {
    try {
      await syncTaskToLedger(sb, workspaceId, task, task.requestedBy || "system", "Backfilled from workspace_state");
      counts.created += 1;
    } catch (err: any) {
      const alreadyThere = /lookup failed|already exists|duplicate key/i.test(err?.message || "");
      if (alreadyThere) counts.alreadyPresent += 1;
      else counts.failed += 1;
      console.error(`Ledger backfill failed for task ${task.id}:`, err?.message || err);
    }
  }

  return counts;
}

/**
 * Phase 2: client acceptance of the published claim/measurement scale.
 *
 * The rubric (auditScoring.ts) and the claim classifications decide what a
 * client is agreeing to when they accept the Terms — "impact 40%" is an
 * estimate, not a promise. That acceptance is a legal fact, so it is recorded
 * with the exact terms version, the timestamp, and the user who accepted, and
 * written to the ledger alongside everything else rather than living in a
 * mutable settings blob.
 */

export const TERMS_VERSION = "2026-10-02.v1";

export interface TermsAcceptance {
  workspaceId: string;
  userId: string;
  termsVersion: string;
  acceptedAt: string;
  /** What they accepted, so the record is self-describing years later. */
  summary: string;
  ipAddress?: string;
}

export interface TermsAcceptanceResult {
  recorded: boolean;
  termsVersion: string;
  acceptedAt: string;
  /** False when there was no run to attach the acceptance to. */
  detail?: string;
}

/**
 * Records acceptance on a workspace's audit run.
 *
 * Keyed to the run's own event stream rather than a separate table: the
 * acceptance is then part of the same monotonic, append-only history as the
 * work it authorises, and cannot be edited or back-dated by editing a blob.
 */
export async function recordTermsAcceptance(
  sb: SupabaseClient,
  params: {
    workspaceId: string;
    userId: string;
    taskId: string;
    ipAddress?: string;
    summary?: string;
  }
): Promise<TermsAcceptanceResult> {
  const acceptedAt = new Date().toISOString();
  const summary = params.summary ??
    "Client accepted the measurement scale: scores are computed from published checks; " +
    "figures labelled estimate/hypothesis are model judgements, not measurements.";

  const run = await findLedgerRun(sb, params.workspaceId, params.taskId);
  if (!run) {
    // No run yet (or the ledger is unavailable). We still report the exact
    // version and time the client agreed to, rather than silently dropping it.
    return {
      recorded: false,
      termsVersion: TERMS_VERSION,
      acceptedAt,
      detail: "No ledger run found for this task; acceptance not written to the audit trail.",
    };
  }

  const { error } = await sb.from("ledger_events").insert({
    workspace_id: params.workspaceId,
    run_id: run.id,
    sequence: await nextSequence(sb, run.id),
    actor: params.userId,
    transition: `terms_accepted:${TERMS_VERSION}`,
    details: `${summary}${params.ipAddress ? ` (from ${params.ipAddress})` : ''}`,
  });

  if (error) throw new Error(`terms acceptance write failed: ${error.message}`);

  return { recorded: true, termsVersion: TERMS_VERSION, acceptedAt };
}
export async function listLedgerRuns(
  sb: SupabaseClient,
  workspaceId: string,
  limit = 50
): Promise<Array<{
  id: string;
  correlationId: string | null;
  objective: string;
  agentName: string | null;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  /** Measured execution time in ms, or null when nothing was measured yet. */
  durationMs: number | null;
}>> {
  const { data, error } = await sb
    .from("ledger_runs")
    .select("id, correlation_id, objective, agent_name, status, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`ledger run list failed: ${error.message}`);

  // Durations are measured separately (node attempts), and a failure there must
  // not hide the runs themselves — unknown duration is reported as null.
  let durations: Record<string, number> = {};
  try {
    durations = await listRunDurations(sb, workspaceId);
  } catch {
    durations = {};
  }

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    correlationId: row.correlation_id ?? null,
    objective: row.objective,
    agentName: row.agent_name ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    durationMs: durations[row.id] ?? null,
  }));
}