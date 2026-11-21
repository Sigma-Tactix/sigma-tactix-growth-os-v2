import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiFetch } from '@/src/lib/api';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';

interface ChannelMetrics {
  pipelineId: string; platform: string; accountName?: string;
  spend: number; conversions: number; revenue: number;
  currency?: string; observedAt?: string; isFixture?: boolean;
}

export default function AttributionRoiPage() {
  const { currentWorkspaceId } = useWorkspace();
  const [channels, setChannels] = useState<ChannelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setChannels([]); setLoading(true); setError(null);
    void (async () => {
      try {
        const response = await apiFetch('/api/workspace/reporting/metrics', { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load channel performance.');
        const data = await response.json();
        if (!data.success || !Array.isArray(data.metrics?.providers)) throw new Error('Channel performance is unavailable.');
        const providers = data.metrics.source === 'live_provider'
          ? data.metrics.providers.filter((item: ChannelMetrics) => item.isFixture !== true) : [];
        if (!controller.signal.aborted) setChannels(providers);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load channel performance.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentWorkspaceId, refresh]);

  const number = (value: number) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="sigma-text text-2xl font-bold">Channel performance</h1>
          <p className="sigma-muted mt-1 text-sm">Metrics from verified connections. Conversions may overlap across platforms.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="sigma-control inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      {error && <p role="alert" className="sigma-text text-sm">{error}</p>}
      {loading ? <p role="status" className="sigma-muted text-sm">Loading channel performance…</p> : channels.length === 0 ? (
        <div className="sigma-card rounded-xl p-6">
          <h2 className="sigma-text font-semibold">No verified channel data yet</h2>
          <p className="sigma-muted mt-2 text-sm">Connect and verify an analytics or advertising source to see its metrics here.</p>
        </div>
      ) : (
        <div className="sigma-card overflow-x-auto rounded-xl">
          <table className="w-full text-left text-sm">
            <caption className="sigma-muted px-4 py-3 text-left">Spend and revenue use each source’s currency; they are not combined.</caption>
            <thead className="sigma-muted"><tr>{['Source', 'Spend', 'Revenue', 'Conversions', 'Observed'].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody className="sigma-text">{channels.map(channel => <tr key={channel.pipelineId} className="border-t border-[var(--sigma-border)]"><td className="px-4 py-3">{channel.accountName || channel.platform}{channel.currency ? ` (${channel.currency})` : ''}</td><td className="px-4 py-3">{number(channel.spend)}</td><td className="px-4 py-3">{number(channel.revenue)}</td><td className="px-4 py-3">{number(channel.conversions)}</td><td className="px-4 py-3">{channel.observedAt ? new Date(channel.observedAt).toLocaleString() : 'Not recorded'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
