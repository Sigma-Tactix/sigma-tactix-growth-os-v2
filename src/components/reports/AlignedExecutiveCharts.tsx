import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Maximize2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Globe,
  Users,
  Target,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Tabs } from '@/src/components/ui';
import {
  REVENUE_TIMELINE_SERIES,
  CHANNEL_SHARE_DONUT_DATA
} from '@/src/data/executiveReportsData';

interface AlignedExecutiveChartsProps {
  layoutMode?: 'grid' | 'executive';
  className?: string;
  templateId?: string;
}

// ---------------------------------------------------------
// TEMPLATE 1: OMNICHANNEL GROWTH DATA
// ---------------------------------------------------------
const OMNI_TIMELINE = REVENUE_TIMELINE_SERIES;
const OMNI_DONUT = CHANNEL_SHARE_DONUT_DATA;
const OMNI_PACING = [
  { label: 'Google PMax', actual: 12.11, target: 25.0, diff: '+51.5%', metric: '$', note: 'Search & Shopping' },
  { label: 'Meta Social', actual: 26.30, target: 30.0, diff: '+12.3%', metric: '$', note: 'Reels & Feed' },
  { label: 'LinkedIn ABM', actual: 61.70, target: 75.0, diff: '+17.7%', metric: '$', note: 'Sponsored InMail' },
  { label: 'Organic SEO', actual: 3.59, target: 15.0, diff: '+76.0%', metric: '$', note: 'Content Ingestion' },
  { label: 'Email Nurture', actual: 3.87, target: 10.0, diff: '+61.3%', metric: '$', note: 'Automated Flows' }
];

// ---------------------------------------------------------
// TEMPLATE 2: PAID ACQUISITION & MEDIA MIX DATA
// ---------------------------------------------------------
const PAID_TIMELINE = [
  { date: 'W1', revenue: 64200, adSpend: 15800, roas: 4.06, cpc: 1.84 },
  { date: 'W2', revenue: 78500, adSpend: 17200, roas: 4.56, cpc: 1.62 },
  { date: 'W3', revenue: 91400, adSpend: 19400, roas: 4.71, cpc: 1.48 },
  { date: 'W4', revenue: 104200, adSpend: 21100, roas: 4.93, cpc: 1.34 },
  { date: 'W5', revenue: 118400, adSpend: 23600, roas: 5.01, cpc: 1.28 },
  { date: 'W6', revenue: 138600, adSpend: 26150, roas: 5.29, cpc: 1.22 }
];

const PAID_DONUT = [
  { name: 'Google Ads (Search & PMax)', value: 38040, share: '48.0%', fill: '#4285F4' },
  { name: 'Meta Ads (IG Reels & Advantage+)', value: 29320, share: '37.0%', fill: '#1877F2' },
  { name: 'LinkedIn Marketing (ABM)', value: 11890, share: '15.0%', fill: '#0A66C2' }
];

const PAID_PACING = [
  { label: 'Google Search RSA', actual: 14.80, target: 28.0, diff: '+47.1%', metric: '$', note: 'Exact Intent Brand' },
  { label: 'Google PMax Core', actual: 21.40, target: 32.0, diff: '+33.1%', metric: '$', note: 'Omnichannel Asset Group' },
  { label: 'Meta Advantage+ Reels', actual: 24.10, target: 35.0, diff: '+31.1%', metric: '$', note: 'Short-form Creative' },
  { label: 'LinkedIn Enterprise InMail', actual: 64.50, target: 85.0, diff: '+24.1%', metric: '$', note: 'Decision Makers' },
  { label: 'Retargeting Dynamic Feed', actual: 11.20, target: 20.0, diff: '+44.0%', metric: '$', note: 'Cart Abandoners' }
];

// ---------------------------------------------------------
// TEMPLATE 3: AUDIENCE & ICP SEGMENTATION DATA
// ---------------------------------------------------------
const ICP_TIMELINE = [
  { date: 'W1', revenue: 42000, adSpend: 12, roas: 5.8, velocityDays: 24.0 },
  { date: 'W2', revenue: 58000, adSpend: 18, roas: 6.2, velocityDays: 21.5 },
  { date: 'W3', revenue: 76000, adSpend: 26, roas: 6.4, velocityDays: 19.2 },
  { date: 'W4', revenue: 98000, adSpend: 34, roas: 6.9, velocityDays: 17.8 },
  { date: 'W5', revenue: 122000, adSpend: 46, roas: 7.1, velocityDays: 16.9 },
  { date: 'W6', revenue: 154000, adSpend: 58, roas: 7.4, velocityDays: 16.4 }
];

