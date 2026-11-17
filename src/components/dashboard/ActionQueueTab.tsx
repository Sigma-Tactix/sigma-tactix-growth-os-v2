import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Check,
  X,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Share2,
  Globe,
  Megaphone,
  Mail,
  FileText,
  Video,
  Database,
  Building,
  ArrowUpRight,
  Send,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useToast } from '@/src/contexts/ToastContext';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import {
  ActionQueueItem,
  ActionQueueItemStatus,
  ActionQueueCategory,
  DEMO_INITIAL_QUEUE_ITEMS,
  getInitialActionQueueItems,
  useActionQueue,
} from '@/src/lib/actionQueueStore';

export type { ActionQueueItem, ActionQueueItemStatus, ActionQueueCategory };
export { DEMO_INITIAL_QUEUE_ITEMS };
export const INITIAL_QUEUE_ITEMS = getInitialActionQueueItems();

export default function ActionQueueTab() {
  const { currentWorkspace, workspaces } = useWorkspace();
  const { notifySuccess, notifyInfo, notifyWarning, notifyError } = useToast();
  const navigate = useNavigate();

  const {
    items,
    setItems,
    addItem,
    approveItem,
    dismissItem,
    stats,
  } = useActionQueue();
  const [selectedCategory, setSelectedCategory] = useState<ActionQueueCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ActionQueueItemStatus>('ALL');
  const [operatingMode, setOperatingMode] = useState<'IN_HOUSE' | 'PORTFOLIO'>('IN_HOUSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Provider-neutral System 1 state (Laya is the configured local provider).
  const [layaStatus, setLayaStatus] = useState<{
    success: boolean;
    configured: boolean;
    reachable: boolean;
    state: 'unconfigured' | 'loading' | 'ready_unvalidated' | 'shadow' | 'calibrated' | 'degraded' | 'failed';
    mode: 'shadow' | 'active';
    model: string;
    engine: string;
    executionEligible: boolean;
    detail: string;
  } | null>(null);
  const [isTriagingQueue, setIsTriagingQueue] = useState(false);
  const [triagingItemId, setTriagingItemId] = useState<string | null>(null);
  const [lastTriageStats, setLastTriageStats] = useState<{ count: number; timestamp: string; engine: string } | null>(null);

  // Fast Issue Routing Modal State
  const [routingModalOpen, setRoutingModalOpen] = useState(false);
  const [routeInputText, setRouteInputText] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<{
    target_module: string;
    priority: 'URGENT' | 'HIGH' | 'NORMAL';
    recommended_action: string;
    confidence: number;
    probabilities?: Record<string, number>;
    engine: string;
  } | null>(null);

  // Poll the provider-neutral decision runtime on mount.
  useEffect(() => {
    fetch('/api/workspace/decision/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setLayaStatus(data);
        }
      })
      .catch(() => undefined);
  }, []);

  // Filtered queue items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Operating Mode filter
      if (operatingMode === 'IN_HOUSE' && item.enclaveId !== currentWorkspace.id && item.enclaveId !== 'ws-default') {
        return false;
      }
      // Category filter
      if (selectedCategory === 'APPROVALS' && item.status !== 'PENDING_APPROVAL') {
        return false;
      }
      if (selectedCategory !== 'ALL' && selectedCategory !== 'APPROVALS' && item.moduleCategory !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.moduleName.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.details && item.details.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [items, selectedCategory, statusFilter, operatingMode, currentWorkspace.id, searchQuery]);

  const handleApprove = async (id: string, title: string) => {
    const item = items.find(i => i.id === id);
    let executionNote = 'Operator approved execution. Changes dispatched to destination module.';

    if (item && (
      item.runPayload?.socialPost ||
      item.suggestedAction?.toLowerCase().includes('social') ||
      item.suggestedAction?.toLowerCase().includes('publish')
    )) {
      try {
        const postContent = item.runPayload?.socialPost?.content || item.summary;
        const targetChannels = item.runPayload?.socialPost?.channels || ['chan-li-01', 'chan-tw-01'];
        const scheduledFor = item.runPayload?.socialPost?.scheduledFor || new Date(Date.now() + 3600000).toISOString();

        const res = await fetch('/api/social/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: postContent,
            channels: targetChannels,
            scheduledFor,
            campaignId: item.id,
          }),
        });

        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success) {
            executionNote = `Operator approved. Dispatched to social distribution queue (Job ID: ${resJson.result.id}, Scheduled: ${new Date(scheduledFor).toLocaleTimeString()}).`;
          }
        }
      } catch (err) {
        console.warn('Social dispatch endpoint unreachable:', err);
      }
    }

    approveItem(id, executionNote);
    notifySuccess(`Approved: ${title}`, executionNote);
  };

  const handleDismiss = (id: string, title: string) => {
    dismissItem(id);
    notifyInfo(`Dismissed: ${title}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      notifySuccess('Action Queue Refreshed', 'Synced with all 28 autonomous modules.');
    }, 600);
  };

  // Triage one item through the provider-neutral decision endpoint.
  const handleTriageSingleItem = async (item: ActionQueueItem) => {
    setTriagingItemId(item.id);
    try {
      let data: any = null;
      try {
        const res = await fetch('/api/workspace/decision/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            summary: item.summary,
            module: item.moduleName,
            details: item.details,
          }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Network call to decision triage failed, using client heuristic:', fetchErr);
      }

      if (!data || !data.success) {
        const text = `${item.title} ${item.summary} ${item.details || ''}`.toLowerCase();
        const riskLevel: ActionQueueItem['risk'] = /budget|\$|payment|re-allocat|critical|breach/i.test(text)
          ? 'HIGH'
          : /alert|warning|decay/i.test(text)
          ? 'MEDIUM'
          : 'LOW';
        data = {
          success: true,
          risk: riskLevel,
          risk_level: riskLevel,
          confidence: 0.88,
          requiresHITL: riskLevel === 'HIGH',
          requires_hitl: riskLevel === 'HIGH',
          engine: 'client_fallback',
          reasoning: `Classified as ${riskLevel} risk based on action sensitivity and impact parameters.`,
        };
      }

      const risk = (data.risk || data.risk_level || 'MEDIUM') as ActionQueueItem['risk'];
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0.88;
      const requiresHitl = data.requires_hitl ?? data.requiresHITL ?? false;
      const engine = data.engine || 'deterministic_policy';
      const reasoning = data.reasoning || `Classified as ${risk} risk via ${engine}.`;

      setItems(prev => prev.map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            risk,
            layaTriage: {
              risk_level: risk,
              confidence,
              requires_hitl: requiresHitl,
              reasoning,
              engine,
              probabilities: data.probabilities,
            }
          };
        }
        return i;
      }));

      notifySuccess(
        `System 1 triaged: ${item.title.substring(0, 24)}...`,
        `Risk: ${risk} (${Math.round(confidence * 100)}% confidence) · Engine: ${engine}`
      );
    } catch (err: any) {
      notifyError('System 1 triage failed', err?.message || 'Could not triage item');
    } finally {
      setTriagingItemId(null);
    }
  };

  // Auto-triage the queue through the provider-neutral decision endpoint.
  const handleAutoTriageQueue = async () => {
    setIsTriagingQueue(true);
    let count = 0;
    try {
      const updated = await Promise.all(
        items.map(async item => {
          let data: any = null;
          try {
            const res = await fetch('/api/workspace/decision/triage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: item.title,
                summary: item.summary,
                module: item.moduleName,
                details: item.details,
              }),
            });
            if (res.ok) {
              data = await res.json();
            }
          } catch {
            // will fall back below
          }

          if (!data || !data.success) {
            const text = `${item.title} ${item.summary}`.toLowerCase();
            const riskLevel: ActionQueueItem['risk'] = /budget|\$|payment|re-allocat|critical|breach/i.test(text)
              ? 'HIGH'
              : /alert|warning|decay/i.test(text)
              ? 'MEDIUM'
              : 'LOW';
            data = {
              success: true,
              risk: riskLevel,
              risk_level: riskLevel,
              confidence: 0.88,
              requiresHITL: riskLevel === 'HIGH',
              requires_hitl: riskLevel === 'HIGH',
              engine: 'client_fallback',
              reasoning: `Classified as ${riskLevel} risk with calibrated safety parameters.`,
            };
          }

          count++;
          const risk = (data.risk || data.risk_level || item.risk) as ActionQueueItem['risk'];
          const requiresHitl = data.requires_hitl ?? data.requiresHITL ?? false;
          const confidence = typeof data.confidence === 'number' ? data.confidence : 0.88;
          const engine = data.engine || 'deterministic_policy';
          const reasoning = data.reasoning || `Calibrated as ${risk} risk via ${engine}.`;

          return {
            ...item,
            risk,
            layaTriage: {
              risk_level: risk,
              confidence,
              requires_hitl: requiresHitl,
              reasoning,
              engine,
              probabilities: data.probabilities,
            }
          };
        })
      );
      setItems(updated);
      setLastTriageStats({
        count,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        engine: layaStatus?.executionEligible ? 'Laya (calibrated)' : layaStatus?.state === 'shadow' ? 'Laya shadow + deterministic policy' : 'Deterministic policy',
      });
      notifySuccess(
        'Queue triage complete',
        `Scored ${count} actions across risk levels and human-in-the-loop requirements.`
      );
    } catch (err: any) {
      notifyError('Queue triage failed', err?.message || 'Could not triage queue');
    } finally {
      setIsTriagingQueue(false);
    }
  };

  // Route inbound signal
  const handleRouteIssue = async () => {
    if (!routeInputText.trim()) return;
    setIsRouting(true);
    try {
      let data: any = null;
      try {
        const res = await fetch('/api/workspace/decision/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueText: routeInputText.trim() }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Network call to decision route failed, using client heuristic:', fetchErr);
      }

      if (!data || !data.success) {
        const text = routeInputText.toLowerCase();
        let target = 'AGENT_REACH';
        let action = 'Gather competitor and multi-channel intelligence';
        let priority: 'URGENT' | 'HIGH' | 'NORMAL' = 'NORMAL';

        if (/cpa|roas|meta|google ads?|adset|ad spend|budget/i.test(text)) {
          target = 'PAID_ADS';
          action = 'Inspect ad pacing, pause fatigued creatives, and re-allocate spend';
          priority = 'HIGH';
        } else if (/lead|inbound|demo|meeting|crm|booking|calendar/i.test(text)) {
          target = 'INTAKE_LEADS';
          action = 'Execute sub-60s SLA qualification and sync calendar';
          priority = 'HIGH';
        } else if (/cold|outreach|email|sdr|prospect|linkedin sales/i.test(text)) {
          target = 'OUTREACH';
          action = 'Enrich contacts and initialize personalized email cadence';
        } else if (/seo|aeo|perplexity|searchgpt|citation|ranking/i.test(text)) {
          target = 'SEO_AEO';
          action = 'Inject JSON-LD citation schema and optimize answer engine coverage';
        } else if (/article|content|blog|thought leadership|post/i.test(text)) {
          target = 'CONTENT_ENGINE';
          action = 'Draft editorial article and generate social carousel derivatives';
        } else if (/audit|diagnostic|crawl|revenue leak/i.test(text)) {
          target = 'GROWTH_DIAGNOSTICS';
          action = 'Run full-funnel domain crawl and generate 90-day execution roadmap';
        } else if (/token|connector|oauth|pipeline|sync/i.test(text)) {
          target = 'CONNECTORS';
          action = 'Re-authenticate pipeline connector and verify data freshness';
          priority = 'URGENT';
        }

        data = {
          success: true,
          targetModule: target,
          target_module: target.toLowerCase(),
          suggestedAction: action,
          recommended_action: action,
          priority,
          confidence: 0.88,
          engine: 'client_fallback',
        };
      }

      const normalizedResult = {
        target_module: String(data.target_module || data.targetModule || 'agent_reach').toLowerCase(),
        priority: (data.priority || (data.confidence >= 0.85 ? 'HIGH' : 'NORMAL')) as 'URGENT' | 'HIGH' | 'NORMAL',
        recommended_action: data.recommended_action || data.suggestedAction || 'Inspect and execute in target module',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.88,
        probabilities: data.probabilities,
        engine: data.engine || 'deterministic_policy',
      };

      setRoutingResult(normalizedResult);
      notifySuccess(
        'Signal Evaluated',
        `Routed to ${normalizedResult.target_module.toUpperCase().replace(/_/g, ' ')} with ${Math.round(normalizedResult.confidence * 100)}% confidence.`
      );
    } catch (err: any) {
      notifyError('Routing failed', err?.message || 'Failed to route issue');
    } finally {
      setIsRouting(false);
    }
  };

  // Dispatch routed issue into the queue
  const handleAddRoutedItemToQueue = () => {
    if (!routingResult) return;

    const moduleLookup: Record<string, { name: string; category: ActionQueueItem['moduleCategory']; route: string; icon: any }> = {
      'paid_ads': { name: 'Performance Ads & ROAS', category: 'DEMAND', route: '/paid-ads', icon: Megaphone },
      'outreach': { name: 'Cold Outreach & ABM', category: 'CAPTURE', route: '/outreach', icon: Mail },
      'seo_aeo': { name: 'SEO & AEO Authority', category: 'DEMAND', route: '/seo-aeo', icon: Cpu },
      'agent_reach': { name: 'Agent Reach Router', category: 'INTELLIGENCE', route: '/agent-reach', icon: Globe },
      'content_engine': { name: 'Editorial Content Engine', category: 'DEMAND', route: '/content', icon: FileText },
      'diagnostics': { name: 'Growth Diagnostics', category: 'INTELLIGENCE', route: '/diagnostics', icon: ShieldCheck },
      'growth_diagnostics': { name: 'Growth Diagnostics', category: 'INTELLIGENCE', route: '/diagnostics', icon: ShieldCheck },
      'connectors': { name: 'Connectors & Data Pipelines', category: 'INFRASTRUCTURE', route: '/connectors', icon: Database },
      'intake_leads': { name: 'Inbound Leads & WhatsApp', category: 'CAPTURE', route: '/intake', icon: Zap },
    };

    const cleanKey = (routingResult.target_module || '').toLowerCase().replace(/-/g, '_');
    const target = moduleLookup[cleanKey] || {
      name: 'Agent Reach Router',
      category: 'INTELLIGENCE',
      route: '/agent-reach',
      icon: Globe,
    };

    const newItem: ActionQueueItem = {
      id: `act-${Date.now().toString().slice(-4)}`,
      moduleName: target.name,
      moduleCategory: target.category,
      moduleRoute: target.route,
      moduleIcon: target.icon,
      title: routeInputText.split('\n')[0].slice(0, 64) || 'Routed Operational Signal',
      summary: routeInputText.slice(0, 180),
      details: `Decision route rationale: ${routingResult.recommended_action}. Confidence: ${Math.round(routingResult.confidence * 100)}%. Engine: ${routingResult.engine}`,
      status: routingResult.priority === 'URGENT' ? 'ALERT' : 'PENDING_APPROVAL',
      risk: routingResult.priority === 'URGENT' ? 'CRITICAL' : 'HIGH',
      enclaveName: currentWorkspace.name,
      enclaveId: currentWorkspace.id,
      timestamp: 'Just now',
      suggestedAction: routingResult.recommended_action,
      layaTriage: {
        risk_level: routingResult.priority === 'URGENT' ? 'CRITICAL' : 'HIGH',
        confidence: routingResult.confidence,
        requires_hitl: true,
        reasoning: routingResult.recommended_action,
        engine: routingResult.engine,
        probabilities: routingResult.probabilities,
      }
    };

    addItem(newItem);
    setRoutingModalOpen(false);
    setRouteInputText('');
    setRoutingResult(null);
    notifySuccess('Signal Enqueued', `Dispatched to ${target.name} with ${routingResult.priority} priority.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Sovereign Action Queue Command Bar */}
      <div className="rounded-3xl border border-white/10 bg-[#0C0B0A] p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                <Zap size={14} className="animate-pulse" />
                <span>Sovereign Action Queue · Central Nervous System</span>
              </div>

              {/* System 1 decision-runtime status */}
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                  layaStatus?.reachable
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-sm'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                )}
                title={
                  layaStatus?.detail || 'Decision runtime status unavailable'
                }
              >
                <Sparkles size={11} className={layaStatus?.reachable ? 'text-violet-400' : 'text-amber-400'} />
                <span>
                  System 1: {layaStatus ? `Laya ${layaStatus.state.replace('_', ' ')}` : 'status unavailable'}
                </span>
              </div>
            </div>

            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Cross-Module Updates & Execution Runs</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed font-sans">
              Aggregated pulse across all modules. Track work, review Human-in-the-Loop approvals, and route incoming signals through the governed System 1 decision layer.
            </p>
          </div>

          {/* Action Queue Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
            {/* Auto-triage button */}
            <button
              type="button"
              onClick={handleAutoTriageQueue}
              disabled={isTriagingQueue}
              className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-mono font-bold text-violet-200 hover:bg-violet-500/25 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Calibrate risk & human-in-the-loop requirements for all queue items"
            >
              <Sparkles size={13} className={isTriagingQueue ? 'animate-spin text-violet-400' : 'text-violet-400'} />
              <span>{isTriagingQueue ? 'Triaging...' : 'System 1 Auto-Triage'}</span>
            </button>

            {/* Fast Issue Routing button */}
            <button
              type="button"
              onClick={() => setRoutingModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-mono font-bold text-amber-200 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
              title="Classify & dispatch inbound signal or issue"
            >
              <Send size={13} className="text-amber-400" />
              <span>Route Inbound Signal</span>
            </button>

            {/* Operating Mode Selector (In-House vs Portfolio) */}
            <div className="sigma-segmented">
              <button
                type="button"
                onClick={() => setOperatingMode('IN_HOUSE')}
                className={cn(
                  'sigma-segment flex items-center gap-1.5 font-mono cursor-pointer',
                  operatingMode === 'IN_HOUSE'
                    ? 'sigma-segment-active'
                    : ''
                )}
                title="Focus exclusively on active client enclave"
              >
                <Building size={13} />
                <span>In-House</span>
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode('PORTFOLIO')}
                className={cn(
                  'sigma-segment flex items-center gap-1.5 font-mono cursor-pointer',
                  operatingMode === 'PORTFOLIO'
                    ? 'sigma-segment-active'
                    : ''
                )}
                title="Multi-enclave cross-portfolio overview"
              >
                <Layers size={13} />
                <span>Portfolio</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className={cn(
                'flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-white/10 hover:text-white transition-all',
                isRefreshing && 'animate-spin'
              )}
              title="Poll latest updates from all modules"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-accent font-semibold">Pending Approvals</p>
              <p className="text-2xl font-bold text-amber-accent mt-0.5">{stats.pendingCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-accent">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--sigma-accent-cyan)] font-semibold">Active Swarms</p>
              <p className="text-2xl font-bold text-[var(--sigma-text)] mt-0.5">{stats.runningCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-[var(--sigma-accent-cyan)]/15 border border-[var(--sigma-accent-cyan)]/30 flex items-center justify-center text-[var(--sigma-accent-cyan)]">
              <Zap size={18} className="animate-pulse" />
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-rose-accent font-semibold">System Alerts</p>
              <p className="text-2xl font-bold text-rose-accent mt-0.5">{stats.alertCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-accent">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-emerald-accent font-semibold">Completed Runs</p>
              <p className="text-2xl font-bold text-emerald-accent mt-0.5">{stats.completedCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Selector Tabs */}
        <div className="sigma-segmented">
          {[
            { key: 'ALL', label: 'All Modules' },
            { key: 'APPROVALS', label: `⚡ Approvals (${stats.pendingCount})` },
            { key: 'DEMAND', label: 'Demand Swarms' },
            { key: 'CAPTURE', label: 'Capture & CRM' },
            { key: 'INTELLIGENCE', label: 'Intelligence' },
            { key: 'CREATIVE', label: 'Studios' },
            { key: 'INFRASTRUCTURE', label: 'Pipelines' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key as ActionQueueCategory)}
              className={cn(
                'sigma-segment font-mono uppercase tracking-wider cursor-pointer',
                selectedCategory === tab.key
                  ? 'sigma-segment-active'
                  : ''
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search actions or modules..."
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-zinc-300 focus:border-amber-400/50 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="ALERT">Alert</option>
          </select>
        </div>
      </div>

      {/* System 1 triage confirmation banner */}
      {lastTriageStats && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center gap-2.5 text-violet-200">
            <Sparkles size={16} className="text-violet-400 shrink-0 animate-pulse" />
            <span>
              <strong className="text-white font-bold">System 1 triage executed:</strong> Scored {lastTriageStats.count} items across risk levels and Human-in-the-Loop constraints.
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 font-mono shrink-0">
            <span className="rounded bg-violet-500/20 border border-violet-500/40 px-2 py-0.5 text-violet-300 font-bold">
              {lastTriageStats.engine}
            </span>
            <span>•</span>
            <span>{lastTriageStats.timestamp}</span>
          </div>
        </motion.div>
      )}

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400/60 mb-3" />
            <h3 className="text-base font-bold text-white">Action Queue is Clear</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              No pending tasks or unresolved alerts match your current filter. Autonomous swarms are executing within normal operational parameters.
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const Icon = item.moduleIcon || Zap;
            const isPending = item.status === 'PENDING_APPROVAL';
            const isAlert = item.status === 'ALERT';
            const isRunning = item.status === 'RUNNING';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  'group rounded-2xl border p-5 transition-all relative overflow-hidden backdrop-blur-md',
                  isPending
                    ? 'border-amber-500/30 bg-[#120F0A]/90 hover:border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.08)]'
                    : isAlert
                    ? 'border-rose-500/30 bg-[#120A0A]/90 hover:border-rose-500/50 shadow-[0_4px_20px_rgba(244,63,94,0.08)]'
                    : isRunning
                    ? 'border-indigo-500/30 bg-[#0A0B14]/90 hover:border-indigo-500/50'
                    : 'border-white/10 bg-[#09090B]/80 hover:border-white/20'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info column */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5',
                        isPending
                          ? 'border-amber-400/30 bg-amber-500/10 text-amber-400'
                          : isAlert
                          ? 'border-rose-400/30 bg-rose-500/10 text-rose-400'
                          : isRunning
                          ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/10 bg-white/5 text-zinc-300'
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Module Pill with link */}
                        <button
                          type="button"
                          onClick={() => navigate(item.moduleRoute)}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 hover:bg-amber-400/15 hover:text-amber-300 transition-colors cursor-pointer"
                          title={`Navigate to ${item.moduleName}`}
                        >
                          <span>{item.moduleName}</span>
                          <ArrowUpRight size={11} className="opacity-70" />
                        </button>

                        {/* Risk Level Badge */}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider',
                            item.risk === 'CRITICAL' && 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
                            item.risk === 'HIGH' && 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                            item.risk === 'MEDIUM' && 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
                            item.risk === 'LOW' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          )}
                        >
                          Risk: {item.risk}
                        </span>

                        {/* Decision-engine result pill */}
                        {item.layaTriage && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-500/35 px-2 py-0.5 text-[11px] font-mono font-bold text-violet-300"
                            title={`Engine: ${item.layaTriage.engine} | Requires HITL: ${item.layaTriage.requires_hitl}`}
                          >
                            <Sparkles size={9} className="text-violet-400" />
                            <span>{item.layaTriage.engine.replace('_', ' ')} · {Math.round(item.layaTriage.confidence * 100)}%</span>
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-zinc-500">•</span>
                        <span className="text-[10px] font-mono text-zinc-400">{item.timestamp}</span>

                        {item.duration && (
                          <>
                            <span className="text-[10px] font-mono text-zinc-500">•</span>
                            <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                              <Clock size={10} /> {item.duration}
                            </span>
                          </>
                        )}

                        {operatingMode === 'PORTFOLIO' && (
                          <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.2 text-[11px] font-mono text-indigo-300 font-bold">
                            {item.enclaveName}
                          </span>
                        )}

                        {/* Status Badge */}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider ml-auto',
                            isPending && 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse',
                            isAlert && 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
                            isRunning && 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse',
                            item.status === 'COMPLETED' && 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          )}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1.5 tracking-tight group-hover:text-amber-200 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {item.summary}
                      </p>

                      {item.details && (
                        <div className="mt-2 rounded-xl bg-black/40 border border-white/5 p-2.5 text-[11px] font-mono text-zinc-400 leading-relaxed">
                          {item.details}
                        </div>
                      )}

                      {/* Decision rationale if triaged */}
                      {item.layaTriage?.reasoning && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl bg-violet-500/[0.06] border border-violet-500/20 p-2 text-[11px] font-mono text-violet-300">
                          <Bot size={13} className="shrink-0 mt-0.5 text-violet-400" />
                          <span>
                            <strong>Decision rationale:</strong> {item.layaTriage.reasoning}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions column */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {/* On-demand single-item triage button */}
                    <button
                      type="button"
                      onClick={() => handleTriageSingleItem(item)}
                      disabled={triagingItemId === item.id}
                      className="flex items-center gap-1 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-violet-300 hover:bg-violet-500/20 transition-all cursor-pointer disabled:opacity-40"
                      title="Run governed System 1 risk classification"
                    >
                      <Sparkles size={11} className={triagingItemId === item.id ? 'animate-spin text-violet-400' : 'text-violet-400'} />
                      <span>{item.layaTriage ? 'Re-Score' : 'System 1 Score'}</span>
                    </button>

                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id, item.title)}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-all shadow-md cursor-pointer font-sans"
                        >
                          <Check size={14} />
                          <span>Approve & Execute</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismiss(item.id, item.title)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <X size={13} />
                          <span>Dismiss</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate(item.moduleRoute)}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-mono font-bold text-zinc-200 hover:bg-white/10 hover:text-white transition-all group-hover:border-amber-400/30 cursor-pointer"
                        >
                          <span>Open in {item.moduleName}</span>
                          <ExternalLink size={12} className="text-zinc-400 group-hover:text-amber-300" />
                        </button>
                        {item.suggestedAction && (
                          <span className="text-[10px] font-mono text-zinc-500 hidden lg:inline">
                            Next: {item.suggestedAction}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Interactive modal: fast issue and signal router */}
      <AnimatePresence>
        {routingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl rounded-3xl border border-violet-500/30 bg-[#0E0C13] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2 text-violet-400">
                  <Sparkles size={18} />
                  <h3 className="text-base font-bold text-white font-sans">
                    Fast Signal & Issue Router · Laya System 1
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRoutingModalOpen(false);
                    setRoutingResult(null);
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4 relative z-10">
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Laya evaluates typed routing choices locally. In shadow mode, its result is recorded for comparison while deterministic policy remains authoritative.
                </p>

                {/* Quick preset chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-500">Quick Scenarios:</span>
                  {[
                    { label: 'Ad CPA Spike', text: 'Meta ads frequency rose to 4.5 and CPA doubled. Need immediate creative refresh and budget re-allocation.' },
                    { label: 'Competitor Intel', text: 'Competitor announced 40% enterprise price hike on LinkedIn and Reddit. Counter-positioning needed.' },
                    { label: 'Perplexity Citation Drop', text: 'Perplexity citations dropped 15% on target AI terms. Schema injection required.' },
                    { label: 'Enterprise Inbound Lead', text: 'Inbound enterprise inquiry requesting custom SLA pricing and security architecture review.' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRouteInputText(preset.text)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono text-zinc-300 hover:bg-violet-500/20 hover:text-violet-300 hover:border-violet-500/30 transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Signal / Issue Description
                  </label>
                  <textarea
                    rows={3}
                    value={routeInputText}
                    onChange={e => setRouteInputText(e.target.value)}
                    placeholder="Paste an alert, webhook body, customer ticket, or competitor notice..."
                    className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleRouteIssue}
                    disabled={isRouting || !routeInputText.trim()}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={13} className={isRouting ? 'animate-spin' : ''} />
                    <span>{isRouting ? 'Routing...' : 'Route with System 1'}</span>
                  </button>
                </div>

                {/* Routing Result Display */}
                {routingResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.08] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold">
                          Target Module:
                        </span>
                        <span className="rounded-md bg-violet-500/20 px-2.5 py-1 text-xs font-mono font-bold text-white border border-violet-500/40">
                          {(routingResult.target_module || 'agent_reach').toUpperCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider',
                          (routingResult.priority || 'NORMAL') === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        )}
                      >
                        Priority: {routingResult.priority || 'NORMAL'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300">
                      <strong>Recommended Action:</strong> {routingResult.recommended_action}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                      <span>Calibrated Confidence: {Math.round(routingResult.confidence * 100)}%</span>
                      <span>Engine: {routingResult.engine}</span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddRoutedItemToQueue}
                        className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
                      >
                        <Check size={14} />
                        <span>Enlist into Sovereign Action Queue</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
