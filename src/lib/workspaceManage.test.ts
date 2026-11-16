import { describe, it, expect, afterEach } from "vitest";
import {
  assertEmptySeedPayload,
  assertOwnerOrAdminOfDefault,
  CallerNotOwnerOrAdminError,
  createWorkspace,
  listMemberWorkspaces,
} from "./workspaceManage.js";
import { emptyWorkspaceData } from "../initialData.js";

// Fake supabase query builder: chained method that records what was queried
// and returns stubbed results per table/terminal, same spirit as
// workspaceStore.test.ts's makeSb. List reads use the bare thenable chain
// (recorded under `terminal: undefined`, stub key `${table}.then`);
// single-row reads use `.single()` / `.maybeSingle()`.
type Stub = { data?: any; error?: any };
function makeSb(stubs: Record<string, Stub>) {
  const calls: any[] = [];
  const sb: any = {
    calls,
    from(table: string) {
      const state: any = { table, op: "select", payload: null, filters: {} };
      const pick = (key: string) => stubs[key] ?? { data: null, error: null };
      const builder: any = {
        select: () => builder,
        eq: (col: string, val: any) => {
          state.filters[col] = val;
          return builder;
        },
        limit: () => builder,
        insert: (p: any) => {
          state.op = "insert";
          state.payload = p;
          return builder;
        },
        single: () => {
          calls.push({ ...state, terminal: "single" });
          return Promise.resolve(pick(`${table}.single`));
        },
        maybeSingle: () => {
          calls.push({ ...state, terminal: "maybeSingle" });
          return Promise.resolve(pick(`${table}.maybeSingle`));
        },
        // Bare list read: awaiting the builder itself resolves { data, error }.
        then: (onOk: any, onErr: any) => {
          calls.push({ ...state, terminal: undefined });
          return Promise.resolve(pick(`${table}.then`)).then(onOk, onErr);
        },
      };
      return builder;
    },
  };
  return sb;
}

describe("workspaceManage.createWorkspace", () => {
  it("creates a workspaces row owned by the caller and returns its id", async () => {
    const sb = makeSb({ "workspaces.single": { data: { id: "ws-new", name: "Acme Corp", owner_id: "user-1" } } });
    const row = await createWorkspace(sb, "user-1", "  Acme Corp  ");
    expect(row.id).toBe("ws-new");
    const insert = sb.calls.find((c: any) => c.op === "insert");
    expect(insert.table).toBe("workspaces");
    expect(insert.payload.owner_id).toBe("user-1"); // caller-owned — RLS's only permitted insert
    expect(insert.payload.name).toBe("Acme Corp"); // trimmed
  });

  it("rejects a blank name before any write happens", async () => {
    const sb = makeSb({});
    await expect(createWorkspace(sb, "user-1", "   ")).rejects.toThrow("A workspace name is required.");
    expect(sb.calls.length).toBe(0);
  });

  it("throws on an RLS-denied insert so the route can surface a 500", async () => {
    const sb = makeSb({ "workspaces.single": { error: new Error("owned by someone else — rejected by RLS") } });
    await expect(createWorkspace(sb, "user-1", "Stolen")).rejects.toThrow("rejected by RLS");
  });
});

describe("workspaceManage.listMemberWorkspaces", () => {
  it("lists owned + membership workspaces with roles, default first", async () => {
    const sb = makeSb({
      "workspaces.then": {
        data: [
          { id: "ws-owned", name: "Acme Corp", owner_id: "user-1" },
          { id: "ws-invited", name: "Acme Corp", owner_id: "user-1" },
        ],
      },
      "workspace_members.then": {
        data: [
          { workspace_id: "ws-owned", role: "owner" },
          { workspace_id: "ws-invited", role: "member" },
        ],
      },
    });
    const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(sb, "user-1");
    expect(defaultWorkspaceId).toBe("ws-owned");
    expect(workspaces).toEqual([
      { id: "ws-owned", name: "Acme Corp", role: "owner" },
      { id: "ws-invited", name: "Acme Corp", role: "member" },
    ]);
    expect(workspaces.every((w: any) => w.id)).toBe(true);
  });

  it("throws when a membership read errors so no partial list is served", async () => {
    const sb = makeSb({ "workspace_members.then": { error: new Error("boom") } });
    await expect(listMemberWorkspaces(sb, "user-1")).rejects.toThrow("boom");
  });

  it("returns no default when the caller has no workspaces yet", async () => {
    const sb = makeSb({});
    const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(sb, "user-1");
    expect(workspaces).toEqual([]);
    expect(defaultWorkspaceId).toBeUndefined();
  });
});

