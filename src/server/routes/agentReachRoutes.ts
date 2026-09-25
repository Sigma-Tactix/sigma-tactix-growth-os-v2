import { Router, Request, Response } from 'express';
import { Type } from '@google/genai';
import {
  getAgentReachDoctor,
  executeReachFetch,
  executeReachSearch,
  generateCompetitorBattlecard,
  repurposeToArticle,
  repurposeToCarouselAndThread,
} from '../agentReachService.js';

export interface AgentReachRouterDeps {
  expensiveLimiter: any;
  requireModule: (mod: string) => any;
  getGeminiClient: (key: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
}

export function createAgentReachRouter(deps: AgentReachRouterDeps): Router {
  const router = Router();
  const { expensiveLimiter, requireModule, getGeminiClient, resolveEffectiveGeminiKey, resolveEffectiveGeminiModel } = deps;

  // GET /api/workspace/agent-reach/doctor
  router.get('/doctor', async (_req: Request, res: Response) => {
    try {
      const summary = await getAgentReachDoctor();
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to query Agent Reach doctor' });
    }
  });

  // POST /api/workspace/agent-reach/fetch
  router.post('/fetch', expensiveLimiter, async (req: Request, res: Response) => {
    const { channel, target, options } = req.body as { channel?: string; target?: string; options?: any };
    if (!target || !target.trim()) {
      res.status(400).json({ error: 'Target URL or query parameter is required.' });
      return;
    }
    try {
      const result = await executeReachFetch(channel || 'web', target.trim(), options);
      res.json({ success: result.success, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Agent Reach fetch failed' });
    }
  });

  // POST /api/workspace/agent-reach/sync-social
  router.post('/sync-social', expensiveLimiter, requireModule('social'), async (req: Request, res: Response) => {
    const { keyword, channel } = req.body as { keyword?: string; channel?: string };
    if (!keyword || !keyword.trim()) {
      res.status(400).json({ error: 'Search keyword is required.' });
      return;
    }
    try {
      const fetchRes = await executeReachSearch(channel || 'v2ex', keyword.trim());
      if (!fetchRes.success) {
        res.status(422).json({ error: fetchRes.error || 'Could not fetch content from channel' });
        return;
      }
      if (!fetchRes.content.trim() || fetchRes.metadata?.resultCount === 0) {
        res.json({ success: true, mention: null, rawResult: fetchRes });
        return;
      }

      let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      let category: 'Brand Mention' | 'Competitor Complaint' | 'Feature Request' | 'Sales Inbound' = 'Brand Mention';
      let aiResponseDraft = 'Thank you for discussing this. SigmaTactix Growth OS provides automated sovereign growth infrastructure.';
      let requiresAttention = false;

      if (process.env.GEMINI_API_KEY) {
        try {
          const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
          const geminiModel = await resolveEffectiveGeminiModel(res);
          const prompt = `Analyze this social post capture regarding keyword "${keyword}".
Capture: "${fetchRes.content.slice(0, 1500)}"

Classify:
1. sentiment: Positive, Neutral, or Negative.
2. category: Brand Mention, Competitor Complaint, Feature Request, or Sales Inbound.
3. requiresAttention: true if negative/churn risk or urgent sales inbound, false otherwise.
4. aiResponseDraft: A 1-2 sentence professional brand response draft that is helpful, empathetic, and on-brand.`;

          const response = await client.models.generateContent({
            model: geminiModel,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
                  category: { type: Type.STRING, enum: ['Brand Mention', 'Competitor Complaint', 'Feature Request', 'Sales Inbound'] },
                  requiresAttention: { type: Type.BOOLEAN },
                  aiResponseDraft: { type: Type.STRING },
                },
                required: ['sentiment', 'category', 'requiresAttention', 'aiResponseDraft'],
              },
            },
          });
          const parsed = JSON.parse(response.text || '{}');
          if (['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment)) sentiment = parsed.sentiment;
          if (['Brand Mention', 'Competitor Complaint', 'Feature Request', 'Sales Inbound'].includes(parsed.category)) category = parsed.category;
          if (typeof parsed.requiresAttention === 'boolean') requiresAttention = parsed.requiresAttention;
          if (parsed.aiResponseDraft) aiResponseDraft = parsed.aiResponseDraft;
        } catch (err) {
          console.error('Sentiment classification failed in agent-reach sync:', err);
        }
      }

      const platformName = channel === 'v2ex' ? 'V2EX' : channel === 'youtube' ? 'YouTube' : channel === 'reddit' ? 'Reddit' : channel === 'hackernews' ? 'Hacker News' : channel === 'web' ? 'Web (Jina)' : (channel || 'Agent Reach');

      let data: any = null;
      try {
        const dbInsert = await res.locals.sb
          .from('social_mentions')
          .insert({
            workspace_id: res.locals.wsId,
            platform: platformName,
            mention_text: fetchRes.content.slice(0, 500),
            source_url: fetchRes.target,
            author: fetchRes.metadata?.author || fetchRes.metadata?.uploader || 'Agent Reach Swarm',
            sentiment,
          })
          .select().single();
        if (!dbInsert.error) {
          data = dbInsert.data;
        }
      } catch (e) {
        console.warn('Could not insert to social_mentions table directly:', e);
      }

      const mentionPayload = {
        id: data?.id || `reach-${Date.now()}`,
        platform: platformName,
        mention_text: fetchRes.content.slice(0, 500),
        source_url: fetchRes.target,
        author: fetchRes.metadata?.author || fetchRes.metadata?.uploader || 'Agent Reach Swarm',
        sentiment,
        category,
        requiresAttention,
        aiResponseDraft,
        created_at: new Date().toISOString(),
      };

      res.json({ success: true, mention: mentionPayload, rawResult: fetchRes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/workspace/agent-reach/competitor-scan
  router.post('/competitor-scan', expensiveLimiter, requireModule('social'), async (req: Request, res: Response) => {
    const { target, competitorName } = req.body as { target?: string; competitorName?: string };
    if (!target || !target.trim()) {
      res.status(400).json({ error: 'Competitor target URL or domain is required.' });
      return;
    }
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const battlecard = await generateCompetitorBattlecard(target.trim(), competitorName || 'Target Competitor', client, geminiModel);
      res.json({ success: true, battlecard });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate competitor battlecard' });
    }
  });

  // POST /api/workspace/agent-reach/repurpose-article
  router.post('/repurpose-article', expensiveLimiter, requireModule('content'), async (req: Request, res: Response) => {
    const { sourceUrl, format, targetAudience } = req.body as { sourceUrl?: string; format?: any; targetAudience?: string };
    if (!sourceUrl || !sourceUrl.trim()) {
      res.status(400).json({ error: 'Source URL is required.' });
      return;
    }
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const article = await repurposeToArticle(
        sourceUrl.trim(),
        format || 'THOUGHT_LEADERSHIP',
        targetAudience || 'B2B Tech Founders and Revenue Leaders',
        client,
        geminiModel
      );
      res.json({ success: true, article });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to repurpose article' });
    }
  });

  // POST /api/workspace/agent-reach/repurpose-carousel
  router.post('/repurpose-carousel', expensiveLimiter, requireModule('content'), async (req: Request, res: Response) => {
    const { sourceUrl, topic } = req.body as { sourceUrl?: string; topic?: string };
    if (!sourceUrl || !sourceUrl.trim()) {
      res.status(400).json({ error: 'Source URL is required.' });
      return;
    }
    try {
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const carouselData = await repurposeToCarouselAndThread(sourceUrl.trim(), topic || 'B2B Tech Growth Infrastructure', client, geminiModel);
      res.json({ success: true, ...carouselData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to repurpose carousel' });
    }
  });

  return router;
}
