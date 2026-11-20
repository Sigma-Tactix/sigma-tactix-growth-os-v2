/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dashboard variant B: Command Center
 */

import React, { useState } from 'react';
import { DollarSign, MousePointerClick, ShoppingCart, TrendingUp, Globe, ExternalLink, Download, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, AlertTriangle, XCircle, Play, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';

function DeltaIcon({ value }: { value: 'up' | 'down' | 'neutral' }) {
  if (value === 'up') return <ArrowUpRight size={13} className="text-emerald-600" />;
  if (value === 'down') return <ArrowDownRight size={13} className="text-rose-600" />;
  return <Minus size={13} className="text-[var(--sigma-text-muted)]" />;
}

function SparkLine({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <svg viewBox={`0 0 ${data.length * 8} 32`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="var(--sigma-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={data.map((v, i) => `${i * 8},${32 - ((v - min) / range) * 28}`).join(' ')}
      />
    </svg>
  );
}

const kpis = [
  { label: 'Ad spend', value: '$18,200', delta: { value: '+12.4%', trend: 'up' as const }, spark: [30, 45, 40, 55, 50, 65, 62, 78, 75, 88, 82, 100] as number[], icon: <DollarSign size={16} /> },
  { label: 'Clicks', value: '24,800', delta: { value: '+8.1%', trend: 'up' as const }, spark: [40, 55, 50, 60, 58, 72, 70, 80, 78, 85, 90, 100] as number[], icon: <MousePointerClick size={16} /> },
  { label: 'Conversions', value: '312', delta: { value: '+5.3%', trend: 'up' as const }, spark: [35, 42, 48, 45, 55, 60, 58, 68, 72, 78, 85, 100] as number[], icon: <ShoppingCart size={16} /> },
  { label: 'ROAS', value: '3.8x', delta: { value: '+0.4x', trend: 'up' as const }, spark: [60, 55, 65, 62, 70, 68, 75, 72, 80, 78, 85, 100] as number[], icon: <TrendingUp size={16} /> },
  { label: 'Visitors', value: '24,800', delta: { value: '+3.2%', trend: 'up' as const }, spark: [50, 55, 52, 60, 58, 65, 68, 70, 72, 75, 78, 100] as number[], icon: <Globe size={16} /> },
  { label: 'CPC', value: '$2.40', delta: { value: '-$0.15', trend: 'up' as const }, spark: [80, 78, 75, 72, 70, 68, 65, 62, 60, 58, 55, 100] as number[], icon: <MousePointerClick size={16} /> },
];

const channels = [
  { name: 'Google Ads', spend: 6400, conv: 138, roas: '4.1x', status: 'SCALING' as const },
  { name: 'Meta Ads', spend: 4600, conv: 95, roas: '3.6x', status: 'OPTIMAL' as const },
  { name: 'LinkedIn', spend: 2800, conv: 42, roas: '2.8x', status: 'SCALING' as const },
];

const statusIconMap: Record<string, React.ReactNode> = {
  OPTIMAL: <CheckCircle2 size={13} className="text-emerald-600" />,
  SCALING: <Play size={13} className="text-sky-600" />,
};

const alerts = [
  { level: 'warn' as const, text: 'LinkedIn CPC up 22% this week' },
  { level: 'ok' as const, text: 'Meta campaign within budget' },
  { level: 'error' as const, text: 'Google Ads connector needs re-auth' },
];

const quickActions = [
  { label: 'New campaign', href: '/paid-ads', icon: <Activity size={14} /> },
  { label: 'Agent cockpit', href: '/agents', icon: <Activity size={14} /> },
];

export default function DashboardCommandCenter() {
  const { currentWorkspace } = useWorkspace();
  const { pendingCount } = useActionQueue();
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.16em]">{currentWorkspace.name} &middot; B2B SaaS</p>
          <h1 className="text-2xl font-display font-bold text-[var(--sigma-text)] mt-1">Command Center</h1>
          <p className="text-xs text-[var(--sigma-text-muted)] mt-1">{format(new Date(), 'EEEE, MMM dd, yyyy')} · {format(new Date(), 'HH:mm')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--sigma-border)] p-0.5 bg-[var(--sigma-surface-subtle)]">
            {['Organic', 'Ads'].map(mode => (
              <button key={mode} className="px-3 py-1.5 rounded-lg text-xs font-medium">{mode}</button>
            ))}
          </div>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(v => !v)} icon={<Download size={13} />}>Export</Button>
            <AnimatePresence>
              {showExport && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] shadow-lg z-50 p-1.5">
                  {['PDF', 'XLSX', 'PPTX'].map(fmt => (
                    <button key={fmt} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--sigma-surface-subtle)]">{fmt}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] font-semibold">{kpi.label}</span>
              <span className="text-[var(--sigma-text-muted)]">{kpi.icon}</span>
            </div>
            <p className="text-lg font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <DeltaIcon value={kpi.delta.trend} />
              <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">{kpi.delta.value}</span>
            </div>
            <div className="mt-3"><SparkLine data={kpi.spark} /></div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--sigma-border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--sigma-text)]">Channels at a glance</h2>
              <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">Spend, results and return by channel</p>
            </div>
            <button className="text-xs font-medium text-[var(--sigma-primary)] flex items-center gap-1">Detail <ExternalLink size={12} /></button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/60">
                {['Channel', 'Spend', 'Conversions', 'ROAS', 'Efficiency', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sigma-border)]">
              {channels.map(ch => (
                <tr key={ch.name}>
                  <td className="px-4 py-3 text-sm font-medium">{ch.name}</td>
                  <td className="px-4 py-3 text-sm font-mono">${ch.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-mono">{ch.conv}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold">{ch.roas}</td>
                  <td className="px-4 py-3">
                    <div className="w-full h-1.5 rounded-full bg-[var(--sigma-border)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--sigma-primary)]" style={{ width: '75%' }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIconMap[ch.status]}
                      <span className="text-xs font-medium">{ch.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="space-y-6">
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
                    <p className="text-xs leading-relaxed">{alert.text}</p>
                  </div>
                );
              })}
            </div>
            {pendingCount > 0 && (
              <button className="w-full mt-4 py-2.5 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-xs font-semibold hover:bg-[var(--sigma-border)] transition-colors flex items-center justify-center gap-2">
                <Activity size={13} /> {pendingCount} approvals waiting
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
            <h2 className="text-sm font-semibold text-[var(--sigma-text)] mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(qa => (
                <button key={qa.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--sigma-border)] text-xs font-medium hover:bg-[var(--sigma-surface-subtle)] transition-colors">
                  <span className="text-[var(--sigma-text-muted)]">{qa.icon}</span> {qa.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
