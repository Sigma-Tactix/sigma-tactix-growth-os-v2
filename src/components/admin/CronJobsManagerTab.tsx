import React, { useState } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Terminal, 
  Zap, 
  ChevronRight, 
  FileText, 
  Download, 
  Plus, 
  Sliders, 
  Trash2 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface CronJob {
  id: string;
  name: string;
  description: string;
  expression: string;
  humanSchedule: string;
  targetAgent: string;
  category: 'DIAGNOSTICS' | 'ADS' | 'CONTENT' | 'REPORTS' | 'INFRA' | 'OUTREACH';
  active: boolean;
  lastRun?: {
    timestamp: string;
    status: 'SUCCESS' | 'FAILED' | 'RUNNING';
    durationMs: number;
    tokensMetered: number;
    costUsd: number;
    summary: string;
  };
  nextRun: string;
}

const DEFAULT_CRON_JOBS: CronJob[] = [
  {
    id: 'cron-growth-diag',
    name: 'Daily Autonomous Growth Diagnostic',
    description: 'Scans CAC/LTV velocity, SEO rank movements, and pipeline friction points; generates morning brief.',
    expression: '0 6 * * *',
    humanSchedule: 'Every day at 06:00 UTC (Early Morning Brief)',
    targetAgent: 'CHRONOS-00 (Autonomous Core)',
    category: 'DIAGNOSTICS',
    active: true,
    lastRun: {
      timestamp: 'Today, 06:00 UTC',
      status: 'SUCCESS',
      durationMs: 3420,
      tokensMetered: 18450,
      costUsd: 0.00138,
      summary: 'Processed 14 health metrics across 3 workspaces. Growth index up +4.2%.'
    },
    nextRun: 'Tomorrow at 06:00 UTC'
  },
  {
    id: 'cron-paid-ads-audit',
    name: 'Hourly Paid Ads ROAS & Budget Sentinel',
    description: 'Audits Meta, Google & LinkedIn ad campaigns, flags spend spikes above 15%, auto-pauses bleeder ad sets.',
    expression: '0 * * * *',
    humanSchedule: 'At minute 0 past every hour',
    targetAgent: 'HYPERION-03 (Performance Marketing)',
    category: 'ADS',
    active: true,
    lastRun: {
      timestamp: '52 minutes ago',
      status: 'SUCCESS',
      durationMs: 1890,
      tokensMetered: 9200,
      costUsd: 0.00069,
      summary: 'ROAS sustained at 3.8x. 0 rogue spikes detected in past 60m.'
    },
    nextRun: 'In 8 minutes'
  },
  {
    id: 'cron-whatsapp-followup-scheduler',
    name: '30-Min WhatsApp Follow-up Drip Scheduler',
    description: 'Polls Supabase leads where next_followup_at <= now() and status in (qualifying, qualified, nurture). Dispatches pre-approved Twilio WhatsApp Content Templates (Steps 1-3). Auto-aborts on lead reply.',
    expression: '*/30 * * * *',
    humanSchedule: 'Every 30 minutes (24/7 Drip Pipeline)',
    targetAgent: 'HERMES-07 (Inbound Sales Lead Intelligence)',
    category: 'OUTREACH',
    active: true,
    lastRun: {
      timestamp: '11 minutes ago',
      status: 'SUCCESS',
      durationMs: 1420,
      tokensMetered: 5200,
      costUsd: 0.00039,
      summary: 'Processed 18 due leads. Dispatched 6 Step-1 templates, 3 Step-2 templates. Auto-stopped 1 replied lead.'
    },
    nextRun: 'In 19 minutes'
  },
  {
    id: 'cron-social-listening',
    name: 'Social Trend Wave & Competitor Intercept',
    description: 'Monitors X, Reddit, and LinkedIn feeds for viral competitor hashtags and high-intent buyer inquiries.',
    expression: '*/30 * * * *',
    humanSchedule: 'Every 30 minutes',
    targetAgent: 'AURA-01 (Social Sentinel)',
    category: 'CONTENT',
    active: true,
    lastRun: {
      timestamp: '14 minutes ago',
      status: 'SUCCESS',
      durationMs: 2450,
      tokensMetered: 12100,
      costUsd: 0.00091,
      summary: 'Captured 3 fresh buyer signals for B2B RevOps. Draft replies queued in HITL.'
    },
    nextRun: 'In 16 minutes'
  },
  {
    id: 'cron-weekly-board-pack',
    name: 'Weekly Executive Board Pack Compiler',
    description: 'Compiles full 10-vault data digest, token unit economics, and multi-tenant performance into PDF executive brief.',
    expression: '0 8 * * 1',
    humanSchedule: 'Every Monday at 08:00 UTC',
    targetAgent: 'ORACLE-08 (Executive Synthesis)',
    category: 'REPORTS',
    active: true,
    lastRun: {
      timestamp: 'Monday, Sep 7 08:00 UTC',
      status: 'SUCCESS',
      durationMs: 8200,
      tokensMetered: 45200,
      costUsd: 0.00339,
      summary: 'Generated 18-page Board Briefing PDF with token profitability ledger.'
    },
    nextRun: 'Next Monday at 08:00 UTC'
  },
  {
    id: 'cron-vault-sync',
    name: 'Second Brain Knowledge Vaults Synchronization',
    description: 'Refreshes embeddings, deduplicates vector notes, and syncs Notion, GitHub & Drive ingest pipelines.',
    expression: '0 */4 * * *',
    humanSchedule: 'Every 4 hours on the hour',
    targetAgent: 'NEXUS-02 (Second Brain Curate)',
    category: 'INFRA',
    active: true,
    lastRun: {
      timestamp: '2 hours ago',
      status: 'SUCCESS',
      durationMs: 4120,
      tokensMetered: 22800,
      costUsd: 0.00171,
      summary: 'Synchronized 10/10 vaults. 42 new vector embeddings indexed.'
    },
    nextRun: 'In 1 hr 58 mins'
  },
  {
    id: 'cron-local-llm-sentinel',
    name: 'MacBook Local LLM & Metal VRAM Sentinel',
    description: 'Pings LM Studio (:1234) and Ollama (:11434), flushes stale context KV cache, monitors Apple Silicon Unified Memory.',
    expression: '*/15 * * * *',
    humanSchedule: 'Every 15 minutes',
    targetAgent: 'VULCAN-06 (Infra Ops)',
    category: 'INFRA',
    active: false,
    lastRun: {
      timestamp: 'Yesterday 22:45 UTC',
      status: 'SUCCESS',
      durationMs: 450,
      tokensMetered: 0,
      costUsd: 0,
      summary: 'Port 1234 responsive. 18.2 GB Metal Unified Memory headroom available.'
    },
    nextRun: 'Paused'
  }
];

