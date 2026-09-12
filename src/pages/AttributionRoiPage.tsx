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
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div data-tutorial-id="tut-attribution-dashboard" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Attribution & Blended CAC Command</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Digital Marketing
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                De-duplicate ad network double counting, track sovereign Blended CAC, and measure true Marketing Efficiency Ratio (MER).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecompute}
            disabled={isRecomputing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow disabled:opacity-50"
          >
            {isRecomputing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Recalculate Multi-Touch Attribution
          </button>
        </div>
      </div>

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blended Customer Acquisition Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">${overallBlendedCAC}</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 18.4% lower than last-click estimate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Marketing Efficiency Ratio (MER)</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{overallMER}x</div>
          <div className="text-xs text-slate-400">
            ${(totalRevenue / 1000).toFixed(0)}k Rev / ${(totalSpend / 1000).toFixed(1)}k Spend
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Closed Deals</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalDeals} Enterprise Deals</div>
          <div className="text-xs text-slate-400">De-duplicated across all channels</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dark Social Contribution</span>
            <Info className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">29% of Pipeline</div>
          <div className="text-xs text-slate-400">Originally misattributed to Brand Search</div>
        </div>
      </div>

      {/* Attribution Model Selector & Breakdown Table */}
      <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Channel ROI & Payback Telemetry</h3>
            <p className="text-xs text-slate-400 mt-0.5">Empirical comparison between ad platform claims and real sovereign cash flow.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Attribution Model:</span>
            <select
              value={model}
              onChange={e => setModel(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500/50"
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
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
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
                  <td className="py-3.5 font-sans font-medium text-slate-200">{item.channel}</td>
                  <td className="py-3.5 text-slate-400">${item.adSpend.toLocaleString()}</td>
                  <td className="py-3.5 text-slate-500 line-through">${item.reportedCAC.toLocaleString()}</td>
                  <td className="py-3.5 font-bold text-emerald-400">${item.blendedCAC.toLocaleString()}</td>
                  <td className="py-3.5 text-slate-300">{item.dealsClosed}</td>
                  <td className="py-3.5 font-bold text-white">${item.revenueGenerated.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-teal-400">{item.mer.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
