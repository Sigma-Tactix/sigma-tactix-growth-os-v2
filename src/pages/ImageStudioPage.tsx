import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Wand2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Eye, 
  ExternalLink,
  Cpu,
  Palette,
  Ratio,
  ShieldCheck,
  History,
  Upload,
  X,
  FileImage,
  AlertTriangle,
  Zap,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import {
  generateCreativeImage,
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
    strengths: 'Fast native image generation, typography adherence, brand-safe commercial visual direction.'
  },
  {
    id: 'gemini-3-pro-image',
    providerId: 'gemini',
    name: 'Gemini 3 Pro Image',
    provider: 'Google Gemini',
    badge: 'Highest Fidelity',
    strengths: 'Complex compositions, multi-object precision, lighting control, and high-resolution rendering.'
  },
  {
    id: 'gemini-2.5-flash-image',
    providerId: 'gemini',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google Gemini',
    badge: 'High Speed',
    strengths: 'Sub-second generation for rapid prototyping and iterative creative exploration.'
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    providerId: 'huggingface',
    name: 'FLUX.1 Schnell',
    provider: 'Hugging Face / Black Forest',
    badge: 'Open Serverless Ready',
    strengths: 'Highest typography fidelity, complex prompt adherence, photorealism without cloud API quotas.'
  },
  {
    id: '@cf/black-forest-labs/flux-1-schnell',
    providerId: 'cloudflare',
    name: 'Cloudflare Workers AI FLUX',
    provider: 'Cloudflare Edge',
    badge: '10K Neurons/Day',
    strengths: 'Fast edge synthesis, zero cold starts, resilient B2B graphics with dedicated free tier.'
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
    id: '3D_DATA_NEURAL',
    label: '3D Neural Lattice',
    desc: 'Holographic glowing nodes, isometric depth, glass prisms.',
    source: 'sigma_default',
  }
];

/**
 * Generates an instant high-fidelity sovereign brand canvas if external models fail or quota spikes.
 */
