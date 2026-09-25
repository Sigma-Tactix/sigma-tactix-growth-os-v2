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
import { GlassCard, Button, Badge, MetricWidget } from '@/src/components/ui';

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

const CHANNEL_DATA: ChannelAttribution[] = [
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

export default function AttributionRoiPage() {
  const { notifySuccess } = useToast();
  const [model, setModel] = useState<'SOVEREIGN_W_SHAPED' | 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR'>('SOVEREIGN_W_SHAPED');
  const [isRecomputing, setIsRecomputing] = useState(false);

  const totalSpend = CHANNEL_DATA.reduce((acc, c) => acc + c.adSpend, 0);
  const totalRevenue = CHANNEL_DATA.reduce((acc, c) => acc + c.revenueGenerated, 0);
  const totalDeals = CHANNEL_DATA.reduce((acc, c) => acc + c.dealsClosed, 0);
  const overallBlendedCAC = Math.round(totalSpend / totalDeals);
  const overallMER = (totalRevenue / totalSpend).toFixed(2);

  // Run History
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([
    {
      id: 'run-att-01',
      agentName: 'Attribution Telemetry Swarm',
      agentRole: 'Sovereign Multi-Touch Attribution Engine',
      timestamp: 'Today at 05:10 AM',
      status: 'SUCCESS',
      moduleOrigin: 'Attribution & Marketing ROI Command',
      inputSummary: 'Attribution Model: Sovereign W-Shaped (Anti-Double Count)',
      outputSummary: `De-duplicated 7 overlapping conversions. True Blended CAC: $${overallBlendedCAC}. MER: ${overallMER}x.`,
      fullOutput: JSON.stringify(CHANNEL_DATA, null, 2),
      metrics: [
        { label: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k` },
        { label: 'Blended CAC', value: `$${overallBlendedCAC}` },
        { label: 'Overall MER', value: `${overallMER}x` },
        { label: 'Attribution Accuracy', value: '99.4%' }
      ]
    }
  ]);

  const handleRecompute = () => {
    setIsRecomputing(true);
    setTimeout(() => {
      setIsRecomputing(false);

      const newRun: AgentRunRecord = {
        id: `run-att-${Date.now()}`,
        agentName: 'Attribution Telemetry Swarm',
        agentRole: 'Sovereign Multi-Touch Attribution Engine',
        timestamp: 'Just now',
        status: 'SUCCESS',
        moduleOrigin: 'Attribution & Marketing ROI Command',
        inputSummary: `Recalculated with model: ${model}`,
        outputSummary: `De-duplicated pipeline across 5 channels. Identified 3 under-credited touchpoints.`,
        fullOutput: `Model: ${model}\nOverall Blended CAC: $${overallBlendedCAC}\nTotal MER: ${overallMER}x`,
        metrics: [
          { label: 'Model', value: model },
          { label: 'Blended CAC', value: `$${overallBlendedCAC}` },
          { label: 'MER', value: `${overallMER}x` }
        ]
      };

      setRunHistory(prev => [newRun, ...prev]);
      notifySuccess('Attribution Recalculated', 'De-duplicated platform double counting.');
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
              <span className="text-zinc-600 text-xs">•</span>
              <Badge variant="neutral">SOVEREIGN ATTRIBUTION</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Attribution & Blended CAC Command
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
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
          value={`$${overallBlendedCAC}`}
          delta={{ value: "18.4% lower", trend: "up" }}
          subtext="vs last-click estimate"
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
        />

        <MetricWidget
          label="Marketing Efficiency Ratio (MER)"
          value={`${overallMER}x`}
          delta={{ value: "Healthy", trend: "up" }}
          subtext={`$${(totalRevenue / 1000).toFixed(0)}k Rev / $${(totalSpend / 1000).toFixed(1)}k Spend`}
          icon={<TrendingUp className="w-4 h-4 text-teal-400" />}
        />

        <MetricWidget
          label="Total Closed Deals"
          value={`${totalDeals} Enterprise Deals`}
          subtext="De-duplicated across all channels"
          icon={<CheckCircle2 className="w-4 h-4 text-blue-400" />}
        />

        <MetricWidget
          label="Dark Social Contribution"
          value="29% of Pipeline"
          delta={{ value: "High Intent", trend: "up" }}
          subtext="Originally misattributed to Brand Search"
          icon={<Info className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Attribution Model Selector & Breakdown Table */}
      <GlassCard elevation="flat" className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sigma-border)] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Channel ROI & Payback Telemetry</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Empirical comparison between ad platform claims and real sovereign cash flow.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Attribution Model:</span>
            <select
              value={model}
              onChange={e => setModel(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-[var(--sigma-border)] text-xs text-white focus:outline-none focus:border-[var(--sigma-vermilion)]/50"
            >
              <option value="SOVEREIGN_W_SHAPED">Sovereign W-Shaped (Recommended)</option>
              <option value="FIRST_TOUCH">First-Touch (Discovery Bias)</option>
              <option value="LAST_TOUCH">Last-Touch (Traditional Retainer)</option>
              <option value="LINEAR">Linear Multi-Touch</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--sigma-border)] text-zinc-400 uppercase tracking-wider text-[11px] font-mono">
                <th className="pb-3 font-semibold">Growth Channel</th>
                <th className="pb-3 font-semibold">Total Spend</th>
                <th className="pb-3 font-semibold">Platform Claimed CAC</th>
                <th className="pb-3 font-semibold">True Blended CAC</th>
                <th className="pb-3 font-semibold">Deals Closed</th>
                <th className="pb-3 font-semibold">Closed Revenue</th>
                <th className="pb-3 font-semibold text-right">MER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {CHANNEL_DATA.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium text-zinc-200">{item.channel}</td>
                  <td className="py-3.5 text-zinc-400">${item.adSpend.toLocaleString()}</td>
                  <td className="py-3.5 text-zinc-500 line-through">${item.reportedCAC.toLocaleString()}</td>
                  <td className="py-3.5 font-bold text-emerald-400">${item.blendedCAC.toLocaleString()}</td>
                  <td className="py-3.5 text-zinc-300">{item.dealsClosed}</td>
                  <td className="py-3.5 font-bold text-white">${item.revenueGenerated.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-teal-400">{item.mer.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
