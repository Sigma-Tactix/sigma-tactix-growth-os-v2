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

BEGIN;

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

CREATE POLICY brain_entities_member_rw ON public.brain_entities
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

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
        LIMIT p_match_count
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
    LEFT JOIN brain_relationships r ON r.evidence_document_id = vh.id
    LEFT JOIN brain_entities se ON se.id = r.source_id
    LEFT JOIN brain_entities te ON te.id = r.target_id;
$$;

COMMENT ON TABLE public.brain_entities IS 'Authoritative semantic knowledge entities in the Second Brain.';
COMMENT ON TABLE public.brain_relationships IS 'Compounding relational edges linking marketing insights across enclaves and channels.';

COMMIT;
