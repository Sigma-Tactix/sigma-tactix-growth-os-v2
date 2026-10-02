-- 0017_execution_ledger: durable transactional execution ledger (Phase 1).
-- In-memory ExecutionLedger cannot survive restart nor enforce tenancy.
-- Every row carries workspace_id, protected by RLS via is_member().
CREATE TABLE IF NOT EXISTS ledger_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    objective text NOT NULL CHECK (char_length(objective) BETWEEN 1 AND 2000),
    -- System agent name this run was dispatched to (AgentTask.agentName). Kept
    -- denormalized on the run rather than in an event detail string so provider
    -- views can attribute verified runs to a named agent without re-deriving it
    -- from the objective text.
    agent_name text,
    workflow_version text,
    budget_cap numeric CHECK (budget_cap IS NULL OR budget_cap >= 0),
    correlation_id text,
    idempotency_key text,
    status text NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested','pending_approval','approved','rejected','queued','running','succeeded','failed','blocked','cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS ledger_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES ledger_runs(id) ON DELETE CASCADE,
    sequence bigint NOT NULL CHECK (sequence >= 0),
    actor text NOT NULL,
    transition text NOT NULL,
    details text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (run_id, sequence)
);
CREATE TABLE IF NOT EXISTS ledger_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES ledger_runs(id) ON DELETE CASCADE,
    actor uuid NOT NULL DEFAULT auth.uid(),
    decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
    scope text[] NOT NULL DEFAULT '{}',
    rationale text,
    approved_content_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ledger_node_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES ledger_runs(id) ON DELETE CASCADE,
    node_id text NOT NULL,
    attempt integer NOT NULL CHECK (attempt >= 1),
    executor_version text NOT NULL DEFAULT 'unknown',
    input_ref text,
    output_ref text,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    error text,
    UNIQUE (run_id, node_id, attempt)
);
CREATE TABLE IF NOT EXISTS ledger_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES ledger_runs(id) ON DELETE CASCADE,
    version text NOT NULL,
    content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
    storage_key text NOT NULL,
    byte_size integer NOT NULL CHECK (byte_size >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (run_id, version)
);
CREATE TABLE IF NOT EXISTS ledger_delivery_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    run_id uuid NOT NULL REFERENCES ledger_runs(id) ON DELETE CASCADE,
    artifact_id uuid REFERENCES ledger_artifacts(id) ON DELETE SET NULL,
    destination text NOT NULL,
    idempotency_key text NOT NULL,
    state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','transmitted','failed')),
    receipt text,
    error text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_ledger_runs_workspace_updated ON ledger_runs(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_runs_workspace_status ON ledger_runs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_events_run_sequence ON ledger_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_ledger_approvals_run ON ledger_approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_ledger_node_attempts_run ON ledger_node_attempts(run_id, node_id);
CREATE INDEX IF NOT EXISTS idx_ledger_artifacts_run ON ledger_artifacts(run_id);
CREATE INDEX IF NOT EXISTS idx_ledger_delivery_run ON ledger_delivery_attempts(run_id);
ALTER TABLE ledger_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_node_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_delivery_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_runs_read_member ON ledger_runs;
CREATE POLICY ledger_runs_read_member ON ledger_runs FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_runs_insert_member ON ledger_runs;
CREATE POLICY ledger_runs_insert_member ON ledger_runs FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS ledger_runs_update_member ON ledger_runs;
CREATE POLICY ledger_runs_update_member ON ledger_runs FOR UPDATE TO authenticated USING (public.is_member(workspace_id)) WITH CHECK (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_events_read_member ON ledger_events;
CREATE POLICY ledger_events_read_member ON ledger_events FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_events_insert_member ON ledger_events;
CREATE POLICY ledger_events_insert_member ON ledger_events FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_approvals_read_member ON ledger_approvals;
CREATE POLICY ledger_approvals_read_member ON ledger_approvals FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_approvals_insert_member ON ledger_approvals;
CREATE POLICY ledger_approvals_insert_member ON ledger_approvals FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id) AND actor = auth.uid());
DROP POLICY IF EXISTS ledger_node_attempts_read_member ON ledger_node_attempts;
CREATE POLICY ledger_node_attempts_read_member ON ledger_node_attempts FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_node_attempts_insert_member ON ledger_node_attempts;
CREATE POLICY ledger_node_attempts_insert_member ON ledger_node_attempts FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_artifacts_read_member ON ledger_artifacts;
CREATE POLICY ledger_artifacts_read_member ON ledger_artifacts FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_artifacts_insert_member ON ledger_artifacts;
CREATE POLICY ledger_artifacts_insert_member ON ledger_artifacts FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_delivery_read_member ON ledger_delivery_attempts;
CREATE POLICY ledger_delivery_read_member ON ledger_delivery_attempts FOR SELECT TO authenticated USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_delivery_insert_member ON ledger_delivery_attempts;
CREATE POLICY ledger_delivery_insert_member ON ledger_delivery_attempts FOR INSERT TO authenticated WITH CHECK (public.is_member(workspace_id));
DROP POLICY IF EXISTS ledger_delivery_update_member ON ledger_delivery_attempts;
CREATE POLICY ledger_delivery_update_member ON ledger_delivery_attempts FOR UPDATE TO authenticated USING (public.is_member(workspace_id)) WITH CHECK (public.is_member(workspace_id));
CREATE OR REPLACE FUNCTION public.ledger_events_sequence_guard() RETURNS trigger AS $FN$ BEGIN IF EXISTS (SELECT 1 FROM ledger_events WHERE run_id = NEW.run_id AND sequence >= NEW.sequence) THEN RAISE EXCEPTION 'ledger event sequence must be monotonic'; END IF; RETURN NEW; END; $FN$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ledger_events_sequence_guard_trg ON ledger_events;
CREATE TRIGGER ledger_events_sequence_guard_trg BEFORE INSERT ON ledger_events FOR EACH ROW EXECUTE FUNCTION public.ledger_events_sequence_guard();
DROP TRIGGER IF EXISTS set_updated_at ON ledger_runs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ledger_runs FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
REVOKE ALL ON ledger_runs, ledger_events, ledger_approvals, ledger_node_attempts, ledger_artifacts, ledger_delivery_attempts FROM anon;
GRANT SELECT, INSERT, UPDATE ON ledger_runs TO authenticated;
GRANT SELECT, INSERT ON ledger_events TO authenticated;
GRANT SELECT, INSERT ON ledger_approvals TO authenticated;
GRANT SELECT, INSERT ON ledger_node_attempts TO authenticated;
GRANT SELECT, INSERT ON ledger_artifacts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ledger_delivery_attempts TO authenticated;
GRANT ALL ON ledger_runs, ledger_events, ledger_approvals, ledger_node_attempts, ledger_artifacts, ledger_delivery_attempts TO service_role;
