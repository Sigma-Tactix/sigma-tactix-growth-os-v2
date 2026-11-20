/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Download,
  Calendar,
  ChevronDown,
  Target,
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Play,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Globe,
  Zap,
} from 'lucide-react';
import { format, subDays, startOfQuarter, subQuarters } from 'date-fns';
import { cn, formatCurrency, formatNumber } from '@/src/lib/utils';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useUser } from '@/src/contexts/UserContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { INDUSTRY_REPORT_FORMATS, ReportColorProfile, COLOR_PROFILES } from '@/src/data/industryReportFormats';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';
import { GlassCard, Badge } from '@/src/components/ui';
import IntakeMetricsChart from '@/src/components/IntakeMetricsChart';

// ─── helpers ───────────────────────────────────────────────────────────────

const accentColors: Record<ReportColorProfile, { bg: string; text: string; border: string }> = {
  amber:      { bg: 'bg-amber-500/10',     text: 'text-amber-600',     border: 'border-amber-500/20' },
  indigo:     { bg: 'bg-indigo-500/10',    text: 'text-indigo-600',    border: 'border-indigo-500/20' },
  emerald:    { bg: 'bg-emerald-500/10',   text: 'text-emerald-600',   border: 'border-emerald-500/20' },
};

function TrendIcon({ value }: { value: 'up' | 'down' | 'neutral' }) {
  if (value === 'up') return <ArrowUpRight size={14} className="text-emerald-accent" />;
  if (value === 'down') return <ArrowDownRight size={14} className="text-rose-accent" />;
  return <Minus size={14} className="text-[var(--sigma-text-muted)]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--sigma-text-muted)] font-semibold">
      {children}
    </span>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

/**
 * Dashboard variant A: "Daily Briefing"
 *
 * A calm, editorial layout built for scanning. One headline number at the top,
 * supporting story cards in the middle, and a short action list at the bottom.
 *
 * Inspired by a morning newspaper — you read the top story first, then dig into
 * the sections that matter to you.
 */
export default function DashboardBriefing() {
  const { currentWorkspace } = useWorkspace();
  const { role } = useUser();
  const { pendingCount } = useActionQueue();
  const navigate = useNavigate();

  const [mediaMode, setMediaMode] = useState<'organic' | 'paid'>('organic');
  const [selectedIndustryId, setSelectedIndustryId] = useState(() => {
    try { return localStorage.getItem('sigmatactix_topline_industry') || 'b2b_saas'; } catch { return 'b2b_saas'; }
  });
  const [colorProfileKey, setColorProfileKey] = useState<ReportColorProfile>(() => {
    try {
      const cached = localStorage.getItem('sigmatactix_topline_theme') as ReportColorProfile;
      return cached && COLOR_PROFILES[cached] ? cached : 'amber';
    } catch { return 'amber'; }
  });
  const [showExport, setShowExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const industry = useMemo(() => INDUSTRY_REPORT_FORMATS.find(f => f.id === selectedIndustryId) || INDUSTRY_REPORT_FORMATS[0], [selectedIndustryId]);
  const accent = accentColors[colorProfileKey];

  // ─── mock live metrics (would be replaced by real API in production) ───
  const metrics = useMemo(() => ({
    spend: 18420,
    conversions: 312,
    roas: 3.8,
    sessions: 24800,
    activeUsers: 3840,
    organicConversions: 892,
    prevSpend: 16200,
    prevConversions: 278,
    prevRoas: 3.4,
    providersCount: 4,
  }), []);

  const spendDelta = ((metrics.spend - metrics.prevSpend) / metrics.prevSpend) * 100;
  const convDelta  = ((metrics.conversions - metrics.prevConversions) / metrics.prevConversions) * 100;

  // ─── channel data ────────────────────────────────────────────────────
  const channels = useMemo(() => [
    { name: 'Google Ads',      cvr: '4.2%', roas: '4.1x', cpc: '$2.40', share: '35%', status: 'SCALING',  bar: 85 },
    { name: 'Meta Ads',        cvr: '3.8%', roas: '3.6x', cpc: '$1.85', share: '25%', status: 'OPTIMAL',  bar: 72 },
    { name: 'LinkedIn Ads',    cvr: '2.9%', roas: '2.8x', cpc: '$5.20', share: '15%', status: 'SCALING',  bar: 58 },
    { name: 'Email',           cvr: '6.1%', roas: '8.2x', cpc: '$0.30', share: '10%', status: 'OPTIMAL',  bar: 95 },
    { name: 'Organic Search',  cvr: '3.2%', roas: '5.5x', cpc: '$0.00', share: '15%', status: 'GROWING',  bar: 65 },
  ], []);

  // ─── top-line number ────────────────────────────────────────────────
  const headlineValue = mediaMode === 'organic' ? formatNumber(metrics.sessions) : formatCurrency(metrics.spend);
  const headlineLabel = mediaMode === 'organic' ? 'Visitors this quarter' : 'Ad spend this quarter';

  return (
    <div className="space-y-10 pb-20 max-w-[1200px]">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.18em] mb-1.5">
            {currentWorkspace.name} · {industry.name}
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--sigma-text)]">
            {headlineLabel}
          </h1>
          <p className="text-sm text-[var(--sigma-text-muted)] mt-1.5">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')} · last updated {format(new Date(), 'HH:mm')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* organic / paid toggle */}
          <div className="flex rounded-xl border border-[var(--sigma-border)] p-0.5 bg-[var(--sigma-surface-subtle)]">
            {(['organic', 'paid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMediaMode(mode)}
                aria-pressed={mediaMode === mode}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  mediaMode === mode
                    ? 'bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-sm border border-[var(--sigma-border)]'
                    : 'text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]'
                )}
              >
                {mode === 'organic' ? 'Organic' : 'Ads'}
              </button>
            ))}
          </div>

          {/* industry selector */}
          <div className="relative">
            <button
              onClick={() => {/* open dropdown */}}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] text-xs font-medium text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)] transition-colors"
            >
              <Globe size={13} className="text-[var(--sigma-text-muted)]" />
              {industry.name}
              <ChevronDown size={12} className="text-[var(--sigma-text-muted)]" />
            </button>
          </div>

          {/* export */}
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(v => !v)} icon={<Download size={13} />}>
              Export
            </Button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] shadow-lg z-50 p-1.5 space-y-0.5"
                >
                  {['PDF', 'XLSX', 'PPTX'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={async () => { setIsExporting(true); setShowExport(false); await new Promise(r => setTimeout(r, 1200)); setIsExporting(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-colors"
                    >
                      Download {fmt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── A. HEADLINE + 4 key numbers ─────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero number — spans 2 cols */}
        <div className="sm:col-span-2 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--sigma-primary)]/5 to-transparent rounded-bl-full" />
          <p className="text-xs font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.14em] mb-2">{headlineLabel}</p>
          <p className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-[var(--sigma-text)]">
            {headlineValue}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            {spendDelta >= 0 ? <ArrowUpRight size={14} className="text-emerald-accent" /> : <ArrowDownRight size={14} className="text-rose-accent" />}
            <span className="text-xs font-mono font-medium text-[var(--sigma-text-muted)]">
              {Math.abs(spendDelta).toFixed(1)}% vs previous quarter
            </span>
          </div>
        </div>

        <StatCard
          label="Conversions"
          value={mediaMode === 'organic' ? formatNumber(metrics.organicConversions) : formatNumber(metrics.conversions)}
          delta={{ value: `${convDelta >= 0 ? '+' : ''}${convDelta.toFixed(1)}%`, trend: convDelta >= 0 ? 'up' : 'down' }}
          icon={<ShoppingCart size={16} />}
        />
        <StatCard
          label="Return on ad spend"
          value={`${metrics.roas.toFixed(1)}x`}
          delta={{ value: `${metrics.roas >= 3 ? 'Above' : 'Below'} 3x target`, trend: metrics.roas >= 3 ? 'up' : 'down' }}
          icon={<TrendingUp size={16} />}
        />
      </section>

      {/* ── B. CHANNEL TABLE ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionLabel>How each channel performed</SectionLabel>
            <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1">Channel performance</h2>
          </div>
          <button
            onClick={() => navigate('/paid-ads')}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--sigma-primary)] hover:underline"
          >
            Media plans <ExternalLink size={12} />
          </button>
        </div>
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/60">
                {['Channel', 'CVR', 'ROAS', 'CPC', 'Budget', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--sigma-text-muted)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sigma-border)]">
              {channels.map(ch => (
                <tr key={ch.name} className="hover:bg-[var(--sigma-surface-subtle)]/40 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-[var(--sigma-text)]">{ch.name}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[var(--sigma-text-soft)]">{ch.cvr}</td>
                  <td className="px-5 py-3.5 text-sm font-mono font-semibold text-[var(--sigma-text)]">{ch.roas}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[var(--sigma-text-muted)]">{ch.cpc}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--sigma-border)] overflow-hidden">
                        <div className={cn('h-full rounded-full', accent.bg.replace('/10', ''))} style={{ width: ch.bar + '%' }} />
                      </div>
                      <span className="text-xs font-mono text-[var(--sigma-text-muted)] w-8">{ch.share}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={ch.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── C. TREND CHART ──────────────────────────────────────────── */}
      <section>
        <SectionLabel>Spend trend</SectionLabel>
        <div className="mt-3 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <div className="flex items-center gap-4 text-xs text-[var(--sigma-text-muted)] mb-4">
            <span>This quarter</span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sigma-primary)]" />
              Ad spend
            </span>
          </div>
          {/* CSS bar chart — no external chart dependency */}
          <div className="flex items-end gap-1.5 h-32">
            {[38, 52, 47, 65, 58, 78, 82, 71, 90, 88, 95, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-[var(--sigma-primary)]/80 hover:bg-[var(--sigma-primary)] transition-colors" style={{ height: `${h}%` }} title={`Week ${i + 1}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--sigma-text-muted)]">
            <span>W1</span><span>W4</span><span>W8</span><span>W12</span>
          </div>
        </div>
      </section>

      {/* ── D. WHAT TO DO ───────────────────────────────────────────── */}
      <section>
        <SectionLabel>What needs attention</SectionLabel>
        <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1 mb-4">Your action list</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            priority="high"
            title="Review 3 pending approvals"
            description="Agent runs waiting for your sign-off before they go live."
            action="Review now"
            onClick={() => navigate('/agents')}
          />
          <ActionCard
            priority="medium"
            title="LinkedIn ad set needs attention"
            description="CPC rose 22% this week. Consider adjusting your bid or audience."
            action="View details"
            onClick={() => navigate('/paid-ads')}
          />
          <ActionCard
            priority="low"
            title="Monthly report is ready"
            description="Your October summary has been compiled and is ready to download."
            action="Download"
            onClick={() => {}}
          />
          <ActionCard
            priority="info"
            title="New connector available"
            description="TikTok Ads can now be linked to your workspace for unified reporting."
            action="Connect"
            onClick={() => navigate('/connectors')}
          />
        </div>
      </section>

      {/* ── E. INTAKE METRICS ───────────────────────────────────────── */}
      <section>
        <SectionLabel>Inbound leads</SectionLabel>
        <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1 mb-4">Lead intake trend</h2>
        <GlassCard className="p-5">
          <IntakeMetricsChart isLive={false} />
        </GlassCard>
      </section>
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, delta, icon }: { label: string; value: string; delta: { value: string; trend: 'up' | 'down' | 'neutral' }; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--sigma-text-muted)]">{label}</span>
        <span className="text-[var(--sigma-text-muted)]">{icon}</span>
      </div>
      <p className="text-2xl font-display font-bold tracking-tight text-[var(--sigma-text)]">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <TrendIcon value={delta.trend} />
        <span className="text-xs font-mono text-[var(--sigma-text-muted)]">{delta.value}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    OPTIMAL:  { bg: 'bg-emerald-500/10',  text: 'text-emerald-600' },
    SCALING:  { bg: 'bg-sky-500/10',     text: 'text-sky-600' },
    GROWING:  { bg: 'bg-amber-500/10',   text: 'text-amber-600' },
    REVIEW:   { bg: 'bg-rose-500/10',    text: 'text-rose-600' },
  };
  const s = map[status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-600' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold', s.bg, s.text)}>
      {status}
    </span>
  );
}

function ActionCard({ priority, title, description, action, onClick }: { priority: 'high' | 'medium' | 'low' | 'info'; title: string; description: string; action: string; onClick: () => void }) {
  const borderColors: Record<string, string> = {
    high: 'border-l-2 border-l-rose-accent',
    medium: 'border-l-2 border-l-amber-accent',
    low: 'border-l-2 border-l-emerald-accent',
    info: 'border-l-2 border-l-sky-accent',
  };
  const dotColors: Record<string, string> = {
    high: 'bg-rose-accent',
    medium: 'bg-amber-accent',
    low: 'bg-emerald-accent',
    info: 'bg-sky-accent',
  };

  return (
    <button
      onClick={onClick}
      className={cn('w-full text-left rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-4 hover:bg-[var(--sigma-surface-subtle)] transition-colors', borderColors[priority])}
    >
      <div className="flex items-start gap-3">
        <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dotColors[priority])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--sigma-text)]">{title}</p>
          <p className="text-xs text-[var(--sigma-text-muted)] mt-1 leading-relaxed">{description}</p>
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[var(--sigma-primary)]">
            {action} <ArrowUpRight size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}
