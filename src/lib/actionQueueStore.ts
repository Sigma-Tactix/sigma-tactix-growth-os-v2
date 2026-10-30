import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Megaphone,
  Mail,
  Cpu,
  FileText,
  Video,
  Zap,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { isDemoSeedEnabled } from './demoSeed.js';

export type ActionQueueItemStatus = 'PENDING_APPROVAL' | 'RUNNING' | 'COMPLETED' | 'ALERT';
export type ActionQueueCategory = 'ALL' | 'APPROVALS' | 'DEMAND' | 'CAPTURE' | 'INTELLIGENCE' | 'CREATIVE' | 'INFRASTRUCTURE';

export interface ActionQueueItem {
  id: string;
  moduleName: string;
  moduleCategory: 'DEMAND' | 'CAPTURE' | 'INTELLIGENCE' | 'CREATIVE' | 'INFRASTRUCTURE';
  moduleRoute: string;
  moduleIcon?: any;
  title: string;
  summary: string;
  details?: string;
  status: ActionQueueItemStatus;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enclaveName: string;
  enclaveId: string;
  timestamp: string;
  duration?: string;
  runPayload?: Record<string, any>;
  suggestedAction?: string;
  layaTriage?: {
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    requires_hitl: boolean;
    reasoning: string;
    engine: string;
    probabilities?: Record<string, number>;
  };
}

