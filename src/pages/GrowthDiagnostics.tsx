import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/src/lib/api';
import { buildGrowthStrategies } from '@/src/lib/growthStrategy';
import { claimLabel, claimToneBadge, formatAuditScoreLine, AI_DISCLOSURE_LINE } from '@/src/lib/claimLabels';
import { useToast } from '@/src/contexts/ToastContext';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useTaskStore } from '@/src/lib/taskStore';
import { Badge, Button, GlassCard } from '@/src/components/ui';
import type {
  AgentTask,
  GrowthAudit,
  GrowthCapabilitySnapshot,
  GrowthStrategyTask,
} from '@/src/types';

type TaskStatusMap = Record<string, GrowthStrategyTask['status']>;

function cleanDomain(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim();
}

function auditSourceLabel(audit: GrowthAudit): string {
  if (audit.findings.length === 0) return 'No diagnostic evidence yet';
  if (audit.evidenceMode === 'heuristic') return 'Heuristic findings - verify before execution';
  const liveCount = audit.findings.filter(finding => finding.dataSource === 'live').length;
  if (liveCount === audit.findings.length) return `${liveCount} site-backed findings`;
  if (liveCount > 0) return `${liveCount} site-backed, ${audit.findings.length - liveCount} readiness-only`;
  return 'Heuristic findings - verify before execution';
}

function taskStatusFromLedger(task?: AgentTask): GrowthStrategyTask['status'] {
  if (!task) return 'recommended';
  if (task.status === 'Pending Approval') return 'pending-approval';
  if (task.status === 'Running') return 'running';
  if (task.status === 'Success') return 'completed';
  return 'failed';
}

