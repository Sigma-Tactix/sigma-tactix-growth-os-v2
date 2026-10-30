import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  GitBranch,
  Hash,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Badge, Button, GlassCard } from '@/src/components/ui';
import { fetchDecisionTraces } from '@/src/lib/api';
import type { DecisionTraceRecord } from '@/src/types';

interface AgentTraceInspectorProps {
  agentId: string;
  agentName: string;
  agentCodename: string;
}

type TraceFilter = 'ALL' | 'triage' | 'route' | 'safety';

const OPERATION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  triage: { label: 'Risk Triage', color: 'text-amber-accent', icon: <AlertTriangle size={13} /> },
  route: { label: 'Module Route', color: 'text-sky-accent', icon: <GitBranch size={13} /> },
  safety: { label: 'Safety Gate', color: 'text-emerald-accent', icon: <Shield size={13} /> },
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? 'bg-emerald-500' :
    pct >= 65 ? 'bg-sky-500' :
    pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
      <span className="text-[10px] font-mono text-[var(--sigma-text-soft)] min-w-[32px] text-right">
        {pct}%
      </span>
    </div>
  );
}

function RedactionNotice() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
      <ShieldCheck size={14} className="text-emerald-accent mt-0.5 shrink-0" />
      <div className="text-[11px] text-[var(--sigma-text-soft)] leading-relaxed">
        <strong className="text-emerald-accent font-semibold">Governed Trace View</strong> — Raw prompts, customer
        inputs, credentials, and tool payloads are never transmitted to the browser. Inputs are represented by
        SHA-256 content hashes. Only structured decision outcomes, confidence scores, and timing data are displayed.
      </div>
    </div>
  );
}

