import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import { emptyWorkspaceData } from '../../initialData.js';
import type { WorkspaceData } from '../../types.js';
import { DISCOVERED_AGENCY_AGENTS } from '../../data/agencyAgentsRegistry.js';

// ---------------------------------------------------------------------------
// Workspace settings + Second Brain blob routes.
//
// Extracted from server.ts (P2 increment 2 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Covers:
//   POST /settings/mcps/:id/toggle
//   POST /settings/skills
//   POST /settings/agent-teams/:moduleKey
//   POST /settings/plugins/:id/toggle
//   POST /settings/skills/:id/toggle
//   DELETE /settings/skills/:id
//   POST /second-brain
//   POST /verify-domain-dns
//   POST /clone-template
//
// Mounted under /api/workspace AFTER the global app.use("/api/workspace",
// requireAuth) in server.ts — so every route runs through the per-request
// RLS-scoped client exactly as the original inline handlers did. The
// in-file getDB/saveDB request-scoped helpers are injected into the factory
// (they wrap the imported loadWorkspace/saveWorkspace), which keeps the
// router free of any Supabase detail.
// ---------------------------------------------------------------------------

export interface WorkspaceSettingsDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
}

export function createWorkspaceSettingsRouter(deps: WorkspaceSettingsDeps): Router {
  const { getDB, saveDB } = deps;
  const router = Router();

  // MCP servers + Agent Skills (#task11, Cockpit sections) — the toggle in
  // the old combined "MCP & Agent Skills" Settings card had no save handler
  // wired (defaultChecked only, pure local UI state that reset on reload).
  // This gives it a real persistence path.
  router.post('/settings/mcps/:id/toggle', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await getDB(res);
    const mcp = db.settings?.mcps?.find(m => m.id === id);
    if (!mcp) {
      res.status(404).json({ error: 'MCP not found' });
      return;
    }
    mcp.enabled = !mcp.enabled;
    await saveDB(res, db);
    res.json({ success: true, mcp });
  });

  router.post('/settings/skills', async (req: Request, res: Response) => {
    const { name, moduleKey } = req.body as { name?: string; moduleKey?: string };
    if (!name?.trim() || !moduleKey?.trim()) {
      res.status(400).json({ error: 'name and moduleKey are required' });
      return;
    }
    const db = await getDB(res);
    db.settings = db.settings || ({} as any);
    db.settings.skills = db.settings.skills || [];
    const skill = { id: 'skill-' + Date.now(), name: name.trim(), moduleKey: moduleKey.trim(), enabled: true };
    db.settings.skills.push(skill);
    await saveDB(res, db);
    res.json({ success: true, skill });
  });

  // Per-module AI Agent Teams (#cockpit redesign) — which library agents are
  // assigned to a given module's team.
  router.post('/settings/agent-teams/:moduleKey', async (req: Request, res: Response) => {
    const { moduleKey } = req.params;
    const { agentId, action } = req.body as { agentId?: string; action?: 'add' | 'remove' };
    if (!agentId || !action) {
      res.status(400).json({ error: 'agentId and action are required' });
      return;
    }
    if (!DISCOVERED_AGENCY_AGENTS.some(a => a.id === agentId)) {
      res.status(404).json({ error: 'Unknown agent' });
      return;
    }
    const db = await getDB(res);
    db.settings = db.settings || ({} as any);
    db.settings.agentTeams = db.settings.agentTeams || {};
    const current = db.settings.agentTeams[moduleKey] || [];
    db.settings.agentTeams[moduleKey] = action === 'add'
      ? Array.from(new Set([...current, agentId]))
      : current.filter(id => id !== agentId);
    await saveDB(res, db);
    res.json({ success: true, moduleKey, team: db.settings.agentTeams[moduleKey] });
  });

  router.post('/settings/plugins/:id/toggle', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await getDB(res);
    const plugin = db.settings?.plugins?.find(p => p.id === id);
    if (!plugin) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    plugin.enabled = !plugin.enabled;
    await saveDB(res, db);
    res.json({ success: true, plugin });
  });

  router.post('/settings/skills/:id/toggle', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await getDB(res);
    const skill = db.settings?.skills?.find(s => s.id === id);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }
    skill.enabled = !skill.enabled;
    await saveDB(res, db);
    res.json({ success: true, skill });
  });

  router.delete('/settings/skills/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await getDB(res);
    db.settings.skills = (db.settings?.skills || []).filter(s => s.id !== id);
    await saveDB(res, db);
    res.json({ success: true });
  });

  // Update Second Brain
  router.post('/second-brain', async (req: Request, res: Response) => {
    const db = await getDB(res);
    db.secondBrain = req.body;
    await saveDB(res, db);
    res.json({ success: true, secondBrain: db.secondBrain });
  });

  // DNS TXT Domain Ownership Verification Route (FEAT-004)
  router.post('/verify-domain-dns', async (req: Request, res: Response) => {
    const db = await getDB(res);
    const siteUrl = req.body?.siteUrl || db.secondBrain.websiteVault.siteUrl;

    if (!siteUrl) {
      res.status(400).json({ error: 'No site URL specified in Website Vault.' });
      return;
    }

    // Generate or retrieve verification token
    let token = db.secondBrain.websiteVault.dnsVerificationToken;
    if (!token) {
      token = `st-verify-${crypto.randomBytes(8).toString('hex')}`;
      db.secondBrain.websiteVault.dnsVerificationToken = token;
    }

    // Extract hostname from siteUrl
    const domain = siteUrl.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    if (!domain) {
      res.status(400).json({ error: 'Invalid domain format.' });
      return;
    }

    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flattenedRecords = txtRecords.flat().join(' ');

      const isVerified = flattenedRecords.includes(token);
      const newStatus = isVerified ? 'verified' : 'unverified';

      db.secondBrain.websiteVault.domainVerificationStatus = newStatus as any;
      await saveDB(res, db);

      res.json({
        success: true,
        verified: isVerified,
        domain,
        token,
        status: newStatus,
        message: isVerified
          ? `Domain ${domain} ownership successfully verified via DNS TXT record!`
          : `DNS TXT record '${token}' not found on ${domain}. Please allow up to 5 minutes for DNS propagation.`
      });
    } catch (err: any) {
      db.secondBrain.websiteVault.domainVerificationStatus = 'unverified';
      await saveDB(res, db);

      res.json({
        success: false,
        verified: false,
        domain,
        token,
        status: 'unverified',
        message: `DNS lookup failed for ${domain}: ${err.message || 'Domain not reachable'}`
      });
    }
  });

  // Workspace Template Structure Cloning Route (FEAT-004)
  router.post('/clone-template', async (req: Request, res: Response) => {
    const sourceDb = await getDB(res);
    const targetWorkspaceName = req.body?.targetWorkspaceName || 'Cloned Client Workspace';

    // Clones STRUCTURE, not content — so it starts from the empty template, not
    // the demo seed. Cloning initialWorkspaceData meant every "cloned client
    // workspace" arrived pre-populated with Sigma Tactix's audit, credentials and
    // connectors. The two vaults carried over from the source below are the
    // deliberate exception: SOPs and agent configs are the reusable structure
    // this route exists to propagate.
    const clonedData: WorkspaceData = {
      ...structuredClone(emptyWorkspaceData),
      secondBrain: {
        ...structuredClone(emptyWorkspaceData.secondBrain),
        brandVault: {
          ...structuredClone(emptyWorkspaceData.secondBrain.brandVault),
          brandSlogan: targetWorkspaceName
        },
        operationsVault: sourceDb.secondBrain.operationsVault,
        aiWorkflowVault: sourceDb.secondBrain.aiWorkflowVault
      },
      setupProgress: {
        currentStep: 1,
        completedSteps: [],
        isDismissed: false
      }
    };

    res.json({
      success: true,
      message: `Template workspace structure for '${targetWorkspaceName}' ready for tenant initialization.`,
      clonedTemplate: clonedData
    });
  });

  return router;
}
