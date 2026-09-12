-- ============================================================================
-- match_documents — pgvector cosine-similarity search over `documents`.
-- No SECURITY DEFINER: runs as the calling `authenticated` role, so the
-- member_rw RLS policy on `documents` (added in 0003) still applies inside
-- the function body — a caller can never retrieve another workspace's rows
-- even if p_workspace_id were spoofed. The explicit workspace_id filter is
-- redundant with RLS but keeps the query index-friendly (idx_documents_ws).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.match_documents(
    p_workspace_id  uuid,
    p_vault_id      text,
    p_query_embedding vector(768),
    p_match_count   int DEFAULT 5
)
RETURNS TABLE (
    id            uuid,
    file_name     text,
    vault_id      text,
    source_module text,
    content_text  text,
    similarity    float
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT d.id, d.file_name, d.vault_id, d.source_module, d.content_text,
           1 - (d.embedding <=> p_query_embedding) AS similarity
    FROM documents d
    WHERE d.workspace_id = p_workspace_id
      AND d.embedding IS NOT NULL
      AND (p_vault_id IS NULL OR d.vault_id = p_vault_id)
    ORDER BY d.embedding <=> p_query_embedding
    LIMIT LEAST(GREATEST(p_match_count, 1), 50);
$$;

REVOKE EXECUTE ON FUNCTION public.match_documents(uuid, text, vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_documents(uuid, text, vector, int) TO authenticated;
