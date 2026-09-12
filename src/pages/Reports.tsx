import React, { useState } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  BarChart3, 
  PieChart as PieIcon, 
  Table as TableIcon, 
  Layout as LayoutIcon,
  Save,
  Share2,
  Download,
  Sliders,
  ChevronDown,
  X,
  Database,
  FileText,
  FileJson,
  FileSpreadsheet,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Layers,
  Calendar,
  Eye,
  Settings2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportService } from '@/src/services/exportService';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/src/contexts/ToastContext';
import { 
  EXECUTIVE_REPORT_TEMPLATES, 
  ReportTemplate, 
  ChannelCampaignRow,
  CHANNEL_CAMPAIGN_DATA
} from '@/src/data/executiveReportsData';

import ReportTemplateSelector from '@/src/components/reports/ReportTemplateSelector';
import AlignedExecutiveCharts from '@/src/components/reports/AlignedExecutiveCharts';
import ChannelAttributionTable from '@/src/components/reports/ChannelAttributionTable';
import AudienceSegmentationView from '@/src/components/reports/AudienceSegmentationView';

const widgetLibrary = [
  { 
    id: 'w-charts', 
    type: 'Aligned Visualizations', 
    items: [
      { name: 'Revenue Velocity', icon: BarChart3, targetSection: 'charts' },
      { name: 'Channel Donut', icon: PieIcon, targetSection: 'charts' },
      { name: 'CAC Efficiency', icon: LayoutIcon, targetSection: 'charts' }
    ] 
  },
  { 
    id: 'w-tables', 
    type: 'Relational Tables', 
    items: [
      { name: 'Attribution Matrix', icon: TableIcon, targetSection: 'attribution' },
      { name: 'Age & Demographics', icon: Database, targetSection: 'audience' }
    ] 
  },
  { 
    id: 'w-segments', 
    type: 'Intelligence Segments', 
    items: [
      { name: 'ICP Personas', icon: Sparkles, targetSection: 'audience' },
      { name: 'Intent Tiers', icon: Layers, targetSection: 'audience' }
    ] 
  },
];

