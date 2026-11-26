import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { Type } from '@google/genai';
import { saveDocument } from '../../lib/rag.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// Performance module — discovery-call swarm, campaign-report upload +
// insights, questionnaire notes, media-plan templates, sample-template
// downloads, and per-channel strategy generation.
//
// Extracted from server.ts (P2 increment 11 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). All routes keep their tier gate
// (requireModule("performance")) and, on the two file routes, the multer
// layer stays BEFORE the tier gate — the exact inline order is preserved so
// unentitled callers still get the 403 with no file-handling side effects.
// Request-scoped getDB/saveDB, the in-file Gemini helpers, expensiveLimiter,
// requireModule and the shared 20 MB multer instance are INJECTED — they stay
// in server.ts, which owns them. Mounted under /api/workspace AFTER the
// global app.use("/api/workspace", requireAuth), so auth + RLS semantics are
// unchanged.
// ---------------------------------------------------------------------------

export interface PerformanceRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  classifyGeminiError: (err: any) => string;
  expensiveLimiter: any;
  requireModule: (mod: string) => any;
  upload: any;
}

export function createPerformanceRouter(deps: PerformanceRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    saveDB,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    classifyGeminiError,
    expensiveLimiter,
    requireModule,
    upload,
  } = deps;

router.post('/run-performance-swarm', expensiveLimiter, requireModule("performance"), async (req: Request, res: Response) => {
  const { notes } = req.body as { notes?: string };
  const db = await getDB(res);
  const brain = db.secondBrain;
  const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
  const geminiModel = await resolveEffectiveGeminiModel(res);

  if (process.env.GEMINI_API_KEY) {
    // Real bug fixed: this used to be `if (GEMINI_API_KEY && notes)`, so a
    // real key with empty notes silently fell into the mock branch below and
    // overwrote real ICP/media-plan/client-insights data with canned mock
    // content while reporting success — same required-field pattern as
    // /run-diagnostic and /run-uiux now applied here instead of a 400.
    if (!notes || !notes.trim()) {
      res.status(400).json({ error: "Discovery call notes are required to process with the AI Swarm." });
      return;
    }
    try {
      const prompt = `
        You are the Head of Performance Media at Sigma Tactix. Analyze the following Discovery Call notes and extract key B2B SaaS target ICP traits, monthly budget target, target CPA, and a recommended media plan allocating budget across Google Ads, LinkedIn Ads, Meta Ads, TikTok Ads, Twitter (X) Ads, Apple Search Ads, Reddit Ads, and Pinterest Ads.
        Also produce "New Client Insights" — a first-call read on this client: pain points, budget signal
        strength, urgency level, and which Sigma Tactix package tier fits them best.

        Discovery Call Notes:
        "${notes}"

        Provide the results in JSON matching:
        - "icp": A concise paragraph summary of the Ideal Customer Profile.
        - "budget": Target Monthly budget (e.g. "$50,000")
        - "cpaTarget": Target CPA or ROAS (e.g. "$150 CPA")
        - "mediaPlan": Array of comprehensive objects, one per channel:
          { "channel": string, "funnelStage": string, "objective": string, "budget": string, "expectedCPA": string,
            "campaignType": string, "adFormat": string, "audienceTargeting": string, "expectedImpressions": string,
            "expectedClicks": string, "expectedConversions": string, "kpi": string }
        - "clientInsights": object { "painPoints": string, "budgetSignal": "Strong"|"Moderate"|"Weak", "urgency": "High"|"Medium"|"Low", "recommendedPackage": string, "summary": string }
      `;

      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              icp: { type: Type.STRING },
              budget: { type: Type.STRING },
              cpaTarget: { type: Type.STRING },
              mediaPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    channel: { type: Type.STRING },
                    funnelStage: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    budget: { type: Type.STRING },
                    expectedCPA: { type: Type.STRING },
                    campaignType: { type: Type.STRING },
                    adFormat: { type: Type.STRING },
                    audienceTargeting: { type: Type.STRING },
                    expectedImpressions: { type: Type.STRING },
                    expectedClicks: { type: Type.STRING },
                    expectedConversions: { type: Type.STRING },
                    kpi: { type: Type.STRING }
                  },
                  required: ["channel", "funnelStage", "objective", "budget", "expectedCPA", "campaignType", "adFormat", "audienceTargeting", "expectedImpressions", "expectedClicks", "expectedConversions", "kpi"]
                }
              },
              clientInsights: {
                type: Type.OBJECT,
                properties: {
                  painPoints: { type: Type.STRING },
                  budgetSignal: { type: Type.STRING, description: "Strong, Moderate, or Weak" },
                  urgency: { type: Type.STRING, description: "High, Medium, or Low" },
                  recommendedPackage: { type: Type.STRING },
                  summary: { type: Type.STRING }
                },
                required: ["painPoints", "budgetSignal", "urgency", "recommendedPackage", "summary"]
              }
            },
            required: ["icp", "budget", "cpaTarget", "mediaPlan", "clientInsights"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      db.secondBrain.customerVault.idealCustomerProfile = parsed.icp;
      // Store custom media plan in db
      (db as any).mediaPlan = parsed.mediaPlan;
      (db as any).performanceBudget = parsed.budget;
      (db as any).performanceCPATarget = parsed.cpaTarget;
      (db as any).performanceClientInsights = parsed.clientInsights;

      await saveDB(res, db);

      try {
        await saveDocument(res.locals.sb, {
          workspaceId: res.locals.wsId,
          vaultId: "performance",
          sourceModule: "discovery_notes",
          fileName: `Discovery Call Notes — ${new Date().toISOString().split("T")[0]}`,
          contentText: notes,
        });
      } catch (err) {
        console.error("Failed to save discovery notes into Second Brain documents (non-fatal):", err);
      }

      res.json({ success: true, workspace: db });
    } catch (err: any) {
      console.error("Gemini Performance Swarm failed:", err);
      res.status(500).json({ error: classifyGeminiError(err) });
    }
  } else {
    // Fallback Mock Swarm processing
    db.secondBrain.customerVault.idealCustomerProfile = "CMOs, Growth Directors, and B2B SaaS Founders in Tech firms looking to scale paid acquisition while reducing legacy agency overhead.";
    (db as any).performanceBudget = "$50,000";
    (db as any).performanceCPATarget = "$150 CPA";
    (db as any).mediaPlan = [
      { channel: "Google Ads", funnelStage: "BOFU / Intent", budget: "$15,000 (30%)", expectedCPA: "$120", campaignType: "Search - Competitor & Branded" },
      { channel: "LinkedIn Ads", funnelStage: "MOFU / Retargeting", budget: "$10,000 (20%)", expectedCPA: "$180", campaignType: "Single Image Lead Gen" },
      { channel: "Meta Ads", funnelStage: "TOFU / Discovery", budget: "$8,000 (16%)", expectedCPA: "$80", campaignType: "Video Views & Broad Reach" },
      { channel: "TikTok Ads", funnelStage: "TOFU / Discovery", budget: "$5,000 (10%)", expectedCPA: "$40", campaignType: "Spark Ads & Influencer Whitelisting" },
      { channel: "Apple Search Ads", funnelStage: "BOFU / Intent", budget: "$6,000 (12%)", expectedCPA: "$95", campaignType: "Search Match & Keyword Bidding" },
      { channel: "Twitter (X) Ads", funnelStage: "MOFU / Retargeting", budget: "$3,000 (6%)", expectedCPA: "$140", campaignType: "Premium Video Ads" },
      { channel: "Reddit Ads", funnelStage: "TOFU / Discovery", budget: "$3,500 (7%)", expectedCPA: "$110", campaignType: "Niche Subreddit Takeovers" }
    ];
    (db as any).performanceClientInsights = {
      painPoints: "Set GEMINI_API_KEY to generate real client insights from these notes.",
      budgetSignal: "Moderate",
      urgency: "Medium",
      recommendedPackage: "Growth Systems Retainer",
      summary: "Mock insight — no live Gemini key configured."
    };
    await saveDB(res, db);
    res.json({ success: true, workspace: db });
  }
});

