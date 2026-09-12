-- ============================================================================
-- 0002_workspace_state — jsonb document store for the app's Second Brain blob
--
-- The Express app reads/writes the entire WorkspaceData object wholesale. This
-- table persists that blob per tenant on Supabase (replacing src/db_store.json)
-- while RLS enforces the same workspace isolation as the relational vaults.
-- The relational vaults in init.sql remain the phase-2 target for per-vault
-- queries and pgvector semantic search.
-- Run after init.sql.
-- ============================================================================

CREATE TABLE workspace_state (
    workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    data         jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspace_state
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE workspace_state ENABLE ROW LEVEL SECURITY;

-- Members of the workspace may read and write its blob. The caller's JWT is
-- forwarded by the backend, so auth.uid() is the real end user.
CREATE POLICY workspace_state_rw ON workspace_state
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));
