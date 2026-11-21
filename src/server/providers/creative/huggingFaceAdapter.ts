import { inspectGeneratedImage } from './imageBytes.js';
import type {
  CreativeImageRequest,
  CreativeImageResponse,
  CreativeVideoRequest,
  CreativeVideoResponse,
} from './types.js';

export class HuggingFaceCreativeAdapter {
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(apiKey?: string, timeoutMs: number = 25_000) {
    this.apiKey = (apiKey || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '').trim();
    this.timeoutMs = timeoutMs;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generateImage(req: CreativeImageRequest): Promise<CreativeImageResponse> {
    if (!this.isConfigured()) {
      throw new Error('Hugging Face API token (HF_TOKEN) is not configured');
    }

    const modelId = req.modelId || 'black-forest-labs/FLUX.1-schnell';
    const endpoint = `https://router.huggingface.co/hf-inference/models/${modelId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'image/jpeg, image/png, application/json',
        },
        body: JSON.stringify({
          inputs: req.prompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 4,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HF Inference returned HTTP ${response.status}.`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) throw new Error('Hugging Face returned no image.');
      const bytes = Buffer.from(await response.arrayBuffer());
      const inspected = inspectGeneratedImage(bytes);
      const dataUrl = `data:${inspected.mimeType};base64,${bytes.toString('base64')}`;

      return {
        imageUrl: dataUrl,
        enhancedPrompt: req.prompt,
        aspectRatio: inspected.aspectRatio,
        seed: null,
        provider: 'huggingface',
        modelName: modelId,
        source: 'provider_api',
        generatedAt: new Date().toISOString(),
        promptEnhancer: req.promptEnhancer || 'none',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateVideo(req: CreativeVideoRequest): Promise<CreativeVideoResponse> {
    if (!this.isConfigured()) {
      throw new Error('Hugging Face API token (HF_TOKEN) is not configured');
    }

    const modelId = req.modelId || 'damo-vilab/modelscope-damo-text-to-video-synthesis';
    const endpoint = `https://router.huggingface.co/hf-inference/models/${modelId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000); // Video requires higher timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: req.prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown HF video error');
        throw new Error(`HF Video Inference failed with status ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mime = contentType.includes('mp4') ? 'video/mp4' : 'video/webm';
      const videoUrl = `data:${mime};base64,${base64}`;

      return {
        videoUrl,
        thumbnailUrl: req.sourceImageUrl || '',
        prompt: req.prompt,
        aspectRatio: req.aspectRatio || '9:16',
        durationSeconds: req.durationSeconds || 5,
        provider: 'huggingface',
        modelName: modelId,
        source: 'provider_api',
        generatedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