// Upload + parse a historical campaign performance report — replaces the
// static "Select Files" mock. Real Storage upload, text extraction, and a
// fresh Gemini insights pass every time a new report lands.
router.post('/performance/upload-report', upload.single("file"), requireModule("performance"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const db = await getDB(res);
  const storagePath = `${res.locals.wsId}/performance-reports/${crypto.randomUUID()}-${file.originalname}`;

  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }

  let contentText = "";
  const lower = file.originalname.toLowerCase();
  if (file.mimetype.startsWith("text/") || lower.endsWith(".csv") || lower.endsWith(".txt")) {
    contentText = file.buffer.toString("utf8").slice(0, 30000);
  } else if (file.mimetype === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      contentText = result.text.slice(0, 30000);
    } catch (err) {
      console.error("PDF text extraction failed for campaign report:", err);
    }
  }

  let insights = "Text extraction isn't supported for this file type yet — stored, but no insights generated.";
  if (contentText && process.env.GEMINI_API_KEY) {
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: `You are a performance media analyst. Extract the key takeaways from this campaign performance report — top/bottom performing channels or campaigns, notable CPA/ROAS trends, and 2-3 concrete recommendations. Be specific, cite real numbers from the data where present.\n\nReport content:\n${contentText}`,
      });
      insights = response.text || insights;
    } catch (err: any) {
      console.error("Report insights generation failed:", err);
      insights = "Insight generation failed: " + classifyGeminiError(err);
    }
  }

  let documentId: string | undefined;
  try {
    documentId = await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId: "performance",
      sourceModule: "campaign_report",
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      contentText: contentText || undefined,
    });
  } catch (err) {
    console.error("saveDocument failed for campaign report:", err);
  }

  const report = {
    id: "report-" + Date.now(),
    fileName: file.originalname,
    uploadedAt: new Date().toISOString().split("T")[0],
    storagePath,
    documentId,
    insights,
  };
  (db as any).campaignReports = [report, ...((db as any).campaignReports || [])];
  await saveDB(res, db);
  res.json({ success: true, report, workspace: db });
});