export default function CronJobsManagerTab() {
  const [jobs, setJobs] = useState<CronJob[]>(DEFAULT_CRON_JOBS);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(DEFAULT_CRON_JOBS[0]);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runLog, setRunLog] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' }>>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // New Cron Builder Form
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobCron, setNewJobCron] = useState('0 9 * * 1-5');
  const [newJobAgent, setNewJobAgent] = useState('CHRONOS-00 (Autonomous Core)');
  const [newJobCategory, setNewJobCategory] = useState<'DIAGNOSTICS' | 'ADS' | 'CONTENT' | 'REPORTS' | 'INFRA' | 'OUTREACH'>('OUTREACH');

  const toggleJobActive = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        const nextActive = !j.active;
        return {
          ...j,
          active: nextActive,
          nextRun: nextActive ? 'Pending next cycle' : 'Paused'
        };
      }
      return j;
    }));
  };

  const handleRunNow = async (job: CronJob) => {
    setRunningJobId(job.id);
    const nowStr = new Date().toLocaleTimeString();
    setRunLog(prev => [
      { time: nowStr, text: `▶ Dispatched immediate execution for "${job.name}"...`, type: 'info' },
      ...prev
    ]);

    // Simulate real execution with live steps
    await new Promise(r => setTimeout(r, 600));
    setRunLog(prev => [
      { time: new Date().toLocaleTimeString(), text: `⚡ Handshaking target agent: ${job.targetAgent}...`, type: 'info' },
      ...prev
    ]);

    await new Promise(r => setTimeout(r, 900));
    const tokenSim = Math.floor(Math.random() * 8000) + 4000;
    const durationSim = Math.floor(Math.random() * 2000) + 1200;
    const costSim = (tokenSim / 1000000) * 0.075;

    setRunLog(prev => [
      { 
        time: new Date().toLocaleTimeString(), 
        text: `✔ Completed in ${durationSim}ms. Metered ${tokenSim.toLocaleString()} tokens ($${costSim.toFixed(6)} USD).`, 
        type: 'success' 
      },
      ...prev
    ]);

    // Update job state
    setJobs(prev => prev.map(j => {
      if (j.id === job.id) {
        return {
          ...j,
          lastRun: {
            timestamp: 'Just now',
            status: 'SUCCESS',
            durationMs: durationSim,
            tokensMetered: tokenSim,
            costUsd: costSim,
            summary: `Manual trigger completed successfully. Executed by ${job.targetAgent}.`
          }
        };
      }
      return j;
    }));

    setRunningJobId(null);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    const newJob: CronJob = {
      id: `cron-${Date.now()}`,
      name: newJobName.trim(),
      description: newJobDesc.trim() || 'Autonomous schedule managed by Sigmatactix Cron Engine.',
      expression: newJobCron.trim() || '0 0 * * *',
      humanSchedule: `Custom schedule (${newJobCron})`,
      targetAgent: newJobAgent,
      category: newJobCategory,
      active: true,
      nextRun: 'Calculated upon daemon loop',
      lastRun: undefined
    };

    setJobs(prev => [newJob, ...prev]);
    setSelectedJob(newJob);
    setIsBuilderOpen(false);
    setNewJobName('');
    setNewJobDesc('');
  };

  const filteredJobs = jobs.filter(j => activeCategory === 'ALL' || j.category === activeCategory);

  const exportCrontab = () => {
    const lines = [
      '# Sigmatactix Growth OS - Production Cron Daemon Definition',
      `# Exported: ${new Date().toISOString()}`,
      '# Format: MIN HOUR DAY_OF_MONTH MONTH DAY_OF_WEEK COMMAND',
      ''
    ];
    jobs.forEach(j => {
      if (j.active) {
        lines.push(`# ${j.name} (${j.targetAgent})`);
        lines.push(`${j.expression} /usr/local/bin/sigmatactix-runner --job=${j.id} --agent="${j.targetAgent}" >> /var/log/sigmatactix/cron.log 2>&1`);
        lines.push('');
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sigmatactix.crontab';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-surface to-surface border border-accent/20 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent font-bold">
            <Clock size={16} /> Autonomous Background Daemon Engine
          </div>
          <h2 className="text-2xl lg:text-3xl font-heading font-black text-white tracking-tight">
            Production Cron Schedules & Agent Dispatchers
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Configure standard 5-field cron intervals for automated growth diagnostics, ROAS bleeder kill-switches, social trend listening, and executive board digests with instant test execution.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={exportCrontab}
            className="px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2"
            title="Export standard crontab file"
          >
            <Download size={14} /> Export Crontab
          </button>
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-5 py-2.5 bg-accent text-background font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center gap-2 amber-glow shadow-lg"
          >
            <Plus size={15} /> Add Custom Cron Job
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-muted uppercase">Active Cron Daemons</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {jobs.filter(j => j.active).length} / {jobs.length}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={10} /> Continuous Evaluation
          </div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-muted uppercase">Execution Frequency</div>
          <div className="text-2xl font-bold font-mono text-accent mt-1">
            48 / day
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">Automated triggers</div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-muted uppercase">Avg Execution Latency</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            2.4s
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">Non-blocking async</div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-muted uppercase">Est. Monthly Token Cost</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            $0.94 USD
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">99.2% Profit Margin</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {(['ALL', 'OUTREACH', 'DIAGNOSTICS', 'ADS', 'CONTENT', 'REPORTS', 'INFRA'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all",
              activeCategory === cat
                ? "bg-accent/20 text-accent font-bold border border-accent/30"
                : "text-muted hover:text-white hover:bg-white/5"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Split: Jobs List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Jobs List */}
        <div className="lg:col-span-7 space-y-3">
          {filteredJobs.map(job => {
            const isSelected = selectedJob?.id === job.id;
            const isRunning = runningJobId === job.id;

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer relative",
                  isSelected
                    ? "bg-accent/10 border-accent/50 shadow-xl"
                    : "bg-surface/60 border-white/10 hover:border-white/20 hover:bg-surface/90"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        job.active ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                      )} />
                      <h4 className="text-sm font-bold text-white font-mono">{job.name}</h4>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400">
                        {job.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{job.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleJobActive(job.id);
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-mono transition-all",
                        job.active 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-zinc-800/60 border-white/10 text-zinc-400 hover:text-white"
                      )}
                      title={job.active ? "Pause Schedule" : "Activate Schedule"}
                    >
                      {job.active ? <Pause size={13} /> : <Play size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunNow(job);
                      }}
                      disabled={isRunning}
                      className="px-3 py-1.5 bg-accent text-background font-bold rounded-lg text-xs font-mono hover:opacity-90 transition-all flex items-center gap-1.5 shadow"
                      title="Run Now"
                    >
                      <Zap size={12} className={cn(isRunning && "animate-spin")} />
                      <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                    </button>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <code className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-accent font-mono font-bold">
                      {job.expression}
                    </code>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{job.humanSchedule}</span>
                  </div>

                  <div className="text-zinc-400">
                    Target: <span className="text-white font-semibold">{job.targetAgent.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Job Detail & Live Execution Terminal */}
        <div className="lg:col-span-5 space-y-6">
          {selectedJob ? (
            <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted">Schedule Inspector</div>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">{selectedJob.name}</h3>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-mono font-bold",
                  selectedJob.active 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-white/10"
                )}>
                  {selectedJob.active ? 'Active Daemon' : 'Paused'}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-muted">Cron Expression</span>
                  <span className="font-bold text-accent font-mono">{selectedJob.expression}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-muted">Assigned Scoped Agent</span>
                  <span className="text-white font-semibold">{selectedJob.targetAgent}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-muted">Next Scheduled Trigger</span>
                  <span className="text-zinc-300">{selectedJob.nextRun}</span>
                </div>
              </div>

              {/* Last Run Report */}
              {selectedJob.lastRun && (
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 font-bold uppercase">Latest Run Telemetry</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={12} /> {selectedJob.lastRun.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {selectedJob.lastRun.summary}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
                    <div>
                      <div className="text-muted">Duration</div>
                      <div className="text-white font-bold">{selectedJob.lastRun.durationMs}ms</div>
                    </div>
                    <div>
                      <div className="text-muted">Tokens</div>
                      <div className="text-accent font-bold">{selectedJob.lastRun.tokensMetered.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted">Est. Cost</div>
                      <div className="text-amber-400 font-bold">${selectedJob.lastRun.costUsd.toFixed(6)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleRunNow(selectedJob)}
                  disabled={runningJobId === selectedJob.id}
                  className="flex-1 py-3 bg-accent text-background font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow"
                >
                  <Zap size={14} className={cn(runningJobId === selectedJob.id && "animate-spin")} />
                  <span>{runningJobId === selectedJob.id ? 'Running Cycle...' : 'Run Cycle Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleJobActive(selectedJob.id)}
                  className="px-4 py-3 bg-black/40 border border-white/10 hover:border-white/20 text-xs font-mono text-zinc-300 rounded-xl transition-all"
                >
                  {selectedJob.active ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-white/10 rounded-2xl bg-surface text-center text-xs font-mono text-zinc-500">
              Select a schedule to view detailed telemetry.
            </div>
          )}

          {/* Live Execution Stream Console */}
          <div className="bg-black/80 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Terminal size={14} className="text-accent" />
                <span className="uppercase tracking-wider font-bold">Live Execution Stream</span>
              </div>
              <span className="text-[10px] text-zinc-600">stdout/stderr</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] leading-relaxed">
              {runLog.length === 0 ? (
                <div className="text-zinc-600 italic py-3 text-center">
                  Click "Run Now" on any schedule to stream real-time execution logs.
                </div>
              ) : (
                runLog.map((l, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-zinc-600 shrink-0">[{l.time}]</span>
                    <span className={cn(
                      l.type === 'success' ? 'text-emerald-400' :
                      l.type === 'warn' ? 'text-amber-400' : 'text-zinc-300'
                    )}>
                      {l.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Cron Job */}
      <AnimatePresence>
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/15 rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-accent" />
                  <h3 className="text-lg font-bold text-white font-mono">Register New Cron Daemon</h3>
                </div>
                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted">Job Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midday Competitor Price Surge Audit"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted">Description & Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Scrapes public price pages and generates alert if discount > 20%."
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted">Cron Expression</label>
                    <input
                      type="text"
                      required
                      placeholder="0 9 * * 1-5"
                      value={newJobCron}
                      onChange={(e) => setNewJobCron(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-accent font-mono font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <span className="text-[10px] font-mono text-zinc-500">Min Hour Day Month DayOfWeek</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted">Category</label>
                    <select
                      value={newJobCategory}
                      onChange={(e) => setNewJobCategory(e.target.value as any)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="OUTREACH">Outreach & WhatsApp</option>
                      <option value="DIAGNOSTICS">Diagnostics</option>
                      <option value="ADS">Performance Ads</option>
                      <option value="CONTENT">Content & Social</option>
                      <option value="REPORTS">Executive Reports</option>
                      <option value="INFRA">Infrastructure & Local</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-muted">Target Scoped Agent</label>
                  <select
                    value={newJobAgent}
                    onChange={(e) => setNewJobAgent(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="CHRONOS-00 (Autonomous Core)">CHRONOS-00 (Autonomous Core & Orchestrator)</option>
                    <option value="AURA-01 (Social Sentinel)">AURA-01 (Brand Perception & Social Intercept)</option>
                    <option value="NEXUS-02 (Second Brain Curate)">NEXUS-02 (Knowledge Synthesis & Graph Index)</option>
                    <option value="HYPERION-03 (Performance Marketing)">HYPERION-03 (Paid Media & ROAS Optimization)</option>
                    <option value="AEGIS-04 (Revenue Ops)">AEGIS-04 (Pipeline Hygiene & Lead Qualification)</option>
                    <option value="VECTOR-05 (Autonomous Growth Hacker)">VECTOR-05 (Funnel Optimization & A/B Engine)</option>
                    <option value="VULCAN-06 (Infra Ops)">VULCAN-06 (Local LLM & Hardware Sentinel)</option>
                    <option value="HERMES-07 (Omni-Channel Outreach)">HERMES-07 (B2B Sequencer & Deliverability)</option>
                    <option value="ORACLE-08 (Executive Synthesis)">ORACLE-08 (C-Suite Strategic Reporting)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent text-background font-bold text-xs uppercase tracking-wider rounded-xl shadow hover:opacity-90"
                  >
                    Deploy Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
