import { describe, it, expect } from "vitest";
import { resolveWorkspaceId, loadWorkspace, saveWorkspace, WorkspaceConflictError } from "./workspaceStore.js";
import { emptyWorkspaceData } from "../initialData.js";
import { demoWorkspaceData } from "../data/demoWorkspace.js";

// Minimal fake of the Supabase query builder — just the chained methods the
// store uses. `terminals` supplies the resolved value for each terminal call,
// and `calls` records what happened so tests can assert on it.
function makeSb(terminals: Record<string, any>) {
  const calls: any[] = [];
  const sb = {
    calls,
    from(table: string) {
      const state: any = { table, op: "select", payload: null, filters: {} };
      // Resolution order: a terminal keyed by the WRITE op wins (so a test can
      // stub "workspace_state.update" specifically), otherwise fall back to the
      // terminal method name. Without this, an insert().select().single() chain
      // and a plain select().single() chain are indistinguishable.
      const pick = (kind: string) =>
        terminals[`${table}.${state.op}`] ?? terminals[`${table}.${kind}`] ?? { data: null, error: null };
      const builder: any = {
        select: () => builder,
        eq: (col: string, val: any) => { state.filters[col] = val; return builder; },
        in: () => builder,
        limit: () => builder,
        insert: (p: any) => { state.op = "insert"; state.payload = p; return builder; },
        update: (p: any) => { state.op = "update"; state.payload = p; return builder; },
        upsert: (p: any) => { state.op = "upsert"; state.payload = p; return builder; },
        maybeSingle: () => {
          calls.push({ ...state, terminal: "maybeSingle" });
          return Promise.resolve(pick("maybeSingle"));
        },
        single: () => {
          calls.push({ ...state, terminal: "single" });
          return Promise.resolve(pick("single"));
        },
        // Makes the builder awaitable directly, for chains with no terminal
        // method (a bare upsert).
        then: (onOk: any, onErr: any) => {
          calls.push({ ...state });
          return Promise.resolve(pick("then")).then(onOk, onErr);
        },
      };
      return builder;
    },
  };
  return sb as any;
}

describe("workspaceStore.resolveWorkspaceId", () => {
  it("returns the existing workspace id when one is owned", async () => {
    const sb = makeSb({ "workspaces.maybeSingle": { data: { id: "ws-1" }, error: null } });
    expect(await resolveWorkspaceId(sb, "user-1")).toBe("ws-1");
  });

  it("creates a workspace when none exists and returns the new id", async () => {
    const sb = makeSb({
      "workspaces.maybeSingle": { data: null, error: null },
      "workspaces.single": { data: { id: "ws-new" }, error: null },
    });
    expect(await resolveWorkspaceId(sb, "user-2")).toBe("ws-new");
    expect(sb.calls.some((c: any) => c.op === "insert")).toBe(true);
  });

  it("throws on a query error", async () => {
    const sb = makeSb({ "workspaces.maybeSingle": { data: null, error: new Error("boom") } });
    await expect(resolveWorkspaceId(sb, "user-3")).rejects.toThrow("boom");
  });
});

describe("workspaceStore.loadWorkspace", () => {
  it("returns stored blob when present", async () => {
    const stored = { ...demoWorkspaceData, marker: "custom" } as any;
    const sb = makeSb({ "workspace_state.maybeSingle": { data: { data: stored }, error: null } });
    expect(await loadWorkspace(sb, "ws-1")).toEqual(stored);
  });

  // This assertion previously read `toEqual(demoWorkspaceData)` — it was a
  // passing test that encoded the FEAT-005 bug, asserting that a brand-new
  // tenant is seeded with Sigma Tactix's demo content. A green suite therefore
  // actively defended the defect. It now asserts the empty template.
  it("seeds the EMPTY template — not the demo seed — and returns it when the workspace has no state", async () => {
    const sb = makeSb({ "workspace_state.maybeSingle": { data: null, error: null } });
    const result = await loadWorkspace(sb, "ws-1");
    expect(result).toEqual(emptyWorkspaceData);
    expect(result).not.toEqual(demoWorkspaceData);
    expect(JSON.stringify(result).toLowerCase()).not.toContain("sigmatactix");
    // seeding writes via upsert
    expect(sb.calls.some((c: any) => c.op === "upsert")).toBe(true);
  });

  it("hands each workspace its own copy, so one tenant's edits cannot leak into the next seeded tenant", async () => {
    const sb = makeSb({ "workspace_state.maybeSingle": { data: null, error: null } });
    const first = await loadWorkspace(sb, "ws-1");
    first.secondBrain.brandVault.brandSlogan = "tenant one's slogan";
    const second = await loadWorkspace(makeSb({ "workspace_state.maybeSingle": { data: null, error: null } }), "ws-2");
    expect(second.secondBrain.brandVault.brandSlogan).toBe("");
  });
});

describe("workspaceStore.saveWorkspace", () => {
  it("upserts the blob keyed by workspace_id", async () => {
    const sb = makeSb({});
    await saveWorkspace(sb, "ws-9", demoWorkspaceData);
    const upsert = sb.calls.find((c: any) => c.op === "upsert");
    expect(upsert.payload.workspace_id).toBe("ws-9");
    expect(upsert.payload.data).toEqual(demoWorkspaceData);
  });

  it("throws when the upsert errors", async () => {
    const sb = makeSb({ "workspace_state.upsert": { error: new Error("write failed") } });
    await expect(saveWorkspace(sb, "ws-9", demoWorkspaceData)).rejects.toThrow("write failed");
  });

  // Optimistic concurrency (migration 0012). Before the version column, two
  // members of one workspace writing at the same time both read version N and
  // both wrote their own full copy of the document — the second silently erased
  // the first, with no error anywhere. These two tests pin that it now conflicts
  // loudly instead.
  it("sends the version it loaded, so a concurrent write is detected instead of clobbered", async () => {
    const sb = makeSb({
      "workspace_state.maybeSingle": { data: { data: demoWorkspaceData, version: 7 }, error: null },
      "workspace_state.update": { data: { version: 8 }, error: null },
    });
    const loaded = await loadWorkspace(sb, "ws-1");
    await saveWorkspace(sb, "ws-1", loaded);
    const write = sb.calls.find((c: any) => c.op === "update");
    expect(write).toBeDefined();
    expect(write.filters.version).toBe(7);
  });

  it("raises WorkspaceConflictError when someone else wrote first", async () => {
    const sb = makeSb({
      "workspace_state.maybeSingle": { data: { data: demoWorkspaceData, version: 7 }, error: null },
      // Zero rows matched: the row moved past version 7 between read and write.
      "workspace_state.update": { data: null, error: null },
    });
    const loaded = await loadWorkspace(sb, "ws-1");
    await expect(saveWorkspace(sb, "ws-1", loaded)).rejects.toBeInstanceOf(WorkspaceConflictError);
  });
});
