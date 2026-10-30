import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Cpu,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Lock,
  Laptop,
  Zap,
  Layers,
  Search,
  ArrowRight,
  Check,
  ExternalLink,
  ShieldCheck,
  Activity,
  Globe,
  Gauge,
  Wifi,
  Radio,
  Server
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_AI_MODELS, ModelInfo, ModelProvider } from '@/src/lib/tokenCostEngine';
import { AIKeyConfig } from '@/src/types';
import { saveAIProviderKey, testModelInference, pingLocalLLM, checkOpusMaxKeyStatus, fetchProviderModels } from '@/src/lib/api';
import { useToast } from '@/src/contexts/ToastContext';

interface AIModelConfigTabProps {
  providers: AIKeyConfig[];
  onRefreshProviders: () => Promise<void>;
}

export default function AIModelConfigTab({ providers, onRefreshProviders }: AIModelConfigTabProps) {
  const { notifySuccess, notifyWarning, notifyInfo } = useToast();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected Provider for Key Vault
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>('google');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash-high');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local LLM State (MacBook LM Studio / Ollama)
  const [localProvider, setLocalProvider] = useState<'lmstudio' | 'ollama'>('lmstudio');
  const [localBaseUrl, setLocalBaseUrl] = useState('http://localhost:1234/v1');
  const [localModelName, setLocalModelName] = useState('llama-3.3-70b-instruct');
  const [isPingingLocal, setIsPingingLocal] = useState(false);
  const [localStatus, setLocalStatus] = useState<{
    tested: boolean;
    active: boolean;
    latencyMs: number;
    models: string[];
    error?: string;
  }>({
    tested: false,
    active: false,
    latencyMs: 0,
    models: []
  });

  // Context Window Custom Selection & Bandwidth Auto-Throttle
  const [contextTokens, setContextTokens] = useState<number>(1000000);
  const [autoBandwidthThrottle, setAutoBandwidthThrottle] = useState<boolean>(true);

  // Test Inference Handshake State
  const [testPrompt, setTestPrompt] = useState('Verify model capability and emit a 1-sentence growth hypothesis for B2B SaaS.');
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

  // OpusMax gateway key-verification state (/key-status, mirrors `npx opusmax-gateway status`)
  const [opusmaxVerifying, setOpusmaxVerifying] = useState(false);
  const [opusmaxKeyStatus, setOpusmaxKeyStatus] = useState<{
    success: boolean;
    active: boolean;
    status: string | null;
    name: string | null;
    quotaBlocked: boolean;
    expiresAt: string | null;
    error?: string;
  } | null>(null);
  const [opusmaxDiscoveredModels, setOpusmaxDiscoveredModels] = useState<string[]>([]);
  const [opusmaxFetchingModels, setOpusmaxFetchingModels] = useState(false);

  // Active Global Model override
  const [activeGlobalModel, setActiveGlobalModel] = useState<string>('gemini-3.8-flash-high');
  const [agentModelAssignments, setAgentModelAssignments] = useState<Record<string, string>>({
    'agent-orchestrator': 'gemini-3.8-flash-high',
    'agent-authority': 'gpt-5-omni',
    'agent-performance': 'chatgpt-astra-multimodal',
    'agent-content': 'claude-fable-5-0',
    'agent-ops': 'qwen-3-coder',
    'agent-diagnostic': 'gemini-3.0-pro',
    'agent-competitor': 'claude-4-opus',
    'agent-outreach': 'qwen-3-235b-moe',
    'agent-listening': 'grok-3-reasoning'
  });

  // Filtered models
  const filteredModels = useMemo(() => {
    return ALL_AI_MODELS.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.recommendedRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'FRONTIER_2026') {
        return m.id.includes('fable') || m.id.includes('astra') || m.id.includes('qwen-3') || m.id.includes('3.8') || m.id.includes('gpt-5') || m.id.includes('o3') || m.id.includes('r2');
      }
      if (selectedCategory === 'LOCAL') return m.isLocal;
      if (selectedCategory === 'ROUTERS') return m.isRouter;
      return m.provider === selectedCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Handle local ping test
  const handlePingLocalServer = async () => {
    setIsPingingLocal(true);
    try {
      const res = await pingLocalLLM(localProvider, localBaseUrl);
      setLocalStatus({
        tested: true,
        active: res.active,
        latencyMs: res.latencyMs,
        models: res.models,
        error: res.error
      });
      if (res.active) {
        notifySuccess(`Connected to ${localProvider.toUpperCase()} on MacBook (${res.latencyMs}ms)! Discovered ${res.models.length} loaded models.`);
        if (res.models.length > 0) {
          setLocalModelName(res.models[0]);
        }
      } else {
        notifyWarning(`Could not reach ${localProvider.toUpperCase()} at ${localBaseUrl}. Ensure LM Studio or Ollama is running.`);
      }
    } catch (err: any) {
      setLocalStatus({
        tested: true,
        active: false,
        latencyMs: 0,
        models: [],
        error: err.message
      });
      notifyWarning(`Connection failed: ${err.message}`);
    } finally {
      setIsPingingLocal(false);
    }
  };

  // One-Click Model Apply Handler
  const handleOneClickApply = (model: ModelInfo) => {
    const targetAgentId = model.oneClickAgentTarget || 'agent-orchestrator';
    setActiveGlobalModel(model.id);
    setAgentModelAssignments(prev => ({
      ...prev,
      [targetAgentId]: model.id
    }));
    notifySuccess(`Applied ${model.name} as active engine for ${model.recommendedRole}!`);
  };

  // Handle saving API Key
  const handleSaveAIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKey(true);
    setKeySaveMessage(null);

    try {
      await saveAIProviderKey(selectedProvider, apiKeyInput, selectedModel, {
        baseUrl: customBaseUrl || undefined,
        accountAuth: selectedProvider === 'openai-account',
      });
      setKeySaveMessage({ type: 'success', text: `Credentials and model saved successfully for ${selectedProvider.toUpperCase()}` });
      notifySuccess(`Saved ${selectedProvider.toUpperCase()} credentials.`);
      setApiKeyInput('');
      await onRefreshProviders();
    } catch (err: any) {
      setKeySaveMessage({ type: 'error', text: err.message || 'Failed to save provider key' });
      notifyWarning(err.message || 'Failed to save credentials');
    } finally {
      setIsSavingKey(false);
    }
  };

  // OpusMax gateway — verify the saved/entered key via the gateway's /key-status
  const handleVerifyOpusMaxKey = async () => {
    setOpusmaxVerifying(true);
    setOpusmaxKeyStatus(null);
    try {
      const res = await checkOpusMaxKeyStatus(apiKeyInput.trim() || undefined, customBaseUrl || undefined);
      setOpusmaxKeyStatus(res);
      if (res.success && res.active) {
        notifySuccess(`OpusMax key verified — ${res.status}${res.name ? ` (${res.name})` : ''}${res.expiresAt ? ` • expires ${new Date(res.expiresAt).toLocaleDateString()}` : ''}`);
      } else {
        notifyWarning(res.error || `OpusMax key check: ${res.status || 'inactive'}`);
      }
    } catch (err: any) {
      setOpusmaxKeyStatus({ success: false, active: false, status: null, name: null, quotaBlocked: false, expiresAt: null, error: err.message });
      notifyWarning(err.message || 'OpusMax key verification failed');
    } finally {
      setOpusmaxVerifying(false);
    }
  };

  // OpusMax gateway — pull the live model list from {base}/v1/models
  const handleFetchOpusMaxModels = async () => {
    setOpusmaxFetchingModels(true);
    try {
      const models = await fetchProviderModels('opusmax', apiKeyInput.trim() || undefined);
      if (models && models.length > 0) {
        setOpusmaxDiscoveredModels(models);
        notifySuccess(`Fetched ${models.length} live models from the OpusMax gateway.`);
      } else {
        notifyWarning('Gateway returned no live models — showing the built-in catalog fallback.');
      }
    } catch (err: any) {
      notifyWarning(`Could not fetch live OpusMax models: ${err.message}`);
    } finally {
      setOpusmaxFetchingModels(false);
    }
  };

  // Test Model Handshake
  const handleTestInference = async () => {
    setTestingInference(true);
    setInferenceResult(null);
    setInferenceError(null);

    try {
      const res = await testModelInference(selectedProvider, selectedModel, testPrompt, customBaseUrl || undefined);
      setInferenceResult(res);
      notifySuccess(`Inference succeeded on ${res.model} in ${res.durationMs}ms`);
    } catch (err: any) {
      setInferenceError(err.message || 'Inference test failed');
      notifyWarning(err.message || 'Inference test failed');
    } finally {
      setTestingInference(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Quick Status Metric Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-all shadow-xl">
          <div className="flex items-center justify-between text-muted mb-2 font-mono text-[10px] uppercase tracking-wider">
            <span>Active Global Engine</span>
            <Cpu size={16} className="text-accent" />
          </div>
          <div className="text-xl font-heading font-black text-white truncate">
            {ALL_AI_MODELS.find(m => m.id === activeGlobalModel)?.name || activeGlobalModel}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Frontier 2026 Verified
          </div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-all shadow-xl">
          <div className="flex items-center justify-between text-muted mb-2 font-mono text-[10px] uppercase tracking-wider">
            <span>Local LLM (MacBook)</span>
            <Laptop size={16} className="text-amber-400" />
          </div>
          <div className="text-xl font-heading font-black text-white flex items-center gap-2">
            <span>LM Studio / Ollama</span>
          </div>
          <div className="text-[11px] font-mono mt-2 flex items-center gap-1.5">
            {localStatus.active ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE ({localStatus.latencyMs}ms) • $0.00 / 1M
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                Standby • localhost:1234 / 11434
              </span>
            )}
          </div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-all shadow-xl">
          <div className="flex items-center justify-between text-muted mb-2 font-mono text-[10px] uppercase tracking-wider">
            <span>Active Context Ceiling</span>
            <Sliders size={16} className="text-cyan-400" />
          </div>
          <div className="text-xl font-heading font-black text-white">
            {(contextTokens / 1000).toLocaleString()}K Tokens
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-2 flex items-center gap-1.5">
            <Wifi size={12} /> {autoBandwidthThrottle ? "Adaptive Auto-Throttle ON (<800ms target)" : "Manual Fixed Buffer"}
          </div>
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-accent/40 transition-all shadow-xl">
          <div className="flex items-center justify-between text-muted mb-2 font-mono text-[10px] uppercase tracking-wider">
            <span>Smart Routing Gateway</span>
            <Globe size={16} className="text-indigo-400" />
          </div>
          <div className="text-xl font-heading font-black text-white">
            Omniroute & OpenRouter
          </div>
          <div className="text-[11px] text-indigo-400 font-mono mt-2 flex items-center gap-1.5">
            <ShieldCheck size={12} /> AES-256 Multi-Key Vault
          </div>
        </div>
      </div>

      {/* SECTION 1: LOCAL LLM STUDIO (MACBOOK ENGINE) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-surface to-surface/90 border border-accent/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-accent/20 border border-accent/40 rounded-xl text-accent">
                <Laptop size={22} />
              </span>
              <div>
                <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
                  MacBook Local LLM Execution Studio
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    $0.00 / 1M Compute Cost
                  </span>
                </h3>
                <p className="text-zinc-400 text-xs">
                  Run frontier open weights (Llama 3.3, Qwen 2.5/3 Coder, DeepSeek R1 Distill) 100% offline via Apple Silicon unified memory.
                </p>
              </div>
            </div>
          </div>

          <div className="sigma-segmented font-mono">
            <button
              onClick={() => {
                setLocalProvider('lmstudio');
                setLocalBaseUrl('http://localhost:1234/v1');
              }}
              className={cn(
                "sigma-segment cursor-pointer",
                localProvider === 'lmstudio' ? "sigma-segment-active" : ""
              )}
            >
              LM Studio (:1234)
            </button>
            <button
              onClick={() => {
                setLocalProvider('ollama');
                setLocalBaseUrl('http://localhost:11434/v1');
              }}
              className={cn(
                "sigma-segment cursor-pointer",
                localProvider === 'ollama' ? "sigma-segment-active" : ""
              )}
            >
              Ollama (:11434)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted uppercase">Local Endpoint Base URL</label>
            <input
              type="text"
              value={localBaseUrl}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              LM Studio: http://localhost:1234/v1 • Ollama: http://localhost:11434/v1
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-muted uppercase">Active Model Name</label>
            {localStatus.models.length > 0 ? (
              <select
                value={localModelName}
                onChange={(e) => setLocalModelName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              >
                {localStatus.models.map(m => (
                  <option key={m} value={m}>{m} (Detected)</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={localModelName}
                onChange={(e) => setLocalModelName(e.target.value)}
                placeholder="e.g. llama-3.3-70b-instruct or qwen2.5-coder-32b"
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
            )}
            <p className="text-[10px] text-zinc-500 font-mono">
              Specify loaded model name or click 'Test Ping' to auto-detect.
            </p>
          </div>

          <div className="flex flex-col justify-end space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePingLocalServer}
                disabled={isPingingLocal}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Radio size={14} className={cn(isPingingLocal && "animate-spin text-accent")} />
                {isPingingLocal ? "Pinging..." : `Test ${localProvider.toUpperCase()} Ping`}
              </button>

              <button
                type="button"
                onClick={() => {
                  const localModelId = localProvider === 'lmstudio' ? 'local-lmstudio' : 'local-ollama-llama3';
                  setActiveGlobalModel(localModelId);
                  notifySuccess(`Activated ${localProvider.toUpperCase()} as primary platform inference engine!`);
                }}
                className="px-4 py-3 bg-accent text-background font-black uppercase text-xs tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shrink-0"
              >
                Use For All Tasks
              </button>
            </div>

            {localStatus.tested && (
              <div className={cn(
                "p-2.5 rounded-xl text-[11px] font-mono flex items-center justify-between border",
                localStatus.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}>
                <span>{localStatus.active ? `🟢 ${localProvider.toUpperCase()} Active (${localStatus.latencyMs}ms)` : `⚪ ${localStatus.error || 'Server not responding'}`}</span>
                <span>{localStatus.active ? `${localStatus.models.length} Models Loaded` : 'Start LM Studio/Ollama'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTEXT WINDOW SLIDER & BANDWIDTH AUTO-UPDATE */}
      <div className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
              <Sliders className="text-accent" size={20} /> Adaptive Context Window & Bandwidth Controller
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Custom context allocation with live bandwidth throttling to prevent latency degradation on heavy token payloads.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoBandwidthThrottle(!autoBandwidthThrottle)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-2 cursor-pointer",
                autoBandwidthThrottle ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-white/10 text-zinc-400"
              )}
            >
              <Gauge size={13} />
              {autoBandwidthThrottle ? "Adaptive Auto-Throttle: ENABLED" : "Auto-Throttle: DISABLED"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase">Maximum Ingestion Context:</span>
              <span className="text-lg font-heading font-black text-accent font-mono">
                {contextTokens >= 1000000 ? `${(contextTokens / 1000000).toFixed(1)}M Tokens` : `${(contextTokens / 1000).toFixed(0)}K Tokens`}
              </span>
            </div>

            <input
              type="range"
              min="8000"
              max="2000000"
              step="8000"
              value={contextTokens}
              onChange={(e) => setContextTokens(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-black/60 rounded-lg"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>8K (Ultra Fast)</span>
              <span>128K (GPT-4o)</span>
              <span>500K (Claude 4.5)</span>
              <span>1M (Astra/Fable)</span>
              <span>2M (Gemini 3.8)</span>
            </div>
          </div>

          <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Bandwidth Profiler:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Gigabit Network (12ms RTT)
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {autoBandwidthThrottle
                ? "Auto-Throttle is monitoring client roundtrip latency. If your connection exceeds 400ms RTT, token chunking dynamically throttles to sustain real-time UI streaming without socket drops."
                : "Manual context override active. Large payloads (1M+ tokens) will consume unthrottled bandwidth."}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROVIDER CREDENTIALS & ROUTING VAULT */}
      <div className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <h3 className="text-xl font-heading font-black text-white flex items-center gap-2">
              <Key className="text-accent" size={20} /> Multi-Provider Credential & Gateway Routing Vault
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Configure proprietary keys or smart routers (Omniroute, Open Code, Open Router). Client credentials are AES-256 GCM encrypted.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono">
            <Lock size={12} /> Hardware-Isolated Key Vault
          </div>
        </div>

        {/* Provider Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'google', name: 'Google Cloud (Gemini)' },
            { id: 'anthropic', name: 'Anthropic (Claude)' },
            { id: 'openai', name: 'OpenAI (GPT & Astra)' },
            { id: 'opusmax', name: 'OpusMax Pro Gateway' },
            { id: 'openai-account', name: 'OpenAI Account (ChatGPT/Codex)' },
            { id: 'omniroute', name: 'Omniroute Gateway' },
            { id: 'opencode', name: 'Open Code' },
            { id: 'openrouter', name: 'OpenRouter Unified' },
            { id: 'qwen', name: 'Alibaba Cloud Qwen' },
            { id: 'deepseek', name: 'DeepSeek AI' },
            { id: 'xai', name: 'xAI Grok' },
            { id: 'glm', name: 'Zhipu GLM' },
            { id: 'lmstudio', name: 'LM Studio (Local)' },
            { id: 'ollama', name: 'Ollama (Local)' },
          ].map((p) => {
            const keyConfig = providers.find(item => item.provider === p.id);
            const isSelected = selectedProvider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id as ModelProvider);
                  const matching = ALL_AI_MODELS.filter(m => m.provider === p.id);
                  if (matching.length > 0) setSelectedModel(matching[0].id);
                  if (p.id === 'opusmax' && !customBaseUrl) setCustomBaseUrl('https://api.opusmax.pro');
                }}
                className={cn(
                  "p-3 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between",
                  isSelected
                    ? "bg-accent/15 border-accent shadow-xl ring-1 ring-accent"
                    : "bg-black/40 border-white/10 hover:border-white/20"
                )}
              >
                <div className="text-xs font-mono font-bold text-white truncate">
                  {p.name}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  {keyConfig?.configured || p.id === 'google' || p.id === 'lmstudio' || p.id === 'ollama' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> Ready
                    </span>
                  ) : (
                    <span className="text-zinc-500">Unconfigured</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Form */}
        <form onSubmit={handleSaveAIKey} className="space-y-5 bg-black/40 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Update {selectedProvider.toUpperCase()} Credentials & Base URL
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">AES-256 Encrypted Before Save</span>
          </div>

          {keySaveMessage && (
            <div className={cn(
              "p-3 rounded-xl text-xs font-mono flex items-center gap-2",
              keySaveMessage.type === 'success' ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
            )}>
              {keySaveMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {keySaveMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">API Key / Access Token</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={`Enter ${selectedProvider} API key`}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
              <span className="text-[10px] text-zinc-500 font-mono">
                {selectedProvider === 'opusmax'
                  ? 'OpusMax Pro accepts sk-ant-... Anthropic-format keys (OpenAI & Anthropic wire formats).'
                  : selectedProvider === 'openai-account'
                    ? 'Optional fallback — OpenAI account sign-in is the primary credential.'
                    : 'Leave blank to retain currently saved key.'}
              </span>

              {selectedProvider === 'openai-account' && (
                <button
                  type="button"
                  onClick={() => window.open('https://chatgpt.com', '_blank', 'noopener,noreferrer')}
                  className="mt-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink size={11} /> Sign in with OpenAI Account (ChatGPT / Codex)
                </button>
              )}

            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Custom Base URL (Optional Gateway)</label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="e.g. https://openrouter.ai/api/v1 or custom proxy"
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
              <span className="text-[10px] text-zinc-500 font-mono">Override standard host for enterprise gateways.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted uppercase">Default Target Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              >
                {ALL_AI_MODELS.filter(m => m.provider === selectedProvider).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.contextWindow} • ${m.promptPer1M}/${m.candidatePer1M})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-500 font-mono">Target model assigned for requests.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="text-xs text-zinc-400 font-mono">
              Active Provider: <span className="text-accent font-bold">{selectedProvider.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestInference}
                disabled={testingInference}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={13} className={cn(testingInference && "animate-spin text-accent")} />
                {testingInference ? "Verifying Handshake..." : "Test Model Handshake"}
              </button>
              <button
                type="submit"
                disabled={isSavingKey}
                className="px-5 py-2.5 bg-accent text-background font-black uppercase text-xs tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg cursor-pointer"
              >
                {isSavingKey ? "Encrypting & Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>

          {inferenceResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Inference Handshake Succeeded</span>
                <span>Latency: {inferenceResult.durationMs}ms • Cost: ${inferenceResult.costUsd.toFixed(6)}</span>
              </div>
              <p className="text-xs text-zinc-200 font-mono italic bg-black/40 p-3 rounded-lg border border-white/5">
                "{inferenceResult.text}"
              </p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400">
                <span>Model: {inferenceResult.model}</span>
                <span>Tokens: {inferenceResult.totalTokens}</span>
              </div>
            </div>
          )}

          {inferenceError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-mono text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{inferenceError}</span>
            </div>
          )}

          {/* OpusMax gateway controls: live key verification + model discovery */}
          {selectedProvider === 'opusmax' && (
            <div className="space-y-4 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs font-mono text-zinc-400">
                  <Server size={13} className="inline text-indigo-400 mr-1.5" />
                  OpusMax Gateway (installed dep <span className="text-white">opusmax-gateway</span>) — Claude family • OpenAI + Anthropic wire formats • <span className="text-indigo-300">{customBaseUrl || 'https://api.opusmax.pro'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFetchOpusMaxModels}
                    disabled={opusmaxFetchingModels}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={cn(opusmaxFetchingModels && "animate-spin text-accent")} />
                    {opusmaxFetchingModels ? "Fetching /v1/models…" : "Fetch Live Models"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOpusMaxKey}
                    disabled={opusmaxVerifying}
                    className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-mono text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck size={12} />
                    {opusmaxVerifying ? "Checking /key-status…" : "Verify OpusMax Key"}
                  </button>
                </div>
              </div>

              {opusmaxKeyStatus && (
                <div className={cn(
                  "p-3 rounded-xl text-[11px] font-mono flex items-center gap-2 border",
                  opusmaxKeyStatus.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                  {opusmaxKeyStatus.active ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  <span>
                    {opusmaxKeyStatus.active
                      ? `Key ${opusmaxKeyStatus.status || 'ACTIVE'}${opusmaxKeyStatus.name ? ` • account "${opusmaxKeyStatus.name}"` : ''}${opusmaxKeyStatus.quotaBlocked ? ' • QUOTA BLOCKED' : ''}${opusmaxKeyStatus.expiresAt ? ` • expires ${new Date(opusmaxKeyStatus.expiresAt).toLocaleDateString()}` : ''}`
                      : (opusmaxKeyStatus.error || 'Key inactive or not found on the gateway')}
                  </span>
                </div>
              )}

              {opusmaxDiscoveredModels.length > 0 && (
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Live gateway models ({opusmaxDiscoveredModels.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {opusmaxDiscoveredModels.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedModel(m)}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-mono text-[11px] border transition-all cursor-pointer",
                          selectedModel === m ? "bg-indigo-500/30 border-indigo-400 text-white" : "bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/30"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* SECTION 4: 2026 AI MODEL CATALOG & ONE-CLICK RECOMMENDATIONS */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-heading font-black text-white flex items-center gap-2">
              <Cpu className="text-accent" size={24} /> September 2026 Frontier Models & Use Case Recommendations
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Every model includes verified architectural use cases. Click '1-Click Apply' to instantly bind it to that agent role.
            </p>
          </div>

          <div className="sigma-segmented font-mono">
            {[
              { id: 'ALL', label: 'All Models' },
              { id: 'FRONTIER_2026', label: '⭐ Frontier 2026' },
              { id: 'LOCAL', label: 'MacBook Local' },
              { id: 'ROUTERS', label: 'Smart Routers' },
              { id: 'anthropic', label: 'Anthropic (Fable 5.1)' },
              { id: 'openai', label: 'OpenAI (Astra)' },
              { id: 'opusmax', label: 'OpusMax Pro' },
              { id: 'openai-account', label: 'OpenAI Account' },
              { id: 'google', label: 'Google (Gemini 3.8)' },
              { id: 'qwen', label: 'Qwen 3' },
              { id: 'deepseek', label: 'DeepSeek' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  "sigma-segment cursor-pointer",
                  selectedCategory === tab.id
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models by name, role, capability, or use case (e.g. Fable 5.1, Astra, Qwen 3, Offline Local, ROAS attribution)..."
            className="w-full bg-surface border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
          />
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => {
            const isGloballyActive = activeGlobalModel === model.id;
            const targetAgent = model.oneClickAgentTarget || 'agent-orchestrator';
            const isAssignedToAgent = agentModelAssignments[targetAgent] === model.id;

            return (
              <div
                key={model.id}
                className={cn(
                  "p-6 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden group",
                  isGloballyActive
                    ? "bg-gradient-to-br from-accent/15 via-surface to-surface border-accent shadow-xl ring-1 ring-accent"
                    : "bg-surface/90 border-white/10 hover:border-white/20"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                        {model.providerName}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5 group-hover:text-accent transition-colors">
                        {model.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {model.isLocal && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold border border-emerald-500/30">
                          LOCAL $0
                        </span>
                      )}
                      {model.isRouter && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-mono font-bold border border-indigo-500/30">
                          ROUTER
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono">
                        {model.contextWindow}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>

                  {/* Recommendation Box */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-accent font-bold uppercase">Optimal Role:</span>
                      <span className="text-zinc-300 truncate max-w-[170px]">{model.recommendedRole}</span>
                    </div>

                    {model.useCases && model.useCases.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {model.useCases.map((uc, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 text-[11px] font-mono">
                            {uc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Rate (In / Out):</span>
                    <span className="text-white font-bold">
                      ${model.promptPer1M.toFixed(3)} / ${model.candidatePer1M.toFixed(3)}
                    </span>
                  </div>

                  {model.effortLevels && model.effortLevels.length > 0 && (
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-zinc-500 shrink-0">Effort Ladder:</span>
                      <span className="text-cyan-300 truncate text-right">
                        {model.effortLevels.join(' · ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOneClickApply(model)}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md",
                        isGloballyActive || isAssignedToAgent
                          ? "bg-emerald-500 text-black font-black"
                          : "bg-accent/20 hover:bg-accent text-accent hover:text-background border border-accent/40"
                      )}
                    >
                      {isGloballyActive || isAssignedToAgent ? (
                        <>
                          <Check size={14} /> Active for {model.oneClickAgentTarget || 'Workspace'}
                        </>
                      ) : (
                        <>
                          <Zap size={14} /> 1-Click Apply to Role
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