// Questionnaire notes — a real persisted list (was a single ephemeral
// textarea with no save/history), also mirrored into Second Brain documents.
router.post('/performance/questionnaire-notes', requireModule("performance"), async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Note text is required" });
    return;
  }
  const db = await getDB(res);
  const note = { id: "note-" + Date.now(), text: text.trim(), createdAt: new Date().toISOString().split("T")[0] };
  (db as any).questionnaireNotes = [note, ...((db as any).questionnaireNotes || [])];
  await saveDB(res, db);

  try {
    await saveDocument(res.locals.sb, {
      workspaceId: res.locals.wsId,
      vaultId: "performance",
      sourceModule: "questionnaire_notes",
      fileName: `Questionnaire Note — ${note.createdAt}`,
      contentText: note.text,
    });
  } catch (err) {
    console.error("Failed to save questionnaire note into Second Brain documents (non-fatal):", err);
  }

  res.json({ success: true, note, workspace: db });
});

router.delete('/performance/questionnaire-notes/:noteId', requireModule("performance"), async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const db = await getDB(res);
  (db as any).questionnaireNotes = ((db as any).questionnaireNotes || []).filter((n: any) => n.id !== noteId);
  await saveDB(res, db);
  res.json({ success: true, workspace: db });
});

// Media plan template upload — a real file slot (was none) for users to
// upload their own planning template, alongside 2 bundled sample downloads.
router.post('/performance/media-plan-template', upload.single("file"), requireModule("performance"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const db = await getDB(res);
  const storagePath = `${res.locals.wsId}/media-plan-templates/${crypto.randomUUID()}-${file.originalname}`;
  const { error: uploadErr } = await res.locals.sb.storage
    .from("vault-files")
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadErr) {
    res.status(500).json({ error: "Storage upload failed: " + uploadErr.message });
    return;
  }
  (db as any).mediaPlanTemplate = { fileName: file.originalname, storagePath, uploadedAt: new Date().toISOString().split("T")[0] };
  await saveDB(res, db);
  res.json({ success: true, mediaPlanTemplate: (db as any).mediaPlanTemplate });
});

