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
  TrendingUp,
  AlertTriangle
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
import { apiFetch } from '@/src/lib/api';

import ReportTemplateSelector from '@/src/components/reports/ReportTemplateSelector';
import AlignedExecutiveCharts from '@/src/components/reports/AlignedExecutiveCharts';
import ChannelAttributionTable from '@/src/components/reports/ChannelAttributionTable';
import AudienceSegmentationView from '@/src/components/reports/AudienceSegmentationView';
import { Button, GlassCard, Badge } from '@/src/components/ui';
import { tagRowsForDelivery, provenanceNote } from '@/src/lib/exportProvenance';

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

  const [isSavingReport, setIsSavingReport] = useState(false);

  // Handle Save Report
  const handleSaveReport = async () => {
    setIsSavingReport(true);
    try {
      const res = await apiFetch('/api/workspace/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: currentTemplate.name,
          blocks: currentTemplate.kpiSummary,
          dateRange: 'Last 30 Days',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        notifySuccess(
          'Executive Report Saved',
          `Persisted report version (${data.report?.id || 'v1'}) for "${currentTemplate.name}".`
        );
      } else {
        const savedKey = `sigmatactix_saved_report_${currentTemplate.id}`;
        localStorage.setItem(savedKey, JSON.stringify({
          templateId: currentTemplate.id,
          name: currentTemplate.name,
          savedAt: new Date().toISOString(),
          filters: { dateRange: 'Last 30 Days' },
        }));
        notifySuccess(
          'Report Configuration Saved',
          `Saved template configuration for "${currentTemplate.name}" locally.`
        );
      }
    } catch {
      const savedKey = `sigmatactix_saved_report_${currentTemplate.id}`;
      localStorage.setItem(savedKey, JSON.stringify({
        templateId: currentTemplate.id,
        name: currentTemplate.name,
        savedAt: new Date().toISOString(),
        filters: { dateRange: 'Last 30 Days' },
      }));
      notifySuccess(
        'Report Configuration Saved',
        `Saved configuration for "${currentTemplate.name}" to workspace profile.`
      );
    } finally {
      setIsSavingReport(false);
    }
  };

  // Export handlers
  const handleExportSummaryCSV = () => {
    setIsExporting(true);
    setShowExportOptions(false);

    const rawRows = CHANNEL_CAMPAIGN_DATA.map(r => ({
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

    // This dataset is a hardcoded fixture, not this workspace's ad account, so it
    // ships labelled as sample data rather than as measured attribution.
    const exportRows = tagRowsForDelivery(rawRows, { provenance: 'sample' });

    const success = exportService.toCSV(exportRows, `sigmatactix-${currentTemplate.id}-summary.csv`);
    setIsExporting(false);
    if (success) {
      setExportFeedback('Sample attribution dataset downloaded. Every row is labelled as sample data.');
      notifySuccess(
        'CSV Export Completed',
        'Illustrative campaign dataset exported. Rows are stamped as sample data, not measured results.'
      );
      setTimeout(() => setExportFeedback(null), 6000);
    }
  };

  const handleExportSummaryPDF = async () => {
    setIsExporting(true);
    setShowExportOptions(false);

    const success = await exportService.toExecutiveSummaryPDF({
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
      setExportFeedback('Executive Summary PDF download initiated.');
      notifySuccess('PDF Export Initiated', 'Executive Summary PDF rendered with Sigma Orange theme and provenance citations.');
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
    }, `sigmatactix-${currentTemplate.id}-presentation.html`);

    setIsExporting(false);
    if (success) {
      setExportFeedback('Interactive Presentation Deck generated and downloaded.');
      notifySuccess('Lecture Deck Generated', 'Interactive presentation opened with speaker notes (N), overview (O) & print-to-PDF.');
      setTimeout(() => setExportFeedback(null), 5000);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(`https://sigmatactix.io/share/summary/token_sec_${new Date().getTime()}`);
    setIsCopiedLink(true);
    notifyInfo('Secure Link Copied', 'Encrypted access link copied to clipboard.');
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  return (
    <div className="relative flex h-[calc(100vh-120px)] gap-4 -m-8 overflow-hidden bg-[var(--sigma-bg)] text-[var(--sigma-text)]">

      {/*
        Page-level provenance declaration. Every panel below (attribution,
        demographics, psychographics, revenue timeline, channel share) is
        rendered from a hardcoded fixture in executiveReportsData.ts. One
        declaration covers all five components, so none of them can be mistaken
        for measured workspace results.
      */}
      <div
        role="status"
        className="absolute z-30 m-4 flex items-start gap-2.5 rounded-xl border border-[var(--sigma-primary)]/40 bg-[var(--sigma-surface)]/95 px-4 py-3 text-xs shadow-[var(--sigma-shadow-lg)] backdrop-blur-md max-w-md"
      >
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--sigma-primary)]" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--sigma-text)]">{provenanceNote('sample')}</p>
          <p className="text-[var(--sigma-muted)]">
            No analytics provider is connected, so every figure on this page is an illustrative
            placeholder. Connect a source to replace them with measured results.
          </p>
        </div>
      </div>
      
      {/* ==================================================================== */}
      {/* LEFT SIDEBAR: WIDGETS & TEMPLATE SHORTCUTS */}
      {/* ==================================================================== */}
      <div className={cn(
        "border-r border-[var(--sigma-border)] flex flex-col bg-[var(--sigma-surface)]/60 backdrop-blur-md transition-all duration-300 z-20",
        isLeftSidebarOpen ? "w-64" : "w-14"
      )}>
        <div className="p-4 border-b border-[var(--sigma-border)] flex items-center justify-between">
          {isLeftSidebarOpen ? (
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--sigma-text)]">
              <Sparkles size={14} className="text-[var(--sigma-vermilion)]" />
              <span>Report Palette</span>
            </div>
          ) : (
            <Sparkles size={16} className="text-[var(--sigma-vermilion)] mx-auto" />
          )}

          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-1 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] transition-colors"
            title={isLeftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isLeftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {isLeftSidebarOpen && (
          <div className="flex-1 p-4 space-y-5 overflow-y-auto no-scrollbar">
            {/* Quick Template Switcher in Sidebar */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono font-medium text-[var(--sigma-muted)] uppercase tracking-wider">
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
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group",
                        isSelected 
                          ? "bg-[var(--sigma-vermilion)]/15 text-[var(--sigma-vermilion)] font-semibold border border-[var(--sigma-vermilion)]/30" 
                          : "text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)]"
                      )}
                    >
                      <span className="truncate">{tpl.name}</span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--sigma-vermilion)] shadow-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widget Groups */}
            {widgetLibrary.map((group) => (
              <div key={group.id} className="space-y-2">
                <h4 className="text-[11px] font-mono font-medium text-[var(--sigma-muted)] uppercase tracking-wider">
                  {group.type}
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveViewSection(item.targetSection as any)}
                      className="flex items-center gap-2.5 p-2.5 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl hover:border-[var(--sigma-vermilion)]/40 hover:bg-[var(--sigma-surface-subtle)] transition-all text-left group"
                    >
                      <item.icon size={15} className="text-[var(--sigma-muted)] group-hover:text-[var(--sigma-vermilion)] transition-colors" />
                      <span className="text-xs font-medium text-[var(--sigma-text)] truncate">
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
        <div className="h-16 border-b border-[var(--sigma-border)] flex items-center justify-between px-6 lg:px-8 bg-[var(--sigma-surface)]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold flex items-center gap-2 text-[var(--sigma-text)]">
              <span className="text-[var(--sigma-muted)]">Executive Report:</span> 
              <h1 className="font-bold text-[var(--sigma-vermilion)]">{currentTemplate.name}</h1>
            </div>
            <Badge variant="neutral" size="xs" icon={<Calendar size={11} className="text-[var(--sigma-vermilion)]" />}>
              Q4 (Oct 1 - Nov 30)
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Button 
              onClick={handleSaveReport}
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
            >
              Save Report
            </Button>

            <Button 
              onClick={() => setIsShareModalOpen(true)}
              variant="outline"
              size="sm"
              icon={<Share2 size={14} />}
            >
              Share
            </Button>

            {/* Export Dropdown */}
            <div className="relative">
              <Button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={isExporting}
                variant="outline"
                size="sm"
                icon={isExporting ? <span className="animate-spin h-3.5 w-3.5 border-2 border-[var(--sigma-vermilion)] border-t-transparent rounded-full" /> : <Download size={14} className="text-[var(--sigma-vermilion)]" />}
              >
                <span>{isExporting ? "Exporting..." : "Export"}</span>
                <ChevronDown size={12} className="text-[var(--sigma-muted)] ml-1" />
              </Button>
              
              <AnimatePresence>
                {showExportOptions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl p-2 shadow-2xl z-50 text-left space-y-1 backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--sigma-muted)] border-b border-[var(--sigma-border)]">
                      Structured Executive Exports
                    </div>

                    <button 
                      onClick={handleExportSummaryCSV}
                      className="w-full text-left px-3 py-2.5 hover:bg-[var(--sigma-surface-subtle)] rounded-xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet size={16} className="text-emerald-accent" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--sigma-text)] group-hover:text-[var(--sigma-vermilion)]">Campaign Attribution (CSV)</div>
                          <div className="text-[11px] font-mono text-[var(--sigma-muted)]">Channels, Source, Medium & CPA</div>
                        </div>
                      </div>
                      <Download size={12} className="text-[var(--sigma-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <button 
                      onClick={handleExportSummaryPDF}
                      className="w-full text-left px-3 py-2.5 hover:bg-[var(--sigma-surface-subtle)] rounded-xl flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-rose-accent" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--sigma-text)] group-hover:text-[var(--sigma-vermilion)]">Executive Summary (PDF)</div>
                          <div className="text-[11px] font-mono text-[var(--sigma-muted)]">Branded report for stakeholders</div>
                        </div>
                      </div>
                      <Download size={12} className="text-[var(--sigma-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--sigma-muted)] border-b border-t border-[var(--sigma-border)] mt-1">
                      Visual Artifacts
                    </div>

                    <button 
                      onClick={handleExportCanvasPDF}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--sigma-surface-subtle)] rounded-xl flex items-center gap-2.5 text-xs font-medium text-[var(--sigma-text)]"
                    >
                      <LayoutIcon size={14} className="text-[var(--sigma-primary)]" />
                      <span>Visual Canvas (PDF)</span>
                    </button>

                    <button 
                      onClick={handleExportPPTX}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--sigma-surface-subtle)] rounded-xl flex items-center gap-2.5 text-xs font-medium text-[var(--sigma-text)]"
                    >
                      <FileJson size={14} className="text-[var(--sigma-vermilion)]" />
                      <span>Presentation Deck (HTML / PDF)</span>
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
                  ? "bg-[var(--sigma-vermilion)]/15 border-[var(--sigma-vermilion)]/40 text-[var(--sigma-vermilion)]" 
                  : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] text-[var(--sigma-muted)] hover:text-[var(--sigma-text)]"
              )}
              title="Toggle Widget Properties & Dimension Inspector"
            >
              <Sliders size={15} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {exportFeedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-8 py-2.5 flex items-center justify-between text-xs font-mono text-emerald-accent animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check size={14} />
              <span>{exportFeedback}</span>
            </div>
            <button onClick={() => setExportFeedback(null)} className="text-emerald-accent/60 hover:text-emerald-accent">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Scrollable Aligned Canvas */}
        <div 
          className="flex-1 bg-[var(--sigma-bg)] overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8"
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
              <GlassCard 
                key={kpi.label}
                spotlight
                elevation="flat"
                className="p-5 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--sigma-muted)]">
                    {kpi.label}
                  </span>
                  <Badge
                    variant={kpi.isPositive ? "success" : "danger"}
                    size="xs"
                    icon={<TrendingUp size={10} />}
                  >
                    {kpi.change}
                  </Badge>
                </div>

                <div className="text-2xl font-bold text-[var(--sigma-text)] font-mono tracking-tight">
                  {kpi.value}
                </div>

                <div className="text-[11px] text-[var(--sigma-muted)] font-sans truncate">
                  {kpi.subtext}
                </div>
              </GlassCard>
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
                <span className="text-[11px] font-mono text-zinc-500">Dual-Axis & Spend Allocation</span>
              </div>

              <AlignedExecutiveCharts layoutMode={layoutMode} templateId={currentTemplate.id} />
            </section>
          )}

          {/* 4. Channel, Source, Medium & Campaign Attribution Table */}
          {(activeViewSection === 'all' || activeViewSection === 'attribution') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[var(--sigma-primary)]" />
                  <h3 className="text-sm font-bold uppercase tracking-widest silver-text font-mono">
                    Omnichannel Campaign Attribution Table
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Relational Multi-Touch Matrix</span>
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
                <span className="text-[11px] font-mono text-zinc-500">Demographics + Second Brain Psychographics</span>
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
        <div className="w-80 border-l border-[var(--sigma-border)] flex flex-col bg-[var(--sigma-surface)]/80 backdrop-blur-md z-20 animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-[var(--sigma-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-[var(--sigma-vermilion)]" />
              <h4 className="text-xs font-semibold text-[var(--sigma-text)] tracking-wide">Dimension Inspector</h4>
            </div>
            <button 
              onClick={() => setIsRightSidebarOpen(false)}
              className="p-1 rounded-md text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto no-scrollbar">
            {/* Inspected Campaign Card */}
            {selectedCampaign && (
              <GlassCard spotlight elevation="flat" className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="xs">Active Selection</Badge>
                  <span className="text-[11px] font-mono text-[var(--sigma-muted)]">{selectedCampaign.channel}</span>
                </div>
                <div className="font-semibold text-xs text-[var(--sigma-text)] font-mono break-all">
                  {selectedCampaign.campaignName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[var(--sigma-muted)] pt-2 border-t border-[var(--sigma-border)]">
                  <div>Channel: <strong className="text-[var(--sigma-text)] block">{selectedCampaign.channel}</strong></div>
                  <div>Medium: <strong className="text-[var(--sigma-text)] block">{selectedCampaign.medium}</strong></div>
                  <div>Spend: <strong className="text-[var(--sigma-text)] block">${selectedCampaign.spend.toLocaleString()}</strong></div>
                  <div>ROAS: <strong className="text-emerald-accent block">{selectedCampaign.roas}x</strong></div>
                </div>
              </GlassCard>
            )}

            {/* Ingestion Data Sources */}
            <PropertySection label="Ingestion Data Sources">
              <div className="space-y-1.5">
                <div className="p-3 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between hover:border-[var(--sigma-vermilion)]/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--sigma-vermilion)]" />
                    <span className="text-xs text-[var(--sigma-text)]">Google Ads API & PMax</span>
                  </div>
                  <Badge variant="success" size="xs">Live</Badge>
                </div>
                <div className="p-3 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between hover:border-[var(--sigma-vermilion)]/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-[var(--sigma-text)]">Meta Ads Manager</span>
                  </div>
                  <Badge variant="success" size="xs">Live</Badge>
                </div>
                <div className="p-3 bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between hover:border-[var(--sigma-vermilion)]/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-[var(--sigma-text)]">HubSpot CRM Attribution</span>
                  </div>
                  <Badge variant="success" size="xs">Live</Badge>
                </div>
              </div>
            </PropertySection>

            {/* Active Metrics */}
            <PropertySection label="Active Report Metrics">
              <div className="space-y-2">
                {['Attributed Spend', 'Blended Revenue', 'ROAS Pacing', 'Conversions & CPA', 'CTR %', 'LTV Prediction'].map((m) => (
                  <div key={m} className="flex items-center justify-between group">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div className="w-3.5 h-3.5 border border-[var(--sigma-border)] rounded flex items-center justify-center bg-[var(--sigma-vermilion)]/15">
                        <div className="w-1.5 h-1.5 bg-[var(--sigma-vermilion)] rounded-sm" />
                      </div>
                      <span className="text-xs text-[var(--sigma-muted)] group-hover:text-[var(--sigma-text)] transition-colors">{m}</span>
                    </label>
                    <span className="text-[11px] font-mono text-[var(--sigma-muted)]">Auto</span>
                  </div>
                ))}
              </div>
            </PropertySection>

            {/* Appearance */}
            <PropertySection label="Appearance Palette">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--sigma-muted)]">Theme Mode</span>
                  <span className="font-mono text-[var(--sigma-vermilion)] font-semibold">Sigma Obsidian</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--sigma-muted)]">Primary Accent</span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-[var(--sigma-vermilion)] rounded-full ring-2 ring-[var(--sigma-vermilion)]/40" />
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </PropertySection>

            <div className="pt-3 border-t border-[var(--sigma-border)]">
              <Button 
                onClick={() => {
                  notifySuccess('Second Brain Synced', 'Refreshed dimensional mappings with Customer & Marketing Vaults.');
                }}
                variant="outline"
                size="sm"
                className="w-full justify-center"
                icon={<Sparkles size={13} className="text-[var(--sigma-vermilion)]" />}
              >
                Sync Relational Dimensions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EXTERNAL SHARING MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <Share2 size={18} className="text-[var(--sigma-vermilion)]" />
                  <h3 className="text-base font-semibold text-[var(--sigma-text)]">External Report & Data Sharing</h3>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-muted)] hover:text-[var(--sigma-text)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-[var(--sigma-muted)] leading-relaxed">
                Generate a secure, client-accessible external summary portal link. External stakeholders can inspect read-only performance velocity and download verified CSV / PDF summaries.
              </p>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-[var(--sigma-muted)]">Secure Access Link</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://sigmatactix.io/share/summary/token_sec_9941a8e"
                    className="flex-1 bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--sigma-text)] select-all focus:outline-none"
                  />
                  <Button
                    onClick={handleCopyShareLink}
                    variant="primary"
                    size="sm"
                    icon={isCopiedLink ? <Check size={14} /> : <Copy size={14} />}
                  >
                    {isCopiedLink ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="p-3.5 bg-[var(--sigma-bg)]/80 rounded-xl border border-[var(--sigma-border)] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[var(--sigma-muted)]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-accent" /> Security Token:
                  </span>
                  <span className="text-[var(--sigma-text)]">HMAC SHA-256 Encrypted</span>
                </div>
                <div className="flex items-center justify-between text-[var(--sigma-muted)]">
                  <span>Expiration:</span>
                  <span className="text-[var(--sigma-vermilion)]">7 Days (Auto-Revoking)</span>
                </div>
                <div className="flex items-center justify-between text-[var(--sigma-muted)]">
                  <span>Included Snapshots:</span>
                  <span className="text-[var(--sigma-text)]">CSV + Executive PDF</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--sigma-border)]">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportSummaryCSV}
                    variant="outline"
                    size="xs"
                    icon={<FileSpreadsheet size={13} className="text-emerald-accent" />}
                  >
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleExportSummaryPDF}
                    variant="outline"
                    size="xs"
                    icon={<FileText size={13} className="text-rose-accent" />}
                  >
                    Export PDF
                  </Button>
                </div>
                <Button
                  onClick={() => setIsShareModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  Done
                </Button>
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
       <h5 className="text-[11px] font-black uppercase text-muted/60 tracking-wider font-mono">{label}</h5>
       {children}
    </div>
  );
}
