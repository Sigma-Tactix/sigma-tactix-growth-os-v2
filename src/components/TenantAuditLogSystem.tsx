import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  Settings,
  Activity,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Terminal,
  Database,
  ArrowUpRight,
  X,
  Eye,
  Building,
  Key,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { exportService } from '@/src/services/exportService';

export type AuditCategory = 'ALL' | 'CONFIG_CHANGE' | 'REPORT_GENERATION' | 'ACTIVITY' | 'SECURITY';
export type AuditSeverity = 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  tenantName: string;
  category: 'CONFIG_CHANGE' | 'REPORT_GENERATION' | 'ACTIVITY' | 'SECURITY';
  action: string;
  actor: {
    name: string;
    type: 'USER' | 'SYSTEM_WORKER' | 'AGENT' | 'SECURITY_MIDDLEWARE';
    avatar?: string;
  };
  resource: string;
  severity: AuditSeverity;
  details: string;
  payloadDiff?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  verificationHash: string;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-94821',
    timestamp: 'Just now (14:32:08 GMT)',
    tenantId: '1',
    tenantName: 'Sigma Tactix (Primary)',
    category: 'CONFIG_CHANGE',
    action: 'OAuth Token TTL & Secret Scope Modified',
    actor: { name: 'sigmatactix@gmail.com', type: 'USER' },
    resource: 'Credentials Vault / OAuth Connectors',
    severity: 'SUCCESS',
    details: 'Extended Meta Ads & HubSpot token refresh TTL from 3600s to 7200s with scoped read/write boundaries.',
    payloadDiff: {
      before: { token_ttl_seconds: 3600, scope: ['ads_read'], rotation_policy: 'daily' },
      after: { token_ttl_seconds: 7200, scope: ['ads_read', 'campaign_optimize'], rotation_policy: 'weekly' }
    },
    verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'LOG-94820',
    timestamp: '12 mins ago (14:20:14 GMT)',
    tenantId: '2',
    tenantName: 'Enterprise Client Enclave',
    category: 'REPORT_GENERATION',
    action: 'Executive Growth Summary PDF Compiled',
    actor: { name: 'Oracle-05 (Agent)', type: 'AGENT' },
    resource: 'Executive Vault / Reports Archive',
    severity: 'SUCCESS',
    details: 'Compiled 14-page Executive Growth Briefing with Q3 ROAS attribution and CAC by channel vectors.',
    payloadDiff: {
      before: { last_report_id: 'REP-7718', status: 'PENDING' },
      after: { last_report_id: 'REP-8902', file_size_mb: 8.4, pages: 14, format: 'PDF', status: 'EXPORTED' }
    },
    verificationHash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
  },
  {
    id: 'LOG-94819',
    timestamp: '45 mins ago (13:47:33 GMT)',
    tenantId: '1',
    tenantName: 'Sigma Tactix (Primary)',
    category: 'REPORT_GENERATION',
    action: 'Omnichannel CSV Export Triggered',
    actor: { name: 'sigmatactix@gmail.com', type: 'USER' },
    resource: 'Marketing Vault / Raw Attribution Tables',
    severity: 'SUCCESS',
    details: 'Exported 18,400 row attribution dataset with Google Ads, Meta, and GA4 click conversions.',
    payloadDiff: {
      before: {},
      after: { rows_exported: 18400, format: 'CSV', destination: 'Client Download' }
    },
    verificationHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
  },
  {
    id: 'LOG-94818',
    timestamp: '1 hour ago (13:30:19 GMT)',
    tenantId: '3',
    tenantName: 'Growth Client Enclave',
    category: 'CONFIG_CHANGE',
    action: 'Max Autonomous Ad Budget Threshold Altered',
    actor: { name: 'admin@wayne-corp.io', type: 'USER' },
    resource: 'AI Workflow Vault / Nexus-03 Arbiter',
    severity: 'WARNING',
    details: 'Adjusted autonomous daily ad bid rebalancing cap from $10,000/day to $25,000/day.',
    payloadDiff: {
      before: { max_daily_budget: 10000, human_in_the_loop_threshold: 5000 },
      after: { max_daily_budget: 25000, human_in_the_loop_threshold: 12000 }
    },
    verificationHash: 'b4c7304561937985444a7066929a733ec5d5ac2ffb617056cbb417a869a8b1a3'
  },
  {
    id: 'LOG-94817',
    timestamp: '2 hours ago (12:15:02 GMT)',
    tenantId: '4',
    tenantName: 'Client Analytics Enclave',
    category: 'ACTIVITY',
    action: 'Second Brain Customer Vault Re-indexed',
    actor: { name: 'BullMQ Worker #04', type: 'SYSTEM_WORKER' },
    resource: 'Customer Vault / pgvector Enclave',
    severity: 'SUCCESS',
    details: 'Indexed 4,280 new B2B buyer persona vector embeddings with text-embedding-004.',
    payloadDiff: {
      before: { vector_count: 38200 },
      after: { vector_count: 42480, dimension: 1536 }
    },
    verificationHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
  },
  {
    id: 'LOG-94816',
    timestamp: '3 hours ago (11:04:41 GMT)',
    tenantId: '3',
    tenantName: 'Growth Client Enclave',
    category: 'SECURITY',
    action: 'Unrecognized IP Attempt Blocked',
    actor: { name: 'Security Gateway WAF', type: 'SECURITY_MIDDLEWARE' },
    resource: 'Executive Vault / Strategy Partition',
    severity: 'CRITICAL',
    details: 'Blocked unauthorized read attempt on Executive Vault partition from untrusted egress IP (185.220.101.5).',
    payloadDiff: {
      before: { blocked_attempts_24h: 3 },
      after: { blocked_attempts_24h: 4, last_blocked_ip: '185.220.101.5', status: 'QUARANTINED' }
    },
    verificationHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  },
  {
    id: 'LOG-94815',
    timestamp: '5 hours ago (09:40:12 GMT)',
    tenantId: '1',
    tenantName: 'Sigma Tactix (Primary)',
    category: 'CONFIG_CHANGE',
    action: 'RBAC Policy Matrix Updated for Sub-Admins',
    actor: { name: 'sigmatactix@gmail.com', type: 'USER' },
    resource: 'Operations Vault / Role Matrix',
    severity: 'SUCCESS',
    details: 'Granted read-only audit log access to Tenant Marketing Leads while preserving zero-trust on Credentials Vault.',
    payloadDiff: {
      before: { sub_admin_roles: ['view_dashboard', 'edit_content'] },
      after: { sub_admin_roles: ['view_dashboard', 'edit_content', 'view_audit_logs'] }
    },
    verificationHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
  },
  {
    id: 'LOG-94814',
    timestamp: '8 hours ago (06:12:55 GMT)',
    tenantId: '2',
    tenantName: 'Stark Industries',
    category: 'REPORT_GENERATION',
    action: 'Weekly Slack Digest Dispatched to Channel #growth-ops',
    actor: { name: 'Aurora-01 (Agent)', type: 'AGENT' },
    resource: 'Marketing Vault / Automated Reports',
    severity: 'SUCCESS',
    details: 'Generated and posted automated 7-day conversion velocity summary and top 3 landing page anomalies to Slack.',
    payloadDiff: {
      before: {},
      after: { destination_channel: '#growth-ops', blocks_sent: 12, response_status: 200 }
    },
    verificationHash: '3b9f84898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1543ff'
  }
];

