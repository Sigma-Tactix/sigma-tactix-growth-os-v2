-- ============================================================================
-- Sigma Tactix Growth OS — Second Brain relational schema (v2, hardened)
-- Target: Supabase Postgres (PostgREST + GoTrue auth)
--
-- Fixes over v1: multi-tenant (workspace_id + RLS isolation), RLS on every
-- table, secret vaults locked to service_role, pgvector for real semantic
-- search, IDENTITY/uuid PKs, text over varchar, real indexes, auto updated_at,
-- range-partitioned audit_logs, security_invoker agent views.
--
-- Idempotent: every CREATE is guarded (IF NOT EXISTS / duplicate_object trap),
-- safe to re-run against a fresh project OR one that already has this schema.
-- Deploy with:
--   supabase db reset      (local)   OR   psql "$DATABASE_URL" -f init.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;        -- pgvector: embeddings + ANN
CREATE EXTENSION IF NOT EXISTS moddatetime;   -- auto updated_at trigger fn

-- ---------------------------------------------------------------------------
-- 1. Enums  (aligned with src/types.ts — 7 agent types, 6 cred categories)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE credential_category_enum AS ENUM
    ('Website', 'Social', 'CRM', 'Analytics', 'Ads', 'Email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credential_status_enum AS ENUM
    ('Connected', 'Disconnected', 'Needs Re-auth');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agent_type_enum AS ENUM
    ('Marketing Agent', 'AI SDR (Sales Agent)', 'Customer Success Agent',
     'Operations Agent', 'Audit Diagnostic Agent', 'Creative Director Agent',
     'SEO & Authority Agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM
    ('Pending Approval', 'Approved', 'Rejected', 'Running', 'Success', 'Failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Tenancy root: workspaces + membership
--    Every vault row belongs to exactly one workspace. RLS isolates tenants.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    plan_status text NOT NULL DEFAULT 'Growth Diagnostic',
    owner_id    uuid NOT NULL,                 -- auth.users.id of creator
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      uuid NOT NULL,                -- auth.users.id
    role         text NOT NULL DEFAULT 'member' -- 'owner' | 'admin' | 'member'
                 CHECK (role IN ('owner', 'admin', 'member')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members (user_id);

-- The CHECK above only fires on a fresh CREATE TABLE. On a database created
-- before the constraint existed, CREATE TABLE IF NOT EXISTS is a no-op and the
-- column stays unconstrained — so add it out-of-band, idempotently.
DO $$
BEGIN
  ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('owner', 'admin', 'member'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Membership check used by every RLS policy. SECURITY DEFINER so the policy
-- can read workspace_members without the caller needing direct table rights;
-- STABLE + pinned search_path to stay index-friendly and injection-safe.
CREATE OR REPLACE FUNCTION public.is_member(ws uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members m
        WHERE m.workspace_id = ws AND m.user_id = auth.uid()
    );
$$;

-- Only RLS policies (evaluated as `authenticated`) need to call this; lock
-- down the PostgREST RPC surface so anon/authenticated can't invoke it
-- directly. Supabase grants EXECUTE to anon/authenticated directly via
-- default privileges (not just via PUBLIC) — revoke from both explicitly,
-- a PUBLIC-only revoke is a no-op against that.
REVOKE EXECUTE ON FUNCTION public.is_member(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member(uuid) TO authenticated;

-- On workspace creation, enrol the owner as a member. SECURITY DEFINER so the
-- membership row is written even though the caller has no direct INSERT policy
-- on workspace_members (they only get SELECT). Keeps is_member() true from the
-- first request without granting clients membership-write rights.
CREATE OR REPLACE FUNCTION public.add_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Fires only via the trigger below, never as a direct RPC call.
REVOKE EXECUTE ON FUNCTION public.add_owner_membership() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_add_owner_membership ON workspaces;
CREATE TRIGGER trg_add_owner_membership
    AFTER INSERT ON workspaces
    FOR EACH ROW EXECUTE FUNCTION public.add_owner_membership();

-- ---------------------------------------------------------------------------
-- 3. The 10 vaults
--    Convention: uuid PK, workspace_id FK (UNIQUE where the vault is a
--    per-workspace singleton), text columns, created_at/updated_at.
-- ---------------------------------------------------------------------------

-- 1. Executive Vault  (SECRET — financials/IP/C-level. service_role only.)
CREATE TABLE IF NOT EXISTS executive_vault (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id         uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    company_name         text NOT NULL,
    financials_overview  text,
    strategic_plans      text,
    intellectual_property text,
    c_level_notes        text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. Credentials Vault  (SECRET — encrypted tokens. service_role only.)
CREATE TABLE IF NOT EXISTS credentials_vault (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    platform                text NOT NULL,
    username                text NOT NULL,
    encrypted_access_token  text NOT NULL,     -- text, never varchar(500): no truncation
    encrypted_refresh_token text,
    scopes                  jsonb,
    status                  credential_status_enum NOT NULL DEFAULT 'Connected',
    category                credential_category_enum NOT NULL,
    last_sync_at            timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, platform, username)
);
CREATE INDEX IF NOT EXISTS idx_credentials_ws_status ON credentials_vault (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_credentials_ws_category ON credentials_vault (workspace_id, category);

-- 3. Brand Vault
CREATE TABLE IF NOT EXISTS brand_vault (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    voice_and_tone   text NOT NULL,
    core_positioning text NOT NULL,
    offers_and_pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
    brand_slogan     text,
    key_messages     jsonb,
    voice_embedding  vector(1536),             -- real vector, ANN-indexable
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 4. Customer Vault
CREATE TABLE IF NOT EXISTS customer_vault (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id          uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    ideal_customer_profile text NOT NULL,
    target_segments       jsonb NOT NULL DEFAULT '[]'::jsonb,
    customer_objections   jsonb,
    testimonials          jsonb,
    persona_embedding     vector(1536),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 5. Marketing Vault
CREATE TABLE IF NOT EXISTS marketing_vault (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_history        text,
    current_channels        jsonb NOT NULL DEFAULT '[]'::jsonb,
    recent_performance      text,
    content_calendar_schedule jsonb,
    campaign_metrics        jsonb,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

-- 6. Website Vault
CREATE TABLE IF NOT EXISTS website_vault (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    site_url     text NOT NULL,
    cms_type     text NOT NULL DEFAULT 'WordPress',
    analytics_id text,
    page_history jsonb,
    structural_ux_records jsonb,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 7. Authority Vault
CREATE TABLE IF NOT EXISTS authority_vault (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    target_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
    backlink_profile_summary text,
    seo_focus_areas jsonb,
    ai_visibility_scores jsonb,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 8. Operations Vault
CREATE TABLE IF NOT EXISTS operations_vault (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    org_hierarchy text,
    sops_list    jsonb NOT NULL DEFAULT '[]'::jsonb,
    roles_permissions_matrix jsonb,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 9. AI Workflow Vault  (SECRET — system prompts + constraints. service_role only.)
CREATE TABLE IF NOT EXISTS ai_workflow_vault (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_type           agent_type_enum NOT NULL,
    system_prompt        text NOT NULL,
    model_router_endpoint text NOT NULL DEFAULT 'gemini-3.5-flash',
    temperature          real NOT NULL DEFAULT 0.2,
    max_tokens           integer NOT NULL DEFAULT 2048,
    agent_constraints    jsonb NOT NULL DEFAULT '[]'::jsonb,
    workflow_logs        jsonb,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, agent_type)          -- one config per agent per tenant
);

-- 10. Audit Vault
CREATE TABLE IF NOT EXISTS audit_vault (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      uuid NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    overall_score     integer NOT NULL DEFAULT 50 CHECK (overall_score BETWEEN 0 AND 100),
    growth_diagnostics jsonb NOT NULL DEFAULT '{}'::jsonb,
    uiux_checklists   jsonb,
    roadmap_90day     jsonb NOT NULL DEFAULT '{}'::jsonb,
    completed_roadmap_milestones jsonb,
    last_audited_at   timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. HITL execution ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_task_approvals (
    id              text PRIMARY KEY,          -- app-generated id kept
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_name      agent_type_enum NOT NULL,
    goal            text NOT NULL,
    status          task_status_enum NOT NULL DEFAULT 'Pending Approval',
    steps           jsonb NOT NULL DEFAULT '[]'::jsonb,
    output          text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    reviewed_by     text,
    reviewed_at     timestamptz,
    rejection_reason text
);
CREATE INDEX IF NOT EXISTS idx_task_approvals_ws_status ON agent_task_approvals (workspace_id, status);

-- ---------------------------------------------------------------------------
-- 5. Global audit log — RANGE partitioned by month (append-only, unbounded)
--    PK must include the partition key.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id           uuid NOT NULL DEFAULT gen_random_uuid(),
    ts           timestamptz NOT NULL DEFAULT now(),
    workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
    user_email   text,
    action       text NOT NULL,
    target_vault text NOT NULL,
    details      text,
    PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- Default partition catches everything until dated partitions are added by an
-- ops cron. Add monthly partitions ahead of time in production.
CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;
CREATE INDEX IF NOT EXISTS idx_audit_logs_ws_ts ON audit_logs (workspace_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user  ON audit_logs (user_email);

-- ---------------------------------------------------------------------------
-- 6. pgvector ANN indexes (HNSW, cosine) — semantic retrieval
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_brand_voice_embedding
    ON brand_vault USING hnsw (voice_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_customer_persona_embedding
    ON customer_vault USING hnsw (persona_embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 7. Auto updated_at triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workspaces','executive_vault','brand_vault','customer_vault',
    'marketing_vault','website_vault','authority_vault','operations_vault',
    'ai_workflow_vault','audit_vault'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 8. Row-Level Security
--    Two tiers:
--      A) MEMBER-READABLE vaults  -> members of the workspace can CRUD.
--      B) SECRET vaults           -> RLS on, NO anon/authenticated policy
--                                    (deny-all); only service_role bypasses.
-- ---------------------------------------------------------------------------

-- Enable RLS on every table (RLS-on with no policy == deny-all: safe default).
ALTER TABLE workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_vault       ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials_vault     ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_vault           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_vault        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_vault       ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_vault         ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_vault       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_vault      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_vault     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_vault           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_approvals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- Table-level GRANTs. RLS restricts which ROWS a role sees; it does not grant
-- access to the TABLE. Both are required, and this file previously supplied
-- only the second. Supabase's default privileges for tables created by the
-- `postgres` role in `public` are `Dxtm` (TRUNCATE/REFERENCES/TRIGGER/MAINTAIN)
-- for anon/authenticated/service_role — no SELECT/INSERT/UPDATE/DELETE. So
-- applying this file as `postgres` (which is what the Supabase SQL editor and
-- `psql` both do) leaves every policy below unreachable: PostgREST fails with
-- "permission denied for table ..." before RLS is ever evaluated.
-- Grants come BEFORE the revokes below, which then carve the secrets back out.

-- anon is unauthenticated and has no business with any app table. This also
-- strips the inherited TRUNCATE that the default ACL hands out.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Member-readable tables: CRUD, row-scoped by the policies below.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workspaces','workspace_members','brand_vault','customer_vault',
    'marketing_vault','website_vault','authority_vault','operations_vault',
    'audit_vault','agent_task_approvals'
  ] LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
  END LOOP;
END $$;

-- audit_logs: read-only for members. The REVOKE below keeps writes out; this
-- grant is what makes audit_select actually return rows.
GRANT SELECT ON audit_logs TO authenticated;

-- The backend runs as service_role. service_role bypasses RLS but still needs
-- table grants, including on the secret vaults it is the sole reader of.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Secret vaults: hard-revoke client roles. Backend touches these with the
-- service_role key ONLY (service_role bypasses RLS by design).
REVOKE ALL ON executive_vault, credentials_vault, ai_workflow_vault
    FROM anon, authenticated;

-- audit_logs is an append-only tamper log: RLS already blocks client writes
-- (only audit_select exists below), this REVOKE is defense-in-depth so a
-- future accidental policy addition can't reopen client INSERT/UPDATE/DELETE.
REVOKE INSERT, UPDATE, DELETE ON audit_logs FROM anon, authenticated;

-- Partitions are independent tables: privileges and RLS on the parent are NOT
-- inherited when a partition is addressed directly (and PostgREST exposes each
-- partition as its own resource). Lock every partition down so
-- /rest/v1/audit_logs_default cannot route around the parent's REVOKE + RLS.
-- Reads still work through the parent, where audit_select applies.
-- The ops cron that adds monthly partitions MUST re-run this block.
DO $$
DECLARE p text;
BEGIN
  FOR p IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    WHERE i.inhparent = 'public.audit_logs'::regclass
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated;', p);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', p);
  END LOOP;
END $$;

-- Workspaces: a member sees their workspace; owner inserts/updates/deletes it.
-- Split (not FOR ALL) so SELECT is governed by exactly one policy — a single
-- combined policy here doubles RLS evaluation cost on every SELECT.
DROP POLICY IF EXISTS ws_modify ON workspaces;
DROP POLICY IF EXISTS ws_select ON workspaces;
DROP POLICY IF EXISTS ws_insert ON workspaces;
DROP POLICY IF EXISTS ws_update ON workspaces;
DROP POLICY IF EXISTS ws_delete ON workspaces;
CREATE POLICY ws_select ON workspaces
    FOR SELECT TO authenticated USING (public.is_member(id));
CREATE POLICY ws_insert ON workspaces
    FOR INSERT TO authenticated WITH CHECK (owner_id = (select auth.uid()));
CREATE POLICY ws_update ON workspaces
    FOR UPDATE TO authenticated
    USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()));
CREATE POLICY ws_delete ON workspaces
    FOR DELETE TO authenticated USING (owner_id = (select auth.uid()));

-- Membership: a user sees rows for workspaces they belong to.
DROP POLICY IF EXISTS wm_select ON workspace_members;
CREATE POLICY wm_select ON workspace_members
    FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- Member-readable vaults: one uniform policy per table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'brand_vault','customer_vault','marketing_vault','website_vault',
    'authority_vault','operations_vault','audit_vault','agent_task_approvals'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS member_rw ON %I;', t);
    EXECUTE format(
      'CREATE POLICY member_rw ON %I
         FOR ALL TO authenticated
         USING (public.is_member(workspace_id))
         WITH CHECK (public.is_member(workspace_id));', t);
  END LOOP;
END $$;

-- audit_logs: members read their workspace''s log; inserts come from backend
-- (service_role). No client INSERT/UPDATE/DELETE policy on purpose.
DROP POLICY IF EXISTS audit_select ON audit_logs;
CREATE POLICY audit_select ON audit_logs
    FOR SELECT TO authenticated USING (public.is_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 9. Agent RBAC views  (security_invoker => querying role''s RLS applies)
--    Scoped by workspace; no cartesian join.
--    NOTE: no dedicated "agent" Postgres role exists yet — these views are
--    reachable by any authenticated end-user today (security_invoker still
--    enforces their own workspace scope via the underlying vaults' RLS, so
--    this is not a cross-tenant leak). Revoked from anon; a real sandboxed
--    agent role + explicit GRANT is a follow-up once agent execution runs
--    under its own Postgres identity rather than the end-user's session.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW marketing_agent_view
WITH (security_invoker = true) AS
SELECT bv.workspace_id,
       bv.voice_and_tone, bv.core_positioning,
       cv.ideal_customer_profile,
       mv.content_calendar_schedule,
       av.target_keywords
FROM brand_vault bv
JOIN customer_vault  cv ON cv.workspace_id = bv.workspace_id
JOIN marketing_vault mv ON mv.workspace_id = bv.workspace_id
JOIN authority_vault av ON av.workspace_id = bv.workspace_id;

CREATE OR REPLACE VIEW sales_sdr_agent_view
WITH (security_invoker = true) AS
SELECT bv.workspace_id,
       bv.core_positioning, bv.brand_slogan,
       cv.ideal_customer_profile, cv.customer_objections
FROM brand_vault bv
JOIN customer_vault cv ON cv.workspace_id = bv.workspace_id;

REVOKE ALL ON marketing_agent_view, sales_sdr_agent_view FROM anon;
-- Views are created after the GRANT block in section 8, so they need their own
-- grant. security_invoker means the caller's RLS on the underlying vaults still
-- applies, so this does not widen row visibility.
GRANT SELECT ON marketing_agent_view, sales_sdr_agent_view TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10. Workspace provisioning — seeds default agent configs for a new tenant.
--     Call from the backend (service_role) right after creating a workspace,
--     instead of a global one-time seed. Returns nothing; idempotent.
--     No internal is_member() check: the intended caller is the backend under
--     service_role (no auth.uid() in that context, so such a check would
--     break the legitimate call path) — protection is EXECUTE-grant based.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_workspace_agents(ws uuid)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
    INSERT INTO ai_workflow_vault (workspace_id, agent_type, system_prompt, agent_constraints)
    VALUES
      (ws, 'Marketing Agent',
       'You are the Growth OS Marketing Agent. Draft creative assets and schedule campaigns based ONLY on the Brand and Customer Vaults.',
       '["Cannot query ExecutiveVault","Cannot read raw credentials","All drafts route through the HITL review queue before publishing"]'),
      (ws, 'AI SDR (Sales Agent)',
       'You are the Growth OS outreach representative. Compose targeted LinkedIn messaging and outbound lead logs.',
       '["Sandboxed: no Executive or Operations Vault rights","No external API write without a valid approval token"]'),
      (ws, 'Customer Success Agent',
       'You are the Customer Success Agent. Draft retention and onboarding touches from Customer and Marketing Vaults.',
       '["No credential access","All outbound messages route through HITL"]'),
      (ws, 'Operations Agent',
       'You are the Operations Agent. Refine internal procedures and model efficiency metrics.',
       '["Cannot modify credentials or financials","Read operations logs only"]'),
      (ws, 'Audit Diagnostic Agent',
       'You are the Growth OS Audit Diagnostic Agent. Run growth/UI-UX diagnostics and populate the Audit Vault from Website, Marketing, and Authority Vault signals.',
       '["Cannot query ExecutiveVault","Cannot read raw credentials","Findings route through the HITL review queue before publishing"]'),
      (ws, 'Creative Director Agent',
       'You are the Growth OS Creative Director Agent. Direct creative asset generation strictly within the Brand Vault''s voice, tone, and visual guidelines.',
       '["Cannot query ExecutiveVault or Credentials Vault","All creative drafts route through the HITL review queue before publishing"]'),
      (ws, 'SEO & Authority Agent',
       'You are the Growth OS SEO & Authority Agent. Track keyword and backlink signals and propose authority-building actions from the Authority Vault.',
       '["Cannot query ExecutiveVault","Cannot read raw credentials","Recommendations route through the HITL review queue before publishing"]')
    ON CONFLICT (workspace_id, agent_type) DO NOTHING;
$$;

REVOKE EXECUTE ON FUNCTION public.provision_workspace_agents(uuid) FROM PUBLIC, anon, authenticated;
