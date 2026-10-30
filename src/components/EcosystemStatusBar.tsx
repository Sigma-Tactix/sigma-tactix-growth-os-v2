import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Search,
  Bot,
  Database,
  Layers,
  Cpu,
  Zap,
  ShieldCheck,
  Check,
  X,
  Sliders,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/src/contexts/ToastContext';
import QuickFixAssistant, { QuickFixData } from '@/src/components/QuickFixAssistant';
import { isDemoSeedEnabled } from '@/src/lib/demoSeed';

export type EcosystemItemStatus = 'OPERATIONAL' | 'WARNING' | 'OFFLINE';

export interface EcosystemElement {
  id: string;
  name: string;
  type: 'element' | 'agent' | 'pipeline' | 'vault';
  status: EcosystemItemStatus;
  latency?: string;
  lastHeartbeat: string;
  diagnosticDetail: string;
  howToFix?: {
    issueSummary: string;
    actionableSteps: string[];
    quickFixLabel: string;
    quickFixAction: () => void;
    targetRoute?: string;
  };
}

export interface EcosystemSubSection {
  id: string;
  title: string;
  route: string;
  elements: EcosystemElement[];
}

export interface EcosystemSection {
  id: string;
  name: string;
  icon: any;
  subSections: EcosystemSubSection[];
}

