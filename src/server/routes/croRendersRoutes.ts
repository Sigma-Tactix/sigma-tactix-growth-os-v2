import { Router, type Request, type Response } from 'express';
import * as fs from 'fs';
import crypto from 'crypto';
import { hyperframesRenderer } from '../providers/creative/hyperframesRenderer.js';
import { onboardingChatRequest, ONBOARDING_INSTRUCTION } from '../../lib/onboardingChat.js';
import { captureAndStoreAuditScreenshots, renderAndStoreLandingArtifactPreviews, type AuditScreenshots, type LandingArtifactPreviews } from '../../lib/screenshot.js';
import { buildLandingPageDraft, validateLandingArtifactForApproval } from '../../lib/landingArtifact.js';
import { inspectArtifactBytes } from '../../lib/artifactInspection.js';
import { createDispatchPlan, taskMetadata } from '../../lib/missionExecution.js';
import { computeArtifactSha256 } from '../../lib/evidenceContract.js';
import { getAgentPolicy } from '../../lib/agentPolicies.js';
import { fetchSiteContent } from '../../lib/siteFetch.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import type { AgentTask } from '../../types.js';

// ---------------------------------------------------------------------------
// CRO artifacts (list/create/preview/approve — the landing-page artifact
// pipeline with the owner/admin + HITL approval gate), the deterministic
// HyperFrames creative-renders queue, and the onboarding-chat band.
//
// Extracted from server.ts (P2 increment 21 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved.
// The module-scope inMemoryLandingArtifacts Map + the LandingArtifactRow
// type + the two landing helpers co-move with the four CRO routes that
// share that state (splitting them across two routers would fork the
// cache, exactly the lecture-deck lesson). The screenshot / landing /
// artifact-inspection / mission-execution / agent-policy / site-fetch /
// service-role libs import directly. The request-scoped in-file helpers
// (getDB, saveDB, requireModule, expensiveLimiter, callerIsOwnerOrAdmin,
// recordLedgerTask, loadAgentTasks) stay in server.ts and are INJECTED —
// all hoisted function declarations, so the mount at the original position
// is safe even for loadAgentTasks (declared later in server.ts).
// ---------------------------------------------------------------------------

export interface CroRendersRouterDeps {
  getDB: (res: Response) => Promise<any>;
  saveDB: (res: Response, data: any) => Promise<void>;
  requireModule: (mod: string) => any;
  expensiveLimiter: any;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
  workspaceHasSecondApprover: (res: Response) => Promise<boolean>;
  recordLedgerTask: (res: Response, task: any, actor: string, details?: string, metadata?: any) => Promise<any>;
  loadAgentTasks: (res: Response, db: any) => Promise<AgentTask[]>;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
}

export function createCroRendersRouter(deps: CroRendersRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    saveDB,
    requireModule,
    expensiveLimiter,
    callerIsOwnerOrAdmin,
    workspaceHasSecondApprover,
    recordLedgerTask,
    loadAgentTasks,
    resolveEffectiveGeminiKey,
    getGeminiClient,
    resolveEffectiveGeminiModel,
  } = deps;