const ICP_DONUT = [
  { name: 'Tech Founders & CEOs (Series A-C)', value: 44, share: '44.0%', fill: '#F59E0B' },
  { name: 'VP Growth & Demand Gen Leaders', value: 32, share: '32.0%', fill: '#0EA5E9' },
  { name: 'Enterprise CMOs & Marketing Ops', value: 16, share: '16.0%', fill: '#10B981' },
  { name: 'Agency Growth Directors', value: 8, share: '8.0%', fill: '#8B5CF6' }
];

const ICP_PACING = [
  { label: 'Tech Founders (SaaS)', actual: 6.8, target: 4.0, diff: '+70.0%', metric: 'x', note: 'LTV:CAC Ratio' },
  { label: 'VP Growth Leaders', actual: 4.9, target: 3.5, diff: '+40.0%', metric: 'x', note: 'LTV:CAC Ratio' },
  { label: 'Enterprise CMOs', actual: 8.2, target: 5.0, diff: '+64.0%', metric: 'x', note: 'LTV:CAC Ratio' },
  { label: 'Agency Operators', actual: 3.7, target: 3.0, diff: '+23.3%', metric: 'x', note: 'LTV:CAC Ratio' },
  { label: 'Mid-Market Directors', actual: 4.3, target: 3.5, diff: '+22.8%', metric: 'x', note: 'LTV:CAC Ratio' }
];

// ---------------------------------------------------------
// TEMPLATE 4: ORGANIC AUTHORITY & SEARCH ENGINE DATA
// ---------------------------------------------------------
const AUTH_TIMELINE = [
  { date: 'W1', revenue: 18400, adSpend: 42000, roas: 8.1, visibilityScore: 82 },
  { date: 'W2', revenue: 21900, adSpend: 58000, roas: 8.2, visibilityScore: 84 },
  { date: 'W3', revenue: 25400, adSpend: 79000, roas: 8.3, visibilityScore: 86 },
  { date: 'W4', revenue: 28900, adSpend: 98000, roas: 8.4, visibilityScore: 88 },
  { date: 'W5', revenue: 31800, adSpend: 119000, roas: 8.5, visibilityScore: 90 },
  { date: 'W6', revenue: 34100, adSpend: 142600, roas: 8.6, visibilityScore: 92 }
];

const AUTH_DONUT = [
  { name: 'AI Growth Architecture Pillar', value: 42, share: '42.0%', fill: '#10B981' },
  { name: 'Second Brain Marketing Vaults', value: 28, share: '28.0%', fill: '#3B82F6' },
  { name: 'B2B CAC Reduction Blueprints', value: 18, share: '18.0%', fill: '#F59E0B' },
  { name: 'Omnichannel Attribution Guides', value: 12, share: '12.0%', fill: '#EC4899' }
];

const AUTH_PACING = [
  { label: 'AI Growth OS Queries', actual: 1, target: 3, diff: '#1 Rank', metric: '', note: 'Topical Footprint' },
  { label: 'Second Brain Marketing', actual: 1, target: 3, diff: '#1 Rank', metric: '', note: 'Brand Moat' },
  { label: 'Autonomous Ad Swarms', actual: 2, target: 5, diff: '#2 Rank', metric: '', note: 'SERP Dominance' },
  { label: 'CAC Optimization Engine', actual: 3, target: 5, diff: '#3 Rank', metric: '', note: 'Commercial Intent' },
  { label: 'Multi-Agent GTM Swarms', actual: 2, target: 5, diff: '#2 Rank', metric: '', note: 'Perplexity & Gemini Citations' }
];

