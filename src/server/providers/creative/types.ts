export type CreativeProviderId =
  | 'gemini'
  | 'huggingface'
  | 'cloudflare'
  | 'comfyui'
  | 'ollama'
  | 'lmstudio'
  | 'hyperframes';

export type PromptEnhancerId = 'none' | 'gemini' | 'ollama' | 'lmstudio';

export interface CreativeProviderStatus {
  provider: CreativeProviderId;
  name: string;
  configured: boolean;
  active: boolean;
  tier: 'usage_based' | 'free_serverless' | 'free_quota' | 'self_hosted' | 'local_renderer';
  supportedModals: ('image' | 'video' | 'motion' | 'prompt')[];
  description: string;
}

export interface CreativeImageRequest {
  prompt: string;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:5';
  stylePreset?: string;
  negativePrompt?: string;
  enhancePrompt?: boolean;
  promptEnhancer?: PromptEnhancerId;
  enhancerModel?: string;
  preferredProvider?: CreativeProviderId;
  modelId?: string;
  /** Server-derived Brand Vault art direction. Never accepted directly from the browser. */
  styleGuidance?: string;
}

export interface CreativeImageResponse {
  imageUrl: string;
  enhancedPrompt: string;
  aspectRatio: string;
  seed: number | null;
  provider: CreativeProviderId;
  modelName: string;
  source: 'provider_api';
  generatedAt: string;
  promptEnhancer: PromptEnhancerId;
}

export interface CreativeRuntimeContext {
  geminiApiKey?: string;
  geminiTextModel?: string;
}

export interface CreativeVideoRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  durationSeconds?: number;
  sourceImageUrl?: string;
  stylePreset?: string;
  motionIntensity?: 'subtle' | 'dynamic' | 'cinematic';
  preferredProvider?: CreativeProviderId;
  modelId?: string;
}

export interface CreativeVideoResponse {
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  provider: CreativeProviderId;
  modelName: string;
  source: 'provider_api' | 'deterministic_renderer';
  generatedAt: string;
}
