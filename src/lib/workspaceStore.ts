import { SupabaseClient } from "@supabase/supabase-js";
import { WorkspaceData, GrowthFinding, GrowthFindingCategory } from "../types.js";
import { emptyWorkspaceData } from "../initialData.js";
import { demoWorkspaceData } from "../data/demoWorkspace.js";

// What a brand-new workspace is seeded with.
//
// This used to be initialWorkspaceData unconditionally — Sigma Tactix's own
// demo content, written into Postgres on a new tenant's very first request. A
// pilot client's first screen therefore showed a completed audit scoring 68
// against sigmatactix.com, credentials at @sigmatactix.com, and nine connectors
// reporting 'Connected', all presented as theirs.
//
// The demo content is still reachable, but only when someone deliberately asks
// for it by setting SEED_DEMO_WORKSPACE=true on the server — for a sales demo
// environment, never for an environment a client logs into. Anything else,
// including the variable being unset, gets the empty template.
function newWorkspaceTemplate(): WorkspaceData {
  const seedDemo = process.env.SEED_DEMO_WORKSPACE === "true";
  if (seedDemo) {
    console.warn(
      "SEED_DEMO_WORKSPACE=true — seeding a NEW workspace with Sigma Tactix demo content. " +
      "This must never be set on an environment real clients use."
    );
  }
  // Deep clone: these are module-level singletons, so handing the object back
  // directly would let one workspace's mutations leak into the next one seeded
  // in the same process.
  return structuredClone(seedDemo ? demoWorkspaceData : emptyWorkspaceData);
}

// Growth Audit Engine's rebuild (2026-07-28) changed `growthAudit.findings`
// from a flat {category: string} object to GrowthFinding[]. Any workspace
// saved before that change still has the old shape sitting in Postgres —
// this crashed the client with "findings.find is not a function" the moment
// it tried to render, since App.tsx's findGrowthFinding() assumes an array.
// Migrate legacy shape on read so old data self-heals instead of crashing.
const LEGACY_FINDING_TITLES: Record<GrowthFindingCategory, string> = {
  websitePresence: 'Website Presence & CRO',
  socialMediaPresence: 'Social Media Footprint',
  seoReadiness: 'SEO Keywords & Indices',
  aiVisibility: 'Generative Engine Visibility (AEO)',
  offerClarity: 'Offer Positioning',
  positioningStrength: 'Brand Slogan Effectiveness',
  funnelQuality: 'Funnel & Conversion Drops',
  analyticsReadiness: 'Analytics Instrumentation',
};

function migrateLegacyWorkspaceData(data: any): { data: WorkspaceData; migrated: boolean } {
  let migrated = false;

  if (data?.growthAudit) {
    if (!Array.isArray(data.growthAudit.findings)) {
      if (data.growthAudit.findings && typeof data.growthAudit.findings === 'object') {
        const legacy = data.growthAudit.findings as Record<string, string>;
        const findings: GrowthFinding[] = Object.entries(legacy).map(([category, text]) => ({
          id: `finding-${category}`,
          category: category as GrowthFindingCategory,
          title: LEGACY_FINDING_TITLES[category as GrowthFindingCategory] || category,
          text: String(text || ''),
          insight: '',
          impactPct: 10,
          quickSteps: [],
          dataSource: 'live',
        }));
        data.growthAudit.findings = findings;
      } else {
        // Empty, not the demo seed's findings. This branch runs when a real
        // workspace's stored findings are neither an array nor the legacy
        // object — falling back to initialWorkspaceData here would have
        // silently written Sigma Tactix's audit findings into that client's
        // own audit, which is exactly the failure this migration exists to
        // prevent. An empty findings list correctly reads as "re-run the audit".
        data.growthAudit.findings = [];
      }
      migrated = true;
    }
  }

  if (Array.isArray(data?.growthAudit?.recommendations)) {
    data.growthAudit.recommendations = data.growthAudit.recommendations.map((r: any) => {
      if (Array.isArray(r.quickSteps)) return r;
      migrated = true;
      return { ...r, quickSteps: [] };
    });
  }

  return { data: data as WorkspaceData, migrated };
}

// The whole Growth OS workspace blob lives as one jsonb document per tenant in
// `workspace_state.data`, keyed by workspace. RLS gates every query by
// membership, so `sb` (built from the caller's JWT) can only ever touch rows
// belonging to a workspace the user is a member of.
//
// Phase 2 (relational vaults in init.sql, pgvector search) reads the same
// tenant boundary; this store is the fast path that unblocks persistence today.

