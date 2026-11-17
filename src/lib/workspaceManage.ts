import { SupabaseClient } from "@supabase/supabase-js";
import { emptyWorkspaceData } from "../initialData.js";

// Workspace create + list contract that back the /api/workspace/manage routes.
//
// Every query runs through `sb`, the per-request client carrying the caller's
// own JWT (requireAuth -> supabaseForToken), so RLS is the only thing deciding
// which rows are visible or writable:
//   - workspaces INSERT is allowed only when owner_id = auth.uid()
//     (ws_insert), which is also the schema's ownership signal;
//   - workspaces / workspace_members SELECT is limited to workspaces the
//     caller is a member of (ws_select / wm_select, both via is_member()).
// No service-role key is involved anywhere in this file, and nothing here
// touches the secret vaults (executive_vault / credentials_vault) — those
// rows belong to a workspace the create path has not even produced yet.

// SELECTs that RLS has already scoped to the caller: a caller-owned row and
// the membership rows of workspaces they belong to.
type WorkspaceRow = { id: string; name: string; plan_status?: string; tier?: string; owner_id?: string; created_at?: string };
type MembershipRow = { workspace_id: string; role: string; created_at?: string };

// Await a bare Supabase builder as a row list. A plain `.select()` chain with
// no single/maybeSingle terminal is thenable and resolves to
// { data: Row[] | null, error } — the form every list read in this module uses
// (mirrors the "bare upsert" thenable handling workspaceStore.test.ts's fake
// already records). Normalizes null/missing data to [].
async function selectRows<T>(builder: any, onRows?: (rows: T[]) => T[]): Promise<T[]> {
  const { data, error }: { data: T[] | null; error: unknown } = await builder;
  if (error) throw error;
  const rows: T[] = Array.isArray(data) ? data : data ? [data as T] : [];
  return onRows ? onRows(rows) : rows;
}

// Throws (and the route turns it into a 403) when the caller is not an
// owner/admin of their resolved default workspace. The gate mirrors
// callerIsOwnerOrAdmin() in server.ts, but runs WITHOUT the default-workspace
// context that middleware-level checks have — which is exactly why it lives in
// the route, next to the write it protects.
export class CallerNotOwnerOrAdminError extends Error {
  constructor() {
    super("Owner or admin required.");
    this.name = "CallerNotOwnerOrAdminError";
  }
}

// True when the caller holds owner/admin in the workspace `resolveWorkspaceId`
// picked for them — the same "resolved default" the requireAuth middleware
// establishes, but computed directly so the gate needs no res.locals.
async function isOwnerOrAdminOfDefault(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await sb
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  let wsId: string | undefined = data ? (data as { id: string }).id : undefined;

  if (!wsId) {
    const { data: memberOf, error: memberErr } = await sb
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (memberErr) throw memberErr;
    if (!memberOf) return false; // nothing exists for this caller yet
    wsId = (memberOf as { workspace_id: string }).workspace_id;
  }

  const { data: roleRow, error: roleErr } = await sb
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", wsId)
    .eq("user_id", userId)
    .maybeSingle();
  if (roleErr) throw roleErr;
  const role = roleRow ? (roleRow as MembershipRow).role : undefined;
  return role === "owner" || role === "admin";
}

