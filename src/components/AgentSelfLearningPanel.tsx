import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  CheckCircle2, 
  Sliders, 
  BrainCircuit, 
  RefreshCw,
  Award,
  Zap,
  ShieldCheck,
  Play
} from 'lucide-react';
import { SelfLearningProfile, LearnedHeuristic, ScopedAgent } from '@/src/data/agentCockpitData';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';

interface AgentSelfLearningPanelProps {
  agent: ScopedAgent;
  onUpdateLearningProfile: (updatedProfile: SelfLearningProfile) => void;
  onLearningCycleCompleted?: (newHeuristic: LearnedHeuristic) => void;
}

export default function AgentSelfLearningPanel({
  agent,
  onUpdateLearningProfile,
  onLearningCycleCompleted
}: AgentSelfLearningPanelProps) {
  const { notifySuccess, notifyInfo } = useToast();
  const [profile, setProfile] = useState<SelfLearningProfile>({
    ...agent.learningProfile
  });
  const [isReflecting, setIsReflecting] = useState(false);

  // Trigger simulated reflection cycle
  const handleTriggerReflection = () => {
    setIsReflecting(true);
    notifyInfo(
      'Self-Learning Loop Activated',
      `Analyzing execution traces, HITL approvals, and reward signals for ${agent.codename}...`
    );

    setTimeout(() => {
      setIsReflecting(false);

      const nextIteration = profile.cycleIteration + 1;
      const nextReward = Math.min(99.9, +(profile.overallRewardScore + 0.2).toFixed(1));
      
      const candidateHeuristics: Omit<LearnedHeuristic, 'id' | 'discoveredAt'>[] = [
        {
          category: 'CONVERSION_LIFT',
          rule: `Cross-referencing customer pain points with live SERP intent yields a +28% higher engagement score for ${agent.codename}.`,
          confidenceScore: 0.97,
          impactDelta: '+28% target conversion',
          status: 'ACTIVE'
        },
        {
          category: 'PROMPT_WEIGHT',
          rule: `Penalizing broad speculative claims by 18% in system prompts increases Admin HITL first-pass approval rate to 99.4%.`,
          confidenceScore: 0.99,
          impactDelta: '+14% approval speed',
          status: 'ACTIVE'
        },
        {
          category: 'ROUTING_RULE',
          rule: `Restricting tool query depth to top 4 similarity vectors prevents context window bloating and cuts latency by 32%.`,
          confidenceScore: 0.95,
          impactDelta: '-32% execution latency',
          status: 'ACTIVE'
        }
      ];

      const chosen = candidateHeuristics[Math.floor(Math.random() * candidateHeuristics.length)];
      const newHeuristic: LearnedHeuristic = {
        id: `heur-${Date.now().toString().slice(-4)}`,
        discoveredAt: 'Just now',
        ...chosen
      };

      const updatedProfile: SelfLearningProfile = {
        ...profile,
        cycleIteration: nextIteration,
        overallRewardScore: nextReward,
        reflectionCount: profile.reflectionCount + 1,
        heuristics: [newHeuristic, ...profile.heuristics]
      };

      setProfile(updatedProfile);
      onUpdateLearningProfile(updatedProfile);

      notifySuccess(
        `Self-Learning Cycle #${nextIteration} Complete`,
        `Distilled new heuristic: "${newHeuristic.rule.slice(0, 70)}..."`,
        { category: 'AGENT' }
      );

      if (onLearningCycleCompleted) {
        onLearningCycleCompleted(newHeuristic);
      }
    }, 2000);
  };

  const handleUpdateParameter = (field: 'temperature' | 'retrievalThreshold' | 'voiceVectorAlignment', val: number) => {
    const updated = { ...profile, [field]: val };
    setProfile(updated);
    onUpdateLearningProfile(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-base font-bold silver-text flex items-center gap-2">
            <BrainCircuit size={18} className="text-accent" />
            Autonomous Self-Learning & Heuristics Loop
          </h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Continuous reinforcement feedback loop: inspects telemetry, tracks human approval feedback, and optimizes execution parameters.
          </p>
        </div>

        <button
          onClick={handleTriggerReflection}
          disabled={isReflecting}
          className="px-4 py-2 bg-accent text-background rounded-xl text-xs font-black font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 amber-glow disabled:opacity-50"
        >
          {isReflecting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isReflecting ? 'Reflecting...' : 'Trigger Self-Reflection Cycle'}
        </button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface/80 border border-white/10 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Learning Cycle</div>
          <div className="text-2xl font-mono font-black text-white">#{profile.cycleIteration}</div>
          <div className="text-[11px] text-green-400 flex items-center gap-1 font-mono">
            <TrendingUp size={12} /> Active Reinforcement
          </div>
        </div>

        <div className="bg-surface/80 border border-white/10 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Overall Reward Score</div>
          <div className="text-2xl font-mono font-black text-accent">{profile.overallRewardScore}%</div>
          <div className="text-[11px] text-zinc-400 font-mono">Normalized ROI delta</div>
        </div>

        <div className="bg-surface/80 border border-white/10 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Reflection Checkpoints</div>
          <div className="text-2xl font-mono font-black text-secondary">{profile.reflectionCount}</div>
          <div className="text-[11px] text-zinc-400 font-mono">Post-run audits committed</div>
        </div>

        <div className="bg-surface/80 border border-white/10 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">Active Heuristics</div>
          <div className="text-2xl font-mono font-black text-white">{profile.heuristics.length}</div>
          <div className="text-[11px] text-green-400 font-mono">Distilled runtime rules</div>
        </div>
      </div>

      {/* Dynamic Sampling Parameters */}
      <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders size={14} className="text-secondary" />
          <span className="text-xs font-mono uppercase font-bold text-white tracking-wide">
            Adaptive Sampling & Retrieval Hyperparameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Model Temperature</span>
              <span className="text-accent font-bold">{profile.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={profile.temperature}
              onChange={e => handleUpdateParameter('temperature', parseFloat(e.target.value))}
              className="w-full accent-accent bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-zinc-500">Lower for deterministic logic, higher for creative angles.</p>
          </div>

          {/* Retrieval Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">pgvector Threshold</span>
              <span className="text-secondary font-bold">{profile.retrievalThreshold}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.01"
              value={profile.retrievalThreshold}
              onChange={e => handleUpdateParameter('retrievalThreshold', parseFloat(e.target.value))}
              className="w-full accent-secondary bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-zinc-500">Cosine similarity cutoff for Second Brain memory query.</p>
          </div>

          {/* Voice Vector Alignment */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Brand Vector Alignment</span>
              <span className="text-green-400 font-bold">{profile.voiceVectorAlignment}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="100"
              step="0.1"
              value={profile.voiceVectorAlignment}
              onChange={e => handleUpdateParameter('voiceVectorAlignment', parseFloat(e.target.value))}
              className="w-full accent-green-400 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-zinc-500">Minimum tone alignment required before public release.</p>
          </div>
        </div>
      </div>

      {/* Learned Heuristics Repository */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-accent" />
            Distilled Empirical Heuristics Repository ({profile.heuristics.length})
          </label>
        </div>

        <div className="space-y-3">
          {profile.heuristics.map(heur => (
            <div
              key={heur.id}
              className="bg-surface/70 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-accent/30 transition-all shadow-md"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                    heur.category === 'CONVERSION_LIFT' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    heur.category === 'SAFETY_GUARD' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}>
                    {heur.category}
                  </span>
                  <span className="text-[10px] font-mono text-muted">{heur.discoveredAt}</span>
                  <span className="text-[10px] font-mono text-green-400 font-bold">{heur.impactDelta}</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">{heur.rule}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-[11px] font-mono">
                <div className="text-right">
                  <span className="text-muted block text-[10px]">Confidence</span>
                  <strong className="text-white font-bold">{(heur.confidenceScore * 100).toFixed(0)}%</strong>
                </div>
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">
                  {heur.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
