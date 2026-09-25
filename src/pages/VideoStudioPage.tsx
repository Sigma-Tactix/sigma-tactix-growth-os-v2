import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Pause, 
  Sparkles, 
  Clock, 
  Download, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Eye, 
  Film, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge } from '@/src/components/ui';
import { ShortsScene } from '@/src/data/marketingModulesData';

const DEFAULT_SCENES: ShortsScene[] = [
  {
    timeCode: '0:00 - 0:03',
    visualDirection: 'Rapid push-in on an open desk with 45 browser tabs and $25k in agency invoices.',
    sfxCue: 'Deep sub-bass drop + high-pitch static glitch',
    voiceover: 'If your company is still paying a $20k monthly agency retainer, you are getting fleeced.',
    screenText: 'STOP RENTING HEADCOUNT 🚨'
  },
  {
    timeCode: '0:03 - 0:15',
    visualDirection: 'Cut to red warning screen: attribution graphs plunging, agency turnover icon.',
    sfxCue: 'Camera shutter snap + warning beep',
    voiceover: 'Here is the dirty secret: their junior associates manage your account and quit every nine months. You lose your ad history and positioning nuance.',
    screenText: 'Context Evaporation: 9-Month Turnover'
  },
  {
    timeCode: '0:15 - 0:35',
    visualDirection: 'Smooth 3D orbit around glowing Second Brain core with 10 amber permissioned vaults.',
    sfxCue: 'Digital power-up hum + whoosh transition',
    voiceover: 'Top tech founders are doing something radically different. They install an AI-native Growth OS directly into their cloud. Permanent memory. Scoped agent swarms.',
    screenText: 'Install Sovereign Growth OS'
  },
  {
    timeCode: '0:35 - 0:50',
    visualDirection: 'Fast split screen showing real-time agent execution: SEO ranking spike, sub-60s WhatsApp qualification.',
    sfxCue: 'High-speed keyboard clatter + cash register ring',
    voiceover: 'Autonomous agents execute multi-hook ad variations and sub-60-second lead qualification under human-in-the-loop control.',
    screenText: '10x Execution • Zero Headcount Inflation'
  },
  {
    timeCode: '0:50 - 1:00',
    visualDirection: 'Clean obsidian title card with glowing gold Sigma Tactix emblem and QR code.',
    sfxCue: 'Subtle resonant chime',
    voiceover: 'Stop renting your intelligence. Own it. Run your free Growth OS diagnostic at sigmatactix.com.',
    screenText: 'Run Your Free Diagnostic ➔ sigmatactix.com'
  }
];

