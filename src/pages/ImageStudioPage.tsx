import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Wand2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Maximize2, 
  Layers, 
  Eye, 
  ExternalLink,
  Cpu,
  Palette,
  Ratio,
  ShieldCheck,
  History,
  Video,
  Play,
  Zap,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import {
  generateCreativeImage,
  generateCreativeVideo,
  getCreativeProvidersStatus,
  getBrandCreativeStylePresets,
  type BrandCreativeStylePreset,
  type CreativeProviderStatus
} from '@/src/lib/creativeApi';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge } from '@/src/components/ui';

interface ModelOption {
  id: string;
  providerId: 'gemini' | 'huggingface' | 'cloudflare' | 'comfyui';
  name: string;
  provider: string;
  badge: string;
  strengths: string;
}

const AI_IMAGE_MODELS: ModelOption[] = [
  {
    id: 'gemini-nano-banana-2.1',
    providerId: 'gemini',
    name: 'Gemini Nano Banana 2.1',
    provider: 'Google Gemini',
    badge: 'Recommended',
    strengths: 'Fast native image generation, text rendering, brand-safe commercial art direction.'
  },
  {
    id: 'gemini-3-pro-image',
    providerId: 'gemini',
    name: 'Gemini 3 Pro Image',
    provider: 'Google Gemini',
    badge: 'Highest Fidelity',
    strengths: 'Complex compositions, accurate brand consistency, localization, and precision control.'
  },
  {
    id: 'gemini-2.5-flash-image',
    providerId: 'gemini',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google Gemini',
    badge: 'Compatibility',
    strengths: 'Legacy Nano Banana image endpoint for keys that do not yet have newer image-model quota.'
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    providerId: 'huggingface',
    name: 'FLUX.1 Schnell',
    provider: 'Hugging Face / Black Forest',
    badge: 'Open Serverless Ready',
    strengths: 'Highest typography fidelity, complex prompt adherence, photorealism.'
  },
  {
    id: '@cf/black-forest-labs/flux-1-schnell',
    providerId: 'cloudflare',
    name: 'Cloudflare Workers AI FLUX',
    provider: 'Cloudflare Edge',
    badge: '10K Neurons/Day',
    strengths: 'Fast edge synthesis, zero cold starts, resilient B2B graphics.'
  },
  {
    id: 'comfyui-local-workflow',
    providerId: 'comfyui',
    name: 'Local ComfyUI Workflow',
    provider: 'This Mac',
    badge: 'Private / Local',
    strengths: 'Runs a discovered local checkpoint through a governed API workflow; no prompt leaves this machine.'
  }
];

const FALLBACK_STYLE_PRESETS: BrandCreativeStylePreset[] = [
  {
    id: 'SIGMA_SIGNAL_CORE',
    label: 'Sigma Signal Core',
    desc: 'Obsidian space and controlled Sigma orange signal light.',
    source: 'sigma_default',
  },
  {
    id: 'EVIDENCE_SYSTEM',
    label: 'Evidence System',
    desc: 'Proof-led visuals with measured diagrams and restraint.',
    source: 'sigma_default',
  },
  {
    id: 'EXECUTIVE_EDITORIAL',
    label: 'Executive Editorial',
    desc: 'Premium B2B storytelling for decision-makers.',
    source: 'sigma_default',
  },
  {
    id: 'MOTION_STORYBOARD',
    label: 'Motion Storyboard',
    desc: 'Three-scene visual direction for short-form motion.',
    source: 'sigma_default',
  }
];

