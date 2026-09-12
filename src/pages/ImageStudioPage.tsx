import React, { useState } from 'react';
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
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { generateCreativeImage } from '@/src/lib/creativeApi';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  strengths: string;
}

const AI_IMAGE_MODELS: ModelOption[] = [
  {
    id: 'flux-1.1-pro',
    name: 'Flux 1.1 Pro',
    provider: 'Black Forest Labs',
    badge: 'Recommended for 2026',
    strengths: 'Highest typography fidelity, complex prompt adherence, photorealism.'
  },
  {
    id: 'midjourney-v6.1',
    name: 'Midjourney v6.1',
    provider: 'Midjourney API',
    badge: 'Aesthetic Leader',
    strengths: 'Cinematic lighting, rich textures, high-end editorial styling.'
  },
  {
    id: 'sd-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'Stability AI',
    badge: 'Open Weights',
    strengths: 'Granular prompt control, fast rendering, multi-subject composition.'
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3 HD',
    provider: 'OpenAI',
    badge: 'Enterprise',
    strengths: 'Concept translation, safety alignment, clean digital vectors.'
  },
  {
    id: 'pollinations-fast',
    name: 'Pollinations Instant',
    provider: 'Distributed Neural',
    badge: 'Zero Latency',
    strengths: 'Immediate real-time preview and fast iterations.'
  }
];

const STYLE_PRESETS = [
  {
    id: '3D_DATA_NEURAL',
    label: '3D Neural Vault',
    desc: 'Obsidian glass, glowing gold/amber telemetry, isometric depth'
  },
  {
    id: 'CYBER_SCHEMATIC',
    label: 'Cyber Schematic',
    desc: 'High-tech architectural wireframe, blueprint grid, cybernetic glow'
  },
  {
    id: 'MINIMAL_STUDIO',
    label: 'Minimal Studio',
    desc: 'Clean editorial lighting, macro focus, muted slate palette'
  },
  {
    id: 'CORPORATE_POLISHED',
    label: 'Corporate Editorial',
    desc: 'Premium B2B visual style, executive boardroom aesthetic'
  }
] as const;

export default function ImageStudioPage() {
  const { notifySuccess, notifyError } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>('flux-1.1-pro');
  const [prompt, setPrompt] = useState<string>(
    'Enterprise Second Brain data core with 10 glowing permissioned vaults in obsidian space, metallic amber accents, 8k resolution, cinematic lighting'
  );
  const [negativePrompt, setNegativePrompt] = useState<string>('cartoon, blurry, low resolution, watermark, deformed, messy text');
  const [ratio, setRatio] = useState<'16:9' | '1:1' | '9:16' | '4:5'>('16:9');
  const [stylePreset, setStylePreset] = useState<'3D_DATA_NEURAL' | 'CYBER_SCHEMATIC' | 'MINIMAL_STUDIO' | 'CORPORATE_POLISHED'>('3D_DATA_NEURAL');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(
    'https://image.pollinations.ai/prompt/Enterprise%20Second%20Brain%20data%20core%20glowing%20amber%20vaults%20obsidian%20space%203D%20isometric?width=1280&height=720&seed=48291&nologo=true'
  );
  const [copied, setCopied] = useState(false);

  // Gallery History
  const [gallery, setGallery] = useState([
    {
      url: 'https://image.pollinations.ai/prompt/Enterprise%20Second%20Brain%20data%20core%20glowing%20amber%20vaults%20obsidian%20space%203D%20isometric?width=1280&height=720&seed=48291&nologo=true',
      prompt: 'Enterprise Second Brain data core with 10 glowing amber vaults in obsidian space',
      model: 'Flux 1.1 Pro',
      ratio: '16:9',
      style: '3D Neural Vault'
    }
  ]);

  // Agent Run Results
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-img-01',
      agentName: 'Creative Vision Agent',
      agentRole: 'High-Fidelity Visual Asset Synthesizer',
      timestamp: 'Today at 04:45 AM',
      status: 'SUCCESS',
      moduleOrigin: 'AI Creative Image Studio',
      inputSummary: 'Prompt: Enterprise Second Brain data core with 10 glowing vaults',
      outputSummary: 'Rendered 16:9 visual asset with 3D Neural Vault styling.',
      imageUrl: currentImageUrl,
      fullOutput: `Model: Flux 1.1 Pro\nAspect Ratio: 16:9\nStyle: 3D_DATA_NEURAL\nSeed: 48291\nRender Quality: Production Grade`,
      metrics: [
        { label: 'Model', value: 'Flux 1.1 Pro' },
        { label: 'Aspect Ratio', value: '16:9' },
        { label: 'Resolution', value: '1920x1080' },
        { label: 'Status', value: 'Production Ready' }
      ]
    }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      notifyError('Prompt Required', 'Please enter a visual description prompt.');
      return;
    }

    setIsGenerating(true);
    try {
      const activeModelObj = AI_IMAGE_MODELS.find(m => m.id === selectedModel);
      const result = await generateCreativeImage({
        prompt: prompt,
        aspectRatio: ratio,
        stylePreset: stylePreset,
        enhancePrompt: enhancePrompt
      });

      setCurrentImageUrl(result.imageUrl);
      
      const newGalleryItem = {
        url: result.imageUrl,
        prompt: prompt,
        model: activeModelObj?.name || selectedModel,
        ratio: ratio,
        style: STYLE_PRESETS.find(s => s.id === stylePreset)?.label || stylePreset
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
          { label: 'Preset', value: stylePreset }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Visual Synthesized', `Rendered via ${activeModelObj?.name} at production fidelity.`);
    } catch (err) {
      notifyError('Generation Error', 'Failed to generate visual. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentImageUrl);
    setCopied(true);
    notifySuccess('URL Copied', 'Asset URL copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">AI Creative Image Studio</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Synthesize production-grade creative visuals, ad graphics, and brand assets across top generative diffusion models.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" /> Production Grade Engine
          </div>
        </div>
      </div>

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
              {AI_IMAGE_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between",
                    selectedModel === model.id
                      ? "bg-purple-500/10 border-purple-500/50 text-white shadow-md shadow-purple-500/5"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
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
                    {model.badge}
                  </span>
                </button>
              ))}
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
                {STYLE_PRESETS.map(style => (
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
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Creative Visual Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your desired marketing graphic in vivid detail..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Negative Prompt (What to Avoid)</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="watermark, blurry, distorted..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Synthesizing with {AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Synthesize Production Visual
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Viewport & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Viewport */}
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Viewport Resolution: {ratio === '16:9' ? '1920x1080' : ratio === '1:1' ? '1080x1080' : ratio === '9:16' ? '1080x1920' : '1080x1350'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
                <a
                  href={currentImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" /> Download Asset
                </a>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center min-h-[420px]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 p-8">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-sm text-slate-300">Rendering neural vectors on {AI_IMAGE_MODELS.find(m => m.id === selectedModel)?.name}...</p>
                </div>
              ) : (
                <img
                  src={currentImageUrl}
                  alt="Generated Asset"
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                />
              )}
            </div>
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