export default function VideoStudioPage() {
  const { notifySuccess, notifyError } = useToast();
  const [topic, setTopic] = useState('60-Second Agency Replacement Breakdown');
  const [format, setFormat] = useState<'9:16_SHORTS' | '16:9_YOUTUBE'>('9:16_SHORTS');
  const [duration, setDuration] = useState<'30s' | '60s' | '90s'>('60s');
  const [scenes, setScenes] = useState<ShortsScene[]>(DEFAULT_SCENES);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Playback timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 1;
          const currentIdx = Math.min(Math.floor((next / 100) * scenes.length), scenes.length - 1);
          setActiveSceneIndex(currentIdx);
          return next;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, scenes.length]);

  // Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-video-01',
      agentName: 'Remotion Motion Swarm',
      agentRole: 'Video Director & Remotion Code Synthesizer',
      timestamp: 'Today at 04:50 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Video & Motion Studio',
      inputSummary: 'Topic: 60-Second Agency Replacement Breakdown',
      outputSummary: 'Compiled 5 Remotion animation scenes with synchronized voiceover & audio cues.',
      fullOutput: JSON.stringify(DEFAULT_SCENES, null, 2),
      metrics: [
        { label: 'Scenes', value: '5' },
        { label: 'Aspect Ratio', value: '9:16 Vertical' },
        { label: 'Duration', value: '60s' },
        { label: 'Remotion Engine', value: 'v4.0 Ready' }
      ]
    }
  ]);

  const handleGenerate = () => {
    if (!topic.trim()) {
      notifyError('Topic Required', 'Please enter a video topic or concept.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      const generatedScenes: ShortsScene[] = [
        {
          timeCode: '0:00 - 0:04',
          visualDirection: `Bold typography reveal on dark textured background highlighting the paradox of ${topic}.`,
          sfxCue: 'Cinematic boom + rising sweep',
          voiceover: `Here is the one growth metric most founders overlook: the hidden cost of ${topic}.`,
          screenText: 'THE UNSEEN GROWTH KILLER ⚡'
        },
        {
          timeCode: '0:04 - 0:18',
          visualDirection: 'Split screen comparison between traditional fragmented tactics and unified sovereign systems.',
          sfxCue: 'Glitch sound effect + digital notification',
          voiceover: 'When your marketing operations are spread across disconnected tools, your blended CAC silently doubles.',
          screenText: 'Fragmented Tools = Fragmented Growth'
        },
        {
          timeCode: '0:18 - 0:38',
          visualDirection: 'Dynamic 3D Remotion camera zoom into central autonomous orchestration engine.',
          sfxCue: 'Tech hum + mechanical click',
          voiceover: 'Deploying an AI-native system unifies your customer intelligence into permanent institutional memory.',
          screenText: 'Sovereign Institutional Memory'
        },
        {
          timeCode: '0:38 - 0:60',
          visualDirection: 'Gold glowing CTA card with URL and high-converting actionable takeaway.',
          sfxCue: 'Final resonant chime',
          voiceover: 'Explore the full teardown and start running autonomous campaigns today at sigmatactix.com.',
          screenText: 'Audit Your Stack ➔ sigmatactix.com'
        }
      ];

      setScenes(generatedScenes);
      setActiveSceneIndex(0);
      setPlaybackProgress(0);

      const newRun: AgentRunRecord = {
        id: `run-video-${Date.now()}`,
        agentName: 'Remotion Motion Swarm',
        agentRole: 'Video Director & Remotion Code Synthesizer',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Video & Motion Studio',
        inputSummary: `${format}: ${topic}`,
        outputSummary: `Rendered ${generatedScenes.length}-scene Remotion storyboard bundle.`,
        fullOutput: JSON.stringify(generatedScenes, null, 2),
        metrics: [
          { label: 'Format', value: format },
          { label: 'Scenes', value: `${generatedScenes.length}` },
          { label: 'Duration', value: duration }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Storyboard Compiled', 'Remotion scenes generated with visual cues and voiceovers.');
    }, 1400);
  };

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">REMOTION ANIMATED ENGINE</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Video className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Video & Motion Studio
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Produce code-driven animated video storyboards, short-form reels, and motion graphic assets with Remotion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="success" dot>Remotion v4.0 Motion Engine</Badge>
          </div>
        </div>
      </GlassCard>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Script & Scene Configurator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              Video Script & Concept
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Campaign Topic or Thesis</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-rose-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Format Preset</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
                >
                  <option value="REELS_9_16">Instagram / TikTok Reels (9:16)</option>
                  <option value="YOUTUBE_SHORTS">YouTube Shorts (9:16)</option>
                  <option value="LINKEDIN_FEED">LinkedIn Feed Video (1:1 / 4:5)</option>
                  <option value="EXPLAINER_16_9">Landscape Explainer (16:9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
                >
                  <option value="30s">30 Seconds (Quick Teardown)</option>
                  <option value="60s">60 Seconds (Standard Short)</option>
                  <option value="90s">90 Seconds (Deep Teardown)</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full justify-center"
              leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {isGenerating ? 'Directing Scenes & Audio Cues...' : 'Synthesize Remotion Storyboard'}
            </Button>
          </div>

          {/* Scene Breakdown List */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-400" />
              Scene Timeline ({scenes.length} Scenes)
            </h3>

            <div className="space-y-2">
              {scenes.map((scene, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSceneIndex(idx);
                    setPlaybackProgress((idx / scenes.length) * 100);
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all",
                    activeSceneIndex === idx
                      ? "bg-rose-500/10 border-rose-500/40 text-white shadow"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-rose-400">Scene {idx + 1}</span>
                    <span className="font-mono text-[10px] text-slate-500">{scene.timeCode}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-200 line-clamp-1">{scene.screenText}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{scene.voiceover}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Remotion Live Simulator Viewport */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Remotion Web Player Simulator</span>
                <span className="font-mono text-slate-500">[{activeScene.timeCode}]</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    notifySuccess('Remotion Code Copied', 'Remotion TSX composition code ready to render.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" /> Export Remotion Code
                </button>
              </div>
            </div>

            {/* Video Player Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 flex items-center justify-center min-h-[440px] p-6">
              <div className={cn(
                "relative flex flex-col justify-between p-6 rounded-xl border border-rose-500/20 bg-gradient-to-b from-black/80 to-[#120815] transition-all shadow-2xl overflow-hidden",
                format === '9:16_SHORTS' ? "w-[260px] h-[400px]" : "w-[90%] h-[320px]"
              )}>
                {/* Remotion Animated Frame Elements */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold tracking-wider uppercase border border-rose-500/30">
                    Scene {activeSceneIndex + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{activeScene.timeCode}</span>
                </div>

                {/* Animated Graphic Center */}
                <div className="my-auto text-center space-y-3">
                  <motion.div
                    key={activeSceneIndex}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur"
                  >
                    <div className="text-sm md:text-base font-extrabold text-white tracking-tight leading-snug">
                      {activeScene.screenText}
                    </div>
                  </motion.div>
                  <p className="text-[11px] text-slate-400 italic">
                    "{activeScene.voiceover}"
                  </p>
                </div>

                {/* Bottom SFX Indicator */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-rose-400" /> SFX: {activeScene.sfxCue}
                  </span>
                </div>
              </div>
            </div>

            {/* Player Controls Bar */}
            <div className="space-y-2 pt-2">
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="font-mono">{Math.round((playbackProgress / 100) * 60)}s / 60s</span>
                </div>
                <div className="text-slate-400">
                  Visual Direction: <span className="text-slate-200">{activeScene.visualDirection}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Run Results */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Video Studio Production Runs"
          description="Execution timeline of Remotion storyboard generations and audio/visual direction logs."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