describe("workspaceManage.assertOwnerOrAdminOfDefault — create gate", () => {
  it("passes for a caller who owns their resolved default workspace", async () => {
    const sb = makeSb({
      "workspaces.maybeSingle": { data: { id: "ws-own" } },
      "workspace_members.maybeSingle": { data: { role: "owner" } },
    });
    await expect(assertOwnerOrAdminOfDefault(sb, "user-1")).resolves.toBeUndefined();
  });

  it("passes for a caller whose default is a membership they co-admin", async () => {
    const sb = makeSb({
      "workspaces.maybeSingle": { data: null },
      "workspace_members.maybeSingle": { data: { role: "admin" } },
    });
    await expect(assertOwnerOrAdminOfDefault(sb, "user-1")).resolves.toBeUndefined();
  });

  it("rejects a plain member — they cannot create enclaves", async () => {
    const sb = makeSb({
      "workspaces.maybeSingle": { data: null },
      "workspace_members.maybeSingle": { data: { role: "member" } },
    });
    await expect(assertOwnerOrAdminOfDefault(sb, "user-1")).rejects.toThrow(CallerNotOwnerOrAdminError);
  });

  it("rejects when the caller has no workspace at all (nothing to gate on)", async () => {
    const sb = makeSb({});
    await expect(assertOwnerOrAdminOfDefault(sb, "user-1")).rejects.toThrow(CallerNotOwnerOrAdminError);
  });
});

// emptyWorkspace-style guards, pointed at the create path: a freshly created
// workspace must start from the empty template — zero seeded documents,
// zero signals, zero demo content. The create path itself writes only the
// `workspaces` row (via createWorkspace, which passes NO blob); the blob is
// later seeded by loadWorkspace() from newWorkspaceTemplate(), which — with
// SEED_DEMO_WORKSPACE unset, always the case on a client environment — is
// exactly emptyWorkspaceData. These assertions mirror emptyWorkspace.test.ts
// so the create path cannot quietly regress to demo content.
describe("workspaceManage empty-seed guarantee for the create path", () => {
  afterEach(() => {
    delete process.env.SEED_DEMO_WORKSPACE;
  });

  it("the create path writes no blob payload — only the workspaces row", async () => {
    const sb = makeSb({ "workspaces.single": { data: { id: "ws-new", name: "Acme" } } });
    await createWorkspace(sb, "user-1", "Acme");
    const insert = sb.calls.find((c: any) => c.op === "insert");
    // The insert carries tenant identity only; no seeded documents/signals.
    expect(insert.payload).toEqual({ name: "Acme", owner_id: "user-1" });
    expect(JSON.stringify(insert.payload)).not.toContain("sigmatactix");
  });

  it("the seed payload the create path's first access will write is the empty template", () => {
    // With SEED_DEMO_WORKSPACE unset, newWorkspaceTemplate() returns
    // emptyWorkspaceData — the template this path will seed from.
    const payload = emptyWorkspaceData;
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("sigmatactix");
    // No seeded documents or signals of any kind:
    expect(payload.agentTasks).toHaveLength(0);
    expect(payload.contentAssets).toHaveLength(0);
    expect(payload.keywords).toHaveLength(0);
    expect(payload.teamMembers).toHaveLength(0);
    expect(payload.invitations).toHaveLength(0);
    expect(payload.secondBrain.credentialsVault).toHaveLength(0);
    expect(payload.secondBrain.uploadedFiles).toHaveLength(0);
    expect(payload.secondBrain.internalStack).toHaveLength(0);
    expect(payload.secondBrain.aiWorkflowVault).toHaveLength(0);
    expect(payload.settings.integrations).toHaveLength(0);
  });

  it("assertEmptySeedPayload guards the serialized seed against demo leakage", () => {
    assertEmptySeedPayload(); // passes today; throws if demo content ever sneaks in
  });
});
