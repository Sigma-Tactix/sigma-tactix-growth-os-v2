import React, { useState, useEffect } from 'react';
import {
  Swords,
  Target,
  ShieldAlert,
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Plus,
  Users,
  FileText,
  Copy,
  Check,
  Zap,
  Lock,
  FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { GlassCard, Button, Badge, MetricWidget, EmptyState } from '@/src/components/ui';
import {
  createMarketSimulation,
  getMarketSimulationCapabilities,
  verifyMarketSimulation,
} from '@/src/lib/api';
import { actionQueueStore } from '@/src/lib/actionQueueStore';

interface ScenarioPreset {
  id: string;
  badge: string;
  title: string;
  question: string;
  assumptions: string[];
  evidenceSnapshotIds: string[];
}

const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'preset-price-cut',
    badge: 'Pricing & Packaging',
    title: 'Competitor 20% Price Cut Rehearsal',
    question: 'How will enterprise and mid-market buyers react if our primary competitor drops pricing by 20%?',
    assumptions: ['Stable macroeconomic conditions', 'Customers value sovereign memory over raw price discounts'],
    evidenceSnapshotIds: ['snap-rival-pricing-01'],
  },
  {
    id: 'preset-feature-bundle',
    badge: 'Product Positioning',
    title: 'Incumbent AI Feature Bundling',
    question: 'What is the churn risk if the legacy incumbent bundles basic AI agents into their free tier?',
    assumptions: ['Incumbent agents lack persistent memory', 'Enterprise buyers require deep tenant isolation'],
    evidenceSnapshotIds: ['snap-incumbent-changelog-02'],
  },
  {
    id: 'preset-enterprise-security',
    badge: 'Risk & Governance',
    title: 'Enterprise AI Governance Inbound',
    question: 'How do Fortune 500 procurement committees evaluate autonomous agents with human-in-the-loop gates?',
    assumptions: ['Zero data retention for training', 'Strict RBAC required for all automated mutations'],
    evidenceSnapshotIds: ['snap-security-whitepaper-03'],
  },
];

