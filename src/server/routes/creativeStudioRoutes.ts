import { Router, type Request, type Response } from 'express';
import { creativeGateway } from '../providers/creative/creativeGateway.js';
import { generateFallbackSocialCampaignServer } from '../providers/creative/socialFallback.js';
import { buildBrandCreativeStylePresets } from '../../lib/brandCreativeStyles.js';
import { estimateTokens } from '../../lib/tokenCostEngine.js';

// ---------------------------------------------------------------------------
// Creative Studio — provider status, brand-style presets, and the four
// generation routes (image / video / social / text). Each route carries its
// OWN per-route requireAuth because this band registers OUTSIDE the
// /api/workspace prefix (before the global workspace auth mount), so auth is
// applied at the route, not the mount.
//
// Extracted from server.ts (P2 increment 20 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved. The creative
// gateway + the social-campaign fallback lib import directly. The in-file
// request-scoped helpers (getDB, the Gemini trio, recordTokenUsage,
// executeUniversalAICompletion) and requireAuth stay in server.ts and are
// INJECTED — all are hoisted function declarations, so the mount at the
// original position is safe even for executeUniversalAICompletion (declared
// later in server.ts). The honesty invariant is preserved: no browser-side
// provider fallback, and a still image is never labelled a video.
// ---------------------------------------------------------------------------

export interface CreativeStudioRouterDeps {
  getDB: (res: Response) => Promise<any>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  recordTokenUsage: (res: Response, params: any) => Promise<any>;
  executeUniversalAICompletion: (options: Record<string, any>) => Promise<any>;
  requireAuth: any;
}

export function createCreativeStudioRouter(deps: CreativeStudioRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    recordTokenUsage,
    executeUniversalAICompletion,
    requireAuth,
  } = deps;

// Creative Studio endpoints are authenticated. They never fall back to a
// browser-side provider or label a still image as a video.
router.get('/api/creative/providers/status', requireAuth, async (_req: Request, res: Response) => {
  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const providers = await creativeGateway.getProviderStatus({ geminiApiKey });
  res.json({ success: true, providers });
});

router.get('/api/creative/brand-style-presets', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDB(res);
  const presets = buildBrandCreativeStylePresets(db.secondBrain?.brandVault);
  res.json({ success: true, presets: presets.map(({ promptGuidance: _promptGuidance, ...preset }) => preset) });
});

router.post('/api/creative/generate-image', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    prompt,
    aspectRatio = '16:9',
    stylePreset = '3D_DATA_NEURAL',
    negativePrompt,
    enhancePrompt = true,
    promptEnhancer = 'gemini',
    enhancerModel,
    preferredProvider,
    modelId,
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  if (!['none', 'gemini', 'ollama', 'lmstudio'].includes(promptEnhancer)) {
    res.status(400).json({ error: 'promptEnhancer must be none, gemini, ollama, or lmstudio' });
    return;
  }

  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const db = await getDB(res);
  const brandStyles = buildBrandCreativeStylePresets(db.secondBrain?.brandVault);
  const selectedStyle = brandStyles.find(style => style.id === stylePreset) || brandStyles[0];
  let result;
  try {
    result = await creativeGateway.generateImage({
      prompt, aspectRatio, negativePrompt, enhancePrompt,
      promptEnhancer, enhancerModel, preferredProvider, modelId,
      stylePreset: selectedStyle.id,
      styleGuidance: selectedStyle.promptGuidance,
    }, {
      geminiApiKey,
      geminiTextModel: await resolveEffectiveGeminiModel(res),
    });
  } catch (error: any) {
    const message = String(error?.message || error || 'Image generation failed')
      .replace(/AIza[\w-]+/g, '[redacted]');
    res.status(502).json({ error: message.slice(0, 300) });
    return;
  }

  await recordTokenUsage(res, {
    actionType: "CREATIVE_IMAGE",
    provider: result.provider,
    modelName: result.modelName || "flux",
    usageMetadata: {
      promptTokenCount: estimateTokens(result.enhancedPrompt || prompt),
      candidatesTokenCount: 1000,
      totalTokenCount: estimateTokens(result.enhancedPrompt || prompt) + 1000,
    },
    durationMs: Date.now() - startTime,
    metadata: { prompt, aspectRatio, stylePreset, seed: result.seed, provider: result.provider, source: result.source },
  });

  res.json({
    success: true,
    imageUrl: result.imageUrl,
    enhancedPrompt: result.enhancedPrompt,
    aspectRatio: result.aspectRatio,
    seed: result.seed,
    provider: result.provider,
    modelName: result.modelName,
    source: result.source,
    promptEnhancer: result.promptEnhancer,
  });
});

