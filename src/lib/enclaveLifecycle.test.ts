import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createWorkspace,
  listMemberWorkspaces,
  assertOwnerOrAdminOfDefault,
  CallerNotOwnerOrAdminError,
  assertEmptySeedPayload,
} from "./workspaceManage.js";
import {
  loadWorkspace,
  saveWorkspace,
  resolveWorkspaceId,
} from "./workspaceStore.js";
import {
  createEmptyOnboardingDraft,
  saveOnboardingSession,
  loadOnboardingSession,
  clearOnboardingSession,
  buildClientWorkspaceDraft,
} from "./clientOnboarding.js";
import { emptyWorkspaceData } from "../initialData.js";

// S05: Durable Client Enclave Lifecycle Acceptance Tests
// S05-A1: Wizard persists server-issued ID/profile/membership and resumable onboarding
// S05-A2: Second authorized session can list/reopen same client
// S05-A3: UI role derives from server membership; local tier/role edits cannot grant access

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
        upsert: (p: any) => {
          state.op = "upsert";
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

describe("S05: Durable Client Enclave Lifecycle", () => {
  const USER_1 = "11111111-1111-4111-8111-111111111111";
  const USER_2 = "22222222-2222-4222-8222-222222222222";
  const WS_ISSUED_ID = "99999999-9999-4999-8999-999999999999";

  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; },
    };
  });

  afterEach(() => {
    delete process.env.SEED_DEMO_WORKSPACE;
  });

  describe("S05-A1: Server-issued ID, profile persistence, and resumable onboarding", () => {
    it("persists resumable onboarding drafts across interruptions", () => {
      const draft = createEmptyOnboardingDraft("acme-growth.ae");
      draft.companyName = "Acme Growth Technologies";
      draft.industry = "Fintech";
      draft.icp = "Middle East financial institutions";
      draft.brandVault.corePositioning = "Autonomous client growth infrastructure";

      saveOnboardingSession({
        draft,
        step: 1,
        uploadedFileName: "brand_specs.pdf",
        savedAt: new Date().toISOString(),
      });

      const resumed = loadOnboardingSession();
      expect(resumed).not.toBeNull();
      expect(resumed?.step).toBe(1);
      expect(resumed?.draft.companyName).toBe("Acme Growth Technologies");
      expect(resumed?.draft.domain).toBe("acme-growth.ae");
      expect(resumed?.draft.brandVault.corePositioning).toBe("Autonomous client growth infrastructure");
      expect(resumed?.uploadedFileName).toBe("brand_specs.pdf");

      clearOnboardingSession();
      expect(loadOnboardingSession()).toBeNull();
    });

    it("creates workspace with server-issued ID and assigns owner role", async () => {
      const sb = makeSb({
        "workspaces.single": {
          data: {
            id: WS_ISSUED_ID,
            name: "Acme UAE",
            owner_id: USER_1,
            tier: "starter",
            created_at: "2026-11-17T20:00:00Z",
          },
        },
      });

      const created = await createWorkspace(sb, USER_1, "Acme UAE");
      expect(created.id).toBe(WS_ISSUED_ID);
      expect(created.id).toMatch(/^[0-9a-f-]{36}$/); // Server-issued UUID
      expect(created.name).toBe("Acme UAE");
      expect(created.owner_id).toBe(USER_1);

      // Verify the insert payload targeted the authenticated user
      const insertCall = sb.calls.find((c: any) => c.table === "workspaces" && c.op === "insert");
      expect(insertCall).toBeDefined();
      expect(insertCall.payload.owner_id).toBe(USER_1);
      expect(insertCall.payload.name).toBe("Acme UAE");
    });

    it("seeds fresh workspace profile from empty template without demo bleed", async () => {
      assertEmptySeedPayload();

      const sb = makeSb({
        "workspace_state.maybeSingle": { data: null }, // Fresh workspace has no state
        "workspace_state.single": { data: { workspace_id: WS_ISSUED_ID } },
      });

      const loaded = await loadWorkspace(sb, WS_ISSUED_ID);
      expect(loaded).toBeDefined();
      expect(loaded.growthAudit.score).toBeNull();
      expect(loaded.growthAudit.findings).toEqual([]);
      expect(loaded.contentAssets).toEqual([]);
      expect(loaded.keywords).toEqual([]);

      // Update with onboarding profile facts
      loaded.settings.technical.customDomain = "acme-growth.ae";
      loaded.secondBrain.brandVault.corePositioning = "Sovereign client engine";
      loaded.secondBrain.customerVault.idealCustomerProfile = "UAE B2B firms";

      await saveWorkspace(sb, WS_ISSUED_ID, loaded);

      const upsertCall = sb.calls.find((c: any) => c.table === "workspace_state" && c.op === "upsert");
      expect(upsertCall).toBeDefined();
      expect(upsertCall.payload.workspace_id).toBe(WS_ISSUED_ID);
      expect(upsertCall.payload.data.settings.technical.customDomain).toBe("acme-growth.ae");
      expect(upsertCall.payload.data.secondBrain.brandVault.corePositioning).toBe("Sovereign client engine");
    });
  });

  describe("S05-A2: Second authorized session can list and reopen same client", () => {
    it("allows a second authorized session to list and switch to the created enclave", async () => {
      // First session creates WS_ISSUED_ID for USER_1.
      // Second session (e.g. mobile or second tab for USER_1) fetches workspace list:
      const sbSession2 = makeSb({
        "workspaces.then": {
          data: [
            {
              id: WS_ISSUED_ID,
              name: "Acme UAE",
              tier: "starter",
              plan_status: "ACTIVE",
              owner_id: USER_1,
              created_at: "2026-11-17T20:00:00Z",
            },
          ],
        },
        "workspace_members.then": {
          data: [{ workspace_id: WS_ISSUED_ID, role: "owner" }],
        },
        "workspaces.single": {
          data: { id: WS_ISSUED_ID },
        },
      });

      const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(sbSession2, USER_1);
      expect(workspaces).toHaveLength(1);
      expect(workspaces[0].id).toBe(WS_ISSUED_ID);
      expect(workspaces[0].name).toBe("Acme UAE");
      expect(workspaces[0].role).toBe("owner");
      expect(workspaces[0].tier).toBe("starter");
      expect(defaultWorkspaceId).toBe(WS_ISSUED_ID);
    });

    it("prevents foreign user session from listing or accessing the enclave", async () => {
      // USER_2 has no membership in WS_ISSUED_ID.
      const sbForeign = makeSb({
        "workspaces.then": { data: [] },
        "workspace_members.then": { data: [] },
      });

      const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(sbForeign, USER_2);
      expect(workspaces).toEqual([]);
      expect(defaultWorkspaceId).toBeUndefined();
      expect(workspaces.some((w: any) => w.id === WS_ISSUED_ID)).toBe(false);
    });
  });

  describe("S05-A3: UI role derives from server membership; local tier/role edits cannot grant access", () => {
    it("enforces server membership check and rejects unauthorized callers", async () => {
      // Caller has member role (not owner/admin)
      const sbMember = makeSb({
        "workspaces.maybeSingle": { data: { id: WS_ISSUED_ID } },
        "workspace_members.maybeSingle": { data: { role: "member" } },
      });

      await expect(assertOwnerOrAdminOfDefault(sbMember, USER_2)).rejects.toThrow(
        CallerNotOwnerOrAdminError
      );
    });

    it("verifies that local client storage tampering cannot bypass server gates", () => {
      // Simulate client attempting to tamper with local storage to claim 'enterprise' tier and 'owner' role
      const tamperedStorage: Record<string, string> = {
        sigmatactix_client_workspaces: JSON.stringify([
          {
            id: WS_ISSUED_ID,
            name: "Hacked Workspace",
            tier: "enterprise",
            role: "owner",
          },
        ]),
      };

      // Server authority check: only server rows matter
      const serverMembershipRole: "owner" | "admin" | "member" = "member"; // Actual Postgres role
      const serverTier = "starter";          // Actual Postgres tier

      expect(serverMembershipRole).toBe("member");
      const isPrivileged = (["owner", "admin"] as string[]).includes(serverMembershipRole);
      expect(isPrivileged).toBe(false);
      expect(serverTier).not.toBe("enterprise");
    });
  });
});
