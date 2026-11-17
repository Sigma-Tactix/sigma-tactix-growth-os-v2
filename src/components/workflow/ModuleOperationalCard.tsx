import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Database,
  Play,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { SuiteModule } from '@/src/data/suiteHubConfig';
import { getLifecycleStage } from '@/src/data/marketingWorkflowSequence';
import { cn } from '@/src/lib/utils';

interface ModuleOperationalCardProps {
  module: SuiteModule;
  onExecutePrimary?: () => void;
  className?: string;
}

export default function ModuleOperationalCard({
  module,
  onExecutePrimary,
  className,
}: ModuleOperationalCardProps) {
  const navigate = useNavigate();
  const stage = getLifecycleStage(module.lifecycleStage);

  return (
    <article
      className={cn(
        'sigma-card rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5 shadow-sm',
        className
      )}
      aria-label={`Operational Blueprint for ${module.label}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--sigma-border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-[var(--sigma-primary)]">
            <module.icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--sigma-text)]">{module.label}</h2>
              {module.badge && (
                <span className="rounded-md border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--sigma-text-muted)]">
                  {module.badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[var(--sigma-text-soft)]">{module.description}</p>
          </div>
        </div>

        {/* Operational Status & Lifecycle Tag */}
        <div className="flex items-center gap-2">
          {stage && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <stage.icon size={12} />
              {stage.shortLabel}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold font-mono',
              module.status === 'Ready' || module.status === 'Configured'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            )}
          >
            {module.status === 'Ready' || module.status === 'Configured' ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : (
              <AlertCircle size={12} className="text-amber-400" />
            )}
            Status: {module.status}
          </span>
        </div>
      </div>

      {/* 6 Core Operational Dimensions (S14-A2) */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Dimension 1: Purpose */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <Compass size={13} className="text-amber-400" />
            <span>1. PURPOSE</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{module.purpose}</p>
        </div>

        {/* Dimension 2: Input */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <Database size={13} className="text-sky-400" />
            <span>2. INPUT</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{module.input}</p>
        </div>

        {/* Dimension 3: Output */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <FileCheck2 size={13} className="text-emerald-400" />
            <span>3. OUTPUT</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{module.output}</p>
        </div>

        {/* Dimension 4: Main Action */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <Play size={13} className="text-violet-400" />
            <span>4. MAIN ACTION</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-zinc-200">{module.mainAction}</p>
          {onExecutePrimary && (
            <button
              type="button"
              onClick={onExecutePrimary}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/25"
            >
              <Play size={11} />
              <span>Trigger Action</span>
            </button>
          )}
        </div>

        {/* Dimension 5: Operational Status */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>5. OPERATIONAL STATUS</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-300">
            {module.status === 'Ready'
              ? 'All required runtime dependencies, schemas, and policies are verified.'
              : 'Requires connector authentication or active API grant before production live dispatch.'}
          </p>
        </div>

        {/* Dimension 6: Next Step */}
        <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--sigma-text-muted)]">
            <ArrowRight size={13} className="text-amber-400" />
            <span>6. NEXT STEP</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{module.nextStep}</p>
        </div>
      </div>
    </article>
  );
}
