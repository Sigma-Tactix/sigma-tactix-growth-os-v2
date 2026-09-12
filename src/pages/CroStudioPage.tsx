import React, { useState } from 'react';
import { 
  Target, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Layers, 
  MousePointer, 
  ShieldCheck, 
  Zap,
  BarChart,
  SplitSquareVertical
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';

interface AbVariant {
  id: string;
  badge: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  predictedLift: string;
  confidenceScore: string;
}

const INITIAL_VARIANTS: AbVariant[] = [
  {
    id: 'var-a',
    badge: 'Control (Direct Value)',
    headline: 'Stop Renting Your Growth. Deploy an AI-Native Growth OS.',
    subheadline: 'Replace fragile agency retainers with sovereign intelligence and autonomous marketing execution.',
    ctaText: 'Run Your Free Diagnostic',
    predictedLift: '+0.0%',
    confidenceScore: 'Baseline'
  },
  {
    id: 'var-b',
    badge: 'Challenger 1 (Pain-Agitation)',
    headline: 'Your Agency Retainer is Leaking 38% of Your Pipeline.',
    subheadline: 'Junior staff turn over every 9 months. With them goes your context. Install permanent institutional memory.',
    ctaText: 'Expose Your Funnel Leaks',
    predictedLift: '+28.4%',
    confidenceScore: '94% Probability'
  },
  {
    id: 'var-c',
    badge: 'Challenger 2 (First-Principles Tech)',
    headline: 'Autonomous AI Growth Infrastructure for Venture-Backed B2B.',
    subheadline: '10 permissioned vaults. Scoped agent swarms. Zero headcount inflation.',
    ctaText: 'Explore Architecture',
    predictedLift: '+19.2%',
    confidenceScore: '89% Probability'
  }
];

export default function CroStudioPage() {
  const { notifySuccess, notifyError } = useToast();
  const [pageUrl, setPageUrl] = useState('https://sigmatactix.com');
  const [variants, setVariants] = useState<AbVariant[]>(INITIAL_VARIANTS);
  const [selectedVariant, setSelectedVariant] = useState<string>('var-b');
  const [isAuditing, setIsAuditing] = useState(false);

  // Funnel Friction Simulation State
  const [trafficVolume, setTrafficVolume] = useState<number>(25000);
  const [heroConversion, setHeroConversion] = useState<number>(4.2);
  const [formCompletion, setFormCompletion] = useState<number>(35.0);
  const [qualifiedRate, setQualifiedRate] = useState<number>(55.0);

  // Agent Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-cro-01',
      agentName: 'CRO Funnel Agent',
      agentRole: 'Conversion Rate Architect & A/B Experimenter',
      timestamp: 'Today at 05:05 AM',
      status: 'SUCCESS',
      moduleOrigin: 'CRO & Landing Page Studio',
      inputSummary: 'URL: sigmatactix.com (Full-page audit & A/B synthesis)',
      outputSummary: 'Diagnosed 3 friction bottlenecks. Synthesized 2 high-converting challenger variants.',
      fullOutput: JSON.stringify(INITIAL_VARIANTS, null, 2),
      metrics: [
        { label: 'Current Conversion', value: '4.2%' },
        { label: 'Projected Conversion', value: '5.8%' },
        { label: 'Expected Pipeline Lift', value: '+$142k/mo' },
        { label: 'Friction Score', value: 'Low' }
      ]
    }
  ]);

  const handleAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);

      const newRun: AgentRunRecord = {
        id: `run-cro-${Date.now()}`,
        agentName: 'CRO Funnel Agent',
        agentRole: 'Conversion Rate Architect & A/B Experimenter',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'CRO & Landing Page Studio',
        inputSummary: `Audited ${pageUrl}`,
        outputSummary: 'Completed full-page heuristic evaluation and generated friction score.',
        fullOutput: `URL: ${pageUrl}\nCalculated Pipeline Opportunity: +$142,000 ARR`,
        metrics: [
          { label: 'Audited URL', value: pageUrl },
          { label: 'Speed Score', value: '98/100' },
          { label: 'Clarity Index', value: '96/100' }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('CRO Audit Complete', 'Heuristic teardown and copy variants refreshed.');
    }, 1300);
  };

  // Funnel calculations
  const totalLeads = Math.round(trafficVolume * (heroConversion / 100));
  const completedForms = Math.round(totalLeads * (formCompletion / 100));
  const qualifiedOps = Math.round(completedForms * (qualifiedRate / 100));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">CRO & Landing Page Studio</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Optimize conversion funnels, test high-impact headline variants, and eliminate pipeline friction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            Empirical Lift Predictor Active
          </div>
        </div>
      </div>

      {/* URL Audit Bar */}
      <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Target Page:</span>
          <input
            type="text"
            value={pageUrl}
            onChange={e => setPageUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button
          onClick={handleAudit}
          disabled={isAuditing}
          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow shrink-0 disabled:opacity-50"
        >
          {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run CRO Teardown
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: A/B Headline Variants */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-orange-400" />
              Above-the-Fold A/B Value Proposition Variants
            </h3>
            <span className="text-xs text-slate-400">{variants.length} Variants Generated</span>
          </div>

          <div className="space-y-3">
            {variants.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={cn(
                  "p-5 rounded-2xl border text-left cursor-pointer transition-all space-y-3",
                  selectedVariant === v.id
                    ? "bg-orange-500/10 border-orange-500/50 text-white shadow-lg shadow-orange-500/5"
                    : "bg-[#0F0F12] border-white/10 text-slate-300 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                    {v.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">{v.predictedLift}</span>
                    <span className="text-[10px] text-slate-500">({v.confidenceScore})</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">{v.headline}</h4>
                  <p className="text-xs text-slate-400 mt-1">{v.subheadline}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">CTA Button:</span>
                    <span className="font-semibold text-orange-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {v.ctaText}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${v.headline}\n${v.subheadline}\nCTA: ${v.ctaText}`);
                      notifySuccess('Copied', 'Variant copy copied to clipboard.');
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Funnel Drop-off Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart className="w-4 h-4 text-orange-400" />
                Funnel Conversion Simulator
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">Interactive</span>
            </div>

            {/* Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5 text-slate-300">
                  <span>Monthly Unique Visitors</span>
                  <span className="font-mono text-white font-bold">{trafficVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={2500}
                  value={trafficVolume}
                  onChange={e => setTrafficVolume(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-slate-300">
                  <span>Hero CTA Conversion Rate</span>
                  <span className="font-mono text-orange-400 font-bold">{heroConversion}%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={12.0}
                  step={0.2}
                  value={heroConversion}
                  onChange={e => setHeroConversion(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5 text-slate-300">
                  <span>Demo Form Completion Rate</span>
                  <span className="font-mono text-amber-400 font-bold">{formCompletion}%</span>
                </div>
                <input
                  type="range"
                  min={10.0}
                  max={70.0}
                  step={1.0}
                  value={formCompletion}
                  onChange={e => setFormCompletion(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>

            {/* Funnel Output Summary */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Simulated Enterprise Pipeline
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] text-slate-400">Total Leads</div>
                  <div className="font-mono font-bold text-white text-base">{totalLeads}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] text-slate-400">Demos Booked</div>
                  <div className="font-mono font-bold text-orange-400 text-base">{completedForms}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] text-slate-400">SQL Ops</div>
                  <div className="font-mono font-bold text-emerald-400 text-base">{qualifiedOps}</div>
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
          title="CRO Execution & Experiment Logs"
          description="Log of landing page teardowns, A/B test variations, and conversion lift projections."
          onClear={() => setRunHistory([])}
        />
      </div>
    </div>
  );
}
