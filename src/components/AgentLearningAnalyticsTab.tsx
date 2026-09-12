import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Filter, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  AreaChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { ScopedAgent } from '@/src/data/agentCockpitData';

interface AgentLearningAnalyticsTabProps {
  agent: ScopedAgent;
  allAgents: ScopedAgent[];
}

interface TelemetryPoint {
  epoch: string;
  timestamp: string;
  efficiency: number;
  tokens: number;
  errorRate: number;
  rewardScore: number;
  heuristicDiscovered?: string;
}

export default function AgentLearningAnalyticsTab({
  agent,
  allAgents
}: AgentLearningAnalyticsTabProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [metricFocus, setMetricFocus] = useState<'all' | 'efficiency' | 'tokens' | 'errors'>('all');
  const [compareFleet, setCompareFleet] = useState(false);

  // Generate realistic, deterministic telemetry series tailored to this agent's learningProfile
  const telemetryData: TelemetryPoint[] = useMemo(() => {
    const cycle = agent.learningProfile.cycleIteration || 50;
    const baseReward = agent.learningProfile.overallRewardScore || 96;

    if (timeframe === '24h') {
      return [
        { epoch: '00:00', timestamp: '12h ago', efficiency: 91.2, tokens: 18.4, errorRate: 1.8, rewardScore: 92.4 },
        { epoch: '04:00', timestamp: '8h ago', efficiency: 93.0, tokens: 16.2, errorRate: 1.2, rewardScore: 94.1 },
        { epoch: '08:00', timestamp: '4h ago', efficiency: 94.6, tokens: 14.8, errorRate: 0.9, rewardScore: 95.8, heuristicDiscovered: 'Negative prompt constraint optimization' },
        { epoch: '12:00', timestamp: '2h ago', efficiency: 96.8, tokens: 12.3, errorRate: 0.4, rewardScore: 97.5 },
        { epoch: '16:00', timestamp: '1h ago', efficiency: 98.1, tokens: 10.5, errorRate: 0.2, rewardScore: 98.4 },
        { epoch: 'Current', timestamp: 'Just now', efficiency: baseReward, tokens: 8.8, errorRate: 0.1, rewardScore: baseReward }
      ];
    }

    if (timeframe === '7d') {
      return [
        { epoch: 'Day 1', timestamp: '7 days ago', efficiency: 83.4, tokens: 28.5, errorRate: 4.2, rewardScore: 84.1 },
        { epoch: 'Day 2', timestamp: '6 days ago', efficiency: 86.2, tokens: 24.1, errorRate: 3.1, rewardScore: 87.0 },
        { epoch: 'Day 3', timestamp: '5 days ago', efficiency: 89.8, tokens: 21.0, errorRate: 2.2, rewardScore: 90.3, heuristicDiscovered: 'Context window pruning (-28% token overhead)' },
        { epoch: 'Day 4', timestamp: '4 days ago', efficiency: 92.5, tokens: 17.6, errorRate: 1.4, rewardScore: 93.2 },
        { epoch: 'Day 5', timestamp: '3 days ago', efficiency: 95.1, tokens: 14.2, errorRate: 0.8, rewardScore: 95.6, heuristicDiscovered: 'Vector cache reuse on repetitive queries' },
        { epoch: 'Day 6', timestamp: 'Yesterday', efficiency: 97.4, tokens: 11.5, errorRate: 0.3, rewardScore: 97.8 },
        { epoch: 'Day 7', timestamp: 'Today', efficiency: baseReward, tokens: 9.2, errorRate: 0.1, rewardScore: baseReward }
      ];
    }

    if (timeframe === '30d') {
      return [
        { epoch: 'Wk 1', timestamp: '4 wks ago', efficiency: 74.5, tokens: 36.8, errorRate: 6.8, rewardScore: 75.0 },
        { epoch: 'Wk 2', timestamp: '3 wks ago', efficiency: 83.2, tokens: 26.4, errorRate: 3.9, rewardScore: 84.2, heuristicDiscovered: 'System prompt guardrail tightening' },
        { epoch: 'Wk 3', timestamp: '2 wks ago', efficiency: 91.8, tokens: 18.2, errorRate: 1.6, rewardScore: 92.1, heuristicDiscovered: 'Acyclic tool execution routing' },
        { epoch: 'Wk 4', timestamp: 'This week', efficiency: baseReward, tokens: 9.6, errorRate: 0.2, rewardScore: baseReward }
      ];
    }

    // All Epochs
    return [
      { epoch: 'Epoch 1', timestamp: 'Initial baseline', efficiency: 68.0, tokens: 42.0, errorRate: 9.4, rewardScore: 68.5 },
      { epoch: 'Epoch 25', timestamp: 'Cycle 25', efficiency: 79.4, tokens: 31.2, errorRate: 5.1, rewardScore: 80.2, heuristicDiscovered: 'Deterministic tool schema validation' },
      { epoch: 'Epoch 50', timestamp: 'Cycle 50', efficiency: 88.6, tokens: 21.5, errorRate: 2.3, rewardScore: 89.0, heuristicDiscovered: 'Brand voice embedding alignment check' },
      { epoch: 'Epoch 75', timestamp: 'Cycle 75', efficiency: 94.2, tokens: 14.8, errorRate: 0.9, rewardScore: 94.6 },
      { epoch: `Epoch ${cycle}`, timestamp: 'Current live', efficiency: baseReward, tokens: 8.8, errorRate: 0.1, rewardScore: baseReward }
    ];
  }, [timeframe, agent]);

  // Derived KPI calculations
  const firstPoint = telemetryData[0];
  const lastPoint = telemetryData[telemetryData.length - 1];
  const efficiencyDelta = +(lastPoint.efficiency - firstPoint.efficiency).toFixed(1);
  const tokenReductionPercent = Math.round(((firstPoint.tokens - lastPoint.tokens) / firstPoint.tokens) * 100);
  const errorReductionPercent = Math.round(((firstPoint.errorRate - lastPoint.errorRate) / firstPoint.errorRate) * 100);

  // Custom Dark Mode Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as TelemetryPoint;
      return (
        <div className="bg-[#0e1017] border border-white/15 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1.5">
            <span className="font-bold text-white uppercase">{label}</span>
            <span className="text-[10px] text-muted">{dataPoint.timestamp}</span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between gap-4 text-accent">
              <span>Agent Efficiency:</span>
              <strong className="text-white font-bold">{dataPoint.efficiency}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-cyan-400">
              <span>Token Consumption:</span>
              <strong className="text-white font-bold">{dataPoint.tokens}k tokens</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span>Error / Hallucination Rate:</span>
              <strong className="text-white font-bold">{dataPoint.errorRate}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-purple-400">
              <span>Self-Learning Reward:</span>
              <strong className="text-white font-bold">{dataPoint.rewardScore}/100</strong>
            </div>
          </div>

          {dataPoint.heuristicDiscovered && (
            <div className="mt-2 pt-2 border-t border-accent/20 text-[10px] text-amber-300 font-sans flex items-start gap-1">
              <Sparkles size={11} className="text-accent shrink-0 mt-0.5" />
              <span><strong>Heuristic Distilled:</strong> {dataPoint.heuristicDiscovered}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              Self-Learning Telemetry & Agent Efficiency Matrix
            </h4>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Real-time longitudinal performance tracking across epochs. Validates how self-learning reflection loops reduce token overhead and suppress errors.
          </p>
        </div>

        {/* Timeframe selector pills */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          {(['24h', '7d', '30d', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-2.5 py-1 rounded-lg uppercase transition-all font-bold",
                timeframe === tf
                  ? "bg-accent text-background amber-glow"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tf === 'all' ? 'All Epochs' : tf}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Efficiency Score */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-muted font-mono mb-2">
            <span>EFFICIENCY SCORE</span>
            <Activity size={14} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-white">{lastPoint.efficiency}%</span>
            <span className="text-xs font-mono text-green-400 font-bold flex items-center">
              <ArrowUpRight size={13} /> +{efficiencyDelta}%
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-sans">
            Reflects autonomous goal achievement without human intervention.
          </p>
        </div>

        {/* Metric 2: Token Consumption Reduction */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-muted font-mono mb-2">
            <span>AVG TOKEN VOLUME</span>
            <Cpu size={14} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-white">{lastPoint.tokens}k</span>
            <span className="text-xs font-mono text-green-400 font-bold flex items-center">
              <ArrowDownRight size={13} /> -{tokenReductionPercent}%
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-sans">
            Optimized system prompt weights reduce inference token burn.
          </p>
        </div>

        {/* Metric 3: Error & Hallucination Rate */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-muted font-mono mb-2">
            <span>ERROR / REJECTION RATE</span>
            <AlertTriangle size={14} className="text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-white">{lastPoint.errorRate}%</span>
            <span className="text-xs font-mono text-green-400 font-bold flex items-center">
              <ArrowDownRight size={13} /> -{errorReductionPercent}%
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-sans">
            Suppressed via automated Brand Vault vector alignment checks.
          </p>
        </div>

        {/* Metric 4: Learning Reward Score */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-muted font-mono mb-2">
            <span>LEARNING REWARD</span>
            <BrainCircuit size={14} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-black text-purple-300">{lastPoint.rewardScore}</span>
            <span className="text-xs font-mono text-muted">/ 100</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 font-sans">
            Reinforcement scalar calculated over {agent.learningProfile.heuristics.length} active heuristics.
          </p>
        </div>
      </div>

      {/* Chart 1: Efficiency & Reward Convergence Area Chart */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Self-Learning Convergence Curve (Efficiency % vs. Reward Signal)
            </h5>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>Efficiency Index</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Learning Reward</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="efficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis 
                dataKey="epoch" 
                stroke="#71717A" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                domain={[60, 100]} 
                stroke="#71717A" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={95} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Target 95%', fill: '#10B981', fontSize: 9, position: 'right' }} />
              <Area 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#F59E0B" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#efficiencyGrad)" 
                name="Efficiency"
              />
              <Area 
                type="monotone" 
                dataKey="rewardScore" 
                stroke="#A855F7" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#rewardGrad)" 
                name="Reward Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Dual-Axis Chart: Token Consumption vs. Error Rate Inversion */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Compute Optimization: Token Consumption (k) vs. Error Rate Decay (%)
            </h5>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span>Token Volume (k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Error Rate (%)</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis 
                dataKey="epoch" 
                stroke="#71717A" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                yAxisId="left" 
                stroke="#06B6D4" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(v) => `${v}k`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#F43F5E" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                yAxisId="left" 
                dataKey="tokens" 
                fill="#06B6D4" 
                opacity={0.7} 
                radius={[4, 4, 0, 0]} 
                name="Tokens (k)"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="errorRate" 
                stroke="#F43F5E" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#F43F5E' }} 
                name="Error Rate (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heuristic Distillation Impact Summary */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-accent" />
            <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Distilled Heuristics & Quantified Performance Lift
            </h5>
          </div>
          <span className="text-[10px] font-mono text-muted">
            {agent.learningProfile.heuristics.length} Rules Enforced
          </span>
        </div>

        <div className="space-y-2">
          {agent.learningProfile.heuristics.map((h, i) => (
            <div 
              key={h.id || i}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-accent/10 border border-accent/20 text-accent font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                  #{i + 1}
                </span>
                <div>
                  <div className="text-zinc-200 font-sans leading-snug">{h.rule}</div>
                  <div className="text-[10px] text-muted mt-1 flex items-center gap-2 font-mono">
                    <span className="uppercase text-accent">{h.category}</span>
                    <span>•</span>
                    <span>Discovered {h.discoveredAt}</span>
                    <span>•</span>
                    <span>Confidence: {(h.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-[11px] font-bold shrink-0 self-start sm:self-center">
                {h.impactDelta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
