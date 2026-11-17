-- 0023_durable_jobs_and_webhooks.sql: Durable background worker, cron schedules, and webhook audit log.
-- Enforces multi-tenant isolation through is_member(workspace_id) RLS.

CREATE TABLE IF NOT EXISTS durable_cron_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    cron_expression text NOT NULL CHECK (char_length(cron_expression) BETWEEN 1 AND 100),
    timezone text NOT NULL DEFAULT 'UTC' CHECK (char_length(timezone) BETWEEN 1 AND 50),
    target_action text NOT NULL CHECK (char_length(target_action) BETWEEN 1 AND 100),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    next_run_at timestamptz,
    last_run_at timestamptz,
    last_run_status text CHECK (last_run_status IS NULL OR last_run_status IN ('succeeded', 'failed', 'cancelled', 'running', 'reconciling')),
    missed_run_policy text NOT NULL DEFAULT 'run_once' CHECK (missed_run_policy IN ('skip', 'run_once', 'catch_up')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE durable_cron_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY cron_schedules_tenant_isolation ON durable_cron_schedules
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

CREATE TABLE IF NOT EXISTS durable_job_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    schedule_id uuid REFERENCES durable_cron_schedules(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    idempotency_key text NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'dead_letter', 'reconciling')),
    priority integer NOT NULL DEFAULT 0,
    max_retries integer NOT NULL DEFAULT 3,
    retry_count integer NOT NULL DEFAULT 0,
    timeout_seconds integer NOT NULL DEFAULT 300,
    started_at timestamptz,
    completed_at timestamptz,
    locked_until timestamptz,
    locked_by text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    result_payload jsonb,
    error_message text,
    receipt jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, idempotency_key)
);

ALTER TABLE durable_job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY durable_jobs_tenant_isolation ON durable_job_runs
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

CREATE TABLE IF NOT EXISTS inbound_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source text NOT NULL,
    event_id text NOT NULL,
    signature text NOT NULL,
    status text NOT NULL CHECK (status IN ('received', 'verified', 'dispatched', 'rejected_signature', 'rejected_replay', 'duplicate', 'malformed')),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    audit_evidence jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, source, event_id)
);

ALTER TABLE inbound_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY inbound_webhooks_tenant_isolation ON inbound_webhook_events
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));
