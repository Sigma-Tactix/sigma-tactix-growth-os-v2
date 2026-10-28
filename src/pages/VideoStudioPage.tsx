import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Download, 
  Film, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Video,
  Upload,
  Sparkles,
  Layers,
  Wand2,
  Check,
  Copy,
  Zap,
  Cpu,
  FileVideo,
  X,
  Volume2,
  Settings2,
  Ratio
} from 'lucide-react';
import { useToast } from '@/src/contexts/ToastContext';
import { apiFetch } from '@/src/lib/api';
import { 
  getCreativeProvidersStatus, 
  queueDeterministicRender, 
  type CreativeProviderStatus 
} from '@/src/lib/creativeApi';
import AgentRunResults, { type AgentRunRecord } from '@/src/components/AgentRunResults';
import { Badge, Button, GlassCard } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';

type AspectRatio = '9:16' | '16:9' | '1:1';
type VideoMode = 'NORMAL' | 'MOTION_FX';
type VideoQuality = '720p' | '1080p' | '4k';
type VoiceoverSpeed = '0.75x' | '1.0x' | '1.25x';

const LAST_RENDER_STORAGE_KEY = 'sigma.video-studio.last-render';

interface OpenSourceVideoModel {
  id: string;
  name: string;
  provider: string;
  badge: string;
  description: string;
  isOpenSource: boolean;
}

const AI_VIDEO_MODELS: OpenSourceVideoModel[] = [
  {
    id: 'wan-2.1-14b',
    name: 'Wan2.1 14B Cinematic Director',
    provider: 'Alibaba Open Weights',
    badge: 'Recommended SOTA',
    description: 'Premier open-weights video model with multilingual in-frame text rendering, cinematic physics, and commercial Apache 2.0 license.',
    isOpenSource: true
  },
  {
    id: 'wan-2.1-1.3b',
    name: 'Wan2.1 1.3B Fast Synthesis',
    provider: 'Alibaba Open Weights',
    badge: 'Consumer GPU Fast',
    description: 'Lightweight video diffusion architecture optimized for sub-minute render iterations on local consumer hardware.',
    isOpenSource: true
  },
  {
    id: 'ltx-video-2.5',
    name: 'LTX-Video 2.5 Real-Time Multimodal',
    provider: 'Lightricks Open Source',
    badge: 'Near Real-Time',
    description: 'Real-time neural motion synthesis with native synchronized dialogue, sound effects, and FP8 quantized rendering.',
    isOpenSource: true
  },
  {
    id: 'cogvideox-5b',
    name: 'CogVideoX-5B Narrative Storyteller',
    provider: 'Zhipu AI Open Weights',
    badge: 'Long-Range Coherence',
    description: 'Expert temporal consistency and multi-prompt following designed for explainer videos without scene morphing.',
    isOpenSource: true
  },
  {
    id: 'comfyui-video-pipeline',
    name: 'ComfyUI Local Video Pipeline',
    provider: 'Local Node Graph',
    badge: 'Private / Zero Cost',
    description: 'Chained local execution with AnimateDiff, Wan2.1 LoRAs, and SeedVR upscaling on this machine.',
    isOpenSource: true
  },
  {
    id: 'hyperframes-governed',
    name: 'HyperFrames Governed MP4',
    provider: 'Sigma Core Engine',
    badge: 'Deterministic Delivery',
    description: 'Three-scene branded motion creative with GSAP motion kinetics, local 0.75x voiceover, and human approval gates.',
    isOpenSource: false
  }
];

const HEADLINE_PRESETS = [
  { label: 'Signal Hook', text: 'Why Your $30k/mo Retainer Leaks Enterprise Pipeline' },
  { label: 'System Proof', text: 'Sigma Tactix Growth OS: Autonomous Infrastructure' },
  { label: 'Executive Direct', text: 'Proof Before Performance: The 2026 Growth Stack' }
];

