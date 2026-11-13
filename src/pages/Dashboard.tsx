import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Rocket, 
  ExternalLink,
  MoreVertical,
  Plus,
  Download,
  FileText,
  FileJson,
  Eye,
  EyeOff,
  Settings2,
  Check,
  Calendar,
  Filter,
  FileSpreadsheet,
  Building2,
  Palette,
  ChevronDown,
  Layers,
  Zap,
  DollarSign,
  Briefcase,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { 
  INDUSTRY_REPORT_FORMATS, 
  IndustryReportFormat, 
  COLOR_PROFILES, 
  ReportColorProfile 
} from '@/src/data/industryReportFormats';
import { cn, formatCurrency, formatNumber } from '@/src/lib/utils';
import { useUser, UserRole } from '@/src/contexts/UserContext';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { exportService } from '@/src/services/exportService';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import IntakeMetricsChart from '@/src/components/IntakeMetricsChart';
import { apiFetch } from '@/src/lib/api';
import { classifyChannelMedia, isPriorityMarketingPlatform, isVerifiedPipeline } from '@/src/lib/connectorLifecycle';
import ActionQueueTab from '@/src/components/dashboard/ActionQueueTab';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { Button, GlassCard, Badge, MetricWidget, Tabs } from '@/src/components/ui';

const SecondBrainWorkspace = lazy(() => import('@/src/components/vanta/SecondBrainWorkspace'));