export default function Reports() {
  const { notifySuccess, notifyInfo } = useToast();

  // Active Template & Layout State
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate>(EXECUTIVE_REPORT_TEMPLATES[0]);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'executive'>('grid');
  const [activeViewSection, setActiveViewSection] = useState<'all' | 'charts' | 'attribution' | 'audience'>('all');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Selected Campaign Detail (for property inspector)
  const [selectedCampaign, setSelectedCampaign] = useState<ChannelCampaignRow | null>(CHANNEL_CAMPAIGN_DATA[0]);

  // Export & Sharing States
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Handle Template Switch
  const handleSelectTemplate = (template: ReportTemplate) => {
    setCurrentTemplate(template);
    notifyInfo(
      `Switched to ${template.name}`,
      `Loaded ${template.badge} configuration, recommended for ${template.targetAudience}.`
    );
  };

  // Handle Save Custom Template
  const handleSaveAsCustomTemplate = (name: string) => {
    notifySuccess(
      'Custom Template Saved',
      `"${name}" has been recorded in your Second Brain AI Workflow Vault.`
    );
  };

  // Handle Save Report
  const handleSaveReport = () => {
    notifySuccess(
      'Executive Report Saved',
      `Saved configuration for "${currentTemplate.name}" with active filters and aligned widgets.`
    );
  };

  // Export handlers
  const handleExportSummaryCSV = () => {
    setIsExporting(true);
    setShowExportOptions(false);

    const exportRows = CHANNEL_CAMPAIGN_DATA.map(r => ({
      'Report Template': currentTemplate.name,
      'Channel': r.channel,
      'Source': r.source,
      'Medium': r.medium,
      'Campaign Name': r.campaignName,
      'Spend ($)': r.spend,
      'Impressions': r.impressions,
      'Clicks': r.clicks,
      'CTR (%)': `${r.ctr}%`,
      'Conversions': r.conversions,
      'CPA ($)': r.cpa,
      'Revenue ($)': r.revenue,
      'ROAS (x)': `${r.roas}x`,
      'Status': r.status,
      'Timestamp': new Date().toISOString()
    }));

    const success = exportService.toCSV(exportRows, `sigmatactix-${currentTemplate.id}-summary.csv`);
    setIsExporting(false);
    if (success) {
      setExportFeedback('Full Executive Attribution CSV downloaded successfully.');
      notifySuccess('CSV Export Completed', 'Campaign attribution dataset exported to standard CSV.');
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const handleExportSummaryPDF = () => {
    setIsExporting(true);
    setShowExportOptions(false);

    const success = exportService.toExecutiveSummaryPDF({
      title: currentTemplate.name,
      category: currentTemplate.category,
      badge: currentTemplate.badge,
      tenantName: 'Sigma Tactix Growth Core',
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      targetAudience: currentTemplate.targetAudience,
      recommendedCadence: currentTemplate.recommendedCadence,
      metrics: currentTemplate.kpiSummary.map(k => ({ 
        label: k.label, 
        value: k.value, 
        change: k.change, 
        isPositive: k.isPositive, 
        subtext: k.subtext 
      })),
      channels: [
        { channel: 'Google Search & PMax', spend: '$38,200', conversions: '1,420', roas: '5.20x', convRate: '4.8%', status: 'SCALING' },
        { channel: 'Meta Ads (IG & FB)', spend: '$29,450', conversions: '1,150', roas: '4.64x', convRate: '3.9%', status: 'OPTIMAL' },
        { channel: 'LinkedIn Sponsored', spend: '$11,600', conversions: '280', roas: '3.80x', convRate: '2.4%', status: 'OPTIMAL' },
        { channel: 'Organic Search & AEO', spend: '$2,800', conversions: '610', roas: '20.89x', convRate: '6.2%', status: 'DOMINANT' }
      ],
      explanations: [
        'Dark Social & AEO Attribution: 82% of qualified buyer touchpoints originate in dark social, podcasts, and AI answer engines prior to Google search.',
        'Creative Hook Saturation: Meta and LinkedIn creative angle frequency crossed 3.8x, triggering algorithmic CTR fatigue before automated 72h hook refreshes.',
        'Entity Knowledge Graph Advantage: Structured categorical schema markup captured 3.4x more conversational citations on ChatGPT and Perplexity than competitors.'
      ],
      nextSteps: [
        {
          priority: 'P0',
          title: 'Seal Dark Social Attribution Leaks & GA4 Protocol Injection',
          timeline: '0-7 Days',
          impact: '+18% Budget Reallocation Gain',
          owner: 'Growth Engineer / Nexus Swarm',
          description: 'Deploy server-side Google Analytics 4 Measurement Protocol and unified second brain attribution telemetry to capture 82% of uncredited buyer touchpoints.'
        },
        {
          priority: 'P1',
          title: 'Deploy Automated Creative Hook Resets (72h Velocity)',
          timeline: '7-21 Days',
          impact: '+24% Meta & LinkedIn CTR Lift',
          owner: 'Creative Director AI / Content Engine',
          description: 'Synthesize 10 fresh carousel card angle tests and long-hook variations under Human-in-the-Loop review to prevent audience ad fatigue.'
        },
        {
          priority: 'P2',
          title: 'Publish Enterprise AEO Topical Graph & Entity Schemas',
          timeline: '21-45 Days',
          impact: '3.2x Generative Engine Citations',
          owner: 'Authority Agent / Second Brain',
          description: 'Inject categorical entity schemas, technical teardowns, and knowledge base nodes into CMS indexing for ChatGPT and Perplexity dominance.'
        }
      ],
      vaults: [
        { name: 'Marketing Vault (Attribution & Campaigns)', records: 18400, status: '100% Encrypted' },
        { name: 'Customer Vault (ICPs & Personas)', records: 480, status: '100% Encrypted' },
        { name: 'Brand Vault (Messaging & Voice)', records: 124, status: '100% Encrypted' },
        { name: 'Authority Vault (Topical Maps & SEO)', records: 310, status: '100% Encrypted' }
      ],
      auditHighlights: [
        `Aligned with ${currentTemplate.targetAudience} priorities under ${currentTemplate.recommendedCadence}.`,
        'Blended ROAS pacing at 4.82x, outperforming baseline target by +0.42x.',
        'Zero attribution leaks detected across Google, Meta, and LinkedIn ingest pipelines.'
      ]
    }, `sigmatactix-${currentTemplate.id}-executive-summary.pdf`);

    setIsExporting(false);
    if (success) {
      setExportFeedback('Executive Summary PDF generated and downloaded.');
      notifySuccess('PDF Export Completed', 'Branded Executive Summary PDF saved with dark theme & next steps.');
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const handleExportCanvasPDF = async () => {
    setIsExporting(true);
    setShowExportOptions(false);
    await exportService.toPDF('report-canvas', `sigmatactix-${currentTemplate.id}-canvas.pdf`);
    setIsExporting(false);
    setExportFeedback('Visual Canvas PDF downloaded.');
    notifySuccess('Canvas PDF Exported', 'Visual report snapshot saved.');
    setTimeout(() => setExportFeedback(null), 4000);
  };

  const handleExportPPTX = async () => {
    setIsExporting(true);
    setShowExportOptions(false);
    const success = await exportService.toPPTX({
      title: currentTemplate.name,
      badge: currentTemplate.badge,
      tenantName: 'Sigma Tactix Growth Core',
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      targetAudience: currentTemplate.targetAudience,
      recommendedCadence: currentTemplate.recommendedCadence,
      metrics: currentTemplate.kpiSummary.map(k => ({
        label: k.label,
        value: k.value,
        change: k.change,
        isPositive: k.isPositive,
        subtext: k.subtext
      })),
      channels: [
        { channel: 'Google Search & PMax', spend: '$38,200', conversions: '1,420', roas: '5.20x', convRate: '4.8%', status: 'SCALING' },
        { channel: 'Meta Ads (IG & FB)', spend: '$29,450', conversions: '1,150', roas: '4.64x', convRate: '3.9%', status: 'OPTIMAL' },
        { channel: 'LinkedIn Sponsored', spend: '$11,600', conversions: '280', roas: '3.80x', convRate: '2.4%', status: 'OPTIMAL' },
        { channel: 'Organic Search & AEO', spend: '$2,800', conversions: '610', roas: '20.89x', convRate: '6.2%', status: 'DOMINANT' }
      ],
      explanations: [
        'Attribution Fidelity: 82% of customer journeys touch dark social & AI answer engines prior to branded Google search.',
        'Creative Decay Rate: Meta ad creative fatigues after 14 days when frequency exceeds 3.5x, requiring autonomous weekly hook resets.',
        'AEO Discovery Index: Competitors with structured JSON-LD entity graphs capture 3x more conversational citations on Perplexity & ChatGPT.',
        'Lead Response Velocity: Inbound inquiries responded to in <5 minutes demonstrate a 10.4x higher pipeline qualification rate.'
      ],
      nextSteps: [
        {
          priority: 'P0',
          title: 'Seal Dark Social Attribution Leaks',
          timeline: '0-7 Days',
          impact: '+18% Budget Efficiency',
          owner: 'Growth Engineer / Nexus Swarm',
          description: 'Deploy server-side Google Analytics 4 Measurement Protocol and unified second brain attribution telemetry.'
        },
        {
          priority: 'P1',
          title: 'Automate Creative Hook Resets Every 72h',
          timeline: '7-21 Days',
          impact: '+24% Meta & LinkedIn CTR',
          owner: 'Creative Director AI / Content Engine',
          description: 'Synthesize 10 fresh carousel card angle tests and long-hook variations under Human-in-the-Loop review.'
        },
        {
          priority: 'P2',
          title: 'Deploy Enterprise AEO Topical Graph',
          timeline: '21-45 Days',
          impact: '3.2x Generative Engine Citations',
          owner: 'Authority Agent / Second Brain',
          description: 'Inject categorical entity schemas, technical teardowns, and knowledge base nodes into CMS indexing.'
        }
      ],
      vaults: [
        { name: 'Marketing Vault (Attribution & Campaigns)', records: 18400, status: '100% Encrypted' },
        { name: 'Customer Vault (ICPs & Personas)', records: 480, status: '100% Encrypted' },
        { name: 'Brand Vault (Messaging & Voice)', records: 124, status: '100% Encrypted' },
        { name: 'Authority Vault (Topical Maps & SEO)', records: 310, status: '100% Encrypted' }
      ]
    }, `sigmatactix-${currentTemplate.id}-deck.pptx`);

    setIsExporting(false);
    if (success) {
      setExportFeedback('Executive Presentation Deck (PPTX) downloaded.');
      notifySuccess('Deck Export Completed', 'Branded 6-slide PPTX presentation generated.');
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`https://sigmatactix.io/share/summary/token_sec_${new Date().getTime()}`);
    setIsCopiedLink(true);
    notifyInfo('Secure Link Copied', 'Encrypted access link copied to clipboard.');
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 -m-8 overflow-hidden bg-[#09090B]">
      
      {/* ==================================================================== */}
      {/* LEFT SIDEBAR: WIDGETS & TEMPLATE SHORTCUTS */}
      {/* ==================================================================== */}
      <div className={cn(
        "border-r border-white/5 flex flex-col bg-[#09090B] transition-all duration-300 z-20",
        isLeftSidebarOpen ? "w-64" : "w-14"
      )}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          {isLeftSidebarOpen ? (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] silver-text">
              <Sparkles size={14} className="text-accent" />
              <span>Report Palette</span>
            </div>
          ) : (
            <Sparkles size={16} className="text-accent mx-auto" />
          )}

          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
            title={isLeftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isLeftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {isLeftSidebarOpen && (
          <div className="flex-1 p-5 space-y-6 overflow-y-auto no-scrollbar">
            {/* Quick Template Switcher in Sidebar */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">
                Templates
              </h4>
              <div className="space-y-1">
                {EXECUTIVE_REPORT_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === currentTemplate.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-sans transition-all flex items-center justify-between group",
                        isSelected 
                          ? "bg-accent/20 text-accent font-bold border border-accent/40" 
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="truncate">{tpl.name}</span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget Groups */}
            {widgetLibrary.map((group) => (
              <div key={group.id} className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">
                  {group.type}
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveViewSection(item.targetSection as any)}
                      className="flex items-center gap-2.5 p-2.5 bg-surface border border-white/5 rounded-xl hover:bg-white/5 hover:border-accent/40 transition-all text-left group"
                    >
                      <item.icon size={15} className="text-muted group-hover:text-accent transition-colors" />
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MAIN WORKSPACE: ALIGNED REPORT CANVAS */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="text-sm font-black silver-text flex items-center gap-2">
              <span>Executive Report:</span> 
              <span className="text-accent">{currentTemplate.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400">
              <Calendar size={11} className="text-accent" />
              <span>Q4 2023 (Oct 1 - Nov 30)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveReport}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
            >
              <Save size={14} /> 
              <span className="hidden sm:inline">Save Report</span>
            </button>

            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all bg-white/5"
            >
              <Share2 size={14} /> 
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={isExporting}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-accent/40 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <span className="animate-spin h-3 w-3 border-2 border-accent border-t-transparent rounded-full" />
                ) : (
                  <Download size={14} className="text-accent" />
                )}
                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
                <ChevronDown size={12} className="text-muted" />
              </button>
              
              <AnimatePresence>
                {showExportOptions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-zinc-950/95 border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-left space-y-1 backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-muted border-b border-white/5">
                      Structured Executive Exports
                    </div>

                    <button 
                      onClick={handleExportSummaryCSV}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet size={16} className="text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-accent">Campaign Attribution (CSV)</div>
                          <div className="text-[9px] font-mono text-zinc-400">Channels, Source, Medium & CPA</div>
                        </div>
                      </div>
                      <Download size={12} className="text-muted opacity-0 group-hover:opacity-100" />
                    </button>

                    <button 
                      onClick={handleExportSummaryPDF}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-rose-400" />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-accent">Executive Summary (PDF)</div>
                          <div className="text-[9px] font-mono text-zinc-400">Branded report for stakeholders</div>
                        </div>
                      </div>
                      <Download size={12} className="text-muted opacity-0 group-hover:opacity-100" />
                    </button>

                    <div className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-muted border-b border-t border-white/5 mt-1">
                      Visual Artifacts
                    </div>

                    <button 
                      onClick={handleExportCanvasPDF}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center gap-2.5 text-xs font-medium text-zinc-300 hover:text-white"
                    >
                      <LayoutIcon size={14} className="text-secondary" />
                      <span>Visual Canvas (PDF)</span>
                    </button>

                    <button 
                      onClick={handleExportPPTX}
                      className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex items-center gap-2.5 text-xs font-medium text-zinc-300 hover:text-white"
                    >
                      <FileJson size={14} className="text-accent" />
                      <span>Presentation Deck (PPTX)</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inspector Toggle */}
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={cn(
                "p-2 rounded-xl border transition-colors",
                isRightSidebarOpen 
                  ? "bg-accent/20 border-accent/40 text-accent" 
                  : "bg-white/5 border-white/10 text-muted hover:text-white"
              )}
              title="Toggle Widget Properties & Dimension Inspector"
            >
              <Sliders size={15} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {exportFeedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-8 py-2.5 flex items-center justify-between text-xs font-mono text-emerald-400 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check size={14} />
              <span>{exportFeedback}</span>
            </div>
            <button onClick={() => setExportFeedback(null)} className="text-emerald-400/60 hover:text-emerald-400">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Scrollable Aligned Canvas */}
        <div 
          className="flex-1 bg-[#09090B] overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8"
          id="report-canvas"
        >
          {/* Subtle Grid Accent Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ 
            backgroundImage: 'linear-gradient(to right, #ffffff40 1px, transparent 1px), linear-gradient(to bottom, #ffffff40 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

          {/* 1. Template Selector & View Filters Bar */}
          <ReportTemplateSelector
            currentTemplate={currentTemplate}
            onSelectTemplate={handleSelectTemplate}
            layoutMode={layoutMode}
            onChangeLayoutMode={setLayoutMode}
            activeViewSection={activeViewSection}
            onChangeViewSection={setActiveViewSection}
            onSaveAsCustomTemplate={handleSaveAsCustomTemplate}
          />

          {/* 2. Aligned Executive KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentTemplate.kpiSummary.map((kpi, idx) => (
              <div 
                key={kpi.label}
                className="p-5 bg-surface border border-white/10 rounded-2xl shadow-xl space-y-2 relative overflow-hidden group hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                    {kpi.label}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                    kpi.isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                  )}>
                    <TrendingUp size={10} />
                    {kpi.change}
                  </span>
                </div>

                <div className="text-2xl font-black silver-text font-mono tracking-tight">
                  {kpi.value}
                </div>

                <div className="text-[11px] text-zinc-400 font-sans truncate">
                  {kpi.subtext}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Aligned Visual Charts Section */}
          {(activeViewSection === 'all' || activeViewSection === 'charts') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-widest silver-text font-mono">
                    Visual Performance Dynamics
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Dual-Axis & Spend Allocation</span>
              </div>

              <AlignedExecutiveCharts layoutMode={layoutMode} templateId={currentTemplate.id} />
            </section>
          )}

          {/* 4. Channel, Source, Medium & Campaign Attribution Table */}
          {(activeViewSection === 'all' || activeViewSection === 'attribution') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-secondary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest silver-text font-mono">
                    Omnichannel Campaign Attribution Table
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Relational Multi-Touch Matrix</span>
              </div>

              <ChannelAttributionTable 
                onRowClick={(row) => {
                  setSelectedCampaign(row);
                  setIsRightSidebarOpen(true);
                  notifyInfo(
                    `Inspecting ${row.campaignName}`,
                    `Source: ${row.source} | Medium: ${row.medium} | Spend: $${row.spend.toLocaleString()} | ROAS: ${row.roas}x`
                  );
                }}
              />
            </section>
          )}

          {/* 5. Audience & ICP Intelligence Segmentation (Demographics & Psychographics) */}
          {(activeViewSection === 'all' || activeViewSection === 'audience') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-widest silver-text font-mono">
                    Audience Intelligence & Persona Segmentation
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Demographics + Second Brain Psychographics</span>
              </div>

              <AudienceSegmentationView />
            </section>
          )}

        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT SIDEBAR: PROPERTIES & DIMENSION INSPECTOR */}
      {/* ==================================================================== */}
      {isRightSidebarOpen && (
        <div className="w-80 border-l border-white/5 flex flex-col bg-background z-20 animate-in slide-in-from-right duration-200">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-accent" />
              <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em]">Dimension Inspector</h4>
            </div>
            <X 
              size={16} 
              className="text-muted cursor-pointer hover:text-white transition-colors" 
              onClick={() => setIsRightSidebarOpen(false)}
            />
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
            {/* Inspected Campaign Card */}
            {selectedCampaign && (
              <div className="p-4 bg-surface border border-accent/30 rounded-xl space-y-3 shadow-lg">
                <span className="text-[10px] font-mono uppercase text-accent font-bold tracking-wider block">
                  Active Selected Entity
                </span>
                <div className="font-bold text-white text-xs font-mono break-all">
                  {selectedCampaign.campaignName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 pt-2 border-t border-white/10">
                  <div>Channel: <strong className="text-white block">{selectedCampaign.channel}</strong></div>
                  <div>Medium: <strong className="text-white block">{selectedCampaign.medium}</strong></div>
                  <div>Spend: <strong className="text-white block">${selectedCampaign.spend.toLocaleString()}</strong></div>
                  <div>ROAS: <strong className="text-emerald-400 block">{selectedCampaign.roas}x</strong></div>
                </div>
              </div>
            )}

            {/* Ingestion Data Sources */}
            <PropertySection label="Ingestion Data Sources">
              <div className="space-y-2">
                <div className="p-3 bg-surface border border-white/10 rounded-xl flex items-center justify-between cursor-pointer group hover:border-accent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-xs text-white">Google Ads API & PMax</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Live</span>
                </div>
                <div className="p-3 bg-surface border border-white/10 rounded-xl flex items-center justify-between cursor-pointer group hover:border-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-xs text-white">Meta Ads Manager</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Live</span>
                </div>
                <div className="p-3 bg-surface border border-white/10 rounded-xl flex items-center justify-between cursor-pointer group hover:border-blue-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-white">HubSpot CRM Attribution</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Live</span>
                </div>
              </div>
            </PropertySection>

            {/* Active Metrics */}
            <PropertySection label="Active Report Metrics">
              <div className="space-y-2.5">
                {['Attributed Spend', 'Blended Revenue', 'ROAS Pacing', 'Conversions & CPA', 'CTR %', 'LTV Prediction'].map((m) => (
                  <div key={m} className="flex items-center justify-between group">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="w-4 h-4 border-2 border-accent rounded flex items-center justify-center bg-accent/20">
                        <div className="w-2 h-2 bg-accent rounded-sm" />
                      </div>
                      <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{m}</span>
                    </label>
                    <span className="text-[9px] font-mono text-zinc-500">Auto</span>
                  </div>
                ))}
              </div>
            </PropertySection>

            {/* Appearance */}
            <PropertySection label="Appearance Palette">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Theme Tone</span>
                  <span className="text-xs font-mono text-accent font-bold">Sigma Obsidian</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Accents</span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-accent rounded-full ring-2 ring-accent/40" />
                    <div className="w-3 h-3 bg-secondary rounded-full" />
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              </div>
            </PropertySection>

            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => {
                  notifySuccess('Second Brain Synced', 'Refreshed dimensional mappings with Customer & Marketing Vaults.');
                }}
                className="w-full py-3 bg-white/5 border border-dashed border-white/10 rounded-xl text-xs font-mono text-muted hover:border-accent/40 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={13} className="text-accent" />
                <span>Sync Relational Dimensions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EXTERNAL SHARING MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Share2 size={18} className="text-accent" />
                  <h3 className="text-base font-bold silver-text">External Report & Data Sharing</h3>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Generate a secure, client-accessible external summary portal link. External stakeholders can inspect read-only performance velocity and download verified CSV / PDF summaries.
              </p>

              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase text-muted">Secure Access Link</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://sigmatactix.io/share/summary/token_sec_9941a8e"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 select-all"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-4 py-2 bg-accent text-background font-black text-xs font-mono rounded-xl hover:opacity-90 flex items-center gap-1.5 transition-all shadow-md"
                  >
                    {isCopiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedLink ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-green-400" /> Security Token:
                  </span>
                  <span className="text-white">HMAC SHA-256 Encrypted</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Expiration:</span>
                  <span className="text-accent">7 Days (Auto-Revoking)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Included Snapshots:</span>
                  <span className="text-secondary">CSV + Executive PDF</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSummaryCSV}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-400" /> Export CSV
                  </button>
                  <button
                    onClick={handleExportSummaryPDF}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5"
                  >
                    <FileText size={13} className="text-rose-400" /> Export PDF
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-mono"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PropertySection({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
       <h5 className="text-[10px] font-black uppercase text-muted/60 tracking-wider font-mono">{label}</h5>
       {children}
    </div>
  );
}