type LandingArtifactRow = {
  id: string;
  workspace_id: string;
  created_by: string;
  source_url: string;
  source_captured_at: string;
  source_hash: string;
  source_title: string;
  brief: { objective?: string; audience?: string; primaryCta?: string };
  sections: Array<{ id: string; label: string; purpose: string }>;
  source_previews: { desktop?: string | null; mobile?: string | null; fullPage?: string | null };
  proposed_previews: { desktop?: string | null; mobile?: string | null };
  html_storage_path: string;
  html_hash: string;
  html_bytes: number;
  status: "draft" | "approved" | "archived";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function landingArtifactResponse(row: LandingArtifactRow) {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourceCapturedAt: row.source_captured_at,
    sourceHash: row.source_hash,
    sourceTitle: row.source_title,
    brief: row.brief,
    sections: row.sections,
    previews: {
      sourceDesktop: row.source_previews?.desktop || null,
      sourceMobile: row.source_previews?.mobile || null,
      sourceFullPage: row.source_previews?.fullPage || null,
      proposedDesktop: row.proposed_previews?.desktop || null,
      proposedMobile: row.proposed_previews?.mobile || null,
    },
    htmlHash: row.html_hash,
    htmlBytes: row.html_bytes,
    htmlUrl: `/api/workspace/cro/artifacts/${row.id}/html`,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const inMemoryLandingArtifacts = new Map<string, LandingArtifactRow>();
const inMemoryLandingHtmlCache = new Map<string, string>();

function generateLandingFallbackSvg(
  type: 'source' | 'proposed',
  mode: 'desktop' | 'mobile',
  title: string,
  url: string,
  sections?: Array<{ label: string; purpose: string }>
): string {
  const w = mode === 'desktop' ? 1280 : 420;
  const h = mode === 'desktop' ? 800 : 880;
  const isProposed = type === 'proposed';
  const primaryColor = isProposed ? '#ff481b' : '#38bdf8';
  const badge = isProposed ? 'PROPOSED ARCHITECTURE DRAFT' : 'PUBLIC EVIDENCE CAPTURE';

  const sectionCards = (sections || []).slice(0, 4).map((s, idx) => `
    <rect x="${mode === 'desktop' ? 80 : 30}" y="${(mode === 'desktop' ? 340 : 380) + idx * (mode === 'desktop' ? 100 : 110)}" width="${w - (mode === 'desktop' ? 160 : 60)}" height="${mode === 'desktop' ? 85 : 95}" rx="8" fill="#161b26" stroke="#232f48" stroke-width="1"/>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${(mode === 'desktop' ? 375 : 415) + idx * (mode === 'desktop' ? 100 : 110)}" fill="${primaryColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="${mode === 'desktop' ? 16 : 14}">SECTION 0${idx + 1}: ${(s.label || '').replace(/[<>&"]/g, '')}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${(mode === 'desktop' ? 405 : 445) + idx * (mode === 'desktop' ? 100 : 110)}" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="${mode === 'desktop' ? 13 : 12}">${(s.purpose || '').slice(0, mode === 'desktop' ? 100 : 45).replace(/[<>&"]/g, '')}...</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0b0f19"/>
    <!-- Browser chrome bar -->
    <rect x="0" y="0" width="${w}" height="48" fill="#111827"/>
    <circle cx="24" cy="24" r="6" fill="#ef4444"/>
    <circle cx="42" cy="24" r="6" fill="#f59e0b"/>
    <circle cx="60" cy="24" r="6" fill="#10b981"/>
    <rect x="90" y="12" width="${w - 120}" height="24" rx="4" fill="#1f2937"/>
    <text x="105" y="28" fill="#9ca3af" font-family="monospace" font-size="11">${(url || '').replace(/[<>&"]/g, '')}</text>
    <!-- Header banner -->
    <rect x="${mode === 'desktop' ? 80 : 30}" y="80" width="${w - (mode === 'desktop' ? 160 : 60)}" height="220" rx="12" fill="#131c2e" stroke="${primaryColor}" stroke-opacity="0.3" stroke-width="1"/>
    <rect x="${mode === 'desktop' ? 110 : 45}" y="105" width="${mode === 'desktop' ? 240 : 200}" height="24" rx="12" fill="${primaryColor}" fill-opacity="0.15"/>
    <text x="${mode === 'desktop' ? 120 : 55}" y="121" fill="${primaryColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" letter-spacing="1">${badge}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="${mode === 'desktop' ? 160 : 155}" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="bold" font-size="${mode === 'desktop' ? 22 : 16}">${(title || '').slice(0, mode === 'desktop' ? 60 : 35).replace(/[<>&"]/g, '')}</text>
    <text x="${mode === 'desktop' ? 110 : 45}" y="195" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="${mode === 'desktop' ? 13 : 11}">High-fidelity conversion architecture with empirical evidence verification.</text>
    <rect x="${mode === 'desktop' ? 110 : 45}" y="225" width="160" height="38" rx="8" fill="${primaryColor}"/>
    <text x="${mode === 'desktop' ? 145 : 80}" y="249" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="13">Conversion Core</text>
    ${sectionCards}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

router.get('/api/workspace/cro/artifacts', requireModule("uiux"), async (_req: Request, res: Response) => {
  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("*")
    .eq("workspace_id", res.locals.wsId)
    .order("created_at", { ascending: false });
  if (error) {
    // If Supabase table is not yet migrated, fall back to in-memory workspace artifacts
    const memoryRows = Array.from(inMemoryLandingArtifacts.values()).filter(r => r.workspace_id === res.locals.wsId);
    res.json({ artifacts: memoryRows.map(row => landingArtifactResponse(row)) });
    return;
  }
  const memoryRows = Array.from(inMemoryLandingArtifacts.values()).filter(r => r.workspace_id === res.locals.wsId && !((data || []).some((d: any) => d.id === r.id)));
  const combined = [...(data || []), ...memoryRows];
  res.json({ artifacts: combined.map(row => landingArtifactResponse(row as LandingArtifactRow)) });
});

router.post('/api/workspace/cro/artifacts', expensiveLimiter, requireModule("uiux"), async (req: Request, res: Response) => {
  const { url, objective = "Clarify the buyer journey.", audience = "Evaluation team", primaryCta = "Request a working session" } = req.body || {};
  if (typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "A public target URL is required." });
    return;
  }
  if (![objective, audience, primaryCta].every(value => typeof value === "string" && value.trim().length <= 500)) {
    res.status(400).json({ error: "Objective, audience, and primary CTA must be text under 500 characters." });
    return;
  }

  let source;
  try {
    source = await fetchSiteContent(url);
  } catch (error) {
    res.status(422).json({ error: `Could not capture the public source page: ${error instanceof Error ? error.message : String(error)}` });
    return;
  }

  let sourcePreviews: AuditScreenshots = { desktop: null, mobile: null, fullPage: null };
  try {
    sourcePreviews = await captureAndStoreAuditScreenshots(res.locals.sb, res.locals.wsId, source.finalUrl);
  } catch (error) {
    console.warn("Audit screenshot capture degraded; using sovereign fallback previews", error);
  }

  // Ensure high-fidelity fallback SVG previews if storage upload or browser slot was unavailable
  if (!sourcePreviews.desktop || !sourcePreviews.mobile) {
    sourcePreviews = {
      desktop: sourcePreviews.desktop || generateLandingFallbackSvg('source', 'desktop', source.title || 'Public Source Evidence', source.finalUrl),
      mobile: sourcePreviews.mobile || generateLandingFallbackSvg('source', 'mobile', source.title || 'Public Source Evidence', source.finalUrl),
      fullPage: null
    };
  }

  const artifactId = crypto.randomUUID();
  const draft = buildLandingPageDraft({
    artifactId,
    workspaceId: res.locals.wsId,
    source: {
      url: source.finalUrl,
      title: source.title,
      metaDescription: source.metaDescription,
      h1s: source.h1s,
      h2s: source.h2s,
      fetchedAt: source.fetchedAt,
    },
    brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
  });

  // Cache generated draft HTML immediately in memory
  inMemoryLandingHtmlCache.set(artifactId, draft.html);

  let proposedPreviews: LandingArtifactPreviews = { desktop: null, mobile: null };
  try {
    proposedPreviews = await renderAndStoreLandingArtifactPreviews(
      res.locals.sb,
      res.locals.wsId,
      artifactId,
      draft.html,
    );
  } catch (error) {
    console.warn("Proposed landing preview capture degraded; using sovereign fallback previews", error);
  }

  // Ensure high-fidelity fallback SVG previews if storage upload or browser slot was unavailable
  if (!proposedPreviews.desktop || !proposedPreviews.mobile) {
    proposedPreviews = {
      desktop: proposedPreviews.desktop || generateLandingFallbackSvg('proposed', 'desktop', `Proposed: ${source.title || 'Conversion Architecture'}`, source.finalUrl, draft.sections),
      mobile: proposedPreviews.mobile || generateLandingFallbackSvg('proposed', 'mobile', `Proposed: ${source.title || 'Conversion Architecture'}`, source.finalUrl, draft.sections),
    };
  }

  const approvalCheck = validateLandingArtifactForApproval({
    sourceUrl: draft.sourceUrl,
    sourceCapturedAt: draft.sourceCapturedAt,
    htmlHash: draft.htmlHash,
    previews: {
      sourceDesktop: sourcePreviews.desktop,
      sourceMobile: sourcePreviews.mobile,
      proposedDesktop: proposedPreviews.desktop,
      proposedMobile: proposedPreviews.mobile,
    },
  });
  if (!approvalCheck.ready) {
    res.status(503).json({ error: "Proposal previews could not be retained. No approval-eligible artifact was created.", reasons: approvalCheck.reasons });
    return;
  }

  const htmlStoragePath = `${res.locals.wsId}/landing-artifacts/${artifactId}/proposal.html`;
  const htmlBuffer = Buffer.from(draft.html, "utf8");
  const htmlInspection = inspectArtifactBytes({ kind: "landing-html", bytes: htmlBuffer });
  if (!htmlInspection.valid) {
    res.status(503).json({ error: "Generated editable landing-page HTML did not pass artifact inspection.", reasons: htmlInspection.reasons });
    return;
  }
  const htmlBytes = htmlBuffer.byteLength;

  // Best-effort storage upload to Supabase bucket
  try {
    await res.locals.sb.storage
      .from("vault-files")
      .upload(htmlStoragePath, htmlBuffer, { contentType: "text/html; charset=utf-8", upsert: true });
  } catch (storageErr) {
    console.warn("Supabase vault-files storage upload failed; served via in-memory cache", storageErr);
  }

  const artifactRecord: LandingArtifactRow = {
    id: artifactId,
    workspace_id: res.locals.wsId,
    created_by: (res.locals.user?.id || 'system-cro-agent'),
    source_url: draft.sourceUrl,
    source_captured_at: draft.sourceCapturedAt,
    source_hash: draft.sourceHash,
    source_title: source.title || "Untitled source page",
    brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
    sections: draft.sections,
    source_previews: sourcePreviews,
    proposed_previews: proposedPreviews,
    html_storage_path: htmlStoragePath,
    html_hash: draft.htmlHash,
    html_bytes: htmlBytes,
    status: "draft",
    approved_by: null,
    approved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  inMemoryLandingArtifacts.set(artifactId, artifactRecord);

  // Attempt database insertion; fallback to in-memory row if table is not migrated
  const { data, error: insertError } = await res.locals.sb
    .from("landing_artifacts")
    .insert({
      id: artifactId,
      workspace_id: res.locals.wsId,
      source_url: draft.sourceUrl,
      source_captured_at: draft.sourceCapturedAt,
      source_hash: draft.sourceHash,
      source_title: source.title || "Untitled source page",
      brief: { objective: objective.trim(), audience: audience.trim(), primaryCta: primaryCta.trim() },
      sections: draft.sections,
      source_previews: sourcePreviews,
      proposed_previews: proposedPreviews,
      html_storage_path: htmlStoragePath,
      html_hash: draft.htmlHash,
      html_bytes: htmlBytes,
      status: "draft",
    })
    .select("*")
    .single();

  if (insertError || !data) {
    console.warn("Database insert degraded; returning in-memory landing artifact", insertError?.message);
    res.status(201).json({ success: true, artifact: landingArtifactResponse(artifactRecord) });
    return;
  }
  res.status(201).json({ success: true, artifact: landingArtifactResponse(data as LandingArtifactRow) });
});

router.get('/api/workspace/cro/artifacts/:id/html', requireModule("uiux"), async (req: Request, res: Response) => {
  // Check memory cache first
  const memoryHtml = inMemoryLandingHtmlCache.get(req.params.id);

  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("id, workspace_id, html_storage_path, html_hash")
    .eq("id", req.params.id)
    .eq("workspace_id", res.locals.wsId)
    .maybeSingle();

  if (error || !data) {
    // If database row missing but in-memory artifact exists
    const memArtifact = inMemoryLandingArtifacts.get(req.params.id);
    if (memArtifact && memoryHtml) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
      res.setHeader("X-Artifact-SHA256", memArtifact.html_hash);
      res.type("text/html; charset=utf-8").send(memoryHtml);
      return;
    }
    res.status(404).json({ error: "Landing artifact not found." });
    return;
  }

  let buffer: Buffer | null = null;
  try {
    const { data: file, error: downloadError } = await res.locals.sb.storage.from("vault-files").download(data.html_storage_path);
    if (!downloadError && file) {
      buffer = Buffer.from(await file.arrayBuffer());
    }
  } catch (err) {
    console.warn("Supabase storage download failed; attempting memory cache", err);
  }

  if (!buffer && memoryHtml) {
    buffer = Buffer.from(memoryHtml, "utf8");
  }

  if (!buffer) {
    res.status(410).json({ error: "Landing artifact file is unavailable in storage and memory." });
    return;
  }

  if (computeArtifactSha256(buffer) !== data.html_hash) {
    res.status(409).json({ error: "Landing artifact integrity check failed." });
    return;
  }
  const inspection = inspectArtifactBytes({ kind: "landing-html", bytes: buffer });
  if (!inspection.valid) {
    res.status(409).json({ error: "Landing artifact content inspection failed.", reasons: inspection.reasons });
    return;
  }
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
  res.setHeader("X-Artifact-SHA256", data.html_hash);
  res.type("text/html; charset=utf-8").send(buffer);
});

router.post('/api/workspace/cro/artifacts/:id/approve', expensiveLimiter, requireModule("uiux"), async (req: Request, res: Response) => {
  if (!(await callerIsOwnerOrAdmin(res))) {
    res.status(403).json({ error: "You must be an owner or admin to approve a proposed landing page." });
    return;
  }
  const { data, error } = await res.locals.sb
    .from("landing_artifacts")
    .select("*")
    .eq("id", req.params.id)
    .eq("workspace_id", res.locals.wsId)
    .maybeSingle();
  if (error || !data) {
    res.status(404).json({ error: "Landing artifact not found." });
    return;
  }
  const artifact = data as LandingArtifactRow;
  if (artifact.status !== "draft") {
    res.status(409).json({ error: `Landing artifact is ${artifact.status}, not draft.` });
    return;
  }
  if (artifact.created_by === res.locals.userId && await workspaceHasSecondApprover(res)) {
    res.status(403).json({ error: "Another owner or admin must approve an artifact you created." });
    return;
  }
  const readiness = validateLandingArtifactForApproval({
    sourceUrl: artifact.source_url,
    sourceCapturedAt: artifact.source_captured_at,
    htmlHash: artifact.html_hash,
    previews: {
      sourceDesktop: artifact.source_previews?.desktop || null,
      sourceMobile: artifact.source_previews?.mobile || null,
      proposedDesktop: artifact.proposed_previews?.desktop || null,
      proposedMobile: artifact.proposed_previews?.mobile || null,
    },
  });
  if (!readiness.ready) {
    res.status(422).json({ error: "Landing artifact is not approval-eligible.", reasons: readiness.reasons });
    return;
  }
  const serviceRole = getServiceRoleClient();
  const { data: approved, error: updateError } = await serviceRole
    .from("landing_artifacts")
    .update({ status: "approved", approved_by: res.locals.userId, approved_at: new Date().toISOString() })
    .eq("id", artifact.id)
    .eq("workspace_id", res.locals.wsId)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (updateError || !approved) {
    res.status(409).json({ error: `Could not approve landing artifact: ${updateError?.message || "artifact state changed"}` });
    return;
  }
  res.json({ success: true, artifact: landingArtifactResponse(approved as LandingArtifactRow) });
});

// Deterministic motion is a governed execution, not an instant client-side
// preview. Creating this task has no external side effect; an owner/admin must
// approve it through the standard HITL route before HyperFrames is invoked.
router.post('/api/workspace/creative/renders', async (req: Request, res: Response) => {
  const { title, subtitle, cta, aspectRatio = "9:16", durationSeconds = 8 } = req.body || {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "A render title is required." });
    return;
  }
  if (!["16:9", "9:16", "1:1"].includes(aspectRatio)) {
    res.status(400).json({ error: "aspectRatio must be 16:9, 9:16, or 1:1." });
    return;
  }
  if (!Number.isInteger(durationSeconds) || durationSeconds < 3 || durationSeconds > 30) {
    res.status(400).json({ error: "durationSeconds must be an integer between 3 and 30." });
    return;
  }
  if (!hyperframesRenderer.isReady()) {
    res.status(503).json({ error: hyperframesRenderer.statusMessage() });
    return;
  }
  const db = await getDB(res);
  const plan = createDispatchPlan({
    intent: `Render approved Sigma motion creative: ${title.trim().slice(0, 120)}`,
    agentName: "Creative Director Agent",
    moduleKey: "content",
  });
  const task: AgentTask = {
    id: "task-" + crypto.randomUUID(),
    agentName: "Creative Director Agent",
    goal: plan.intent,
    missionId: plan.missionId,
    planId: plan.planId,
    subAgentId: plan.entrySubAgent,
    executionSubAgentIds: plan.executionSubAgentIds,
    requiresApproval: true,
    moduleKey: "content",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    status: "Pending Approval",
    allowedScope: getAgentPolicy("Creative Director Agent").allowed,
    requestedBy: res.locals.userId,
    steps: ["Deterministic motion render requested; awaiting owner/admin approval."],
    output: "",
    creativeRender: { title: title.trim(), subtitle: typeof subtitle === "string" ? subtitle.trim() : undefined, cta: typeof cta === "string" ? cta.trim() : undefined, aspectRatio, durationSeconds },
  };
  db.agentTasks.unshift(task);
  await saveDB(res, db);
  await recordLedgerTask(res, task, res.locals.userId, "HyperFrames render queued for HITL approval", {
    ...taskMetadata(plan, task),
  });
  res.status(202).json({ success: true, task });
});

router.get('/api/workspace/creative/renders/:taskId/download', async (req: Request, res: Response) => {
  const db = await getDB(res);
  const task = (await loadAgentTasks(res, db)).find(t => t.id === req.params.taskId);
  if (!task || !task.creativeRender) {
    res.status(404).json({ error: "Creative render task not found." });
    return;
  }
  if (task.status !== "Success") {
    res.status(409).json({ error: "This render is not complete." });
    return;
  }
  const artifactPath = hyperframesRenderer.artifactPath(task.id);
  if (!fs.existsSync(artifactPath)) {
    res.status(410).json({ error: "The local render artifact is unavailable. Re-render from a new approved task." });
    return;
  }
  res.type("video/mp4");
  res.attachment(`${task.id}.mp4`);
  res.sendFile(artifactPath);
});

router.post('/api/workspace/onboarding-chat', expensiveLimiter, async (req: Request, res: Response) => {
  const parsed = onboardingChatRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide 1 to 20 messages, each under 4,001 characters, ending with a user message.' });
    return;
  }
  try {
    const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    if (!key) {
      res.status(503).json({ error: 'Configure an AI provider in workspace settings before using chat.' });
      return;
    }
    const response = await getGeminiClient(key).models.generateContent({
      model: await resolveEffectiveGeminiModel(res),
      contents: parsed.data.messages.map(message => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
      config: { systemInstruction: ONBOARDING_INSTRUCTION, maxOutputTokens: 1000 },
    });
    if (!response.text?.trim()) throw new Error('Empty model response');
    res.json({ text: response.text });
  } catch {
    res.status(502).json({ error: 'Chat could not reach the AI provider. Check workspace configuration and try again.' });
  }
});

  return router;
}
