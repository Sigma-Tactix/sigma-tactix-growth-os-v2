import { Router, type Request, type Response } from 'express';
import type { ContentAsset, ConnectorPlatform } from '../../types.js';

// ---------------------------------------------------------------------------
// Content assets — status transitions, the publish gate (the highest
// blast-radius route in the app: REAL posts to the client's corporate social
// accounts via stored OAuth connector adapters), and AI Improve.
//
// Extracted from server.ts (P2 increment 14 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved, including
// the two guards that make the "agents never write externally without an
// approval token" claim true: the owner/admin check and the
// Approved/Published-only HITL status gate. The region-local
// CONTENT_ASSET_STATUSES const co-moves. Everything else the routes consume —
// getDB/saveDB, callerIsOwnerOrAdmin, publishAdapters, getStoredCredentials,
// the Gemini trio, classifyGeminiError, recordTokenUsage, requireModule — is
// INJECTED; it stays in server.ts, which owns it. Mounted under /api/workspace
// AFTER the global app.use("/api/workspace", requireAuth), so auth + RLS
// semantics are unchanged; the per-route requireModule("content") tier gate is
// preserved inside the router.
// ---------------------------------------------------------------------------

export interface ContentAssetRouterDeps {
  getDB: (res: Response) => Promise<any>;
  saveDB: (res: Response, data: any) => Promise<void>;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
  publishAdapters: Partial<Record<ConnectorPlatform, (credentials: Record<string, any>, content: { title?: string; body?: string }) => Promise<{ success: boolean; url?: string; error?: string }>>>;
  getStoredCredentials: (connector: any) => Record<string, any>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  classifyGeminiError: (err: any) => string;
  recordTokenUsage: (res: Response, params: any) => Promise<any>;
  requireModule: (mod: string) => any;
}

export function createContentAssetRouter(deps: ContentAssetRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    saveDB,
    callerIsOwnerOrAdmin,
    publishAdapters,
    getStoredCredentials,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    classifyGeminiError,
    recordTokenUsage,
    requireModule,
  } = deps;

// Update Content Asset Status
// This is the approval half of the publish gate, and it previously accepted any
// string for `status` from any member with no validation at all. Two holes that
// closes: a plain member could set 'Approved' on their own asset (self-approval,
// making the owner/admin check on the publish route the only remaining control),
// and anyone could write 'Published' onto an asset that was never published —
// which is both a lie in the ledger and a status the publish route deliberately
// lets through.
const CONTENT_ASSET_STATUSES: ContentAsset["status"][] = ['Draft', 'Pending Approval', 'Approved', 'Published'];