router.post('/api/creative/generate-video', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { prompt, aspectRatio = '9:16', durationSeconds = 5, sourceImageUrl, stylePreset = '3D_DATA_NEURAL', preferredProvider, modelId } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: "Prompt is required for video generation" });
    return;
  }

  const result = await creativeGateway.generateVideo({
    prompt,
    aspectRatio,
    durationSeconds,
    sourceImageUrl,
    stylePreset,
    preferredProvider,
    modelId,
  });

  await recordTokenUsage(res, {
    actionType: "CREATIVE_VIDEO",
    provider: result.provider,
    modelName: result.modelName || "video-synthesis",
    usageMetadata: {
      promptTokenCount: estimateTokens(prompt),
      candidatesTokenCount: 3000,
      totalTokenCount: estimateTokens(prompt) + 3000,
    },
    durationMs: Date.now() - startTime,
    metadata: { prompt, aspectRatio, durationSeconds, provider: result.provider, source: result.source },
  });

  res.json({
    success: true,
    videoUrl: result.videoUrl,
    thumbnailUrl: result.thumbnailUrl,
    prompt: result.prompt,
    aspectRatio: result.aspectRatio,
    durationSeconds: result.durationSeconds,
    provider: result.provider,
    modelName: result.modelName,
    source: result.source,
  });
});