export default function AlignedExecutiveCharts({
  layoutMode = 'grid',
  className,
  templateId = 'tpl-omnichannel'
}: AlignedExecutiveChartsProps) {
  const [activeMetricTab, setActiveMetricTab] = useState<'revenue' | 'roas' | 'both'>('both');
  const [activeChannelHover, setActiveChannelHover] = useState<string | null>(null);

  // Dynamic configurations based strictly on selected template
  const config = React.useMemo(() => {
    switch (templateId) {
      case 'tpl-paid-acquisition':
        return {
          title: 'Paid Media Outlay vs. Attributed Revenue & ROAS',
          subtitle: 'Granular channel pacing across Google Ads, Meta Advantage+, and LinkedIn Sponsored Campaigns.',
          timelineData: PAID_TIMELINE,
          donutData: PAID_DONUT,
          pacingData: PAID_PACING,
          primaryMetricLabel: 'Paid Revenue',
          secondaryMetricLabel: 'Media Spend',
          roasLabel: 'Paid ROAS (4.64x)',
          donutTitle: 'Paid Spend Mix',
          donutTotalLabel: '$79,250 Total',
          donutCenterValue: '$79.3k',
          matrixTitle: 'Campaign Unit Economics & Cost Per Acquisition (CPA)',
          matrixBadge: 'Google PMax at $14.80 CPA',
          matrixSubtitle: 'Ceiling vs. Actual Cost per Conversion',
          trendPill: '+18.5% Direct Conversions MoM',
          icon: Target
        };
      case 'tpl-audience-icp':
        return {
          title: 'ICP Lead Pipeline Velocity vs. Deal Contract Volume',
          subtitle: 'Cohort progression tracking qualified buyer intent, deal velocity, and ICP penetration rate.',
          timelineData: ICP_TIMELINE,
          donutData: ICP_DONUT,
          pacingData: ICP_PACING,
          primaryMetricLabel: 'Pipeline Value ($)',
          secondaryMetricLabel: 'Contracted Deals',
          roasLabel: 'Velocity Track',
          donutTitle: 'Lead Volume by Persona',
          donutTotalLabel: '68.4% ICP Match',
          donutCenterValue: '68.4%',
          matrixTitle: 'Persona Unit Economics & LTV:CAC Multipliers',
          matrixBadge: 'Tech Founders at 6.8x LTV:CAC',
          matrixSubtitle: 'Target vs. Actual Lifetime Value Multiple',
          trendPill: 'Sales Cycle: -5.2 Days MoM',
          icon: Users
        };
      case 'tpl-authority-organic':
        return {
          title: 'Non-Brand Organic Growth vs. Search Ad Value Equivalence',
          subtitle: 'Topical cluster dominance, AI knowledge citations (Perplexity/Gemini), and non-brand SERP authority.',
          timelineData: AUTH_TIMELINE,
          donutData: AUTH_DONUT,
          pacingData: AUTH_PACING,
          primaryMetricLabel: 'Ad Spend Equiv ($)',
          secondaryMetricLabel: 'Organic Visits',
          roasLabel: 'AI Visibility (91.8)',
          donutTitle: 'Topical Map Share',
          donutTotalLabel: '18 Topic Clusters',
          donutCenterValue: '91.8/100',
          matrixTitle: 'Topical Authority & SERP Ranking Dominance',
          matrixBadge: '3 Top #1 Organic Ranks',
          matrixSubtitle: 'Current SERP Position vs. Target Top 3',
          trendPill: '+32.4% Organic Visits MoM',
          icon: Globe
        };
      case 'tpl-omnichannel':
      default:
        return {
          title: 'Revenue Velocity vs. Managed Ad Spend',
          subtitle: 'Dual-axis progression mapping total attributed revenue against media investment and ROAS pacing.',
          timelineData: OMNI_TIMELINE,
          donutData: OMNI_DONUT,
          pacingData: OMNI_PACING,
          primaryMetricLabel: 'Attributed Revenue',
          secondaryMetricLabel: 'Ad Spend',
          roasLabel: 'ROAS (4.82x Blended)',
          donutTitle: 'Channel Spend Mix',
          donutTotalLabel: '$84,250 Total',
          donutCenterValue: '$84.2k',
          matrixTitle: 'Customer Acquisition Cost (CAC) Efficiency Matrix',
          matrixBadge: 'All Channels Beating Target',
          matrixSubtitle: 'Target Ceiling vs. Actual Acquisition Cost',
          trendPill: '+24.6% Revenue Momentum MoM',
          icon: BarChart3
        };
    }
  }, [templateId]);

  const IconComponent = config.icon;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Aligned Grid Row 1: Primary Velocity Chart + Channel Mix Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Main Chart Card (8 Cols) */}
        <div className="lg:col-span-8 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-6 shadow-[var(--sigma-shadow-lg)] flex flex-col justify-between relative overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sigma-border)] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <IconComponent size={18} className="text-accent" />
                <h4 className="text-base font-bold silver-text tracking-tight">
                  {config.title}
                </h4>
              </div>
              <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">
                {config.subtitle}
              </p>
            </div>

            {/* Metric Toggle */}
            <Tabs<'revenue' | 'roas' | 'both'>
              tabs={[
                { id: 'both', label: 'Combined' },
                { id: 'revenue', label: 'Primary only' },
                { id: 'roas', label: 'Efficiency only' },
              ]}
              activeTab={activeMetricTab}
              onChange={setActiveMetricTab}
              size="sm"
            />
          </div>

          {/* Recharts Canvas */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={config.timelineData as any[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />

                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />

                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : val}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-3 shadow-2xl text-xs font-mono space-y-1.5 backdrop-blur-md">
                          <div className="text-zinc-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-emerald-400 font-bold">
                              {data.roas ? `${data.roas}x ROAS` : `${data.visibilityScore || 90} Score`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-accent">
                            <span>{config.primaryMetricLabel}:</span>
                            <strong className="text-white">${(data.revenue || 0).toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[var(--sigma-text-soft)]">
                            <span>{config.secondaryMetricLabel}:</span>
                            <strong className="text-white">
                              {typeof data.adSpend === 'number' && data.adSpend > 1000 ? `$${data.adSpend.toLocaleString()}` : data.adSpend}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {(activeMetricTab === 'both' || activeMetricTab === 'revenue') && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={config.primaryMetricLabel}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#primaryGradient)"
                  />
                )}

                {(activeMetricTab === 'both' || activeMetricTab === 'revenue') && (
                  <Area
                    type="monotone"
                    dataKey="adSpend"
                    name={config.secondaryMetricLabel}
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#secondaryGradient)"
                  />
                )}

                {(activeMetricTab === 'both' || activeMetricTab === 'roas') && (
                  <Line
                    type="monotone"
                    dataKey={(d: any) => (d.roas || 4.5) * 4000}
                    name="Efficiency Curve"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Footer Legend & Key Markers */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--sigma-border)] text-xs font-mono text-[var(--sigma-text-muted)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-[var(--sigma-text)]">{config.primaryMetricLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-cyan-accent" />
                <span className="text-[var(--sigma-text)]">{config.secondaryMetricLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-emerald-accent rounded-full" />
                <span className="text-[var(--sigma-text)]">{config.roasLabel}</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-accent flex items-center gap-1 font-bold">
              <TrendingUp size={13} />
              <span>{config.trendPill}</span>
            </div>
          </div>
        </div>

        {/* Donut Card (4 Cols) */}
        <div className="lg:col-span-4 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-6 shadow-[var(--sigma-shadow-lg)] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <PieIcon size={18} className="text-accent" />
                <h4 className="text-base font-bold silver-text tracking-tight">
                  {config.donutTitle}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">{config.donutTotalLabel}</span>
            </div>

            {/* Donut Chart */}
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={config.donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveChannelHover(config.donutData[index].name)}
                    onMouseLeave={() => setActiveChannelHover(null)}
                  >
                    {config.donutData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke="#09090b"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 border border-white/20 rounded-xl p-2.5 text-xs font-mono shadow-xl">
                            <div className="font-bold text-white">{d.name}</div>
                            <div className="text-accent">
                              {typeof d.value === 'number' && d.value > 1000 ? `$${d.value.toLocaleString()}` : d.value} ({d.share})
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-mono text-[var(--sigma-text-muted)]">Total</span>
                <span className="text-base font-black text-[var(--sigma-text)] font-mono">{config.donutCenterValue}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend List */}
          <div className="space-y-2 pt-2 border-t border-[var(--sigma-border)] text-xs font-mono">
            {config.donutData.map((ch) => (
              <div
                key={ch.name}
                className={cn(
                  "flex items-center justify-between p-1.5 rounded-lg transition-colors",
                  activeChannelHover === ch.name
                    ? "bg-[var(--sigma-surface-subtle)]"
                    : "hover:bg-[var(--sigma-surface-subtle)]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: ch.fill }} />
                  <span className="text-[var(--sigma-text-soft)] text-[11px] truncate max-w-[140px]">{ch.name}</span>
                </div>
                <span className="text-[var(--sigma-text)] font-bold text-[11px] shrink-0">{ch.share}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Aligned Grid Row 2: CPA Efficiency & Pacing Gauges */}
      <div className="bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-6 shadow-[var(--sigma-shadow-lg)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--sigma-border)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Activity size={18} className="text-accent" />
            <h4 className="text-base font-bold silver-text tracking-tight">
              {config.matrixTitle}
            </h4>
            <span className="px-2 py-0.5 rounded bg-emerald-accent/10 text-emerald-accent text-[10px] font-mono font-bold border border-emerald-accent/30">
              {config.matrixBadge}
            </span>
          </div>
          <span className="text-xs font-mono text-[var(--sigma-text-muted)]">
            {config.matrixSubtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {config.pacingData.map((item: any) => (
            <div key={item.label} className="p-4 bg-[var(--sigma-surface-subtle)]/60 border border-[var(--sigma-border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--sigma-text)] font-sans truncate">{item.label}</span>
                <span className="text-[10px] font-mono text-emerald-accent font-bold bg-emerald-accent/10 px-1.5 py-0.5 rounded shrink-0">
                  {item.diff}
                </span>
              </div>

              <div>
                <div className="text-xl font-black text-[var(--sigma-text)] font-mono">
                  {item.metric === '$' ? `$${item.actual.toFixed(2)}` : `${item.actual}${item.metric}`}
                </div>
                <div className="text-[10px] font-mono text-[var(--sigma-text-muted)]">
                  Target: {item.metric === '$' ? `$${item.target.toFixed(2)}` : `${item.target}${item.metric}`}
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-[var(--sigma-border-strong)] overflow-hidden">
                <div
                  className="h-full bg-emerald-accent rounded-full"
                  style={{ width: `${Math.min(100, (item.actual / (item.target || 1)) * 100)}%` }}
                />
              </div>

              <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] truncate">
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
