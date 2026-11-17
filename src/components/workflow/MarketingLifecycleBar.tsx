import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  MARKETING_LIFECYCLE_STAGES,
  type LifecycleStageId,
  type LifecycleStage,
} from '@/src/data/marketingWorkflowSequence';
import { cn } from '@/src/lib/utils';

interface MarketingLifecycleBarProps {
  activeStageId?: LifecycleStageId;
  onSelectStage?: (stageId: LifecycleStageId) => void;
  compact?: boolean;
}

export default function MarketingLifecycleBar({
  activeStageId = 'create',
  onSelectStage,
  compact = false,
}: MarketingLifecycleBarProps) {
  const navigate = useNavigate();

  const handleStageClick = (stage: LifecycleStage) => {
    if (onSelectStage) {
      onSelectStage(stage.id);
    } else {
      navigate(stage.primaryRoute);
    }
  };

  const currentStage = MARKETING_LIFECYCLE_STAGES.find((s) => s.id === activeStageId) || MARKETING_LIFECYCLE_STAGES[3];

  return (
    <section
      className="sigma-card rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-4 shadow-sm"
      aria-label="Client Marketing Workflow Sequence"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--sigma-primary)]">
              Marketing Lifecycle
            </span>
            <span className="text-xs text-[var(--sigma-text-muted)]">Sequential Delivery Pipeline</span>
          </div>
          <p className="mt-1 text-xs text-[var(--sigma-text-soft)]">
            Every client deliverable advances strictly through the 8-stage governed lifecycle.
          </p>
        </div>

        {/* Current Active Stage Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--sigma-text-muted)]">Active Stage:</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-300">
            <currentStage.icon size={13} className="text-amber-400" />
            {currentStage.label}
          </span>
        </div>
      </div>

      {/* Connected 8-Stage Progress Sequence */}
      <div className="mt-4 overflow-x-auto pb-1">
        <ol className="flex min-w-[760px] items-center gap-1.5" role="list">
          {MARKETING_LIFECYCLE_STAGES.map((stage, idx) => {
            const isActive = stage.id === activeStageId;
            const isPast = stage.order < currentStage.order;
            const Icon = stage.icon;

            return (
              <React.Fragment key={stage.id}>
                <li className="flex-1">
                  <button
                    type="button"
                    onClick={() => handleStageClick(stage)}
                    className={cn(
                      'group flex w-full flex-col rounded-xl border p-2.5 text-left transition-all',
                      isActive
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                        : isPast
                        ? 'border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] hover:border-zinc-600'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                    )}
                    aria-current={isActive ? 'step' : undefined}
                    title={`${stage.label}: ${stage.tagline}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-mono font-bold',
                          isActive
                            ? 'bg-amber-400 text-black'
                            : isPast
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-zinc-900 text-zinc-500'
                        )}
                      >
                        {isPast ? <CheckCircle2 size={12} className="text-emerald-400" /> : stage.order}
                      </span>
                      <Icon
                        size={13}
                        className={cn(
                          isActive ? 'text-amber-400' : isPast ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'mt-1.5 truncate text-xs font-semibold',
                        isActive ? 'text-amber-200' : isPast ? 'text-zinc-200' : 'text-zinc-400'
                      )}
                    >
                      {stage.shortLabel}
                    </span>
                  </button>
                </li>
                {idx < MARKETING_LIFECYCLE_STAGES.length - 1 && (
                  <ChevronRight size={13} className="shrink-0 text-zinc-600" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>

      {/* Active Stage Blueprint Deliverables */}
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3.5 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[var(--sigma-text-muted)]">
              Stage {currentStage.order} Deliverables:
            </span>
            {currentStage.deliverables.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--sigma-border)] bg-[var(--sigma-surface)] px-2 py-0.5 text-zinc-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {item}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(currentStage.primaryRoute)}
            className="inline-flex items-center gap-1.5 font-medium text-amber-400 hover:text-amber-300 hover:underline"
          >
            <span>Open {currentStage.shortLabel} Workspace</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </section>
  );
}