export default function GrowthDiagnostics() {
  const { currentWorkspace, currentWorkspaceId } = useWorkspace();
  const { notifyInfo, notifySuccess } = useToast();
  const { queueTask: queueSharedTask } = useTaskStore(currentWorkspace?.id || currentWorkspaceId || 'ws-primary');
  const initialDomain = cleanDomain(currentWorkspace?.domain || '') || 'sigmatactix.com';
  const [domain, setDomain] = useState(initialDomain);
  const [audit, setAudit] = useState<GrowthAudit | null>(null);
  const [capabilities, setCapabilities] = useState<GrowthCapabilitySnapshot[]>([]);
  const [ledger, setLedger] = useState<AgentTask[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [queueingStrategyId, setQueueingStrategyId] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  useEffect(() => {
    setDomain(initialDomain);
  }, [initialDomain]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      const [workspaceResult, capabilityResult] = await Promise.allSettled([
        apiFetch('/api/workspace'),
        apiFetch('/api/workspace/capabilities'),
      ]);
      if (!active) return;

      if (workspaceResult.status === 'fulfilled' && workspaceResult.value.ok) {
        const workspace = await workspaceResult.value.json();
        const existingAudit = workspace?.growthAudit as GrowthAudit | undefined;
        if (existingAudit?.status === 'completed') {
          setAudit(existingAudit);
          setDomain(cleanDomain(existingAudit.domain || initialDomain));
        }
        setLedger(Array.isArray(workspace?.agentTasks) ? workspace.agentTasks : []);
      }
      if (capabilityResult.status === 'fulfilled' && capabilityResult.value.ok) {
        const registry = await capabilityResult.value.json();
        setCapabilities(Array.isArray(registry?.capabilities) ? registry.capabilities : []);
      }
      setIsLoading(false);
    };
    load().catch(() => setIsLoading(false));
    return () => { active = false; };
  }, [currentWorkspace.id, initialDomain]);

  const strategies = useMemo(() => {
    if (!audit) return [];
    return buildGrowthStrategies(audit, capabilities);
  }, [audit, capabilities]);

  useEffect(() => {
    if (strategies.length > 0 && !strategies.some(strategy => strategy.id === selectedStrategyId)) {
      setSelectedStrategyId(strategies[0].id);
    }

    const nextStatuses: TaskStatusMap = {};
    for (const strategy of strategies) {
      for (const task of strategy.tasks) {
        const ledgerTask = ledger.find(item => item.goal.includes(`[Task ${task.id}]`));
        nextStatuses[task.id] = taskStatusFromLedger(ledgerTask);
      }
    }
    setTaskStatuses(current => ({ ...current, ...nextStatuses }));
  }, [strategies, ledger, selectedStrategyId]);

  const selectedStrategy = strategies.find(strategy => strategy.id === selectedStrategyId) || strategies[0];
  const topFinding = audit?.findings.slice().sort((a, b) => b.impactPct - a.impactPct)[0];
  const topClaim = claimLabel(topFinding?.claimClassification);
  const pendingCount = Object.values(taskStatuses).filter(status => status === 'pending-approval').length;

  const runDiagnostic = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = cleanDomain(domain);
    if (!target) return;
    setIsRunning(true);
    try {
      const response = await apiFetch('/api/workspace/run-diagnostic', {
        method: 'POST',
        body: JSON.stringify({ domain: target }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Diagnostic could not be completed.');
      setAudit(payload.growthAudit);
      setDomain(cleanDomain(payload.growthAudit?.domain || target));
      setSelectedStrategyId(null);
      setTaskStatuses({});
      notifySuccess('Diagnostic complete', 'Strategy recommendations and governed agent tasks are ready.');
    } catch (error: any) {
      notifyInfo('Diagnostic unavailable', error.message || 'Check the domain and try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const queueStrategy = async () => {
    if (!selectedStrategy) return;
    setQueueingStrategyId(selectedStrategy.id);
    let queued = 0;
    try {
      for (const task of selectedStrategy.tasks) {
        if (taskStatuses[task.id] === 'pending-approval' || taskStatuses[task.id] === 'completed') continue;
        setTaskStatuses(current => ({ ...current, [task.id]: 'queuing' }));
        const result = await queueSharedTask({
          agentName: task.agentName,
          moduleKey: 'growth',
          goal: `[Strategy ${selectedStrategy.id}] [Task ${task.id}] ${task.title}. ${task.objective}`,
        });
        if (!result.success) {
          setTaskStatuses(current => ({ ...current, [task.id]: 'failed' }));
          throw new Error(result.error || `Could not queue ${task.title}.`);
        }
        queued += 1;
        const mappedStatus = result.task?.status === 'APPROVED' ? 'completed' : 'pending-approval';
        setTaskStatuses(current => ({ ...current, [task.id]: mappedStatus }));
      }
      notifySuccess(
        'Strategy sent to HITL review',
        queued > 0 ? `${queued} agent tasks are awaiting approval.` : 'All tasks are already in the approval queue.',
      );
    } catch (error: any) {
      notifyInfo('Strategy queue stopped', error.message || 'Review the failed task and try again.');
    } finally {
      setQueueingStrategyId(null);
    }
  };

  const downloadPlan = () => {
    if (!audit) return;
    const strategyText = strategies.map(strategy => [
      `## ${strategy.rank}. ${strategy.title}`,
      strategy.objective,
      `Success metric: ${strategy.successMetric}`,
      ...strategy.tasks.map(task => `- [HITL] ${task.agentName}: ${task.title}`),
    ].join('\n')).join('\n\n');
    const content = [
      `# Growth plan for ${domain}`,
      formatAuditScoreLine({ score: audit.score, basis: audit.scoringBasis }),
      `Evidence: ${auditSourceLabel(audit)}`,
      '',
      strategyText,
      '---',
      AI_DISCLOSURE_LINE,
    ].join('\n\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `growth-plan-${domain}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 lg:space-y-12 pb-20">
      {/* Top Banner Header Surface */}
      <header className="sigma-page-header p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-[var(--sigma-text-muted)] font-mono">
              <ClipboardCheck size={14} className="text-[var(--sigma-primary)]" />
              <span>Guided Growth Workspace</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.015em] text-[var(--sigma-text)]">
              Diagnose. Choose a strategy. Approve the work.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--sigma-text-muted)]">
              Growth OS turns diagnostic evidence into a focused strategy and a governed agent task queue. You stay in control before anything runs.
            </p>
          </div>
          {audit && (
            <div className="shrink-0">
              <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={downloadPlan}>
                Export Plan
              </Button>
            </div>
          )}
        </div>
      </header>

      <nav aria-label="Growth workflow" className="grid grid-cols-3 overflow-hidden rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)]">
        {[
          { label: 'Diagnose', done: Boolean(audit), active: !audit },
          { label: 'Choose strategy', done: Boolean(selectedStrategy), active: Boolean(audit && !pendingCount) },
          { label: 'Approve work', done: pendingCount > 0, active: pendingCount > 0 },
        ].map((step, index) => (
          <div key={step.label} className={`flex items-center gap-2 px-3 py-3 text-xs sm:px-5 ${index > 0 ? 'border-l border-[var(--sigma-border)]' : ''}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${step.done ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-accent' : step.active ? 'border-[var(--sigma-primary)] bg-[var(--sigma-primary-subtle)] text-[var(--sigma-primary)]' : 'border-[var(--sigma-border)] text-[var(--sigma-text-muted)]'}`}>
              {step.done ? <Check size={13} /> : index + 1}
            </span>
            <span className={step.active || step.done ? 'font-medium text-[var(--sigma-text)]' : 'text-[var(--sigma-text-muted)]'}>{step.label}</span>
          </div>
        ))}
      </nav>

      <GlassCard className="p-5 sm:p-6" elevation="raised">
        <form onSubmit={runDiagnostic} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--sigma-text)]">
              <Globe size={14} className="text-[var(--sigma-primary)]" /> Website to diagnose
            </span>
            <input
              value={domain}
              onChange={event => setDomain(event.target.value)}
              placeholder="company.com"
              className="h-11 w-full rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-bg)] px-4 text-sm text-[var(--sigma-text)] outline-none transition focus:border-[var(--sigma-primary)] focus:ring-2 focus:ring-[var(--sigma-primary)]/15"
            />
          </label>
          <Button type="submit" variant="primary" size="lg" isLoading={isRunning} icon={<Play size={15} />} disabled={!domain.trim()}>
            {audit ? 'Run a fresh diagnostic' : 'Run diagnostic'}
          </Button>
        </form>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--sigma-text-muted)]">
          <Lock size={12} /> Workspace: {currentWorkspace.name}
        </div>
        {isRunning && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--sigma-primary)]/20 bg-[var(--sigma-primary-subtle)] p-4 text-sm text-[var(--sigma-text)]">
            <Loader2 size={17} className="animate-spin text-[var(--sigma-primary)]" />
            Inspecting the site, synthesising findings, and building strategy options...
          </div>
        )}
      </GlassCard>

      {isLoading && !audit && (
        <div className="flex min-h-48 items-center justify-center text-sm text-[var(--sigma-text-muted)]">
          <Loader2 size={18} className="mr-2 animate-spin" /> Loading workspace...
        </div>
      )}

      {!isLoading && !audit && !isRunning && (
        <div className="rounded-2xl border border-dashed border-[var(--sigma-border-strong)] px-6 py-14 text-center">
          <Target className="mx-auto text-[var(--sigma-primary)]" size={30} />
          <h2 className="mt-4 text-lg font-semibold text-[var(--sigma-text)]">Start with one diagnostic</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--sigma-text-muted)]">
            You will receive up to three prioritised strategies. Each strategy comes with a recommended agent mix and HITL-gated tasks.
          </p>
        </div>
      )}

      {audit && !selectedStrategy && !isRunning && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-6 py-10 text-center" aria-live="polite">
          <Target className="mx-auto text-amber-accent" size={30} />
          <h2 className="mt-4 text-lg font-semibold text-[var(--sigma-text)]">The diagnostic returned no strategy evidence</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--sigma-text-muted)]">
            No findings, recommendations, or roadmap tasks were available to build a defensible strategy. Run a fresh diagnostic rather than generating unsupported output.
          </p>
        </section>
      )}

      {audit && selectedStrategy && (
        <main className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-2xl bg-[var(--sigma-text)] p-6 text-[var(--sigma-bg)]">
              <div className="text-xs opacity-65">Growth readiness</div>
              <div className="mt-2 flex items-end gap-2">
                {audit.score === null || audit.score === undefined ? (
                  // No score is not a zero. Saying "0/100" would tell the client
                  // the site failed every check when in fact nothing was observed.
                  <span className="font-display text-3xl font-bold tracking-tight">
                    Not scored
                  </span>
                ) : (
                  <>
                    <span className="font-display text-6xl font-bold tracking-tight">{audit.score}</span>
                    <span className="pb-2 text-sm opacity-60">/100</span>
                  </>
                )}
              </div>
              {/* Only claim the rubric when it actually produced the score. An
                  audit stored before the rubric existed has a bare number with no
                  checks behind it, and must not be described as rubric-scored. */}
              {audit.score !== null && audit.score !== undefined && audit.scoringChecks && (
                <div className="mt-2 text-[11px] opacity-70">
                  Scored on published checks — not a model opinion.
                </div>
              )}
              {audit.score !== null && audit.score !== undefined && !audit.scoringChecks && (
                <div className="mt-2 text-[11px] text-amber-accent/90">
                  Legacy score — stored before the published rubric existed. Not verified; recompute the audit.
                </div>
              )}
              <div className="mt-5 border-t border-current/15 pt-4 text-xs leading-relaxed opacity-75">
                {audit.scoringBasis || auditSourceLabel(audit)}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-6">
              <div className="text-xs text-[var(--sigma-text-muted)]">Highest-priority signal</div>
              <h2 className="mt-2 text-xl font-semibold text-[var(--sigma-text)]">{topFinding?.title || 'Review diagnostic findings'}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--sigma-text-soft)]">
                {topFinding?.insight || topFinding?.text || 'Open the evidence below to review the diagnostic.'}
              </p>
              {topFinding && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {/* Phase 2: say what KIND of claim this is. The old
                      "Readiness assessment" wording hid the fact that the
                      percentage was a model judgement. */}
                  <Badge variant={claimToneBadge(topClaim.tone)} size="sm" title={topClaim.explanation}>
                    {topClaim.label}
                  </Badge>
                  <span className="text-xs text-[var(--sigma-text-muted)]">
                    {topFinding.dataSource === 'live' ? 'Page-backed' : 'Not externally measured'} ·
                    Estimated impact {topFinding.impactPct}%
                  </span>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="strategies-heading">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 id="strategies-heading" className="text-lg font-semibold text-[var(--sigma-text)]">Recommended strategies</h2>
                <p className="mt-1 text-xs text-[var(--sigma-text-muted)]">Choose one focus. The agent mix updates with the strategy.</p>
              </div>
              <Badge variant="neutral" size="sm">{strategies.length} options</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {strategies.map(strategy => {
                const selected = strategy.id === selectedStrategy.id;
                return (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => setSelectedStrategyId(strategy.id)}
                    className={`min-h-36 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sigma-primary)] ${selected ? 'border-[var(--sigma-primary)] bg-[var(--sigma-primary-subtle)] shadow-[0_8px_28px_rgba(255,72,27,0.10)]' : 'border-[var(--sigma-border)] bg-[var(--sigma-surface)] hover:border-[var(--sigma-border-strong)]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--sigma-text-muted)]">Priority {strategy.rank}</span>
                      {selected && <Check size={15} className="text-[var(--sigma-primary)]" />}
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-[var(--sigma-text)]">{strategy.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--sigma-text-muted)]">{strategy.objective}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <GlassCard className="overflow-hidden" elevation="raised">
            <div className="border-b border-[var(--sigma-border)] p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-xs text-[var(--sigma-primary)]">
                    <Sparkles size={14} /> Recommended swarm mix
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--sigma-text)]">{selectedStrategy.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--sigma-text-soft)]">{selectedStrategy.objective}</p>
                  <div className="mt-3 text-xs text-[var(--sigma-text-muted)]">
                    Measure: <span className="font-medium text-[var(--sigma-text)]">{selectedStrategy.successMetric}</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={queueStrategy}
                  isLoading={queueingStrategyId === selectedStrategy.id}
                  icon={<ShieldCheck size={15} />}
                  className="shrink-0"
                >
                  Send tasks for approval
                </Button>
              </div>
            </div>

            <div className="divide-y divide-[var(--sigma-border)]">
              {selectedStrategy.tasks.map((task, index) => {
                const status = taskStatuses[task.id] || 'recommended';
                return (
                  <div key={task.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_auto] sm:items-center sm:px-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sigma-surface-subtle)] text-xs font-semibold text-[var(--sigma-text-muted)]">{index + 1}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--sigma-text)]">{task.agentName}</span>
                        <Badge variant="outline" size="xs">HITL</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--sigma-text-muted)]">{task.title}</p>
                    </div>
                    <Badge
                      variant={status === 'completed' ? 'success' : status === 'failed' ? 'danger' : status === 'pending-approval' ? 'warning' : 'neutral'}
                      size="sm"
                      dot={status === 'pending-approval' || status === 'running'}
                    >
                      {status === 'pending-approval' ? 'Awaiting approval' : status.replace('-', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-xs text-[var(--sigma-text-muted)]">
                  <Lock size={13} /> Tasks enter the approval ledger. No agent runs from this screen.
                </div>
                <Link to="/agents" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--sigma-primary)] hover:underline">
                  Open approvals <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </GlassCard>

          <section className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--sigma-text)]">Optional intelligence support</h2>
                <p className="mt-1 text-xs text-[var(--sigma-text-muted)]">Provider status is checked live. Setup state never counts as execution readiness.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedStrategy.providers.map(provider => (
                  <div key={provider.provider} title={provider.guidance} className="flex items-center gap-2 rounded-lg border border-[var(--sigma-border)] px-3 py-2">
                    <Bot size={13} className="text-[var(--sigma-primary)]" />
                    <span className="text-xs font-medium text-[var(--sigma-text)]">{provider.label}</span>
                    <Badge variant={provider.state === 'ready' ? 'success' : provider.state === 'assisted' ? 'info' : 'neutral'} size="xs">
                      {provider.state.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="divide-y divide-[var(--sigma-border)] rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)]">
            <button type="button" onClick={() => setShowEvidence(value => !value)} className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6">
              <span>
                <span className="block text-sm font-semibold text-[var(--sigma-text)]">Diagnostic evidence</span>
                <span className="mt-1 block text-xs text-[var(--sigma-text-muted)]">{audit.findings.length} findings, hidden until needed</span>
              </span>
              {showEvidence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showEvidence && (
              <div className="divide-y divide-[var(--sigma-border)] px-5 sm:px-6">
                {audit.findings.map(finding => (
                  <article key={finding.id} className="py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--sigma-text)]">{finding.title}</h3>
                      <Badge variant={finding.dataSource === 'live' ? 'success' : 'warning'} size="xs">{finding.dataSource}</Badge>
                    </div>
                    <p className="mt-2 max-w-4xl text-xs leading-relaxed text-[var(--sigma-text-soft)]">{finding.text}</p>
                    {finding.quickSteps.length > 0 && <p className="mt-2 text-xs text-[var(--sigma-text-muted)]">Next: {finding.quickSteps[0]}</p>}
                  </article>
                ))}
              </div>
            )}

            <button type="button" onClick={() => setShowRoadmap(value => !value)} className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6">
              <span>
                <span className="block text-sm font-semibold text-[var(--sigma-text)]">90-day roadmap</span>
                <span className="mt-1 block text-xs text-[var(--sigma-text-muted)]">{audit.roadmap90Day.length} phases, grouped for review</span>
              </span>
              {showRoadmap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showRoadmap && (
              <div className="grid gap-px bg-[var(--sigma-border)] md:grid-cols-3">
                {audit.roadmap90Day.map((phase, index) => (
                  <article key={`${phase.phase}-${index}`} className="bg-[var(--sigma-surface)] p-5">
                    <span className="text-xs text-[var(--sigma-primary)]">{phase.phase}</span>
                    <h3 className="mt-2 text-sm font-semibold text-[var(--sigma-text)]">{phase.title}</h3>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--sigma-text-muted)]">
                      {phase.tasks.slice(0, 4).map(task => <li key={task}>- {task}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="flex items-center justify-between text-xs text-[var(--sigma-text-muted)]">
            <span>Last diagnostic: {audit.lastAuditedAt || 'Current workspace record'}</span>
            {topFinding?.dataSource === 'live' && audit.domain && (
              <a href={`https://${cleanDomain(audit.domain)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--sigma-primary)]">
                Open audited site <ExternalLink size={12} />
              </a>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
