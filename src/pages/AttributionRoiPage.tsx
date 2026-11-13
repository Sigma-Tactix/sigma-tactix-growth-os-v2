import { isDemoSeedEnabled } from '@/src/lib/demoSeed';
import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Sliders, 
  AlertTriangle,
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import AgentRunResults, { AgentRunRecord } from '@/src/components/AgentRunResults';
import { GlassCard, Button, Badge, MetricWidget, EmptyState } from '@/src/components/ui';

interface ChannelAttribution {
  channel: string;
  adSpend: number;
  reportedCAC: number;
  blendedCAC: number;
  dealsClosed: number;
  revenueGenerated: number;
  mer: number;
  attributionShare: number;
}

const DEMO_CHANNEL_DATA: ChannelAttribution[] = [
  {
    channel: 'LinkedIn Paid Media',
    adSpend: 18500,
    reportedCAC: 1850,
    blendedCAC: 1420,
    dealsClosed: 13,
    revenueGenerated: 156000,
    mer: 8.43,
    attributionShare: 32
  },
  {
    channel: 'Google Search & Intent',
    adSpend: 14200,
    reportedCAC: 940,
    blendedCAC: 1280,
    dealsClosed: 11,
    revenueGenerated: 132000,
    mer: 9.29,
    attributionShare: 27
  },
  {
    channel: 'Organic SEO & AEO Citations',
    adSpend: 3500,
    reportedCAC: 380,
    blendedCAC: 410,
    dealsClosed: 9,
    revenueGenerated: 108000,
    mer: 30.85,
    attributionShare: 22
  },
  {
    channel: 'Outbound & Cold ABM',
    adSpend: 4200,
    reportedCAC: 700,
    blendedCAC: 840,
    dealsClosed: 5,
    revenueGenerated: 60000,
    mer: 14.28,
    attributionShare: 12
  },
  {
    channel: 'Dark Social & Referral',
    adSpend: 0,
    reportedCAC: 0,
    blendedCAC: 0,
    dealsClosed: 3,
    revenueGenerated: 36000,
    mer: 99.0,
    attributionShare: 7
  }
];

// Derived rollups guard against a zero-spend (non-demo) tenant: with no
// connected channel data every metric reports "not measured" instead of NaN,
// and no fabricated run history is seeded.
function buildRunRecord(id: string, modelLabel: string, totalSpend: number, totalRevenue: number, totalDeals: number): AgentRunRecord {
  const hasData = totalSpend > 0 || totalDeals > 0;
  const blendedCAC = hasData && totalDeals > 0 ? Math.round(totalSpend / totalDeals) : null;
  const mer = hasData && totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : null;
  return {
    id,
    agentName: 'Attribution Telemetry Swarm',
    agentRole: 'Sovereign Multi-Touch Attribution Engine',
    timestamp: 'Just now',
    status: hasData ? 'SUCCESS' : 'PARTIAL',
    moduleOrigin: 'Attribution & Marketing ROI Command',
    inputSummary: `Recalculated with model: ${modelLabel}`,
    outputSummary: hasData
      ? `De-duplicated pipeline across ${totalDeals} closed deals. Blended CAC: $${blendedCAC}. MER: ${mer}x.`
      : 'No channel spend or revenue is connected to this workspace — nothing to de-duplicate yet.',
    fullOutput: hasData
      ? `Model: ${modelLabel}\nOverall Blended CAC: $${blendedCAC}\nTotal MER: ${mer}x`
      : `Model: ${modelLabel}\nOverall Blended CAC: not measured\nTotal MER: not measured`,
    metrics: hasData
      ? [
          { label: 'Model', value: modelLabel },
          { label: 'Blended CAC', value: `$${blendedCAC}` },
          { label: 'MER', value: `${mer}x` }
        ]
      : [
          { label: 'Model', value: modelLabel },
          { label: 'Blended CAC', value: 'Not measured' },
          { label: 'MER', value: 'Not measured' }
        ]
  };
}

