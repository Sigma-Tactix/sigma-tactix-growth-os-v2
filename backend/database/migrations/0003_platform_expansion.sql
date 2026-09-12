-- ============================================================================
-- Sigma Tactix Growth OS — Platform expansion
-- Adds: real document storage + RAG backbone, agent configs, saved reports,
-- workspace invitations, and three new modules (CRM, Competitor Analysis,
-- Social Listening). Follows the exact is_member()/member_rw RLS pattern
-- established in init.sql. Idempotent — safe to re-run.
-- Deploy: applied via Supabase MCP execute against project rqktjogegbdlsdvpusie.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. documents — real Second Brain file storage + RAG backbone
--    embedding is 768-dim (Gemini text-embedding-004), deliberately distinct
--    from the dead 1536-dim voice_embedding/persona_embedding columns in
--    brand_vault/customer_vault (nothing ever wrote to those; not reused here
--    to avoid inheriting a dimension mismatch with the model actually called).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    vault_id       text NOT NULL DEFAULT 'general',
    source_module  text NOT NULL DEFAULT 'brain_upload',
    file_name      text NOT NULL,
    storage_path   text,                        -- null for text-only notes (no file)
    mime_type      text,
    size_bytes     integer,
    content_text   text,
    embedding      vector(768),
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_ws ON documents (workspace_id, vault_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding
    ON documents USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 2. agents — persisted agent configs (distinct from agent_task_approvals,
--    which is a run-record ledger). Built by the Agentic Cockpit / Paid Media
--    Swarm; target_module scopes which tab an agent is wired to help with.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name           text NOT NULL,
    role           text NOT NULL,
    goal           text,
    target_module  text,
    skills         jsonb NOT NULL DEFAULT '[]'::jsonb,
    instructions   text,
    plugin_ids     jsonb NOT NULL DEFAULT '[]'::jsonb,
    connector_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agents_ws ON agents (workspace_id);

-- ---------------------------------------------------------------------------
-- 3. saved_reports — Reporting & Analytics custom report builder configs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_reports (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name           text NOT NULL,
    blocks         jsonb NOT NULL DEFAULT '[]'::jsonb,
    date_range     text NOT NULL DEFAULT 'Last 30 Days',
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_reports_ws ON saved_reports (workspace_id);

-- ---------------------------------------------------------------------------
-- 4. workspace_invitations — pending invites before the invitee has a real
--    auth.users row. Consumed into workspace_members on the invitee's first
--    login (backend route, service_role-equivalent via RLS-safe RPC).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_invitations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email        text NOT NULL,
    role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
    status       text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Revoked','Expired')),
    token        text NOT NULL UNIQUE,
    invited_by   uuid NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
    UNIQUE (workspace_id, email)
);
CREATE INDEX IF NOT EXISTS idx_invitations_ws ON workspace_invitations (workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON workspace_invitations (token);

-- ---------------------------------------------------------------------------
-- 5. CRM — contacts + deals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_contacts (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         text NOT NULL,
    email        text,
    company      text,
    phone        text,
    source       text,
    owner        text,
    notes        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_ws ON crm_contacts (workspace_id);

CREATE TABLE IF NOT EXISTS crm_deals (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id   uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
    title        text NOT NULL,
    stage        text NOT NULL DEFAULT 'New' CHECK (stage IN ('New','Qualified','Proposal','Negotiation','Won','Lost')),
    value        numeric,
    close_date   date,
    notes        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_ws_stage ON crm_deals (workspace_id, stage);

-- ---------------------------------------------------------------------------
-- 6. Competitor Analysis
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name             text NOT NULL,
    domain           text NOT NULL,
    notes            text,
    tracked_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
    last_analysis    jsonb,
    last_analyzed_at timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_competitors_ws ON competitors (workspace_id);

-- ---------------------------------------------------------------------------
-- 7. Social Listening
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_mentions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform     text NOT NULL,
    mention_text text NOT NULL,
    source_url   text,
    author       text,
    sentiment    text CHECK (sentiment IN ('Positive','Neutral','Negative')),
    detected_at  timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_social_mentions_ws ON social_mentions (workspace_id, detected_at DESC);

-- ---------------------------------------------------------------------------
-- 8. Auto updated_at triggers on the new tables that carry updated_at
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agents','saved_reports','crm_contacts','crm_deals','competitors'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 9. RLS — same member_rw pattern as every existing vault table
-- ---------------------------------------------------------------------------
ALTER TABLE documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_mentions       ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'documents','agents','saved_reports','workspace_invitations',
    'crm_contacts','crm_deals','competitors','social_mentions'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS member_rw ON %I;', t);
    EXECUTE format(
      'CREATE POLICY member_rw ON %I
         FOR ALL TO authenticated
         USING (public.is_member(workspace_id))
         WITH CHECK (public.is_member(workspace_id));', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 10. Storage — private vault-files bucket for real uploads/screenshots.
--     Path convention: {workspace_id}/{vault_id}/{uuid}-{filename}. Policies
--     check the first path segment against workspace_members, same boundary
--     as every Postgres RLS policy above.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-files', 'vault-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS vault_files_rw ON storage.objects;
CREATE POLICY vault_files_rw ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'vault-files'
        AND public.is_member(((storage.foldername(name))[1])::uuid)
    )
    WITH CHECK (
        bucket_id = 'vault-files'
        AND public.is_member(((storage.foldername(name))[1])::uuid)
    );