export const DEMO_INITIAL_QUEUE_ITEMS: ActionQueueItem[] = [
  {
    id: 'act-001',
    moduleName: 'Agent Reach Router',
    moduleCategory: 'INTELLIGENCE',
    moduleRoute: '/agent-reach',
    moduleIcon: Globe,
    title: 'Competitor B2B Threat Intelligence Scan Completed',
    summary: 'Analyzed 15 channels (LinkedIn, X, Reddit, Bilibili) across 3 competitor domains. Extracted 4 counter-positioning angles.',
    details: 'Primary attack vector identified: Competitor pricing jump (+35%) leaving high mid-market churn vulnerability.',
    status: 'COMPLETED',
    risk: 'LOW',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '3 mins ago',
    duration: '4.2s',
    suggestedAction: 'Generate SDR Battlecard',
  },
  {
    id: 'act-002',
    moduleName: 'Performance Ads & ROAS',
    moduleCategory: 'DEMAND',
    moduleRoute: '/paid-ads',
    moduleIcon: Megaphone,
    title: 'Autonomous Budget Re-Allocation Proposal',
    summary: 'Re-distribute $4,500 from underperforming Meta lookalikes (1.4x ROAS) to high-intent Google Search & LinkedIn Retargeting (4.8x ROAS).',
    details: 'Pacing model forecasts +$24,800 incremental pipeline over the next 14 days with zero net ad spend increase.',
    status: 'PENDING_APPROVAL',
    risk: 'HIGH',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '12 mins ago',
    suggestedAction: 'Approve & Push to Ad Managers',
  },
  {
    id: 'act-003',
    moduleName: 'Cold Outreach & ABM',
    moduleCategory: 'CAPTURE',
    moduleRoute: '/outreach',
    moduleIcon: Mail,
    title: 'SDR Battlecard Sequence Enriched & Queued',
    summary: '84 Tier-1 Enterprise VP Marketing leads enriched via Apollo & LinkedIn Sales Navigator with personalized pain hooks.',
    details: 'Warm-up cadence initialized. Daily volume throttle: 25 sends/mailbox to maintain 99.4% inbox placement.',
    status: 'RUNNING',
    risk: 'MEDIUM',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '28 mins ago',
    duration: 'In progress',
    suggestedAction: 'Review Prospect List',
  },
  {
    id: 'act-004',
    moduleName: 'SEO & AEO Authority',
    moduleCategory: 'DEMAND',
    moduleRoute: '/seo-aeo',
    moduleIcon: Cpu,
    title: 'AI Answer Engine Visibility Shift Detected',
    summary: 'Perplexity and SearchGPT citations for core keyword cluster dropped 12%. Suggested citation schema update ready.',
    details: 'Adding JSON-LD structured author credentials and high-citation statistical citations restores answer engine ranking.',
    status: 'ALERT',
    risk: 'MEDIUM',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '45 mins ago',
    suggestedAction: 'Inject Citation Schema',
  },
  {
    id: 'act-005',
    moduleName: 'Editorial Content Engine',
    moduleCategory: 'DEMAND',
    moduleRoute: '/content',
    moduleIcon: FileText,
    title: 'Long-Form Thought Leadership Article Ready for Sign-Off',
    summary: '“Why Fractional CMOs Are Moving to Sovereign Agent Swarms”: 2,400 words, SEO-optimized, backed by Second Brain Vaults.',
    details: 'Derivative assets generated: 1 LinkedIn Carousel PDF, 5 X Thread posts, and 1 newsletter summary.',
    status: 'PENDING_APPROVAL',
    risk: 'MEDIUM',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '1 hour ago',
    suggestedAction: 'Publish to CMS & Social',
    runPayload: {
      socialPost: {
        content: '“Why Fractional CMOs Are Moving to Sovereign Agent Swarms”: 2,400 words, SEO-optimized, backed by Second Brain Vaults.',
        channels: ['chan-li-01', 'chan-tw-01'],
        scheduledFor: new Date(Date.now() + 3600000).toISOString(),
      },
    },
  },
  {
    id: 'act-006',
    moduleName: 'Video & Motion Studio',
    moduleCategory: 'CREATIVE',
    moduleRoute: '/video-studio',
    moduleIcon: Video,
    title: 'Remotion 60s Kinetic Explainer Render Finished',
    summary: 'Multi-slide typography motion reel rendered at 4K 60fps with synchronized voice-over audio and dynamic waveform.',
    details: 'Output format: MP4 (H.264), optimized for LinkedIn vertical feed and YouTube Shorts.',
    status: 'COMPLETED',
    risk: 'LOW',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '2 hours ago',
    duration: '38s',
    suggestedAction: 'Download Master Asset',
  },
  {
    id: 'act-007',
    moduleName: 'Inbound Leads & WhatsApp',
    moduleCategory: 'CAPTURE',
    moduleRoute: '/intake',
    moduleIcon: Zap,
    title: 'Sub-60s SLA Inbound Triage Fired',
    summary: 'Enterprise lead (ACV: $75,000) submitted audit form; AI Sales Agent qualified BANT criteria and booked demo via WhatsApp in 48 seconds.',
    details: 'Meeting synced to Google Calendar. Executive Brief dossier pushed to Slack #growth-leads.',
    status: 'COMPLETED',
    risk: 'LOW',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '3 hours ago',
    duration: '48s',
    suggestedAction: 'View Lead Dossier',
  },
  {
    id: 'act-008',
    moduleName: 'Connectors & Data Pipelines',
    moduleCategory: 'INFRASTRUCTURE',
    moduleRoute: '/connectors',
    moduleIcon: Database,
    title: 'Meta Ads Token Expiration Imminent',
    summary: 'OAuth access token for Meta Ads pipeline expires in 48 hours. Auto-refresh webhook failed due to 2FA policy.',
    details: 'Reconnect connector before midnight UTC to prevent gap in blended CAC attribution modeling.',
    status: 'ALERT',
    risk: 'HIGH',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '4 hours ago',
    suggestedAction: 'Re-authenticate Connector',
  },
  {
    id: 'act-009',
    moduleName: 'Growth Diagnostics',
    moduleCategory: 'INTELLIGENCE',
    moduleRoute: '/diagnostics',
    moduleIcon: ShieldCheck,
    title: 'Comprehensive 8-Category Growth Audit Synthesized',
    summary: 'Full crawl of target domain completed across UX, Performance, SEO, Positioning, Offers, and AI Visibility. Score: 81/100.',
    details: '90-day actionable execution roadmap updated with 12 high-priority milestones.',
    status: 'COMPLETED',
    risk: 'LOW',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: '5 hours ago',
    duration: '14.8s',
    suggestedAction: 'Review 90-Day Roadmap',
  }
];

export function resolveActionQueueIcon(category: string, moduleName?: string) {
  const normCategory = (category || '').toUpperCase();
  const name = (moduleName || '').toLowerCase();

  if (normCategory === 'DEMAND') {
    if (name.includes('seo') || name.includes('aeo')) return Cpu;
    if (name.includes('content') || name.includes('editorial')) return FileText;
    return Megaphone;
  }
  if (normCategory === 'CAPTURE') {
    if (name.includes('lead') || name.includes('intake') || name.includes('whatsapp')) return Zap;
    return Mail;
  }
  if (normCategory === 'INTELLIGENCE') {
    if (name.includes('diagnostic') || name.includes('audit')) return ShieldCheck;
    return Globe;
  }
  if (normCategory === 'CREATIVE') {
    return Video;
  }
  if (normCategory === 'INFRASTRUCTURE') {
    return Database;
  }
  return Zap;
}

