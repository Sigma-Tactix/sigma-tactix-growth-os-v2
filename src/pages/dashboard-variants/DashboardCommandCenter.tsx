/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  Globe,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Calendar,
  ChevronDown,
  ExternalLink,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Settings2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency, formatNumber } from '@/src/lib/utils';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useUser } from '@/src/contexts/UserContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { INDUSTRY_REPORT_FORMATS, ReportColorProfile, COLOR_PROFILES } from '@/src/data/industryReportFormats';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';
import { GlassCard, Badge } from '@/src/components/ui';

// ─── helpers ───────────────────────────────────────────────────────────────

const accentMap: Record<ReportColorProfile, string> = {
  amber:   'bg-amber-500',
  indigo:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
};

function DeltaIcon({ value }: { value: 'up' | 'down' | 'neutral' }) {
  if (value === 'up') return <ArrowUpRight size={13} className="text-emerald-600" />;
  if (value === 'down') return <ArrowDownRight size={13} className="text-rose-600" />;
  return <Minus size={13} className="text-[var(--sigma-text-muted)]" />;
}

function SparkLine({ data, color = 'var(--sigma-primary)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <svg viewBox={`0 0 ${data.length * 8} 32`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={data.map((v, i) => `${i * 8},${32 - ((v - min) / range) * 28}`).join(' ')}
      />
    </svg>
  );
}

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--sigma-border)] overflow-hidden">
      <div className="h-full rounded-full bg-[var(--sigma-primary)]" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

/**
 * Dashboard variant B: "Command Center"
 *
 * A dense, power-user layout. Every metric is visible at once — no scrolling
 * required to see the full picture. Each metric card has a mini sparkline so
 * you can see direction without opening a chart.
 *
 * Built for operators who check the dashboard several times a day and want
 * to spot changes fast.
 */
