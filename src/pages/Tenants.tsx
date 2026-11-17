import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building,
  ShieldCheck,
  Zap,
  Globe,
  Coins,
  TrendingUp,
  Cpu,
  Sliders,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Layers,
  Activity,
  Plus,
  X,
  Search,
  Lock,
  Server,
  Sparkles,
  BarChart3,
  Calendar,
  Mail
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/src/contexts/ToastContext';
import TenantAuditLogSystem from '@/src/components/TenantAuditLogSystem';
import AIModelConfigTab from '@/src/components/admin/AIModelConfigTab';
import AgentSystemPromptsTab from '@/src/components/admin/AgentSystemPromptsTab';
import AgentMailboxesTab from '@/src/components/admin/AgentMailboxesTab';
import ProductionSkillsMCPTab from '@/src/components/admin/ProductionSkillsMCPTab';
import CronJobsManagerTab from '@/src/components/admin/CronJobsManagerTab';
import FullHarnessExplodedView from '@/src/components/admin/FullHarnessExplodedView';
import {
  getTokenTelemetry,
  getAIProviderKeys,
  saveAIProviderKey,
  fetchProviderModels,
  getWorkspaceTier,
  setWorkspaceTier,
  createCheckoutSession,
  getBillingTiers,
  testModelInference
} from '@/src/lib/api';
import { TokenTelemetrySummary, AIKeyConfig, ClientWorkspace } from '@/src/types';
import { calculateTokenCost, computeProfitability, TIER_RETAINERS, MODEL_PRICING, ALL_AI_MODELS } from '@/src/lib/tokenCostEngine';
import { ALL_SUPPORTED_PROVIDERS } from '@/src/data/aiProviderCatalog';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { Button, GlassCard, Badge, MetricWidget, Tabs } from '@/src/components/ui';

export type ActiveTab =
  | 'TELEMETRY'
  | 'AI_CONFIG'
  | 'SYSTEM_PROMPTS'
  | 'MAILBOXES'
  | 'SKILLS_MCP'
  | 'CRON_JOBS'
  | 'HARNESS_VIEW'
  | 'TENANTS'
  | 'AUDIT_LOGS';

// The client provider catalog lives in src/data/aiProviderCatalog.ts (shared,
// and parity-checked against server.ts by aiProviderCatalog.test.ts) so a just-
// saved key can never silently drop on refresh.

