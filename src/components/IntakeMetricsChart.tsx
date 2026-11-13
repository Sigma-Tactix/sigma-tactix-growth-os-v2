import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Database,
  Zap,
  Activity,
  ArrowUpRight,
  Layers,
  RefreshCw,
  Filter,
  Sparkles,
  Server,
  Globe,
  Radio,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

// Hourly dataset (24 hours)
const hourlyData = [
  { time: '00:00', totalEvents: 3400, vectors: 2890, hubspot: 850, ga4: 1200, meta: 750, google: 600, throughputMB: 4.2, successRate: 99.9 },
  { time: '02:00', totalEvents: 2200, vectors: 1950, hubspot: 520, ga4: 850, meta: 480, google: 350, throughputMB: 2.8, successRate: 100 },
  { time: '04:00', totalEvents: 1800, vectors: 1620, hubspot: 390, ga4: 720, meta: 410, google: 280, throughputMB: 2.1, successRate: 99.8 },
  { time: '06:00', totalEvents: 4200, vectors: 3750, hubspot: 950, ga4: 1600, meta: 920, google: 730, throughputMB: 5.4, successRate: 99.9 },
  { time: '08:00', totalEvents: 8900, vectors: 8100, hubspot: 2400, ga4: 3100, meta: 1900, google: 1500, throughputMB: 11.2, successRate: 99.7 },
  { time: '10:00', totalEvents: 12400, vectors: 11200, hubspot: 3200, ga4: 4500, meta: 2600, google: 2100, throughputMB: 15.8, successRate: 99.9 },
  { time: '12:00', totalEvents: 11100, vectors: 10050, hubspot: 2900, ga4: 3900, meta: 2400, google: 1900, throughputMB: 14.1, successRate: 100 },
  { time: '14:00', totalEvents: 13800, vectors: 12600, hubspot: 3600, ga4: 4900, meta: 2900, google: 2400, throughputMB: 17.5, successRate: 99.8 },
  { time: '16:00', totalEvents: 14500, vectors: 13200, hubspot: 3800, ga4: 5100, meta: 3100, google: 2500, throughputMB: 18.2, successRate: 99.9 },
  { time: '18:00', totalEvents: 10200, vectors: 9300, hubspot: 2600, ga4: 3600, meta: 2200, google: 1800, throughputMB: 13.0, successRate: 100 },
  { time: '20:00', totalEvents: 7800, vectors: 7050, hubspot: 1900, ga4: 2900, meta: 1700, google: 1300, throughputMB: 9.9, successRate: 99.9 },
  { time: '22:00', totalEvents: 5400, vectors: 4890, hubspot: 1400, ga4: 1950, meta: 1150, google: 900, throughputMB: 6.8, successRate: 100 },
];

// 7 Days dataset
const dailyData = [
  { time: 'Mon', totalEvents: 98400, vectors: 89200, hubspot: 24500, ga4: 38200, meta: 20100, google: 15600, throughputMB: 124, successRate: 99.8 },
  { time: 'Tue', totalEvents: 112000, vectors: 101500, hubspot: 29100, ga4: 42000, meta: 23800, google: 17100, throughputMB: 142, successRate: 99.9 },
  { time: 'Wed', totalEvents: 125400, vectors: 114800, hubspot: 32400, ga4: 46900, meta: 26500, google: 19600, throughputMB: 158, successRate: 100 },
  { time: 'Thu', totalEvents: 118200, vectors: 108100, hubspot: 30200, ga4: 44100, meta: 24900, google: 19000, throughputMB: 149, successRate: 99.9 },
  { time: 'Fri', totalEvents: 134800, vectors: 123900, hubspot: 35100, ga4: 49800, meta: 28900, google: 21000, throughputMB: 171, successRate: 99.8 },
  { time: 'Sat', totalEvents: 76400, vectors: 69800, hubspot: 18200, ga4: 29100, meta: 16900, google: 12200, throughputMB: 96, successRate: 100 },
  { time: 'Sun', totalEvents: 82100, vectors: 75200, hubspot: 19900, ga4: 31400, meta: 18100, google: 12700, throughputMB: 104, successRate: 99.9 },
];

