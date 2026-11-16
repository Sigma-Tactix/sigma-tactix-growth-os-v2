-- Fix: Allow workspace owners to SELECT their own workspaces
-- Prevents RLS deadlock during INSERT ... RETURNING id when creating a workspace
-- before trg_add_owner_membership has populated workspace_members.

DROP POLICY IF EXISTS ws_select ON workspaces;
CREATE POLICY ws_select ON workspaces
    FOR SELECT TO authenticated
    USING (public.is_member(id) OR owner_id = (select auth.uid()));