router.post('/content-status', requireModule("content"), async (req: Request, res: Response) => {
  const { id, status } = req.body as { id?: string; status?: ContentAsset["status"] };

  if (!status || !CONTENT_ASSET_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${CONTENT_ASSET_STATUSES.join(", ")}` });
    return;
  }
  // 'Published' is set by the publish route itself, only after a real post
  // succeeded against at least one channel. Accepting it here would let anyone
  // fabricate a published state for an asset that never left the building.
  if (status === 'Published') {
    res.status(400).json({ error: "An asset becomes 'Published' by publishing it, not by setting its status." });
    return;
  }
  // Approving is the human sign-off the publish route relies on, so it carries
  // the same bar as publishing. Moving an asset to 'Draft' or 'Pending Approval'
  // stays open to any member — that is ordinary authoring, not authorization.
  if (status === 'Approved' && !(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to approve content for publishing." });
    return;
  }

  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (asset) {
    asset.status = status;
    await saveDB(res, db);
    res.json({ success: true, contentAsset: asset });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Publish a content asset to one or more real channels — the Creative
// Command Center's multi-select publish. For each requested platform: if a
// connected connector with a real publish adapter exists, actually post the
// content; otherwise records why it didn't (not connected, or no publish
// adapter for that platform yet) rather than silently no-oping.
// Highest blast radius route in the app: the publish adapters below make REAL
// posts to the client's corporate LinkedIn / X / Facebook accounts using their
// stored OAuth tokens, and a published post cannot be un-published by us.
//
// It previously checked only the module entitlement, that the asset existed,
// and that a connector was 'Connected'. That meant any plain workspace 'member'
// could post to the client's public voice, and a 'Draft' published exactly as
// readily as an approved asset — while docs/ARCHITECTURE.md claimed "Agents
// never write externally without an approval token." Two guards make that
// claim true: the same owner/admin check the team and AI-key routes already
// use, and the ContentAsset.status field, which has always carried an
// 'Approved' value that nothing enforced.
router.post('/content-assets/:id/publish', requireModule("content"), async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to publish to connected channels." });
    return;
  }
  const { id } = req.params;
  const { channels } = req.body as { channels?: string[] };
  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (!asset) {
    res.status(404).json({ error: "Content asset not found" });
    return;
  }
  // HITL gate. 'Published' is allowed through so re-publishing an already-live
  // asset to an additional channel still works; 'Draft' and 'Pending Approval'
  // are not — those are exactly the states a human has not signed off on.
  if (asset.status !== 'Approved' && asset.status !== 'Published') {
    res.status(409).json({
      error: `This asset is "${asset.status}" and has not been approved for publishing. Approve it first.`,
      assetStatus: asset.status,
    });
    return;
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    res.status(400).json({ error: "Select at least one channel to publish to." });
    return;
  }

  const publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const results: NonNullable<typeof asset.publishResults> = [];

  for (const platform of channels) {
    const connector = db.secondBrain.connectors.find(c => c.platform === platform && c.status === 'Connected');
    const adapter = publishAdapters[platform as ConnectorPlatform];
    if (!adapter) {
      results.push({ platform, success: false, error: "No publish integration exists for this channel yet.", publishedAt });
      continue;
    }
    if (!connector) {
      results.push({ platform, success: false, error: "Not connected — connect this channel in Integrations first.", publishedAt });
      continue;
    }
    try {
      const outcome = await adapter(getStoredCredentials(connector), { title: asset.title, body: asset.content });
      results.push({ platform, success: outcome.success, url: outcome.url, error: outcome.error, publishedAt });
    } catch (err: any) {
      results.push({ platform, success: false, error: err.message || String(err), publishedAt });
    }
  }

  asset.publishResults = [...(asset.publishResults || []), ...results];
  if (results.some(r => r.success)) {
    asset.status = 'Published';
  }
  await saveDB(res, db);
  res.json({ success: true, contentAsset: asset, results });
});

// AI Improve — rewrites the asset in place using Second Brain tone context.
router.post('/content-assets/:id/improve', requireModule("content"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getDB(res);
  const asset = db.contentAssets.find(a => a.id === id);
  if (!asset) {
    res.status(404).json({ error: "Content asset not found" });
    return;
  }
  const brain = db.secondBrain;

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — AI Improve needs a live Gemini key." });
    return;
  }

  try {
    const startTime = Date.now();
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are an elite editor improving an existing piece of content for "${asset.channel}". Sharpen clarity,
      strengthen the hook, tighten the CTA, and align it to the brand voice below — keep the same core message
      and length ballpark, do not pad with fluff.

      Brand voice: ${brain.brandVault.voiceAndTone}
      Core positioning: ${brain.brandVault.corePositioning}
      Target audience: ${brain.customerVault.idealCustomerProfile}

      Current draft (title: "${asset.title}"):
      """
      ${asset.content}
      """

      Return ONLY the improved body copy, no preamble or explanation.
    `;
    const response = await client.models.generateContent({ model: geminiModel, contents: prompt });
    asset.content = response.text || asset.content;
    await recordTokenUsage(res, {
      actionType: "IMPROVE_ASSET",
      modelName: geminiModel,
      usageMetadata: (response as any).usageMetadata,
      promptText: prompt,
      responseText: response.text,
      durationMs: Date.now() - startTime,
      metadata: { assetId: asset.id, title: asset.title },
    });
    await saveDB(res, db);
    res.json({ success: true, contentAsset: asset });
  } catch (err: any) {
    console.error("AI Improve failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

  return router;
}
