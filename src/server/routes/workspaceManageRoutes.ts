import { Router, type Request, type Response } from 'express';
import { emptyWorkspaceData } from '../../initialData.js';
import { saveWorkspace } from '../../lib/workspaceStore.js';
import {
  assertOwnerOrAdminOfDefault,
  CallerNotOwnerOrAdminError,
  createWorkspace,
  listMemberWorkspaces,
} from '../../lib/workspaceManage.js';

// ---------------------------------------------------------------------------
// Workspace management — create + list the Client Enclaves a caller is
// allowed to manage, and switch between them.
//
// Mounted under /api/workspace/manage, AFTER the global
// app.use("/api/workspace", requireAuth) — so both routes run through the
// per-request RLS-scoped client stashed by requireAuth; no service-role key,
// no secret-vault access. Create is gated to callers who hold owner/admin
// in their resolved default workspace (the same bar as the team routes), so
// a plain invited member cannot spawn enclaves; listing is membership-scoped
// by RLS itself.
// ---------------------------------------------------------------------------

export function createWorkspaceManageRouter(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const { workspaces, defaultWorkspaceId } = await listMemberWorkspaces(
        res.locals.sb,
        res.locals.userId,
      );
      res.json({
        workspaces,
        defaultWorkspaceId,
        // The empty-workspace guarantee for the create path below: anything a
        // new enclave starts with is the empty template, never demo content.
        seedPolicy: 'empty-template',
      });
    } catch (err: any) {
      console.error('Workspace list failed:', err);
      res.status(500).json({ error: 'Workspace list failed: ' + (err.message || String(err)) });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    const name = (req.body || {}).name;
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'A workspace name is required.' });
      return;
    }
    try {
      // Create right is owner/admin-only in the caller's default enclave —
      // mirrors the gate on the team routes; a plain member gets a 403.
      await assertOwnerOrAdminOfDefault(res.locals.sb, res.locals.userId);
      const created = await createWorkspace(res.locals.sb, res.locals.userId, name);
      // Membership enrolment happens in the AFTER INSERT trigger
      // (add_owner_membership), so the new enclave is usable on the caller's
      // next request with `x-workspace: <id>` — no separate step needed.
      // If initial onboarding profile is provided, seed the fresh workspace_state
      const profile = req.body?.profile;
      if (profile && typeof profile === 'object') {
        try {
          const db = structuredClone(emptyWorkspaceData);
          if (profile.domain && typeof profile.domain === 'string') {
            db.settings.technical.customDomain = profile.domain;
          }
          if (profile.brandVault && typeof profile.brandVault === 'object') {
            if (typeof profile.brandVault.corePositioning === 'string') {
              db.secondBrain.brandVault.corePositioning = profile.brandVault.corePositioning;
            }
            if (typeof profile.brandVault.offersAndPricing === 'string') {
              db.secondBrain.brandVault.offersAndPricing = profile.brandVault.offersAndPricing;
            }
            if (typeof profile.brandVault.voiceAndTone === 'string') {
              db.secondBrain.brandVault.voiceAndTone = profile.brandVault.voiceAndTone;
            }
          }
          if (profile.icp && typeof profile.icp === 'string') {
            db.secondBrain.customerVault.idealCustomerProfile = profile.icp;
          }
          await saveWorkspace(res.locals.sb, created.id, db);
        } catch (seedErr: any) {
          console.warn('Could not seed initial workspace profile state:', seedErr?.message || seedErr);
        }
      }
      res.status(201).json({
        id: created.id,
        name: created.name,
        ownerId: created.owner_id,
        createdAt: created.created_at,
        empty: !profile,
        role: 'owner',
        tier: (created as any).tier || 'starter',
      });
    } catch (err: any) {
      if (err instanceof CallerNotOwnerOrAdminError) {
        res.status(403).json({ error: 'Owner or admin required.' });
        return;
      }
      if (err?.message === 'A workspace name is required.') {
        res.status(400).json({ error: err.message });
        return;
      }
      console.error('Workspace create failed:', err);
      res.status(500).json({ error: 'Workspace create failed: ' + (err.message || String(err)) });
    }
  });

  return router;
}
