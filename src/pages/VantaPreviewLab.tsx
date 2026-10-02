/**
 * VantaPreviewLab — Isolated preview of the polished Vanta experience.
 *
 * This route is PREVIEW-ONLY — it does not modify production components.
 * Navigate to /vanta-lab to view it.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, MicOff, Send, Sparkles, Brain, Eye, Radio,
  CheckCircle2, AlertTriangle, XCircle, ChevronRight,
  Pause, Play, Zap, Volume2, Search, Layers, FileText,
  Sliders, Compass, Orbit, ArrowUpRight
} from 'lucide-react';

// Libraries.dev imports
import { ThinkingOrb } from 'thinking-orbs';
import { VoiceBeam, useMicrophone } from 'voice-glow';
import { BotAvatar } from 'bot-avatars';
import { BorderBeam } from 'border-beam';

// 3D Synaptic Brain Orb
import VantaSynapticBrainOrb, {
  type NeuralSequenceFrame,
  type VaultFileNode,
  SAMPLE_VAULT_FILES,
  VAULT_SECTORS,
} from '@/src/components/vanta/VantaSynapticBrainOrb';

// Existing project types
import type { VantaPhase } from '@/src/lib/vanta';

/* ─── Constants ───────────────────────────────────────────────────────── */

const VANTA_PHASES: { phase: VantaPhase; label: string; icon: typeof Sparkles; description: string }[] = [
  { phase: 'idle',                  label: 'Idle',        icon: Sparkles,       description: 'Ambient breathing — Vanta is ready' },
  { phase: 'listening',             label: 'Listening',   icon: Mic,            description: 'Capturing voice input' },
  { phase: 'transcribing',         label: 'Transcribing', icon: Radio,          description: 'Converting speech to text' },
  { phase: 'thinking',             label: 'Thinking',    icon: Brain,          description: 'Processing query with neural core' },
  { phase: 'speaking',             label: 'Speaking',    icon: Volume2,        description: 'Delivering response' },
  { phase: 'inspecting',           label: 'Inspecting',  icon: Eye,            description: 'Examining topology' },
  { phase: 'proposing',            label: 'Proposing',   icon: Send,           description: 'Suggesting action' },
  { phase: 'awaiting_confirmation', label: 'Awaiting',    icon: Pause,          description: 'Waiting for human approval (HITL)' },
  { phase: 'success',              label: 'Success',     icon: CheckCircle2,   description: 'Action completed' },
  { phase: 'warning',              label: 'Warning',     icon: AlertTriangle,  description: 'Needs attention' },
  { phase: 'error',                label: 'Error',       icon: XCircle,        description: 'Failure encountered' },
  { phase: 'offline',              label: 'Offline',     icon: XCircle,        description: 'System unavailable' },
];

const ORB_STATE_MAP: Record<VantaPhase, string> = {
  offline: 'breathing',
  idle: 'breathing',
  listening: 'listening',
  transcribing: 'connecting',
  thinking: 'searching',
  speaking: 'composing',
  inspecting: 'weaving',
  proposing: 'solving',
  awaiting_confirmation: 'shaping',
  success: 'working',
  warning: 'shaping',
  error: 'shaping',
};

const PHASE_COLOR: Record<VantaPhase, string> = {
  offline: '#6b7280',
  idle: '#FF481B',
  listening: '#4F7CFF',
  transcribing: '#38BDF8',
  thinking: '#FF7A34',
  speaking: '#FFF7ED',
  inspecting: '#35C9A5',
  proposing: '#F59E0B',
  awaiting_confirmation: '#F59E0B',
  success: '#35C9A5',
  warning: '#F59E0B',
  error: '#EF4444',
};

type BotType = 'clover' | 'flower' | 'triangle' | 'star' | 'blob' | 'ghost' | 'circle' | 'drop';
type BotState = 'default' | 'working' | 'sleeping';

