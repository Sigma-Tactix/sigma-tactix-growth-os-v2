import { describe, it, expect } from "vitest";
import {
  interpretLedgerProbe,
  formatLedgerGuardFailure,
  probeLedgerUsability,
} from "./executionLedgerHealth.js";

const ok = { error: null };
const fail = (message: string) => ({ error: { message } });

describe("execution ledger boot guard (Phase 1)", () => {
  it("passes when the ledger is fully readable", () => {
    const result = interpretLedgerProbe({
      runs: ok,
      events: ok,
      agentNameColumn: ok,
    });
    expect(result.ok).toBe(true);
    expect(result.problems).toHaveLength(0);
  });

  it("fails loudly when the migration was never applied", () => {
    const result = interpretLedgerProbe({
      runs: fail("Could not find the table 'public.ledger_runs'"),
      events: fail("Could not find the table 'public.ledger_events'"),
      agentNameColumn: fail("Could not find the table 'public.ledger_runs'"),
    });
    expect(result.ok).toBe(false);
    expect(result.problems.join(' ')).toMatch(/0017_execution_ledger\.sql/);
  });

  it("catches the half-applied migration a table-exists check would miss", () => {
    // Tables exist, but agent_name does not — writes would fail at runtime.
    const result = interpretLedgerProbe({
      runs: ok,
      events: ok,
      agentNameColumn: fail('column ledger_runs.agent_name does not exist'),
    });
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toMatch(/agent_name is missing/);
  });

  it("flags a partially applied ledger where events are missing", () => {
    const result = interpretLedgerProbe({
      runs: ok,
      events: fail("relation does not exist"),
      agentNameColumn: ok,
    });
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toMatch(/incomplete/);
  });

  it("names both remedies in the failure message", () => {
    const message = formatLedgerGuardFailure(["ledger_runs is not readable"]);
    expect(message).toMatch(/REFUSING TO START/);
    expect(message).toMatch(/EXECUTION_LEDGER_AUTHORITATIVE=false/);
    expect(message).toMatch(/ledger_runs is not readable/);
  });

  it("probes all three signals through the client", async () => {
    const queried: string[] = [];
    const sb = {
      from(table: string) {
        let selectCols = '';
        const builder: any = {
          select: (cols: string) => { selectCols = cols; return builder; },
          limit: () => builder,
          then: (ok2: any) => {
            queried.push(`${table}:${selectCols}`);
            return Promise.resolve({ data: [], error: null }).then(ok2);
          },
        };
        return builder;
      },
    };
    const result = await probeLedgerUsability(sb);
    expect(result.ok).toBe(true);
    expect(queried).toContain("ledger_runs:id");
    expect(queried).toContain("ledger_events:id");
    expect(queried).toContain("ledger_runs:agent_name");
  });
});