export default function EcosystemStatusBar({
  isOpen,
  onClose,
  isDocked,
  onToggleDock
}: {
  isOpen: boolean;
  onClose: () => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
}) {
  const navigate = useNavigate();
  const { notifySuccess, notifyInfo } = useToast();
  const [filter, setFilter] = useState<'ALL' | 'ISSUES' | 'OPERATIONAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('sec-agents');
  const [expandedFixId, setExpandedFixId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [remediatedIds, setRemediatedIds] = useState<Record<string, boolean>>({});
  const demoMode = isDemoSeedEnabled();

  // Dynamic status items with realistic ecosystem state & actionable "how-to" fixes
  const [sections, setSections] = useState<EcosystemSection[]>(demoMode ? [
    {
      id: 'sec-intel',
      name: 'Intelligence & Performance',
      icon: Activity,
      subSections: [
        {
          id: 'sub-dash',
          title: 'Growth Dashboard',
          route: '/',
          elements: [
            {
              id: 'el-perf-vel',
              name: 'Performance Velocity Stream',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '18ms',
              lastHeartbeat: '4s ago',
              diagnosticDetail: 'Sub-second real-time streaming simulation active with zero frame drops'
            },
            {
              id: 'el-cac-filter',
              name: 'Quarterly Date Range Presets',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '12ms',
              lastHeartbeat: '10s ago',
              diagnosticDetail: 'Active filter dynamically recalculating CAC & channel revenue'
            },
            {
              id: 'el-intake-recharts',
              name: 'Intake Metrics Trend Chart',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '22ms',
              lastHeartbeat: '8s ago',
              diagnosticDetail: 'Recharts SVG engine mounted with responsive ResizeObserver'
            }
          ]
        },
        {
          id: 'sub-diag',
          title: 'Growth Diagnostics',
          route: '/diagnostics',
          elements: [
            {
              id: 'el-domain-audit',
              name: 'Autonomous Domain Crawler Engine',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '45ms',
              lastHeartbeat: '15s ago',
              diagnosticDetail: 'DNS, TLS/SSL handshake & Core Web Vitals auditor ready'
            },
            {
              id: 'el-ux-checklist',
              name: 'UI/UX Heuristic Scanner',
              type: 'element',
              status: 'WARNING',
              latency: '120ms',
              lastHeartbeat: '35s ago',
              diagnosticDetail: '2 friction points detected on mobile checkout flow (-$14k/mo revenue leak)',
              howToFix: {
                issueSummary: 'Mobile checkout step is lacking guest checkout shortcut and 1-tap Apple/Google Pay.',
                actionableSteps: [
                  '1. Open Growth Diagnostics -> UI/UX Heuristic Checklist tab',
                  '2. Locate item #104 "Mobile Express Checkout Friction"',
                  '3. Trigger 1-click Auto-Remediate or implement guest checkout CTA',
                  '4. Re-run crawler to verify composite growth score lift to 85+'
                ],
                quickFixLabel: 'Auto-Remediate Mobile Friction',
                quickFixAction: () => handleApplyQuickFix('el-ux-checklist'),
                targetRoute: '/diagnostics'
              }
            }
          ]
        },
        {
          id: 'sub-explorer',
          title: 'AI Intel Explorer',
          route: '/explorer',
          elements: [
            {
              id: 'el-cac-explorer',
              name: 'Channel Attribution & CAC Matrix',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '16ms',
              lastHeartbeat: '12s ago',
              diagnosticDetail: 'Date range reactive matrix reflecting live source breakdown'
            },
            {
              id: 'el-persona-vectors',
              name: 'Customer ICP Vector Store (pgvector)',
              type: 'vault',
              status: 'OPERATIONAL',
              latency: '28ms',
              lastHeartbeat: '1m ago',
              diagnosticDetail: '480 ICP embeddings verified with 1,536-dim cosine similarity index'
            }
          ]
        }
      ]
    },
    {
      id: 'sec-brain',
      name: 'Foundation (Second Brain)',
      icon: Database,
      subSections: [
        {
          id: 'sub-vaults',
          title: 'Second Brain 10 Enclaves',
          route: '/vaults',
          elements: [
            {
              id: 'el-cred-vault',
              name: 'Credentials Vault (Masked Tokens)',
              type: 'vault',
              status: 'WARNING',
              latency: '31ms',
              lastHeartbeat: '42s ago',
              diagnosticDetail: 'Meta Graph API OAuth token expires in 3 days',
              howToFix: {
                issueSummary: 'The Meta Ads API access token is nearing its 60-day token lifetime expiration.',
                actionableSteps: [
                  '1. Navigate to Second Brain -> Credentials Vault',
                  '2. Locate connector "Meta Graph API v18.0"',
                  '3. Click "Refresh OAuth Token" with administrative credentials',
                  '4. Test connection to confirm 200 OK webhook status'
                ],
                quickFixLabel: 'Renew OAuth Token',
                quickFixAction: () => handleApplyQuickFix('el-cred-vault'),
                targetRoute: '/vaults'
              }
            },
            {
              id: 'el-brand-vault',
              name: 'Brand Vault (Tone & Messaging Vectors)',
              type: 'vault',
              status: 'OPERATIONAL',
              latency: '14ms',
              lastHeartbeat: '20s ago',
              diagnosticDetail: 'Tone guardrails and brand guidelines 100% encrypted & loaded'
            },
            {
              id: 'el-audit-vault',
              name: 'Audit Vault (Diagnostic Roadmaps)',
              type: 'vault',
              status: 'OPERATIONAL',
              latency: '19ms',
              lastHeartbeat: '18s ago',
              diagnosticDetail: 'Growth diagnostic records, UI checklists & 90-day roadmaps synchronized'
            }
          ]
        },
        {
          id: 'sub-intake',
          title: 'Dynamic Intake Engine',
          route: '/intake',
          elements: [
            {
              id: 'el-onboarding-pipe',
              name: 'Client Onboarding Field Router',
              type: 'pipeline',
              status: 'OPERATIONAL',
              latency: '24ms',
              lastHeartbeat: '10s ago',
              diagnosticDetail: 'Automatic routing of form fields to corresponding Second Brain vaults active'
            }
          ]
        }
      ]
    },
    {
      id: 'sec-agents',
      name: 'Agentic Execution Layer',
      icon: Bot,
      subSections: [
        {
          id: 'sub-cockpit',
          title: 'Agent Cockpit & HITL',
          route: '/agents',
          elements: [
            {
              id: 'ag-helios',
              name: 'Performance Allocator (Helios-04)',
              type: 'agent',
              status: 'WARNING',
              latency: '62ms',
              lastHeartbeat: '2m ago',
              diagnosticDetail: 'Pending Human-in-the-Loop (HITL) approval for $6,200 cross-channel budget re-allocation',
              howToFix: {
                issueSummary: 'Agent Helios-04 identified underperforming Meta ad sets and proposed shifting $6,200 to high-intent Google PMax.',
                actionableSteps: [
                  '1. Open Agent Cockpit & HITL page (/agents)',
                  '2. Review proposed re-allocation diff in the Pending Approval queue',
                  '3. Click "Approve & Deploy" to execute the safe state transition',
                  '4. Audit log will record authorization signature'
                ],
                quickFixLabel: 'Approve HITL Proposal',
                quickFixAction: () => handleApplyQuickFix('ag-helios'),
                targetRoute: '/agents'
              }
            },
            {
              id: 'ag-vanguard',
              name: 'Content Engine Agent (Vanguard-01)',
              type: 'agent',
              status: 'OPERATIONAL',
              latency: '34ms',
              lastHeartbeat: '12s ago',
              diagnosticDetail: 'Operating under strict RBAC (Read Brand Vault, zero access to Executive/Credentials Vaults)'
            },
            {
              id: 'ag-aegis',
              name: 'Authority Builder Agent (Aegis-02)',
              type: 'agent',
              status: 'OPERATIONAL',
              latency: '41ms',
              lastHeartbeat: '30s ago',
              diagnosticDetail: 'Topical authority maps & backlink velocity scanning active'
            }
          ]
        },
        {
          id: 'sub-reports',
          title: 'Executive Reports & Exports',
          route: '/reports',
          elements: [
            {
              id: 'el-export-service',
              name: 'Executive PDF & CSV Summary Engine',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '8ms',
              lastHeartbeat: '5s ago',
              diagnosticDetail: 'Zero-oklab hex compliant rasterizer & instant CSV data stream validated'
            }
          ]
        }
      ]
    },
    {
      id: 'sec-infra',
      name: 'Architecture & Multi-Tenant',
      icon: Cpu,
      subSections: [
        {
          id: 'sub-arch',
          title: 'Architecture Topology',
          route: '/architecture',
          elements: [
            {
              id: 'el-bullmq',
              name: 'BullMQ / Celery Async Queue',
              type: 'pipeline',
              status: 'OPERATIONAL',
              latency: '11ms',
              lastHeartbeat: '2s ago',
              diagnosticDetail: 'Redis-backed queue running 0 stalled jobs, 14 workers active'
            },
            {
              id: 'el-pgvector',
              name: 'PostgreSQL + pgvector Cluster',
              type: 'vault',
              status: 'OPERATIONAL',
              latency: '9ms',
              lastHeartbeat: '3s ago',
              diagnosticDetail: 'Connection pool 8/20 connections, RLS policies enforced on all tenant queries'
            }
          ]
        },
        {
          id: 'sub-tenants',
          title: 'Tenant Intelligence',
          route: '/tenants',
          elements: [
            {
              id: 'el-audit-system',
              name: 'Enterprise Audit Log System',
              type: 'element',
              status: 'OPERATIONAL',
              latency: '15ms',
              lastHeartbeat: '6s ago',
              diagnosticDetail: 'Tracking activity, configuration mutations and report generation across all tenants'
            }
          ]
        }
      ]
    }
  ] : []);

  // Handle 1-click Quick Fix
  const handleApplyQuickFix = (elementId: string) => {
    setRemediatedIds(prev => ({ ...prev, [elementId]: true }));
    let remediatedName = 'Ecosystem Element';
    setSections(prevSections => prevSections.map(sec => ({
      ...sec,
      subSections: sec.subSections.map(sub => ({
        ...sub,
        elements: sub.elements.map(el => {
          if (el.id === elementId) {
            remediatedName = el.name;
            return {
              ...el,
              status: 'OPERATIONAL',
              diagnosticDetail: `Remediated: Actionable step completed successfully. Health verified.`,
              latency: '14ms',
              lastHeartbeat: 'Just now'
            };
          }
          return el;
        })
      }))
    })));

    notifySuccess(
      'Issue Remediated Successfully',
      `${remediatedName} returned to OPERATIONAL status. Zero error flags remaining.`,
      { category: 'SYSTEM' }
    );
  };

  // Run full health refresh
  const handlePingAll = () => {
    if (!demoMode) {
      notifyInfo(
        'Runtime Check Unavailable',
        'No health-check endpoint is connected to this panel. No operational status was inferred.'
      );
      return;
    }
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      notifyInfo(
        'Ecosystem Health Check Complete',
        'Pinged all 24 ecosystem sub-modules and agents. Real-time telemetry confirmed nominal.'
      );
    }, 1200);
  };

  // Flatten elements for global calculations
  const allElements: (EcosystemElement & { sectionName: string; subSectionTitle: string; route: string })[] = [];
  sections.forEach(sec => {
    sec.subSections.forEach(sub => {
      sub.elements.forEach(el => {
        allElements.push({
          ...el,
          sectionName: sec.name,
          subSectionTitle: sub.title,
          route: sub.route
        });
      });
    });
  });

  const totalCount = allElements.length;
  const operationalCount = allElements.filter(e => e.status === 'OPERATIONAL').length;
  const issueCount = allElements.filter(e => e.status !== 'OPERATIONAL').length;
  const overallHealthPercent = totalCount > 0 ? Math.round((operationalCount / totalCount) * 100) : null;

  // Filter elements based on selection & search
  const filteredSections = sections.map(sec => {
    const matchedSubSections = sec.subSections.map(sub => {
      const filteredElements = sub.elements.filter(el => {
        const matchesSearch = el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              el.diagnosticDetail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              sub.title.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (filter === 'ALL') return true;
        if (filter === 'ISSUES') return el.status !== 'OPERATIONAL';
        if (filter === 'OPERATIONAL') return el.status === 'OPERATIONAL';
        return true;
      });
      return { ...sub, elements: filteredElements };
    }).filter(sub => sub.elements.length > 0);

    return { ...sec, subSections: matchedSubSections };
  }).filter(sec => sec.subSections.length > 0);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "z-40 flex flex-col bg-[var(--sigma-surface)] border-r border-[var(--sigma-border)] text-[var(--sigma-text)] shadow-2xl transition-all duration-300",
      "fixed inset-y-0 left-0 w-96 max-w-[90vw] backdrop-blur-xl"
    )}>
      {/* Header bar */}
      <div className="p-4 border-b border-[var(--sigma-border)] flex items-center justify-between bg-[var(--sigma-surface-raised)]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Activity size={18} className={cn("text-accent", isRefreshing && "animate-spin")} />
            {issueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--sigma-text)] flex items-center gap-2">
              <span>Ecosystem status</span>
              <span className={cn(
                "text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                overallHealthPercent === null ? "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)]" : issueCount === 0 ? "bg-green-500/20 text-green-700 dark:text-emerald-accent" : "bg-amber-500/20 text-amber-700 dark:text-amber-accent"
              )}>
                {overallHealthPercent === null ? 'Not checked' : demoMode ? `${overallHealthPercent}% demo` : `${overallHealthPercent}% up`}
              </span>
            </div>
            <div className="text-[10px] text-[var(--sigma-text-muted)]">
              {overallHealthPercent === null ? 'No runtime evidence available' : demoMode ? 'Sample data — not runtime telemetry' : issueCount === 0 ? 'All checked elements operational' : `${issueCount} items need attention`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePingAll}
            disabled={isRefreshing}
            title="Ping all ecosystem elements"
            className="p-1.5 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-accent")} />
          </button>

          {onToggleDock && (
            <button
              onClick={onToggleDock}
              title={isDocked ? "Undock / Float" : "Dock to Left"}
              className="p-1.5 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all text-xs font-mono"
            >
              <Sliders size={14} />
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close ecosystem status"
            className="p-1.5 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Controls */}
      <div className="p-3 border-b border-[var(--sigma-border)] space-y-2 bg-[var(--sigma-surface-subtle)]">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter elements, agents, vaults..."
            className="w-full bg-[var(--sigma-input)] border border-[var(--sigma-border)] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filter Pills */}
        <div className="sigma-segmented font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={cn(
              "sigma-segment",
              filter === 'ALL' ? "sigma-segment-active" : ""
            )}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('ISSUES')}
            className={cn(
              "sigma-segment flex items-center gap-1",
              filter === 'ISSUES' ? "sigma-segment-active" : ""
            )}
          >
            <AlertTriangle size={10} />
            Attention ({issueCount})
          </button>
          <button
            onClick={() => setFilter('OPERATIONAL')}
            className={cn(
              "sigma-segment flex items-center gap-1",
              filter === 'OPERATIONAL' ? "sigma-segment-active" : ""
            )}
          >
            <CheckCircle2 size={10} />
            Live ({operationalCount})
          </button>
        </div>
      </div>

      {/* Accordion Tree of Sections -> Subsections -> Elements */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {filteredSections.length === 0 ? (
          <div className="p-8 text-center text-[var(--sigma-text-muted)] text-sm">
            {totalCount === 0 ? 'No runtime health checks have been recorded for this workspace.' : 'No matching ecosystem elements found.'}
          </div>
        ) : (
          filteredSections.map(section => {
            const isSectionExpanded = expandedSectionId === section.id || searchQuery.length > 0;
            const sectionHasIssue = section.subSections.some(sub => sub.elements.some(e => e.status !== 'OPERATIONAL'));

            return (
              <div key={section.id} className="rounded-xl border border-white/5 bg-surface/50 overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => setExpandedSectionId(isSectionExpanded ? null : section.id)}
                  className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <section.icon size={15} className={sectionHasIssue ? "text-amber-400" : "text-accent"} />
                    <span className="text-xs font-bold text-zinc-200 truncate">{section.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionHasIssue && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    <ChevronDown size={14} className={cn("text-muted transition-transform", !isSectionExpanded && "-rotate-90")} />
                  </div>
                </button>

                {/* Subsections & Elements list */}
                {isSectionExpanded && (
                  <div className="px-2 pb-2 space-y-2.5 border-t border-white/5 pt-2">
                    {section.subSections.map(sub => (
                      <div key={sub.id} className="space-y-1.5 pl-2 border-l border-white/10">
                        <div className="flex items-center justify-between pr-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                            {sub.title}
                          </span>
                          <button
                            onClick={() => navigate(sub.route)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-accent flex items-center gap-1 hover:underline"
                          >
                            <span>Open</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>

                        {/* Elements in subsection */}
                        <div className="space-y-1.5">
                          {sub.elements.map(el => {
                            const isOperational = el.status === 'OPERATIONAL';
                            const isExpandedFix = expandedFixId === el.id;

                            return (
                              <div
                                key={el.id}
                                className={cn(
                                  "p-2.5 rounded-lg border transition-all text-xs font-mono",
                                  isOperational
                                    ? "bg-black/20 border-white/5 hover:border-white/15"
                                    : "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        isOperational ? "bg-green-400" : "bg-amber-400 animate-pulse"
                                      )} />
                                      <span className="font-bold text-white truncate text-xs">{el.name}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-1 leading-snug font-sans">
                                      {el.diagnosticDetail}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0">
                                    {!isOperational && el.howToFix ? (
                                      <QuickFixAssistant
                                        side="right"
                                        data={{
                                          id: el.id,
                                          name: el.name,
                                          severity: el.status === 'OFFLINE' ? 'CRITICAL' : 'WARNING',
                                          issueSummary: el.howToFix.issueSummary,
                                          rootCause: el.diagnosticDetail,
                                          actionableSteps: el.howToFix.actionableSteps,
                                          quickFixLabel: el.howToFix.quickFixLabel,
                                          targetRoute: el.howToFix.targetRoute,
                                          onApplyFix: el.howToFix.quickFixAction
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="text-[11px] font-bold px-2 py-0.5 rounded uppercase block bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer transition-all animate-pulse"
                                          title="Hover for Quick Fix Assistant"
                                        >
                                          {el.status} ⚡
                                        </button>
                                      </QuickFixAssistant>
                                    ) : (
                                      <span className={cn(
                                        "text-[11px] font-bold px-1.5 py-0.5 rounded uppercase block",
                                        isOperational ? "bg-green-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                      )}>
                                        {el.status}
                                      </span>
                                    )}
                                    {el.latency && (
                                      <span className="text-[11px] text-zinc-500 mt-0.5 block font-mono">
                                        {el.latency}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* IF NOT OPERATIONAL: ACTIONABLE "HOW TO FIX" SECTION */}
                                {el.howToFix && (
                                  <div className="mt-2.5 pt-2 border-t border-amber-500/20 space-y-2">
                                    <button
                                      onClick={() => setExpandedFixId(isExpandedFix ? null : el.id)}
                                      className="flex items-center justify-between w-full text-[10px] font-bold text-amber-400 hover:text-amber-200 transition-colors"
                                    >
                                      <span className="flex items-center gap-1">
                                        <Wrench size={11} />
                                        <span>How to Fix (Actionable Steps)</span>
                                      </span>
                                      <ChevronDown size={11} className={cn("transition-transform", isExpandedFix && "rotate-180")} />
                                    </button>

                                    {isExpandedFix && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 text-[10px] bg-black/40 p-2 rounded-md border border-amber-500/20"
                                      >
                                        <div className="text-amber-200 font-sans font-medium">
                                          {el.howToFix.issueSummary}
                                        </div>

                                        <ul className="space-y-1 text-zinc-300 font-mono text-[11px] list-disc list-inside">
                                          {el.howToFix.actionableSteps.map((step, sIndex) => (
                                            <li key={sIndex} className="leading-tight">{step}</li>
                                          ))}
                                        </ul>

                                        <div className="flex items-center justify-between gap-2 pt-1">
                                          <button
                                            onClick={() => {
                                              if (el.howToFix?.targetRoute) {
                                                navigate(el.howToFix.targetRoute);
                                              }
                                            }}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1"
                                          >
                                            <span>Open Tool</span>
                                            <ExternalLink size={10} />
                                          </button>

                                          <button
                                            onClick={el.howToFix.quickFixAction}
                                            className="px-2.5 py-1 bg-accent hover:opacity-90 text-background font-black text-[11px] font-mono rounded flex items-center gap-1 shadow-md transition-all amber-glow"
                                          >
                                            <Zap size={10} />
                                            <span>{el.howToFix.quickFixLabel}</span>
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer bar with quick summary & auto-healing status */}
      <div className="p-3 border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] flex items-center justify-between text-[10px] text-[var(--sigma-text-muted)]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-accent" />
          <span>Runtime verification:</span>
          <span className="font-bold">{demoMode ? 'DEMO DATA' : 'NOT RUN'}</span>
        </div>
        <button
          onClick={handlePingAll}
          className="text-accent hover:underline flex items-center gap-1"
        >
          <RefreshCw size={10} />
          <span>{demoMode ? 'Refresh demo' : 'Check availability'}</span>
        </button>
      </div>
    </div>
  );
}

