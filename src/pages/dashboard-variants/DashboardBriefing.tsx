/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dashboard variant A: Daily Briefing
 */

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ExternalLink, ChevronDown, Download, ShoppingCart, TrendingUp, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';
import { GlassCard } from '@/src/components/ui';

function TrendIcon({ value }: { value: 'up' | 'down' | 'neutral' }) {
  if (value === 'up') return <ArrowUpRight size={14} className="text-emerald-600" />;
  if (value === 'down') return <ArrowDownRight size={14} className="text-rose-600" />;
  return <Minus size={14} className="text-[var(--sigma-text-muted)]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--sigma-text-muted)] font-semibold">
      {children}
    </span>
  );
}

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

export default function DashboardBriefing() {
  const { currentWorkspace } = useWorkspace();
  const { pendingCount } = useActionQueue();
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-10 pb-20 max-w-[1200px]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.18em] mb-1.5">
            {currentWorkspace.name} &middot; B2B SaaS
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--sigma-text)]">
            Ad spend this quarter
          </h1>
          <p className="text-sm text-[var(--sigma-text-muted)] mt-1.5">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')} &middot; last updated {format(new Date(), 'HH:mm')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-[var(--sigma-border)] p-0.5 bg-[var(--sigma-surface-subtle)]">
            {['Organic', 'Ads'].map(mode => (
              <button key={mode} className="px-3 py-1.5 rounded-lg text-xs font-medium">{mode}</button>
            ))}
          </div>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(v => !v)} icon={<Download size={13} />}>Export</Button>
            <AnimatePresence>
              {showExport && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] shadow-lg z-50 p-1.5">
                  {['PDF', 'XLSX', 'PPTX'].map(fmt => (
                    <button key={fmt} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--sigma-surface-subtle)]">{fmt}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-6 sm:p-8">
          <p className="text-xs font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.14em] mb-2">Ad spend this quarter</p>
          <p className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-[var(--sigma-text)]">$18,420</p>
        </div>
        <StatCard label="Conversions" value="312" delta={{ value: '+5.3%', trend: 'up' }} icon={<ShoppingCart size={16} />} />
        <StatCard label="Return on ad spend" value="3.8x" delta={{ value: 'Above 3x target', trend: 'up' }} icon={<TrendingUp size={16} />} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionLabel>How each channel performed</SectionLabel>
            <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1">Channel performance</h2>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/60">
                {['Channel', 'CVR', 'ROAS', 'CPC', 'Budget', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sigma-border)]">
              {[
                { name: 'Google Ads', cvr: '4.2%', roas: '4.1x', cpc: '$2.40', share: '35%', status: 'SCALING' },
                { name: 'Meta Ads', cvr: '3.8%', roas: '3.6x', cpc: '$1.85', share: '25%', status: 'OPTIMAL' },
              ].map(ch => (
                <tr key={ch.name}>
                  <td className="px-5 py-3.5 text-sm font-medium">{ch.name}</td>
                  <td className="px-5 py-3.5 text-sm font-mono">{ch.cvr}</td>
                  <td className="px-5 py-3.5 text-sm font-mono font-semibold">{ch.roas}</td>
                  <td className="px-5 py-3.5 text-sm font-mono">{ch.cpc}</td>
                  <td className="px-5 py-3.5 text-sm font-mono">{ch.share}</td>
                  <td className="px-5 py-3.5"><span className="text-xs font-semibold">{ch.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionLabel>Spend trend</SectionLabel>
        <div className="mt-3 rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <div className="flex items-center gap-4 text-xs text-[var(--sigma-text-muted)] mb-4">
            <span>This quarter</span>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {[38, 52, 47, 65, 58, 78, 82, 71, 90, 88, 95, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-[var(--sigma-primary)]/80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--sigma-text-muted)]">
            <span>W1</span><span>W4</span><span>W8</span><span>W12</span>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>What needs attention</SectionLabel>
        <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1 mb-4">Your action list</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="w-full text-left rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--sigma-text)]">Review 3 pending approvals</p>
            <p className="text-xs text-[var(--sigma-text-muted)] mt-1">Agent runs waiting for your sign-off.</p>
            <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[var(--sigma-primary)]">Review now <ArrowUpRight size={12} /></span>
          </button>
        </div>
      </section>

      <section>
        <SectionLabel>Inbound leads</SectionLabel>
        <h2 className="text-lg font-semibold text-[var(--sigma-text)] mt-1 mb-4">Lead intake trend</h2>
        <GlassCard className="p-5"><p className="text-xs text-[var(--sigma-text-muted)]">Lead intake chart placeholder</p></GlassCard>
      </section>
    </div>
  );
}
