import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';

// ---------------------------------------------------------------------------
// Social Listening (#18) — manual mention capture with real Gemini sentiment
// tagging (not a keyword heuristic). Connector-fed live ingestion is left
// for when a real social listening API is connected — same "connect a data
// source" honesty pattern as Growth Audit's social section.
//
// Extracted from server.ts (P2 increment 6 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The in-file Gemini helpers
// (getGeminiClient / resolveEffectiveGeminiKey / resolveEffectiveGeminiModel)
// are shared with many other families, so they stay defined in server.ts and
// are INJECTED here — same DI shape as the competitors router above. Mounted
// under /api/workspace/social-mentions AFTER the global
// app.use("/api/workspace", requireAuth) in server.ts, so the auth and
// tier-gate (requireModule("social")) semantics are unchanged.
// ---------------------------------------------------------------------------

export interface SocialMentionsRouterDeps {
  requireModule: (mod: string) => any;
  getGeminiClient: (overrideKey?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
}

export function createSocialMentionsRouter(deps: SocialMentionsRouterDeps): Router {
  const router = Router();
  const { requireModule, getGeminiClient, resolveEffectiveGeminiKey, resolveEffectiveGeminiModel } = deps;

  router.get('/', requireModule('social'), async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.from("social_mentions").select("*").order("detected_at", { ascending: false }).limit(200);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, mentions: data });
  });

  router.post('/', requireModule('social'), async (req: Request, res: Response) => {
    const { platform, mentionText, sourceUrl, author } = req.body as { platform?: string; mentionText?: string; sourceUrl?: string; author?: string };
    if (!platform || !mentionText || !mentionText.trim()) {
      res.status(400).json({ error: "Platform and mention text are required." });
      return;
    }

    let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
    if (process.env.GEMINI_API_KEY) {
      try {
        const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
        const geminiModel = await resolveEffectiveGeminiModel(res);
        const response = await client.models.generateContent({
          model: geminiModel,
          contents: `Classify the sentiment of this social media mention toward the brand as exactly one word — Positive, Neutral, or Negative:\n\n"${mentionText.trim()}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] } }, required: ["sentiment"] },
          },
        });
        const parsed = JSON.parse(response.text || "{}");
        if (["Positive", "Neutral", "Negative"].includes(parsed.sentiment)) sentiment = parsed.sentiment;
      } catch (err) {
        console.error("Sentiment classification failed, defaulting to Neutral (non-fatal):", err);
      }
    }

    const { data, error } = await res.locals.sb
      .from("social_mentions")
      .insert({ workspace_id: res.locals.wsId, platform, mention_text: mentionText.trim(), source_url: sourceUrl || null, author: author || null, sentiment })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, mention: data });
  });

  router.delete('/:id', requireModule('social'), async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from("social_mentions").delete().eq("id", req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  });

  return router;
}
