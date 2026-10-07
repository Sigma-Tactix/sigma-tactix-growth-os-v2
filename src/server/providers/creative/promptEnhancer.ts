import { GoogleGenAI } from '@google/genai';
import type { CreativeImageRequest, CreativeRuntimeContext, PromptEnhancerId } from './types.js';

const STYLE_GUIDANCE: Record<string, string> = {
  '3D_DATA_NEURAL': 'obsidian glass, restrained amber telemetry light, isometric depth, premium enterprise technology art direction',
  'CYBER_SCHEMATIC': 'precise architectural wireframe, blueprint grid, controlled cybernetic glow, technically credible detail',
  'MINIMAL_STUDIO': 'clean editorial studio lighting, macro material detail, muted slate palette, generous negative space',
  'CORPORATE_POLISHED': 'premium B2B editorial photography, executive visual language, polished but natural lighting',
};

function localBaseUrl(provider: 'ollama' | 'lmstudio'): string {
  const raw = provider === 'ollama'
    ? process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1'
    : process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error(`${provider} prompt enhancement is restricted to a loopback address`);
  }
  return raw.replace(/\/$/, '').replace(/\/v1$/, '') + '/v1';
}

async function firstLocalModel(provider: 'ollama' | 'lmstudio', baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/models`, { signal: AbortSignal.timeout(3_500) });
  if (!response.ok) throw new Error(`${provider} model discovery returned HTTP ${response.status}`);
  const data = await response.json() as { data?: { id?: string }[]; models?: { model?: string; name?: string }[] };
  const model = data.data?.[0]?.id || data.models?.[0]?.model || data.models?.[0]?.name;
  if (!model) throw new Error(`${provider} is running but has no loaded model`);
  return model;
}

function enhancementInstruction(req: CreativeImageRequest): string {
  return [
    'Rewrite the user input as one production-ready image-generation prompt.',
    'Preserve the intent and any exact quoted text. Add composition, subject hierarchy, camera, lighting, materials, color, and brand-safe detail.',
    'Do not add commentary, headings, markdown, or invented claims. Return only the enhanced prompt.',
    `Aspect ratio: ${req.aspectRatio || '16:9'}.`,
    `Art direction: ${req.styleGuidance || STYLE_GUIDANCE[req.stylePreset || ''] || 'premium, coherent commercial art direction'}.`,
    req.negativePrompt ? `Avoid: ${req.negativePrompt}.` : '',
    `User input: ${req.prompt}`,
  ].filter(Boolean).join('\n');
}

export async function enhanceCreativePrompt(
  req: CreativeImageRequest,
  context: CreativeRuntimeContext,
): Promise<{ prompt: string; provider: PromptEnhancerId; model?: string }> {
  const provider = req.enhancePrompt === false ? 'none' : (req.promptEnhancer || 'gemini');
  if (provider === 'none') return { prompt: req.prompt, provider };
  const instruction = enhancementInstruction(req);

  if (provider === 'gemini') {
    if (!context.geminiApiKey) throw new Error('Gemini prompt enhancement requires the workspace Gemini API key');
    const model = context.geminiTextModel || 'gemini-3.5-flash';
    const response = await new GoogleGenAI({
      apiKey: context.geminiApiKey,
      httpOptions: { timeout: 20_000 },
    }).models.generateContent({
      model,
      contents: instruction,
      config: { temperature: 0.35, maxOutputTokens: 700 },
    });
    const prompt = response.text?.trim();
    if (!prompt) throw new Error('Gemini prompt enhancement returned no text');
    return { prompt, provider, model };
  }

  const baseUrl = localBaseUrl(provider);
  const model = req.enhancerModel || await firstLocalModel(provider, baseUrl);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(provider === 'lmstudio' ? { Authorization: 'Bearer local' } : {}) },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: instruction }], temperature: 0.35 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${provider} prompt enhancement returned HTTP ${response.status}`);
  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const prompt = data.choices?.[0]?.message?.content?.trim();
  if (!prompt) throw new Error(`${provider} prompt enhancement returned no text`);
  return { prompt, provider, model };
}

export async function probeLocalPromptRuntime(provider: 'ollama' | 'lmstudio'): Promise<boolean> {
  try {
    await firstLocalModel(provider, localBaseUrl(provider));
    return true;
  } catch {
    return false;
  }
}
