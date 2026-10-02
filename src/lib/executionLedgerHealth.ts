/**
 * Execution-ledger usability probe (Phase 1 cutover guard).
 *
 * If EXECUTION_LEDGER_AUTHORITATIVE=true, the app is claiming the ledger is
 * the record of truth. If the tables are missing or half-migrated, that claim
 * fails silently in the worst way: every task lookup returns "not found" and
 * the HITL approve/reject queue goes dead, with nothing in the logs to say why.
 *
 * So we verify before trusting. Two deliberate limitations:
 *  - This probe runs as service_role, which BYPASSES RLS. It therefore proves
 *    tables/columns/grants exist, not that the policies are intact.
 *  - Policy drift is only detectable through the catalog (psql + verify.sql
 *    checks 19-22), not through PostgREST. That check is documented rather than
 *    silently assumed.
 */

export interface LedgerProbe {
  runs: { error: { message: string } | null };
  events: { error: { message: string } | null };
  agentNameColumn: { error: { message: string } | null };
}

export interface LedgerUsability {
  ok: boolean;
  problems: string[];
}

/** Pure interpretation of the probe, so the rules are unit-testable. */
export function interpretLedgerProbe(probe: LedgerProbe): LedgerUsability {
  const problems: string[] = [];

  if (probe.runs.error) {
    problems.push(
      `ledger_runs is not readable (${probe.runs.error.message}) — apply backend/database/migrations/0017_execution_ledger.sql`
    );
  }
  if (probe.events.error) {
    problems.push(
      `ledger_events is not readable (${probe.events.error.message}) — the ledger migration is incomplete`
    );
  }
  // A missing column is the classic half-applied migration: the table exists
  // (so a naive "does the table exist" check passes) but the writes fail.
  if (probe.agentNameColumn.error) {
    problems.push(
      `ledger_runs.agent_name is missing (${probe.agentNameColumn.error.message}) — the ledger migration is incomplete`
    );
  }

  return { ok: problems.length === 0, problems };
}

/** Probes the live ledger using a service-role client (RLS bypassed by design). */
export async function probeLedgerUsability(
  sb: { from: (table: string) => any }
): Promise<LedgerUsability> {
  const [runs, events, agentNameColumn] = await Promise.all([
    sb.from("ledger_runs").select("id").limit(1),
    sb.from("ledger_events").select("id").limit(1),
    sb.from("ledger_runs").select("agent_name").limit(1),
  ]);

  return interpretLedgerProbe({
    runs: { error: runs.error ? { message: runs.error.message } : null },
    events: { error: events.error ? { message: events.error.message } : null },
    agentNameColumn: {
      error: agentNameColumn.error ? { message: agentNameColumn.error.message } : null,
    },
  });
}

/** The message printed before refusing to boot. */
export function formatLedgerGuardFailure(problems: string[]): string {
  return [
    "",
    "=".repeat(72),
    "REFUSING TO START: EXECUTION_LEDGER_AUTHORITATIVE=true, but the execution",
    "ledger is not usable. The app would trust a record it cannot read, and every",
    "agent task lookup would fail.",
    "",
    ...problems.map((p) => `  - ${p}`),
    "",
    "Fix: apply the migration and verify it (psql $DATABASE_URL < backend/database/",
    "migrations/verify.sql — checks 19-22 cover RLS, policies and grants), or set",
    "EXECUTION_LEDGER_AUTHORITATIVE=false to start without trusting the ledger.",
    "=".repeat(72),
    "",
  ].join("\n");
}