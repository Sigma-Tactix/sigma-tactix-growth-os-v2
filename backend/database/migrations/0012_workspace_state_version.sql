-- ============================================================================
-- 0012_workspace_state_version — stop concurrent writers silently losing data
--
-- The whole WorkspaceData object lives as one jsonb document per tenant, and
-- every one of the ~90 routes follows read-modify-write:
--     const db = await getDB(res);   // SELECT data FROM workspace_state
--     db.something = ...;            // mutate in JS
--     await saveDB(res, db);         // upsert the WHOLE document back
--
-- With no version check this is the textbook lost update. Two members of the
-- same workspace acting at the same time — one adding a CRM contact, one
-- approving an agent task — both read the same document, both write their own
-- copy, and whichever lands second silently erases the other's change. No
-- error, no conflict, no trace. It is invisible in single-user testing, which
-- is why it has not surfaced yet: both live workspaces have exactly one member.
--
-- `version` increments on every write. saveWorkspace() sends the version it
-- read; if the row has moved on, the UPDATE matches zero rows and the store
-- retries against fresh data instead of overwriting.
--
-- Idempotent; safe to re-run. Run after 0011_grants_hardening.sql.
-- ============================================================================

ALTER TABLE workspace_state
    ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;

-- Bump on every UPDATE, in the database rather than in application code, so a
-- writer that forgets to increment still cannot silently clobber. The existing
-- moddatetime trigger on updated_at is left alone; this is a separate concern.
CREATE OR REPLACE FUNCTION public.bump_workspace_state_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.version := OLD.version + 1;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bump_version ON workspace_state;
CREATE TRIGGER bump_version BEFORE UPDATE ON workspace_state
    FOR EACH ROW EXECUTE FUNCTION public.bump_workspace_state_version();

REVOKE EXECUTE ON FUNCTION public.bump_workspace_state_version() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
-- Expect the column to exist, NOT NULL, default 0:
--   SELECT column_name, is_nullable, column_default FROM information_schema.columns
--    WHERE table_name = 'workspace_state' AND column_name = 'version';
--
-- Expect one row (the trigger is installed):
--   SELECT tgname FROM pg_trigger
--    WHERE tgrelid = 'public.workspace_state'::regclass AND tgname = 'bump_version';
--
-- Expect version to advance on write:
--   UPDATE workspace_state SET data = data WHERE workspace_id = '<id>';
--   SELECT version FROM workspace_state WHERE workspace_id = '<id>';  -- +1
