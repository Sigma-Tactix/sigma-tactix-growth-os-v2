import { inspectGeneratedImage } from './imageBytes.js';
import { GoogleGenAI } from '@google/genai';
import type { CreativeImageRequest, CreativeImageResponse } from './types.js';

type GeminiClient = Pick<GoogleGenAI, 'interactions'>;

export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-nano-banana-2.1';

export class GeminiImageAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly clientFactory: (key: string) => GeminiClient = key => new GoogleGenAI({
      apiKey: key,
      httpOptions: { timeout: 35_000 },
    }),
  ) {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 10;
  }

  async generateImage(req: CreativeImageRequest): Promise<CreativeImageResponse> {
    if (!this.isConfigured()) throw new Error('A workspace Gemini API key is not configured');

    const model = req.modelId?.startsWith('gemini-') ? req.modelId : DEFAULT_GEMINI_IMAGE_MODEL;
    const interaction = await this.clientFactory(this.apiKey).interactions.create({
      model,
      input: req.prompt,
      response_format: {
        type: 'image',
        mime_type: 'image/jpeg',
        aspect_ratio: req.aspectRatio || '16:9',
      },
    });
    const image = interaction.output_image;
    if (!image?.data) throw new Error('Gemini completed the request without returning an image');

    const bytes = Buffer.from(image.data, 'base64');
    const inspected = inspectGeneratedImage(bytes);
    return {
      imageUrl: `data:${inspected.mimeType};base64,${bytes.toString('base64')}`,
      enhancedPrompt: req.prompt,
      aspectRatio: inspected.aspectRatio,
      seed: null,
      provider: 'gemini',
      modelName: model,
      source: 'provider_api',
      generatedAt: new Date().toISOString(),
      promptEnhancer: req.promptEnhancer || 'none',
    };
  }
}
