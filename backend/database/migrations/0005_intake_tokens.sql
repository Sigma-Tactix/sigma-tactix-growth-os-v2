-- ============================================================================
-- OS Simulation Center -> real (#14). "Launching" now creates a genuine
-- intake pipeline record and emails the client a tokenized completion link.
-- The completion form itself must be reachable with NO login (the client is
-- not a workspace member) — that's a real anonymous-write requirement this
-- app's architecture had never needed before (everything else is JWT+RLS).
-- Solution: keep RLS deny-all for anon/authenticated on intake_tokens (same
-- as the secret vaults), and expose exactly two narrow SECURITY DEFINER RPCs
-- granted to `anon` — same precedent as is_member()/add_owner_membership()/
-- provision_workspace_agents() already in init.sql. No service_role
-- introduced; the RPC itself is the only door, and it checks token+expiry
-- server-side before doing anything.
-- ============================================================================

CREATE TABLE IF NOT EXISTS intake_tokens (
    token             text PRIMARY KEY,
    workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    client_email      text NOT NULL,
    status            text NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent','Completed','Expired')),
    requested_fields  jsonb NOT NULL DEFAULT '[]'::jsonb,
    submitted_payload jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    expires_at        timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
    completed_at      timestamptz
);
CREATE INDEX IF NOT EXISTS idx_intake_tokens_ws ON intake_tokens (workspace_id);

ALTER TABLE intake_tokens ENABLE ROW LEVEL SECURITY;

-- Workspace members can see their own client's intake status in the app.
DROP POLICY IF EXISTS member_rw ON intake_tokens;
CREATE POLICY member_rw ON intake_tokens
    FOR ALL TO authenticated
    USING (public.is_member(workspace_id))
    WITH CHECK (public.is_member(workspace_id));

-- Anonymous read: only the 4 fields the client-facing form needs, only for a
-- token that hasn't expired. No workspace_id, no other tenant data exposed.
CREATE OR REPLACE FUNCTION public.get_intake_token_info(p_token text)
RETURNS TABLE(client_email text, status text, requested_fields jsonb, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT client_email, status, requested_fields, expires_at
    FROM intake_tokens
    WHERE token = p_token AND expires_at > now();
$$;
REVOKE EXECUTE ON FUNCTION public.get_intake_token_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intake_token_info(text) TO anon, authenticated;

-- Anonymous write: the ONLY thing an anonymous caller can ever mutate, and
-- only once (status must still be 'Sent'), and only while unexpired.
CREATE OR REPLACE FUNCTION public.complete_intake_token(p_token text, p_payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ws uuid;
BEGIN
    SELECT workspace_id INTO v_ws FROM intake_tokens
    WHERE token = p_token AND status = 'Sent' AND expires_at > now();

    IF v_ws IS NULL THEN
        RETURN false;
    END IF;

    UPDATE intake_tokens
    SET status = 'Completed', submitted_payload = p_payload, completed_at = now()
    WHERE token = p_token;

    RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_intake_token(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_intake_token(text, jsonb) TO anon, authenticated;
