import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';
import { fetchSiteContent, summarizeSnapshotForPrompt } from '../../lib/siteFetch.js';
import { saveDocument } from '../../lib/rag.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// Competitor Analysis (#18) — real fetch + Gemini analysis against a
// competitor's live domain, same fetchSiteContent()-then-analyze pattern as
// Growth Audit / Authority & SEO. Explicitly labeled inferred-from-public-
// site (no paid competitive-intel API connected).
//
// Extracted from server.ts (P2 increment 6 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The in-file Gemini helpers
// (getGeminiClient / resolveEffectiveGeminiKey / resolveEffectiveGeminiModel)
// and classifyGeminiError are shared with many other families, so they stay
// defined in server.ts and are INJECTED here — same DI shape as the CRO and
// agent-reach routers. Mounted under /api/workspace/competitors AFTER the
// global app.use("/api/workspace", requireAuth) in server.ts, so the auth,
// rate-limiter (expensiveLimiter on scan) and tier-gate (requireModule)
// semantics are unchanged.
// ---------------------------------------------------------------------------

export interface CompetitorsRouterDeps {
  requireModule: (mod: string) => any;
  expensiveLimiter: any;
  getGeminiClient: (overrideKey?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  classifyGeminiError: (err: any) => string;
  getDB: (res: Response) => Promise<WorkspaceData>;
}

export function createCompetitorsRouter(deps: CompetitorsRouterDeps): Router {
  const router = Router();
  const {
    requireModule,
    expensiveLimiter,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    classifyGeminiError,
    getDB,
  } = deps;

  router.get('/', requireModule('competitors'), async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.from("competitors").select("*").order("created_at", { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, competitors: data });
  });

  router.post('/', requireModule('competitors'), async (req: Request, res: Response) => {
    const { name, domain, trackedKeywords } = req.body as { name?: string; domain?: string; trackedKeywords?: unknown };
    if (!name || !domain) { res.status(400).json({ error: "Competitor name and domain are required." }); return; }
    // A non-array trackedKeywords (the `?: string[]` type is only a compile-time
    // assertion, not runtime validation) used to be stored as-is into the jsonb
    // column, then crash every future scan at `.join(", ")` with no way to fix
    // it short of delete+recreate (no PATCH route exists). Validate at the door.
    const cleanKeywords = Array.isArray(trackedKeywords) ? trackedKeywords.filter((k): k is string => typeof k === "string") : [];
    const { data, error } = await res.locals.sb
      .from("competitors")
      .insert({ workspace_id: res.locals.wsId, name: name.trim(), domain: domain.trim(), tracked_keywords: cleanKeywords })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, competitor: data });
  });

  router.delete('/:id', requireModule('competitors'), async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from("competitors").delete().eq("id", req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  });

  router.post('/:id/scan', expensiveLimiter, requireModule('competitors'), async (req: Request, res: Response) => {
    const { data: competitor, error: fetchErr } = await res.locals.sb.from("competitors").select("*").eq("id", req.params.id).single();
    if (fetchErr || !competitor) { res.status(404).json({ error: "Competitor not found." }); return; }
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: "GEMINI_API_KEY not set — competitor scans need a live Gemini key." });
      return;
    }

    let snapshot;
    try {
      snapshot = await fetchSiteContent(competitor.domain);
    } catch (err: any) {
      res.status(422).json({ error: "Could not fetch the competitor's site: " + err.message });
      return;
    }

    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const db = await getDB(res);
      const prompt = `
      You are a competitive intelligence analyst. Analyze this real fetched site data for ${competitor.name}
      (${competitor.domain}) versus our business.

      Our business context: ${db.secondBrain.brandVault?.corePositioning || "(no positioning on file)"}
      Tracked keywords for this competitor: ${(competitor.tracked_keywords || []).join(", ") || "none yet"}

      ${summarizeSnapshotForPrompt(snapshot)}

      This analysis is inferred entirely from the competitor's public site (no paid competitive-intel API
      is connected) — be explicit that traffic/ad-spend figures are not available, and focus on positioning,
      offer, content strategy, and on-page SEO signals you can actually observe.

      Return JSON: { "positioningSummary": string, "strengths": string[], "weaknesses": string[],
        "contentStrategyNotes": string, "seoSignalsNotes": string, "recommendedCounterMoves": string[] }
    `;
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              positioningSummary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              contentStrategyNotes: { type: Type.STRING },
              seoSignalsNotes: { type: Type.STRING },
              recommendedCounterMoves: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["positioningSummary", "strengths", "weaknesses", "contentStrategyNotes", "seoSignalsNotes", "recommendedCounterMoves"],
          },
        },
      });
      const parsed = JSON.parse(response.text || "{}");
      const analysis = { ...parsed, scannedUrl: snapshot.finalUrl, scannedAt: new Date().toISOString() };

      const { data: updated, error: updateErr } = await res.locals.sb
        .from("competitors")
        .update({ last_analysis: analysis, last_analyzed_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select().single();
      if (updateErr) { res.status(500).json({ error: updateErr.message }); return; }

      try {
        await saveDocument(res.locals.sb, {
          workspaceId: res.locals.wsId,
          vaultId: "competitor",
          sourceModule: "competitor_analysis",
          fileName: `Competitor Scan — ${competitor.name} — ${analysis.scannedAt.split("T")[0]}`,
          contentText: `${analysis.positioningSummary}\n\nStrengths: ${(analysis.strengths || []).join("; ")}\n\nWeaknesses: ${(analysis.weaknesses || []).join("; ")}`,
        });
      } catch (err) {
        console.error("Failed to save competitor scan into Second Brain documents (non-fatal):", err);
      }

      res.json({ success: true, competitor: updated });
    } catch (err: any) {
      console.error("Competitor scan failed:", err);
      res.status(500).json({ error: classifyGeminiError(err) });
    }
  });

  return router;
}
