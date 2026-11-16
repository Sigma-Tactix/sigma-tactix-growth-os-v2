import { describe, it, expect, afterEach } from "vitest";
import {
  assertEmptySeedPayload,
  assertOwnerOrAdminOfDefault,
  CallerNotOwnerOrAdminError,
  createWorkspace,
  listMemberWorkspaces,
} from "./workspaceManage.js";
import { loadWorkspace, resolveWorkspaceId } from "./workspaceStore.js";
import { emptyWorkspaceData } from "../initialData.js";

// Two-workspace tenant-isolation tests: two tenants side by side, with the
// RLS boundary simulated by giving each caller a fake Supabase builder whose
// stubs only ever return that caller's own rows. Nothing here touches a real
// database, a socket, or a service-role key — same spirit as
// workspaceManage.test.ts / workspaceStore.test.ts, from the second-tenant
// perspective those files don't cover.

const USER_A = "11111111-aaaa-4bbb-8ccc-00000000000a";
const USER_B = "22222222-bbbb-4ccc-8ddd-00000000000b";
const WS_A = "aaaaaaaa-0000-4000-8000-0000000000a1";
const WS_B = "bbbbbbbb-0000-4000-8000-0000000000b1";
const WS_B_NEW = "cccccccc-0000-4000-8000-0000000000c1";

// Fake supabase builder with FILTER-SENSITIVE stubs: keys are
// `${table}.${terminal}::k=v&k=v` (filter keys sorted) with fallback to the
// bare `${table}.${terminal}` key. That is what lets one table (e.g.
// workspace_members) behave differently per caller and per filter set —
// the RLS simulation. `calls` records every terminal read/write so tests can
// assert what each tenant's client actually touched.
type Stub = { data?: any; error?: any };
function filterKey(filters: Record<string, any>): string {
  return Object.keys(filters)
    .sort()
    .map(k => `${k}=${filters[k]}`)
    .join("&");
}
function makeSb(stubs: Record<string, Stub>) {
  const calls: any[] = [];
  const sb: any = {
    calls,
    from(table: string) {
      const state: any = { table, op: "select", payload: null, filters: {} };
      const resolveStub = (terminal: string) => {
        const exact = stubs[`${table}.${terminal}::${filterKey(state.filters)}`];
        if (exact !== undefined) return exact;
        const bare = stubs[`${table}.${terminal}`];
        if (bare !== undefined) return bare;
        return { data: null, error: null };
      };
      const builder: any = {
        select: () => builder,
        eq: (col: string, val: any) => {
          state.filters[col] = val;
          return builder;
        },
        in: () => builder,
        limit: () => builder,
        insert: (p: any) => {
          state.op = "insert";
          state.payload = p;
          return builder;
        },
        update: (p: any) => {
          state.op = "update";
          state.payload = p;
          return builder;
        },
        upsert: (p: any) => {
          state.op = "upsert";
          state.payload = p;
          return builder;
        },
        single: () => {
          calls.push({ ...state, terminal: "single", filters: { ...state.filters } });
          return Promise.resolve(resolveStub("single"));
        },
        maybeSingle: () => {
          calls.push({ ...state, terminal: "maybeSingle", filters: { ...state.filters } });
          return Promise.resolve(resolveStub("maybeSingle"));
        },
        // Bare list read: awaiting the builder resolves { data, error }.
        then: (onOk: any, onErr: any) => {
          calls.push({ ...state, terminal: undefined, filters: { ...state.filters } });
          return Promise.resolve(resolveStub("then")).then(onOk, onErr);
        },
      };
      return builder;
    },
  };
  return sb;
}

// Decision mirror of requireAuth's x-workspace block in server.ts (~582–608):
// the same shape guard on the header, the same RLS-scoped membership probe
// (workspace_members select workspace_id, eq user_id + eq workspace_id,
// maybeSingle terminal), the same fail-closed fallback to the caller's
// default via resolveWorkspaceId. Reproduced here — not imported — because
// server.ts can't load in this sandbox (no sockets); the mirror runs the
// IDENTICAL query shapes against the same fake builder, so it verifies the
// membership-query contract the header path relies on.
async function resolveSwitchedWorkspace(
  sb: any,
  userId: string,
  rawHeader: string | string[] | undefined,
): Promise<{ wsId: string; requestedWs?: string }> {
  const rawRequestedWs =
    (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) || undefined;
  let requestedWs: string | undefined;
  if (rawRequestedWs && /^[0-9a-fA-F-]{12,64}$/.test(rawRequestedWs)) {
    const { data: membership, error: membershipError } = await sb
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("workspace_id", rawRequestedWs)
      .maybeSingle();
    if (membershipError) {
      // Transient error: header treated as absent — fail closed to default.
    } else if (membership) {
      requestedWs = rawRequestedWs;
    }
    // Zero rows (foreign/unknown id under RLS): requestedWs stays unset.
  }
  const wsId = requestedWs || (await resolveWorkspaceId(sb, userId));
  return { wsId, requestedWs };
}