export default function MarketSimulatorPage() {
  const { notifySuccess, notifyInfo, notifyError } = useToast();
  const [providerState, setProviderState] = useState<'checking' | 'verified' | 'unconfigured' | 'fixture'>('checking');
  const [providerDetail, setProviderDetail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Scenario Builder state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [title, setTitle] = useState(PRESET_SCENARIOS[0].title);
  const [question, setQuestion] = useState(PRESET_SCENARIOS[0].question);
  const [assumptions, setAssumptions] = useState<string[]>(PRESET_SCENARIOS[0].assumptions);
  const [newAssumption, setNewAssumption] = useState('');

  // Simulation execution state
  const [isRunning, setIsRunning] = useState(false);
  const [simulationRound, setSimulationRound] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [queuedExperiments, setQueuedExperiments] = useState<string[]>([]);

  // Check provider capabilities on load
  useEffect(() => {
    let active = true;
    const checkCaps = async () => {
      try {
        const res = await getMarketSimulationCapabilities();
        if (!active) return;
        const caps = res?.capabilities;
        if (caps?.verified) {
          setProviderState(caps.detail?.includes('Fixture') ? 'fixture' : 'verified');
          setProviderDetail(caps.detail || 'Verified and operational');
        } else {
          setProviderState('unconfigured');
          setProviderDetail(caps?.detail || 'Private service gateway setup required');
        }
      } catch (err: any) {
        if (!active) return;
        setProviderState('unconfigured');
        setProviderDetail(err?.message || 'Gateway unreachable');
      }
    };
    checkCaps();
    return () => { active = false; };
  }, []);

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setQuestion(preset.question);
    setAssumptions(preset.assumptions);
  };

  const handleAddAssumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssumption.trim()) return;
    setAssumptions(prev => [...prev, newAssumption.trim()]);
    setNewAssumption('');
  };

  const handleRemoveAssumption = (index: number) => {
    setAssumptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerifyGateway = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyMarketSimulation();
      if (res?.verified) {
        setProviderState('verified');
        setProviderDetail('Private MiroFish gateway verified successfully.');
        notifySuccess('Gateway Verified', 'MiroFish market simulation is ready.');
      } else {
        notifyInfo('Verification Pending', res?.capabilities?.detail || 'Check private gateway settings.');
      }
    } catch (err: any) {
      notifyError('Verification Failed', err?.message || 'Could not reach MiroFish gateway.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!title.trim() || !question.trim()) {
      notifyError('Missing Input', 'Please enter a scenario title and research question.');
      return;
    }

    setIsRunning(true);
    setReport(null);
    setSimulationRound(1);

    const roundInterval = setInterval(() => {
      setSimulationRound(prev => (prev < 10 ? prev + 1 : prev));
    }, 180);

    try {
      const result = await createMarketSimulation({
        title: title.trim(),
        question: question.trim(),
        assumptions,
        evidenceSnapshotIds: [selectedPresetId],
        excludedDataClasses: ['crm_pii'],
      });

      clearInterval(roundInterval);
      setSimulationRound(10);
      setIsRunning(false);
      setReport(result.report);
      notifySuccess('Simulation Completed', `Simulated 10 rounds across buyer archetypes for "${title}".`);
    } catch (err: any) {
      clearInterval(roundInterval);
      setIsRunning(false);
      notifyError('Simulation Error', err?.message || 'Failed to complete market rehearsal.');
    }
  };

  const handleQueueExperiment = (expTitle: string) => {
    setQueuedExperiments(prev => [...prev, expTitle]);
    actionQueueStore.addItem({
      id: `act-sim-${Date.now().toString().slice(-4)}`,
      moduleName: 'Market Rehearsal Engine',
      moduleCategory: 'INTELLIGENCE',
      moduleRoute: '/market-simulator',
      title: `Simulated Experiment: ${expTitle}`,
      summary: `Automated experiment candidate generated from MiroFish market rehearsal persona reactions.`,
      status: 'PENDING_APPROVAL',
      risk: 'MEDIUM',
      enclaveName: 'Sigma Sovereign Core',
      enclaveId: 'ws-default',
      timestamp: 'Just now',
      suggestedAction: 'Review Experiment & Launch Test',
    });
    notifySuccess('Queued for Human Approval', `Added "${expTitle}" to Dashboard Action Queue with PENDING_APPROVAL.`);
  };

  const handleCopyReport = () => {
    if (!report) return;
    const text = `# ${report.title}\n\n${report.summary}\n\n## Simulated Personas\n${report.simulatedPersonas?.map((p: string) => `- ${p}`).join('\n')}\n\n## Key Objections\n${report.keyObjections?.map((o: string) => `- ${o}`).join('\n')}\n\n## Suggested Experiments\n${report.suggestedExperiments?.map((e: any) => `- ${e.title} (${e.targetSegment}) -> Metric: ${e.metric}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notifySuccess('Copied', 'Simulation report copied to clipboard.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="vermilion">EVIDENCE-GROUNDED REHEARSAL</Badge>
              <span className="text-muted text-xs">•</span>
              <Badge
                variant={providerState === 'unconfigured' ? 'warning' : providerState === 'checking' ? 'neutral' : 'success'}
              >
                {providerState === 'fixture'
                  ? 'MIROFISH FIXTURE SANDBOX (ACTIVE)'
                  : providerState === 'verified'
                  ? 'MIROFISH PRIVATE GATEWAY (VERIFIED)'
                  : providerState === 'checking'
                  ? 'CHECKING GATEWAY…'
                  : 'SETUP REQUIRED'}
              </Badge>
            </div>
            {providerDetail && (
              <p className="text-[11px] text-muted font-mono mb-1.5 max-w-2xl">{providerDetail}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--sigma-text)] flex items-center gap-3">
              <Swords className="w-7 h-7 text-[var(--sigma-vermilion)]" />
              Market Scenario Simulator (MiroFish)
            </h1>
            <p className="text-muted text-sm mt-1 max-w-2xl leading-relaxed">
              Rehearse buyer objections, persona sentiment, and rival retaliation rounds before launching live campaigns or changing pricing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyGateway}
              isLoading={isVerifying}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Verify Gateway
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricWidget
          label="Simulation Rounds"
          value="10 Rounds"
          subtext="Multi-agent graph evaluation"
        />
        <MetricWidget
          label="Buyer Archetypes"
          value="3 Personas"
          subtext="Mid-market, Enterprise, Procurement"
        />
        <MetricWidget
          label="Governance Gate"
          value="HITL Locked"
          delta={{ value: "Safe", trend: "up" }}
          subtext="No autonomous live ad mutations"
        />
        <MetricWidget
          label="Audit Destination"
          value="Audit Vault"
          subtext="Zone 4 immutable logs"
        />
      </div>

      {/* Preset Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--sigma-vermilion)]" /> Scenario Rehearsal Presets
          </span>
          <span className="text-xs text-muted">Pick a preset or customize below</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_SCENARIOS.map(preset => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
                  isSelected
                    ? "bg-[var(--sigma-accent-amber)]/10 border-[var(--sigma-accent-amber)]/50 text-[var(--sigma-text)] shadow-lg  ring-1 ring-[var(--sigma-accent-amber)]/30"
                    : "bg-[var(--sigma-surface-subtle)]/50 border-border text-muted hover:border-border-strong hover:text-[var(--sigma-text-soft)]"
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <Badge variant={isSelected ? "vermilion" : "neutral"} size="xs">{preset.badge}</Badge>
                  {isSelected && <span className="text-amber-accent text-xs font-semibold">Selected</span>}
                </div>
                <div className="font-semibold text-sm text-[var(--sigma-text)] mt-2 truncate">{preset.title}</div>
                <div className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{preset.question}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Configuration Box */}
      <GlassCard elevation="raised" className="p-6 space-y-5">
        <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sigma-text)] flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-accent" /> Scenario Configuration
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Specify the exact research hypothesis, target market question, and boundary assumptions.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleRunSimulation}
            isLoading={isRunning}
            icon={<Play className="w-4 h-4 fill-[var(--sigma-inverse-text)]" />}
          >
            {isRunning ? `Simulating Round ${simulationRound} / 10...` : 'Run Governed Simulation'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Scenario Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[var(--sigma-input)] border border-border rounded-lg px-3.5 py-2.5 text-sm text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-accent-amber)]/50"
                placeholder="e.g. Rival 20% Discount Response Rehearsal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Research Question</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={3}
                className="w-full bg-[var(--sigma-input)] border border-border rounded-lg px-3.5 py-2.5 text-sm text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-accent-amber)]/50 resize-none"
                placeholder="How will our target buyer personas react to this market shift?"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-[var(--sigma-text-soft)] mb-1.5">Market Assumptions & Guardrails</label>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {assumptions.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-[var(--sigma-input)] border border-border rounded-md px-3 py-1.5 text-xs text-[var(--sigma-text-soft)]">
                  <span className="truncate pr-2">• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssumption(index)}
                    className="text-muted hover:text-rose-accent text-xs shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAssumption} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newAssumption}
                onChange={e => setNewAssumption(e.target.value)}
                placeholder="Add market assumption..."
                className="flex-1 bg-[var(--sigma-input)] border border-border rounded-lg px-3 py-1.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-accent-amber)]/50"
              />
              <Button type="submit" variant="secondary" size="sm" icon={<Plus className="w-3 h-3" />}>
                Add
              </Button>
            </form>
          </div>
        </div>
      </GlassCard>

      {/* Loading Progress State */}
      {isRunning && (
        <GlassCard elevation="raised" className="p-6 text-center space-y-4 border-[var(--sigma-accent-amber)]/30">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-amber-accent animate-spin" />
            <span className="text-base font-semibold text-[var(--sigma-text)]">
              Running MiroFish Market Simulation (Round {simulationRound} of 10)
            </span>
          </div>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Modeling buyer interactions across synthetic persona cohorts. Simulating objections, price elasticity, and competitive counter-messaging...
          </p>
          <div className="w-full bg-[var(--sigma-surface-subtle)] rounded-full h-2 max-w-md mx-auto overflow-hidden">
            <div
              className="bg-[var(--sigma-accent-amber)] h-2 transition-all duration-300"
              style={{ width: `${(simulationRound / 10) * 100}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* Idle state: neither running nor a finished report */}
      {!isRunning && !report && (
        <EmptyState
          icon={<FlaskConical className="w-5 h-5" />}
          title="No simulation run yet"
          description="Configure a scenario hypothesis and its boundary assumptions above, then run a governed simulation to generate buyer persona reactions, objections, and rival counter-moves. Nothing has been simulated yet."
        />
      )}

      {/* Results View */}
      {report && (
        <div className="space-y-6">
          <GlassCard elevation="raised" className="p-6 space-y-6 border-[var(--sigma-accent-emerald)]/30 shadow-xl shadow-[var(--sigma-shadow-lg)]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success" size="sm">SIMULATION COMPLETED</Badge>
                  <span className="text-muted text-xs">•</span>
                  <span className="text-xs text-muted font-mono">10 Rounds Simulated</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--sigma-text)]">{report.title}</h3>
                <p className="text-sm text-[var(--sigma-text-soft)] mt-2 leading-relaxed max-w-4xl">
                  {report.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReport}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-accent" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'Copy Brief'}
                </Button>
              </div>
            </div>

            {/* Simulated Personas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--sigma-input)] border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-accent uppercase tracking-wider">
                  <Users className="w-4 h-4" /> Synthetic Buyer Personas
                </div>
                <div className="space-y-2">
                  {report.simulatedPersonas?.map((persona: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--sigma-text-soft)]">
                      <span className="text-amber-accent font-bold shrink-0">{idx + 1}.</span>
                      <span>{persona}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Objections */}
              <div className="p-4 rounded-xl bg-[var(--sigma-input)] border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-accent uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Key Market Objections
                </div>
                <div className="space-y-2">
                  {report.keyObjections?.map((obj: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--sigma-text-soft)]">
                      <span className="text-rose-accent font-bold shrink-0">•</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predicted Counter-Moves */}
              <div className="p-4 rounded-xl bg-[var(--sigma-input)] border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-accent uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" /> Predicted Rival Counter-Moves
                </div>
                <div className="space-y-2">
                  {report.predictedCounterMoves?.map((move: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--sigma-text-soft)]">
                      <span className="text-sky-accent font-bold shrink-0">•</span>
                      <span>{move}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested Growth Experiments */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-[var(--sigma-text)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--sigma-vermilion)]" />
                Actionable Growth Experiments (Human Approval Gated)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.suggestedExperiments?.map((exp: any, idx: number) => {
                  const isQueued = queuedExperiments.includes(exp.title);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[var(--sigma-surface-subtle)]/50 border border-border flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <Badge variant="outline" size="xs">{exp.targetSegment}</Badge>
                          <span className="text-emerald-accent text-xs font-mono font-medium">{exp.metric}</span>
                        </div>
                        <h5 className="text-sm font-semibold text-[var(--sigma-text)]">{exp.title}</h5>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-border">
                        <span className="text-[11px] text-muted flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Requires HITL Approval
                        </span>
                        <Button
                          variant={isQueued ? "secondary" : "primary"}
                          size="xs"
                          disabled={isQueued}
                          onClick={() => handleQueueExperiment(exp.title)}
                          icon={isQueued ? <Check className="w-3 h-3 text-emerald-accent" /> : <Plus className="w-3 h-3" />}
                        >
                          {isQueued ? 'Queued' : 'Add to Action Queue'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