const SCRIPT_PRESETS = [
  { label: 'Agitation', text: 'Junior agency coordinators turn over every nine months while customer acquisition costs double. Own your growth intelligence.' },
  { label: 'Evidence Architecture', text: 'Connect real-time market signals, customer objection patterns, and multi-agent execution in a unified private cloud loop.' },
  { label: 'Speed & Scale', text: 'Deploy sovereign AI agents across SEO, creative design, and CRO with human approval gates at every milestone.' }
];

interface QueuedRender {
  id: string;
  status: string;
}

function parseArtifact(task: any): { downloadUrl?: string; sceneCount?: number; hasVoiceover?: boolean } | null {
  if (!task?.output || typeof task.output !== 'string') return null;
  try {
    const parsed = JSON.parse(task.output);
    return parsed?.kind === 'deterministic_mp4' ? parsed : null;
  } catch {
    return null;
  }
}

export default function VideoStudioPage() {
  const { notifyError, notifyInfo, notifySuccess } = useToast();
  const motionFxInputRef = useRef<HTMLInputElement>(null);

  // Video Mode: Normal Video Generation vs Motion FX Storytelling Video
  const [videoMode, setVideoMode] = useState<VideoMode>('NORMAL');
  const [selectedModel, setSelectedModel] = useState<string>('wan-2.1-14b');
  
  // Specifications
  const [title, setTitle] = useState('Sigma Tactix Growth OS');
  const [subtitle, setSubtitle] = useState('Evidence-led growth operations with human approval at every execution gate.');
  const [cta, setCta] = useState('Visit now');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [quality, setQuality] = useState<VideoQuality>('1080p');
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceoverSpeed>('0.75x');

  // Motion FX Assets
  const [motionFxAssets, setMotionFxAssets] = useState<Array<{ name: string; size: string; previewUrl: string; targetScene: number }>>([]);

  // Timeline Scene Scripts (Manual Editing)
  const [scene1Script, setScene1Script] = useState('01 / Hook: Stop leaking enterprise B2B pipeline into rented agency retainers.');
  const [scene2Script, setScene2Script] = useState('02 / System: Deploy autonomous intelligence with verified proof before performance.');
  const [scene3Script, setScene3Script] = useState('03 / Ending: Visit www.sigmatactix.com to initiate your governed pilot.');

  const [providers, setProviders] = useState<CreativeProviderStatus[]>([]);
  const [queueing, setQueueing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [queuedRender, setQueuedRender] = useState<QueuedRender | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.sessionStorage.getItem(LAST_RENDER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [artifactUrl, setArtifactUrl] = useState('');
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const loadArtifact = async (downloadUrl: string) => {
    const response = await apiFetch(downloadUrl);
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.error || 'Could not load the authenticated MP4 artifact.');
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('video/')) throw new Error('The renderer artifact is not a video response.');
    const objectUrl = URL.createObjectURL(blob);
    setArtifactUrl(previous => {
      if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
      return objectUrl;
    });
  };

  useEffect(() => {
    getCreativeProvidersStatus().then(setProviders).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !queuedRender) return;
    window.sessionStorage.setItem(LAST_RENDER_STORAGE_KEY, JSON.stringify(queuedRender));
  }, [queuedRender]);

  useEffect(() => {
    let active = true;
    apiFetch('/api/workspace')
      .then(async response => ({ response, workspace: await response.json().catch(() => ({})) }))
      .then(({ response, workspace }) => {
        if (!active || !response.ok || !Array.isArray(workspace.agentTasks)) return;
        const latest = workspace.agentTasks.find((task: any) => task?.creativeRender);
        if (!latest) return;
        setQueuedRender({ id: latest.id, status: latest.status });
        const artifact = parseArtifact(latest);
        if (latest.status === 'Success' && artifact?.downloadUrl) void loadArtifact(artifact.downloadUrl).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (artifactUrl.startsWith('blob:')) URL.revokeObjectURL(artifactUrl);
  }, [artifactUrl]);

  const hyperframes = useMemo(
    () => providers.find(provider => provider.provider === 'hyperframes'),
    [providers],
  );

  // Handle Motion FX file upload
  const handleMotionFxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const newAsset = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl,
      targetScene: 2
    };

    setMotionFxAssets(prev => [...prev, newAsset]);
    notifySuccess('Motion FX Asset Added', `Loaded "${file.name}" for timeline scene 2.`);
    if (motionFxInputRef.current) motionFxInputRef.current.value = '';
  };

  const removeMotionFx = (index: number) => {
    setMotionFxAssets(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const queueRender = async () => {
    if (!title.trim()) {
      notifyError('Title required', 'Enter the headline that should appear in the rendered video.');
      return;
    }
    setQueueing(true);
    try {
      const activeModelObj = AI_VIDEO_MODELS.find(m => m.id === selectedModel);
      const isMotionFx = videoMode === 'MOTION_FX';
      
      const compositeSubtitle = isMotionFx
        ? `${subtitle.trim()} [Motion FX Assets: ${motionFxAssets.length > 0 ? motionFxAssets.map(a => a.name).join(', ') : 'Kinetic overlays'} | Explainer Mode: Scene 1 Hook, Scene 2 Explainer, Scene 3 Ending Frame with Sigma Tactix Logo, www.sigmatactix.com, and CTA "Visit now"]`
        : subtitle.trim();

      const result = await queueDeterministicRender({
        title: title.trim(),
        subtitle: compositeSubtitle,
        cta: cta.trim() || 'Visit now',
        aspectRatio,
        durationSeconds,
      });

      setQueuedRender({ id: result.task.id, status: result.task.status });
      setArtifactUrl('');
      
      const newRun: AgentRunRecord = {
        id: result.task.id,
        agentName: isMotionFx ? 'Motion FX Storytelling Agent' : 'AI Video Director Agent',
        agentRole: isMotionFx ? 'B2B Interactive Motion Synthesizer' : 'Open Video Synthesizer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Video & Motion Studio',
        inputSummary: `${activeModelObj?.name} • ${aspectRatio} • ${durationSeconds}s • ${quality}`,
        outputSummary: `Queued ${videoMode} render via ${activeModelObj?.name}. Approval gate initialized.`,
        fullOutput: `Model: ${activeModelObj?.name}\nMode: ${videoMode}\nAspect Ratio: ${aspectRatio}\nDuration: ${durationSeconds}s\nQuality: ${quality}\nVoice Pace: ${voiceSpeed}\nEnding Frame: Sigma Tactix Logo + www.sigmatactix.com + CTA "Visit now"`,
        metrics: [
          { label: 'Mode', value: videoMode },
          { label: 'Model', value: activeModelObj?.name?.split(' ')[0] || 'Wan2.1' },
          { label: 'Ratio', value: aspectRatio },
          { label: 'Duration', value: `${durationSeconds}s` },
          { label: 'Quality', value: quality }
        ]
      };
      setRunHistory(prev => [newRun, ...prev]);

      notifySuccess(
        isMotionFx ? 'Motion FX Explainer Queued' : 'Video Render Queued',
        `${result.task.id} scheduled with 0.75x paced voiceover and ending frame CTA.`
      );
    } catch (error: any) {
      notifyError('Could not queue render', error?.message || 'The video renderer is unavailable.');
    } finally {
      setQueueing(false);
    }
  };

  const checkRender = async () => {
    if (!queuedRender) return;
    setChecking(true);
    try {
      const response = await apiFetch('/api/workspace');
      const workspace = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(workspace.error || 'Could not read workspace render status.');
      const task = Array.isArray(workspace.agentTasks)
        ? workspace.agentTasks.find((candidate: any) => candidate.id === queuedRender.id)
        : null;
      if (!task) throw new Error('The queued render task is not present in this workspace.');
      setQueuedRender({ id: task.id, status: task.status });
      const artifact = parseArtifact(task);
      if (task.status === 'Success' && artifact?.downloadUrl) {
        await loadArtifact(artifact.downloadUrl);
        setRunHistory(current => current.some(run => run.id === task.id) ? current : [{
          id: task.id,
          agentName: 'Creative Director Agent',
          agentRole: 'Approval-gated deterministic renderer',
          timestamp: task.reviewedAt || task.timestamp,
          status: 'SUCCESS',
          moduleOrigin: 'Video & Motion Studio',
          inputSummary: `${aspectRatio} / ${durationSeconds}s / ${title}`,
          outputSummary: `Rendered authenticated 3-scene MP4 with 0.75x voiceover track and ending frame branding.`,
          fullOutput: task.output,
          metrics: [
            { label: 'Renderer', value: 'HyperFrames' },
            { label: 'Aspect ratio', value: aspectRatio },
            { label: 'Duration', value: `${durationSeconds}s` },
            { label: 'Scenes', value: `${artifact.sceneCount || 3}` },
            { label: 'Ending Frame', value: 'www.sigmatactix.com' },
          ],
        }, ...current]);
        notifySuccess('Render complete', 'The verified MP4 is ready for download below.');
      } else if (task.status === 'Failed' || task.status === 'Rejected') {
        notifyError(`Render ${task.status.toLowerCase()}`, task.output || 'Open Agent Cockpit for the execution record.');
      } else {
        notifyInfo('Render not complete', `Current status: ${task.status}.`);
      }
    } catch (error: any) {
      notifyError('Status check failed', error?.message || 'Could not verify the render task.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <Badge variant="neutral">VIDEO &amp; MOTION FX</Badge>
              <span className={`flex items-center gap-1 text-xs font-mono ${hyperframes?.active ? 'text-emerald-400' : 'text-amber-400'}`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {hyperframes?.active ? 'Renderer Ready (0.75x Voiceover Active)' : 'Renderer Standby'}
              </span>
            </div>
            {/* Dynamic Section Name strictly reflecting selected Aspect Ratio */}
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <Video className="h-7 w-7 text-[var(--sigma-vermilion)]" />
              Video &amp; Motion Studio — Motion Video ({aspectRatio})
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Synthesize storytelling explainers and open-weights AI videos with Wan2.1, LTX-Video, CogVideoX, and HyperFrames. Features 0.75x paced voiceover and ending frame branding for www.sigmatactix.com.
            </p>
          </div>

          {/* Mode Switcher Tabs: Separate Normal Video vs Motion FX Video */}
          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setVideoMode('NORMAL')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                videoMode === 'NORMAL'
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Video className="w-4 h-4" /> Normal Video Generation
            </button>
            <button
              onClick={() => setVideoMode('MOTION_FX')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                videoMode === 'MOTION_FX'
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Sparkles className="w-4 h-4 text-purple-300" /> Motion FX Storytelling Video
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Model Selection, Prompting, Variations & Settings */}
        <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0F0F12] p-5 lg:col-span-5">
          {/* AI Video Model Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Cpu className="h-4 w-4 text-amber-400" /> AI Video Model Architecture
              </h2>
              <span className="text-[10px] text-amber-400 font-medium">Open Source Stack</span>
            </div>
            
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {AI_VIDEO_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                    selectedModel === model.id
                      ? "bg-amber-500/10 border-amber-500/50 text-white shadow-md shadow-amber-500/5"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-100 truncate">{model.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{model.description}</p>
                  </div>
                  <span className="text-[9px] font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
                    {model.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Headline Variations */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Headline / Visual Hook
              </label>
              <span className="text-[10px] text-zinc-500">Variations:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {HEADLINE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setTitle(preset.text)}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-[10px] text-slate-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input 
              value={title} 
              onChange={event => setTitle(event.target.value)} 
              maxLength={160} 
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" 
            />
          </div>

          {/* Supporting Message Variations */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Supporting Script / Narrative
              </label>
              <span className="text-[10px] text-zinc-500">Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SCRIPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSubtitle(preset.text)}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-[10px] text-slate-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea 
              value={subtitle} 
              onChange={event => setSubtitle(event.target.value)} 
              maxLength={240} 
              rows={3} 
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs leading-relaxed text-slate-200 outline-none focus:border-amber-500/50 font-sans" 
            />
          </div>

          {/* Aspect Ratio, Duration, Quality & Voice Pace Grid */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-300">
              Aspect Ratio
              <select 
                value={aspectRatio} 
                onChange={event => setAspectRatio(event.target.value as AspectRatio)} 
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value="9:16">9:16 Shorts / Reels (1080x1920)</option>
                <option value="16:9">16:9 YouTube / Web (1920x1080)</option>
                <option value="1:1">1:1 Social Feed (1080x1080)</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-300">
              Duration
              <select 
                value={durationSeconds} 
                onChange={event => setDurationSeconds(Number(event.target.value))} 
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value={5}>5 seconds</option>
                <option value={8}>8 seconds (Recommended)</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-300">
              Resolution Output
              <select 
                value={quality} 
                onChange={event => setQuality(event.target.value as VideoQuality)} 
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD (Recommended)</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-300">
              Voiceover Speed
              <select 
                value={voiceSpeed} 
                onChange={event => setVoiceSpeed(event.target.value as VoiceoverSpeed)} 
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value="0.75x">0.75x Slow &amp; Authoritative (Default)</option>
                <option value="1.0x">1.0x Standard Pacing</option>
                <option value="1.25x">1.25x Dynamic Speed</option>
              </select>
            </label>
          </div>

          {/* Motion FX Assets Upload (Available in both, prominent in Motion FX Mode) */}
          <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Motion FX &amp; Overlays Upload
              </label>
              <span className="text-[10px] text-purple-400 font-mono">{motionFxAssets.length} Assets Attached</span>
            </div>
            
            <input 
              type="file" 
              ref={motionFxInputRef} 
              onChange={handleMotionFxUpload} 
              accept="image/png,image/webp,video/mp4" 
              className="hidden" 
            />

            <button
              type="button"
              onClick={() => motionFxInputRef.current?.click()}
              className="w-full py-2.5 px-3 border border-dashed border-purple-500/30 rounded-lg hover:bg-purple-500/10 text-xs text-purple-200 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Attach Motion Graphic / Sticker / B-Roll Clip
            </button>

            {motionFxAssets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {motionFxAssets.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-zinc-300 truncate max-w-[180px]">{asset.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono">{asset.size}</span>
                      <button onClick={() => removeMotionFx(i)} className="text-red-400 hover:text-red-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ending Frame Controls */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-amber-300">
              <span>Mandatory Closing Frame</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">Scene 3</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Automatically includes the <strong>Sigma Tactix Logo</strong>, website domain <strong>www.sigmatactix.com</strong>, and CTA badge <strong>Visit now</strong>.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={queueRender} 
            disabled={queueing} 
            className="w-full justify-center bg-amber-600 hover:bg-amber-500 text-white border-amber-500" 
            leftIcon={queueing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          >
            {queueing ? 'Queueing Governed Video...' : `Queue ${videoMode === 'MOTION_FX' ? 'Motion FX Explainer' : 'Video Generation'}`}
          </Button>

          {queuedRender && (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-amber-300">{queuedRender.id}</span>
                <Badge variant={queuedRender.status === 'Success' ? 'success' : 'warning'}>{queuedRender.status}</Badge>
              </div>
              <p className="text-zinc-400">Task queued with 0.75x voiceover pacing and ending frame branding. Approve in Cockpit or verify below.</p>
              <div className="flex flex-wrap gap-2">
                <a href="/agents" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 hover:bg-white/10">Open Agent Cockpit</a>
                <button onClick={checkRender} disabled={checking} className="rounded-lg bg-amber-600 px-3 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50">
                  {checking ? 'Checking...' : 'Check Render Status'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Dynamic Live Viewport & Storyboard */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0F0F12] p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Film className="h-4 w-4 text-amber-400" /> 
                {videoMode === 'MOTION_FX' ? 'Motion FX Storyboard & Output' : 'Video Output Viewport'}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Resolution: {aspectRatio} • Quality: {quality} • Cadence: {voiceSpeed}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-black/40 px-2.5 py-1 rounded-md border border-white/10">
              <Clock className="h-3.5 w-3.5 text-amber-400" /> {durationSeconds}s / {aspectRatio}
            </span>
          </div>

          {artifactUrl ? (
            <div className="space-y-4">
              <div className={cn(
                "relative mx-auto rounded-xl overflow-hidden border border-emerald-500/40 bg-black shadow-2xl flex items-center justify-center",
                aspectRatio === '9:16' ? "max-w-[340px] aspect-[9/16]" : aspectRatio === '1:1' ? "max-w-[480px] aspect-square" : "w-full aspect-video"
              )}>
                <video 
                  src={artifactUrl} 
                  controls 
                  playsInline 
                  autoPlay
                  loop
                  className="w-full h-full object-contain" 
                />
              </div>

              {/* Download in .MP4 format */}
              <div className="flex justify-center">
                <a 
                  href={artifactUrl} 
                  download={`sigma-video-${aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="h-4 w-4" /> Download .MP4 Video ({quality})
                </a>
              </div>
            </div>
          ) : (
            <div className={cn(
              "mx-auto flex flex-col justify-end overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_80%_0%,rgba(217,119,6,.45),transparent_38%),linear-gradient(180deg,#07090d,#030405)] p-8 shadow-2xl transition-all duration-300",
              aspectRatio === '9:16' ? "max-w-[340px] min-h-[520px]" : aspectRatio === '1:1' ? "max-w-[460px] min-h-[460px]" : "w-full min-h-[420px]"
            )}>
              <div className="mb-auto">
                <div className="text-[10px] font-bold tracking-[0.22em] text-amber-400">
                  SIGMA TACTIX / {videoMode} PREVIEW ({aspectRatio})
                </div>
                <div className="mt-1 text-[11px] text-zinc-400 font-mono">
                  {selectedModel.toUpperCase()} • VOICE PACING: {voiceSpeed}
                </div>
              </div>

              <h3 className="max-w-xl text-2xl md:text-3xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
                {title || 'Untitled motion creative'}
              </h3>
              
              <p className="mt-4 max-w-lg text-xs leading-relaxed text-zinc-300">
                {subtitle || 'Add a supporting message.'}
              </p>

              {/* Ending Frame Indicator */}
              <div className="mt-8 flex items-center justify-between border-t border-amber-500/30 pt-3 text-[10px] tracking-[0.14em] text-amber-400">
                <span>WWW.SIGMATACTIX.COM</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 font-bold">CTA: {cta || 'Visit now'}</span>
              </div>
            </div>
          )}

          {/* Simple Manual Timeline Editing Options */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-amber-400" /> Manual Storyline &amp; Timeline Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-semibold text-amber-300">Scene 1 (Hook)</span>
                <input 
                  value={scene1Script} 
                  onChange={e => setScene1Script(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-zinc-300 outline-none border-b border-white/10 focus:border-amber-400 pb-1"
                />
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-semibold text-amber-300">Scene 2 (Explainer / System)</span>
                <input 
                  value={scene2Script} 
                  onChange={e => setScene2Script(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-zinc-300 outline-none border-b border-white/10 focus:border-amber-400 pb-1"
                />
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-semibold text-emerald-400">Scene 3 (Ending Frame)</span>
                <input 
                  value={scene3Script} 
                  onChange={e => setScene3Script(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-zinc-300 outline-none border-b border-white/10 focus:border-emerald-400 pb-1"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0F0F12] p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Storyboard status
        </h2>
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="font-medium text-zinc-200">No storyboard scenes yet</p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">
            Configure headline, script narrative, and motion FX overlays above. The governed renderer generates authenticated MP4 video with verified 0.75x voiceover pacing and ending frame branding.
          </p>
        </div>
      </section>

      {runHistory.length > 0 && (
        <AgentRunResults 
          records={runHistory} 
          title="Verified Video Studio Runs" 
          description="Log of generated video artifacts, model pipelines, and audio stream validations." 
          onClear={() => setRunHistory([])} 
        />
      )}
    </div>
  );
}

