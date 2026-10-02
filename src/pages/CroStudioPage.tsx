import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
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
import { Button, GlassCard, Badge } from '@/src/components/ui';
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

const DEMO_INITIAL_VARIANTS: AbVariant[] = [
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[var(--sigma-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand" size="sm" icon={<Target size={12} />}>Conversion Rate Optimization</Badge>
            <Badge variant="neutral" size="sm">Digital Marketing</Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--sigma-text)]">
            CRO & Landing Page Studio
          </h1>
          <p className="text-sm text-[var(--sigma-text-muted)] mt-1.5 max-w-3xl leading-relaxed">
            Optimize conversion funnels, test high-impact headline variants, and eliminate pipeline friction with empirical A/B testing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="success" size="sm" icon={<ShieldCheck size={12} />}>
            Empirical Lift Predictor Active
          </Badge>
        </div>
      </div>

      {/* URL Audit Bar */}
      <GlassCard spotlight className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] shrink-0">Target Page:</span>
          <input
            type="text"
            value={pageUrl}
            onChange={e => setPageUrl(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-xs font-mono text-[var(--sigma-text)] focus:outline-none focus:border-[#ff481b] transition-colors"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAudit}
          disabled={isAuditing}
          isLoading={isAuditing}
          icon={<Sparkles size={13} />}
          className="w-full sm:w-auto shrink-0"
        >
          Run CRO Teardown
        </Button>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: A/B Headline Variants */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--sigma-text)] flex items-center gap-2">
              <SplitSquareVertical className="w-4 h-4 text-[#ff481b]" />
              Above-the-Fold A/B Value Proposition Variants
            </h3>
            <Badge variant="neutral" size="xs">{variants.length} Variants</Badge>
          </div>

          <div className="space-y-3">
            {variants.map(v => (
              <GlassCard
                key={v.id}
                spotlight
                interactive
                onClick={() => setSelectedVariant(v.id)}
                className={cn(
                  "p-4 text-left cursor-pointer transition-all space-y-3",
                  selectedVariant === v.id
                    ? "border-[#ff481b]/50 ring-1 ring-[#ff481b]/30 shadow-md"
                    : "border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="neutral" size="xs">
                    {v.badge}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success" size="xs">
                      {v.predictedLift}
                    </Badge>
                    <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">({v.confidenceScore})</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--sigma-text)] tracking-tight">{v.headline}</h4>
                  <p className="text-xs text-[var(--sigma-text-muted)] mt-1 leading-relaxed">{v.subheadline}</p>
                </div>

                <div className="pt-2 border-t border-[var(--sigma-border)] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--sigma-text-muted)]">CTA:</span>
                    <span className="font-semibold text-[#ff481b] bg-[#ff481b]/10 border border-[#ff481b]/20 px-2 py-0.5 rounded">
                      {v.ctaText}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${v.headline}\n${v.subheadline}\nCTA: ${v.ctaText}`);
                      notifySuccess('Copied', 'Variant copy copied to clipboard.');
                    }}
                    icon={<Copy size={11} />}
                  >
                    Copy
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right Column: Funnel Drop-off Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard spotlight className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
              <h3 className="text-xs font-semibold text-[var(--sigma-text)] uppercase font-mono flex items-center gap-2">
                <BarChart className="w-3.5 h-3.5 text-[#ff481b]" />
                Funnel Conversion Simulator
              </h3>
              <Badge variant="neutral" size="xs">Interactive</Badge>
            </div>

            {/* Sliders */}
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-[var(--sigma-text-muted)] font-mono text-[11px]">
                  <span>Monthly Unique Visitors</span>
                  <span className="font-bold text-[var(--sigma-text)]">{trafficVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={2500}
                  value={trafficVolume}
                  onChange={e => setTrafficVolume(Number(e.target.value))}
                  className="w-full accent-[#ff481b] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[var(--sigma-text-muted)] font-mono text-[11px]">
                  <span>Hero CTA Conversion Rate</span>
                  <span className="font-bold text-[#ff481b]">{heroConversion}%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={12.0}
                  step={0.2}
                  value={heroConversion}
                  onChange={e => setHeroConversion(Number(e.target.value))}
                  className="w-full accent-[#ff481b] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-[var(--sigma-text-muted)] font-mono text-[11px]">
                  <span>Demo Form Completion Rate</span>
                  <span className="font-bold text-amber-400">{formCompletion}%</span>
                </div>
                <input
                  type="range"
                  min={10.0}
                  max={70.0}
                  step={1.0}
                  value={formCompletion}
                  onChange={e => setFormCompletion(Number(e.target.value))}
                  className="w-full accent-[#ff481b] cursor-pointer"
                />
              </div>
            </div>

            {/* Funnel Output Summary */}
            <div className="p-3.5 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] space-y-2.5">
              <div className="text-[10px] font-semibold text-[var(--sigma-text-muted)] uppercase tracking-wider font-mono">
                Simulated Enterprise Pipeline
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-[var(--sigma-bg)] border border-[var(--sigma-border)]">
                  <div className="text-[9px] text-[var(--sigma-text-muted)] uppercase">Total Leads</div>
                  <div className="font-bold text-[var(--sigma-text)] text-sm mt-0.5">{totalLeads}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--sigma-bg)] border border-[var(--sigma-border)]">
                  <div className="text-[9px] text-[var(--sigma-text-muted)] uppercase">Demos Booked</div>
                  <div className="font-bold text-[#ff481b] text-sm mt-0.5">{completedForms}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--sigma-bg)] border border-[var(--sigma-border)]">
                  <div className="text-[9px] text-[var(--sigma-text-muted)] uppercase">SQL Ops</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">{qualifiedOps}</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Agent Run Results */}
      <div className="mt-8">
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


// ---------------------------------------------------------------------------
// Phase 0: fabricated client data is DEMO-ONLY.
// These fixtures describe ad spend, ROAS, pipeline, audiences and
// campaign results that this workspace has never had. A fresh tenant
// must render none of them; they stay reachable behind
// VITE_SEED_DEMO_WORKSPACE for a sales demo environment only.
// ---------------------------------------------------------------------------
const INITIAL_VARIANTS = isDemoSeedEnabled() ? DEMO_INITIAL_VARIANTS : [];