export function hydrateQueueItem(item: ActionQueueItem): ActionQueueItem {
  return {
    ...item,
    moduleIcon: item.moduleIcon || resolveActionQueueIcon(item.moduleCategory, item.moduleName),
  };
}

export function getInitialActionQueueItems(): ActionQueueItem[] {
  return isDemoSeedEnabled() ? DEMO_INITIAL_QUEUE_ITEMS.map(hydrateQueueItem) : [];
}

export const ACTION_QUEUE_STORAGE_KEY = 'sigmatactix_action_queue';

export class ActionQueueStore {
  private items: ActionQueueItem[] | null = null;
  private listeners = new Set<() => void>();

  private loadItems(): ActionQueueItem[] {
    if (this.items !== null) return this.items;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(ACTION_QUEUE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.items = parsed.map(hydrateQueueItem);
            return this.items;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored action queue items', e);
      }
    }

    this.items = getInitialActionQueueItems();
    return this.items;
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage && this.items !== null) {
      try {
        // Strip out non-serializable moduleIcon before saving
        const serializable = this.items.map(({ moduleIcon, ...rest }) => rest);
        window.localStorage.setItem(ACTION_QUEUE_STORAGE_KEY, JSON.stringify(serializable));
      } catch (e) {
        console.warn('Failed to persist action queue', e);
      }
    }
  }

  private emitChange() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in action queue listener', err);
      }
    }
  }

  getItems(): ActionQueueItem[] {
    return this.loadItems();
  }

  setItems(newItems: ActionQueueItem[] | ((prev: ActionQueueItem[]) => ActionQueueItem[])) {
    const current = this.loadItems();
    const resolved = typeof newItems === 'function' ? newItems(current) : newItems;
    this.items = resolved.map(hydrateQueueItem);
    this.persist();
    this.emitChange();
  }

  addItem(item: ActionQueueItem) {
    const current = this.loadItems();
    this.setItems([hydrateQueueItem(item), ...current]);
  }

  approveItem(id: string, executionNote?: string) {
    this.setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'COMPLETED' as const,
          details: executionNote || 'Operator approved execution. Changes dispatched to destination module.'
        };
      }
      return item;
    }));
  }

  dismissItem(id: string) {
    this.setItems(prev => prev.filter(item => item.id !== id));
  }

  getPendingCount(): number {
    return this.loadItems().filter(i => i.status === 'PENDING_APPROVAL').length;
  }

  getStats() {
    const items = this.loadItems();
    const pendingCount = items.filter(i => i.status === 'PENDING_APPROVAL').length;
    const runningCount = items.filter(i => i.status === 'RUNNING').length;
    const alertCount = items.filter(i => i.status === 'ALERT').length;
    const completedCount = items.filter(i => i.status === 'COMPLETED').length;
    return { pendingCount, runningCount, alertCount, completedCount };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  resetToDefault() {
    this.items = getInitialActionQueueItems();
    this.persist();
    this.emitChange();
  }

  clear() {
    this.items = [];
    this.persist();
    this.emitChange();
  }
}

export const actionQueueStore = new ActionQueueStore();

export function useActionQueue() {
  const [items, setLocalItems] = useState<ActionQueueItem[]>(() => actionQueueStore.getItems());

  useEffect(() => {
    // Initial sync
    setLocalItems(actionQueueStore.getItems());
    // Subscribe to store updates
    return actionQueueStore.subscribe(() => {
      setLocalItems([...actionQueueStore.getItems()]);
    });
  }, []);

  const pendingCount = useMemo(() => {
    return items.filter(i => i.status === 'PENDING_APPROVAL').length;
  }, [items]);

  const stats = useMemo(() => {
    const pendingCount = items.filter(i => i.status === 'PENDING_APPROVAL').length;
    const runningCount = items.filter(i => i.status === 'RUNNING').length;
    const alertCount = items.filter(i => i.status === 'ALERT').length;
    const completedCount = items.filter(i => i.status === 'COMPLETED').length;
    return { pendingCount, runningCount, alertCount, completedCount };
  }, [items]);

  return {
    items,
    setItems: useCallback((updater: any) => actionQueueStore.setItems(updater), []),
    addItem: useCallback((item: ActionQueueItem) => actionQueueStore.addItem(item), []),
    approveItem: useCallback((id: string, note?: string) => actionQueueStore.approveItem(id, note), []),
    dismissItem: useCallback((id: string) => actionQueueStore.dismissItem(id), []),
    resetToDefault: useCallback(() => actionQueueStore.resetToDefault(), []),
    clear: useCallback(() => actionQueueStore.clear(), []),
    pendingCount,
    stats,
  };
}