export default function ImageStudioPage() {
  const { notifySuccess, notifyError } = useToast();
  const [studioMode, setStudioMode] = useState<'image' | 'video'>('image');
  const [providers, setProviders] = useState<CreativeProviderStatus[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-nano-banana-2.1');
  const [prompt, setPrompt] = useState<string>(
    'Enterprise Second Brain data core with 10 glowing permissioned vaults in obsidian space, metallic amber accents, 8k resolution, cinematic lighting'
  );
  const [negativePrompt, setNegativePrompt] = useState<string>('cartoon, blurry, low resolution, watermark, deformed, messy text');
  const [ratio, setRatio] = useState<'16:9' | '1:1' | '9:16' | '4:5'>('16:9');
  const [stylePresets, setStylePresets] = useState<BrandCreativeStylePreset[]>(FALLBACK_STYLE_PRESETS);
  const [stylePreset, setStylePreset] = useState<string>('SIGMA_SIGNAL_CORE');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [promptEnhancer, setPromptEnhancer] = useState<'none' | 'gemini' | 'ollama' | 'lmstudio'>('gemini');
  const [lastEnhancedPrompt, setLastEnhancedPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [renderFailure, setRenderFailure] = useState('');

  // Load live provider status on mount
  useEffect(() => {
    let mounted = true;
    getCreativeProvidersStatus().then(res => {
      if (mounted && res) {
        setProviders(res);
        const current = AI_IMAGE_MODELS.find(model => model.id === selectedModel);
        const currentStatus = res.find(provider => provider.provider === current?.providerId);
        const currentAvailable = currentStatus && (currentStatus.active || (currentStatus.provider === 'gemini' && currentStatus.configured));
        if (!currentAvailable) {
          const available = AI_IMAGE_MODELS.find(model => {
            const status = res.find(provider => provider.provider === model.providerId);
            return Boolean(status && (status.active || (status.provider === 'gemini' && status.configured)));
          });
          if (available) setSelectedModel(available.id);
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    getBrandCreativeStylePresets()
      .then(presets => {
        if (!mounted || presets.length === 0) return;
        setStylePresets(presets);
        setStylePreset(current => presets.some(preset => preset.id === current) ? current : presets[0].id);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  // Gallery History
  const [gallery, setGallery] = useState<Array<{ url: string; prompt: string; model: string; ratio: string; style: string; type: string }>>([]);

  // Agent Run Results
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      notifyError('Prompt Required', 'Please enter a visual description prompt.');
      return;
    }

    setIsGenerating(true);
    setRenderFailure('');
    try {
      const activeModelObj = AI_IMAGE_MODELS.find(m => m.id === selectedModel);

      if (studioMode === 'video') {
        // Video / Motion Generation
        const videoRatio = ratio === '4:5' ? '9:16' : ratio;
        const result = await generateCreativeVideo({
          prompt,
          aspectRatio: videoRatio as '9:16' | '16:9' | '1:1',
          durationSeconds: videoDuration,
          stylePreset,
        });

        setCurrentVideoUrl(result.videoUrl);
        setCurrentImageUrl(result.thumbnailUrl || result.videoUrl);

        const newGalleryItem = {
          url: result.thumbnailUrl || result.videoUrl,
          prompt,
          model: `Motion Video (${result.provider})`,
          ratio: videoRatio,
          style: stylePresets.find(s => s.id === stylePreset)?.label || stylePreset,
          type: 'video'
        };
        setGallery(prev => [newGalleryItem, ...prev]);

        const newRun: AgentRunRecord = {
          id: `run-vid-${Date.now()}`,
          agentName: 'Creative Motion Agent',
          agentRole: 'B2B High-Retention Video Synthesizer',
          timestamp: 'Just now',
          status: 'SUCCESS',
          moduleOrigin: 'AI Creative Motion Studio',
          inputSummary: `Video (${videoDuration}s): ${prompt.slice(0, 70)}...`,
          outputSummary: `Synthesized ${videoRatio} motion video (${videoDuration}s) via ${result.provider}.`,
          imageUrl: result.thumbnailUrl,
          fullOutput: `Provider: ${result.provider}\nRatio: ${videoRatio}\nDuration: ${videoDuration}s\nSource: ${result.source}\nVideo URL: ${result.videoUrl}`,
          metrics: [
            { label: 'Type', value: 'Motion Video' },
            { label: 'Duration', value: `${videoDuration}s` },
            { label: 'Provider', value: result.provider }
          ]
        };
        setRunHistory(prev => [newRun, ...prev]);
        notifySuccess('Motion Video Synthesized', `Rendered ${videoDuration}s dynamic clip via ${result.provider}.`);
      } else {
        // Static Image Generation
        const result = await generateCreativeImage({
          prompt,
          aspectRatio: ratio,
          stylePreset,
          negativePrompt,
          enhancePrompt,
          promptEnhancer: enhancePrompt ? promptEnhancer : 'none',
          preferredProvider: activeModelObj?.providerId,
          modelId: selectedModel
        });

        setCurrentImageUrl(result.imageUrl);
        setLastEnhancedPrompt(result.enhancedPrompt || prompt);

        const newGalleryItem = {
          url: result.imageUrl,
          prompt,
          model: activeModelObj?.name || selectedModel,
          ratio,
          style: stylePresets.find(s => s.id === stylePreset)?.label || stylePreset,
          type: 'image'
        };
        setGallery(prev => [newGalleryItem, ...prev]);

        const newRun: AgentRunRecord = {
          id: `run-img-${Date.now()}`,
          agentName: 'Creative Vision Agent',
          agentRole: 'High-Fidelity Visual Asset Synthesizer',
          timestamp: 'Just now',
          status: 'SUCCESS',
          moduleOrigin: 'AI Creative Image Studio',
          inputSummary: `${activeModelObj?.name}: ${prompt.slice(0, 70)}...`,
          outputSummary: `Rendered ${ratio} visual asset using ${stylePreset} preset.`,
          imageUrl: result.imageUrl,
          fullOutput: `Model: ${activeModelObj?.name}\nRatio: ${ratio}\nStyle: ${stylePreset}\nEnhanced: ${result.enhancedPrompt || 'None'}\nURL: ${result.imageUrl}`,
          metrics: [
            { label: 'Model', value: activeModelObj?.name || 'Flux 1.1' },
            { label: 'Ratio', value: ratio },
            { label: 'Provider', value: result.provider }
          ]
        };

        setRunHistory(prev => [newRun, ...prev]);
        notifySuccess('Visual Synthesized', `Generated via verified provider ${result.provider}.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate visual asset.';
      setRenderFailure(message);
      notifyError('Generation Error', message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = () => {
    const targetUrl = studioMode === 'video' && currentVideoUrl ? currentVideoUrl : currentImageUrl;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    notifySuccess('URL Copied', 'Asset URL copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">MULTI-PROVIDER SYNTHESIS</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ImageIcon className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              AI Creative Image & Motion Studio
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Synthesize production-grade creative visuals, high-retention video shorts, and ad assets across Hugging Face, Cloudflare Workers AI, and neural diffusion backends.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setStudioMode('image');
                if (ratio === '9:16') setRatio('16:9');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                studioMode === 'image'
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Static Graphic
            </button>
            <button
              onClick={() => {
                setStudioMode('video');
                setRatio('9:16');
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                studioMode === 'video'
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Video className="w-3.5 h-3.5 text-amber-300" /> Motion Video (9:16)
            </button>
          </div>
        </div>

        {/* Live Provider Status Ribbon */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5 font-medium mr-1">
            <Server className="w-3.5 h-3.5 text-zinc-400" /> Active Gateways:
          </span>
          {providers.length > 0 ? (
            providers.map(p => (
              <span
                key={p.provider}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 border",
                  p.active
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : p.configured
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-white/5 text-zinc-400 border-white/10"
                )}
                title={p.description}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", p.active ? "bg-emerald-400" : "bg-zinc-500")} />
                {p.name.split(' (')[0]}
                {p.active ? ' (Ready)' : p.configured ? ' (Configured)' : p.provider === 'ollama' || p.provider === 'lmstudio' || p.provider === 'comfyui' ? ' (Not running)' : ' (Not configured)'}
              </span>
            ))
          ) : (
            <span className="text-zinc-400 font-mono text-[11px]">Loading creative provider mesh...</span>
          )}
        </div>
      </GlassCard>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Model Selection & Prompt Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Model Selection */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Select AI Generation Model
              </h3>
              <span className="text-[11px] text-purple-400 font-medium">2026 Multi-Model Stack</span>
            </div>

            <div className="space-y-2">
              {AI_IMAGE_MODELS.map(model => {
                const status = providers.find(provider => provider.provider === model.providerId);
                const available = Boolean(status && (status.active || (model.providerId === 'gemini' && status.configured)));
                return <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  disabled={!available}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between",
                    selectedModel === model.id
                      ? "bg-purple-500/10 border-purple-500/50 text-white shadow-md shadow-purple-500/5"
                      : available
                        ? "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                        : "bg-white/[0.01] border-white/5 text-slate-600 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{model.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{model.strengths}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 shrink-0 ml-2">
                    {available ? model.badge : model.providerId === 'comfyui' ? 'Start local runtime' : 'Unavailable'}
                  </span>
                </button>
              })}
            </div>
          </div>

          {/* Aspect Ratio & Style Presets */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Ratio className="w-4 h-4 text-purple-400" />
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['16:9', '1:1', '9:16', '4:5'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors",
                      ratio === r
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Style Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {stylePresets.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setStylePreset(style.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      stylePreset === style.id
                        ? "bg-purple-500/10 border-purple-500/40 text-white"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                    )}
                  >
                    <div className="text-xs font-semibold text-slate-200">{style.label}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{style.desc}</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {stylePresets[0]?.source === 'brand_vault' ? 'Suggested from this workspace Brand Vault.' : 'Brand Vault is incomplete; showing Sigma baseline styles.'}
              </p>
            </div>
          </div>          {/* Prompt Editor & Generation Triggers */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            {studioMode === 'video' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Video Clip Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setVideoDuration(sec)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all",
                        videoDuration === sec
                          ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      {sec} Seconds
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {studioMode === 'video' ? 'Video Motion & Scene Prompt' : 'Creative Visual Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder={studioMode === 'video' ? "Describe camera motion, speed, subject action, and cinematic visual..." : "Describe your desired marketing graphic in vivid detail..."}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none font-sans"
              />
            </div>

            {studioMode === 'image' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Negative Prompt (What to Avoid)</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={e => setNegativePrompt(e.target.value)}
                  placeholder="watermark, blurry, distorted..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                />
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                  <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-purple-400" /> Enhance prompt before rendering</span>
                    <input type="checkbox" checked={enhancePrompt} onChange={event => setEnhancePrompt(event.target.checked)} className="accent-purple-500" />
                  </label>
                  {enhancePrompt && (
                    <select
                      aria-label="Prompt enhancer"
                      value={promptEnhancer}
                      onChange={event => setPromptEnhancer(event.target.value as typeof promptEnhancer)}
                      className="w-full px-3 py-2 rounded-lg bg-[#111116] border border-white/10 text-xs text-slate-200"
                    >
                      <option value="gemini" disabled={!providers.some(p => p.provider === 'gemini' && p.configured)}>Gemini — workspace key</option>
                      <option value="ollama" disabled={!providers.some(p => p.provider === 'ollama' && p.active)}>Ollama — local model</option>
                      <option value="lmstudio" disabled={!providers.some(p => p.provider === 'lmstudio' && p.active)}>LM Studio — local model</option>
                      <option value="none">No enhancement</option>
                    </select>
                  )}
                  <p className="text-[11px] text-slate-500">Ollama and LM Studio improve the prompt. ComfyUI or Gemini renders the image.</p>
                </div>
              </div>
            )}

            <Button
              variant={studioMode === 'video' ? 'secondary' : 'primary'}
              onClick={handleGenerate}
              disabled={isGenerating}
              className={cn("w-full justify-center", studioMode === 'video' && "bg-amber-600 hover:bg-amber-500 text-white border-amber-500")}
              leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : studioMode === 'video' ? <Video className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4" />}
            >
              {isGenerating
                ? (studioMode === 'video' ? `Synthesizing ${videoDuration}s Video...` : `Synthesizing with ${AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...`)
                : (studioMode === 'video' ? `Synthesize ${videoDuration}s Motion Video` : 'Synthesize Production Visual')}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Viewport & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Viewport */}
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {studioMode === 'video'
                    ? `Video Viewport (9:16 • ${videoDuration}s • 1080x1920)`
                    : `Viewport Resolution: ${ratio === '16:9' ? '1920x1080' : ratio === '1:1' ? '1080x1080' : ratio === '9:16' ? '1080x1920' : '1080x1350'}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyUrl}
                  disabled={!currentImageUrl && !currentVideoUrl}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
                {(studioMode === 'video' ? currentVideoUrl : currentImageUrl) ? <a
                  href={studioMode === 'video' && currentVideoUrl ? currentVideoUrl : currentImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-1.5 shadow",
                    studioMode === 'video' ? "bg-amber-600 hover:bg-amber-500" : "bg-purple-600 hover:bg-purple-500"
                  )}
                >
                  <Download className="w-3.5 h-3.5" /> Download {studioMode === 'video' ? 'Video' : 'Asset'}
                </a> : null}
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center min-h-[420px]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 p-8">
                  <RefreshCw className={cn("w-8 h-8 animate-spin", studioMode === 'video' ? "text-amber-400" : "text-purple-400")} />
                  <p className="text-sm text-slate-300">
                    {studioMode === 'video' ? 'Synthesizing neural motion frames and visual vectors...' : `Rendering neural vectors on ${AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...`}
                  </p>
                </div>
              ) : studioMode === 'video' && currentVideoUrl ? (
                <div className="relative w-full flex flex-col items-center p-2">
                  <video
                    src={currentVideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={currentImageUrl}
                    className="w-full max-w-[340px] h-auto max-h-[500px] object-contain rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10"
                  />
                  <div className="mt-2 text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Live Render Preview • Loop Enabled
                  </div>
                </div>
              ) : currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt="Generated Asset"
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                />
              ) : renderFailure ? (
                <div className="text-center px-8 py-12 max-w-md">
                  <Server className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-amber-200">Renderer returned no asset</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{renderFailure}</p>
                  <p className="text-[11px] text-slate-500 mt-3">Use a provider with available quota, or start ComfyUI with a local checkpoint. No placeholder image was substituted.</p>
                </div>
              ) : (
                <div className="text-center px-8 py-12 max-w-md">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300">Choose an available renderer and synthesize your first production visual.</p>
                  <p className="text-xs text-slate-500 mt-2">The viewport stays empty until a provider returns real image bytes.</p>
                </div>
              )}
            </div>
            {lastEnhancedPrompt && lastEnhancedPrompt !== prompt && (
              <details className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                <summary className="cursor-pointer text-purple-300 font-medium">View the enhanced prompt used for this render</summary>
                <p className="mt-2 text-slate-400 leading-relaxed whitespace-pre-wrap">{lastEnhancedPrompt}</p>
              </details>
            )}
          </div>

          {/* Asset Gallery */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Session Generation History
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImageUrl(item.url)}
                  className="group relative cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all bg-black/40"
                >
                  <img src={item.url} alt={`Gallery ${idx}`} className="w-full h-24 object-cover" />
                  <div className="p-2 text-[10px] text-slate-400 truncate">
                    <span className="font-semibold text-purple-400">{item.model}</span> • {item.ratio}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Run Results */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Image Studio Synthesis Records"
          description="Log of visual asset generations, diffusion seeds, and production-grade marketing outputs."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