export default function DashboardCommandCenter() {
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

  const industry = useMemo(() => INDUSTRY_REPORT_FORMATS.find(f => f.id === selectedIndustryId) || INDUSTRY_REPORT_FORMATS[0], [selectedIndustryId]);

  // ─── mock live data ────────────────────────────────────────────────
  const kpis = useMemo(() => [
    {
      label: 'Ad spend',
      value: formatCurrency(18200),
      delta: { value: '+12.4%', trend: 'up' as const },
      spark: [30, 45, 40, 55, 50, 65, 62, 78, 75, 88, 82, 100],
      icon: <DollarSign size={16} />,
    },
    {
      label: 'Clicks',
      value: formatNumber(24800),
      delta: { value: '+8.1%', trend: 'up' as const },
      spark: [40, 55, 50, 60, 58, 72, 70, 80, 78, 85, 90, 100],
      icon: <MousePointerClick size={16} />,
    },
    {
      label: 'Conversions',
      value: formatNumber(312),
      delta: { value: '+5.3%', trend: 'up' as const },
      spark: [35, 42, 48, 45, 55, 60, 58, 68, 72, 78, 85, 100],
      icon: <ShoppingCart size={16} />,
    },
    {
      label: 'ROAS',
      value: '3.8x',
      delta: { value: '+0.4x', trend: 'up' as const },
      spark: [60, 55, 65, 62, 70, 68, 75, 72, 80, 78, 85, 100],
      icon: <TrendingUp size={16} />,
    },
    {
      label: 'Visitors',
      value: formatNumber(24800),
      delta: { value: '+3.2%', trend: 'up' as const },
      spark: [50, 55, 52, 60, 58, 65, 68, 70, 72, 75, 78, 100],
      icon: <Globe size={16} />,
    },
    {
      label: 'CPC',
      value: '$2.40',
      delta: { value: '-$0.15', trend: 'up' as const },
      spark: [80, 78, 75, 72, 70, 68, 65, 62, 60, 58, 55, 100],
      icon: <MousePointerClick size={16} />,
    },
  ], []);

  const alerts = useMemo(() => [
    { level: 'warn', text: 'LinkedIn CPC up 22% this week' },
    { level: 'ok', text: 'Meta campaign within budget' },
    { level: 'error', text: 'Google Ads connector needs re-auth' },
    { level: 'ok', text: '3 agents completed tasks today' },
  ], []);

  const channels = useMemo(() => [
    { name: 'Google Ads',  spend: 6400, conv: 138, roas: '4.1x', status: 'SCALING' as const, pct: 78 },
    { name: 'Meta Ads',    spend: 4600, conv: 95,  roas: '3.6x', status: 'OPTIMAL' as const, pct: 65 },
    { name: 'LinkedIn',    spend: 2800, conv: 42,  roas: '2.8x', status: 'SCALING' as const, pct: 48 },
    { name: 'Email',       spend: 900,  conv: 72,  roas: '8.2x', status: 'OPTIMAL' as const, pct: 92 },
    { name: 'Organic',     spend: 0,    conv: 112, roas: '5.5x', status: 'GROWING' as const, pct: 60 },
  ], []);

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.16em]">
            {currentWorkspace.name} · {industry.name}
          </p>
          <h1 className="text-2xl font-display font-bold text-[var(--sigma-text)] mt-1">
            Command Center
          </h1>
          <p className="text-xs text-[var(--sigma-text-muted)] mt-1">
            {format(new Date(), 'EEEE, MMM dd, yyyy · HH:mm')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--sigma-border)] p-0.5 bg-[var(--sigma-surface-subtle)]">
            {(['organic', 'paid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMediaMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  mediaMode === mode
                    ? 'bg-[var(--sigma-surface)] text-[var(--sigma-text)] shadow-sm border border-[var(--sigma-border)]'
                    : 'text-[var(--sigma-text-muted)]'
                )}
              >
                {mode === 'organic' ? 'Organic' : 'Ads'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(v => !v)} icon={<Download size={13} />}>
              Export
            </Button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] shadow-lg z-50 p-1.5"
                >
                  {['PDF', 'XLSX', 'PPTX'].map(fmt => (
                    <button key={fmt} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)]">
                      {fmt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── A. KPI TILES (full width, compact) ──────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-4 hover:border-[var(--sigma-border-strong)] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] font-semibold">{kpi.label}</span>
              <span className="text-[var(--sigma-text-muted)]">{kpi.icon}</span>
            </div>
            <p className="text-lg font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <DeltaIcon value={kpi.delta.trend} />
              <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">{kpi.delta.value}</span>
            </div>
            <div className="mt-3">
              <SparkLine data={kpi.spark} />
            </div>
          </div>
        ))}
      </section>

      {/* ── B. MAIN GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Channel breakdown (2 cols) ─────────────────────────── */}
        <section className="lg:col-span-2 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--sigma-border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--sigma-text)]">Channels at a glance</h2>
              <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">Spend, results and return by channel</p>
            </div>
            <button onClick={() => navigate('/paid-ads')} className="text-xs font-medium text-[var(--sigma-primary)] flex items-center gap-1">
              Detail <ExternalLink size={12} />
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/60">
                {['Channel', 'Spend', 'Conversions', 'ROAS', 'Efficiency', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sigma-border)]">
              {channels.map(ch => {
                const statusIcon: Record<string, React.ReactNode> = {
                  OPTIMAL: <CheckCircle2 size={13} className="text-emerald-600" />,
                  SCALING: <Play size={13} className="text-sky-600" />,
                  GROWING: <TrendingUp size={13} className="text-amber-600" />,
                  REVIEW: <AlertTriangle size={13} className="text-amber-600" />,
                  PAUSED: <XCircle size={13} className="text-rose-600" />,
                };
                return (
                  <tr key={ch.name} className="hover:bg-[var(--sigma-surface-subtle)]/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--sigma-text)]">{ch.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--sigma-text-soft)]">{ch.spend > 0 ? formatCurrency(ch.spend) : '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--sigma-text-soft)]">{ch.conv}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-[var(--sigma-text)]">{ch.roas}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MiniBar value={ch.pct} />
                        <span className="text-[11px] font-mono text-[var(--sigma-text-muted)] w-7">{ch.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[ch.status]}
                        <span className="text-xs font-medium text-[var(--sigma-text-soft)]">{ch.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ── Right column: alerts + actions ─────────────────────── */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--sigma-text)] mb-4">What needs attention</h2>
            <div className="space-y-3">
              {alerts.map((alert, i) => {
                const icon = alert.level === 'ok' ? <CheckCircle2 size={14} className="text-emerald-600" />
                  : alert.level === 'warn' ? <AlertTriangle size={14} className="text-amber-600" />
                  : <XCircle size={14} className="text-rose-600" />;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">{icon}</span>
                    <p className="text-xs leading-relaxed text-[var(--sigma-text-soft)]">{alert.text}</p>
                  </div>
                );
              })}
            </div>
            {pendingCount > 0 && (
              <button
                onClick={() => navigate('/agents')}
                className="w-full mt-4 py-2.5 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-xs font-semibold text-[var(--sigma-text)] hover:bg-[var(--sigma-border)] transition-colors flex items-center justify-center gap-2"
              >
                <Activity size={13} />
                {pendingCount} approvals waiting
              </button>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--sigma-text)] mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New campaign', href: '/paid-ads', icon: <Zap size={14} /> },
                { label: 'Add connector', href: '/connectors', icon: <Globe size={14} /> },
                { label: 'Agent cockpit', href: '/agents', icon: <Activity size={14} /> },
                { label: 'Full reports', href: '/reports', icon: <TrendingUp size={14} /> },
              ].map(qa => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.href)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--sigma-border)] text-xs font-medium text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-colors"
                >
                  <span className="text-[var(--sigma-text-muted)]">{qa.icon}</span>
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