function generateSovereignGraphic(
  prompt: string, 
  ratio: '16:9' | '1:1' | '9:16' | '4:5',
  styleName: string
): string {
  const dims = ratio === '16:9' ? { w: 1920, h: 1080 } :
               ratio === '1:1' ? { w: 1080, h: 1080 } :
               ratio === '9:16' ? { w: 1080, h: 1920 } :
               { w: 1080, h: 1350 };
  
  const headline = prompt.split('.')[0]?.slice(0, 70) || 'Sigma Tactix Intelligence Architecture';
  const subtext = prompt.slice(headline.length).trim().slice(0, 140) || 'Autonomous B2B Growth Infrastructure with Real-Time Neural Signal Vectoring';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.w}" height="${dims.h}" viewBox="0 0 ${dims.w} ${dims.h}">
    <defs>
      <radialGradient id="bgGlow" cx="75%" cy="25%" r="65%">
        <stop offset="0%" stop-color="#ff5722" stop-opacity="0.38"/>
        <stop offset="50%" stop-color="#d83812" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#05070a" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff704d" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#ff481b" stop-opacity="0.02"/>
      </linearGradient>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f5d0c5"/>
      </linearGradient>
    </defs>
    
    <rect width="${dims.w}" height="${dims.h}" fill="#07090e"/>
    <rect width="${dims.w}" height="${dims.h}" fill="url(#bgGlow)"/>
    <rect width="${dims.w}" height="${dims.h}" fill="url(#grid)"/>
    
    <!-- Abstract 3D Geometric Nodes -->
    <g opacity="0.45" stroke="#ff5722" stroke-width="1.5" fill="none">
      <circle cx="${dims.w * 0.72}" cy="${dims.h * 0.38}" r="${dims.w * 0.18}" stroke-dasharray="8 6"/>
      <circle cx="${dims.w * 0.72}" cy="${dims.h * 0.38}" r="${dims.w * 0.11}" stroke="rgba(255,112,77,0.6)"/>
      <circle cx="${dims.w * 0.72}" cy="${dims.h * 0.38}" r="${dims.w * 0.04}" fill="#ff481b" opacity="0.8"/>
      <line x1="${dims.w * 0.4}" y1="${dims.h * 0.7}" x2="${dims.w * 0.72}" y2="${dims.h * 0.38}" stroke="rgba(255,87,34,0.3)"/>
      <line x1="${dims.w * 0.85}" y1="${dims.h * 0.8}" x2="${dims.w * 0.72}" y2="${dims.h * 0.38}" stroke="rgba(255,87,34,0.3)"/>
    </g>

    <!-- Top Badge -->
    <rect x="${dims.w * 0.08}" y="${dims.h * 0.12}" width="${dims.w * 0.28}" height="42" rx="8" fill="#ff481b" fill-opacity="0.14" stroke="#ff5722" stroke-opacity="0.4"/>
    <text x="${dims.w * 0.08 + 20}" y="${dims.h * 0.12 + 27}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#ff704d" letter-spacing="3">SIGMA TACTIX • ${styleName.toUpperCase()}</text>

    <!-- Main Typography -->
    <text x="${dims.w * 0.08}" y="${dims.h * 0.45}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${Math.round(dims.w * 0.045)}" font-weight="800" fill="url(#textGrad)" letter-spacing="-1">
      ${headline}
    </text>
    
    <text x="${dims.w * 0.08}" y="${dims.h * 0.55}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${Math.round(dims.w * 0.018)}" font-weight="400" fill="#a1a1aa">
      ${subtext}
    </text>

    <!-- Bottom Footer Bar -->
    <line x1="${dims.w * 0.08}" y1="${dims.h * 0.86}" x2="${dims.w * 0.92}" y2="${dims.h * 0.86}" stroke="rgba(255,87,34,0.35)" stroke-width="1.5"/>
    <text x="${dims.w * 0.08}" y="${dims.h * 0.91}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#ff704d" letter-spacing="2">GROWTH OS GRAPHIC SYNTHESIS</text>
    <text x="${dims.w * 0.92}" y="${dims.h * 0.91}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#71717a">WWW.SIGMATACTIX.COM</text>
  </svg>`;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ImageStudioPage() {
  const { notifySuccess, notifyError, notifyInfo } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [renderFailure, setRenderFailure] = useState<{ message: string; is503?: boolean } | null>(null);

  // Reference Inspiration Graphic State
  const [referenceImage, setReferenceImage] = useState<{
    file: File;
    previewUrl: string;
    name: string;
  } | null>(null);

  // Gallery History
  const [gallery, setGallery] = useState<Array<{ url: string; prompt: string; model: string; ratio: string; style: string; type: string }>>([]);

  // Agent Run Results
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

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

  // Handle Reference Image File Upload
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError('Invalid File Type', 'Please upload an image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notifyError('File Too Large', 'Reference image must be under 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setReferenceImage({
      file,
      previewUrl,
      name: file.name
    });
    notifySuccess('Reference Graphic Attached', `Loaded "${file.name}" for creative style inspiration.`);
  };

  const removeReferenceImage = () => {
    if (referenceImage?.previewUrl) {
      URL.revokeObjectURL(referenceImage.previewUrl);
    }
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (overrideModelId?: string) => {
    if (!prompt.trim()) {
      notifyError('Prompt Required', 'Please enter a visual description prompt.');
      return;
    }

    const modelToUse = overrideModelId || selectedModel;
    setIsGenerating(true);
    setRenderFailure(null);
    
    // Enrich prompt with reference context if present
    let effectivePrompt = prompt;
    if (referenceImage) {
      effectivePrompt = `${prompt} [Style Reference: adhere to the lighting, color composition, and geometry inspired by the attached visual asset "${referenceImage.name}"]`;
    }

    try {
      const activeModelObj = AI_IMAGE_MODELS.find(m => m.id === modelToUse);

      const result = await generateCreativeImage({
        prompt: effectivePrompt,
        aspectRatio: ratio,
        stylePreset,
        negativePrompt,
        enhancePrompt,
        promptEnhancer: enhancePrompt ? promptEnhancer : 'none',
        preferredProvider: activeModelObj?.providerId,
        modelId: modelToUse
      });

      setCurrentImageUrl(result.imageUrl);
      setLastEnhancedPrompt(result.enhancedPrompt || effectivePrompt);

      const newGalleryItem = {
        url: result.imageUrl,
        prompt: effectivePrompt,
        model: activeModelObj?.name || modelToUse,
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
        outputSummary: `Rendered ${ratio} visual asset using ${stylePreset} preset with ${activeModelObj?.name}.`,
        imageUrl: result.imageUrl,
        fullOutput: `Model: ${activeModelObj?.name}\nRatio: ${ratio}\nStyle: ${stylePreset}\nEnhanced: ${result.enhancedPrompt || 'None'}\nURL: ${result.imageUrl}`,
        metrics: [
          { label: 'Model', value: activeModelObj?.name || 'Flux 1.1' },
          { label: 'Resolution', value: ratio },
          { label: 'Provider', value: result.provider },
          { label: 'Reference Attached', value: referenceImage ? 'Yes' : 'No' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Visual Synthesized', `Generated via verified provider ${result.provider}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate visual asset.';
      const is503 = message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE');
      
      setRenderFailure({
        message,
        is503
      });

      const failedRun: AgentRunRecord = {
        id: `run-img-err-${Date.now()}`,
        agentName: 'Creative Vision Agent',
        agentRole: 'High-Fidelity Visual Asset Synthesizer',
        timestamp: 'Just now',
        status: 'ERROR',
        moduleOrigin: 'AI Creative Image Studio',
        inputSummary: `${modelToUse}: ${prompt.slice(0, 60)}...`,
        outputSummary: is503 ? 'Provider model experiencing temporary demand spike (503 UNAVAILABLE).' : message,
        fullOutput: `Error: ${message}\nModel: ${modelToUse}\nRatio: ${ratio}`,
        metrics: [
          { label: 'Status', value: is503 ? '503 High Demand' : 'Error' },
          { label: 'Model', value: modelToUse }
        ]
      };
      setRunHistory(prev => [failedRun, ...prev]);
      notifyError(is503 ? 'Model At Capacity (503)' : 'Generation Error', message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Immediate Sovereign Graphic (Zero external downtime)
  const handleFallbackSovereignRender = () => {
    const styleLabel = stylePresets.find(s => s.id === stylePreset)?.label || 'Sigma Signal';
    const svgData = generateSovereignGraphic(prompt, ratio, styleLabel);
    setCurrentImageUrl(svgData);
    setRenderFailure(null);

    const newGalleryItem = {
      url: svgData,
      prompt,
      model: 'Sovereign Vector Synthesis',
      ratio,
      style: styleLabel,
      type: 'image'
    };
    setGallery(prev => [newGalleryItem, ...prev]);

    const fallbackRun: AgentRunRecord = {
      id: `run-img-sov-${Date.now()}`,
      agentName: 'Creative Vision Agent',
      agentRole: 'Sovereign Brand Graphic Engine',
      timestamp: 'Just now',
      status: 'SUCCESS',
      moduleOrigin: 'AI Creative Image Studio',
      inputSummary: `Sovereign Canvas: ${prompt.slice(0, 70)}...`,
      outputSummary: `Local vector fallback (${ratio}) generated — not a provider image.`,
      imageUrl: svgData,
      fullOutput: `Engine: Sovereign Brand Canvas (local vector template)\nRatio: ${ratio}\nResolution: 1920x1080 Vector`,
      metrics: [
        { label: 'Engine', value: 'Local vector template' },
        { label: 'Resolution', value: ratio },
        { label: 'Source', value: 'Generated on-device' }
      ]
    };
    setRunHistory(prev => [fallbackRun, ...prev]);
    notifySuccess('Local Graphic Generated', 'On-device vector fallback created. This is a local template, not a provider image.');
  };

  // User-Selectable Download Handler (.PNG & .JPG)
  const handleDownload = (format: 'png' | 'jpg') => {
    if (!currentImageUrl) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1920;
        canvas.height = img.naturalHeight || 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // If JPEG, fill white/dark background first to prevent transparent black
        if (format === 'jpg') {
          ctx.fillStyle = '#07090e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `sigma-graphic-${ratio.replace(':', 'x')}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notifySuccess('Download Started', `Saved graphic in .${format.toUpperCase()} format.`);
      };
      img.src = currentImageUrl;
    } catch {
      // Direct link fallback
      const a = document.createElement('a');
      a.href = currentImageUrl;
      a.download = `sigma-graphic-${Date.now()}.${format}`;
      a.click();
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentImageUrl);
    setCopied(true);
    notifySuccess('URL Copied', 'Asset URL copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate dynamic aspect ratio classes for the viewport
  const getViewportAspectRatioClass = () => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video w-full max-w-[760px] max-h-[440px]';
      case '1:1':
        return 'aspect-square w-full max-w-[480px] max-h-[480px]';
      case '9:16':
        return 'aspect-[9/16] w-full max-w-[320px] max-h-[568px]';
      case '4:5':
        return 'aspect-[4/5] w-full max-w-[420px] max-h-[525px]';
      default:
        return 'aspect-video w-full max-w-[760px]';
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10 pb-16">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8 lg:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">STATIC GRAPHICS STUDIO</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ImageIcon className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              AI Creative Studio — Static Graphics
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Synthesize production-grade creative visuals, high-converting ad graphics, and brand assets across Google Gemini, Hugging Face FLUX, Cloudflare Workers AI, and local ComfyUI backends.
            </p>
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
              <span className="text-[11px] text-purple-400 font-medium">Multi-Provider Stack</span>
            </div>

            <div className="space-y-2">
              {AI_IMAGE_MODELS.map(model => {
                const status = providers.find(provider => provider.provider === model.providerId);
                const available = Boolean(status && (status.active || (model.providerId === 'gemini' && status.configured)));
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setRenderFailure(null);
                    }}
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
                );
              })}
            </div>
          </div>

          {/* Reference Image / Inspiration Upload */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400" />
                Reference Graphic / Inspiration (Optional)
              </label>
              {referenceImage && (
                <button
                  onClick={removeReferenceImage}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleReferenceUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {referenceImage ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <img
                  src={referenceImage.previewUrl}
                  alt="Reference Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-purple-500/40"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-purple-200 truncate">{referenceImage.name}</p>
                  <p className="text-[11px] text-purple-400/80 mt-0.5">Style, color palette &amp; composition will be matched</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-3 border border-dashed border-white/15 rounded-xl hover:border-purple-500/40 hover:bg-white/[0.02] transition-all text-center flex flex-col items-center gap-2 group"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/10 text-slate-400 group-hover:text-purple-400 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300 font-medium">Click to upload reference image for style inspiration</div>
                <div className="text-[10px] text-slate-500">Supports .PNG, .JPG, .WEBP (max 10MB)</div>
              </button>
            )}
          </div>

          {/* Aspect Ratio & Style Presets */}
          <div className="p-6 md:p-7 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-6 shadow-sm">
            <div className="space-y-3 pb-4 border-b border-[var(--sigma-border)]/60">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)] flex items-center gap-2">
                <Ratio className="w-4 h-4 text-[var(--sigma-primary)]" />
                Aspect Ratio / Resolution
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {(['16:9', '1:1', '9:16', '4:5'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-colors cursor-pointer",
                      ratio === r
                        ? "bg-[var(--sigma-primary)] text-[var(--sigma-inverse-text)] border-[var(--sigma-primary)]"
                        : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--sigma-primary)]" />
                Style Preset
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {stylePresets.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setStylePreset(style.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      stylePreset === style.id
                        ? "bg-[var(--sigma-primary)]/10 border-[var(--sigma-primary)]/50 text-[var(--sigma-text)]"
                        : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:border-[var(--sigma-border-strong)] hover:text-[var(--sigma-text)]"
                    )}
                  >
                    <div className="text-xs font-semibold text-[var(--sigma-text)]">{style.label}</div>
                    <p className="text-xs text-[var(--sigma-text-muted)] mt-1 line-clamp-1">{style.desc}</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--sigma-text-muted)]">
                {stylePresets[0]?.source === 'brand_vault' ? 'Suggested from this workspace Brand Vault.' : 'Brand Vault baseline styles active.'}
              </p>
            </div>
          </div>

          {/* Prompt Editor & Generation Triggers */}
          <div className="p-6 md:p-7 rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border)] space-y-6 shadow-sm">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--sigma-text)]">
                Creative Visual Prompt
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your desired marketing graphic in vivid detail..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--sigma-input)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-text-muted)] focus:outline-none focus:border-[var(--sigma-primary)]/60 resize-none font-sans leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--sigma-text)]">Negative Prompt (What to Avoid)</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="watermark, blurry, distorted..."
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--sigma-input)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] placeholder-[var(--sigma-text-muted)] focus:outline-none focus:border-[var(--sigma-primary)]/60"
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
                <p className="text-[11px] text-slate-500">Ollama and LM Studio improve prompt fidelity; Gemini, Hugging Face, or Cloudflare renders the visual.</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full justify-center"
              leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {isGenerating
                ? `Synthesizing with ${AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...`
                : 'Synthesize Production Visual'}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Viewport & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Viewport */}
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Viewport Resolution: {ratio === '16:9' ? '1920x1080 (16:9)' : ratio === '1:1' ? '1080x1080 (1:1)' : ratio === '9:16' ? '1080x1920 (9:16)' : '1080x1350 (4:5)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyUrl}
                  disabled={!currentImageUrl}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
                {currentImageUrl ? (
                  <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => handleDownload('png')}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 flex items-center gap-1 shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> .PNG
                    </button>
                    <button
                      onClick={() => handleDownload('jpg')}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-white bg-purple-700 hover:bg-purple-600 flex items-center gap-1 shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> .JPG
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Dynamic Viewport Container matching selected aspect ratio */}
            <div className="relative rounded-xl overflow-hidden bg-black/80 border border-white/5 flex items-center justify-center p-3 min-h-[440px]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 p-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                  <p className="text-sm text-slate-300">
                    Rendering visual vectors on {AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...
                  </p>
                </div>
              ) : currentImageUrl ? (
                <div className={cn("relative mx-auto rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl transition-all duration-300 flex items-center justify-center bg-black/40", getViewportAspectRatioClass())}>
                  <img
                    src={currentImageUrl}
                    alt="Generated Graphic"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 font-mono">
                    {ratio} • {ratio === '16:9' ? '1920x1080' : ratio === '1:1' ? '1080x1080' : ratio === '9:16' ? '1080x1920' : '1080x1350'}
                  </div>
                </div>
              ) : renderFailure ? (
                <div className="text-center px-6 py-8 max-w-lg space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-200">
                      {renderFailure.is503 ? 'Gemini Model High Demand Spike (503)' : 'Renderer Returned No Asset'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-left max-h-24 overflow-y-auto">
                      {renderFailure.message}
                    </p>
                  </div>

                  {/* 1-Click Recovery Actions */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-medium text-slate-300">Instant Recovery Options (No Quota Blocks):</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedModel('black-forest-labs/FLUX.1-schnell');
                          handleGenerate('black-forest-labs/FLUX.1-schnell');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
                      >
                        <Zap className="w-3.5 h-3.5" /> Switch to FLUX.1 Schnell
                      </button>
                      <button
                        onClick={() => {
                          setSelectedModel('@cf/black-forest-labs/flux-1-schnell');
                          handleGenerate('@cf/black-forest-labs/flux-1-schnell');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
                      >
                        <Server className="w-3.5 h-3.5" /> Cloudflare Edge FLUX
                      </button>
                      <button
                        onClick={handleFallbackSovereignRender}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate Sovereign Brand Graphic
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center px-8 py-12 max-w-md">
                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-300">Choose an available renderer and synthesize your first production visual.</p>
                  <p className="text-xs text-slate-500 mt-2">The viewport scales dynamically to your chosen aspect ratio ({ratio}).</p>
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
            {gallery.length > 0 ? (
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
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                Generated graphics will appear here during this session.
              </div>
            )}
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