// Find the caller's workspace, creating one on first login. The workspaces
// INSERT is allowed by RLS only when owner_id = auth.uid(); an AFTER-INSERT
// trigger adds the owner to workspace_members so is_member() passes thereafter.
//
// Real bug fixed alongside Workspace & Team (#15): this only ever looked at
// owner_id, so an invited (non-owner) member had no way to resolve into the
// workspace they were actually added to — every login silently gave them
// their own separate empty workspace instead. Now falls back to
// workspace_members before creating a new one.
export async function resolveWorkspaceId(sb: SupabaseClient, userId: string): Promise<string> {
  const { data: existing, error } = await sb
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing.id as string;

  const { data: memberOf, error: memberErr } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberErr) throw memberErr;
  if (memberOf) return memberOf.workspace_id as string;

  const { data: created, error: insErr } = await sb
    .from("workspaces")
    .insert({ name: "My Workspace", owner_id: userId })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id as string;
}

// Optimistic-concurrency bookkeeping (migration 0012).
//
// Every route reads the whole blob, mutates it in JS, and writes the whole blob
// back. With a bare upsert that is a lost update: two members acting at the
// same time both read version N, both write their own copy, and the second
// silently erases the first — no error, no trace. Invisible with one user per
// workspace, which is why it has not bitten yet.
//
// loadWorkspace records the version it read, keyed by the payload object it
// returned. saveWorkspace sends that version back in the UPDATE's WHERE clause;
// zero rows matched means someone else wrote first. A WeakMap is used so the
// bookkeeping cannot leak memory and cannot be confused between concurrent
// requests — each request has its own payload object identity, which is exactly
// the right key.
const loadedVersions = new WeakMap<object, number>();

export class WorkspaceConflictError extends Error {
  constructor() {
    super("This workspace was modified by someone else while you were editing. Reload and try again.");
    this.name = "WorkspaceConflictError";
  }
}

// Load the workspace blob; seed it from the template on first access.
export async function loadWorkspace(sb: SupabaseClient, workspaceId: string): Promise<WorkspaceData> {
  const { data, error } = await sb
    .from("workspace_state")
    .select("data, version")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (data?.data) {
    const { data: migratedData, migrated } = migrateLegacyWorkspaceData(data.data);
    loadedVersions.set(migratedData as object, data.version ?? 0);
    if (migrated) {
      // Self-heal at rest too, so this migration only ever runs once per workspace.
      await saveWorkspace(sb, workspaceId, migratedData);
    }
    return migratedData;
  }

  const template = newWorkspaceTemplate();
  await saveWorkspace(sb, workspaceId, template);
  return template;
}

export async function saveWorkspace(
  sb: SupabaseClient,
  workspaceId: string,
  payload: WorkspaceData,
): Promise<void> {
  const expectedVersion = loadedVersions.get(payload as object);

  // No recorded version means this payload did not come from loadWorkspace —
  // first-time seeding, a reset, or a clone. There is nothing to conflict with,
  // so insert it. onConflict keeps the seeding path idempotent if two requests
  // race to create the same workspace's first row.
  if (expectedVersion === undefined) {
    const { data, error } = await sb
      .from("workspace_state")
      .upsert({ workspace_id: workspaceId, data: payload }, { onConflict: "workspace_id" })
      .select("version")
      .maybeSingle();
    if (error) throw error;
    if (data) loadedVersions.set(payload as object, data.version ?? 0);
    return;
  }

  // Compare-and-set. The version column is bumped by a BEFORE UPDATE trigger,
  // so this only has to match on the version it read — it must not set it, or a
  // writer could pin the version and defeat the check.
  const { data, error } = await sb
    .from("workspace_state")
    .update({ data: payload })
    .eq("workspace_id", workspaceId)
    .eq("version", expectedVersion)
    .select("version")
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    // Zero rows matched. Either the row is gone (it is not — the caller just
    // read it) or the version moved, i.e. a concurrent write landed first.
    // Surfaced rather than retried here on purpose: this store has no idea how
    // to merge two divergent copies of the document, and a blind retry would
    // re-apply a mutation computed against stale data — which is the very bug
    // this is meant to prevent. The route turns it into a 409.
    throw new WorkspaceConflictError();
  }
  loadedVersions.set(payload as object, data.version ?? expectedVersion + 1);
}