router.post('/api/creative/generate-social', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { channel = 'LinkedIn', topic, targetAudience, tone, preferredProvider } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const db = await getDB(res);
  const selectedProvider = preferredProvider || (db as any)?.agentAISelection?.provider;
  const selectedModel = (db as any)?.agentAISelection?.model;
  const brand = db.secondBrain?.brandVault;
  const audience = targetAudience || db.secondBrain?.customerVault?.idealCustomerProfile || 'B2B Tech Founders & Revenue Leaders';
  const toneDesc = tone || brand?.voiceAndTone || 'Authoritative, empirical, anti-slop, engineering-grade, zero buzzwords';
  const geminiApiKey = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
  const geminiModel = await resolveEffectiveGeminiModel(res);

  // Use the workspace's configured text model; image-model quota and text-model
  // quota are independent, so a hardcoded legacy model made this surface fail
  // even when VANTA and other configured Gemini text paths were healthy.
  let geminiPrompt = '';
  if (geminiApiKey) {
    try {
      const client = getGeminiClient(geminiApiKey);
      geminiPrompt = `
You are the Principal Creative Director and Viral Growth Architect for Sigma Tactix (Growth OS).
Generate a high-performing, empirical social campaign for:
Channel: ${channel}
Topic / Thesis: ${topic}
Target Audience: ${audience}
Tone: ${toneDesc}
Brand positioning: ${brand?.corePositioning || 'not configured'}
Brand slogan: ${brand?.brandSlogan || 'not configured'}
Key messages: ${(brand?.keyMessages || []).join(' | ') || 'not configured'}

STRICT CHANNEL OUTPUT SCHEMA (Return raw JSON only, no markdown backticks, no markdown fence):

${channel === 'LinkedIn' ? `
{
  "channel": "LinkedIn",
  "topic": "${topic}",
  "hook": "Two-line viral LinkedIn hook before the 'see more' fold",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "EXECUTIVE AUDIT",
      "title": "Clear punchy title",
      "subtitle": "Subtitle explaining what this slide proves",
      "contentPoints": [
        "First empirical insight",
        "Second concrete data point",
        "Third tactical takeaway"
      ],
      "takeaway": "Memorable one-sentence rule",
      "visualCue": "Obsidian card with glowing amber vector"
    }
  ],
  "hashtags": ["#B2BGrowth", "#GrowthOS", "#AIAgents", "#SigmaTactix"]
}
(Generate 6 to 8 slides in total: Slide 1 Cover, Slide 2 Hard Truth, Slide 3 The Leak, Slide 4 The Framework, Slide 5 Tactical Architecture, Slide 6 Case Proof, Slide 7 Sovereign System).
` : channel === 'Instagram' ? `
{
  "channel": "Instagram",
  "topic": "${topic}",
  "hook": "Punchy 1-line hook",
  "caption": "Full Instagram post caption with hook, bullet insights, questions for comments, and hashtags",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "GROWTH BLUEPRINT",
      "title": "Title",
      "subtitle": "Subtitle",
      "contentPoints": ["Point 1", "Point 2", "Point 3"],
      "takeaway": "Takeaway"
    }
  ],
  "hashtags": ["#GrowthOS", "#B2BMarketing", "#AIAgents", "#SigmaTactix"]
}
(Generate 5 to 7 visual carousel slide cards).
` : channel === 'YouTube_Shorts' ? `
{
  "channel": "YouTube_Shorts",
  "topic": "${topic}",
  "hook": "0-3s high-retention verbal pattern interrupt hook",
  "shortsScenes": [
    {
      "timeCode": "0:00 - 0:03",
      "visualDirection": "Camera and visual direction",
      "sfxCue": "Sound effect cue",
      "voiceover": "Word-for-word voiceover line",
      "screenText": "On-screen text overlay"
    },
    {
      "timeCode": "0:03 - 0:15",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:15 - 0:35",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:35 - 0:50",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    },
    {
      "timeCode": "0:50 - 1:00",
      "visualDirection": "Visual cue",
      "sfxCue": "SFX cue",
      "voiceover": "Voiceover line",
      "screenText": "On-screen text"
    }
  ],
  "loopCta": "High-converting CTA looping back to video hook",
  "hashtags": ["#Shorts", "#GrowthHacking", "#AIAgents", "#SigmaTactix"]
}
` : `
{
  "channel": "X_Thread",
  "topic": "${topic}",
  "hook": "Viral opening hook tweet",
  "threadTweets": [
    {
      "tweetNumber": 1,
      "text": "Tweet text under 275 chars with 🧵👇 hook",
      "charCount": 210
    }
  ],
  "hashtags": ["#GrowthOS", "#B2BTech", "#AIAgents"]
}
(Generate exactly 7 tweets from 1 to 7, each under 275 characters).
`}
`;
      if (selectedProvider === 'opusmax') {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: selectedModel || 'claude-opus-5-5',
            systemPrompt: 'You are a specialized social media JSON generator for Growth OS. You must output strictly valid JSON only. Properly escape any quotation marks inside strings. Do not output markdown code fences or conversational commentary.',
            prompt: `${geminiPrompt}\n\nIMPORTANT: Return valid RFC 8259 JSON only. Escape all quotation marks inside string values with \\".`,
          });
          const rawText = omResult.text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            parsed = JSON.parse(cleanJson.replace(/[\u0000-\u001F]+/g, ' '));
          }
          await recordTokenUsage(res, {
            actionType: "CREATIVE_SOCIAL",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: geminiPrompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { channel, topic }
          });
          res.json({ success: true, result: parsed, source: 'opusmax' });
          return;
        } catch (omErr: any) {
          console.warn("OpusMax direct social generation failed, falling back to Gemini:", omErr.message);
        }
      }

      const response = await Promise.race([
        client.models.generateContent({
          model: geminiModel,
          contents: geminiPrompt,
          config: { responseMimeType: 'application/json', temperature: 0.55, maxOutputTokens: 2800 },
        }),
        new Promise<never>((_, reject) => setTimeout(
          () => reject(new Error('Gemini social generation timed out after 50 seconds.')),
          50_000,
        )),
      ]);

      const raw = response.text || "{}";
      const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      await recordTokenUsage(res, {
        actionType: "CREATIVE_SOCIAL",
        modelName: geminiModel,
        usageMetadata: (response as any).usageMetadata,
        promptText: geminiPrompt,
        responseText: raw,
        durationMs: Date.now() - startTime,
        metadata: { channel, topic }
      });

      res.json({ success: true, result: parsed, source: 'gemini' });
      return;
    } catch (err: any) {
      const detail = String(err?.message || err || 'Unknown provider error')
        .replace(/AIza[\w-]+/g, '[redacted]')
        .replace(/\s+/g, ' ')
        .slice(0, 260);
      console.warn("Live Gemini social generation failed, trying OpusMax fallback:", detail);
      if (process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: 'claude-opus-5-5',
            systemPrompt: 'You are a specialized social media JSON generator for Growth OS. You must output strictly valid JSON only. Properly escape any quotation marks inside strings. Do not output markdown code fences or conversational commentary.',
            prompt: `${geminiPrompt}\n\nIMPORTANT: Return valid RFC 8259 JSON only. Escape all quotation marks inside string values with \\".`,
          });
          const rawText = omResult.text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            parsed = JSON.parse(cleanJson.replace(/[\u0000-\u001F]+/g, ' '));
          }
          await recordTokenUsage(res, {
            actionType: "CREATIVE_SOCIAL",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: geminiPrompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { channel, topic, fallbackFrom: 'gemini' }
          });
          res.json({ success: true, result: parsed, source: 'opusmax' });
          return;
        } catch (omSocialErr: any) {
          console.warn("OpusMax social fallback failed, using local template fallback:", omSocialErr.message);
        }
      }
      const fallbackResult = generateFallbackSocialCampaignServer({
        channel: channel as any,
        topic,
        targetAudience: audience
      });
      res.json({ success: true, result: fallbackResult, source: 'local-template' });
      return;
    }
  }

  const fallbackResult = generateFallbackSocialCampaignServer({
    channel: channel as any,
    topic,
    targetAudience: audience
  });
  res.json({ success: true, result: fallbackResult, source: 'local-template' });
  return;
});

