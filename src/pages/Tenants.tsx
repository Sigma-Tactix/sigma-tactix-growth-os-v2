import React, { useState, useEffect, useMemo } from 'react';
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
  getBillingTiers,
  testModelInference
} from '@/src/lib/api';
import { TokenTelemetrySummary, AIKeyConfig, ClientWorkspace } from '@/src/types';
import { calculateTokenCost, computeProfitability, TIER_RETAINERS, MODEL_PRICING, ALL_AI_MODELS } from '@/src/lib/tokenCostEngine';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';

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

const ALL_SUPPORTED_PROVIDERS = [
  { provider: 'google', name: 'Google Cloud (Gemini)', defaultModel: 'gemini-2.5-flash', live: true, priceRange: '$0.075 – $1.25 / 1M' },
  { provider: 'anthropic', name: 'Anthropic (Claude)', defaultModel: 'claude-3-5-sonnet', live: false, priceRange: '$0.80 – $15.00 / 1M' },
  { provider: 'openai', name: 'OpenAI (GPT & o-Series)', defaultModel: 'gpt-4o', live: false, priceRange: '$0.15 – $15.00 / 1M' },
  { provider: 'xai', name: 'xAI (Grok)', defaultModel: 'grok-2-1212', live: false, priceRange: '$2.00 – $5.00 / 1M' },
  { provider: 'qwen', name: 'Alibaba Cloud (Qwen)', defaultModel: 'qwen-2.5-72b', live: false, priceRange: '$0.05 – $1.60 / 1M' },
  { provider: 'deepseek', name: 'DeepSeek AI', defaultModel: 'deepseek-v3', live: false, priceRange: '$0.14 – $0.55 / 1M' },
  { provider: 'glm', name: 'Zhipu AI (GLM)', defaultModel: 'glm-4-plus', live: false, priceRange: '$0.01 – $1.40 / 1M' },
];

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
        getAIProviderKeys().catch(() => []),
        getWorkspaceTier().catch(() => null),
        getBillingTiers().catch(() => []),
      ]);

      if (telemData) setTelemetry(telemData);
      
      // Merge retrieved keys with complete 7-provider catalog
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
          configured: sp.live,
          model: sp.defaultModel,
          live: sp.live
        };
      });
      setProviders(mergedProviders);

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
      if (tabParam && ['TELEMETRY', 'AI_CONFIG', 'SYSTEM_PROMPTS', 'SKILLS_MCP', 'CRON_JOBS', 'HARNESS_VIEW', 'TENANTS', 'AUDIT_LOGS'].includes(tabParam)) {
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
      await setWorkspaceTier(newTier);
      setActiveTier(newTier);
      updateWorkspaceTier(currentWorkspace.id, newTier as any);
      setCalcRetainer(TIER_RETAINERS[newTier]?.priceMonthly || 1499);
      await loadData();
    } catch (err: any) {
      alert(`Could not change tier: ${err.message}`);
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
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.4em] font-black mb-3 flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent" /> Sovereign Architecture • Token Metering & Unit Economics
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black amber-text tracking-tighter">Admin Command Center</h1>
          <p className="text-zinc-400 text-base max-w-2xl mt-2 leading-relaxed font-sans">
            Oversee isolated client enclaves, measure exact token consumption per AI model, configure API model credentials, and monitor monthly agency profit margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-3.5 bg-surface border border-white/10 rounded-xl text-muted hover:text-white hover:border-white/20 transition-all shadow-lg flex items-center gap-2 text-xs font-mono"
            title="Refresh Telemetry"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin text-accent")} /> Refresh
          </button>
          <button 
            onClick={() => setIsProvisionModalOpen(true)}
            className="px-6 py-3.5 bg-accent text-background rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all amber-glow shadow-2xl flex items-center gap-2"
          >
            <Plus size={16} /> Provision Client Enclave
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('TELEMETRY')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'TELEMETRY'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Coins size={15} /> Token Economics
        </button>

        <button
          onClick={() => setActiveTab('AI_CONFIG')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'AI_CONFIG'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Cpu size={15} /> AI Frontier & Local LLMs
        </button>

        <button
          onClick={() => setActiveTab('SYSTEM_PROMPTS')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'SYSTEM_PROMPTS'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Sparkles size={15} /> Agent System Prompts
        </button>

        <button
          onClick={() => setActiveTab('MAILBOXES')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'MAILBOXES'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Mail size={15} /> Agent Mailboxes & Inboxes
        </button>

        <button
          onClick={() => setActiveTab('SKILLS_MCP')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'SKILLS_MCP'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Zap size={15} /> Skills & MCP Hub
        </button>

        <button
          onClick={() => setActiveTab('CRON_JOBS')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'CRON_JOBS'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Calendar size={15} /> Cron Daemons
        </button>

        <button
          onClick={() => setActiveTab('HARNESS_VIEW')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'HARNESS_VIEW'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Layers size={15} /> Exploded Topology
        </button>

        <button
          onClick={() => setActiveTab('TENANTS')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'TENANTS'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <Building size={15} /> Client Workspaces & Tiers
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={cn(
            "flex items-center gap-2 px-4 py-3.5 rounded-t-xl font-mono text-xs uppercase tracking-wider transition-all border-b-2 font-bold whitespace-nowrap",
            activeTab === 'AUDIT_LOGS'
              ? "bg-accent/10 text-accent border-accent shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "text-muted hover:text-white border-transparent hover:bg-white/[0.02]"
          )}
        >
          <ShieldCheck size={15} /> Enterprise Audit Logs
        </button>
      </div>

      {/* TAB 1: TOKEN METERING & PROFITABILITY */}
      {activeTab === 'TELEMETRY' && (
        <div className="space-y-10">
          {/* Top KPI Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between text-muted mb-3 font-mono text-[11px] uppercase tracking-wider">
                <span>Total Tokens Metered</span>
                <Coins size={18} className="text-accent" />
              </div>
              <div className="text-3xl font-heading font-black text-white">
                {(telemetry?.totalTokens || 0).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono flex items-center justify-between">
                <span>Prompt: {(telemetry?.promptTokens || 0).toLocaleString()}</span>
                <span>Output: {(telemetry?.candidateTokens || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between text-muted mb-3 font-mono text-[11px] uppercase tracking-wider">
                <span>Cumulative AI Compute Cost</span>
                <Cpu size={18} className="text-amber-400" />
              </div>
              <div className="text-3xl font-heading font-black text-amber-400">
                ${(telemetry?.totalCostUsd || 0).toFixed(4)} <span className="text-xs font-mono text-zinc-400">USD</span>
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono">
                Across {telemetry?.totalCalls || 0} recorded AI operations
              </div>
            </div>

            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between text-muted mb-3 font-mono text-[11px] uppercase tracking-wider">
                <span>Monthly Client Retainer</span>
                <DollarSign size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-heading font-black text-emerald-400">
                ${telemetry?.profitability.monthlyRetainerUsd || 1499}
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono">
                Assigned Tier: {telemetry?.profitability.tierDisplayName || 'Growth OS'}
              </div>
            </div>

            <div className="bg-surface/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between text-muted mb-3 font-mono text-[11px] uppercase tracking-wider">
                <span>Agency Gross Margin</span>
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-heading font-black text-emerald-400">
                {telemetry?.profitability.grossMarginPct || 97.4}%
              </div>
              <div className="text-xs text-zinc-400 mt-2 font-mono flex items-center gap-2">
                <span className="text-emerald-400 font-bold">${(telemetry?.profitability.netProfitUsd || 1459.8).toFixed(2)}</span>
                <span>net profit / mo</span>
              </div>
            </div>
          </div>

          {/* Interactive Profitability & Unit Economics Calculator */}
          <div className="bg-surface border border-accent/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold mb-1 flex items-center gap-2">
                  <Sliders size={14} /> Client Economics Simulation Engine
                </div>
                <h3 className="text-2xl font-bold text-white">Agency Margin & Profitability Calculator</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Simulate monthly agency profit when delivering Sigma Tactix Growth OS to client accounts based on AI model selection and task intensity.
                </p>
              </div>

              <div className="px-5 py-2.5 bg-black/60 border border-white/10 rounded-xl flex items-center gap-3">
                <span className="text-xs font-mono text-muted">ROI Multiple:</span>
                <span className="text-base font-mono font-bold text-accent">{simulatedProfitability.roiMultiplier}x</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Retainer Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted uppercase">Client Monthly Retainer Fee</span>
                    <span className="text-accent font-bold text-sm">${calcRetainer.toLocaleString()} / mo</span>
                  </div>
                  <input
                    type="range"
                    min="499"
                    max="5000"
                    step="100"
                    value={calcRetainer}
                    onChange={(e) => setCalcRetainer(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer h-2 bg-black/50 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>Starter ($499)</span>
                    <span>Growth ($1,499)</span>
                    <span>Enterprise ($3,499)</span>
                    <span>Custom ($5,000)</span>
                  </div>
                </div>

                {/* Task Volume Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted uppercase">Monthly Autonomous Agent Tasks</span>
                    <span className="text-white font-bold">{calcTasksPerMonth} tasks / mo</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={calcTasksPerMonth}
                    onChange={(e) => setCalcTasksPerMonth(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer h-2 bg-black/50 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>10 tasks</span>
                    <span>50 tasks</span>
                    <span>100 tasks</span>
                    <span>200 tasks</span>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted uppercase">Underlying AI Inference Model</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', rate: '$0.075/1M', rec: true },
                      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', rate: '$1.25/1M' },
                      { id: 'gpt-4o', name: 'GPT-4o', rate: '$2.50/1M' },
                      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', rate: '$3.00/1M' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCalcModel(m.id)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          calcModel === m.id
                            ? "bg-accent/15 border-accent text-white shadow-lg"
                            : "bg-black/30 border-white/10 text-muted hover:text-white"
                        )}
                      >
                        <div className="text-xs font-bold truncate">{m.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{m.rate}</div>
                        {m.rec && <span className="text-[9px] font-mono text-accent font-bold mt-1 block">RECOMMENDED</span>}
                      </button>
                    ))}
                  </div>

                  {/* Complete Multi-Model Catalog Selector */}
                  <div className="pt-2">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase mb-1 block">
                      Or Select from All Available Models ({ALL_AI_MODELS.length} Models across Google, Anthropic, OpenAI, Grok, Qwen, DeepSeek, GLM):
                    </label>
                    <select
                      value={calcModel}
                      onChange={(e) => setCalcModel(e.target.value)}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                    >
                      {['google', 'anthropic', 'openai', 'xai', 'qwen', 'deepseek', 'glm'].map(prov => (
                        <optgroup key={prov} label={prov.toUpperCase()}>
                          {ALL_AI_MODELS.filter(m => m.provider === prov).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} — In: ${m.promptPer1M}/1M | Out: ${m.candidatePer1M}/1M ({m.recommendedRole})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time Profit Ledger */}
              <div className="lg:col-span-5 bg-black/50 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="text-xs font-mono uppercase tracking-wider text-muted font-bold flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Unit Economics Breakdown</span>
                  <span className="text-[10px] text-accent font-mono">1 Tenant / Month</span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Client Retainer Revenue</span>
                    <span className="text-emerald-400 font-bold">+ ${calcRetainer.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Estimated AI Compute ({calcTasksPerMonth} runs)</span>
                    <span className="text-amber-400 font-bold">- ${simulatedProfitability.aiTokenCostUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Sovereign Cloud & Vector DB Allocation</span>
                    <span className="text-red-400 font-bold">- $35.00</span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-white font-bold">Net Agency Profit</span>
                    <span className="text-emerald-400 font-black text-base">+ ${simulatedProfitability.netProfitUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Gross Profit Margin</span>
                    <span className="text-accent font-bold text-sm">{simulatedProfitability.grossMarginPct}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-400 leading-relaxed font-sans">
                  💡 <strong>Strategic takeaway:</strong> Running on <strong>Gemini 2.5 Flash</strong> keeps inference cost under <strong>$5/month</strong> even on heavy agent workloads, preserving an exceptional <strong>~97% gross margin</strong> on every managed client retainer.
                </div>
              </div>
            </div>
          </div>

          {/* Model & Action Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* By AI Model */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-accent" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Token Usage By Model</h4>
                </div>
                <span className="text-xs font-mono text-muted">{Object.keys(telemetry?.byModel || {}).length} Models Active</span>
              </div>

              <div className="space-y-3">
                {Object.entries(telemetry?.byModel || {}).length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">
                    No token usage recorded yet. Run an agent task or creative generation to populate telemetry.
                  </div>
                ) : (
                  Object.entries(telemetry?.byModel || {}).map(([model, data]) => (
                    <div key={model} className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{model}</div>
                        <div className="text-[10px] font-mono text-muted mt-0.5">{data.calls} calls executed</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-accent font-mono">{data.totalTokens.toLocaleString()} tokens</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">${data.costUsd.toFixed(6)} USD</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* By Action / Module */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-secondary" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">Consumption By Action</h4>
                </div>
                <span className="text-xs font-mono text-muted">{Object.keys(telemetry?.byAction || {}).length} Action Types</span>
              </div>

              <div className="space-y-3">
                {Object.entries(telemetry?.byAction || {}).length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">
                    No operational actions recorded yet.
                  </div>
                ) : (
                  Object.entries(telemetry?.byAction || {}).map(([action, data]) => (
                    <div key={action} className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-zinc-200 font-mono">{action}</div>
                        <div className="text-[10px] font-mono text-muted mt-0.5">{data.calls} executions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-secondary font-mono">{data.totalTokens.toLocaleString()} tokens</div>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">${data.costUsd.toFixed(6)} USD</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Live Recent AI Operations Feed */}
          <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className="text-accent" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Live AI Execution Stream & Metered Costs</h4>
              </div>
              <span className="text-xs font-mono text-muted">
                Showing {telemetry?.recentRecords?.length || 0} recent transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10 text-muted uppercase text-[10px] tracking-wider">
                    <th className="px-6 py-4">Action / Scope</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4 text-center">Prompt Tokens</th>
                    <th className="px-6 py-4 text-center">Candidate Tokens</th>
                    <th className="px-6 py-4 text-center">Total Tokens</th>
                    <th className="px-6 py-4 text-right">Computed Cost</th>
                    <th className="px-6 py-4 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {telemetry?.recentRecords && telemetry.recentRecords.length > 0 ? (
                    telemetry.recentRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{rec.actionType}</div>
                          {rec.agentId && <div className="text-[10px] text-muted mt-0.5">Agent: {rec.agentId}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300">
                            {rec.modelName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-400">{rec.promptTokens.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center text-zinc-400">{rec.candidateTokens.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-bold text-accent">{rec.totalTokens.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-amber-400">
                          ${Number(rec.estimatedCostUsd).toFixed(6)}
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-500">
                          {rec.durationMs ? `${rec.durationMs}ms` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No transactions recorded yet. Trigger content generation or agent runs to see metered token streams.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI MODEL CONFIG & KEY VAULT (2026 FRONTIER & LOCAL LLMS) */}
      {activeTab === 'AI_CONFIG' && (
        <AIModelConfigTab 
          providers={providers} 
          onRefreshProviders={loadData} 
        />
      )}

      {/* TAB 3: AGENT & SUB-AGENT SYSTEM PROMPTS SUITE */}
      {activeTab === 'SYSTEM_PROMPTS' && (
        <AgentSystemPromptsTab />
      )}

      {/* TAB: AGENT CORPORATE MAILBOXES & EMAIL DISPATCH IDENTITIES */}
      {activeTab === 'MAILBOXES' && (
        <AgentMailboxesTab />
      )}

      {/* TAB 4: PRODUCTION SKILLS & MCP MARKETPLACE */}
      {activeTab === 'SKILLS_MCP' && (
        <ProductionSkillsMCPTab />
      )}

      {/* TAB 5: AUTONOMOUS CRON DAEMONS */}
      {activeTab === 'CRON_JOBS' && (
        <CronJobsManagerTab />
      )}

      {/* TAB 6: FULL HARNESS EXPLODED TOPOLOGY */}
      {activeTab === 'HARNESS_VIEW' && (
        <FullHarnessExplodedView />
      )}

      {/* TAB 3: CLIENT WORKSPACES & TIERS */}
      {activeTab === 'TENANTS' && (
        <div className="space-y-8">
          {/* Active Tier Entitlement Banner */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Current Active Workspace Plan</div>
              <div className="text-2xl font-heading font-black text-white flex items-center gap-3">
                {TIER_RETAINERS[activeTier]?.name || 'Growth OS'}
                <span className="text-xs font-mono px-3 py-1 bg-accent/10 border border-accent/30 text-accent rounded-full font-bold">
                  ${TIER_RETAINERS[activeTier]?.priceMonthly || 1499} / mo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Entitlement policies govern which of the 12 Growth Modules and agent execution quotas are unlocked.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleChangeTier('starter')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-mono transition-all border",
                  activeTier === 'starter' ? "bg-accent text-background font-bold border-accent" : "bg-black/40 border-white/10 text-muted hover:text-white"
                )}
              >
                Starter ($499)
              </button>
              <button
                onClick={() => handleChangeTier('growth')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-mono transition-all border",
                  activeTier === 'growth' ? "bg-accent text-background font-bold border-accent" : "bg-black/40 border-white/10 text-muted hover:text-white"
                )}
              >
                Growth ($1,499)
              </button>
              <button
                onClick={() => handleChangeTier('enterprise')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-mono transition-all border",
                  activeTier === 'enterprise' ? "bg-accent text-background font-bold border-accent" : "bg-black/40 border-white/10 text-muted hover:text-white"
                )}
              >
                Enterprise ($3,499)
              </button>
            </div>
          </div>

          {/* Workspaces Table */}
          <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building size={18} className="text-accent" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Sovereign Tenant Enclaves</h4>
              </div>
              <span className="text-xs font-mono text-muted">{workspaces.length} Enclaves Provisioned</span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-black/40 border-b border-white/10 text-muted uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Client / Brand Enclave</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Infrastructure Region</th>
                  <th className="px-6 py-4">Plan Tier</th>
                  <th className="px-6 py-4">Security Partition</th>
                  <th className="px-6 py-4 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {workspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspaceId;
                  return (
                    <tr 
                      key={ws.id} 
                      className={cn(
                        "hover:bg-white/[0.02] transition-colors",
                        isActive && "bg-accent/[0.04] border-l-2 border-l-accent"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white text-sm">{ws.name}</div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[9px] bg-accent/20 border border-accent/40 text-accent font-bold">
                              CURRENT ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted">ID: {ws.id} • Created {ws.createdAt}</div>
                      </td>
                      <td className="px-6 py-4 text-accent font-bold">{ws.domain}</td>
                      <td className="px-6 py-4 text-zinc-400">{ws.region}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white">
                          {ws.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{ws.vaultSecurity}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ACTIVE
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => switchWorkspace(ws.id)}
                              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-accent hover:text-black border border-white/10 text-[10px] font-bold text-zinc-200 transition-all cursor-pointer"
                            >
                              Switch To
                            </button>
                          )}
                          {ws.id !== 'ws-primary' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Terminate and purge sovereign enclave for "${ws.name}"?`)) {
                                  deleteWorkspace(ws.id);
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Terminate Client Enclave"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ENTERPRISE AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-6">
          <TenantAuditLogSystem tenants={workspaces.map(w => ({
            id: w.id,
            name: w.name,
            region: w.region,
            users: 1,
            plan: w.tier,
            status: w.status,
            spend: `$${TIER_RETAINERS[w.tier]?.priceMonthly || 1499}/mo`,
            uptime: '100.0%',
            vaultStatus: '10/10 Encrypted'
          }))} />
        </div>
      )}

      {/* Provision Client Modal */}
      <AnimatePresence>
        {isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <Building size={20} className="text-accent" />
                  <h3 className="text-lg font-bold silver-text">Provision New Client Enclave</h3>
                </div>
                <button
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleProvisionClient} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Client Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Apex Health Technologies"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Client Domain URL</label>
                  <input
                    type="text"
                    required
                    value={newClientDomain}
                    onChange={(e) => setNewClientDomain(e.target.value)}
                    placeholder="e.g. apexhealth.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Initial Subscription Tier</label>
                  <select
                    value={newClientTier}
                    onChange={(e) => setNewClientTier(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  >
                    <option value="starter">Starter OS ($499/mo)</option>
                    <option value="growth">Growth OS ($1,499/mo)</option>
                    <option value="enterprise">Enterprise OS ($3,499/mo)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent text-background rounded-xl font-bold uppercase text-xs tracking-wider"
                  >
                    Provision Enclave
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
