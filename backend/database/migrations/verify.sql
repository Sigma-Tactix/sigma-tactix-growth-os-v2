-- Post-deploy verification for the Growth OS schema.
-- Run after init.sql + 0002_workspace_state.sql:
--   psql "$DATABASE_URL" -f backend/database/migrations/verify.sql
-- Every check should report OK. Any FAIL means RLS/tenancy is not protecting data.

\echo '== 1. RLS enabled on every app table =='
SELECT c.relname AS table,
       CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'FAIL — RLS OFF' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;

\echo '== 2. Secret vaults revoked from anon/authenticated =='
-- Expect ZERO rows. Any row = a client role can still reach a secret vault.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('executive_vault', 'credentials_vault', 'ai_workflow_vault')
  AND grantee IN ('anon', 'authenticated');

\echo '== 3. Member-readable vaults have a policy =='
SELECT tablename,
       CASE WHEN count(*) > 0 THEN 'OK (' || count(*) || ' policies)' ELSE 'FAIL — no policy' END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brand_vault','customer_vault','marketing_vault','website_vault',
                    'authority_vault','operations_vault','audit_vault','agent_task_approvals',
                    'workspace_state','workspaces','workspace_members')
GROUP BY tablename
ORDER BY tablename;

\echo '== 4. pgvector + moddatetime extensions present =='
SELECT extname AS extension, 'OK' AS status
FROM pg_extension WHERE extname IN ('vector','moddatetime','pgcrypto')
ORDER BY extname;

\echo '== 5. is_member() helper exists =='
SELECT proname AS function, 'OK' AS status
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('is_member','add_owner_membership','provision_workspace_agents')
ORDER BY proname;

\echo '== 6. Internal-use functions not directly callable by anon/authenticated =='
-- Expect ZERO rows for is_member/add_owner_membership/provision_workspace_agents
-- against anon; is_member SHOULD show one row for authenticated (RLS needs it).
SELECT 'is_member' AS function, 'anon' AS role,
       CASE WHEN has_function_privilege('anon','public.is_member(uuid)','EXECUTE')
            THEN 'FAIL — anon can call directly' ELSE 'OK' END AS status
UNION ALL
SELECT 'is_member', 'authenticated',
       CASE WHEN has_function_privilege('authenticated','public.is_member(uuid)','EXECUTE')
            THEN 'OK (required by RLS policies)' ELSE 'FAIL — RLS policies would break' END
UNION ALL
SELECT 'add_owner_membership', 'anon',
       CASE WHEN has_function_privilege('anon','public.add_owner_membership()','EXECUTE')
            THEN 'FAIL — anon can call directly' ELSE 'OK' END
UNION ALL
SELECT 'add_owner_membership', 'authenticated',
       CASE WHEN has_function_privilege('authenticated','public.add_owner_membership()','EXECUTE')
            THEN 'FAIL — authenticated can call directly' ELSE 'OK' END
UNION ALL
SELECT 'provision_workspace_agents', 'anon',
       CASE WHEN has_function_privilege('anon','public.provision_workspace_agents(uuid)','EXECUTE')
            THEN 'FAIL — anon can call directly' ELSE 'OK' END
UNION ALL
SELECT 'provision_workspace_agents', 'authenticated',
       CASE WHEN has_function_privilege('authenticated','public.provision_workspace_agents(uuid)','EXECUTE')
            THEN 'FAIL — authenticated can call directly' ELSE 'OK' END;

\echo '== 7. workspace_members.role has an integrity constraint =='
-- Always emits exactly one row: an empty result would otherwise read as a pass.
SELECT 'workspace_members.role' AS target,
       CASE WHEN EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conrelid = 'public.workspace_members'::regclass
                AND contype = 'c'
                AND pg_get_constraintdef(oid) ILIKE '%role%'
            )
            THEN 'OK' ELSE 'FAIL — no CHECK constraint on role' END AS status;

\echo '== 8. workspaces policies are split (no FOR-ALL/SELECT overlap) =='
SELECT policyname, cmd, 'OK' AS status
FROM pg_policies WHERE schemaname='public' AND tablename='workspaces'
ORDER BY policyname;

\echo '== 9. audit_logs partitions cannot be reached around the parent =='
-- Each partition is its own PostgREST resource; the parent REVOKE/RLS does not
-- cover direct access. Expect one OK row per partition.
SELECT c.relname AS partition,
       CASE
         WHEN has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           THEN 'FAIL — anon retains grants'
         WHEN has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           THEN 'FAIL — authenticated retains grants'
         WHEN NOT c.relrowsecurity
           THEN 'FAIL — RLS disabled on partition'
         ELSE 'OK'
       END AS status
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'public.audit_logs'::regclass
ORDER BY c.relname;

\echo 'Done. Review: table 1 all OK, table 2 EMPTY, tables 3-9 all OK.'

\echo '== 10. anon holds NO table privileges in public =='
-- The gap that made checks 1-9 insufficient. Check #2 only ever inspected the
-- three secret vaults, so `anon` holding full SELECT/INSERT/UPDATE/DELETE on 22
-- of 25 tables passed a "9/9 OK" run unnoticed. RLS still default-denied anon
-- (no policy targets it), so this was the missing SECOND gate rather than a
-- live leak — but the whole point of the guardrail is not to rely on one.
-- Expect ZERO rows. Fixed by 0011_grants_hardening.sql.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
ORDER BY table_name, privilege_type;

