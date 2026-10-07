import type { CreativeImageRequest, CreativeImageResponse } from './types.js';

type FetchLike = typeof fetch;

function assertLoopback(raw: string): string {
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('ComfyUI image rendering is restricted to this machine');
  }
  return raw.replace(/\/$/, '');
}

const DIMENSIONS: Record<string, [number, number]> = {
  '16:9': [1216, 704],
  '1:1': [1024, 1024],
  '9:16': [704, 1216],
  '4:5': [896, 1152],
};

export class ComfyUiImageAdapter {
  private readonly baseUrl: string;
  constructor(baseUrl = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188', private readonly fetchImpl: FetchLike = fetch) {
    this.baseUrl = assertLoopback(baseUrl);
  }

  async probe(): Promise<boolean> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/system_stats`, { signal: AbortSignal.timeout(1_500) });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkpoint(): Promise<string> {
    if (process.env.COMFYUI_CHECKPOINT) return process.env.COMFYUI_CHECKPOINT;
    const response = await this.fetchImpl(`${this.baseUrl}/object_info/CheckpointLoaderSimple`, { signal: AbortSignal.timeout(4_000) });
    if (!response.ok) throw new Error(`ComfyUI checkpoint discovery returned HTTP ${response.status}`);
    const info = await response.json() as any;
    const names = info?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
    if (!Array.isArray(names) || !names[0]) throw new Error('ComfyUI is running but no checkpoint is installed');
    return names[0];
  }

  private workflow(req: CreativeImageRequest, checkpoint: string, seed: number) {
    const [width, height] = DIMENSIONS[req.aspectRatio || '16:9'] || DIMENSIONS['16:9'];
    return {
      '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
      '2': { class_type: 'CLIPTextEncode', inputs: { text: req.prompt, clip: ['1', 1] } },
      '3': { class_type: 'CLIPTextEncode', inputs: { text: req.negativePrompt || 'watermark, blurry, distorted, low quality', clip: ['1', 1] } },
      '4': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
      '5': { class_type: 'KSampler', inputs: { seed, steps: 24, cfg: 6.5, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0] } },
      '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
      '7': { class_type: 'SaveImage', inputs: { filename_prefix: 'SigmaTactix', images: ['6', 0] } },
    };
  }

  async generateImage(req: CreativeImageRequest): Promise<CreativeImageResponse> {
    const checkpoint = await this.checkpoint();
    const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const queued = await this.fetchImpl(`${this.baseUrl}/prompt`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: this.workflow(req, checkpoint, seed), client_id: `sigma-${Date.now()}` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!queued.ok) throw new Error(`ComfyUI queue returned HTTP ${queued.status}: ${(await queued.text()).slice(0, 180)}`);
    const { prompt_id: promptId } = await queued.json() as { prompt_id?: string };
    if (!promptId) throw new Error('ComfyUI did not return a prompt id');

    const deadline = Date.now() + 180_000;
    let image: { filename: string; subfolder?: string; type?: string } | undefined;
    while (Date.now() < deadline) {
      const historyResponse = await this.fetchImpl(`${this.baseUrl}/history/${encodeURIComponent(promptId)}`, { signal: AbortSignal.timeout(5_000) });
      if (historyResponse.ok) {
        const history = await historyResponse.json() as any;
        const entry = history?.[promptId];
        image = Object.values(entry?.outputs || {}).flatMap((output: any) => output?.images || [])[0] as typeof image;
        if (image) break;
        if (entry?.status?.status_str === 'error') throw new Error('ComfyUI reported a workflow execution error');
      }
      await new Promise(resolve => setTimeout(resolve, 750));
    }
    if (!image) throw new Error('ComfyUI render timed out before an image was produced');

    const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
    const output = await this.fetchImpl(`${this.baseUrl}/view?${query}`, { signal: AbortSignal.timeout(15_000) });
    if (!output.ok) throw new Error(`ComfyUI image download returned HTTP ${output.status}`);
    const mime = output.headers.get('content-type') || 'image/png';
    const data = Buffer.from(await output.arrayBuffer()).toString('base64');
    return {
      imageUrl: `data:${mime};base64,${data}`,
      enhancedPrompt: req.prompt,
      aspectRatio: req.aspectRatio || '16:9', seed, provider: 'comfyui', modelName: checkpoint,
      source: 'provider_api', generatedAt: new Date().toISOString(), promptEnhancer: req.promptEnhancer || 'none',
    };
  }
}