const SWARM_AGENTS: { id: string; name: string; role: string; type: BotType }[] = [
  { id: 'seo',      name: 'SEO Scout',       role: 'Topical Authority',      type: 'clover' },
  { id: 'ads',      name: 'Ads Optimizer',    role: 'Paid Media',             type: 'flower' },
  { id: 'content',  name: 'Content Writer',   role: 'Editorial Engine',       type: 'triangle' },
  { id: 'social',   name: 'Social Monitor',   role: 'Listening & Signals',    type: 'star' },
  { id: 'outreach', name: 'Outreach SDR',     role: 'Lead Generation',        type: 'blob' },
  { id: 'intel',    name: 'Intel Analyst',    role: 'Competitor Research',    type: 'ghost' },
];

const SEQUENCE_FRAMES: { frame: NeuralSequenceFrame; title: string; subtitle: string; icon: string }[] = [
  { frame: 1, title: 'Frame 1: Resting Core', subtitle: 'Coherent Idle · Harmonic pulse', icon: '✦' },
  { frame: 2, title: 'Frame 2: Axon Cluster', subtitle: 'Targeted sector inspection', icon: '↗' },
  { frame: 3, title: 'Frame 3: Singularity Beam', subtitle: 'Direct file query lock', icon: '⚡' },
  { frame: 4, title: 'Frame 4: Full Arborization', subtitle: 'Deep omnidirectional storm', icon: '✹' },
  { frame: 5, title: 'Frame 5: Retraction', subtitle: 'Consolidation to Second Brain', icon: '↺' },
];

/* ─── Main Component ─────────────────────────────────────────────────── */