export default function AttributionRoiPage() {
  const { notifySuccess, notifyInfo } = useToast();
  const [model, setModel] = useState<'SOVEREIGN_W_SHAPED' | 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR'>('SOVEREIGN_W_SHAPED');
  const [isRecomputing, setIsRecomputing] = useState(false);

  const totalSpend = CHANNEL_DATA.reduce((acc, c) => acc + c.adSpend, 0);
  const totalRevenue = CHANNEL_DATA.reduce((acc, c) => acc + c.revenueGenerated, 0);
  const totalDeals = CHANNEL_DATA.reduce((acc, c) => acc + c.dealsClosed, 0);
  const hasChannelData = totalSpend > 0 || totalDeals > 0;
  const overallBlendedCAC = hasChannelData && totalDeals > 0 ? Math.round(totalSpend / totalDeals) : null;
  const overallMER = hasChannelData && totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : null;

  // Run history starts empty; a seed record is only shown when demo channel
  // data is actually present, and it is labelled as a seeded sample.
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>(() =>
    hasChannelData
      ? [
          {
            id: 'run-att-01',
            agentName: 'Attribution Telemetry Swarm',
            agentRole: 'Sovereign Multi-Touch Attribution Engine',
            timestamp: 'Today at 05:10 AM',
            status: 'SUCCESS',
            moduleOrigin: 'Attribution & Marketing ROI Command',
            inputSummary: 'Attribution Model: Sovereign W-Shaped (Anti-Double Count)',
            outputSummary: `Seeded demo sample: de-duplicated 7 overlapping conversions. Blended CAC: $${overallBlendedCAC}. MER: ${overallMER}x.`,
            fullOutput: JSON.stringify(CHANNEL_DATA, null, 2),
            metrics: [
              { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k` },
              { label: 'Blended CAC', value: `$${overallBlendedCAC}` },
              { label: 'Overall MER', value: `${overallMER}x` },
              { label: 'Data source', value: 'Demo seed (sample)' }
            ]
          }
        ]
      : []
  );

  const handleRecompute = () => {
    setIsRecomputing(true);
    setTimeout(() => {
      setIsRecomputing(false);

      const newRun = buildRunRecord(`run-att-${Date.now()}`, model, totalSpend, totalRevenue, totalDeals);
      setRunHistory(prev => [newRun, ...prev]);
      if (hasChannelData) {
        notifySuccess('Attribution Recalculated', 'De-duplicated platform double counting across connected channels.');
      } else {
        notifyInfo('Nothing to Recalculate', 'No channel spend or revenue is connected yet — the run was logged with "not measured" results.');
      }
    }, 1100);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div data-tutorial-id="tut-attribution-dashboard" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="vermilion">INTELLIGENCE LAYER</Badge>
              <span className="text-muted text-xs">•</span>
              <Badge variant="neutral">SOVEREIGN ATTRIBUTION</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Attribution & Blended CAC Command
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl leading-relaxed">
              De-duplicate ad network double counting, track sovereign Blended CAC, and measure true Marketing Efficiency Ratio (MER).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleRecompute}
              disabled={isRecomputing}
              leftIcon={<Sparkles className={cn("w-4 h-4", isRecomputing && "animate-spin")} />}
            >
              {isRecomputing ? 'Recalculating...' : 'Recalculate Multi-Touch Attribution'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Blended Customer Acquisition Cost"
          value={hasChannelData ? `$${overallBlendedCAC}` : 'Not measured'}
          delta={hasChannelData ? { value: "18.4% lower", trend: "up" } : undefined}
          subtext={hasChannelData ? "vs last-click estimate" : "No connected channel spend"}
          icon={<DollarSign className="w-4 h-4 text-emerald-accent" />}
        />

        <MetricWidget
          label="Marketing Efficiency Ratio (MER)"
          value={hasChannelData ? `${overallMER}x` : 'Not measured'}
          delta={hasChannelData ? { value: "Healthy", trend: "up" } : undefined}
          subtext={hasChannelData ? `$${(totalRevenue / 1000).toFixed(0)}k Rev / $${(totalSpend / 1000).toFixed(1)}k Spend` : 'No connected revenue'}
          icon={<TrendingUp className="w-4 h-4 text-cyan-accent" />}
        />

        <MetricWidget
          label="Total Closed Deals"
          value={hasChannelData ? `${totalDeals} Enterprise Deals` : '0 Deals'}
          subtext={hasChannelData ? "De-duplicated across all channels" : "No pipeline connected yet"}
          icon={<CheckCircle2 className="w-4 h-4 text-blue-accent" />}
        />

        <MetricWidget
          label="Dark Social Contribution"
          value={hasChannelData ? "29% of Pipeline" : "Not measured"}
          delta={hasChannelData ? { value: "High Intent", trend: "up" } : undefined}
          subtext={hasChannelData ? "Originally misattributed to Brand Search" : "Requires connected ad data"}
          icon={<Info className="w-4 h-4 text-amber-accent" />}
        />
      </div>

      {/* Attribution Model Selector & Breakdown Table */}
      <GlassCard elevation="flat" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sigma-border)] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--sigma-text)]">Channel ROI & Payback Telemetry</h3>
            <p className="text-xs text-muted mt-0.5">Empirical comparison between ad platform claims and real sovereign cash flow.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!hasChannelData && (
              <Badge variant="neutral" size="xs">ZERO SPEND — no connected ad data</Badge>
            )}
            <span className="text-xs text-muted">Attribution Model:</span>
            <select
              value={model}
              onChange={e => setModel(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-vermilion)]/50"
            >
              <option value="SOVEREIGN_W_SHAPED">Sovereign W-Shaped (Recommended)</option>
              <option value="FIRST_TOUCH">First-Touch (Discovery Bias)</option>
              <option value="LAST_TOUCH">Last-Touch (Traditional Retainer)</option>
              <option value="LINEAR">Linear Multi-Touch</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {hasChannelData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--sigma-border)] text-muted uppercase tracking-wider text-[11px] font-mono">
                  <th className="pb-3 font-semibold">Growth Channel</th>
                  <th className="pb-3 font-semibold">Total Spend</th>
                  <th className="pb-3 font-semibold">Platform Claimed CAC</th>
                  <th className="pb-3 font-semibold">True Blended CAC</th>
                  <th className="pb-3 font-semibold">Deals Closed</th>
                  <th className="pb-3 font-semibold">Closed Revenue</th>
                  <th className="pb-3 font-semibold text-right">MER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sigma-border)] font-mono">
                {CHANNEL_DATA.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--sigma-surface-subtle)]/50 transition-colors">
                    <td className="py-3.5 font-sans font-medium text-[var(--sigma-text-soft)]">{item.channel}</td>
                    <td className="py-3.5 text-muted">${item.adSpend.toLocaleString()}</td>
                    <td className="py-3.5 text-muted line-through">${item.reportedCAC.toLocaleString()}</td>
                    <td className="py-3.5 font-bold text-emerald-accent">${item.blendedCAC.toLocaleString()}</td>
                    <td className="py-3.5 text-[var(--sigma-text-soft)]">{item.dealsClosed}</td>
                    <td className="py-3.5 font-bold text-[var(--sigma-text)]">${item.revenueGenerated.toLocaleString()}</td>
                    <td className="py-3.5 text-right font-bold text-cyan-accent">{item.mer.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<PieChart className="w-5 h-5" />}
            title="No channel attribution data connected"
            description="Spend, CAC and MER rollups will appear here once an ad network or CRM pipeline reports to this workspace. Until then every metric stays 'not measured' rather than estimated."
          />
        )}
      </GlassCard>

      {/* Agent Run Results */}
      <div className="mt-10">
        <AgentRunResults
          records={runHistory}
          title="Attribution Swarm Telemetry Runs"
          description="Real-time multi-touch attribution calculations and platform discrepancy logs."
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
const CHANNEL_DATA = isDemoSeedEnabled() ? DEMO_CHANNEL_DATA : [];

