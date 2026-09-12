-- ============================================================================
-- 0013_match_documents_scoped — let RAG retrieval respect an agent's vault scope
--
-- The gap this closes: executeAgentTask() called searchDocuments() with no
-- vault filter, so an agent's pgvector retrieval reached across EVERY vault in
-- the workspace regardless of its policy. agentPolicies.ts computes
-- `allowedScope` and buildScopedBrainContext() honours it — but that only
-- shapes the prompt PREAMBLE. The RAG snippets appended underneath it came
-- from an unfiltered search, so an agent whose policy blocks Customer Vault
-- could still be handed customer documents. RBAC was enforced on one of the two
-- context paths.
--
-- This is a within-tenant scope leak, not a cross-tenant one: RLS on
-- `documents` was never bypassed, and match_documents is deliberately NOT
-- SECURITY DEFINER so the member_rw policy applies inside the body. Latent
-- until now only because the documents table is empty.
--
-- The existing match_documents(uuid, text, vector, int) takes a SINGLE vault id,
-- which cannot express "these five vaults". Rather than call it once per vault
-- and merge in application code — which breaks the top-K ordering, since each
-- call returns its own K — this adds an array-taking variant. The original is
-- left in place: it is still the right function for a single-vault search and
-- dropping it would be a breaking change for any caller not yet migrated.
--
-- Run after 0012_workspace_state_version.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_documents_scoped(
    p_workspace_id    uuid,
    p_vault_ids       text[],
    p_query_embedding vector(768),
    p_match_count     int DEFAULT 5
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
      -- NULL means "no restriction" (a human-initiated search, not an agent).
      -- An EMPTY array means "no vaults authorized" and must return nothing —
      -- note that `= ANY('{}')` is false for every row, which is the behaviour
      -- we want. Getting this backwards would fail open for an unscoped agent,
      -- so it is asserted in src/lib/agentPolicies.test.ts.
      AND (p_vault_ids IS NULL OR d.vault_id = ANY(p_vault_ids))
    ORDER BY d.embedding <=> p_query_embedding
    LIMIT LEAST(GREATEST(p_match_count, 1), 50);
$$;

-- Same exposure as match_documents: never anon, and no SECURITY DEFINER, so
-- RLS on `documents` still gates which rows the caller can see.
REVOKE EXECUTE ON FUNCTION public.match_documents_scoped(uuid, text[], vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_documents_scoped(uuid, text[], vector, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- Expect one row:
--   SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public' AND p.proname = 'match_documents_scoped';
--
-- Expect false / true:
--   SELECT has_function_privilege('anon','public.match_documents_scoped(uuid,text[],vector,int)','EXECUTE'),
--          has_function_privilege('authenticated','public.match_documents_scoped(uuid,text[],vector,int)','EXECUTE');