export default function Tenants({ defaultTab }: { defaultTab?: ActiveTab } = {}) {
  const {
    workspaces,
    currentWorkspace,
    currentWorkspaceId,
    switchWorkspace,
    provisionWorkspace,
    deleteWorkspace,
    updateWorkspaceTier
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<ActiveTab>('TELEMETRY');
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<TokenTelemetrySummary | null>(null);
  const [providers, setProviders] = useState<AIKeyConfig[]>([]);
  const [activeTier, setActiveTier] = useState<string>('growth');
  const [availableTiers, setAvailableTiers] = useState<any[]>([]);

  const { notifyError } = useToast();
  const [pendingTerminateId, setPendingTerminateId] = useState<string | null>(null);
  const pendingTerminateTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const confirmTerminate = (id: string) => {
    deleteWorkspace(id);
    setPendingTerminateId(null);
  };
  const armTerminate = (id: string) => {
    setPendingTerminateId(id);
    if (pendingTerminateTimer.current) clearTimeout(pendingTerminateTimer.current);
    pendingTerminateTimer.current = setTimeout(() => setPendingTerminateId(null), 5000);
  };
  const disarmTerminate = () => {
    setPendingTerminateId(null);
    if (pendingTerminateTimer.current) clearTimeout(pendingTerminateTimer.current);
  };

  // Interactive Profitability Calculator State
  const [calcRetainer, setCalcRetainer] = useState<number>(1499);
  const [calcTasksPerMonth, setCalcTasksPerMonth] = useState<number>(60);
  const [calcModel, setCalcModel] = useState<string>('gemini-2.5-flash');
  const [calcAvgTokensPerTask, setCalcAvgTokensPerTask] = useState<number>(12000);

  // Key Vault Form State
  const [selectedProvider, setSelectedProvider] = useState<string>('google');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Model Inference Handshake State
  const [testingInference, setTestingInference] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<{
    text: string;
    model: string;
    provider: string;
    durationMs: number;
    totalTokens: number;
    costUsd: number;
  } | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDomain, setNewClientDomain] = useState('');
  const [newClientTier, setNewClientTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');

  const loadData = async () => {
    setLoading(true);
    try {
      const [telemData, provData, tierData, allTiers] = await Promise.all([
        getTokenTelemetry().catch(() => null),
        getAIProviderKeys().catch(() => null),
        getWorkspaceTier().catch(() => null),
        getBillingTiers().catch(() => []),
      ]);

      if (telemData) setTelemetry(telemData);

      // A transient keys-fetch failure must NOT clobber the on-screen provider
      // list with a full unconfigured catalog — that is what made "I just saved
      // a key and it disappeared" feel real. Keep the previous list on null.
      if (provData) {
        const mergedProviders: AIKeyConfig[] = ALL_SUPPORTED_PROVIDERS.map(sp => {
          const found = (provData || []).find((p: any) =>
            p.provider.toLowerCase() === sp.provider.toLowerCase() ||
            (sp.provider === 'google' && p.provider.toLowerCase() === 'gemini')
          );
          if (found) {
            return { ...found, provider: sp.provider, live: found.live ?? sp.live };
          }
          return {
            provider: sp.provider,
            configured: false,
            model: sp.defaultModel,
            live: false
          };
        });
        setProviders(mergedProviders);
      }

      if (tierData?.tier_key) {
        setActiveTier(tierData.tier_key);
        setCalcRetainer(TIER_RETAINERS[tierData.tier_key]?.priceMonthly || 1499);
      }
      if (allTiers) setAvailableTiers(allTiers);
    } catch (err) {
      console.warn("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['TELEMETRY', 'AI_CONFIG', 'SYSTEM_PROMPTS', 'MAILBOXES', 'SKILLS_MCP', 'CRON_JOBS', 'HARNESS_VIEW', 'TENANTS', 'AUDIT_LOGS'].includes(tabParam)) {
        setActiveTab(tabParam as ActiveTab);
      }
    }
  }, [defaultTab]);

  // Calculated Profitability based on simulator inputs
  const simulatedProfitability = useMemo(() => {
    const totalSimulatedTokens = calcTasksPerMonth * calcAvgTokensPerTask;
    const promptShare = Math.round(totalSimulatedTokens * 0.7);
    const candidateShare = totalSimulatedTokens - promptShare;
    const simulatedCost = calculateTokenCost(calcModel, promptShare, candidateShare);
    const tierName = TIER_RETAINERS[activeTier]?.name || 'Growth OS';
    return computeProfitability(activeTier, tierName, calcRetainer, simulatedCost, 35.00);
  }, [calcRetainer, calcTasksPerMonth, calcModel, calcAvgTokensPerTask, activeTier]);

  const handleSaveAIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeySaveMessage(null);
    try {
      await saveAIProviderKey(selectedProvider, apiKeyInput.trim(), selectedModel);
      setKeySaveMessage({ type: 'success', text: `Successfully saved & encrypted ${selectedProvider.toUpperCase()} key.` });
      setApiKeyInput('');
      const updated = await getAIProviderKeys();
      setProviders(updated);
    } catch (err: any) {
      setKeySaveMessage({ type: 'error', text: err.message || 'Failed to save key' });
    }
  };

  const handleFetchModels = async () => {
    setFetchingModels(true);
    try {
      const models = await fetchProviderModels(selectedProvider, apiKeyInput || undefined);
      if (models && models.length > 0) {
        setDiscoveredModels(models);
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } else {
        const local = ALL_AI_MODELS.filter(m => m.provider === selectedProvider || (selectedProvider === 'gemini' && m.provider === 'google')).map(m => m.id);
        setDiscoveredModels(local);
        if (local.length > 0 && !local.includes(selectedModel)) {
          setSelectedModel(local[0]);
        }
      }
    } catch (err: any) {
      const local = ALL_AI_MODELS.filter(m => m.provider === selectedProvider || (selectedProvider === 'gemini' && m.provider === 'google')).map(m => m.id);
      setDiscoveredModels(local);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestInference = async () => {
    setTestingInference(true);
    setInferenceResult(null);
    setInferenceError(null);
    try {
      const res = await testModelInference(
        selectedProvider,
        selectedModel,
        "Generate a 1-sentence sovereign growth value proposition for Sigma Tactix."
      );
      setInferenceResult({
        text: res.text,
        model: res.model,
        provider: res.provider,
        durationMs: res.durationMs,
        totalTokens: res.totalTokens,
        costUsd: res.costUsd
      });
      loadData();
    } catch (err: any) {
      setInferenceError(err.message || "Failed to execute model handshake test");
    } finally {
      setTestingInference(false);
    }
  };

  const handleChangeTier = async (newTier: string) => {
    try {
      const res = await createCheckoutSession(newTier);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      notifyError('Stripe Checkout Failed', err.message || 'Could not start checkout session.');
    }
  };

  const handleProvisionClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    provisionWorkspace({
      name: newClientName.trim(),
      domain: newClientDomain.trim() || 'client.com',
      tier: newClientTier,
      region: 'AWS eu-central-1 (Frankfurt)',
    });
    setIsProvisionModalOpen(false);
    setNewClientName('');
    setNewClientDomain('');
  };

  return (
    <div className="space-y-10 lg:space-y-12 pb-20">
      {/* Top Banner Header Surface */ }
      <div className="sigma-page-header p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Badge variant="vermilion" size="sm">
                <ShieldCheck size={ 13 } className="mr-1" /> Sovereign Architecture
              </Badge>
              <span className="text-xs font-mono text-[var(--sigma-text-muted)]">Token Metering &amp; Unit Economics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.015em] text-[var(--sigma-text)]">
              Admin Command Center
            </h1>
            <p className="text-[var(--sigma-text-muted)] text-sm max-w-2xl leading-relaxed">
              Oversee isolated client enclaves, measure exact token consumption per AI model, configure API credentials, and monitor monthly agency profit margins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={ loadData }
              disabled={ loading }
              isLoading={ loading }
              icon={ !loading ? <RefreshCw size={ 14 } /> : undefined }
              title="Refresh Telemetry"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={ () => setIsProvisionModalOpen(true) }
              icon={ <Plus size={ 14 } /> }
            >
              Provision Client Enclave
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */ }
      <div className="overflow-x-auto pb-1">
        <Tabs
          tabs={ [
            { id: 'TELEMETRY', label: 'Token Economics', icon: <Coins size={ 14 } /> },
            { id: 'AI_CONFIG', label: 'AI Models & Local LLMs', icon: <Cpu size={ 14 } /> },
            { id: 'SYSTEM_PROMPTS', label: 'Agent Prompts', icon: <Sparkles size={ 14 } /> },
            { id: 'MAILBOXES', label: 'Agent Mailboxes', icon: <Mail size={ 14 } /> },
            { id: 'SKILLS_MCP', label: 'Skills & MCP', icon: <Zap size={ 14 } /> },
            { id: 'CRON_JOBS', label: 'Cron Daemons', icon: <Calendar size={ 14 } /> },
            { id: 'HARNESS_VIEW', label: 'Topology', icon: <Layers size={ 14 } /> },
            { id: 'TENANTS', label: 'Client Workspaces', icon: <Building size={ 14 } /> },
            { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: <ShieldCheck size={ 14 } /> },
          ] }
          activeTab={ activeTab }
          onChange={ (id) => setActiveTab(id as ActiveTab) }
        />
      </div>

      {/* TAB 1: TOKEN METERING & PROFITABILITY */ }
      { activeTab === 'TELEMETRY' && (
        <div className="space-y-8">
          {/* Top KPI Scorecards */ }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard className="p-5" spotlight>
              <div className="flex items-center justify-between text-[var(--sigma-text-muted)] mb-2 font-mono text-xs uppercase">
                <span>Total Tokens Metered</span>
                <Coins size={ 16 } className="text-[var(--sigma-primary)]" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[var(--sigma-text)]">
                { (telemetry?.totalTokens || 0).toLocaleString() }
              </div>
              <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2 font-mono flex items-center justify-between">
                <span>Prompt: { (telemetry?.promptTokens || 0).toLocaleString() }</span>
                <span>Output: { (telemetry?.candidateTokens || 0).toLocaleString() }</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5" spotlight>
              <div className="flex items-center justify-between text-[var(--sigma-text-muted)] mb-2 font-mono text-xs uppercase">
                <span>Cumulative Compute Cost</span>
                <Cpu size={ 16 } className="text-amber-accent" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-accent">
                ${ (telemetry?.totalCostUsd || 0).toFixed(4) } <span className="text-xs font-mono text-[var(--sigma-text-muted)] font-normal">USD</span>
              </div>
              <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2 font-mono">
                Across { telemetry?.totalCalls || 0 } recorded AI operations
              </div>
            </GlassCard>

            <GlassCard className="p-5" spotlight>
              <div className="flex items-center justify-between text-[var(--sigma-text-muted)] mb-2 font-mono text-xs uppercase">
                <span>Monthly Client Retainer</span>
                <DollarSign size={ 16 } className="text-emerald-accent" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-accent">
                ${ telemetry?.profitability.monthlyRetainerUsd || 1499 }
              </div>
              <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2 font-mono">
                Tier: { telemetry?.profitability.tierDisplayName || 'Growth OS' }
              </div>
            </GlassCard>

            <GlassCard className="p-5" spotlight>
              <div className="flex items-center justify-between text-[var(--sigma-text-muted)] mb-2 font-mono text-xs uppercase">
                <span>Agency Gross Margin</span>
                <TrendingUp size={ 16 } className="text-emerald-accent" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-accent">
                { telemetry?.profitability.grossMarginPct || 97.4 }%
              </div>
              <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2 font-mono flex items-center gap-2">
                <span className="text-emerald-accent font-semibold font-mono">${ (telemetry?.profitability.netProfitUsd || 1459.8).toFixed(2) }</span>
                <span>net profit / mo</span>
              </div>
            </GlassCard>
          </div>

          {/* Interactive Profitability & Unit Economics Calculator */ }
          <GlassCard className="p-6 md:p-8 space-y-6" spotlight>
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-[var(--sigma-border)] pb-6">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-bold mb-1 flex items-center gap-2">
                  <Sliders size={ 14 } /> Client Economics Simulation Engine
                </div>
                <h3 className="text-2xl font-bold text-[var(--sigma-text)]">Agency Margin & Profitability Calculator</h3>
                <p className="text-[var(--sigma-text-muted)] text-sm mt-1">
                  Simulate monthly agency profit when delivering Sigma Tactix Growth OS to client accounts based on AI model selection and task intensity.
                </p>
              </div>

              <div className="px-5 py-2.5 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center gap-3">
                <span className="text-xs font-mono text-[var(--sigma-text-muted)]">ROI Multiple:</span>
                <span className="text-base font-mono font-bold text-accent">{ simulatedProfitability.roiMultiplier }x</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */ }
              <div className="lg:col-span-7 space-y-6">
                {/* Retainer Slider */ }
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--sigma-text-muted)] uppercase">Client Monthly Retainer Fee</span>
                    <span className="text-accent font-bold text-sm">${ calcRetainer.toLocaleString() } / mo</span>
                  </div>
                  <input
                    type="range"
                    min="499"
                    max="5000"
                    step="100"
                    value={ calcRetainer }
                    onChange={ (e) => setCalcRetainer(Number(e.target.value)) }
                    className="w-full accent-accent cursor-pointer h-2 bg-[var(--sigma-surface-subtle)] rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-[var(--sigma-text-muted)]">
                    <span>Starter ($499)</span>
                    <span>Growth ($1,499)</span>
                    <span>Enterprise ($3,499)</span>
                    <span>Custom ($5,000)</span>
                  </div>
                </div>

                {/* Task Volume Slider */ }
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--sigma-text-muted)] uppercase">Monthly Autonomous Agent Tasks</span>
                    <span className="text-[var(--sigma-text)] font-bold">{ calcTasksPerMonth } tasks / mo</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={ calcTasksPerMonth }
                    onChange={ (e) => setCalcTasksPerMonth(Number(e.target.value)) }
                    className="w-full accent-accent cursor-pointer h-2 bg-[var(--sigma-surface-subtle)] rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-[var(--sigma-text-muted)]">
                    <span>10 tasks</span>
                    <span>50 tasks</span>
                    <span>100 tasks</span>
                    <span>200 tasks</span>
                  </div>
                </div>

                {/* Model Selection */ }
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[var(--sigma-text-muted)] uppercase">Underlying AI Inference Model</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    { [
                      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', rate: '$0.075/1M', rec: true },
                      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', rate: '$1.25/1M' },
                      { id: 'gpt-4o', name: 'GPT-4o', rate: '$2.50/1M' },
                      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', rate: '$3.00/1M' },
                    ].map(m => (
                      <button
                        key={ m.id }
                        type="button"
                        onClick={ () => setCalcModel(m.id) }
                        className={ cn(
                          "p-3 rounded-xl border text-left transition-all",
                          calcModel === m.id
                            ? "bg-accent/15 border-accent text-[var(--sigma-text)] shadow-lg"
                            : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                        ) }
                      >
                        <div className="text-xs font-bold truncate">{ m.name }</div>
                        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">{ m.rate }</div>
                        { m.rec && <span className="text-[11px] font-mono text-accent font-bold mt-1 block">RECOMMENDED</span> }
                      </button>
                    )) }
                  </div>

                  {/* Complete Multi-Model Catalog Selector */ }
                  <div className="pt-2">
                    <label className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase mb-1 block">
                      Or Select from All Available Models ({ ALL_AI_MODELS.length } Models across Google, Anthropic, OpenAI, OpusMax Pro, OpenAI Account, Grok, Qwen, DeepSeek, GLM):
                    </label>
                    <select
                      value={ calcModel }
                      onChange={ (e) => setCalcModel(e.target.value) }
                      className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                    >
                      { ['google', 'anthropic', 'openai', 'xai', 'qwen', 'deepseek', 'glm'].map(prov => (
                        <optgroup key={ prov } label={ prov.toUpperCase() }>
                          { ALL_AI_MODELS.filter(m => m.provider === prov).map(m => (
                            <option key={ m.id } value={ m.id }>
                              { m.name } — In: ${ m.promptPer1M }/1M | Out: ${ m.candidatePer1M }/1M ({ m.recommendedRole })
                            </option>
                          )) }
                        </optgroup>
                      )) }
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time Profit Ledger */ }
              <div className="lg:col-span-5 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="text-xs font-mono uppercase tracking-wider text-[var(--sigma-text-muted)] font-bold flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
                  <span>Unit Economics Breakdown</span>
                  <span className="text-[11px] text-accent font-mono">1 Tenant / Month</span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--sigma-text)]">Client Retainer Revenue</span>
                    <span className="text-emerald-accent font-bold">+ ${ calcRetainer.toFixed(2) }</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--sigma-text-muted)]">Estimated AI Compute ({ calcTasksPerMonth } runs)</span>
                    <span className="text-amber-accent font-bold">- ${ simulatedProfitability.aiTokenCostUsd.toFixed(2) }</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--sigma-text-muted)]">Sovereign Cloud & Vector DB Allocation</span>
                    <span className="text-rose-accent font-bold">- $35.00</span>
                  </div>

                  <div className="pt-3 border-t border-[var(--sigma-border)] flex items-center justify-between text-sm">
                    <span className="text-[var(--sigma-text)] font-bold">Net Agency Profit</span>
                    <span className="text-emerald-accent font-black text-base">+ ${ simulatedProfitability.netProfitUsd.toFixed(2) }</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--sigma-text-muted)]">Gross Profit Margin</span>
                    <span className="text-accent font-bold text-sm">{ simulatedProfitability.grossMarginPct }%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--sigma-border)] text-xs text-[var(--sigma-text-muted)] leading-relaxed font-sans">
                  💡 <strong className="text-[var(--sigma-text)]">Strategic takeaway:</strong> Running on <strong className="text-[var(--sigma-text)]">Gemini 2.5 Flash</strong> keeps inference cost under <strong className="text-emerald-accent font-mono">$5/month</strong> even on heavy agent workloads, preserving an exceptional <strong className="text-emerald-accent font-mono">~97% gross margin</strong> on every managed client retainer.
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Model & Action Breakdown Cards */ }
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By AI Model */ }
            <GlassCard className="p-5 space-y-4" spotlight>
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={ 16 } className="text-[var(--sigma-primary)]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)]">Token Usage By Model</h4>
                </div>
                <Badge variant="neutral" size="xs">{ Object.keys(telemetry?.byModel || {}).length } Models Active</Badge>
              </div>

              <div className="space-y-2.5">
                { Object.entries(telemetry?.byModel || {}).length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-[var(--sigma-text-muted)]">
                    No token usage recorded yet. Run an agent task to populate telemetry.
                  </div>
                ) : (
                  Object.entries(telemetry?.byModel || {}).map(([model, data]) => (
                    <div key={ model } className="p-3 bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[var(--sigma-text)] font-mono">{ model }</div>
                        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">{ data.calls } calls executed</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[var(--sigma-primary)] font-mono">{ data.totalTokens.toLocaleString() } tokens</div>
                        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">${ data.costUsd.toFixed(6) } USD</div>
                      </div>
                    </div>
                  ))
                ) }
              </div>
            </GlassCard>

            {/* By Action / Module */ }
            <GlassCard className="p-5 space-y-4" spotlight>
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={ 16 } className="text-[var(--sigma-primary)]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)]">Consumption By Action</h4>
                </div>
                <Badge variant="neutral" size="xs">{ Object.keys(telemetry?.byAction || {}).length } Action Types</Badge>
              </div>

              <div className="space-y-2.5">
                { Object.entries(telemetry?.byAction || {}).length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-[var(--sigma-text-muted)]">
                    No operational actions recorded yet.
                  </div>
                ) : (
                  Object.entries(telemetry?.byAction || {}).map(([action, data]) => (
                    <div key={ action } className="p-3 bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[var(--sigma-text)] font-mono">{ action }</div>
                        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">{ data.calls } executions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-accent font-mono">{ data.totalTokens.toLocaleString() } tokens</div>
                        <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">${ data.costUsd.toFixed(6) } USD</div>
                      </div>
                    </div>
                  ))
                ) }
              </div>
            </GlassCard>
          </div>

          {/* Live Recent AI Operations Feed */ }
          <GlassCard className="overflow-hidden">
            <div className="p-5 border-b border-[var(--sigma-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={ 16 } className="text-[var(--sigma-primary)]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)]">Live AI Execution Stream & Metered Costs</h4>
              </div>
              <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">
                { telemetry?.recentRecords?.length || 0 } recent transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[var(--sigma-bg-subtle)] border-b border-[var(--sigma-border)] text-[var(--sigma-text-muted)] uppercase text-[11px]">
                    <th className="px-5 py-3">Action / Scope</th>
                    <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3 text-center">Prompt Tokens</th>
                    <th className="px-5 py-3 text-center">Candidate Tokens</th>
                    <th className="px-5 py-3 text-center">Total Tokens</th>
                    <th className="px-5 py-3 text-right">Computed Cost</th>
                    <th className="px-5 py-3 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sigma-border)] text-[var(--sigma-text-secondary)]">
                  { telemetry?.recentRecords && telemetry.recentRecords.length > 0 ? (
                    telemetry.recentRecords.map((rec) => (
                      <tr key={ rec.id } className="hover:bg-[var(--sigma-border)]/10 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-[var(--sigma-text)]">{ rec.actionType }</div>
                          { rec.agentId && <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">Agent: { rec.agentId }</div> }
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] text-[11px] text-[var(--sigma-text)]">
                            { rec.modelName }
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-[var(--sigma-text-muted)]">{ rec.promptTokens.toLocaleString() }</td>
                        <td className="px-5 py-3 text-center text-[var(--sigma-text-muted)]">{ rec.candidateTokens.toLocaleString() }</td>
                        <td className="px-5 py-3 text-center font-semibold text-[var(--sigma-primary)]">{ rec.totalTokens.toLocaleString() }</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-accent">
                          ${ Number(rec.estimatedCostUsd).toFixed(6) }
                        </td>
                        <td className="px-5 py-3 text-right text-[var(--sigma-text-muted)]">
                          { rec.durationMs ? `${rec.durationMs}ms` : '—' }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={ 7 } className="px-5 py-10 text-center text-[var(--sigma-text-muted)]">
                        No transactions recorded yet. Trigger content generation or agent runs to see metered token streams.
                      </td>
                    </tr>
                  ) }
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) }

      {/* TAB 2: AI MODEL CONFIG & KEY VAULT (2026 FRONTIER & LOCAL LLMS) */ }
      { activeTab === 'AI_CONFIG' && (
        <AIModelConfigTab
          providers={ providers }
          onRefreshProviders={ loadData }
        />
      ) }

      {/* TAB 3: AGENT & SUB-AGENT SYSTEM PROMPTS SUITE */ }
      { activeTab === 'SYSTEM_PROMPTS' && (
        <AgentSystemPromptsTab />
      ) }

      {/* TAB: AGENT CORPORATE MAILBOXES & EMAIL DISPATCH IDENTITIES */ }
      { activeTab === 'MAILBOXES' && (
        <AgentMailboxesTab />
      ) }

      {/* TAB 4: PRODUCTION SKILLS & MCP MARKETPLACE */ }
      { activeTab === 'SKILLS_MCP' && (
        <ProductionSkillsMCPTab />
      ) }

      {/* TAB 5: AUTONOMOUS CRON DAEMONS */ }
      { activeTab === 'CRON_JOBS' && (
        <CronJobsManagerTab />
      ) }

      {/* TAB 6: FULL HARNESS EXPLODED TOPOLOGY */ }
      { activeTab === 'HARNESS_VIEW' && (
        <FullHarnessExplodedView />
      ) }

      {/* TAB 3: CLIENT WORKSPACES & TIERS */ }
      { activeTab === 'TENANTS' && (
        <div className="space-y-6">
          {/* Active Tier Entitlement Banner */ }
          <GlassCard className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-wider mb-1">Current Active Workspace Plan</div>
              <div className="text-xl font-bold text-[var(--sigma-text)] flex items-center gap-3">
                { TIER_RETAINERS[activeTier]?.name || 'Growth OS' }
                <Badge variant="vermilion" size="sm">
                  ${ TIER_RETAINERS[activeTier]?.priceMonthly || 1499 } / mo
                </Badge>
              </div>
              <p className="text-xs text-[var(--sigma-text-muted)] mt-1">
                Entitlement policies govern unlocked Growth Modules and agent execution quotas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={ () => handleChangeTier('starter') }
                className={ cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer",
                  activeTier === 'starter' ? "bg-[var(--sigma-primary)] text-white font-semibold border-[var(--sigma-primary)]" : "bg-[var(--sigma-bg-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                ) }
              >
                Starter ($499)
              </button>
              <button
                onClick={ () => handleChangeTier('growth') }
                className={ cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer",
                  activeTier === 'growth' ? "bg-[var(--sigma-primary)] text-white font-semibold border-[var(--sigma-primary)]" : "bg-[var(--sigma-bg-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                ) }
              >
                Growth ($1,499)
              </button>
              <button
                onClick={ () => handleChangeTier('enterprise') }
                className={ cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer",
                  activeTier === 'enterprise' ? "bg-[var(--sigma-primary)] text-white font-semibold border-[var(--sigma-primary)]" : "bg-[var(--sigma-bg-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]"
                ) }
              >
                Enterprise ($3,499)
              </button>
            </div>
          </GlassCard>

          {/* Workspaces Table */ }
          <GlassCard className="overflow-hidden">
            <div className="p-5 border-b border-[var(--sigma-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building size={ 16 } className="text-[var(--sigma-primary)]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--sigma-text)]">Sovereign Tenant Enclaves</h4>
              </div>
              <Badge variant="neutral" size="xs">{ workspaces.length } Enclaves Provisioned</Badge>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[var(--sigma-bg-subtle)] border-b border-[var(--sigma-border)] text-[var(--sigma-text-muted)] uppercase text-[11px]">
                  <th className="px-5 py-3">Client / Brand Enclave</th>
                  <th className="px-5 py-3">Domain</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Plan Tier</th>
                  <th className="px-5 py-3">Security Partition</th>
                  <th className="px-5 py-3 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sigma-border)] text-[var(--sigma-text-secondary)]">
                { workspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspaceId;
                  return (
                    <tr
                      key={ ws.id }
                      className={ cn(
                        "hover:bg-[var(--sigma-border)]/10 transition-colors",
                        isActive && "bg-[var(--sigma-primary)]/[0.04] border-l-2 border-l-[var(--sigma-primary)]"
                      ) }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[var(--sigma-text)] text-xs">{ ws.name }</div>
                          { isActive && (
                            <Badge variant="vermilion" size="xs">
                              ACTIVE
                            </Badge>
                          ) }
                        </div>
                        <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">ID: { ws.id } • Created { ws.createdAt }</div>
                      </td>
                      <td className="px-5 py-3 text-[var(--sigma-primary)] font-medium">{ ws.domain }</td>
                      <td className="px-5 py-3 text-[var(--sigma-text-muted)]">{ ws.region }</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] text-[11px] uppercase font-semibold text-[var(--sigma-text)]">
                          { ws.tier }
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--sigma-text-muted)]">{ ws.vaultSecurity }</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          { isActive ? (
                            <Badge variant="success" size="xs" dot>
                              ACTIVE
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={ () => switchWorkspace(ws.id) }
                            >
                              Switch To
                            </Button>
                          ) }
                          { ws.id !== 'ws-primary' && (
                            pendingTerminateId === ws.id ? (
                              <span className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-rose-accent">Purge { ws.name }?</span>
                                <button
                                  type="button"
                                  onClick={ () => confirmTerminate(ws.id) }
                                  className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-accent text-[11px] font-semibold border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                >
                                  Terminate
                                </button>
                                <button
                                  type="button"
                                  onClick={ disarmTerminate }
                                  className="px-2 py-0.5 rounded-md bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)] text-[11px] font-medium border border-[var(--sigma-border)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer"
                                >
                                  Keep
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={ () => armTerminate(ws.id) }
                                className="p-1 text-[var(--sigma-text-muted)] hover:text-rose-accent hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Terminate Client Enclave"
                                aria-label={ `Terminate and purge ${ws.name}` }
                              >
                                <X size={ 14 } />
                              </button>
                            )
                          ) }
                        </div>
                      </td>
                    </tr>
                  );
                }) }
              </tbody>
            </table>
          </GlassCard>
        </div>
      ) }

      {/* TAB 4: ENTERPRISE AUDIT LOGS */ }
      { activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-6">
          <TenantAuditLogSystem tenants={ workspaces.map(w => ({
            id: w.id,
            name: w.name,
            region: w.region,
            users: 1,
            plan: w.tier,
            status: w.status,
            spend: `$${TIER_RETAINERS[w.tier]?.priceMonthly || 1499}/mo`,
            uptime: '100.0%',
            vaultStatus: '10/10 Encrypted'
          })) } />
        </div>
      ) }

      {/* Provision Client Modal */ }
      <AnimatePresence>
        { isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={ { scale: 0.95, opacity: 0 } }
              animate={ { scale: 1, opacity: 1 } }
              exit={ { scale: 0.95, opacity: 0 } }
              className="bg-[var(--sigma-bg)] border border-[var(--sigma-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 glass-panel"
            >
              <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--sigma-primary)]/10 border border-[var(--sigma-primary)]/20 flex items-center justify-center text-[var(--sigma-primary)]">
                    <Building size={ 16 } />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--sigma-text)]">Provision New Client Enclave</h3>
                </div>
                <button
                  onClick={ () => setIsProvisionModalOpen(false) }
                  className="p-1 hover:bg-[var(--sigma-bg-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer"
                >
                  <X size={ 18 } />
                </button>
              </div>

              <form onSubmit={ handleProvisionClient } className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Client Organization Name</label>
                  <input
                    type="text"
                    required
                    value={ newClientName }
                    onChange={ (e) => setNewClientName(e.target.value) }
                    placeholder="e.g. Apex Health Technologies"
                    className="w-full bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] font-mono transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Client Domain URL</label>
                  <input
                    type="text"
                    required
                    value={ newClientDomain }
                    onChange={ (e) => setNewClientDomain(e.target.value) }
                    placeholder="e.g. apexhealth.com"
                    className="w-full bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] font-mono transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-[var(--sigma-text-muted)]">Initial Subscription Tier</label>
                  <select
                    value={ newClientTier }
                    onChange={ (e) => setNewClientTier(e.target.value as any) }
                    className="w-full bg-[var(--sigma-bg-subtle)] border border-[var(--sigma-border)] rounded-xl p-2.5 text-xs text-[var(--sigma-text)] focus:outline-none focus:border-[var(--sigma-primary)] font-mono transition-colors"
                  >
                    <option value="starter">Starter OS ($499/mo)</option>
                    <option value="growth">Growth OS ($1,499/mo)</option>
                    <option value="enterprise">Enterprise OS ($3,499/mo)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-[var(--sigma-border)] flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={ () => setIsProvisionModalOpen(false) }
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    Provision Enclave
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        ) }
      </AnimatePresence>
    </div>
  );
}
