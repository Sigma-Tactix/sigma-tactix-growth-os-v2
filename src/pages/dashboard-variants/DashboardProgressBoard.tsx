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
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Users,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { cn, formatCurrency, formatNumber } from '@/src/lib/utils';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useActionQueue } from '@/src/lib/actionQueueStore';
import { INDUSTRY_REPORT_FORMATS, ReportColorProfile, COLOR_PROFILES } from '@/src/data/industryReportFormats';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/src/components/ui/Button';
import { GlassCard, Badge } from '@/src/components/ui';

// ─── helpers ───────────────────────────────────────────────────────────────

function DeltaIcon({ value }: { value: 'up' | 'down' | 'neutral' }) {
  if (value === 'up') return <ArrowUpRight size={14} className="text-emerald-600" />;
  if (value === 'down') return <ArrowDownRight size={14} className="text-rose-600" />;
  return <Minus size={14} className="text-[var(--sigma-text-muted)]" />;
}

const months = useMemo(() => {
  const out: string[] = [];
  for (let i = 11; i >= 0; i--) out.push(format(subMonths(new Date(), i), 'MMM'));
  return out;
}, []);

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

// ─── main ──────────────────────────────────────────────────────────────────

/**
 * Dashboard variant C: "Progress Board"
 *
 * A single-page narrative that answers three questions:
 *   1. Where are we now? (top-line metrics)
 *   2. What's the story? (monthly trend with narrative annotations)
 *   3. What should we do about it? (prioritized recommendations)
 *
 * Designed for weekly reviews with clients or stakeholders — readable without
 * any training, no internal jargon, just plain numbers and clear next steps.
 */
export default function DashboardProgressBoard() {
  const { currentWorkspace } = useWorkspace();
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

  // ─── mock data ─────────────────────────────────────────────────────
  const monthlySpend = useMemo(() => [12, 14, 13, 16, 15, 18, 17, 19, 21, 20, 22, 25], []);
  const monthlyConversions = useMemo(() => [180, 195, 200, 220, 230, 250, 245, 270, 285, 290, 300, 312], []);

  const storyCards = useMemo(() => [
    {
      month: 'December',
      title: 'Finished strong',
      description: 'Spend increased 14% over November. The new ad creatives launched mid-month started delivering better click-through rates, especially on mobile.',
      highlight: 'Best ROAS of the quarter at 4.2x',
    },
    {
      month: 'November',
      title: 'Testing new approaches',
      description: 'We tried three new audience segments. Two showed promise — one underperformed and was paused within a week.',
      highlight: 'LinkedIn leads up 18%',
    },
    {
      month: 'October',
      title: 'Steady growth',
      description: 'No major changes this month. The campaigns we had running continued to perform consistently without extra spend.',
      highlight: 'CPC dropped 8%',
    },
  ], []);

  const recommendations = useMemo(() => [
    {
      priority: 'high',
      title: 'Reallocate budget to the best-performing channel',
      description: 'Google Ads is delivering your best ROAS right now. Consider moving 10-15% of your Meta budget there.',
      impact: 'Could improve overall ROAS by ~0.3x',
    },
    {
      priority: 'high',
      title: 'Fix the Google Ads connection',
      description: 'Your Google Ads connector needs to be re-authorized. Without it, you\'re missing real-time data from your biggest channel.',
      impact: 'Restores full reporting accuracy',
    },
    {
      priority: 'medium',
      title: 'Try the new TikTok Ads connector',
      description: 'TikTok Ads is now available as a connector. It could open up a new audience, especially if your customers are under 35.',
      impact: 'New channel, untapped potential',
    },
  ], []);

  // ─── render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-10 pb-20 max-w-[960px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="text-center pt-2 pb-6">
        <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-[0.18em] mb-2">
          {currentWorkspace.name} · {industry.name}
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--sigma-text)]">
          Progress board
        </h1>
        <p className="text-sm text-[var(--sigma-text-muted)] mt-3 max-w-lg mx-auto leading-relaxed">
          A simple look at where your marketing stands, what's driving results, and the
          clearest next steps for this week.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
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

      {/* ── A. TOP NUMBERS ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BigStat label="Total spend" value={formatCurrency(18200)} delta="+12%" trend="up" />
        <BigStat label="Conversions" value={formatNumber(312)} delta="+5.3%" trend="up" />
        <BigStat label="Return on spend" value="3.8x" delta="+0.4x" trend="up" />
        <BigStat label="Active channels" value="5" delta="All connected" trend="neutral" />
      </section>

      {/* ── B. THE STORY ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)]">
            <BarChart3 size={16} />
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--sigma-text)]">What happened this quarter</h2>
            <p className="text-xs text-[var(--sigma-text-muted)]">Month by month</p>
          </div>
        </div>

        {/* Year bar chart */}
        <GlassCard className="p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-[var(--sigma-text-muted)] uppercase tracking-wider font-semibold">
              Ad spend over the last 12 months
            </p>
            <p className="text-xs text-[var(--sigma-text-muted)]">Monthly totals</p>
          </div>
          <MonthBarChart data={monthlySpend} />
          <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--sigma-text-muted)]">
            {months.map((m, i) => (
              <span key={m} className={cn(i === months.length - 1 && 'text-[var(--sigma-text)] font-semibold')}>{m}</span>
            ))}
          </div>
        </GlassCard>

        {/* Story cards */}
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
                  <p className="text-sm text-[var(--sigma-text-soft)] leading-relaxed mb-3">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--sigma-primary)]/10 text-xs font-medium text-[var(--sigma-primary)]">
                    <CheckCircle2 size={12} />
                    {card.highlight}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── C. RECOMMENDATIONS ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)]">
            <Lightbulb size={16} />
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--sigma-text)]">What to do next</h2>
            <p className="text-xs text-[var(--sigma-text-muted)]">Sorted by what matters most right now</p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const borderColors: Record<string, string> = {
              high: 'border-l-rose-accent',
              medium: 'border-l-amber-accent',
              low: 'border-l-emerald-accent',
            };
            const bgColors: Record<string, string> = {
              high: 'bg-rose-500/5',
              medium: 'bg-amber-500/5',
              low: 'bg-emerald-500/5',
            };
            return (
              <div
                key={i}
                className={cn('rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5 border-l-2', borderColors[rec.priority], bgColors[rec.priority])}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold',
                        rec.priority === 'high' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600'
                      )}>
                        {rec.priority}
                      </span>
                      <h3 className="text-sm font-semibold text-[var(--sigma-text)]">{rec.title}</h3>
                    </div>
                    <p className="text-xs text-[var(--sigma-text-soft)] leading-relaxed mb-2">
                      {rec.description}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--sigma-text-muted)]">
                      Expected result: {rec.impact}
                    </p>
                  </div>
                  {i === 1 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/connectors')}
                      className="shrink-0"
                    >
                      Fix now
                    </Button>
                  )}
                  {i === 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/paid-ads')}
                      className="shrink-0"
                    >
                      View campaigns
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function BigStat({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5">
      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[var(--sigma-text-muted)] font-semibold mb-2">{label}</p>
      <p className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--sigma-text)] leading-none">{value}</p>
      <div className="flex items-center gap-1.5 mt-3">
        <DeltaIcon value={trend} />
        <span className="text-xs font-mono text-[var(--sigma-text-muted)]">{delta}</span>
      </div>
    </div>
  );
}
