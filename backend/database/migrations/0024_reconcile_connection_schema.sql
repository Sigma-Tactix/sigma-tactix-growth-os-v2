-- Connection repair: expand only. Reconciles 0014, 0016 and 0021.
-- No existing rows are changed. Stop writers to roll back; retain tables/data.
-- Supabase applies this file transactionally.

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
SECURITY INVOKER
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


-- ============================================================================
-- 0021_brain_knowledge_graph.sql — Compounding Second Brain Knowledge Graph
--
-- Adds relational entity and relationship modeling on top of pgvector document
-- storage. Enables multi-agent cognitive compounding where findings from one
-- module (e.g. winning ad hooks from performance ads) form structured edges
-- to ICP personas, competitor weaknesses, and SEO clusters.
--
-- RLS-scoped by workspace_id; requires authenticated membership via is_member().
-- ============================================================================


CREATE TABLE IF NOT EXISTS public.brain_entities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    vault_id text NOT NULL,
    name text NOT NULL,
    entity_type text NOT NULL,
    summary text,
    attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brain_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    source_id uuid NOT NULL REFERENCES public.brain_entities(id) ON DELETE CASCADE,
    target_id uuid NOT NULL REFERENCES public.brain_entities(id) ON DELETE CASCADE,
    relation_type text NOT NULL,
    weight float NOT NULL DEFAULT 1.0,
    evidence_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Fast indices for workspace isolation and relational traversal
CREATE INDEX IF NOT EXISTS idx_brain_entities_ws_vault ON public.brain_entities(workspace_id, vault_id);
CREATE INDEX IF NOT EXISTS idx_brain_entities_ws_name ON public.brain_entities(workspace_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_brain_rel_ws ON public.brain_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_brain_rel_source ON public.brain_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_brain_rel_target ON public.brain_relationships(target_id);

-- Enforce strict multi-tenant Row-Level Security
ALTER TABLE public.brain_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_relationships ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_entities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_relationships TO authenticated;

REVOKE ALL ON public.brain_entities FROM anon;
REVOKE ALL ON public.brain_relationships FROM anon;

DROP POLICY IF EXISTS brain_entities_member_rw ON public.brain_entities;
CREATE POLICY brain_entities_member_rw ON public.brain_entities
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

DROP POLICY IF EXISTS brain_relationships_member_rw ON public.brain_relationships;
CREATE POLICY brain_relationships_member_rw ON public.brain_relationships
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

-- Hybrid Graph + Vector Search RPC
-- Combines pgvector cosine similarity with 1-hop relational expansion
CREATE OR REPLACE FUNCTION public.match_hybrid_brain_context(
    p_workspace_id    uuid,
    p_vault_ids       text[],
    p_query_embedding vector(768),
    p_match_count     int DEFAULT 5
)
RETURNS TABLE (
    document_id       uuid,
    file_name         text,
    vault_id          text,
    source_module     text,
    content_text      text,
    similarity        float,
    source_entity_name text,
    relationship_type text,
    target_entity_name text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    WITH vector_hits AS (
        SELECT d.id, d.file_name, d.vault_id, d.source_module, d.content_text,
               1 - (d.embedding <=> p_query_embedding) AS similarity
        FROM documents d
        WHERE d.workspace_id = p_workspace_id
          AND d.vault_id = ANY(p_vault_ids)
          AND d.embedding IS NOT NULL
        ORDER BY d.embedding <=> p_query_embedding
        LIMIT greatest(0, least(p_match_count, 50))
    )
    SELECT
        vh.id AS document_id,
        vh.file_name,
        vh.vault_id,
        vh.source_module,
        vh.content_text,
        vh.similarity,
        se.name AS source_entity_name,
        r.relation_type AS relationship_type,
        te.name AS target_entity_name
    FROM vector_hits vh
    LEFT JOIN brain_relationships r ON r.evidence_document_id = vh.id AND r.workspace_id = p_workspace_id
    LEFT JOIN brain_entities se ON se.id = r.source_id
    LEFT JOIN brain_entities te ON te.id = r.target_id;
$$;

COMMENT ON TABLE public.brain_entities IS 'Authoritative semantic knowledge entities in the Second Brain.';
COMMENT ON TABLE public.brain_relationships IS 'Compounding relational edges linking marketing insights across enclaves and channels.';



-- Supabase default grants must not make these tables public or mutable.
REVOKE ALL ON public.token_usage_records, public.decision_traces, public.brain_entities, public.brain_relationships FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.token_usage_records, public.decision_traces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_entities, public.brain_relationships TO authenticated;
REVOKE ALL ON FUNCTION public.match_hybrid_brain_context(uuid, text[], vector, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_hybrid_brain_context(uuid, text[], vector, integer) TO authenticated;

-- Edges must never reference another Client Enclave's entities or documents.
CREATE UNIQUE INDEX IF NOT EXISTS brain_entities_workspace_id_id ON public.brain_entities(workspace_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS documents_workspace_id_id ON public.documents(workspace_id, id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.brain_relationships'::regclass AND conname='brain_source_same_workspace') THEN
    ALTER TABLE public.brain_relationships ADD CONSTRAINT brain_source_same_workspace FOREIGN KEY (workspace_id, source_id) REFERENCES public.brain_entities(workspace_id, id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.brain_relationships'::regclass AND conname='brain_target_same_workspace') THEN
    ALTER TABLE public.brain_relationships ADD CONSTRAINT brain_target_same_workspace FOREIGN KEY (workspace_id, target_id) REFERENCES public.brain_entities(workspace_id, id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.brain_relationships'::regclass AND conname='brain_evidence_same_workspace') THEN
    ALTER TABLE public.brain_relationships ADD CONSTRAINT brain_evidence_same_workspace FOREIGN KEY (workspace_id, evidence_document_id) REFERENCES public.documents(workspace_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.brain_entities'::regclass AND conname='brain_excludes_secret_vaults') THEN
    ALTER TABLE public.brain_entities ADD CONSTRAINT brain_excludes_secret_vaults CHECK (lower(replace(vault_id, '-', '_')) NOT IN ('executive', 'executive_vault', 'credentials', 'credentials_vault'));
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