// Probes of the header check = workspace_members reads carrying a
// workspace_id filter (the default resolution's membership read has none).
function headerProbes(sb: any) {
  return sb.calls.filter(
    (c: any) =>
      c.table === "workspace_members" &&
      c.terminal === "maybeSingle" &&
      c.filters?.workspace_id !== undefined,
  );
}

describe("x-workspace header switching — fail-closed isolation", () => {
  it("(a) A + their own valid ws-a header selects ws-a and skips default resolution", async () => {
    const sb = makeSb({
      [`workspace_members.maybeSingle::user_id=${USER_A}&workspace_id=${WS_A}`]: {
        data: { workspace_id: WS_A },
      },
    });
    const result = await resolveSwitchedWorkspace(sb, USER_A, WS_A);
    expect(result.wsId).toBe(WS_A);
    expect(result.requestedWs).toBe(WS_A);
    // The switch short-circuits default resolution: the only DB read was
    // the membership probe itself.
    expect(sb.calls).toHaveLength(1);
    expect(sb.calls.every((c: any) => c.table === "workspace_members")).toBe(true);
    // Array-valued headers take element [0] — same decision.
    await expect(resolveSwitchedWorkspace(sb, USER_A, [WS_A])).resolves.toEqual({
      wsId: WS_A,
      requestedWs: WS_A,
    });
  });

  it("(b) A + foreign ws-b header falls back to A's OWN default (owner row)", async () => {
    const sb = makeSb({
      // RLS view: A is not a member of ws-b → zero rows for the probe.
      [`workspace_members.maybeSingle::user_id=${USER_A}&workspace_id=${WS_B}`]: {
        data: null,
      },
      // A's default resolution: owned row.
      [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: { id: WS_A } },
    });
    const result = await resolveSwitchedWorkspace(sb, USER_A, WS_B);
    expect(result.wsId).toBe(WS_A);
    expect(result.requestedWs).toBeUndefined();
    // The probe WAS attempted (the check ran and closed, not skipped).
    expect(headerProbes(sb)).toHaveLength(1);
    expect(headerProbes(sb)[0].filters.workspace_id).toBe(WS_B);
  });

  it("(b) A + foreign header falls back to A's membership-row default when they own nothing", async () => {
    const sb = makeSb({
      [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: null },
      // Default resolution's membership fallback: A is an invited member of ws-a.
      [`workspace_members.maybeSingle::user_id=${USER_A}`]: {
        data: { workspace_id: WS_A },
      },
    });
    const result = await resolveSwitchedWorkspace(sb, USER_A, WS_B);
    expect(result.wsId).toBe(WS_A);
    expect(result.requestedWs).toBeUndefined();
  });

  it("(c) membership read error → fallback to A's default, never the foreign id", async () => {
    const sb = makeSb({
      [`workspace_members.maybeSingle::user_id=${USER_A}&workspace_id=${WS_B}`]: {
        error: new Error("transient RLS read failure"),
      },
      [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: { id: WS_A } },
    });
    const result = await resolveSwitchedWorkspace(sb, USER_A, WS_B);
    expect(result.wsId).toBe(WS_A);
    expect(result.requestedWs).toBeUndefined();
    expect(headerProbes(sb)).toHaveLength(1); // checked, failed closed
  });

  it("(d) malformed header value is ignored with zero membership probes", async () => {
    for (const junk of ["junk-junk-junk", "ws-b", "not-a-uuid!", "", undefined]) {
      const sb = makeSb({
        [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: { id: WS_A } },
      });
      const result = await resolveSwitchedWorkspace(sb, USER_A, junk as any);
      expect(result.wsId).toBe(WS_A);
      expect(result.requestedWs).toBeUndefined();
      // No x-workspace probe at all — the header never reaches the database.
      expect(headerProbes(sb)).toHaveLength(0);
      expect(
        sb.calls.every((c: any) => c.table !== "workspace_members"),
      ).toBe(true);
    }
  });
});

describe("create isolation — second tenant side-by-side", () => {
  it("userB's create writes an owner-scoped row; userA's scoped list never surfaces B's workspace", async () => {
    // B's client (B's JWT — RLS scoped to B): the create.
    const sbB = makeSb({
      "workspaces.single": { data: { id: WS_B_NEW, name: "B Corp", owner_id: USER_B } },
    });
    const row = await createWorkspace(sbB, USER_B, "B Corp");
    expect(row.id).toBe(WS_B_NEW);
    expect(row.owner_id).toBe(USER_B);

    // A's client (A's JWT — RLS scoped to A): stubs return A's rows only.
    // B's workspaces row is invisible to this builder, exactly as RLS hides it.
    const sbA = makeSb({
      [`workspaces.then::owner_id=${USER_A}`]: {
        data: [{ id: WS_A, name: "A Corp", owner_id: USER_A }],
      },
      [`workspace_members.then::user_id=${USER_A}`]: {
        data: [{ workspace_id: WS_A, role: "owner" }],
      },
    });
    const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(sbA, USER_A);
    expect(defaultWorkspaceId).toBe(WS_A);
    expect(workspaces.map((w: any) => w.id)).toEqual([WS_A]);
    // The owned+membership merge never yields B's id.
    expect(workspaces.every((w: any) => w.id !== WS_B_NEW)).toBe(true);
    // A's builder never heard about B's write: no insert, no B reference.
    expect(sbA.calls.some((c: any) => c.op === "insert")).toBe(false);
    expect(JSON.stringify(sbA.calls)).not.toContain(WS_B_NEW);
  });
});

