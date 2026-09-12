-- ============================================================================
-- Fixes for 4 confirmed findings from the phase-11-15 adversarial review
-- (all independently verified by reading the running migrations/routes):
--
-- 1. apply_stripe_webhook_update was SECURITY DEFINER + GRANTed to anon.
--    Unlike intake_tokens (where the token argument IS an unguessable secret),
--    a Stripe customer id is just an identifier a workspace member can read
--    off their own `workspaces` row — so granting this to anon meant ANYONE
--    with the public anon key could call it directly via PostgREST,
--    completely bypassing server.ts's Stripe HMAC signature check, and set
--    their own (or any known customer id's) billing_status/plan to whatever
--    they wanted. Fix: revoke anon, grant service_role only — server.ts now
--    calls it via a service-role client used exclusively inside the
--    already-signature-verified webhook handler (see supabaseAdmin.ts).
--
-- 2. update_member_role() let a caller with role='admin' set p_role='owner'
--    on their own row (its guard only excluded targets whose CURRENT role
--    was already 'owner', never restricted the NEW value). Combined with
--    finding 4 below, a plain 'member' had a full self-service path to a
--    permanent, un-removable second 'owner' account. Fix: the function now
--    rejects p_role = 'owner' outright — ownership is not transferable
--    through this RPC.
--
-- 3. workspace_invitations.role CHECK allowed 'owner', and
--    accept_workspace_invitation() inserted it verbatim with no clamp — so
--    an invitation record with role='owner' (insertable by any member, since
--    member_rw RLS only checks workspace membership, not role) would mint an
--    owner on acceptance with zero admin involvement. Fix: the CHECK
--    constraint no longer allows 'owner', and accept_workspace_invitation()
--    additionally clamps role to 'member' as defense-in-depth.
--
-- 4. POST /api/workspace/team/invite and DELETE /api/workspace/team/invite/:id
--    (server.ts) had no caller-role check at all — any plain 'member' could
--    invite/revoke invitations, relying only on workspace_invitations'
--    member-wide RLS. Fixed in server.ts alongside this migration by adding
--    an explicit owner/admin check before both routes proceed.
-- ============================================================================

-- Fix 1: close the anon-reachable Stripe webhook RPC.
REVOKE EXECUTE ON FUNCTION public.apply_stripe_webhook_update(text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_update(text, text, text, text, timestamptz) TO service_role;

-- Fix 2: update_member_role can no longer grant 'owner'.
CREATE OR REPLACE FUNCTION public.update_member_role(p_workspace_id uuid, p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_role = 'owner' THEN
        RETURN false; -- ownership is not transferable through this RPC
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = p_workspace_id AND user_id = auth.uid() AND role IN ('owner','admin')
    ) THEN
        RETURN false;
    END IF;

    UPDATE workspace_members SET role = p_role
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND role <> 'owner';
    RETURN FOUND;
END;
$$;

-- Fix 3a: invitations can never carry role='owner' at the schema level.
ALTER TABLE workspace_invitations DROP CONSTRAINT IF EXISTS workspace_invitations_role_check;
-- Clamp any pre-existing 'owner' invitations (shouldn't exist yet in
-- practice, but the constraint add below would fail if any did) before
-- tightening the CHECK.
UPDATE workspace_invitations SET role = 'admin' WHERE role = 'owner';
ALTER TABLE workspace_invitations ADD CONSTRAINT workspace_invitations_role_check CHECK (role IN ('admin','member'));

-- Fix 3b: defense-in-depth clamp inside the RPC itself, independent of the
-- CHECK constraint above.
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite  workspace_invitations%ROWTYPE;
    v_email   text;
    v_role    text;
BEGIN
    SELECT * INTO v_invite FROM workspace_invitations
        WHERE token = p_token AND status = 'Pending' AND expires_at > now();
    IF v_invite IS NULL THEN
        RETURN false;
    END IF;

    v_email := auth.jwt() ->> 'email';
    IF v_email IS NULL OR lower(v_email) <> lower(v_invite.email) THEN
        RETURN false; -- only the invited email address may accept
    END IF;

    v_role := CASE WHEN v_invite.role = 'admin' THEN 'admin' ELSE 'member' END;

    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (v_invite.workspace_id, auth.uid(), v_role)
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    UPDATE workspace_invitations SET status = 'Accepted' WHERE token = p_token;
    RETURN true;
END;
$$;
