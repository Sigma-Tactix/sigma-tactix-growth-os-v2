import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { sendEmail } from '../../lib/email.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// Workspace team management — list members/invites, invite, revoke, accept,
// change role, and remove members.
//
// Extracted from server.ts (P2 increment 4 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The team routes run through the
// per-request RLS-scoped Supabase client stashed by requireAuth and the
// SECURITY DEFINER RPCs (get_workspace_team, accept_workspace_invitation,
// update_member_role, remove_workspace_member).
//
// The two in-file role helpers are shared with the CRO / agents / ai-keys
// routes, so they stay defined in server.ts and are INJECTED here by
// reference (same DI shape as the settings router). callerIsOwnerOrAdmin
// is the only role gate the team routes use; workspaceHasSecondApprover is
// not consulted on this family and is intentionally not a dep.
// ---------------------------------------------------------------------------

export interface TeamDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
}

export function createTeamRouter(deps: TeamDeps): Router {
  const { getDB, callerIsOwnerOrAdmin } = deps;
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const { data: team, error: teamErr } = await res.locals.sb.rpc("get_workspace_team", { p_workspace_id: res.locals.wsId });
    if (teamErr) {
      res.status(500).json({ error: teamErr.message });
      return;
    }
    const { data: invites, error: inviteErr } = await res.locals.sb
      .from("workspace_invitations")
      .select("id, email, role, status, created_at, expires_at")
      .eq("workspace_id", res.locals.wsId)
      .eq("status", "Pending")
      .order("created_at", { ascending: false });
    if (inviteErr) {
      res.status(500).json({ error: inviteErr.message });
      return;
    }
    res.json({ success: true, members: team || [], pendingInvitations: invites || [] });
  });

  router.post('/invite', async (req: Request, res: Response) => {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: "You must be an owner or admin to invite team members." });
      return;
    }
    const { email, role } = req.body as { email?: string; role?: string };
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanRole = (role || "member").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!["admin", "member"].includes(cleanRole)) {
      res.status(400).json({ error: "Role must be 'admin' or 'member'." });
      return;
    }

    const token = crypto.randomBytes(24).toString("hex");
    const { data: invite, error } = await res.locals.sb
      .from("workspace_invitations")
      .upsert(
        { workspace_id: res.locals.wsId, email: cleanEmail, role: cleanRole, token, invited_by: res.locals.userId, status: "Pending" },
        { onConflict: "workspace_id,email" },
      )
      .select("id, email, role, status, created_at, expires_at")
      .single();
    if (error) {
      res.status(500).json({ error: "Failed to create invitation: " + error.message });
      return;
    }

    const appUrl = (process.env.APP_URL && !process.env.APP_URL.startsWith("MY_")) ? process.env.APP_URL : "http://localhost:3000";
    const db = await getDB(res);
    const workspaceName = db.secondBrain?.brandVault?.brandSlogan || db.secondBrain?.brandVault?.corePositioning || "your team's workspace";
    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: `You've been invited to join ${workspaceName} on Growth OS`,
      html: `
        <p>Hi,</p>
        <p>You've been invited to join <strong>${workspaceName}</strong> on Growth OS as a <strong>${cleanRole}</strong>.</p>
        <p><a href="${appUrl.replace(/\/$/, "")}/?invite=${token}">Accept invitation →</a></p>
        <p>This invitation expires in 14 days. If you don't have an account yet, sign up with this email address first.</p>
      `,
    });

    res.json({ success: true, invitation: invite, emailSent: emailResult.sent });
  });

  router.delete('/invite/:id', async (req: Request, res: Response) => {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: "You must be an owner or admin to revoke invitations." });
      return;
    }
    const { error } = await res.locals.sb
      .from("workspace_invitations")
      .delete()
      .eq("id", req.params.id)
      .eq("workspace_id", res.locals.wsId);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  });

  router.post('/accept', async (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ error: "Invitation token is required." });
      return;
    }
    const { data, error } = await res.locals.sb.rpc("accept_workspace_invitation", { p_token: token });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(400).json({ error: "This invitation is invalid, expired, or was sent to a different email address." });
      return;
    }
    res.json({ success: true });
  });

  router.get('/pending-invitations', async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.rpc("get_my_pending_invitations");
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, invitations: data || [] });
  });

  router.post('/role', async (req: Request, res: Response) => {
    const { userId, role } = req.body as { userId?: string; role?: string };
    if (!userId || !["admin", "member"].includes(role || "")) {
      res.status(400).json({ error: "userId and a valid role ('admin' or 'member') are required. Ownership cannot be transferred through this endpoint." });
      return;
    }
    const { data, error } = await res.locals.sb.rpc("update_member_role", { p_workspace_id: res.locals.wsId, p_user_id: userId, p_role: role });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(403).json({ error: "You must be an owner or admin to change roles, and the workspace owner's role cannot be changed." });
      return;
    }
    res.json({ success: true });
  });

  router.delete('/member/:userId', async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.rpc("remove_workspace_member", { p_workspace_id: res.locals.wsId, p_user_id: req.params.userId });
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(403).json({ error: "You must be an owner or admin to remove members, and the workspace owner cannot be removed." });
      return;
    }
    res.json({ success: true });
  });

  return router;
}