describe("empty-tenant guarantee — from the first tenant's perspective", () => {
  afterEach(() => {
    delete process.env.SEED_DEMO_WORKSPACE;
  });

  it("the second tenant's insert carries zero document/signal seed — tenant identity only", async () => {
    const sbB = makeSb({
      "workspaces.single": { data: { id: WS_B_NEW, name: "B Corp", owner_id: USER_B } },
    });
    await createWorkspace(sbB, USER_B, "B Corp");
    const insert = sbB.calls.find((c: any) => c.op === "insert");
    // No blob, no seeded documents or signals in the write itself.
    expect(insert.payload).toEqual({ name: "B Corp", owner_id: USER_B });
    expect(JSON.stringify(insert.payload)).not.toContain("sigmatactix");
    // The seed A will see on first access is the empty template, and the
    // guard that would trip if demo content ever reached it still passes.
    assertEmptySeedPayload();
  });

  it("A's read path, given B's new workspace id, returns nothing of B's content", async () => {
    delete process.env.SEED_DEMO_WORKSPACE; // pin: empty template, never demo
    const bContent: any = structuredClone(emptyWorkspaceData);
    bContent.secondBrain.brandVault.brandSlogan = "B Corp internal slogan";
    bContent.agentTasks.push({ id: "task-b-1", title: "B's confidential task" });

    // B's RLS-scoped view of its own new workspace: B's content, visible.
    const sbB = makeSb({
      "workspace_state.maybeSingle": { data: { data: bContent, version: 3 }, error: null },
    });
    expect(await loadWorkspace(sbB, WS_B_NEW)).toEqual(bContent);

    // A's RLS-scoped view of that same workspace_id: B's row is invisible
    // (zero rows), so A gets the empty template — nothing B's.
    const sbA = makeSb({
      "workspace_state.maybeSingle": { data: null, error: null },
    });
    const aView: any = await loadWorkspace(sbA, WS_B_NEW);
    expect(aView).toEqual(emptyWorkspaceData);
    expect(aView).not.toEqual(bContent);
    expect(JSON.stringify(aView)).not.toContain("B Corp internal");
    // Even A's first-access seed write carries only the empty template.
    const upsert = sbA.calls.find(
      (c: any) => c.table === "workspace_state" && c.op === "upsert",
    );
    expect(upsert.payload.data).toEqual(emptyWorkspaceData);
  });
});

// RBAC matrix on the create gate (workflow blocker #3): one compact matrix so
// a future route that forgets the ownership check fails CI. These overlap
// workspaceManage.test.ts's gate tests on purpose — the matrix is the pin.
describe("create gate RBAC matrix — owner/admin/member/none", () => {
  const MATRIX = [
    { role: "owner", passes: true },
    { role: "admin", passes: true },
    { role: "member", passes: false },
    { role: "no-workspace", passes: false },
  ] as const;

  function gateStubs(role: string): Record<string, Stub> {
    if (role === "owner") {
      return {
        [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: { id: WS_A } },
        [`workspace_members.maybeSingle::user_id=${USER_A}&workspace_id=${WS_A}`]: {
          data: { role: "owner" },
        },
      };
    }
    if (role === "admin" || role === "member") {
      return {
        [`workspaces.maybeSingle::owner_id=${USER_A}`]: { data: null },
        [`workspace_members.maybeSingle::user_id=${USER_A}`]: {
          data: { workspace_id: WS_A },
        },
        [`workspace_members.maybeSingle::user_id=${USER_A}&workspace_id=${WS_A}`]: {
          data: { role },
        },
      };
    }
    return {}; // no-workspace: nothing exists for this caller yet
  }

  for (const row of MATRIX) {
    it(`${row.role} → gate ${row.passes ? "passes" : "rejects with CallerNotOwnerOrAdminError"}`, async () => {
      const sb = makeSb(gateStubs(row.role));
      if (row.passes) {
        await expect(assertOwnerOrAdminOfDefault(sb as any, USER_A)).resolves.toBeUndefined();
      } else {
        await expect(assertOwnerOrAdminOfDefault(sb as any, USER_A)).rejects.toThrow(
          CallerNotOwnerOrAdminError,
        );
      }
    });
  }
});
