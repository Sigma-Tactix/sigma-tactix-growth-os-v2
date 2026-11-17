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

export type ActionQueueItemStatus = 'PENDING_APPROVAL' | 'RUNNING' | 'COMPLETED' | 'ALERT' | 'FAILED';
export type ActionQueueCategory = 'ALL' | 'APPROVALS' | 'DEMAND' | 'CAPTURE' | 'INTELLIGENCE' | 'CREATIVE' | 'INFRASTRUCTURE';

export interface ActionApprovalRecord {
  approvedAt: string;
  approver: string;
  approvedPayloadHash: string;
  status: 'APPROVED' | 'REVOKED';
  revokedAt?: string;
  revocationReason?: string;
}

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
  payloadHash?: string;
  approval?: ActionApprovalRecord;
  lastExecutedAt?: string;
  lastError?: string;
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

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize((value as any)[k])}`).join(',')}}`;
}

/**
 * Deterministic hash of an action item's payload and constraints (S07-A2).
 * Works identically across browser and Node.js runtimes.
 */
export function computeActionPayloadHash(item: Partial<ActionQueueItem>): string {
  const payloadToHash = {
    id: item.id || '',
    moduleName: item.moduleName || '',
    moduleCategory: item.moduleCategory || '',
    enclaveId: item.enclaveId || '',
    title: item.title || '',
    summary: item.summary || '',
    suggestedAction: item.suggestedAction || '',
    risk: item.risk || '',
    runPayload: item.runPayload || {},
  };
  const str = canonicalize(payloadToHash);
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >> 8), 0x5bd1e995);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `act-hash-${p1}${p2}`;
}

export function hydrateQueueItem(item: ActionQueueItem): ActionQueueItem {
  const payloadHash = item.payloadHash || computeActionPayloadHash(item);
  return {
    ...item,
    payloadHash,
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
    const withHash: ActionQueueItem = {
      ...item,
      payloadHash: item.payloadHash || computeActionPayloadHash(item),
    };
    this.setItems([hydrateQueueItem(withHash), ...current]);
  }

  /**
   * S07-A2 & S07-A3: Truthful approval with payload hash verification and idempotency.
   */
  approveItem(
    id: string,
    executionNote?: string,
    options?: { approver?: string; expectedHash?: string }
  ): { success: boolean; error?: string } {
    const current = this.loadItems();
    const item = current.find(i => i.id === id);
    if (!item) {
      return { success: false, error: `Action item ${id} not found` };
    }

    // S07-A2: Revoked action blocked
    if (item.approval?.status === 'REVOKED') {
      return {
        success: false,
        error: `Action approval was revoked: ${item.approval.revocationReason || 'Operator withdrew consent.'}`,
      };
    }

    // S07-A2: Verify payload version/hash bound to permission; edited action blocked
    const currentHash = computeActionPayloadHash(item);
    if (options?.expectedHash && options.expectedHash !== currentHash) {
      this.failItem(id, `Payload hash mismatch: expected ${options.expectedHash}, got ${currentHash}. Action was altered after review.`);
      return {
        success: false,
        error: 'Payload altered after review; consent invalidated.',
      };
    }

    if (item.approval?.approvedPayloadHash && item.approval.approvedPayloadHash !== currentHash) {
      this.failItem(id, `Approved payload hash mismatch: approved ${item.approval.approvedPayloadHash}, got ${currentHash}. Action was altered after approval.`);
      return {
        success: false,
        error: 'Payload altered after approval; consent invalidated.',
      };
    }

    // S07-A3: Idempotent - if already completed with identical payload hash, do not duplicate
    if (item.status === 'COMPLETED' && item.payloadHash === currentHash) {
      return { success: true };
    }

    const approvalRecord: ActionApprovalRecord = {
      approvedAt: new Date().toISOString(),
      approver: options?.approver || 'operator',
      approvedPayloadHash: currentHash,
      status: 'APPROVED',
    };

    this.setItems(prev => prev.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status: 'COMPLETED' as const,
          payloadHash: currentHash,
          approval: approvalRecord,
          details: executionNote || 'Operator approved execution. Changes dispatched to destination module.',
          lastExecutedAt: new Date().toISOString(),
          lastError: undefined,
        };
      }
      return i;
    }));

    return { success: true };
  }

  /**
   * S07-A1: Truthful failure transition. 401/403/500/timeout records failure, never completion.
   */
  failItem(id: string, reason: string, details?: string) {
    this.setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'FAILED' as const,
          details: details || `Execution failed: ${reason}`,
          lastError: reason,
          lastExecutedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  }

  /**
   * S07-A3: Transitions to RUNNING state when execution begins.
   */
  startExecution(id: string) {
    this.setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'RUNNING' as const,
          duration: 'In progress',
          lastExecutedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  }

  /**
   * S07-A2: Explicitly revokes approval consent and blocks future execution.
   */
  revokeItem(id: string, reason?: string) {
    const revReason = reason || 'Operator withdrew consent.';
    this.setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'ALERT' as const,
          details: `Approval revoked: ${revReason}`,
          approval: {
            approvedAt: item.approval?.approvedAt || new Date().toISOString(),
            approver: item.approval?.approver || 'operator',
            approvedPayloadHash: item.payloadHash || computeActionPayloadHash(item),
            status: 'REVOKED' as const,
            revokedAt: new Date().toISOString(),
            revocationReason: revReason,
          },
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
    const failedCount = items.filter(i => i.status === 'FAILED').length;
    return { pendingCount, runningCount, alertCount, completedCount, failedCount };
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
    const failedCount = items.filter(i => i.status === 'FAILED').length;
    return { pendingCount, runningCount, alertCount, completedCount, failedCount };
  }, [items]);

  return {
    items,
    setItems: useCallback((updater: any) => actionQueueStore.setItems(updater), []),
    addItem: useCallback((item: ActionQueueItem) => actionQueueStore.addItem(item), []),
    approveItem: useCallback((id: string, note?: string, options?: { approver?: string; expectedHash?: string }) => actionQueueStore.approveItem(id, note, options), []),
    failItem: useCallback((id: string, reason: string, details?: string) => actionQueueStore.failItem(id, reason, details), []),
    startExecution: useCallback((id: string) => actionQueueStore.startExecution(id), []),
    revokeItem: useCallback((id: string, reason?: string) => actionQueueStore.revokeItem(id, reason), []),
    dismissItem: useCallback((id: string) => actionQueueStore.dismissItem(id), []),
    resetToDefault: useCallback(() => actionQueueStore.resetToDefault(), []),
    clear: useCallback(() => actionQueueStore.clear(), []),
    pendingCount,
    stats,
  };
}


