import { HuggingFaceCreativeAdapter } from './huggingFaceAdapter.js';
import { CloudflareCreativeAdapter } from './cloudflareAdapter.js';
import { hyperframesRenderer } from './hyperframesRenderer.js';
import { GeminiImageAdapter } from './geminiImageAdapter.js';
import { ComfyUiImageAdapter } from './comfyUiAdapter.js';
import { enhanceCreativePrompt, probeLocalPromptRuntime } from './promptEnhancer.js';
import type {
  CreativeImageRequest,
  CreativeImageResponse,
  CreativeVideoRequest,
  CreativeVideoResponse,
  CreativeProviderStatus,
  CreativeRuntimeContext,
} from './types.js';

export class CreativeGateway {
  private readonly huggingFace: HuggingFaceCreativeAdapter;
  private readonly cloudflare: CloudflareCreativeAdapter;
  private readonly comfyui: ComfyUiImageAdapter;

  constructor() {
    this.huggingFace = new HuggingFaceCreativeAdapter();
    this.cloudflare = new CloudflareCreativeAdapter();
    this.comfyui = new ComfyUiImageAdapter();
  }

  async getProviderStatus(context: CreativeRuntimeContext = {}): Promise<CreativeProviderStatus[]> {
    const hfConfigured = this.huggingFace.isConfigured();
    const cfConfigured = this.cloudflare.isConfigured();
    const [comfyReady, ollamaReady, lmstudioReady] = await Promise.all([
      this.comfyui.probe(),
      probeLocalPromptRuntime('ollama'),
      probeLocalPromptRuntime('lmstudio'),
    ]);
    return [
      {
        provider: 'gemini',
        name: 'Gemini images',
        configured: Boolean(context.geminiApiKey),
        active: false,
        tier: 'usage_based',
        supportedModals: ['image', 'prompt'],
        description: context.geminiApiKey
          ? 'Workspace Gemini credential is configured. Provider access is verified by each generation request.'
          : 'Configure a Gemini API key in Admin > AI Model Config.',
      },
      {
        provider: 'huggingface',
        name: 'Hugging Face Inference (FLUX.1-schnell & SDXL)',
        configured: hfConfigured,
        active: false,
        tier: 'usage_based',
        supportedModals: ['image', 'video'],
        description: hfConfigured
          ? 'Credential configured. Generation has not been verified.'
          : 'Connect Hugging Face with provider credits to generate images.',
      },
      {
        provider: 'cloudflare',
        name: 'Cloudflare images',
        configured: cfConfigured,
        active: false,
        tier: 'free_quota',
        supportedModals: ['image'],
        description: cfConfigured
          ? 'Credential configured. Generation has not been verified.'
          : 'Set CLOUDFLARE_API_TOKEN & CLOUDFLARE_ACCOUNT_ID for edge-accelerated FLUX rendering.',
      },
      {
        provider: 'comfyui',
        name: 'ComfyUI local diffusion',
        configured: comfyReady,
        active: comfyReady,
        tier: 'self_hosted',
        supportedModals: ['image'],
        description: comfyReady
          ? 'Verified local ComfyUI API with at least one reachable runtime.'
          : 'Start ComfyUI locally on port 8188 and install a checkpoint. Growth OS will discover the first checkpoint automatically.',
      },
      {
        provider: 'ollama', name: 'Ollama prompt enhancer', configured: ollamaReady, active: ollamaReady,
        tier: 'self_hosted', supportedModals: ['prompt'],
        description: ollamaReady ? 'Verified local Ollama model available for prompt enhancement.' : 'Ollama is installed but no local server/model is currently reachable.',
      },
      {
        provider: 'lmstudio', name: 'LM Studio prompt enhancer', configured: lmstudioReady, active: lmstudioReady,
        tier: 'self_hosted', supportedModals: ['prompt'],
        description: lmstudioReady ? 'Verified LM Studio local server with a loaded model.' : 'Start the LM Studio local server and load a model to enable prompt enhancement.',
      },
      {
        provider: 'hyperframes',
        name: 'HyperFrames deterministic motion renderer',
        configured: hyperframesRenderer.isInstalled(),
        active: hyperframesRenderer.isReady(),
        tier: 'local_renderer',
        supportedModals: ['video', 'motion'],
        description: hyperframesRenderer.statusMessage(),
      },
    ];
  }

  async generateImage(req: CreativeImageRequest, context: CreativeRuntimeContext = {}): Promise<CreativeImageResponse> {
    const enhanced = await enhanceCreativePrompt(req, context);
    const effectiveRequest: CreativeImageRequest = {
      ...req,
      prompt: enhanced.prompt,
      promptEnhancer: enhanced.provider,
    };

    if ((req.preferredProvider === 'gemini' || (!req.preferredProvider && context.geminiApiKey)) && context.geminiApiKey) {
      const result = await new GeminiImageAdapter(context.geminiApiKey).generateImage(effectiveRequest);
      return { ...result, enhancedPrompt: enhanced.prompt, promptEnhancer: enhanced.provider };
    }

    if (req.preferredProvider === 'comfyui') {
      if (!(await this.comfyui.probe())) throw new Error('ComfyUI is not reachable on this machine');
      const result = await this.comfyui.generateImage(effectiveRequest);
      return { ...result, enhancedPrompt: enhanced.prompt, promptEnhancer: enhanced.provider };
    }

    // A requested provider must be both implemented and configured. We do not
    // silently redirect creative work to an ungoverned third-party fallback.
    if ((req.preferredProvider === 'huggingface' || (!req.preferredProvider && this.huggingFace.isConfigured())) && this.huggingFace.isConfigured()) {
      try {
        const result = await this.huggingFace.generateImage(effectiveRequest);
        return { ...result, enhancedPrompt: enhanced.prompt, promptEnhancer: enhanced.provider };
      } catch (err) { throw err; }
    }

    // 2. If Cloudflare is requested or preferred and configured
    if ((req.preferredProvider === 'cloudflare' || (!req.preferredProvider && this.cloudflare.isConfigured())) && this.cloudflare.isConfigured()) {
      try {
        const result = await this.cloudflare.generateImage(effectiveRequest);
        return { ...result, enhancedPrompt: enhanced.prompt, promptEnhancer: enhanced.provider };
      } catch (err) { throw err; }
    }
    throw new Error('No verified image provider is available. Configure Gemini, Hugging Face, Cloudflare, or start local ComfyUI.');
  }

  async generateVideo(req: CreativeVideoRequest): Promise<CreativeVideoResponse> {
    // Generative video is available only from a configured provider. A still
    // image is never returned in the video field as a disguised fallback.
    if (this.huggingFace.isConfigured()) {
      return this.huggingFace.generateVideo(req);
    }
    throw new Error('No verified generative-video provider is configured. Use an approved HyperFrames render for deterministic motion, or configure a video provider.');
  }
}

export const creativeGateway = new CreativeGateway();
