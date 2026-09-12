-- ============================================================================
-- 0011_grants_hardening — restore the defence-in-depth layer under RLS
--
-- Two related defects, both verified against the LIVE project before writing:
--
-- 1. `anon` holds SELECT/INSERT/UPDATE/DELETE on 22 of 25 public tables.
--    init.sql issues `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon`, but
--    that statement only affects tables that existed when it ran. Migrations
--    0003/0005/0006/0009 created tables afterwards, and Supabase's default
--    privileges re-granted them to anon. The revoke was never re-run.
--
--    This is NOT a live data leak today, and the migration should not be sold
--    as fixing one: every policy in this schema is `FOR ALL TO authenticated`,
--    zero policies target anon or public, so RLS default-denies anon on every
--    table. Verified: `SELECT ... FROM pg_policies WHERE roles LIKE '%anon%'`
--    returns no rows. What is missing is the SECOND gate. The moment anyone
--    writes a policy `TO public` or `USING (true)` — an easy, natural mistake —
--    every one of these tables becomes world-readable with nothing behind it.
--    The project's own guardrail ("a policy is not access") exists precisely
--    because that pairing was already got wrong once.
--
-- 2. 0003_platform_expansion.sql created 8 tables with RLS + policies and NO
--    GRANT statements, violating the stated rule that a policy and its grant
--    ship in the same migration. Those tables work today only because Supabase's
--    default privileges happened to cover them. On a rebuild against a project
--    with different defaults, PostgREST returns "permission denied for table
--    documents" and every one of those features 500s. The grants are made
--    explicit here so the schema no longer depends on a platform default.
--
-- Safety review before applying — every anon-key path in the app was checked:
--   * src/lib/supabaseClient.ts (browser): only ever calls supabase.auth.*.
--     `grep -rn "supabase\.from(\|supabase\.rpc(" src/` returns nothing, so the
--     browser never reads a public table with the anon role.
--   * getPublicClient() (server.ts:254, :268): calls ONLY the two SECURITY
--     DEFINER RPCs get_intake_token_info / complete_intake_token. Function
--     EXECUTE grants are independent of table grants and the body executes as
--     the owner, so revoking anon's TABLE privileges cannot break the public
--     intake form. Those two EXECUTE grants are deliberately left intact.
--   * Every authenticated request goes through supabaseForToken(), i.e. the
--     `authenticated` role, which this migration grants to explicitly.
--
-- Idempotent; safe to re-run. Run after 0010_tier_default.sql.
-- ============================================================================

-- 1. Strip anon of every table and sequence privilege in public. Also removes
--    the inherited TRUNCATE that Supabase's default ACL hands out.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 2. Stop the bleeding at the source. Without this, the NEXT migration that
--    creates a table re-grants it to anon by default and silently undoes step 1
--    — which is exactly how this regressed after init.sql. Both role variants
--    are covered because a table's default privileges depend on which role
--    created it (the SQL editor runs as postgres; the platform uses
--    supabase_admin).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- 3. Make the 0003 tables' grants explicit rather than inherited. Same set and
--    same privileges init.sql grants its own member-readable tables; RLS
--    (`member_rw` USING public.is_member(workspace_id)) still decides which
--    ROWS are visible.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'documents','agents','saved_reports','workspace_invitations',
    'crm_contacts','crm_deals','competitors','social_mentions',
    'intake_tokens'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
  END LOOP;
END $$;

-- 4. tier_definitions is read-only reference data for clients: its policy is
--    SELECT-only, so the write grants it inherited are dead privilege.
REVOKE INSERT, UPDATE, DELETE ON tier_definitions FROM authenticated;
GRANT SELECT ON tier_definitions TO authenticated;

-- 5. Re-assert the secret-vault lockdown from init.sql. These three were clean
--    when checked, but they are the highest-consequence tables in the schema
--    and this migration is where that invariant is now pinned.
REVOKE ALL ON executive_vault, credentials_vault, ai_workflow_vault FROM anon, authenticated;

-- 6. Partitions are independent tables — privileges and RLS on the parent are
--    NOT inherited when a partition is addressed directly, and PostgREST
--    exposes each partition as its own resource. Re-run for any partition added
--    since init.sql (the monthly audit_logs partitions).
DO $$
DECLARE p text;
BEGIN
  FOR p IN
    SELECT c.relname FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class parent ON parent.oid = i.inhparent
    WHERE parent.relname = 'audit_logs'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated;', p);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', p);
  END LOOP;
END $$;

-- 7. service_role runs the Stripe webhook and is the sole reader of the secret
--    vaults. It bypasses RLS but still needs table grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- ---------------------------------------------------------------------------
-- Verification — this is the check verify.sql was missing. Its check #2 only
-- ever inspected the three secret vaults, which is why the anon grants on the
-- other 22 tables went unnoticed through a "9/9 pass".
-- ---------------------------------------------------------------------------
-- Expect 0 rows:
--   SELECT table_name, privilege_type FROM information_schema.role_table_grants
--    WHERE table_schema = 'public' AND grantee = 'anon';
--
-- Expect 0 rows (no policy may target anon or public):
--   SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname = 'public' AND roles::text ~ '(anon|public)';
--
-- Expect 0 rows (RLS on every table):
--   SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
--
-- Expect the two intake RPCs to STILL be anon-executable (the public intake
-- form depends on them; this migration must not have touched them):
--   SELECT has_function_privilege('anon','public.get_intake_token_info(text)','EXECUTE'),
--          has_function_privilege('anon','public.complete_intake_token(text,jsonb)','EXECUTE');
