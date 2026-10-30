import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ChatBlock } from '@/src/lib/chatBlocks';

/**
 * Presentational renderers for agent-emitted chat blocks (controlled generative
 * UI). Each degrades to its textual fallback when the shape is incomplete, so a
 * malformed block can never break the chat message.
 */

const statusIcon = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  bad: XCircle,
  idle: Minus,
} as const;

const statusColor = {
  ok: 'text-[var(--sigma-accent-emerald)]',
  warn: 'text-[var(--sigma-accent-amber)]',
  bad: 'text-[var(--sigma-accent-rose)]',
  idle: 'text-[var(--sigma-text-muted)]',
} as const;

function BlockShell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/50 overflow-hidden">
      {title && (
        <div className="px-3.5 py-2 border-b border-[var(--sigma-border)] text-[11px] font-semibold font-mono uppercase tracking-wider text-[var(--sigma-text-muted)]">
          {title}
        </div>
      )}
      <div className="p-3.5">{children}</div>
    </div>
  );
}

export function StepsBlock({ block }: { block: ChatBlock }) {
  if (!block.items || block.items.length === 0) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  return (
    <BlockShell title={block.title}>
      <ol className="space-y-2.5">
        {block.items.map((item, i) => {
          const isObj = typeof item !== 'string';
          const label = isObj ? item.label : item;
          const detail = isObj ? item.detail : undefined;
          const status = isObj ? item.status : undefined;
          return (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--sigma-primary-subtle)] text-[10px] font-mono font-bold text-[var(--sigma-accent)]">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 text-xs text-[var(--sigma-text-soft)]">
                <span className="font-medium text-[var(--sigma-text)]">{label}</span>
                {detail && <span className="block text-[11px] text-[var(--sigma-text-muted)] mt-0.5">{detail}</span>}
                {status && status !== 'idle' && (
                  <span className={cn('mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono', statusColor[status])}>
                    {React.createElement(statusIcon[status], { size: 11 })} {status.toUpperCase()}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </BlockShell>
  );
}

export function MetricsBlock({ block }: { block: ChatBlock }) {
  if (!block.values || block.values.length === 0) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;
  return (
    <BlockShell title={block.title}>
      <div className="grid grid-cols-2 gap-2.5">
        {block.values.map((v, i) => {
          const Icon = trendIcon[v.trend ?? 'flat'];
          return (
            <div key={i} className="rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)]">{v.label}</div>
              <div className="mt-0.5 text-lg font-mono font-bold text-[var(--sigma-text)] tabular-nums">{v.value}</div>
              {v.delta && (
                <div className={cn('mt-0.5 flex items-center gap-1 text-[10px] font-mono', v.trend === 'down' ? 'text-[var(--sigma-accent-rose)]' : v.trend === 'up' ? 'text-[var(--sigma-accent-emerald)]' : 'text-[var(--sigma-text-muted)]')}>
                  <Icon size={11} /> {v.delta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BlockShell>
  );
}

const calloutTone = {
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/10 text-[var(--sigma-text-soft)]', accent: 'text-[var(--sigma-accent-cyan)]' },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/30 bg-amber-500/10 text-[var(--sigma-text-soft)]', accent: 'text-[var(--sigma-accent-amber)]' },
  success: { icon: CheckCircle2, cls: 'border-emerald-500/30 bg-emerald-500/10 text-[var(--sigma-text-soft)]', accent: 'text-[var(--sigma-accent-emerald)]' },
  danger: { icon: XCircle, cls: 'border-rose-500/30 bg-rose-500/10 text-[var(--sigma-text-soft)]', accent: 'text-[var(--sigma-accent-rose)]' },
} as const;

export function CalloutBlock({ block }: { block: ChatBlock }) {
  if (!block.body) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  const tone = calloutTone[block.tone ?? 'info'];
  const Icon = tone.icon;
  return (
    <div className={cn('rounded-xl border p-3.5 text-xs leading-relaxed', tone.cls)}>
      <div className={cn('mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold font-mono uppercase tracking-wider', tone.accent)}>
        <Icon size={13} /> {block.title ?? block.tone}
      </div>
      <p>{block.body}</p>
    </div>
  );
}

export function KvBlock({ block }: { block: ChatBlock }) {
  if (!block.items || block.items.length === 0) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  return (
    <BlockShell title={block.title}>
      <dl className="divide-y divide-[var(--sigma-border)]">
        {block.items.map((item, i) => {
          const isObj = typeof item !== 'string';
          return (
            <div key={i} className="flex items-center justify-between gap-4 py-1.5 text-xs">
              <dt className="text-[var(--sigma-text-muted)]">{isObj ? item.label : item}</dt>
              {isObj && item.detail && <dd className="text-[var(--sigma-text-soft)] font-mono">{item.detail}</dd>}
            </div>
          );
        })}
      </dl>
    </BlockShell>
  );
}

export function ComparisonBlock({ block }: { block: ChatBlock }) {
  if (!block.columns || !block.rows || block.columns.length === 0) {
    return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  }
  return (
    <BlockShell title={block.title}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {block.columns.map((c, i) => (
              <th key={i} className="py-1.5 px-2 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--sigma-text-muted)]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.filter(Boolean).map((row, r) => (
            <tr key={r} className="border-t border-[var(--sigma-border)]">
              {row.map((cell, c) => (
                <td key={c} className={cn('py-1.5 px-2', c === 0 ? 'text-[var(--sigma-text)] font-medium' : 'text-[var(--sigma-text-soft)] font-mono')}>
                  {cell ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </BlockShell>
  );
}

export function TimelineBlock({ block }: { block: ChatBlock }) {
  if (!block.items || block.items.length === 0) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  return (
    <BlockShell title={block.title}>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-[var(--sigma-border-strong)]" />
        <div className="space-y-2.5">
          {block.items.map((item, i) => {
            const label = typeof item === 'string' ? item : item.label;
            const detail = typeof item === 'string' ? undefined : item.detail;
            return (
              <div key={i} className="relative">
                <span className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-[var(--sigma-primary)] ring-2 ring-[var(--sigma-surface)]" />
                <div className="text-xs font-medium text-[var(--sigma-text)]">{label}</div>
                {detail && <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">{detail}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </BlockShell>
  );
}

export function ListBlock({ block }: { block: ChatBlock }) {
  if (!block.items || block.items.length === 0) return <pre className="text-[11px] whitespace-pre-wrap">{block.fallback}</pre>;
  return (
    <BlockShell title={block.title}>
      <ul className="space-y-1.5">
        {block.items.map((item, i) => {
          const label = typeof item === 'string' ? item : item.label;
          const detail = typeof item === 'string' ? undefined : item.detail;
          const status = typeof item === 'string' ? undefined : item.status;
          return (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--sigma-text-soft)]">
              <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', status === 'ok' ? 'bg-[var(--sigma-accent-emerald)]' : status === 'bad' ? 'bg-[var(--sigma-accent-rose)]' : status === 'warn' ? 'bg-[var(--sigma-accent-amber)]' : 'bg-[var(--sigma-text-muted)]')} />
              <span>
                <span className="text-[var(--sigma-text)]">{label}</span>
                {detail && <span className="text-[var(--sigma-text-muted)]"> — {detail}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </BlockShell>
  );
}

/** Dispatch a single parsed block to its renderer. */
export function ChatBlockView({ block, className }: { block: ChatBlock; className?: string }) {
  const view = {
    steps: <StepsBlock block={block} />,
    metrics: <MetricsBlock block={block} />,
    callout: <CalloutBlock block={block} />,
    kv: <KvBlock block={block} />,
    comparison: <ComparisonBlock block={block} />,
    timeline: <TimelineBlock block={block} />,
    list: <ListBlock block={block} />,
  }[block.type];
  return <div className={cn('my-2', className)}>{view}</div>;
}

export default ChatBlockView;
