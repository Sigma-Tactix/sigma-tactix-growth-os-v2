-- ============================================================================
-- 0014_token_metering — Granular per-call token usage & cost tracking
--
-- Measures task tokens for every agent execution, creative generation, diagnostic
-- audit, and RAG query across all integrated AI models (Gemini, OpenAI, Anthropic).
-- Powers real-time client profitability calculations and unit economics in the
-- Admin Command Center.
--
-- Run after 0013_match_documents_scoped.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_usage_records (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id             text,
    agent_id            text,
    action_type         text NOT NULL,
    provider            text NOT NULL DEFAULT 'gemini',
    model_name          text NOT NULL,
    prompt_tokens       int NOT NULL DEFAULT 0,
    candidate_tokens    int NOT NULL DEFAULT 0,
    total_tokens        int NOT NULL DEFAULT 0,
    estimated_cost_usd  numeric(10, 6) NOT NULL DEFAULT 0,
    duration_ms         int DEFAULT 0,
    status              text NOT NULL DEFAULT 'SUCCESS',
    metadata            jsonb DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- Performance indices for telemetry aggregations and audit queries
CREATE INDEX IF NOT EXISTS idx_token_usage_workspace ON token_usage_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created ON token_usage_records(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_action ON token_usage_records(workspace_id, action_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_agent ON token_usage_records(workspace_id, agent_id);

-- Row Level Security: Multi-tenant isolation
ALTER TABLE token_usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS token_usage_read_member ON token_usage_records;
CREATE POLICY token_usage_read_member ON token_usage_records
    FOR SELECT TO authenticated
    USING (public.is_member(workspace_id));

DROP POLICY IF EXISTS token_usage_insert_member ON token_usage_records;
CREATE POLICY token_usage_insert_member ON token_usage_records
    FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id));

GRANT SELECT, INSERT ON token_usage_records TO authenticated;

-- Helper RPC: Aggregate workspace token usage and calculate estimated costs
CREATE OR REPLACE FUNCTION public.get_workspace_token_telemetry(
    p_workspace_id uuid,
    p_since timestamptz DEFAULT (now() - interval '30 days')
)
RETURNS TABLE (
    total_calls bigint,
    total_prompt_tokens bigint,
    total_candidate_tokens bigint,
    total_tokens bigint,
    total_cost_usd numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COUNT(*)::bigint AS total_calls,
        COALESCE(SUM(prompt_tokens), 0)::bigint AS total_prompt_tokens,
        COALESCE(SUM(candidate_tokens), 0)::bigint AS total_candidate_tokens,
        COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens,
        COALESCE(SUM(estimated_cost_usd), 0)::numeric AS total_cost_usd
    FROM token_usage_records
    WHERE workspace_id = p_workspace_id
      AND created_at >= p_since
      AND public.is_member(p_workspace_id);
$$;

REVOKE EXECUTE ON FUNCTION public.get_workspace_token_telemetry(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_token_telemetry(uuid, timestamptz) TO authenticated;
