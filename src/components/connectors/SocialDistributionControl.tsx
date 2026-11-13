import React, { useState, useEffect } from 'react';
import {
  Share2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Layers,
} from 'lucide-react';
import { GlassCard, Button, Badge } from '@/src/components/ui';
import { useToast } from '@/src/contexts/ToastContext';
import { fetchSocialChannels, fetchSocialStatus } from '@/src/lib/socialDistributionApi';
import type { SocialChannel, SocialDistributionProviderStatus } from '@/src/server/providers/socialDistribution/types';

export function SocialDistributionControl() {
  const { notifySuccess, notifyError } = useToast();
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [status, setStatus] = useState<SocialDistributionProviderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [statusRes, channelsRes] = await Promise.all([
        fetchSocialStatus(),
        fetchSocialChannels(),
      ]);
      if (statusRes.success) {
        setStatus(statusRes.status);
      }
      if (channelsRes.success) {
        setChannels(channelsRes.channels);
      }
    } catch (err: any) {
      console.warn('Social distribution status unreachable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handlePing = async () => {
    await loadStatus();
    notifySuccess('Scheduler Status Updated', `Mode: ${status?.mode === 'live' ? 'Live Gateway' : 'Offline Mock'}`);
  };

  return (
    <GlassCard elevation="flat" className="p-5 border border-[var(--sigma-border)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sigma-border)] pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-accent/30 text-amber-accent">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--sigma-text)]">Omnichannel Social Distribution Gateway</h4>
              <Badge variant={status?.mode === 'live' ? 'success' : 'warning'} size="xs">
                {status?.mode === 'live' ? 'Live Connected' : 'Offline Mock Mode'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">
              Autonomous multi-platform distribution engine for carousels, video shorts, and thought leadership threads.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePing}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-xs font-mono text-[var(--sigma-text-soft)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Channel Badges Grid */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] flex items-center justify-between">
          <span>Configured Publishing Targets ({channels.length})</span>
          <span className="text-[var(--sigma-text-muted)] text-[10px]">
            {status?.mode === 'live' ? 'Connected to live sidecar daemon' : 'Running zero-friction local mocks'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {channels.map((chan) => (
            <div
              key={chan.id}
              className="p-2.5 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] flex items-center justify-between gap-2 min-w-0"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--sigma-text)] truncate capitalize">
                  {chan.platform}
                </div>
                <div className="text-[10px] text-[var(--sigma-text-muted)] font-mono truncate">
                  {chan.handle || chan.name}
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-accent shrink-0" title="Ready for dispatch" />
            </div>
          ))}
        </div>
      </div>

      {/* Security & Config Footnote */}
      <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] border-t border-[var(--sigma-border)] pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[var(--sigma-text-soft)]">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-accent" />
          <span>OAuth tokens sealed in sovereign sidecar credential store.</span>
        </div>
        <div>
          Env vars: <code className="text-amber-accent/80">SOCIAL_SCHEDULER_API_URL</code> & <code className="text-amber-accent/80">SOCIAL_SCHEDULER_API_KEY</code>
        </div>
      </div>
    </GlassCard>
  );
}