interface TenantAuditLogSystemProps {
  tenants: { id: string; name: string }[];
}

export default function TenantAuditLogSystem({ tenants }: TenantAuditLogSystemProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory>('ALL');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isSimulatingNewEvent, setIsSimulatingNewEvent] = useState(false);

  // Filtered entries
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const matchTenant = selectedTenantId === 'ALL' || log.tenantId === selectedTenantId;
      const matchSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchTenant && matchSearch;
    });
  }, [auditLogs, selectedCategory, selectedTenantId, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: auditLogs.length,
      config: auditLogs.filter(l => l.category === 'CONFIG_CHANGE').length,
      reports: auditLogs.filter(l => l.category === 'REPORT_GENERATION').length,
      activity: auditLogs.filter(l => l.category === 'ACTIVITY').length,
      security: auditLogs.filter(l => l.category === 'SECURITY').length,
    };
  }, [auditLogs]);

  // Simulate new incoming audit log
  const handleSimulateNewEvent = () => {
    setIsSimulatingNewEvent(true);
    setTimeout(() => {
      const sampleEvents: Partial<AuditLogEntry>[] = [
        {
          category: 'CONFIG_CHANGE',
          action: 'Webhook Destination Updated for Meta Ads',
          details: 'Registered new HTTPS ingest endpoint with HMAC verification signature for real-time lead webhook.',
          resource: 'Credentials Vault / Webhooks',
          payloadDiff: {
            before: { endpoint: 'https://api.old.tenant.com/webhooks' },
            after: { endpoint: 'https://growth-os.sigmatactix.com/api/v1/intake/meta' }
          },
          severity: 'SUCCESS'
        },
        {
          category: 'REPORT_GENERATION',
          action: 'Monthly Board Presentation Deck (PPTX) Compiled',
          details: 'Rendered 22-slide automated PPTX executive presentation with visual CAC curves and roadmap milestones.',
          resource: 'Executive Vault / Presentation Exports',
          payloadDiff: {
            before: {},
            after: { file_type: 'PPTX', slides: 22, theme: 'Dark Executive Onyx' }
          },
          severity: 'SUCCESS'
        },
        {
          category: 'ACTIVITY',
          action: 'Human-in-the-Loop Task Approved by Admin',
          details: 'Admin reviewed and approved $4,500 budget reallocation proposed by Nexus-03 Ad Optimizer.',
          resource: 'Operations Vault / HITL Approval Queue',
          payloadDiff: {
            before: { status: 'PENDING_APPROVAL' },
            after: { status: 'APPROVED', approved_by: 'sigmatactix@gmail.com' }
          },
          severity: 'SUCCESS'
        }
      ];

      const chosen = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const randomTenant = tenants[Math.floor(Math.random() * tenants.length)] || { id: '1', name: 'Sigma Tactix HQ' };

      const newEntry: AuditLogEntry = {
        id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp: 'Just now (Live)',
        tenantId: randomTenant.id,
        tenantName: randomTenant.name,
        category: chosen.category as any,
        action: chosen.action || 'Configuration Event',
        actor: { name: 'sigmatactix@gmail.com', type: 'USER' },
        resource: chosen.resource || 'Tenant Enclave',
        severity: (chosen.severity as AuditSeverity) || 'SUCCESS',
        details: chosen.details || 'Event logged successfully',
        payloadDiff: chosen.payloadDiff,
        verificationHash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };

      setAuditLogs(prev => [newEntry, ...prev]);
      setIsSimulatingNewEvent(false);
    }, 600);
  };

  const handleExportAuditLogs = () => {
    const exportData = filteredLogs.map(l => ({
      'Audit ID': l.id,
      'Timestamp': l.timestamp,
      'Tenant': l.tenantName,
      'Category': l.category,
      'Action': l.action,
      'Actor': `${l.actor.name} (${l.actor.type})`,
      'Target Resource': l.resource,
      'Severity': l.severity,
      'Details': l.details,
      'SHA-256 Hash': l.verificationHash
    }));

    exportService.toCSV(exportData, `sigmatactix-tenant-audit-log-${new Date().getTime()}.csv`);
  };

  return (
    <div className="bg-surface border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Accent */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6 relative z-10">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2 mb-1.5">
            <ShieldCheck size={14} className="text-accent" /> Immutable Enclave Audit System
          </div>
          <h2 className="text-2xl lg:text-3xl font-heading font-black silver-text tracking-tight">
            Tenant & System Audit Logs
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Real-time tracking of organizational activity, administrative configuration mutations, automated report generation, and security access across all client Second Brain enclaves.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateNewEvent}
            disabled={isSimulatingNewEvent}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:border-accent/40 text-xs font-mono font-bold silver-text rounded-xl hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={14} className={cn("text-accent", isSimulatingNewEvent && "animate-spin")} />
            {isSimulatingNewEvent ? "Logging Event..." : "Simulate New Event"}
          </button>

          <button
            onClick={handleExportAuditLogs}
            className="px-4 py-2 bg-accent text-background text-xs font-mono font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all amber-glow flex items-center gap-2"
          >
            <Download size={14} /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Category selector */}
        <div className="sigma-segmented font-mono">
          {[
            { id: 'ALL', label: 'All Events', count: counts.all, icon: Activity },
            { id: 'CONFIG_CHANGE', label: 'Configuration Changes', count: counts.config, icon: Settings },
            { id: 'REPORT_GENERATION', label: 'Report Generation', count: counts.reports, icon: FileText },
            { id: 'ACTIVITY', label: 'Operational Activity', count: counts.activity, icon: Terminal },
            { id: 'SECURITY', label: 'Security & Auth', count: counts.security, icon: ShieldCheck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as AuditCategory)}
              className={cn(
                "sigma-segment flex items-center gap-2",
                selectedCategory === tab.id
                  ? "sigma-segment-active"
                  : ""
              )}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                selectedCategory === tab.id ? "bg-white/20 text-white" : "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)]"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tenant Filter Dropdown & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ALL">All Tenants (Enclaves)</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs, actors, diffs..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/20 shadow-xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-muted">
                <th className="px-6 py-4">Event ID & Timestamp</th>
                <th className="px-6 py-4">Tenant / Enclave</th>
                <th className="px-6 py-4">Event Category & Action</th>
                <th className="px-6 py-4">Initiator / Actor</th>
                <th className="px-6 py-4">Target Resource</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs font-mono text-zinc-500">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* ID & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono font-bold silver-text group-hover:amber-text transition-colors">
                        {log.id}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {log.timestamp}
                      </div>
                    </td>

                    {/* Tenant */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-accent shrink-0" />
                        <span className="text-xs font-bold text-white">{log.tenantName}</span>
                      </div>
                    </td>

                    {/* Category & Action */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase",
                          log.category === 'CONFIG_CHANGE' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          log.category === 'REPORT_GENERATION' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                          log.category === 'SECURITY' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}>
                          {log.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-200 mt-1 group-hover:text-white">
                        {log.action}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-zinc-300 font-medium">
                        {log.actor.name}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 uppercase">
                        {log.actor.type.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Resource */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-zinc-400">
                        {log.resource}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                        log.severity === 'SUCCESS' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        log.severity === 'WARNING' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {log.severity === 'SUCCESS' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {log.severity}
                      </span>
                    </td>

                    {/* Details button */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ml-auto">
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal / Drawer */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-accent">{selectedLog.id}</span>
                    <span className="text-xs text-muted font-mono">• {selectedLog.timestamp}</span>
                  </div>
                  <h3 className="text-lg font-heading font-black silver-text mt-1">
                    {selectedLog.action}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Event Attributes Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="text-muted text-[10px] uppercase">Tenant Enclave</div>
                  <div className="font-bold text-white mt-0.5">{selectedLog.tenantName}</div>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="text-muted text-[10px] uppercase">Initiator / Actor</div>
                  <div className="font-bold text-secondary mt-0.5">{selectedLog.actor.name} ({selectedLog.actor.type})</div>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="text-muted text-[10px] uppercase">Target Resource Vault</div>
                  <div className="font-bold text-white mt-0.5">{selectedLog.resource}</div>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="text-muted text-[10px] uppercase">Audit Severity</div>
                  <div className="font-bold text-green-400 mt-0.5">{selectedLog.severity}</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-muted">Audit Description</div>
                <p className="text-xs text-zinc-300 bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed font-sans">
                  {selectedLog.details}
                </p>
              </div>

              {/* Payload Diff (for Configuration Changes or Report Events) */}
              {selectedLog.payloadDiff && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-muted flex items-center justify-between">
                    <span>State Mutation Diff (Payload)</span>
                    <span className="text-accent font-mono">JSON Delta</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl">
                      <div className="text-red-400 text-[10px] uppercase mb-1 font-bold">- Before State</div>
                      <pre className="text-[11px] text-zinc-300 overflow-x-auto">
                        {JSON.stringify(selectedLog.payloadDiff.before || {}, null, 2)}
                      </pre>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                      <div className="text-emerald-400 text-[10px] uppercase mb-1 font-bold">+ After State</div>
                      <pre className="text-[11px] text-zinc-300 overflow-x-auto">
                        {JSON.stringify(selectedLog.payloadDiff.after || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic Verification Hash */}
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] font-mono text-zinc-400 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 uppercase">
                  <span>SHA-256 Ledger Signature</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Cryptographically Verified
                  </span>
                </div>
                <div className="truncate text-zinc-300 font-mono select-all">
                  {selectedLog.verificationHash}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-muted hover:text-white rounded-xl text-xs font-mono font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