router.get('/performance/media-plan-template/url', requireModule("performance"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const template = (db as any).mediaPlanTemplate;
  if (!template?.storagePath) {
    res.status(404).json({ error: "No template uploaded" });
    return;
  }
  const { data, error } = await res.locals.sb.storage.from("vault-files").createSignedUrl(template.storagePath, 300);
  if (error || !data) {
    res.status(500).json({ error: "Could not create signed URL: " + (error?.message || "unknown error") });
    return;
  }
  res.json({ success: true, url: data.signedUrl });
});

// Two bundled sample media plan templates — real downloadable CSVs, not a
// dead link. Generated on the fly, no Storage needed for static content.
router.get('/performance/sample-template/:kind', requireModule("performance"), (req: Request, res: Response) => {
  const { kind } = req.params;
  const templates: Record<string, string> = {
    basic: "Channel,Funnel Stage,Objective,Monthly Budget,Target CPA/ROAS,Campaign Type,Ad Format,Flight Start,Flight End,Expected Impressions,Expected Clicks,Expected Conversions,KPI\nGoogle Ads,BOFU,Lead Gen,\"$15,000\",$120 CPA,Search - Branded,Text Ad,2026-08-01,2026-08-31,150000,4500,120,CPA\n",
    comprehensive: "Channel,Funnel Stage,Objective,Monthly Budget,% of Total Budget,Target CPA,Target ROAS,Campaign Type,Ad Format,Audience/Targeting,Flight Start,Flight End,Expected Impressions,Expected CTR,Expected Clicks,Expected CVR,Expected Conversions,Expected Revenue,KPI,Notes\nGoogle Ads,BOFU / Intent,Lead Gen,\"$20,000\",30%,$110,4.5x,Search - Competitor & Branded,Responsive Search Ad,In-market + Branded Search,2026-08-01,2026-08-31,200000,3.2%,6400,3.1%,198,\"$89,100\",CPA,Prioritize branded defense\nLinkedIn Ads,MOFU / Retargeting,Lead Gen,\"$12,000\",18%,$180,,Single Image Lead Gen,Sponsored Content,Job Title + Company Size,2026-08-01,2026-08-31,80000,0.8%,640,10%,64,,CPL,Retarget site visitors\n",
  };
  const csv = templates[kind];
  if (!csv) {
    res.status(404).json({ error: "Unknown template kind" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="media-plan-template-${kind}.csv"`);
  res.send(csv);
});

// Channels & Strategy — real per-channel reasoning (why this channel,
// recommended strategy, likely competitor presence) generated from the
// actual media plan channels, replacing 3 static boilerplate cards.
router.post('/performance/channel-strategies', requireModule("performance"), async (req: Request, res: Response) => {
  const db = await getDB(res);
  const brain = db.secondBrain;
  const mediaPlan = (db as any).mediaPlan as Array<{ channel: string }> | undefined;
  const channels = (mediaPlan && mediaPlan.length > 0 ? mediaPlan.map(m => m.channel) : ["Google Ads", "LinkedIn Ads", "Meta Ads"]);

  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not set — channel strategy generation needs a live Gemini key." });
    return;
  }

  try {
    const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
    const geminiModel = await resolveEffectiveGeminiModel(res);
    const prompt = `
      You are the Head of Performance Media. For each of these channels: ${channels.join(", ")} — answer,
      specific to this business, not generic boilerplate:
      1. why: Why this channel fits this business
      2. strategy: The recommended strategy/campaign approach
      3. competitors: What kind of competitor presence to expect on this channel

      Business context — positioning: ${brain.brandVault.corePositioning}, audience: ${brain.customerVault.idealCustomerProfile}

      Return a JSON array, one object per channel, each with fields: channel, why, strategy, competitors.
    `;
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              channel: { type: Type.STRING },
              why: { type: Type.STRING },
              strategy: { type: Type.STRING },
              competitors: { type: Type.STRING },
            },
            required: ["channel", "why", "strategy", "competitors"],
          },
        },
      },
    });
    const channelStrategies = JSON.parse(response.text || "[]");
    (db as any).channelStrategies = channelStrategies;
    await saveDB(res, db);
    res.json({ success: true, channelStrategies });
  } catch (err: any) {
    console.error("Channel strategy generation failed:", err);
    res.status(500).json({ error: classifyGeminiError(err) });
  }
});

  return router;
}