// 30 Days dataset
const monthlyData = [
  { time: 'W1', totalEvents: 680000, vectors: 618000, hubspot: 172000, ga4: 254000, meta: 144000, google: 110000, throughputMB: 860, successRate: 99.85 },
  { time: 'W2', totalEvents: 742000, vectors: 679000, hubspot: 189000, ga4: 279000, meta: 158000, google: 116000, throughputMB: 938, successRate: 99.92 },
  { time: 'W3', totalEvents: 810000, vectors: 745000, hubspot: 208000, ga4: 304000, meta: 172000, google: 126000, throughputMB: 1025, successRate: 99.96 },
  { time: 'W4', totalEvents: 894000, vectors: 821000, hubspot: 231000, ga4: 334000, meta: 189000, google: 140000, throughputMB: 1130, successRate: 99.91 },
];

type TimeRange = '24H' | '7D' | '30D';
type ViewMode = 'OVERVIEW' | 'SOURCES' | 'VECTOR_CORRELATION';

// Tooltip is an overlay surface: it floats above a theme-flipping panel, so it
// must use the raised/subtle surface tokens (which flip with the theme), not a
// static dark console shade. 10–11px mono microcopy is intentional console
// styling — only the colors are tokenized.
const CustomIntakeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--sigma-surface-raised)] border border-[var(--sigma-border)] rounded-xl p-4 shadow-2xl backdrop-blur-xl font-sans min-w-[200px]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--sigma-text-muted)] mb-2 border-b border-[var(--sigma-border)] pb-1.5 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-accent flex items-center gap-1">
            <Zap size={10} /> Second Brain Ingest
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: entry.color, color: entry.color }}
                />
                <span className="text-[var(--sigma-text-soft)] capitalize text-[11px] font-mono">{entry.name}:</span>
              </div>
              <span className="font-mono font-bold text-[var(--sigma-text)]">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2 border-t border-[var(--sigma-border)] flex items-center justify-between text-[11px] font-mono text-[var(--sigma-text-muted)]">
          <span>Routing:</span>
          <span className="text-[var(--sigma-text)] font-bold">10 Partitioned Vaults</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function IntakeMetricsChart({ isLive = false }: { isLive?: boolean }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW');
  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);
  const [livePulseCount, setLivePulseCount] = useState(0);

  // Active dataset
  const baseData = useMemo(() => {
    switch (timeRange) {
      case '7D': return dailyData;
      case '30D': return monthlyData;
      case '24H':
      default: return hourlyData;
    }
  }, [timeRange]);

  const [chartData, setChartData] = useState(baseData);

  useEffect(() => {
    setChartData(baseData);
  }, [baseData]);

  // Only animate telemetry when a caller supplies an authoritative live mode.
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setLivePulseCount(prev => prev + Math.floor(Math.random() * 24 + 8));

      setChartData(prev => {
        const lastIdx = prev.length - 1;
        const current = prev[lastIdx];
        const addedEvents = Math.floor(Math.random() * 80);
        const updatedLast = {
          ...current,
          totalEvents: current.totalEvents + addedEvents,
          vectors: current.vectors + Math.floor(addedEvents * 0.92)
        };
        const updated = [...prev];
        updated[lastIdx] = updatedLast;
        return updated;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [isLive]);

  const handleSimulateBurst = () => {
    setIsSimulatingBurst(true);
    setTimeout(() => {
      setChartData(prev => {
        const lastIdx = prev.length - 1;
        const current = prev[lastIdx];
        const burstEvents = 2850;
        const updatedLast = {
          ...current,
          totalEvents: current.totalEvents + burstEvents,
          vectors: current.vectors + 2620,
          hubspot: current.hubspot + 950,
          ga4: current.ga4 + 1100,
          meta: current.meta + 550,
          google: current.google + 250
        };
        const updated = [...prev];
        updated[lastIdx] = updatedLast;
        return updated;
      });
      setIsSimulatingBurst(false);
    }, 700);
  };

  // Aggregates for current range
  const totalEventsSum = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalEvents, 0);
  }, [chartData]);

  const totalVectorsSum = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.vectors, 0);
  }, [chartData]);

  const avgThroughput = useMemo(() => {
    return (chartData.reduce((acc, curr) => acc + curr.throughputMB, 0) / chartData.length).toFixed(1);
  }, [chartData]);

  return (
    <div className="bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background Accent Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--sigma-border)] pb-6 relative z-10">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2 mb-1.5">
            <Radio size={14} className="text-accent" /> Data intake overview
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-heading font-black silver-text tracking-tight">
              Incoming Data Intake Metrics
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-accent border border-emerald-500/20 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
              {isLive ? 'Live stream' : 'Sample dataset'}
            </span>
          </div>
          <p className="text-xs text-[var(--sigma-text-muted)] mt-1 max-w-xl">
            {isLive ? 'Current connector telemetry for data intake and indexing.' : 'Interactive sample data for planning. Connect a verified ingestion source to display current telemetry.'}
          </p>
        </div>

        {/* Action Buttons & Time Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="sigma-segmented">
            {[
              { id: 'OVERVIEW', label: 'Overview' },
              { id: 'SOURCES', label: 'By Source' },
              { id: 'VECTOR_CORRELATION', label: 'Vector Gen' },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={cn(
                  "sigma-segment font-mono",
                  viewMode === mode.id
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="sigma-segmented">
            {(['24H', '7D', '30D'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "sigma-segment font-mono",
                  timeRange === range
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Simulate Burst Action */}
          <button
            onClick={handleSimulateBurst}
            disabled={isSimulatingBurst}
            title="Inject simulated high-volume event burst into Second Brain"
            className="px-3.5 py-1.5 bg-accent/10 border border-accent/30 hover:bg-accent/20 text-accent rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap size={14} className={cn(isSimulatingBurst && "animate-spin text-accent")} />
            {isSimulatingBurst ? "Ingesting..." : "Simulate Burst"}
          </button>
        </div>
      </div>

      {/* Topline KPI Mini-Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
        <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Total Intake Events</div>
          <div className="text-xl font-heading font-black text-[var(--sigma-text)] mt-1">
            {totalEventsSum.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-emerald-accent mt-0.5 flex items-center gap-1">
            <ArrowUpRight size={12} /> {isLive ? 'Current period' : 'Illustrative'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Vectors Embedded</div>
          <div className="text-xl font-heading font-black text-[var(--sigma-text-soft)] mt-1">
            {totalVectorsSum.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-0.5">
            1536-dim pgvector
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Avg Throughput</div>
          <div className="text-xl font-heading font-black text-accent mt-1">
            {avgThroughput} MB/hr
          </div>
          <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-0.5">
            {isLive ? 'Reported throughput' : 'Sample throughput'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Parsing Success</div>
          <div className="text-xl font-heading font-black text-emerald-accent mt-1">
            {isLive ? '—' : '99.94%'}
          </div>
          <div className="text-[10px] font-mono text-emerald-accent/80 mt-0.5">
            {isLive ? 'Awaiting source field' : 'Illustrative rate'}
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-[340px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'OVERVIEW' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="intakeEventsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="vectorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              <Tooltip content={<CustomIntakeTooltip />} />
              <Area
                type="monotone"
                dataKey="totalEvents"
                name="Intake Events"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#intakeEventsGrad)"
              />
              <Area
                type="monotone"
                dataKey="vectors"
                name="Vectors Embedded"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#vectorsGrad)"
              />
            </AreaChart>
          ) : viewMode === 'SOURCES' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              <Tooltip content={<CustomIntakeTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'monospace' }}
                iconType="circle"
              />
              <Bar dataKey="ga4" name="GA4 Web Analytics" stackId="sources" fill="#4285F4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="hubspot" name="HubSpot CRM" stackId="sources" fill="#FF7A59" radius={[0, 0, 0, 0]} />
              <Bar dataKey="meta" name="Meta Ads API" stackId="sources" fill="#0084FF" radius={[0, 0, 0, 0]} />
              <Bar dataKey="google" name="Google Ads / GSC" stackId="sources" fill="#34A853" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace' }}
                dy={8}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#10B981', fontSize: 10, fontFamily: 'monospace' }}
                domain={[99.5, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomIntakeTooltip />} />
              <Bar yAxisId="left" dataKey="totalEvents" name="Raw Ingestion" fill="#3F3F46" radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="vectors" name="Vector Embeddings" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate %" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--sigma-border)] text-xs font-mono relative z-10">
        <div className="flex items-center gap-2.5 text-[var(--sigma-text-muted)]">
          <Server size={14} className="text-accent" />
          <span>Destination: <strong>PostgreSQL + pgvector</strong></span>
        </div>
        <div className="flex items-center gap-2.5 text-[var(--sigma-text-muted)]">
          <Cpu size={14} className="text-[var(--sigma-text-soft)]" />
          <span>Embedding: <strong>text-embedding-004 (1536d)</strong></span>
        </div>
        <div className="flex items-center gap-2.5 text-[var(--sigma-text-muted)] md:justify-end">
          <CheckCircle2 size={14} className="text-emerald-accent" />
          <span>Data status: <strong>{isLive ? 'Connector supplied' : 'Sample data'}</strong></span>
        </div>
      </div>
    </div>
  );
}