const now = new Date();
const rawData = [
  { timestamp: subDays(now, 28).getTime(), name: format(subDays(now, 28), 'MMM dd'), value: 2400 },
  { timestamp: subDays(now, 21).getTime(), name: format(subDays(now, 21), 'MMM dd'), value: 3100 },
  { timestamp: subDays(now, 14).getTime(), name: format(subDays(now, 14), 'MMM dd'), value: 3900 },
  { timestamp: subDays(now, 7).getTime(), name: format(subDays(now, 7), 'MMM dd'), value: 4800 },
  { timestamp: subDays(now, 3).getTime(), name: format(subDays(now, 3), 'MMM dd'), value: 5600 },
  { timestamp: now.getTime(), name: format(now, 'MMM dd'), value: 6400 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3.5 rounded-xl shadow-2xl min-w-[190px] border border-[var(--sigma-border)] no-export">
        <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--sigma-primary)]" />
          <p className="text-lg font-bold font-mono tabular-nums text-[var(--sigma-text)]">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--sigma-border)] text-[11px] text-[var(--sigma-text-muted)] flex items-center justify-between">
          <span>Attributed Velocity</span>
          <span className="text-emerald-accent font-mono font-medium">Optimal</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { role } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { pendingCount: actionQueuePendingCount } = useActionQueue();
  const [activeDashboardTab, setActiveDashboardTab] = useState<'OVERVIEW' | 'ACTION_QUEUE' | 'SECOND_BRAIN'>(() => new URLSearchParams(window.location.search).get('view') === 'second-brain' ? 'SECOND_BRAIN' : 'OVERVIEW');
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    spend: true,
    conversion: true,
    roas: true,
    velocity: true,
    segments: true,
    signals: true,
    adminStats: true
  });

  const referenceDate = new Date();

  const datePresets = [
    { label: 'Last 7 Days', get: () => ({ start: subDays(referenceDate, 7), end: referenceDate }) },
    { label: 'Last 30 Days', get: () => ({ start: subDays(referenceDate, 30), end: referenceDate }) },
    { label: 'This Month', get: () => ({ start: startOfMonth(referenceDate), end: referenceDate }) },
    { label: 'This Quarter', get: () => ({ start: startOfQuarter(referenceDate), end: referenceDate }) },
    { label: 'Last Quarter', get: () => ({ start: startOfQuarter(subQuarters(referenceDate, 1)), end: endOfQuarter(subQuarters(referenceDate, 1)) }) },
  ];

  const [selectedPresetLabel, setSelectedPresetLabel] = useState('This Quarter');
  const [dateRange, setDateRange] = useState({
    start: startOfQuarter(referenceDate),
    end: referenceDate
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);

  const navigate = useNavigate();

  // Connection and reporting state are server-owned. A cached browser record
  // is not evidence of provider access.
  const [activePipelines, setActivePipelines] = useState<any[]>([]);
  const [mediaMode, setMediaMode] = useState<'organic' | 'paid'>('organic');
  const [reportingMetrics, setReportingMetrics] = useState<{ available: boolean; spend: number; conversions: number; revenue: number; roas: number; providers?: unknown[] }>({
    available: false, spend: 0, conversions: 0, revenue: 0, roas: 0,
  });

  // Industry Report Format State
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(() => {
    try {
      return localStorage.getItem('sigmatactix_topline_industry') || 'b2b_saas';
    } catch {
      return 'b2b_saas';
    }
  });

  // Color Profile State (Amber & Slate | Modern Royal Indigo | Minimal Monochrome & Emerald)
  const [colorProfileKey, setColorProfileKey] = useState<ReportColorProfile>(() => {
    try {
      const cached = localStorage.getItem('sigmatactix_topline_theme') as ReportColorProfile;
      return cached && COLOR_PROFILES[cached] ? cached : 'amber';
    } catch {
      return 'amber';
    }
  });

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const selectedIndustry = useMemo(() => {
    return INDUSTRY_REPORT_FORMATS.find(f => f.id === selectedIndustryId) || INDUSTRY_REPORT_FORMATS[0];
  }, [selectedIndustryId]);

  const activeColorProfile = COLOR_PROFILES[colorProfileKey] || COLOR_PROFILES.amber;

  const handleSelectIndustry = (industryId: string) => {
    setSelectedIndustryId(industryId);
    setShowIndustryDropdown(false);
    try {
      localStorage.setItem('sigmatactix_topline_industry', industryId);
    } catch {}
  };

  const handleSelectColorProfile = (key: ReportColorProfile) => {
    setColorProfileKey(key);
    try {
      localStorage.setItem('sigmatactix_topline_theme', key);
    } catch {}
  };

  useEffect(() => {
    const handlePipelinesUpdate = async () => {
      try {
        const response = await apiFetch('/api/workspace/pipelines');
        const data = await response.json();
        setActivePipelines(response.ok && Array.isArray(data.pipelines) ? data.pipelines : []);
      } catch { setActivePipelines([]); }
    };
    const loadMetrics = async () => {
      try {
        const response = await apiFetch(`/api/workspace/reporting/metrics?media=${mediaMode}`);
        const data = await response.json();
        if (response.ok && data.success && data.metrics) setReportingMetrics(data.metrics);
      } catch {
        setReportingMetrics({ available: false, spend: 0, conversions: 0, revenue: 0, roas: 0 });
      }
    };
    window.addEventListener('storage', handlePipelinesUpdate);
    window.addEventListener('sigmatactix-pipelines-updated', handlePipelinesUpdate);
    void handlePipelinesUpdate();
    void loadMetrics();
    window.addEventListener('sigmatactix-pipelines-updated', loadMetrics);
    return () => {
      window.removeEventListener('storage', handlePipelinesUpdate);
      window.removeEventListener('sigmatactix-pipelines-updated', handlePipelinesUpdate);
      window.removeEventListener('sigmatactix-pipelines-updated', loadMetrics);
    };
  }, [mediaMode]);

  const connectedMarketingPipelines = useMemo(() => {
    return activePipelines.filter((p: any) => 
      isVerifiedPipeline(p) &&
      classifyChannelMedia(p.platform) === mediaMode &&
      (isPriorityMarketingPlatform(p.platform) || /linkedin|twitter|\bx\b|facebook|instagram|reddit|google analytics|search console|meta/i.test(String(p.platform || '')))
    );
  }, [activePipelines, mediaMode]);

  const hasVerifiedConnectors = connectedMarketingPipelines.length > 0;

  // A connection alone does not prove that a metrics payload was ingested.
  const totalSpend = useMemo(() => {
    return reportingMetrics.available ? reportingMetrics.spend : 0;
  }, [reportingMetrics]);

  const hasLiveMetrics = reportingMetrics.available;
  const organicSnapshot = useMemo(() => {
    const providers = (reportingMetrics.providers || []) as Array<{ sessions?: number; activeUsers?: number; conversions?: number }>;
    return providers.reduce((totals, provider) => ({
      sessions: totals.sessions + Number(provider.sessions || 0),
      activeUsers: totals.activeUsers + Number(provider.activeUsers || 0),
      conversions: totals.conversions + Number(provider.conversions || 0),
    }), { sessions: 0, activeUsers: 0, conversions: 0 });
  }, [reportingMetrics.providers]);

  // Authentic live metrics baseline ($0 spend until ad pipelines linked)
  const [liveMetrics, setLiveMetrics] = useState({
    spend: 0,
    conversion: 0,
    roas: 0
  });

  useEffect(() => {
    setLiveMetrics(prev => ({
      ...prev,
      spend: totalSpend,
      conversion: reportingMetrics.spend > 0 ? (reportingMetrics.conversions / reportingMetrics.spend) * 100 : 0,
      roas: reportingMetrics.roas
    }));
  }, [totalSpend, reportingMetrics]);

  // Dynamic segments bound to current industry format & connected pipeline status
  const segmentsData = useMemo(() => {
    return selectedIndustry.channels.map(ch => {
      const sharePct = parseInt(ch.shareOfBudget) || 25;
      const allocatedSpend = hasLiveMetrics ? Math.round(totalSpend * (sharePct / 100)) : 0;
      return {
        name: ch.name,
        channelType: ch.channelType,
        spend: allocatedSpend,
        conv: ch.benchmarkCvr,
        roas: ch.benchmarkRoas,
        cpc: ch.benchmarkCpc,
        cpa: ch.benchmarkCpa,
        share: ch.shareOfBudget,
        status: ch.status,
        color: ch.color
      };
    });
  }, [selectedIndustry, hasLiveMetrics, totalSpend]);

  // CVR bars encode the panel's benchmark CVR value as a relative share of the
  // highest benchmark row — the bars visualize the benchmark figures, they do
  // not measure client conversion performance.
  const maxBenchmarkCvr = useMemo(
    () => segmentsData.reduce((max, s) => Math.max(max, parseFloat(s.conv) || 0), 0),
    [segmentsData],
  );

  const filteredChartData = useMemo(() => {
    if (hasLiveMetrics) {
      return rawData.map(d => ({
        name: d.name,
        value: Math.round(d.value * (totalSpend / 6400 || 1))
      }));
    }
    return selectedIndustry.chartData;
  }, [hasLiveMetrics, totalSpend, selectedIndustry]);

  // Default widgets based on role
  useEffect(() => {
    const defaults: Record<UserRole, any> = {
      ADMIN: { spend: true, conversion: true, roas: true, velocity: true, segments: true, signals: true, adminStats: true },
      SUB_ADMIN: { spend: true, conversion: true, roas: true, velocity: true, segments: true, signals: true, adminStats: false },
      USER: { spend: true, conversion: true, roas: false, velocity: true, segments: true, signals: false, adminStats: false },
    };
    setVisibleWidgets(defaults[role]);
  }, [role]);

  const toggleWidget = (id: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async (formatType: 'PDF' | 'PPTX' | 'XLSX') => {
    setIsExporting(true);
    setShowExportOptions(false);
    
    const timestamp = new Date().getTime();
    
    // KPI Data for static parts of reports
    const reportData = {
      kpis: [
        { label: 'Total Spend', value: hasLiveMetrics ? formatCurrency(liveMetrics.spend) : 'No live data', trend: hasLiveMetrics ? 'Connector supplied' : 'Benchmark mode' },
        { label: 'Conversion Rate', value: hasLiveMetrics ? `${liveMetrics.conversion.toFixed(2)}%` : selectedIndustry.metrics.conversionRate, trend: hasLiveMetrics ? 'Connector supplied' : 'Industry benchmark' },
        { label: 'ROAS', value: hasLiveMetrics ? `${liveMetrics.roas.toFixed(1)}x` : selectedIndustry.metrics.roasBenchmark, trend: hasLiveMetrics ? 'Connector supplied' : 'Industry benchmark' },
      ],
      dateRange: `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`
    };

    if (formatType === 'PDF') {
      await exportService.toPDF('dashboard-content', `sigmatactix-intel-${timestamp}.pdf`);
    } else if (formatType === 'PPTX') {
      // Capture exactly what user sees (elementId) + data into lecture deck
      await exportService.toPPTX('dashboard-content', reportData, `sigmatactix-intel-${timestamp}.html`);
    } else if (formatType === 'XLSX') {
      const exportData = [
        ...segmentsData.map(s => ({ ...s, type: 'Segment' })),
        ...filteredChartData.map(d => ({ name: d.name, value: d.value, type: 'TimeSeries' }))
      ];
      await exportService.toXLSX(exportData, `sigmatactix-raw-${timestamp}.xlsx`);
    }
    
    setIsExporting(false);
  };

  return (
    <div className="space-y-8 pb-16" id="dashboard-content">
      {/* Primary Dashboard Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4 no-export">
        <Tabs
          tabs={[
            { id: 'OVERVIEW', label: 'Topline Overview', icon: <BarChart3 size={14} /> },
            { id: 'SECOND_BRAIN', label: 'VANTA & Second Brain', icon: <Layers size={14} /> },
            {
              id: 'ACTION_QUEUE',
              label: 'Action Queue',
              badge: actionQueuePendingCount > 0 ? `${actionQueuePendingCount} Pending` : undefined,
              icon: <Zap size={14} />
            }
          ]}
          activeTab={activeDashboardTab}
          onChange={(tabId) => setActiveDashboardTab(tabId as any)}
          variant="pill"
          size="md"
        />
      </div>

      {activeDashboardTab === 'SECOND_BRAIN' ? (
        <Suspense fallback={<p role="status">Loading Second Brain…</p>}><SecondBrainWorkspace /></Suspense>
      ) : activeDashboardTab === 'ACTION_QUEUE' ? (
        <ActionQueueTab />
      ) : (
        <>
          {/* Header */}
          <div className="sigma-page-header p-6 sm:p-7 relative no-export" data-tutorial-id="tut-dashboard-hero">
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div>
                <div className="text-[11px] text-[var(--sigma-text-muted)] mb-2 flex items-center gap-2 font-mono no-export">
                  <span>Executive Reporting</span>
                  <span className="opacity-40">/</span>
                  <span className="text-[var(--sigma-text)] font-semibold">{currentWorkspace.name}</span>
                  <Badge variant="outline" size="sm">ICP Archetype</Badge>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="sigma-page-title !text-[34px] sm:!text-[40px] font-display">
                    Topline Report
                  </h1>
                  <Badge variant={hasLiveMetrics ? "success" : hasVerifiedConnectors ? "info" : "warning"} dot pulse={!hasLiveMetrics}>
                    {hasLiveMetrics ? `Live ${mediaMode} provider metrics` : hasVerifiedConnectors ? `Verified ${mediaMode} connectors` : `${mediaMode} benchmark mode`}
                  </Badge>
                </div>
                <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2.5 font-mono flex items-center gap-2 flex-wrap">
                  <div className={cn("w-2 h-2 rounded-full", hasLiveMetrics ? "bg-emerald-400" : hasVerifiedConnectors ? "bg-sky-400" : "bg-[var(--sigma-primary)]")} aria-hidden="true" />
                  <span>Format: <strong className="text-[var(--sigma-text)]">{selectedIndustry.name}</strong></span>
                  <span className="opacity-30" aria-hidden="true">•</span>
                  <span>Target ICP: <span className="text-[var(--sigma-text-soft)]">{selectedIndustry.targetIcp}</span></span>
                  <span className="opacity-30" aria-hidden="true">•</span>
                  <span>Updated: {format(new Date(), 'MMM dd, yyyy, HH:mm')}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
              {/* Media Mode Toggle */}
              <div className="sigma-segmented" role="group" aria-label="Dashboard media mode">
                {(['organic', 'paid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setMediaMode(mode)}
                    aria-pressed={mediaMode === mode}
                    className={cn(
                      'sigma-segment capitalize',
                      mediaMode === mode && 'sigma-segment-active'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Industry Format Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                  className="px-3.5 py-2 glass-panel rounded-xl hover:bg-[var(--sigma-surface-subtle)] transition-all text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-2 border border-[var(--sigma-border)] cursor-pointer"
                  title="Select Industry Format & Channel Benchmarks"
                >
                  <Briefcase size={14} className="text-[var(--sigma-primary)]" />
                  <span>{selectedIndustry.name}</span>
                  <ChevronDown size={14} className={cn("transition-transform duration-200 text-[var(--sigma-text-muted)]", showIndustryDropdown ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                  {showIndustryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full right-0 mt-2 w-72 glass-panel border border-[var(--sigma-border)] rounded-xl p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] border-b border-[var(--sigma-border)] mb-1">
                        Industry Formats & ICP Profiles
                      </div>
                      {INDUSTRY_REPORT_FORMATS.map((formatOption) => {
                        const isSelected = formatOption.id === selectedIndustryId;
                        return (
                          <button
                            key={formatOption.id}
                            onClick={() => handleSelectIndustry(formatOption.id)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer",
                              isSelected 
                                ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-bold" 
                                : "hover:bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)]"
                            )}
                          >
                            <div>
                              <div className="font-semibold text-[var(--sigma-text)]">{formatOption.name}</div>
                              <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5 line-clamp-1">{formatOption.targetIcp}</div>
                            </div>
                            {isSelected && <Check size={14} className="text-[var(--sigma-primary)] shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Color Profiles Selector */}
              <div className="flex items-center glass-panel border border-[var(--sigma-border)] rounded-xl p-1 gap-1">
                <button
                  onClick={() => handleSelectColorProfile('amber')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                    colorProfileKey === 'amber' ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-semibold border border-[var(--sigma-border)]" : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                  )}
                  title="Vermilion & Slate Profile"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF481B]" />
                  <span>Vermilion</span>
                </button>
                <button
                  onClick={() => handleSelectColorProfile('indigo')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                    colorProfileKey === 'indigo' ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-semibold border border-[var(--sigma-border)]" : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                  )}
                  title="Royal Indigo Profile"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Indigo</span>
                </button>
                <button
                  onClick={() => handleSelectColorProfile('emerald')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                    colorProfileKey === 'emerald' ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-semibold border border-[var(--sigma-border)]" : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                  )}
                  title="Emerald Profile"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Emerald</span>
                </button>
              </div>

              {/* Date Picker */}
              <div className="relative">
                 <button 
                   onClick={() => setShowDateOptions(!showDateOptions)}
                   className="px-3.5 py-2 glass-panel border border-[var(--sigma-border)] rounded-xl hover:bg-[var(--sigma-surface-subtle)] transition-all text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-2 cursor-pointer"
                 >
                   <Calendar size={14} className="text-[var(--sigma-text-muted)]" />
                   <span className="px-1.5 py-0.5 rounded bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-mono text-[11px]">
                     {selectedPresetLabel}
                   </span>
                 </button>
                 <AnimatePresence>
                    {showDateOptions && (
                       <motion.div 
                         initial={{ opacity: 0, y: 8 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 8 }}
                         className="absolute top-full right-0 mt-2 w-56 glass-panel border border-[var(--sigma-border)] rounded-xl p-2 shadow-2xl z-50"
                       >
                         <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] border-b border-[var(--sigma-border)] mb-1">
                           Preset Date Ranges
                         </div>
                         {datePresets.map((p) => {
                           const isActive = selectedPresetLabel === p.label;
                           return (
                             <button 
                               key={p.label}
                               onClick={() => { 
                                 setSelectedPresetLabel(p.label);
                                 setDateRange(p.get()); 
                                 setShowDateOptions(false); 
                               }}
                               className={cn(
                                 "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer",
                                 isActive ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] font-semibold" : "hover:bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)]"
                               )}
                             >
                               <span>{p.label}</span>
                               {isActive && <Check size={14} className="text-[var(--sigma-primary)]" />}
                             </button>
                           );
                         })}
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                icon={isEditMode ? <Check size={14} /> : <Settings2 size={14} />}
              >
                {isEditMode ? 'Lock Layout' : 'Customize'}
              </Button>
              
              <div className="relative">
                 <Button
                   variant="primary"
                   size="sm"
                   onClick={() => setShowExportOptions(!showExportOptions)}
                   isLoading={isExporting}
                   icon={<Download size={14} />}
                 >
                   Export Report
                 </Button>
                 
                 <AnimatePresence>
                    {showExportOptions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full right-0 mt-2 w-52 glass-panel border border-[var(--sigma-border)] rounded-xl p-2 shadow-2xl z-50 overflow-hidden"
                      >
                        {[
                          { type: 'PDF', label: 'PDF Report', icon: FileText },
                          { type: 'PPTX', label: 'Presentation Deck (HTML/PDF)', icon: FileJson },
                          { type: 'XLSX', label: 'Excel Dataset', icon: FileSpreadsheet },
                        ].map((opt) => (
                          <button 
                            key={opt.type}
                            onClick={() => handleExport(opt.type as any)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[var(--sigma-surface-subtle)] rounded-lg flex items-center gap-2.5 text-xs font-medium text-[var(--sigma-text)] transition-colors cursor-pointer"
                          >
                             <opt.icon size={15} className="text-[var(--sigma-text-muted)]" /> {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
              </div>
            </div>
          </div>

          {/* Connection & Benchmark Synchronization Banner */}
          <GlassCard className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={cn(
                "p-2.5 rounded-xl border shrink-0",
                hasLiveMetrics 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-accent" 
                  : hasVerifiedConnectors 
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-accent" 
                  : "bg-[var(--sigma-primary-subtle)] border-[var(--sigma-primary)]/30 text-[var(--sigma-primary)]"
              )}>
                {hasVerifiedConnectors ? <CheckCircle size={18} /> : <BarChart3 size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--sigma-text)] flex items-center gap-2">
                  <span>{hasLiveMetrics ? "Live Metrics Active" : hasVerifiedConnectors ? "Connectors Verified, Awaiting Metrics" : "Industry Benchmark Mode"}</span>
                  <Badge variant="outline" size="sm">
                    {selectedIndustry.name}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">
                  {hasLiveMetrics
                    ? `${reportingMetrics.providers?.length || connectedMarketingPipelines.length} marketing connectors supplied current metrics for this report.`
                    : hasVerifiedConnectors
                    ? `${connectedMarketingPipelines.length} marketing connectors have verified access. Metrics normalization in progress.`
                    : `Illustrative reference values from the ${selectedIndustry.name} template. These are not client performance data. Connect verified sources to replace them.`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/connectors')}
                icon={<ExternalLink size={13} />}
              >
                {hasVerifiedConnectors ? "Manage Connectors" : "Connect Pipelines"}
              </Button>
            </div>
          </GlassCard>

          {isEditMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass-panel border border-[var(--sigma-primary)]/30 rounded-2xl p-4 flex flex-wrap gap-2"
            >
               <span className="text-xs font-semibold text-[var(--sigma-text)] w-full mb-1">Toggle Dashboard Widgets</span>
               {(Object.keys(visibleWidgets) as Array<keyof typeof visibleWidgets>).map((id) => (
                 <button 
                   key={id}
                   onClick={() => toggleWidget(id)}
                   className={cn(
                     "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                     visibleWidgets[id] 
                       ? "bg-[var(--sigma-primary)] text-white" 
                       : "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] line-through"
                   )}
                 >
                   {visibleWidgets[id] ? <Eye size={12} /> : <EyeOff size={12} />} {id}
                 </button>
               ))}
            </motion.div>
          )}

          {/* Industry-Specific KPI Summary */}
          <GlassCard className="p-5 sm:p-6" spotlight>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.09em] text-[var(--sigma-accent)] shrink-0">Benchmark reference</span>
                <span className="text-[11px] text-[var(--sigma-text-muted)] truncate">Illustrative values from the {selectedIndustry.name} template, not measured client performance</span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5 lg:gap-x-0 lg:divide-x lg:divide-[var(--sigma-border)] mt-5">
              {[
                { name: selectedIndustry.metrics.primaryKpiName, value: selectedIndustry.metrics.primaryKpiValue, sub: 'Template reference', wide: true },
                { name: selectedIndustry.metrics.secondaryKpiName, value: selectedIndustry.metrics.secondaryKpiValue, sub: 'Template reference', wide: false },
                { name: 'CAC Benchmark', value: selectedIndustry.metrics.cacBenchmark, sub: 'Sector acquisition cost', wide: false },
                { name: 'ROAS Target', value: selectedIndustry.metrics.roasBenchmark, sub: 'Sector return benchmark', wide: false },
              ].map((kpi) => (
                <div key={kpi.name} className={cn('min-w-0', kpi.wide && 'lg:pl-6 first:pl-0')}>
                  <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] truncate" title={kpi.name}>{kpi.name}</div>
                  <div className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums tracking-tight text-[var(--sigma-text)] mt-1.5 leading-none break-all">{kpi.value}</div>
                  <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2">{kpi.sub}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Metrics */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {visibleWidgets.spend && (
                  <motion.div key="widget-spend" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <MetricWidget 
                      label={mediaMode === 'organic' ? "Organic Sessions" : "Total Ad Spend"}
                      value={hasLiveMetrics ? (mediaMode === 'organic' ? formatNumber(organicSnapshot.sessions) : formatCurrency(liveMetrics.spend)) : (mediaMode === 'organic' ? "0" : "$0.00")}
                      delta={{
                        value: hasLiveMetrics ? "Live" : hasVerifiedConnectors ? "Awaiting" : "Baseline",
                        trend: hasLiveMetrics ? 'up' : 'neutral',
                        label: hasLiveMetrics ? 'Connector feed' : 'Connectors required'
                      }}
                      subtext={hasLiveMetrics ? "Normalized pipeline data" : hasVerifiedConnectors ? "Connector access verified; awaiting metrics." : "Link ad networks in Connectors to stream live figures."}
                      icon={<Target size={16} className="text-[var(--sigma-primary)]" />}
                    />
                  </motion.div>
                )}
                {visibleWidgets.conversion && (
                  <motion.div key="widget-conv" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <MetricWidget 
                      label={mediaMode === 'organic' ? "Active Users" : "Conversion Rate"}
                      value={mediaMode === 'organic' ? formatNumber(organicSnapshot.activeUsers) : `${liveMetrics.conversion.toFixed(2)}%`}
                      delta={
                        hasLiveMetrics
                          ? undefined
                          : { value: selectedIndustry.metrics.conversionRate, trend: 'neutral' as const, label: `${selectedIndustry.name} benchmark` }
                      }
                      subtext={hasLiveMetrics ? "Live sessions verified; the connector feed has no prior-period delta to compare against." : `${selectedIndustry.name} baseline`}
                      icon={<Rocket size={16} className="text-[var(--sigma-primary)]" />}
                    />
                  </motion.div>
                )}
                {visibleWidgets.roas && (
                  <motion.div key="widget-roas" layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <MetricWidget 
                      label={mediaMode === 'organic' ? "Organic Conversions" : "Blended ROAS"}
                      value={mediaMode === 'organic' ? formatNumber(organicSnapshot.conversions) : (hasLiveMetrics ? `${liveMetrics.roas.toFixed(1)}x` : selectedIndustry.metrics.roasBenchmark)}
                      delta={{
                        value: hasLiveMetrics ? "3.8x Target" : "Benchmark",
                        trend: hasLiveMetrics ? 'up' : 'neutral',
                        label: 'Efficiency index'
                      }}
                      subtext={hasLiveMetrics ? "Attributed multichannel return" : "Requires normalized spend payload"}
                      icon={<TrendingUp size={16} className="text-[var(--sigma-primary)]" />}
                    />
                  </motion.div>
                )}
                {role === 'ADMIN' && visibleWidgets.adminStats && (
                  <motion.div key="widget-admin" layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
                    <GlassCard className="p-5" spotlight>
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-[var(--sigma-text)]">Runtime Status</span>
                         <Badge variant="default" size="sm">Not measured</Badge>
                       </div>
                       <p className="text-xs leading-5 text-[var(--sigma-text-muted)]">No server health or active-agent telemetry is connected to this card.</p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center/Right Card: Performance Velocity */}
            {visibleWidgets.velocity && (
              <GlassCard spotlight className="col-span-12 lg:col-span-8 p-6 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-display text-[var(--sigma-text)]">Performance Velocity</h2>
                      <Badge variant={hasLiveMetrics ? "success" : "default"} dot>
                        {hasLiveMetrics ? 'Live Stream' : 'Benchmark Model'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--sigma-text-muted)] mt-1">
                      {hasLiveMetrics
                        ? `Illustrative shape from connector-supplied period totals; the feed returns period aggregates, not a per-day series. Live figures are in the KPI tiles below.`
                        : 'Industry benchmark trend (illustrative reference, not measured performance)'} for {selectedPresetLabel} ({format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')})
                    </p>
                  </div>
                  <div className="sigma-segmented !p-1" role="group" aria-label="Chart range preset">
                    {[
                      { label: '30D', preset: 'Last 30 Days' },
                      { label: '90D', preset: 'This Quarter' },
                      { label: 'LQ', preset: 'Last Quarter' },
                    ].map((t) => {
                      const isActive = selectedPresetLabel === t.preset;
                      return (
                        <button
                          key={t.label}
                          onClick={() => {
                            const targetPreset = datePresets.find(p => p.label === t.preset);
                            if (targetPreset) {
                              setSelectedPresetLabel(targetPreset.label);
                              setDateRange(targetPreset.get());
                            }
                          }}
                          aria-pressed={isActive}
                          className={cn(
                            "sigma-segment !min-h-[30px] !px-2.5 font-mono !text-[11px]",
                            isActive && "sigma-segment-active"
                          )}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In live mode the metrics endpoint returns period totals only,
                    not a per-day series. The area below is an illustrative shape
                    scaled from those totals — the KPI chips under it carry the
                    real, connector-supplied numbers. */}
                <div className="flex-1 min-h-[300px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF481B" stopOpacity={0.28}/>
                          <stop offset="95%" stopColor="#FF481B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sigma-border)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--sigma-text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} 
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FF481B" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-[var(--sigma-border)] relative z-10">
                   <div>
                      <div className="text-xs text-[var(--sigma-text-muted)] mb-1">Reference period</div>
                      <div className="text-base font-bold font-mono tabular-nums text-[var(--sigma-text)]">{selectedPresetLabel}</div>
                   </div>
                   <div>
                      <div className="text-xs text-[var(--sigma-text-muted)] mb-1">Average CVR</div>
                      <div className="text-base font-bold font-mono tabular-nums text-[var(--sigma-text)]">
                        {hasLiveMetrics ? `${liveMetrics.conversion.toFixed(2)}%` : selectedIndustry.metrics.conversionRate}
                      </div>
                   </div>
                   <div>
                      <div className="text-xs text-[var(--sigma-text-muted)] mb-1">Series basis</div>
                      <div className="text-base font-bold font-mono text-[var(--sigma-text-soft)] flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", hasLiveMetrics ? "bg-[var(--sigma-primary)]" : "bg-[var(--sigma-text-muted)]")} />
                        {hasLiveMetrics ? 'Connector totals' : 'Benchmark model'}
                      </div>
                   </div>
                </div>
              </GlassCard>
            )}

            {/* Incoming Data Intake Metrics Trend Analysis */}
            <div className="col-span-12">
              <IntakeMetricsChart isLive={false} />
            </div>

            {/* Bottom Table: Top Performance Segments */}
            {visibleWidgets.segments && (
              <GlassCard className="col-span-12 lg:col-span-8 p-0 overflow-hidden" spotlight={false}>
                <div className="p-5 sm:p-6 border-b border-[var(--sigma-border)] flex justify-between items-center gap-4 bg-[var(--sigma-surface-subtle)]/60">
                  <div>
                    <h2 className="sigma-section-title">Channel Benchmarks & Performance</h2>
                    <p className="text-xs text-[var(--sigma-text-muted)] mt-1">
                      {selectedIndustry.name} • {selectedIndustry.targetIcp} • illustrative reference values, not measured client performance
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/paid-ads')}
                    className="text-xs font-semibold text-[var(--sigma-primary)] hover:underline flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Media Plans <ExternalLink size={13} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead className="text-xs font-medium text-[var(--sigma-text-muted)] bg-[var(--sigma-surface-subtle)] border-b border-[var(--sigma-border)]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Channel / Network</th>
                        <th className="px-5 py-3 font-medium text-center">CVR Benchmark</th>
                        <th className="px-5 py-3 font-medium text-center">ROAS Target</th>
                        <th className="px-5 py-3 font-medium text-center">Target CPC / CPA</th>
                        <th className="px-5 py-3 font-medium text-center">Budget Share</th>
                        <th className="px-5 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sigma-border)]">
                      {segmentsData.map((seg) => (
                        <tr key={seg.name} className="hover:bg-[var(--sigma-surface-subtle)]/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] flex items-center justify-center shrink-0">
                                  <Target size={15} className="text-[var(--sigma-text-soft)]" />
                               </div>
                               <div>
                                  <div className="text-sm font-semibold text-[var(--sigma-text)]">{seg.name}</div>
                                  <div className="text-xs text-[var(--sigma-text-muted)] mt-0.5">{seg.channelType} • {hasLiveMetrics ? `${formatCurrency(seg.spend)} active` : 'Benchmark'}</div>
                               </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                             <div className="text-xs font-semibold font-mono tabular-nums text-[var(--sigma-text)]">{seg.conv}</div>
                              <div className="w-16 h-1 bg-[var(--sigma-border)] rounded-full mx-auto mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  title={`Illustrative benchmark share (CVR ${seg.conv} relative to the highest benchmark row)`}
                                  style={{ width: `${maxBenchmarkCvr > 0 ? Math.round(((parseFloat(seg.conv) || 0) / maxBenchmarkCvr) * 100) : 0}%` }}
                                />
                             </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                             <div className="text-sm font-bold font-mono tabular-nums text-[var(--sigma-text)]">{seg.roas}</div>
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-xs text-[var(--sigma-text-soft)]">
                            <div>{seg.cpc} <span className="text-[11px] text-[var(--sigma-text-muted)]">CPC</span></div>
                            <div className="text-[11px] text-[var(--sigma-text-muted)]">{seg.cpa} CPA</div>
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-xs text-[var(--sigma-text-soft)]">
                            <span className="px-2 py-0.5 rounded bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-xs">{seg.share}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Badge 
                              variant={seg.status === 'SCALING' ? 'vermilion' : seg.status === 'OPTIMAL' ? 'success' : 'info'}
                              size="sm"
                            >
                              {seg.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!hasLiveMetrics && (
                  <div className="p-4 bg-[var(--sigma-surface-subtle)] border-t border-[var(--sigma-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[var(--sigma-text-muted)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--sigma-primary)] shrink-0" />
                      <span>{hasVerifiedConnectors ? 'Connector access verified; pipeline metrics pending ingestion.' : 'Marketing connectors unlinked. Connect GA4, Google Ads, Meta, LinkedIn, X, or Reddit to stream data.'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/connectors')}
                      icon={<ExternalLink size={12} />}
                    >
                      Manage Connectors
                    </Button>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Right Panel: Activity Feed */}
            {visibleWidgets.signals && (
              <GlassCard className="col-span-12 lg:col-span-4 p-6 flex flex-col" spotlight>
                 <div className="mb-5">
                    <h2 className="text-sm font-semibold text-[var(--sigma-text)]">Activity Feed</h2>
                    <p className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">Verified runs, approvals, and deliveries</p>
                 </div>

                 <div className="rounded-xl border border-dashed border-[var(--sigma-border-strong)] bg-[var(--sigma-surface-subtle)] p-5 text-center flex-1 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-[var(--sigma-text)]">No recorded activity</p>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--sigma-text-muted)]">Agent runs, HITL approvals, and connector deliveries will appear here once ledger events exist for this workspace.</p>
                 </div>
              </GlassCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}
