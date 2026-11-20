/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dashboard variant C: Progress Board
 */

import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';
import { GlassCard } from '@/src/components/ui';
import { Download } from 'lucide-react';

const months = (() => {
  const out: string[] = [];
  for (let i = 11; i >= 0; i--) out.push(format(subMonths(new Date(), i), 'MMM'));
  return out;
})();

function MonthBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((v, i) => {
        const h = Math.round((v / max) * 100);
        const isCurrent = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-full rounded-t-md transition-colors',
                isCurrent ? 'bg-[var(--sigma-primary)]' : 'bg-[var(--sigma-primary)]/40 hover:bg-[var(--sigma-primary)]/70'
              )}
              style={{ height: `${h}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

const storyCards = [
  { month: 'December', title: 'Finished strong', description: 'Spend increased 14% over November. The new ad creatives launched mid-month started delivering better click-through rates, especially on mobile.', highlight: 'Best ROAS of the quarter at 4.2x' },
  { month: 'November', title: 'Testing new approaches', description: 'We tried three new audience segments. Two showed promise — one underperformed and was paused within a week.', highlight: 'LinkedIn leads up 18%' },
  { month: 'October', title: 'Steady growth', description: 'No major changes this month. The campaigns we had running continued to perform consistently without extra spend.', highlight: 'CPC dropped 8%' },
];

const recommendations = [
  { priority: 'high' as const, title: 'Reallocate budget to the best-performing channel', description: 'Google Ads is delivering your best ROAS right now. Consider moving 10-15% of your Meta budget there.', impact: 'Could improve overall ROAS by ~0.3x' },
  { priority: 'high' as const, title: 'Fix the Google Ads connection', description: 'Your Google Ads connector needs to be re-authorized. Without it, you\'re missing real-time data from your biggest channel.', impact: 'Restores full reporting accuracy' },
  { priority: 'medium' as const, title: 'Try the new TikTok Ads connector', description: 'TikTok Ads is now available as a connector. It could open up a new audience, especially if your customers are under 35.', impact: 'New channel, untapped potential' },
];

export default function DashboardProgressBoard() {
  const { currentWorkspace } = useWorkspace();
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-10 pb-20 max-w-[960px] mx-auto">
      <header className="text-center pt-2 pb-6">
        <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.18em] mb-2">
          {currentWorkspace.name} &middot; B2B SaaS
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--sigma-text)]">
          Progress board
        </h1>
        <p className="text-sm text-[var(--sigma-text-muted)] mt-3 max-w-lg mx-auto leading-relaxed">
          A simple look at where your marketing stands, what&apos;s driving results, and the clearest next steps for this week.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
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

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--sigma-text-muted)] font-semibold mb-2">Total spend</p>
          <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">$18,200</p>
        </div>
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--sigma-text-muted)] font-semibold mb-2">Conversions</p>
          <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">312</p>
        </div>
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--sigma-text-muted)] font-semibold mb-2">Return on spend</p>
          <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">3.8x</p>
        </div>
        <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--sigma-text-muted)] font-semibold mb-2">Active channels</p>
          <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">5</p>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-9"/></svg>
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--sigma-text)]">What happened this quarter</h2>
            <p className="text-xs text-[var(--sigma-text-muted)]">Month by month</p>
          </div>
        </div>

        <GlassCard className="p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-[var(--sigma-text-muted)] uppercase tracking-wider font-semibold">Ad spend over the last 12 months</p>
            <p className="text-xs text-[var(--sigma-text-muted)]">Monthly totals</p>
          </div>
          <MonthBarChart data={[12, 14, 13, 16, 15, 18, 17, 19, 21, 20, 22, 25]} />
          <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--sigma-text-muted)]">
            {months.map((m, i) => (
              <span key={m} className={cn(i === months.length - 1 && 'text-[var(--sigma-text)] font-semibold')}>{m}</span>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {storyCards.map((card, i) => (
            <GlassCard key={i} className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex flex-col items-center pt-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--sigma-primary)]" />
                  {i < storyCards.length - 1 && <span className="w-px flex-1 bg-[var(--sigma-border)] mt-2" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-[var(--sigma-text)]">{card.title}</h3>
                    <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">{card.month}</span>
                  </div>
                  <p className="text-sm text-[var(--sigma-text-soft)] leading-relaxed mb-3">{card.description}</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--sigma-primary)]/10 text-xs font-medium text-[var(--sigma-primary)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {card.highlight}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--sigma-text)]">What to do next</h2>
            <p className="text-xs text-[var(--sigma-text-muted)]">Sorted by what matters most right now</p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5 border-l-2',
                rec.priority === 'high' ? 'border-l-rose-accent' : 'border-l-amber-accent'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold',
                      rec.priority === 'high' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600'
                    )}>{rec.priority}</span>
                    <h3 className="text-sm font-semibold text-[var(--sigma-text)]">{rec.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed mb-2">{rec.description}</p>
                  <p className="text-[11px] font-mono text-[var(--sigma-text-muted)]">Expected result: {rec.impact}</p>
                </div>
                {i === 1 && (
                  <Button variant="primary" size="sm" onClick={() => {}} className="shrink-0">Fix now</Button>
                )}
                {i === 0 && (
                  <Button variant="secondary" size="sm" onClick={() => {}} className="shrink-0">View campaigns</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