function TraceCard({ trace, isExpanded, onToggle }: {
  trace: DecisionTraceRecord;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = OPERATION_META[trace.operation] || OPERATION_META.triage;
  const timestamp = new Date(trace.created_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <GlassCard
      interactive
      onClick={onToggle}
      className={cn(
        'p-4 transition-all',
        isExpanded && 'ring-1 ring-[var(--sigma-border-active)] border-[var(--sigma-border-active)]',
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('shrink-0', meta.color)}>{meta.icon}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neutral" size="xs">{meta.label}</Badge>
              <Badge
                variant={trace.requires_hitl ? 'warning' : 'success'}
                size="xs"
                icon={trace.requires_hitl ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
              >
                {trace.requires_hitl ? 'HITL Required' : 'Auto-Approved'}
              </Badge>
              {trace.policy_override && (
                <Badge variant="danger" size="xs" dot>Shadow Override</Badge>
              )}
            </div>
            <div className="text-[10px] font-mono text-[var(--sigma-text-muted)] mt-1 flex items-center gap-2">
              <Clock size={10} />
              {timestamp}
              <span className="text-[var(--sigma-text-muted)]">•</span>
              <Zap size={10} />
              {trace.duration_ms}ms
              <span className="text-[var(--sigma-text-muted)]">•</span>
              <span className="text-[var(--sigma-text-soft)]">{trace.authoritative_engine}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="w-24 hidden sm:block">
            <ConfidenceBar value={trace.confidence} />
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight size={14} className="text-[var(--sigma-text-muted)]" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[var(--sigma-border)] space-y-4">
              {/* Decision Outcome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">
                    Decision Outcome
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)]">
                    <pre className="text-[11px] font-mono text-[var(--sigma-text-soft)] whitespace-pre-wrap break-all">
                      {JSON.stringify(trace.selected_value, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">
                    Probability Distribution
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--sigma-bg)] border border-[var(--sigma-border)] space-y-2">
                    {Object.entries(trace.probabilities || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-[var(--sigma-text-soft)]">{key}</span>
                        <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#ff481b]/70"
                              style={{ width: `${Math.round(value * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[var(--sigma-text-muted)] min-w-[32px] text-right">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shadow Decision Comparison */}
              {trace.shadow_provider && trace.shadow_decision && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">
                    <Eye size={11} />
                    Shadow Engine Comparison
                    <span className="text-purple-400 normal-case">({trace.shadow_provider})</span>
                  </div>
                  <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                      <div>
                        <div className="text-[var(--sigma-text-muted)] mb-0.5">Shadow Decision</div>
                        <div className="text-purple-300">
                          {JSON.stringify(trace.shadow_decision)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--sigma-text-muted)] mb-0.5">Agreement</div>
                        <div className={trace.policy_override ? 'text-amber-accent' : 'text-emerald-accent'}>
                          {trace.policy_override ? 'Divergent — policy overrode shadow' : 'Convergent'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--sigma-text-muted)] mb-0.5">Mode</div>
                        <div className="text-[var(--sigma-text-soft)]">{trace.mode}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Redacted Input Evidence */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                <EyeOff size={11} className="text-zinc-500 shrink-0" />
                <span className="text-[10px] font-mono text-zinc-500">
                  Input fingerprint: {trace.id?.slice(0, 8)}… — raw content redacted by governance policy
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

export default function AgentTraceInspector({ agentId, agentName, agentCodename }: AgentTraceInspectorProps) {
  const [traces, setTraces] = useState<DecisionTraceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TraceFilter>('ALL');
  const [backendAvailable, setBackendAvailable] = useState(true);

  const loadTraces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDecisionTraces(50);
      setTraces(result);
      setBackendAvailable(true);
    } catch (err: any) {
      if (err.message?.includes('unavailable') || err.message?.includes('migration')) {
        setBackendAvailable(false);
        setError('Decision trace persistence is not yet configured. Apply migration 0016_decision_traces.sql and restart the backend.');
      } else {
        setError(err.message || 'Failed to load traces');
      }
      setTraces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTraces();
  }, [loadTraces]);

  const filteredTraces = filter === 'ALL'
    ? traces
    : traces.filter(t => t.operation === filter);

  const traceStats = {
    total: traces.length,
    triage: traces.filter(t => t.operation === 'triage').length,
    route: traces.filter(t => t.operation === 'route').length,
    safety: traces.filter(t => t.operation === 'safety').length,
    hitlCount: traces.filter(t => t.requires_hitl).length,
    overrideCount: traces.filter(t => t.policy_override).length,
    avgConfidence: traces.length > 0
      ? Math.round((traces.reduce((sum, t) => sum + t.confidence, 0) / traces.length) * 100)
      : 0,
    avgLatency: traces.length > 0
      ? Math.round(traces.reduce((sum, t) => sum + t.duration_ms, 0) / traces.length)
      : 0,
  };

  return (
    <div className="space-y-5">
      {/* Governance Notice */}
      <RedactionNotice />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Total Traces</div>
          <div className="text-lg font-bold text-[var(--sigma-text)] mt-0.5 font-mono">{traceStats.total}</div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Avg Confidence</div>
          <div className="text-lg font-bold text-emerald-accent mt-0.5 font-mono">{traceStats.avgConfidence}%</div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">HITL Required</div>
          <div className="text-lg font-bold text-amber-accent mt-0.5 font-mono">{traceStats.hitlCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]">
          <div className="text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider">Avg Latency</div>
          <div className="text-lg font-bold text-sky-accent mt-0.5 font-mono">{traceStats.avgLatency}ms</div>
        </div>
      </div>

      {/* Filter + Refresh Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-[var(--sigma-text-muted)]" />
          {(['ALL', 'triage', 'route', 'safety'] as TraceFilter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer',
                filter === f
                  ? 'bg-[#ff481b]/20 text-[#ff481b] border border-[#ff481b]/30'
                  : 'text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] border border-transparent hover:border-[var(--sigma-border)]',
              )}
            >
              {f === 'ALL' ? `All (${traceStats.total})` : `${f} (${traceStats[f]})`}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="xs"
          icon={<RefreshCw size={12} className={cn(loading && 'animate-spin')} />}
          onClick={loadTraces}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-accent shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--sigma-text-soft)] leading-relaxed">
            <strong className="text-amber-accent">Trace Backend Notice</strong>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Trace Timeline */}
      {!error && filteredTraces.length === 0 && !loading && (
        <div className="text-center py-12">
          <Activity size={28} className="text-[var(--sigma-text-muted)] mx-auto mb-3 opacity-40" />
          <div className="text-sm text-[var(--sigma-text-muted)]">No decision traces recorded yet</div>
          <div className="text-[11px] text-[var(--sigma-text-muted)] mt-1">
            Traces are created when the decision engine classifies risk, routes issues, or evaluates swarm safety.
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTraces.map(trace => (
            <motion.div
              key={trace.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TraceCard
                trace={trace}
                isExpanded={expandedId === trace.id}
                onToggle={() => setExpandedId(prev => prev === trace.id ? null : trace.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Shadow Override Summary */}
      {traceStats.overrideCount > 0 && (
        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-start gap-2">
          <Eye size={13} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-[var(--sigma-text-soft)]">
            <strong className="text-purple-300">{traceStats.overrideCount} shadow override{traceStats.overrideCount > 1 ? 's' : ''}</strong>{' '}
            detected — the authoritative engine diverged from the shadow provider's recommendation.
            Review these traces to calibrate decision boundaries.
          </div>
        </div>
      )}
    </div>
  );
}

