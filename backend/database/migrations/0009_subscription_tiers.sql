-- ============================================================================
-- Subscription tiers (#Growth OS pricing) — Starter OS / Growth OS / Enterprise
-- OS. Prior to this migration there was no internal plan model: workspaces.
-- billing_plan (0007) is just a free-text cache of whatever Stripe's price
-- nickname happens to be, and there was zero entitlement/gating logic
-- anywhere in the app (confirmed — no feature-flag-by-tier code existed).
--
-- This adds:
--   1. workspaces.tier — the INTERNAL, admin-assignable tier key. Decoupled
--      from Stripe's billing_plan text on purpose: an admin can apply a
--      package to a client (task requirement) independent of live Stripe
--      state, and Stripe webhooks can later be wired to set this same
--      column without changing any gating code.
--   2. tier_definitions — the entitlement source of truth: which of the 12
--      Growth Modules a tier unlocks, plus its numeric limits. Seeded with
--      the 3 packages exactly as specified. Server-side gating (server.ts)
--      and UI upsell prompts both read this table, so there is exactly one
--      place that defines "what Starter gets" — not duplicated in code.
--   3. admin_set_workspace_tier RPC — SECURITY DEFINER, gated on the CALLER
--      being owner/admin of the workspace (same pattern as
--      update_member_role in 0006_team_management.sql). This is the "Admin
--      applies pricing package to client" action.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tier_definitions (
    tier_key            text PRIMARY KEY,
    display_name        text NOT NULL,
    price_monthly_annual_billing numeric NOT NULL,
    price_monthly_billing        numeric NOT NULL,
    modules             jsonb NOT NULL DEFAULT '{}'::jsonb,
    limits              jsonb NOT NULL DEFAULT '{}'::jsonb,
    description         text,
    sort_order          int NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Readable by any authenticated user (pricing/entitlement shape is not
-- secret — needed client-side to render upsell/locked states).
ALTER TABLE tier_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tier_definitions_read_all ON tier_definitions;
CREATE POLICY tier_definitions_read_all ON tier_definitions FOR SELECT TO authenticated USING (true);
GRANT SELECT ON tier_definitions TO authenticated;

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS tier text REFERENCES tier_definitions(tier_key);

INSERT INTO tier_definitions (tier_key, display_name, price_monthly_annual_billing, price_monthly_billing, modules, limits, description, sort_order)
VALUES
(
    'starter',
    'Starter OS',
    499, 599,
    '{
        "brain": true, "growth": true, "authority": true,
        "uiux": false, "content": false, "performance": false, "reporting": false,
        "crm": false, "competitors": false, "social": false, "agents": false, "simulation": false
    }'::jsonb,
    '{
        "max_brand_workspaces": 1,
        "diagnostic_cadence": "monthly",
        "aeo_engines": ["gemini", "perplexity"],
        "max_strategic_assets": 5,
        "max_agent_runs_per_month": 0,
        "multi_channel_integrations": false,
        "unlimited_workspaces": false,
        "custom_sop_config": false,
        "dedicated_vector_db": false,
        "priority_api_bandwidth": false
    }'::jsonb,
    'Seed-stage startups, boutique consultancies, single-product businesses.',
    1
),
(
    'growth',
    'Growth OS',
    1499, 1799,
    '{
        "brain": true, "growth": true, "uiux": true, "content": true, "performance": true,
        "reporting": true, "authority": true, "crm": true, "competitors": true, "social": true,
        "agents": true, "simulation": true
    }'::jsonb,
    '{
        "max_brand_workspaces": 1,
        "diagnostic_cadence": "realtime",
        "aeo_engines": ["gemini", "perplexity", "chatgpt", "claude"],
        "max_strategic_assets": null,
        "max_agent_runs_per_month": 50,
        "multi_channel_integrations": true,
        "unlimited_workspaces": false,
        "custom_sop_config": false,
        "dedicated_vector_db": false,
        "priority_api_bandwidth": false
    }'::jsonb,
    'Growth-stage B2B businesses, mid-market SaaS, scaling agencies ($1M-$10M ARR).',
    2
),
(
    'enterprise',
    'Enterprise / Agency OS',
    3499, 4999,
    '{
        "brain": true, "growth": true, "uiux": true, "content": true, "performance": true,
        "reporting": true, "authority": true, "crm": true, "competitors": true, "social": true,
        "agents": true, "simulation": true
    }'::jsonb,
    '{
        "max_brand_workspaces": null,
        "diagnostic_cadence": "realtime",
        "aeo_engines": ["gemini", "perplexity", "chatgpt", "claude"],
        "max_strategic_assets": null,
        "max_agent_runs_per_month": null,
        "multi_channel_integrations": true,
        "unlimited_workspaces": true,
        "custom_sop_config": true,
        "dedicated_vector_db": true,
        "priority_api_bandwidth": true
    }'::jsonb,
    'Multi-brand holding companies, enterprise clients, or agencies white-labeling Growth OS.',
    3
)
ON CONFLICT (tier_key) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_monthly_annual_billing = EXCLUDED.price_monthly_annual_billing,
    price_monthly_billing = EXCLUDED.price_monthly_billing,
    modules = EXCLUDED.modules,
    limits = EXCLUDED.limits,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

-- Admin applies a pricing package to a client workspace. Gated on caller
-- being owner/admin of that exact workspace (defense in depth — RLS on
-- `workspaces` itself is member-scoped already, but this is the explicit,
-- auditable entry point the Admin panel calls).
CREATE OR REPLACE FUNCTION public.admin_set_workspace_tier(p_workspace_id uuid, p_tier_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tier_definitions WHERE tier_key = p_tier_key) THEN
        RAISE EXCEPTION 'Unknown tier_key: %', p_tier_key;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = p_workspace_id AND user_id = auth.uid() AND role IN ('owner','admin')
    ) THEN
        RETURN false;
    END IF;

    UPDATE workspaces SET tier = p_tier_key WHERE id = p_workspace_id;
    RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_workspace_tier(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_workspace_tier(uuid, text) TO authenticated;

-- Server-side lookup helper: given a workspace, return its full entitlement
-- row (or NULL if no tier assigned yet — server.ts treats NULL tier as
-- "no access to any of the 12 gated modules", fail-closed by design).
CREATE OR REPLACE FUNCTION public.get_workspace_entitlements(p_workspace_id uuid)
RETURNS TABLE(tier_key text, modules jsonb, limits jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT td.tier_key, td.modules, td.limits
    FROM workspaces w
    JOIN tier_definitions td ON td.tier_key = w.tier
    WHERE w.id = p_workspace_id AND public.is_member(p_workspace_id);
$$;
REVOKE EXECUTE ON FUNCTION public.get_workspace_entitlements(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_entitlements(uuid) TO authenticated;
