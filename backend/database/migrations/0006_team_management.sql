-- ============================================================================
-- Workspace & Team (#15) — real invite/accept/role-change/remove. Was 100%
-- local React state before (db.teamMembers/db.invitations never touched the
-- server). workspace_invitations already has member_rw RLS from
-- 0003_platform_expansion.sql (insert/list/revoke a pending invite all just
-- work for an existing member). What's missing:
--   1. Accepting an invite happens as a NON-member — RLS can't let them read/
--      write anything yet. SECURITY DEFINER RPC, same precedent as
--      is_member()/add_owner_membership() in init.sql.
--   2. workspace_members only ever had a SELECT policy (member rows are only
--      ever written by the add_owner_membership trigger) — role changes and
--      removal need their own SECURITY DEFINER RPCs, gated on the CALLER
--      being an owner/admin, not just any member.
--   3. Team member listing needs email, which lives in auth.users — not
--      queryable via PostgREST directly. A SECURITY DEFINER function can
--      join it (runs as the function owner, which has auth schema access).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite  workspace_invitations%ROWTYPE;
    v_email   text;
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

    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (v_invite.workspace_id, auth.uid(), v_invite.role)
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    UPDATE workspace_invitations SET status = 'Accepted' WHERE token = p_token;
    RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.accept_workspace_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(text) TO authenticated;

-- Lets the app show "You've been invited to X" right after any login,
-- regardless of which workspace resolveWorkspaceId() otherwise picked.
CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
RETURNS TABLE(token text, workspace_id uuid, workspace_name text, role text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT wi.token, wi.workspace_id, w.name, wi.role, wi.created_at
    FROM workspace_invitations wi
    JOIN workspaces w ON w.id = wi.workspace_id
    WHERE lower(wi.email) = lower(auth.jwt() ->> 'email')
      AND wi.status = 'Pending' AND wi.expires_at > now();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_pending_invitations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_pending_invitations() TO authenticated;

-- Real team roster with email — auth.users isn't reachable via PostgREST,
-- so this is the only way to show who's actually in the workspace.
CREATE OR REPLACE FUNCTION public.get_workspace_team(p_workspace_id uuid)
RETURNS TABLE(user_id uuid, email text, role text, joined_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT wm.user_id, au.email, wm.role, wm.created_at
    FROM workspace_members wm
    JOIN auth.users au ON au.id = wm.user_id
    WHERE wm.workspace_id = p_workspace_id AND public.is_member(p_workspace_id);
$$;
REVOKE EXECUTE ON FUNCTION public.get_workspace_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_team(uuid) TO authenticated;

-- Role changes / removal — gated on the CALLER being owner/admin (not just
-- any member), and the owner's own row can never be demoted/removed this way.
CREATE OR REPLACE FUNCTION public.update_member_role(p_workspace_id uuid, p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
REVOKE EXECUTE ON FUNCTION public.update_member_role(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_member_role(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = p_workspace_id AND user_id = auth.uid() AND role IN ('owner','admin')
    ) THEN
        RETURN false;
    END IF;

    DELETE FROM workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND role <> 'owner';
    RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.remove_workspace_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_workspace_member(uuid, uuid) TO authenticated;