export default function VantaPreviewLab() {
  const [activeTab, setActiveTab] = useState<'synaptic-3d' | 'thinking-2d'>('synaptic-3d');

  // 3D Synaptic Brain State
  const [sequenceFrame, setSequenceFrame] = useState<NeuralSequenceFrame>(1);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [simulatedAudio, setSimulatedAudio] = useState(0.25);
  const [useLiveMic, setUseLiveMic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VaultFileNode | null>(null);
  const [showSphereLayers, setShowSphereLayers] = useState(true);

  // 2D Lab State
  const [activePhase, setActivePhase] = useState<VantaPhase>('idle');
  const [autoPlay, setAutoPlay] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequencePlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mic = useMicrophone();

  // Auto-play for 5-Frame Sequence
  useEffect(() => {
    if (isSequencePlaying) {
      sequencePlayRef.current = setInterval(() => {
        setSequenceFrame((prev) => ((prev % 5) + 1) as NeuralSequenceFrame);
      }, 2600);
    }
    return () => {
      if (sequencePlayRef.current) clearInterval(sequencePlayRef.current);
    };
  }, [isSequencePlaying]);

  // Auto-cycle for 2D phases
  useEffect(() => {
    if (autoPlay) {
      let idx = VANTA_PHASES.findIndex((p) => p.phase === activePhase);
      autoPlayRef.current = setInterval(() => {
        idx = (idx + 1) % VANTA_PHASES.length;
        setActivePhase(VANTA_PHASES[idx].phase);
      }, 2500);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, activePhase]);

  const currentPhaseInfo = useMemo(
    () => VANTA_PHASES.find((p) => p.phase === activePhase) ?? VANTA_PHASES[0],
    [activePhase]
  );

  const isProcessing = ['thinking', 'transcribing', 'inspecting'].includes(activePhase);
  const isListening = activePhase === 'listening';
  const orbState = ORB_STATE_MAP[activePhase] as any;

  // Audio analyser for live mic stream
  const [micLevel, setMicLevel] = useState(0);
  useEffect(() => {
    if (!mic.stream) {
      setMicLevel(0);
      return;
    }
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(mic.stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animId: number;
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / (dataArray.length * 255);
        setMicLevel(avg);
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(animId);
        void audioCtx.close();
      };
    } catch {
      // AudioContext unavailable or blocked
    }
  }, [mic.stream]);

  const effectiveAudio = useLiveMic && mic.state === 'live' ? micLevel : simulatedAudio;

  const handleSelectFile = useCallback((file: VaultFileNode | null) => {
    setSelectedFile(file);
    if (file) {
      setSequenceFrame(3); // Frame 3 is targeted singularity lock
      setIsSequencePlaying(false);
    }
  }, []);

  const getBotState = useCallback(
    (agentId: string): BotState => {
      if (activePhase === 'offline') return 'sleeping';
      if (activePhase === 'thinking' || activePhase === 'inspecting') return 'working';
      if (activePhase === 'idle') return agentId === 'seo' || agentId === 'social' ? 'working' : 'default';
      return 'default';
    },
    [activePhase]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] min-h-[720px] overflow-hidden rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-bg)] shadow-2xl">
      {/* ── Header ── */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface)]/90 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--sigma-vermilion)]/30 bg-[var(--sigma-vermilion)]/10 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--sigma-vermilion)] shadow-[0_0_8px_var(--sigma-vermilion)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white uppercase">VANTA</h1>
              <span className="rounded-full bg-gradient-to-r from-[var(--sigma-vermilion)] to-orange-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Visual Lab
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {activeTab === 'synaptic-3d'
                ? '5-Frame Synaptic Brain Orb & Second Brain Vault Layers'
                : '2D Canvas ThinkingOrb & VoiceBeam Dock'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('synaptic-3d')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'synaptic-3d'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Orbit size={13} />
            <span>3D Synaptic Brain (5 Frames)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thinking-2d')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'thinking-2d'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap size={13} />
            <span>2D Thinking Orb</span>
          </button>
        </div>
      </header>

      {/* ──────────────── TAB 1: 3D SYNAPTIC BRAIN ORB ──────────────── */}
      {activeTab === 'synaptic-3d' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Top Control Bar: 5-Frame Sequence Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 flex items-center gap-1 mr-1">
                <Brain size={12} /> Sequence:
              </span>
              {SEQUENCE_FRAMES.map((f) => (
                <button
                  key={f.frame}
                  type="button"
                  onClick={() => {
                    setSequenceFrame(f.frame);
                    setIsSequencePlaying(false);
                    if (f.frame !== 3) setSelectedFile(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono transition-all ${
                    sequenceFrame === f.frame
                      ? 'bg-orange-500/20 border border-orange-500/60 text-orange-200 shadow-[0_0_12px_rgba(255,72,27,0.25)]'
                      : 'border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="font-bold text-orange-400">{f.icon}</span>
                  <span>{f.title}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSequencePlaying(!isSequencePlaying)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  isSequencePlaying
                    ? 'border-orange-500/50 bg-orange-500/20 text-orange-200'
                    : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {isSequencePlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{isSequencePlaying ? 'Pause' : 'Play Sequence'}</span>
              </button>
            </div>
          </div>

          {/* Secondary Control Bar: Siri Voice Reactivity & Layer Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-zinc-950/70 px-4 py-2 text-xs">
            {/* Audio Reactivity */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Volume2 size={12} className="text-orange-400" /> Siri Voice Reactive:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simulatedAudio}
                  onChange={(e) => {
                    setSimulatedAudio(parseFloat(e.target.value));
                    setUseLiveMic(false);
                  }}
                  className="w-28 accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  aria-label="Simulated Audio Amplitude"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-8">
                  {Math.round(effectiveAudio * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (useLiveMic) {
                    mic.stop();
                    setUseLiveMic(false);
                  } else {
                    void mic.start();
                    setUseLiveMic(true);
                  }
                }}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium border transition ${
                  useLiveMic
                    ? 'border-blue-400/50 bg-blue-500/20 text-blue-200 shadow-sm'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mic size={11} />
                <span>{useLiveMic ? 'Live Mic Active' : 'Use Live Mic'}</span>
              </button>
            </div>

            {/* Sphere Layer Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={showSphereLayers}
                  onChange={(e) => setShowSphereLayers(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Layers size={12} /> Show Sphere Vault Halos
                </span>
              </label>
              <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                <Compass size={11} /> Drag to orbit · Scroll to zoom
              </div>
            </div>
          </div>

          {/* 3D Canvas Stage + Side Info Panel */}
          <div className="flex flex-1 min-h-0 relative">
            {/* 3D Canvas */}
            <div className="flex-1 h-full min-h-[460px] relative">
              <VantaSynapticBrainOrb
                sequenceFrame={sequenceFrame}
                audioLevel={effectiveAudio}
                selectedFileId={selectedFile?.id ?? null}
                onSelectFile={handleSelectFile}
                showSphereLayers={showSphereLayers}
                className="w-full h-full"
              />

              {/* Bottom State Caption */}
              <div className="pointer-events-none absolute bottom-5 left-5 z-10 space-y-1 bg-black/60 p-3 rounded-xl border border-white/10 backdrop-blur-md max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400">
                    {SEQUENCE_FRAMES[sequenceFrame - 1].title}
                  </p>
                </div>
                <p className="text-xs text-zinc-300">
                  {SEQUENCE_FRAMES[sequenceFrame - 1].subtitle}
                </p>
                <p className="text-[10px] text-zinc-500 pt-1">
                  {sequenceFrame === 1 && 'Crystalline lobes breathing at rest. Singularity awaiting query.'}
                  {sequenceFrame === 2 && 'Axon bundle reaching outward toward Vault sectors for context retrieval.'}
                  {sequenceFrame === 3 && 'Singularity beam locked directly onto target file node in sphere layer.'}
                  {sequenceFrame === 4 && 'Full omnidirectional neural storm. All knowledge branches firing in parallel.'}
                  {sequenceFrame === 5 && 'Axons contracting back into core singularity. Insights committed to memory.'}
                </p>
              </div>
            </div>

            {/* Right Vault File Explorer & HUD */}
            <aside className="w-80 border-l border-white/10 bg-black/50 backdrop-blur-xl flex flex-col min-h-0">
              <div className="p-3.5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Brain size={14} className="text-orange-400" /> Second Brain Spheres
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {SAMPLE_VAULT_FILES.length} Files Mapped
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Click any file node to fire a Frame 3 singularity beam directly to it in 3D space.
                </p>
              </div>

              {/* Selected File Details HUD */}
              {selectedFile ? (
                <div className="p-3.5 border-b border-orange-500/30 bg-orange-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${selectedFile.vaultColor}25`, color: selectedFile.vaultColor }}
                    >
                      {selectedFile.vault}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectFile(null)}
                      className="text-[10px] text-zinc-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white break-words">{selectedFile.name}</h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedFile.summary}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                    <span>Weight: {selectedFile.size}</span>
                    <span className="text-orange-400 flex items-center gap-0.5">
                      ⚡ Synapse Locked <ArrowUpRight size={10} />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 border-b border-white/5 bg-white/[0.02] text-center">
                  <p className="text-[11px] text-zinc-500">No file targeted. Select one below or click a 3D node.</p>
                </div>
              )}

              {/* File Nodes by Vault Sector */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {VAULT_SECTORS.map((sector) => {
                  const sectorFiles = SAMPLE_VAULT_FILES.filter((f) => f.vault === sector.label);
                  return (
                    <div key={sector.id} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        <span style={{ color: sector.color }}>{sector.icon}</span>
                        <span>{sector.label}</span>
                      </div>
                      <div className="space-y-1">
                        {sectorFiles.map((file) => {
                          const isSelected = selectedFile?.id === file.id;
                          return (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => handleSelectFile(file)}
                              className={`w-full text-left rounded-lg p-2 transition flex items-center justify-between text-xs ${
                                isSelected
                                  ? 'bg-orange-500/20 border border-orange-500/60 text-white shadow-sm'
                                  : 'bg-white/[0.02] border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="block truncate font-medium text-[11px]">{file.name}</span>
                                <span className="text-[9px] font-mono text-zinc-500">{file.size}</span>
                              </div>
                              <ChevronRight size={12} className="text-zinc-600 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: 2D THINKING ORB LAB ──────────────── */}
      {activeTab === 'thinking-2d' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Phase Selector */}
          <div className="relative z-20 flex flex-wrap items-center gap-1.5 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface)] px-4 py-2">
            <span className="mr-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[var(--sigma-vermilion)]">
              <Zap size={10} /> Phase
            </span>
            <div className="flex flex-wrap gap-1">
              {VANTA_PHASES.map(({ phase, label }) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => {
                    setAutoPlay(false);
                    setActivePhase(phase);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-mono tracking-wide transition-all duration-200 ${
                    activePhase === phase
                      ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-medium transition ${
                  autoPlay
                    ? 'border-[var(--sigma-vermilion)]/40 bg-[var(--sigma-vermilion)]/10 text-[var(--sigma-vermilion)]'
                    : 'border-[var(--sigma-border)] text-zinc-400 hover:text-white'
                }`}
              >
                {autoPlay ? <Pause size={12} /> : <Play size={12} />}
                <span>{autoPlay ? 'Stop cycle' : 'Auto-cycle'}</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: 2D Orb + VoiceBeam Dock */}
            <div className="flex flex-1 flex-col items-center justify-between py-8 px-6">
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhase}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
                  >
                    <span
                      className="h-2 w-2 rounded-full shadow-lg"
                      style={{
                        backgroundColor: PHASE_COLOR[activePhase],
                        boxShadow: `0 0 12px ${PHASE_COLOR[activePhase]}60`,
                      }}
                    />
                    <span className="text-[11px] font-medium text-white">{currentPhaseInfo.label}</span>
                    <span className="text-[10px] text-zinc-500">·</span>
                    <span className="text-[10px] text-zinc-400">{currentPhaseInfo.description}</span>
                  </motion.div>
                </AnimatePresence>

                <BorderBeam
                  size="md"
                  colorVariant="mono"
                  strength={isProcessing ? 0.8 : 0.2}
                  active={activePhase !== 'offline'}
                  theme="dark"
                >
                  <div
                    className="relative flex items-center justify-center rounded-3xl bg-zinc-900/60 border border-white/5 p-10 backdrop-blur-xl"
                    style={{ width: 220, height: 220 }}
                  >
                    <div
                      className="absolute inset-0 rounded-3xl transition-all duration-700 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${PHASE_COLOR[activePhase]}15 0%, transparent 70%)`,
                      }}
                    />
                    <ThinkingOrb
                      state={orbState}
                      size={64}
                      speed={isProcessing ? 1.3 : 0.7}
                      paused={activePhase === 'offline'}
                    />
                  </div>
                </BorderBeam>
              </div>

              {/* VoiceBeam Command Dock */}
              <div className="w-full max-w-xl">
                <VoiceBeam
                  stream={isListening ? mic.stream : null}
                  level={isListening && !mic.stream ? effectiveAudio : 0}
                  processing={isProcessing}
                  colorVariant="colorful"
                  theme="dark"
                  strength={isListening ? 0.9 : isProcessing ? 0.5 : 0.15}
                >
                  <div className="relative flex items-center rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl shadow-2xl">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isListening ? 'Listening to your voice…' : 'Ask VANTA or use the microphone…'}
                      className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                    />
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (activePhase === 'listening') {
                            setActivePhase('thinking');
                            mic.stop();
                          } else {
                            setActivePhase('listening');
                            void mic.start();
                          }
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                          isListening
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (inputValue.trim()) {
                            setActivePhase('thinking');
                            setTimeout(() => setActivePhase('speaking'), 2000);
                          }
                        }}
                        disabled={!inputValue.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--sigma-vermilion)] text-white shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </VoiceBeam>
              </div>
            </div>

            {/* Right: BotAvatars Swarm */}
            <aside className="w-72 border-l border-white/10 bg-black/40 flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Bot Avatars</h3>
                <p className="text-[10px] text-zinc-500">Swarm agents from `bot-avatars`</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {SWARM_AGENTS.map((agent) => {
                  const botState = getBotState(agent.id);
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
                    >
                      <BotAvatar
                        type={agent.type}
                        state={botState}
                        size={36}
                        face="mouth"
                        shading="plastic"
                        theme="dark"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-white truncate">{agent.name}</span>
                        <span className="text-[10px] text-zinc-500">{agent.role}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-zinc-500">{botState}</span>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