router.post('/api/creative/generate-text', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { topic, format = 'LONG_FORM', targetAudience, antiSlop = true, preferredProvider } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const audience = targetAudience || 'B2B Tech Founders & Revenue Leaders';
  const prompt = `
You are the Head Technical Copywriter for Sigma Tactix (Growth OS).
Write an empirical, deeply insightful ${format} piece.
Topic: ${topic}
Target Audience: ${audience}
Anti-Slop Guardrail: ${antiSlop ? 'ACTIVE — strictly ban buzzwords: supercharge, empower, seamless, revolutionize, delve, testament. Use concrete engineering metaphors, unit economics, and architectural frameworks.' : 'STANDARD'}

Format: Write directly in clear GitHub markdown with headers, bullet points, and actionable takeaways.
`;

  const db = await getDB(res).catch(() => null);
  const selectedProvider = preferredProvider || (db as any)?.agentAISelection?.provider;
  const selectedModel = (db as any)?.agentAISelection?.model;

  // 1. Try OpusMax if selected or preferred
  if (selectedProvider === 'opusmax' || (process.env.OPUSMAX_API_KEY && !process.env.GEMINI_API_KEY)) {
    try {
      const omResult = await executeUniversalAICompletion({
        provider: 'opusmax',
        model: selectedModel || 'claude-opus-5-5',
        prompt,
      });

      await recordTokenUsage(res, {
        actionType: "CREATIVE_TEXT",
        provider: "opusmax",
        modelName: omResult.model,
        usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
        promptText: prompt,
        responseText: omResult.text,
        durationMs: omResult.durationMs,
        metadata: { topic, format, audience }
      });

      res.json({
        success: true,
        content: omResult.text,
        title: topic,
        format,
        audience,
        engine: "opusmax",
        model: omResult.model
      });
      return;
    } catch (omErr: any) {
      console.warn("OpusMax direct text generation failed, trying Gemini:", omErr.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      await recordTokenUsage(res, {
        actionType: "CREATIVE_TEXT",
        modelName: "gemini-2.5-flash",
        usageMetadata: (response as any).usageMetadata,
        promptText: prompt,
        responseText: response.text,
        durationMs: Date.now() - startTime,
        metadata: { topic, format, audience }
      });

      res.json({
        success: true,
        content: response.text,
        title: topic,
        format,
        audience,
        engine: "gemini"
      });
      return;
    } catch (err: any) {
      console.warn("Live Gemini text generation failed, using OpusMax fallback:", err.message);
      if (process.env.OPUSMAX_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
        try {
          const omResult = await executeUniversalAICompletion({
            provider: 'opusmax',
            model: 'claude-opus-5-5',
            prompt,
          });

          await recordTokenUsage(res, {
            actionType: "CREATIVE_TEXT",
            provider: "opusmax",
            modelName: omResult.model,
            usageMetadata: { promptTokenCount: omResult.promptTokens, candidatesTokenCount: omResult.candidateTokens, totalTokenCount: omResult.totalTokens },
            promptText: prompt,
            responseText: omResult.text,
            durationMs: omResult.durationMs,
            metadata: { topic, format, audience, fallbackFrom: "gemini" }
          });

          res.json({
            success: true,
            content: omResult.text,
            title: topic,
            format,
            audience,
            engine: "opusmax",
            model: omResult.model
          });
          return;
        } catch (omFallbackErr: any) {
          console.warn("OpusMax fallback also failed:", omFallbackErr.message);
        }
      }
    }
  }

  // Fallback text
  res.json({
    success: true,
    content: `# ${topic}

When modern B2B tech organizations contract an external marketing agency, they believe they are purchasing execution velocity. In reality, they are entering a negative-compounding lease on temporary human headcount.

## The Three Structural Defects of Rented Headcount

1. **Context Evaporation**: Junior associates rotate every 9 months, wiping out positioning nuance and historical objection handling.
2. **Attribution Opacity**: Static slide decks celebrate vanity impressions while qualified pipeline velocity remains stagnant.
3. **Zero Asset Equity**: When the contract terminates, the company retains zero algorithmic code, zero institutional memory, and zero self-driving systems.

## The Sovereign Alternative: Client-Owned Second Brain

By deploying an AI-native growth infrastructure directly into your cloud, your business develops permanent institutional memory. Scoped agent swarms diagnose revenue leaks, construct topical authority, and reallocate media spend under strict Human-in-the-Loop guardrails.

The future belongs to founders who own their intelligence engine rather than rent it.`,
    title: topic,
    format,
    audience,
    engine: "local-template"
  });
});

  return router;
}
