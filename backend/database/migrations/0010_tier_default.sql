-- ============================================================================
-- 0010_tier_default — every workspace must always have a tier
--
-- Bug this closes: 0009_subscription_tiers.sql added the column as
--     ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS tier text
--         REFERENCES tier_definitions(tier_key);
-- with no DEFAULT and no NOT NULL. resolveWorkspaceId() (src/lib/workspaceStore.ts)
-- inserts only { name, owner_id }, so every workspace created since then has
-- tier = NULL.
--
-- Consequences of a NULL tier, both fail-closed by design and therefore silent:
--   * get_workspace_entitlements() JOINs tier_definitions on w.tier, so a NULL
--     tier returns zero rows;
--   * server.ts requireModule() treats a null entitlement row as "no access"
--     and 403s all 12 gated modules;
--   * App.tsx isModuleUnlocked() hides all 12 sidebar entries, and the
--     GATED_MODULE_KEYS effect bounces the user back to the dashboard.
-- Net effect: a brand-new client signs up and sees six tabs and no product.
-- Verified live before this migration: 1 of 2 workspaces had tier IS NULL.
--
-- Fix is ordered deliberately — backfill first, then DEFAULT, then NOT NULL, so
-- the NOT NULL cannot fail on pre-existing rows. Idempotent; safe to re-run.
-- Run after 0009_subscription_tiers.sql.
-- ============================================================================

-- 1. Backfill existing NULL-tier workspaces onto the lowest paid-for tier.
--    'starter' (sort_order 1) is the correct floor: it is the least-entitled
--    real tier, so this grants nobody access they had not been sold. It is a
--    strictly-safer state than NULL, which grants nothing at all.
UPDATE workspaces SET tier = 'starter' WHERE tier IS NULL;

-- 2. New workspaces get a tier without the insert having to remember to set one.
--    resolveWorkspaceId() inserts { name, owner_id } and is deliberately left
--    unchanged — the database, not the application, is the right place to
--    guarantee this invariant.
ALTER TABLE workspaces ALTER COLUMN tier SET DEFAULT 'starter';

-- 3. Make the invariant structural. Without this, any future insert path that
--    explicitly passes tier = NULL reintroduces the same silent lockout, and
--    the failure mode (a client seeing an empty product) is one nobody reports
--    as a bug because it looks like the product simply has no features.
ALTER TABLE workspaces ALTER COLUMN tier SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Verification — every one of these must hold after applying.
-- ---------------------------------------------------------------------------
-- Expect 0 rows:
--   SELECT id FROM workspaces WHERE tier IS NULL;
--
-- Expect 'starter':
--   SELECT column_default FROM information_schema.columns
--    WHERE table_name = 'workspaces' AND column_name = 'tier';
--
-- Expect 'NO':
--   SELECT is_nullable FROM information_schema.columns
--    WHERE table_name = 'workspaces' AND column_name = 'tier';
--
-- Expect one entitlement row per workspace (no workspace resolves to zero):
--   SELECT w.id, e.tier_key
--     FROM workspaces w
--     LEFT JOIN tier_definitions e ON e.tier_key = w.tier
--    WHERE e.tier_key IS NULL;   -- expect 0 rows