// List every workspace the caller is a member of (RLS already scopes both
// queries to membership), with the membership role merged in. The default
// workspace — the one requireAuth resolves without an x-workspace header —
// is flagged so the client can show "current" vs. "switch to".
export async function listMemberWorkspaces(sb: SupabaseClient, userId: string) {
  // Two list reads: workspaces the caller owns (ws_select) and workspaces the
  // caller was invited into (wm_select). RLS has already scoped both to
  // membership, so the union is exactly "workspaces this user may manage or
  // switch to". `.then()` form: the bare select chain is thenable and
  // resolves to a row array (no single/maybeSingle terminal is the right
  // shape for a list — maybeSingle resolves a single row or null).
  const [ownedRows, memberRows] = await Promise.all([
    selectRows<WorkspaceRow>(sb.from("workspaces").select("id, name, plan_status, tier, owner_id, created_at").eq("owner_id", userId)),
    selectRows<MembershipRow>(sb.from("workspace_members").select("workspace_id, role, created_at").eq("user_id", userId)),
  ]);

  // Merge owned rows (which carry name) with membership rows (which carry
  // role) — membership-only rows must not clobber an owned row's name, so
  // merge by id and keep whichever field is present.
  const byId = new Map<string, { id: string; name?: string; role?: string; tier?: string; plan_status?: string; created_at?: string }>();
  for (const row of ownedRows) byId.set(row.id, { id: row.id, name: row.name, tier: row.tier, plan_status: row.plan_status, created_at: row.created_at });
  for (const m of memberRows) {
    const existing = byId.get(m.workspace_id) ?? { id: m.workspace_id };
    existing.role = m.role;
    byId.set(m.workspace_id, existing);
  }
  const workspaces = Array.from(byId.values()).map(row => ({
    id: row.id,
    name: row.name ?? "Workspace",
    role: row.role ?? "owner",
    ...(row.tier ? { tier: row.tier } : {}),
    ...(row.plan_status ? { plan_status: row.plan_status } : {}),
    ...(row.created_at ? { created_at: row.created_at } : {}),
  }));

  // The default = the workspace requireAuth would resolve WITHOUT an
  // x-workspace header (owner row first, membership row second — same order
  // as resolveWorkspaceId), so the client can mark "current".
  let defaultWorkspaceId: string | undefined;
  const defaultOwned = await selectRows<{ id: string }>(
    sb.from("workspaces").select("id").eq("owner_id", userId).limit(1)
  );
  defaultWorkspaceId = defaultOwned[0]?.id;
  if (!defaultWorkspaceId) {
    const defaultMember = await selectRows<{ workspace_id: string }>(
      sb.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1)
    );
    defaultWorkspaceId = defaultMember[0]?.workspace_id;
  }

  return { workspaces, defaultWorkspaceId };
}

// A workspace the caller may create: a non-empty name they own. owner_id is
// fixed to the caller's auth.uid() on the client side, which is the only
// insert the ws_insert RLS policy permits; a misbehaving client passing a
// foreign owner_id cannot use this function's parameter, and any direct
// PostgREST attempt would be rejected by RLS anyway.
export async function createWorkspace(sb: SupabaseClient, userId: string, name: string): Promise<WorkspaceRow> {
  const trimmed = (name ?? "").trim();
  if (!trimmed) throw new Error("A workspace name is required.");
  const { data, error } = await sb
    .from("workspaces")
    .insert({ name: trimmed.slice(0, 200), owner_id: userId })
    .select("id, name, plan_status, tier, owner_id, created_at")
    .single();
  if (error) throw error;
  return data as WorkspaceRow;
}

// The create path's gate, split out so a route can turn a rejection into a
// 403 and a test can assert on the error directly.
export async function assertOwnerOrAdminOfDefault(sb: SupabaseClient, userId: string): Promise<void> {
  if (!(await isOwnerOrAdminOfDefault(sb, userId))) throw new CallerNotOwnerOrAdminError();
}

// The empty-workspace guarantee for anything this module creates.
//
// A freshly created `workspaces` row starts with NO `workspace_state` blob —
// the blob is only written by loadWorkspace()'s first-access seeding, which
// seeds from the EMPTY template (demoWorkspaceData is reachable only under
// the SEED_DEMO_WORKSPACE=true operator flag, never in this path). A real
// client must therefore never see seeded documents, signals, or Sigma
// Tactix's own demo content in a workspace they just created — mirroring
// the guards in emptyWorkspace.test.ts.
export function assertEmptySeedPayload() {
  const payload = JSON.stringify(emptyWorkspaceData);
  if (!payload) throw new Error("emptyWorkspaceData must serialize to a non-empty payload.");
  if (payload.toLowerCase().includes("sigmatactix")) {
    throw new Error("New-workspace seed contains demo content — this must never reach a client workspace.");
  }
}
