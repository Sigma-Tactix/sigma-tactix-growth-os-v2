-- 0019_landing_artifacts: durable, tenant-scoped proposed landing pages.
--
-- HTML is held in private Storage; this table is the durable provenance and
-- approval record. A proposal is never a deployed page or a performance claim.

CREATE TABLE IF NOT EXISTS landing_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    source_url text NOT NULL,
    source_captured_at timestamptz NOT NULL,
    source_hash text NOT NULL CHECK (source_hash ~ '^[a-f0-9]{64}$'),
    source_title text NOT NULL,
    brief jsonb NOT NULL DEFAULT '{}'::jsonb,
    sections jsonb NOT NULL DEFAULT '[]'::jsonb,
    source_previews jsonb NOT NULL DEFAULT '{}'::jsonb,
    proposed_previews jsonb NOT NULL DEFAULT '{}'::jsonb,
    html_storage_path text NOT NULL,
    html_hash text NOT NULL CHECK (html_hash ~ '^[a-f0-9]{64}$'),
    html_bytes integer NOT NULL CHECK (html_bytes > 0),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((status = 'approved') = (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_landing_artifacts_workspace_created
    ON landing_artifacts(workspace_id, created_at DESC);

DROP TRIGGER IF EXISTS set_landing_artifacts_updated_at ON landing_artifacts;
CREATE TRIGGER set_landing_artifacts_updated_at
    BEFORE UPDATE ON landing_artifacts
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE landing_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landing_artifacts_read_member ON landing_artifacts;
CREATE POLICY landing_artifacts_read_member ON landing_artifacts
    FOR SELECT TO authenticated
    USING (public.is_member(workspace_id));

DROP POLICY IF EXISTS landing_artifacts_insert_member ON landing_artifacts;
CREATE POLICY landing_artifacts_insert_member ON landing_artifacts
    FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());

-- Approval uses the server's service role only after its owner/admin and
-- separation-of-duties checks. Members have no direct UPDATE grant.
REVOKE ALL ON landing_artifacts FROM anon;
GRANT SELECT, INSERT ON landing_artifacts TO authenticated;
GRANT ALL ON landing_artifacts TO service_role;
