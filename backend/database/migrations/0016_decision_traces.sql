-- Append-only, tenant-scoped audit trail for provider-neutral System 1 decisions.
-- Raw decision inputs are deliberately excluded; only hashes and bounded outcomes persist.

CREATE TABLE IF NOT EXISTS decision_traces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    operation text NOT NULL CHECK (operation IN ('triage', 'route', 'safety')),
    provider text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('shadow', 'active', 'fallback')),
    authoritative_engine text NOT NULL,
    selected_value jsonb NOT NULL DEFAULT '{}'::jsonb,
    confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    probabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
    requires_hitl boolean NOT NULL DEFAULT false,
    policy_override boolean NOT NULL DEFAULT false,
    shadow_provider text,
    shadow_decision jsonb,
    input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
    question_set_hash text NOT NULL CHECK (question_set_hash ~ '^[a-f0-9]{64}$'),
    duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_traces_workspace_created
    ON decision_traces(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_traces_workspace_operation
    ON decision_traces(workspace_id, operation, created_at DESC);

ALTER TABLE decision_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decision_traces_read_member ON decision_traces;
CREATE POLICY decision_traces_read_member ON decision_traces FOR SELECT TO authenticated
    USING (public.is_member(workspace_id));

DROP POLICY IF EXISTS decision_traces_insert_member ON decision_traces;
CREATE POLICY decision_traces_insert_member ON decision_traces FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());

-- Traces are append-only for authenticated users. Retention/deletion is a service-role operation.
REVOKE ALL ON decision_traces FROM anon;
GRANT SELECT, INSERT ON decision_traces TO authenticated;
GRANT SELECT, INSERT, DELETE ON decision_traces TO service_role;