\echo '== 11. No policy targets anon/public, and no tenant table is unscoped =='
-- The condition under which check 10 stops being merely defence-in-depth: one
-- policy written `TO public` or `USING (true)` exposes its table to anyone
-- holding the (public) anon key.
--
-- `USING (true)` is only flagged on tables that actually carry a workspace_id,
-- i.e. tenant data. tier_definitions is deliberately `TO authenticated
-- USING (true)` — it is a shared price list, not tenant data, and flagging it
-- would make this check cry wolf on a known-good state. A check people learn to
-- ignore is worse than no check.
-- Expect ZERO rows.
SELECT p.tablename, p.policyname, p.roles::text, p.qual
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND (
    p.roles::text ~ '(anon|public)'
    OR (
      p.qual = 'true'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = p.tablename
          AND c.column_name = 'workspace_id'
      )
    )
  )
ORDER BY p.tablename;

\echo '== 12. The public intake RPCs are still anon-callable =='
-- Counterpart to check 10: revoking anon must NOT have broken the two
-- SECURITY DEFINER RPCs the unauthenticated client intake form depends on.
-- Both must be true.
SELECT 'get_intake_token_info' AS function,
       CASE WHEN has_function_privilege('anon','public.get_intake_token_info(text)','EXECUTE')
            THEN 'OK' ELSE 'FAIL — public intake form is broken' END AS status
UNION ALL
SELECT 'complete_intake_token',
       CASE WHEN has_function_privilege('anon','public.complete_intake_token(text,jsonb)','EXECUTE')
            THEN 'OK' ELSE 'FAIL — public intake form is broken' END;

\echo '== 13. Every workspace resolves to a tier =='
-- get_workspace_entitlements JOINs tier_definitions on workspaces.tier, and
-- requireModule fails closed on a null result — so a NULL tier is not a
-- degraded state, it is a client signing in to a product with all 12 modules
-- hidden. Expect ZERO rows. Fixed and constrained by 0010_tier_default.sql.
SELECT id, name FROM workspaces WHERE tier IS NULL;

\echo '== 14. workspace_state carries its optimistic-concurrency column =='
-- Without `version`, the read-modify-write of the whole jsonb document that
-- every route performs is a silent lost update whenever two members act at
-- once. Expect one row, is_nullable = NO. Added by 0012.
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workspace_state' AND column_name = 'version';

\echo '== 15. The version-bump trigger is installed =='
-- The column alone is inert; the BEFORE UPDATE trigger is what makes a stale
-- writer's compare-and-set fail. Expect one row.
SELECT tgname AS trigger
FROM pg_trigger
WHERE tgrelid = 'public.workspace_state'::regclass AND NOT tgisinternal AND tgname = 'bump_version';

\echo '== 16. VANTA persistence tables exist with RLS enabled =='
-- Expect four OK rows after 0015_vanta_conversations.sql is applied.
SELECT expected.table_name,
       CASE
         WHEN c.oid IS NULL THEN 'FAIL — table missing'
         WHEN NOT c.relrowsecurity THEN 'FAIL — RLS OFF'
         ELSE 'OK'
       END AS status
FROM (VALUES
  ('vanta_settings'),
  ('vanta_conversations'),
  ('vanta_messages'),
  ('vanta_memories')
) AS expected(table_name)
LEFT JOIN pg_class c ON c.relname = expected.table_name AND c.relnamespace = 'public'::regnamespace
ORDER BY expected.table_name;

\echo '== 17. VANTA tables have explicit tenant policies and no anon grants =='
-- Each table must have at least two policies. The anon privilege query must be empty.
SELECT expected.table_name,
       CASE WHEN count(p.policyname) >= 2
            THEN 'OK (' || count(p.policyname) || ' policies)'
            ELSE 'FAIL — insufficient policies'
       END AS status
FROM (VALUES
  ('vanta_settings'),
  ('vanta_conversations'),
  ('vanta_messages'),
  ('vanta_memories')
) AS expected(table_name)
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = expected.table_name
GROUP BY expected.table_name
ORDER BY expected.table_name;

SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('vanta_settings','vanta_conversations','vanta_messages','vanta_memories')
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

\echo '== 18. VANTA retention purge is service-role only =='
SELECT 'purge_expired_vanta_conversations' AS function,
       CASE
         WHEN to_regprocedure('public.purge_expired_vanta_conversations()') IS NULL
           THEN 'FAIL — function missing'
         WHEN has_function_privilege('anon','public.purge_expired_vanta_conversations()','EXECUTE')
           OR has_function_privilege('authenticated','public.purge_expired_vanta_conversations()','EXECUTE')
           THEN 'FAIL — client role can execute purge'
         WHEN NOT has_function_privilege('service_role','public.purge_expired_vanta_conversations()','EXECUTE')
           THEN 'FAIL — service role cannot execute purge'
         ELSE 'OK'
       END AS status;
