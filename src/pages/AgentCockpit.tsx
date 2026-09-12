import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Lock, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Cpu, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw,
  Eye,
  Sliders,
  Terminal,
  Activity,
  FileCode,
  Download,
  Upload,
  Layers,
  Zap,
  BrainCircuit,
  Crown,
  Share2,
  CheckSquare,
  Square,
  PauseCircle,
  PlayCircle,
  Workflow,
  TrendingUp,
  BarChart3,
  Wrench,
  FolderGit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { 
  SCOPED_AGENTS, 
  INITIAL_HITL_TASKS, 
  INITIAL_AGENT_RUNS, 
  INITIAL_AGENT_LOGS,
  ScopedAgent, 
  HITLTask, 
  AgentRunLog,
  CockpitLogItem,
  AgentSkill,
  SubAgent,
  SelfLearningProfile,
  AgentInstructions,
  LearnedHeuristic
} from '@/src/data/agentCockpitData';
import AgentHeatmap from '@/src/components/AgentHeatmap';
import { appendTelemetryEvent } from '@/src/lib/agentTelemetry';
import AgentSkillsManager from '@/src/components/AgentSkillsManager';
import AgentInstructionsEditor from '@/src/components/AgentInstructionsEditor';
import AgentSubAgentsList from '@/src/components/AgentSubAgentsList';
import AgentSelfLearningPanel from '@/src/components/AgentSelfLearningPanel';
import AgentLogsViewer from '@/src/components/AgentLogsViewer';
import AgentMarkdownModal from '@/src/components/AgentMarkdownModal';
import AgentLearningAnalyticsTab from '@/src/components/AgentLearningAnalyticsTab';
import AgentDAGVisualization from '@/src/components/AgentDAGVisualization';
import QuickFixAssistant from '@/src/components/QuickFixAssistant';
import AgentSimulationMode from '@/src/components/AgentSimulationMode';
import AgentFilesManager from '@/src/components/AgentFilesManager';
import { downloadAgentMarkdown, downloadMultiAgentBundleMarkdown } from '@/src/services/agentMarkdownService';
import { useToast } from '@/src/contexts/ToastContext';

export default function AgentCockpit() {
  const { notifySuccess, notifyWarning, notifyInfo } = useToast();
  const [agents, setAgents] = useState<ScopedAgent[]>(SCOPED_AGENTS);
  const [hitlTasks, setHitlTasks] = useState<HITLTask[]>(INITIAL_HITL_TASKS);
  const [agentRuns, setAgentRuns] = useState<AgentRunLog[]>(INITIAL_AGENT_RUNS);
  const [agentLogs, setAgentLogs] = useState<CockpitLogItem[]>(INITIAL_AGENT_LOGS);
  const [selectedAgent, setSelectedAgent] = useState<ScopedAgent>(SCOPED_AGENTS[0]);
  const [activeTaskModal, setActiveTaskModal] = useState<HITLTask | null>(null);
  const [isTriggeringRun, setIsTriggeringRun] = useState(false);
  const [liveSimRun, setLiveSimRun] = useState<AgentRunLog | null>(null);
  const simTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Multi-select batch operations state
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  // Active Inspector Tab & Simulation Mode state
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'instructions' | 'subagents' | 'learning' | 'analytics' | 'files' | 'dag' | 'simulation' | 'logs'>('overview');
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  // Markdown Modal state
  const [mdModal, setMdModal] = useState<{ isOpen: boolean; mode: 'export' | 'import' }>({
    isOpen: false,
    mode: 'export'
  });

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      simTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const pendingHitlCount = hitlTasks.filter(t => t.status === 'PENDING').length;
  const orchestratorAgent = agents.find(a => a.isOrchestrator) || agents[0];
  const specializedAgents = agents.filter(a => !a.isOrchestrator);

  // Multi-select toggle helper
  const handleToggleSelectAgent = (agentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAgentIds(prev => 
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSelectAllAgents = () => {
    if (selectedAgentIds.length === agents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(agents.map(a => a.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAgentIds([]);
  };

  const handleBatchPauseToggle = () => {
    const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    const allPaused = selectedAgents.every(a => a.status === 'PAUSED');
    const newStatus = allPaused ? 'ACTIVE' : 'PAUSED';

    setAgents(prev => prev.map(a => {
      if (selectedAgentIds.includes(a.id)) {
        return { ...a, status: newStatus };
      }
      return a;
    }));

    if (selectedAgentIds.includes(selectedAgent.id)) {
      setSelectedAgent(prev => ({ ...prev, status: newStatus }));
    }

    notifySuccess(
      `Fleet Batch Status Updated`,
      `Set ${selectedAgentIds.length} agents to ${newStatus}. Guardrails applied.`,
      { category: 'AGENT' }
    );
  };

  const handleBatchSync = () => {
    setIsBatchSyncing(true);
    setTimeout(() => {
      setIsBatchSyncing(false);
      setAgentLogs(prev => [
        {
          id: `log-${Date.now()}-batchsync`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: 'system',
          agentCodename: 'FLEET-SYNC',
          level: 'INFO',
          category: 'QUEUE',
          message: `Synchronized Second Brain knowledge embeddings across ${selectedAgentIds.length} agents.`
        },
        ...prev
      ]);
      notifySuccess(
        'Batch Knowledge Sync Complete',
        `Re-indexed pgvector embeddings and synchronized state across ${selectedAgentIds.length} agents.`,
        { category: 'SYSTEM' }
      );
    }, 1200);
  };

  const handleBatchExport = () => {
    const selected = agents.filter(a => selectedAgentIds.includes(a.id));
    if (selected.length === 0) return;
    downloadMultiAgentBundleMarkdown(selected);
    notifySuccess(
      'Multi-Agent Bundle Exported',
      `Downloaded bundle of ${selected.length} agents as markdown (.md).`,
      { category: 'AGENT' }
    );
  };

  const handleBatchBenchmark = () => {
    notifyInfo(
      'Batch Benchmark Enqueued',
      `Enqueued parallel test suites across ${selectedAgentIds.length} selected agents in BullMQ.`
    );
  };

  const handleApproveHITL = (taskId: string) => {
    const task = hitlTasks.find(t => t.id === taskId);
    setHitlTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'APPROVED' };
      }
      return t;
    }));
    setActiveTaskModal(null);

    // Record in logs
    const newLog: CockpitLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentId: task?.agentId || 'system',
      agentCodename: task?.agentName.split(' ')[0] || 'ADMIN',
      level: 'INFO',
      category: 'HITL',
      message: `Admin signed off on HITL task "${task?.title}". Action dispatched to ${task?.vaultAffected}.`,
      durationMs: 38
    };
    setAgentLogs(prev => [newLog, ...prev]);

    notifySuccess(
      'HITL Action Approved & Executed',
      `Signed off by Admin. Dispatched payload to ${task?.vaultAffected || 'target vault'}.`,
      { category: 'SECURITY' }
    );
  };

  const handleRejectHITL = (taskId: string) => {
    const task = hitlTasks.find(t => t.id === taskId);
    setHitlTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'REJECTED' };
      }
      return t;
    }));
    setActiveTaskModal(null);

    // Record in logs
    const newLog: CockpitLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentId: task?.agentId || 'system',
      agentCodename: task?.agentName.split(' ')[0] || 'ADMIN',
      level: 'WARN',
      category: 'HITL',
      message: `Admin rejected HITL task "${task?.title}". Transaction aborted and rolled back.`,
      durationMs: 25
    };
    setAgentLogs(prev => [newLog, ...prev]);

    notifyWarning(
      'HITL Action Rejected',
      `Action proposal blocked for ${task?.agentName || 'agent'}. Rollback state maintained.`,
      { category: 'SECURITY' }
    );
  };

  const handleTriggerAgentRun = (agent: ScopedAgent, title?: string) => {
    // Clear any existing simulation timers
    simTimersRef.current.forEach(t => clearTimeout(t));
    simTimersRef.current = [];

    setIsTriggeringRun(true);
    const taskName = title || (
      agent.isOrchestrator 
        ? `Orchestrate Full Growth Diagnostic Workflow (Oracle -> Aurora -> Vortex)`
        : `Execute Autonomous Audit: ${agent.name}`
    );
    const runId = `run-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRun: AgentRunLog = {
      id: runId,
      agentId: agent.id,
      agentName: agent.name,
      taskTitle: taskName,
      status: 'QUEUED',
      startedAt: 'Just now',
      duration: 'Running...',
      steps: [
        { phase: '01 Queued', description: 'Request accepted by BullMQ Task Queue', timestamp: '00:00:01', status: 'active' }
      ],
      traceLog: [
        `[00:00:01] [QUEUE] Enqueued task for agent ${agent.codename}`,
        `[00:00:02] [RBAC] Verified allowed read vaults: ${agent.readVaults.join(', ')}`
      ]
    };

    setLiveSimRun(newRun);

    // Add Queue Log
    setAgentLogs(prev => [
      {
        id: `log-${Date.now()}-q`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId: agent.id,
        agentCodename: agent.codename,
        level: 'INFO',
        category: 'QUEUE',
        message: `Task "${taskName}" placed into priority partition queue.`
      },
      ...prev
    ]);

    // Step 2: Planning
    const t1 = setTimeout(() => {
      setLiveSimRun(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'PLANNING',
          steps: [
            { ...prev.steps[0], status: 'completed' },
            { phase: '02 Planning', description: 'Decomposed goal into verified tool graph via Gemini 3 Flash', timestamp: '00:00:04', status: 'active' }
          ],
          traceLog: [...prev.traceLog, `[00:00:04] [MODEL] Context window: 16k tokens. Planning next actions`]
        };
      });

      setAgentLogs(prev => [
        {
          id: `log-${Date.now()}-m`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: agent.id,
          agentCodename: agent.codename,
          level: 'INFO',
          category: 'MODEL',
          message: `Generated execution plan with 4 tool nodes using Gemini 3 Flash.`,
          durationMs: 380
        },
        ...prev
      ]);
    }, 1200);
    simTimersRef.current.push(t1);

    // Step 3: Executing Tool Call
    const t2 = setTimeout(() => {
      const toolUsed = agent.skills[0]?.toolSignature || 'search_second_brain(query="optimization")';
      setLiveSimRun(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'EXECUTING',
          steps: [
            { ...prev.steps[0], status: 'completed' },
            { ...prev.steps[1], status: 'completed' },
            { phase: '03 Executing', description: `Queried Second Brain ${agent.readVaults[0]} & executed MCP tool`, timestamp: '00:00:09', status: 'active', toolCall: toolUsed }
          ],
          traceLog: [...prev.traceLog, `[00:00:09] [TOOL] ${toolUsed} returned 4 similarity records`]
        };
      });

      setAgentLogs(prev => [
        {
          id: `log-${Date.now()}-t`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: agent.id,
          agentCodename: agent.codename,
          level: 'TOOL',
          category: 'TOOL',
          message: `Invoked specialized skill tool: ${toolUsed}`,
          durationMs: 1240
        },
        ...prev
      ]);
    }, 2400);
    simTimersRef.current.push(t2);

    // Step 4: Quality Gate Review
    const t3 = setTimeout(() => {
      setLiveSimRun(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'REVIEWING',
          steps: [
            { ...prev.steps[0], status: 'completed' },
            { ...prev.steps[1], status: 'completed' },
            { ...prev.steps[2], status: 'completed' },
            { phase: '04 Reviewing', description: 'Verified output against Brand Vault voice vectors & constraints', timestamp: '00:00:15', status: 'active' }
          ],
          traceLog: [...prev.traceLog, `[00:00:15] [GATE] Voice vector alignment score: 99.4% precision`]
        };
      });

      setAgentLogs(prev => [
        {
          id: `log-${Date.now()}-g`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: agent.id,
          agentCodename: agent.codename,
          level: 'GATE',
          category: 'RBAC',
          message: `Passed Brand Vault tone alignment and zero-hallucination verification at 99.4% accuracy.`,
          durationMs: 410
        },
        ...prev
      ]);
    }, 3600);
    simTimersRef.current.push(t3);

    // Step 5: Completed
    const t4 = setTimeout(() => {
      const completedRun: AgentRunLog = {
        id: runId,
        agentId: agent.id,
        agentName: agent.name,
        taskTitle: taskName,
        status: 'COMPLETED',
        startedAt: 'Just now',
        duration: '18s',
        steps: [
          { phase: '01 Queued', description: 'Request accepted by BullMQ Task Queue', timestamp: '00:00:01', status: 'completed' },
          { phase: '02 Planning', description: 'Decomposed goal into verified tool graph via Gemini 3 Flash', timestamp: '00:00:04', status: 'completed' },
          { phase: '03 Executing', description: `Queried Second Brain ${agent.readVaults[0]} & executed MCP tool`, timestamp: '00:00:09', status: 'completed', toolCall: agent.skills[0]?.toolSignature || 'search_second_brain()' },
          { phase: '04 Reviewing', description: 'Verified output against Brand Vault voice vectors & constraints', timestamp: '00:00:15', status: 'completed' },
          { phase: '05 Completed', description: 'State committed to Second Brain & emitted telemetry trace', timestamp: '00:00:18', status: 'completed' }
        ],
        traceLog: [
          `[00:00:01] [QUEUE] Enqueued task for agent ${agent.codename}`,
          `[00:00:02] [RBAC] Verified allowed read vaults: ${agent.readVaults.join(', ')}`,
          `[00:00:04] [MODEL] Context window: 16k tokens. Planning next actions`,
          `[00:00:09] [TOOL] search_second_brain returned 4 similarity records`,
          `[00:00:15] [GATE] Voice vector alignment score: 99.4% precision`,
          `[00:00:18] [STORE] PostgreSQL transaction committed. Completed.`
        ]
      };

      setLiveSimRun(completedRun);
      setAgentRuns(current => [completedRun, ...current]);
      setIsTriggeringRun(false);

      // Record authentic execution telemetry event
      const currentHour = `${String(new Date().getHours()).padStart(2, '0')}:00`;
      appendTelemetryEvent({
        id: `evt-${Date.now()}-${agent.id}`,
        agentId: agent.id,
        interval: currentHour,
        status: 'completed',
        latencyMs: 180,
        hitlRequired: (agent.requiresHITLFor && agent.requiresHITLFor.length > 0) || false,
        timestamp: Date.now()
      });

      // Increment completed tasks for agent
      setAgents(prev => prev.map(a => {
        if (a.id === agent.id) {
          return {
            ...a,
            tasksCompleted: a.tasksCompleted + 1,
            lastActive: 'Just now'
          };
        }
        return a;
      }));

      setAgentLogs(prev => [
        {
          id: `log-${Date.now()}-c`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          agentId: agent.id,
          agentCodename: agent.codename,
          level: 'INFO',
          category: 'QUEUE',
          message: `Run #${runId} finished in 18s. PostgreSQL transaction committed to ${agent.writeVaults[0]}.`,
          durationMs: 18000
        },
        ...prev
      ]);

      notifySuccess(
        `${agent.name} Execution Completed`,
        `Task "${taskName}" completed in 18s. State committed to ${agent.writeVaults[0]}.`,
        { category: 'AGENT' }
      );
    }, 4800);
    simTimersRef.current.push(t4);
  };

  // Updates from Child Components
  const handleUpdateSkills = (updatedSkills: AgentSkill[]) => {
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        const updated = { ...a, skills: updatedSkills };
        setSelectedAgent(updated);
        return updated;
      }
      return a;
    }));
  };

  const handleUpdateInstructions = (updatedInstructions: AgentInstructions) => {
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        const updated = { ...a, instructions: updatedInstructions };
        setSelectedAgent(updated);
        return updated;
      }
      return a;
    }));
  };

  const handleUpdateSubAgents = (updatedSubAgents: SubAgent[]) => {
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        const updated = { ...a, subAgents: updatedSubAgents };
        setSelectedAgent(updated);
        return updated;
      }
      return a;
    }));
  };

  const handleUpdateLearningProfile = (updatedProfile: SelfLearningProfile) => {
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        const updated = { ...a, learningProfile: updatedProfile };
        setSelectedAgent(updated);
        return updated;
      }
      return a;
    }));
  };

  const handleSubAgentDispatched = (subAgent: SubAgent, taskTitle: string) => {
    setAgentLogs(prev => [
      {
        id: `log-${Date.now()}-sub`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId: selectedAgent.id,
        agentCodename: subAgent.codename,
        level: 'TOOL',
        category: 'TOOL',
        message: `Sub-agent ${subAgent.codename} dispatched: "${subAgent.designatedTask}" using ${subAgent.specializedTool}`,
        durationMs: 1800
      },
      ...prev
    ]);
  };

  const handleLearningCycleCompleted = (heuristic: LearnedHeuristic) => {
    setAgentLogs(prev => [
      {
        id: `log-${Date.now()}-lrn`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId: selectedAgent.id,
        agentCodename: selectedAgent.codename,
        level: 'REFLECTION',
        category: 'LEARNING',
        message: `Self-Learning reflection cycle distilled rule: ${heuristic.rule}`,
        details: { confidence: heuristic.confidenceScore, impact: heuristic.impactDelta }
      },
      ...prev
    ]);
  };

  const handleApplyMarkdownImport = (importedData: Partial<ScopedAgent>) => {
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        const merged: ScopedAgent = {
          ...a,
          ...importedData,
          instructions: importedData.instructions ? { ...a.instructions, ...importedData.instructions } : a.instructions
        };
        setSelectedAgent(merged);
        return merged;
      }
      return a;
    }));
  };

  const handleDeploySimulation = (simulatedInstructions: AgentInstructions, summaryLog: string) => {
    setAgents(prev => prev.map(a => {
      if (a.isOrchestrator) {
        return { ...a, instructions: simulatedInstructions };
      }
      return a;
    }));

    if (selectedAgent.isOrchestrator) {
      setSelectedAgent(prev => ({ ...prev, instructions: simulatedInstructions }));
    }

    setAgentLogs(prev => [
      {
        id: `log-${Date.now()}-sim-deploy`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId: orchestratorAgent.id,
        agentCodename: orchestratorAgent.codename,
        level: 'GATE',
        category: 'CONSENSUS',
        message: `Simulation Deployed: Master Orchestrator directives & DAG path synchronized with production fleet.`,
        details: { summaryLog }
      },
      ...prev
    ]);

    setIsSimulationMode(false);
    setActiveTab('dag');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="text-[10px] text-muted font-mono uppercase tracking-[0.4em] font-black mb-3 flex items-center gap-2">
            <Bot size={14} className="text-accent" /> Agent Layer • Guarded Multi-Agent Growth OS
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black amber-text tracking-tighter">
            Autonomous Agent Cockpit
          </h1>
          <p className="text-zinc-400 text-lg max-w-3xl mt-3 leading-relaxed font-sans">
            Orchestrate scoped autonomous execution across content, SEO authority, performance marketing, and operations with strict RBAC boundaries, dedicated sub-agents, live learning loops, and Human-in-the-Loop (HITL) gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const nextMode = !isSimulationMode;
              setIsSimulationMode(nextMode);
              if (nextMode) setActiveTab('simulation');
              else if (activeTab === 'simulation') setActiveTab('dag');
            }}
            className={cn(
              "px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border shadow-lg",
              isSimulationMode || activeTab === 'simulation'
                ? "bg-amber-500 text-background font-black border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400/40"
                : "bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border-amber-500/40 text-amber-300 hover:text-white"
            )}
            title="Test impact of changing Orchestrator instructions on DAG in virtual sandbox"
          >
            <Sliders size={14} className={cn(isSimulationMode || activeTab === 'simulation' ? "text-background" : "text-amber-400")} />
            <span>{isSimulationMode || activeTab === 'simulation' ? "Exit Simulation" : "Simulation Mode (Beta)"}</span>
          </button>

          <button
            onClick={() => {
              setIsSimulationMode(false);
              setActiveTab('dag');
            }}
            className={cn(
              "px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border shadow-lg",
              activeTab === 'dag' && !isSimulationMode
                ? "bg-purple-500/30 border-purple-400 text-white shadow-purple-500/20" 
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            )}
            title="Interactive DAG dependency mapping between Orchestrator and Sub-Agents"
          >
            <Workflow size={14} className="text-purple-400" />
            <span>Data Flow DAG</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border shadow-lg",
              activeTab === 'analytics' 
                ? "bg-accent/30 border-accent text-white shadow-accent/20" 
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            )}
            title="Recharts longitudinal telemetry for efficiency, token burn, and error decay"
          >
            <Activity size={14} className="text-accent" />
            <span>Learning Analytics</span>
          </button>

          <button
            onClick={() => {
              setSelectedAgent(orchestratorAgent);
              handleTriggerAgentRun(orchestratorAgent);
            }}
            disabled={isTriggeringRun}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500/20 via-accent/20 to-secondary/20 hover:from-purple-500/30 hover:via-accent/30 hover:to-secondary/30 border border-purple-500/40 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Crown size={14} className="text-purple-300" />
            <span>Orchestrate Full Pipeline</span>
          </button>

          <div className="px-4 py-2.5 bg-amber-500/10 border border-accent/30 rounded-xl text-xs font-mono text-accent font-bold flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>HITL Gate: {pendingHitlCount} Actions Pending</span>
          </div>
        </div>
      </div>

      {/* HITL Pending Approvals Section */}
      <div data-tutorial-id="tut-hitl-queue" className="bg-surface border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold silver-text tracking-tight">Human-in-the-Loop (HITL) Approval Queue</h3>
              <p className="text-xs text-zinc-400">Guarded state machine: destructive actions, public releases, and major budget shifts require explicit sign-off.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted">{pendingHitlCount} Pending Review</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {hitlTasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4",
                task.status === 'PENDING' ? "bg-black/40 border-accent/40 shadow-lg" :
                task.status === 'APPROVED' ? "bg-green-950/10 border-green-500/20 opacity-70" :
                "bg-rose-950/10 border-rose-500/20 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                    task.riskLevel === 'HIGH' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    task.riskLevel === 'MEDIUM' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}>
                    {task.riskLevel} RISK
                  </span>
                  <span className="text-[10px] font-mono text-muted">{task.requestedAt}</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{task.title}</h4>
                <div className="text-[10px] font-mono text-accent mt-1">{task.agentName}</div>

                <p className="text-xs text-zinc-300 mt-3 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {task.proposedAction}
                </p>

                <div className="text-[11px] text-zinc-400 mt-2 space-y-1">
                  <div><strong className="text-white">Rationale:</strong> {task.rationale}</div>
                  <div><strong className="text-secondary">Expected Impact:</strong> {task.impactEstimate}</div>
                  <div><strong className="text-muted">Target Vault:</strong> {task.vaultAffected}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                {task.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleRejectHITL(task.id)}
                      className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveHITL(task.id)}
                      className="flex-1 py-2 bg-accent text-background hover:opacity-90 font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 amber-glow"
                    >
                      <Check size={12} /> Approve
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center py-1 text-xs font-mono font-bold flex items-center justify-center gap-2">
                    {task.status === 'APPROVED' ? (
                      <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={14} /> Approved & Executed</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1"><XCircle size={14} /> Rejected by Admin</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* D3 Visual Heatmap: Active Agent Load & Execution Success Rates */}
      <AgentHeatmap 
        onSelectAgent={(agentId) => {
          const matched = agents.find(a => a.id === agentId);
          if (matched) {
            setSelectedAgent(matched);
            notifyInfo('Agent Focused', `Switched inspector to ${matched.name} (${matched.codename})`);
          }
        }} 
      />

      {/* Scoped Agent Roster & Live Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Scoped Agent Cards (Orchestrator + Specialized Roster) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllAgents}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title={selectedAgentIds.length === agents.length ? "Deselect All Agents" : "Select All Agents"}
              >
                {selectedAgentIds.length === agents.length ? (
                  <CheckSquare size={16} className="text-accent" />
                ) : (
                  <Square size={16} className="text-zinc-600 hover:text-zinc-400" />
                )}
              </button>
              <h3 className="text-lg font-bold silver-text">Agent Fleet Hierarchy</h3>
            </div>
            <span className="text-xs font-mono text-muted">{agents.length} Nodes Configured</span>
          </div>

          {/* Master Orchestrator Highlight Card */}
          {orchestratorAgent && (
            <div
              onClick={() => setSelectedAgent(orchestratorAgent)}
              className={cn(
                "p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden",
                selectedAgent.id === orchestratorAgent.id 
                  ? "bg-purple-950/30 border-purple-500/80 shadow-2xl ring-2 ring-purple-500/40" 
                  : "bg-purple-950/15 border-purple-500/30 hover:border-purple-500/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleSelectAgent(orchestratorAgent.id, e)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title={selectedAgentIds.includes(orchestratorAgent.id) ? "Deselect Agent" : "Select Agent for Batch Operations"}
                  >
                    {selectedAgentIds.includes(orchestratorAgent.id) ? (
                      <CheckSquare size={15} className="text-purple-400" />
                    ) : (
                      <Square size={15} className="text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>

                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-black flex items-center gap-1">
                    <Crown size={12} /> {orchestratorAgent.codename}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                    MASTER ORCHESTRATOR
                  </span>
                </div>

                {orchestratorAgent.status === 'PAUSED' ? (
                  <QuickFixAssistant
                    side="right"
                    data={{
                      id: orchestratorAgent.id,
                      name: orchestratorAgent.name,
                      codename: orchestratorAgent.codename,
                      severity: 'WARNING',
                      issueSummary: 'Master Orchestrator execution loop is currently paused.',
                      rootCause: 'Manual administrator hold on autonomous task decomposition graph.',
                      actionableSteps: [
                        'Review pending BullMQ task queues',
                        'Validate Second Brain RLS clearance',
                        'Click below to resume autonomous consensus loop'
                      ],
                      quickFixLabel: 'Resume Orchestrator Loop',
                      onApplyFix: () => {
                        setAgents(prev => prev.map(a => a.id === orchestratorAgent.id ? { ...a, status: 'ACTIVE' } : a));
                        if (selectedAgent.id === orchestratorAgent.id) {
                          setSelectedAgent(prev => ({ ...prev, status: 'ACTIVE' }));
                        }
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <span>PAUSED</span>
                      <Wrench size={10} />
                    </button>
                  </QuickFixAssistant>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    {orchestratorAgent.status}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm text-white mb-1">{orchestratorAgent.name}</h4>
              <p className="text-xs text-zinc-300 line-clamp-2">{orchestratorAgent.description}</p>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-500/20 text-[10px] font-mono text-zinc-400">
                <span>Skills: <strong className="text-white">{orchestratorAgent.skills.length}</strong></span>
                <span>Sub-Agents: <strong className="text-secondary">{orchestratorAgent.subAgents.length}</strong></span>
                <span>Accuracy: <strong className="text-accent">{orchestratorAgent.accuracyRate}</strong></span>
              </div>
            </div>
          )}

          <div className="text-xs font-mono uppercase text-muted tracking-wider pt-2">
            Specialized Execution Agents
          </div>

          <div className="space-y-3">
            {specializedAgents.map(agent => {
              const isSelected = agent.id === selectedAgent.id;
              const isMultiSelected = selectedAgentIds.includes(agent.id);

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={cn(
                    "p-4 rounded-xl border text-left cursor-pointer transition-all",
                    isSelected 
                      ? "bg-surface border-accent/80 shadow-lg ring-1 ring-accent/40" 
                      : isMultiSelected
                        ? "bg-surface/80 border-accent/40 ring-1 ring-accent/20"
                        : "bg-surface/50 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelectAgent(agent.id, e)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title={isMultiSelected ? "Deselect Agent" : "Select Agent for Batch Operations"}
                      >
                        {isMultiSelected ? (
                          <CheckSquare size={15} className="text-accent" />
                        ) : (
                          <Square size={15} className="text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>

                      <span className="font-mono text-xs font-bold text-accent">{agent.codename}</span>
                      <h4 className="font-bold text-sm text-white">{agent.name}</h4>
                    </div>

                    {agent.status === 'AWAITING_APPROVAL' ? (
                      <QuickFixAssistant
                        side="right"
                        data={{
                          id: agent.id,
                          name: agent.name,
                          codename: agent.codename,
                          severity: 'AWAITING_APPROVAL',
                          issueSummary: `HITL guardrail triggered on ${agent.requiresHITLFor[0] || 'high-impact action'}.`,
                          rootCause: `Threshold exceeded on budget or creative deployment proposal. Awaiting Human-in-the-Loop review.`,
                          actionableSteps: [
                            'Verify ROAS margin safety constraint (Target: >3.5x)',
                            'Confirm audience saturation vector in Customer Vault',
                            'Click 1-Click mitigation below to approve and unblock agent'
                          ],
                          quickFixLabel: 'Approve & Resume Agent',
                          targetRoute: '/cockpit',
                          onApplyFix: () => {
                            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'ACTIVE' } : a));
                            if (selectedAgent.id === agent.id) {
                              setSelectedAgent(prev => ({ ...prev, status: 'ACTIVE' }));
                            }
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer animate-pulse"
                          title="Hover for Quick Fix Assistant"
                        >
                          <span>{agent.status}</span>
                          <Wrench size={10} />
                        </button>
                      </QuickFixAssistant>
                    ) : agent.status === 'PAUSED' ? (
                      <QuickFixAssistant
                        side="right"
                        data={{
                          id: agent.id,
                          name: agent.name,
                          codename: agent.codename,
                          severity: 'WARNING',
                          issueSummary: `Agent ${agent.codename} execution loop is currently PAUSED.`,
                          rootCause: `Operator manual pause or circuit breaker latch engaged.`,
                          actionableSteps: [
                            'Verify underlying tool and API rate limits',
                            'Check BullMQ priority partition health',
                            'Resume agent execution with 1-click mitigation'
                          ],
                          quickFixLabel: 'Resume Agent Execution',
                          onApplyFix: () => {
                            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'ACTIVE' } : a));
                            if (selectedAgent.id === agent.id) {
                              setSelectedAgent(prev => ({ ...prev, status: 'ACTIVE' }));
                            }
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-zinc-500/20 text-zinc-300 border border-zinc-500/40 hover:bg-zinc-500/30 flex items-center gap-1 cursor-pointer"
                          title="Hover for Quick Fix Assistant"
                        >
                          <span>{agent.status}</span>
                          <Wrench size={10} />
                        </button>
                      </QuickFixAssistant>
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        {agent.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2">{agent.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-muted">
                    <span>Skills: <strong className="text-white">{agent.skills.length}</strong></span>
                    <span>Sub-Agents: <strong className="text-secondary">{agent.subAgents.length}</strong></span>
                    <span>Accuracy: <strong className="text-accent">{agent.accuracyRate}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Agent Multi-Capability Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* Agent Inspector Header Banner */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded font-mono text-xs font-bold",
                    selectedAgent.isOrchestrator ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-accent/10 text-accent border border-accent/20"
                  )}>
                    {selectedAgent.codename}
                  </span>
                  {selectedAgent.isOrchestrator && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
                      <Crown size={10} /> MASTER ORCHESTRATOR
                    </span>
                  )}
                  <h3 className="text-xl font-bold silver-text">{selectedAgent.name}</h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{selectedAgent.role}</p>
              </div>

              {/* Action Buttons: Run, Export .md, Import .md */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setMdModal({ isOpen: true, mode: 'export' })}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  title="Export agent configuration to Markdown (.md)"
                >
                  <Download size={13} /> Export .md
                </button>

                <button
                  onClick={() => setMdModal({ isOpen: true, mode: 'import' })}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  title="Import agent configuration from Markdown (.md)"
                >
                  <Upload size={13} /> Import .md
                </button>

                <button
                  onClick={() => handleTriggerAgentRun(selectedAgent)}
                  disabled={isTriggeringRun}
                  className={cn(
                    "px-5 py-2 text-background font-black uppercase text-xs font-mono tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50",
                    selectedAgent.isOrchestrator ? "bg-purple-400 hover:bg-purple-300 shadow-purple-500/20" : "bg-accent hover:opacity-90 amber-glow"
                  )}
                >
                  {isTriggeringRun ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  {selectedAgent.isOrchestrator ? 'Trigger Orchestration' : 'Trigger Run'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs for Selected Agent */}
            <div className="flex flex-wrap gap-1 border-b border-white/5 pb-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'overview' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Lock size={12} /> Overview & RBAC
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'skills' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Zap size={12} /> Skills ({selectedAgent.skills.length})
              </button>

              <button
                onClick={() => setActiveTab('instructions')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'instructions' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <FileCode size={12} /> Instructions & Directives
              </button>

              <button
                onClick={() => setActiveTab('subagents')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'subagents' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Layers size={12} /> Sub-Agents ({selectedAgent.subAgents.length})
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'learning' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <BrainCircuit size={12} /> Self-Learning Loop
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'analytics' ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Activity size={12} /> Learning Analytics & Telemetry
              </button>

              <button
                onClick={() => {
                  setIsSimulationMode(false);
                  setActiveTab('files');
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'files' && !isSimulationMode ? "bg-accent text-background font-black shadow-sm" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <FolderGit2 size={12} /> Files & Configs
              </button>

              <button
                onClick={() => {
                  setIsSimulationMode(false);
                  setActiveTab('dag');
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'dag' && !isSimulationMode ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Workflow size={12} /> Data Flow DAG
              </button>

              <button
                onClick={() => {
                  setIsSimulationMode(true);
                  setActiveTab('simulation');
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'simulation' || isSimulationMode 
                    ? "bg-amber-500 text-background font-black shadow-lg shadow-amber-500/20" 
                    : "bg-amber-500/10 text-amber-300 hover:text-white hover:bg-amber-500/20 border border-amber-500/30"
                )}
              >
                <Sliders size={12} /> Simulation Mode (Beta)
              </button>

              <button
                onClick={() => {
                  setIsSimulationMode(false);
                  setActiveTab('logs');
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5",
                  activeTab === 'logs' && !isSimulationMode ? "bg-accent text-background font-black" : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Terminal size={12} /> Agent Logs
              </button>
            </div>

            {/* TAB CONTENT: 1. OVERVIEW & RBAC */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* RBAC Vault Access Matrix */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase text-muted tracking-widest flex items-center gap-2">
                    <Lock size={12} className="text-secondary" /> Enforced RBAC Vault Clearance Matrix
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-mono text-green-400 uppercase font-bold">Allowed Read Access</div>
                      <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                        {selectedAgent.readVaults.map((v, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check size={10} className="text-green-400 shrink-0" />
                            <span className="truncate">{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Allowed Write Access</div>
                      <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                        {selectedAgent.writeVaults.map((v, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check size={10} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-mono text-rose-400 uppercase font-bold">Blocked / Zero Access</div>
                      <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                        {selectedAgent.blockedVaults.map((v, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <X size={10} className="text-rose-400 shrink-0" />
                            <span className="truncate">{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* HITL Mandatory Gates */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-muted tracking-widest mb-2">
                    Mandatory Human-in-the-Loop Triggers:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.requiresHITLFor.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
                        ⚠ {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Run Execution Monitor & Trace Log */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} className="text-accent" />
                      <h4 className="text-xs font-bold silver-text uppercase tracking-tight">Active Execution Monitor</h4>
                    </div>
                    <span className="text-[10px] font-mono text-muted">Telemetry Node v2.4</span>
                  </div>

                  {liveSimRun ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                        <div>
                          <span className="text-xs font-bold text-white">{liveSimRun.taskTitle}</span>
                          <div className="text-[10px] font-mono text-accent">{liveSimRun.agentName}</div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                          liveSimRun.status === 'COMPLETED' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        )}>
                          {liveSimRun.status}
                        </span>
                      </div>

                      {/* Step Flow */}
                      <div className="space-y-2">
                        {liveSimRun.steps.map((step, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between",
                              step.status === 'completed' ? "bg-white/[0.02] border-white/5 text-zinc-300" :
                              "bg-accent/10 border-accent/40 text-accent font-bold"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {step.status === 'completed' ? (
                                <CheckCircle2 size={14} className="text-green-400" />
                              ) : (
                                <RefreshCw size={14} className="animate-spin text-accent" />
                              )}
                              <span>{step.phase}: {step.description}</span>
                            </div>
                            <span className="text-[10px] text-muted">{step.timestamp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Console Trace Log */}
                      <div className="bg-black/70 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-zinc-400 space-y-1 max-h-36 overflow-y-auto">
                        <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Raw Trace Stream</div>
                        {liveSimRun.traceLog.map((log, i) => (
                          <div key={i} className="text-zinc-300">{log}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-black/20 rounded-xl border border-dashed border-white/10 text-xs text-muted font-mono">
                      No active execution. Click &quot;Trigger Run&quot; above to launch a verified lifecycle trace for {selectedAgent.codename}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. AGENT SKILLS */}
            {activeTab === 'skills' && (
              <AgentSkillsManager
                agent={selectedAgent}
                onUpdateSkills={handleUpdateSkills}
              />
            )}

            {/* TAB CONTENT: 3. INSTRUCTIONS & DIRECTIVES */}
            {activeTab === 'instructions' && (
              <AgentInstructionsEditor
                agent={selectedAgent}
                onSaveInstructions={handleUpdateInstructions}
                onTestInSimulation={() => {
                  setIsSimulationMode(true);
                  setActiveTab('simulation');
                }}
              />
            )}

            {/* TAB CONTENT: 4. SUB-AGENTS */}
            {activeTab === 'subagents' && (
              <AgentSubAgentsList
                agent={selectedAgent}
                onUpdateSubAgents={handleUpdateSubAgents}
                onSubAgentDispatched={handleSubAgentDispatched}
              />
            )}

            {/* TAB CONTENT: 5. SELF-LEARNING LOOP */}
            {activeTab === 'learning' && (
              <AgentSelfLearningPanel
                agent={selectedAgent}
                onUpdateLearningProfile={handleUpdateLearningProfile}
                onLearningCycleCompleted={handleLearningCycleCompleted}
              />
            )}

            {/* TAB CONTENT: 6. LEARNING ANALYTICS & TELEMETRY (RECHARTS) */}
            {activeTab === 'analytics' && (
              <AgentLearningAnalyticsTab
                agent={selectedAgent}
                allAgents={agents}
              />
            )}

            {/* TAB CONTENT: 6b. AGENT FILES & CONFIGS REPOSITORY */}
            {activeTab === 'files' && !isSimulationMode && (
              <AgentFilesManager
                agent={selectedAgent}
                onUpdateAgent={(updatedAgent, summaryLog) => {
                  setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
                  setSelectedAgent(updatedAgent);
                  if (summaryLog) {
                    setAgentLogs(prev => [
                      {
                        id: `log-${Date.now()}-file-sync`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        agentId: updatedAgent.id,
                        agentCodename: updatedAgent.codename,
                        level: 'INFO',
                        category: 'MODEL',
                        message: summaryLog,
                        details: { filesSynced: true }
                      },
                      ...prev
                    ]);
                  }
                }}
              />
            )}

            {/* TAB CONTENT: 7. DIRECTED ACYCLIC GRAPH (DAG) */}
            {activeTab === 'dag' && !isSimulationMode && (
              <AgentDAGVisualization
                agents={agents}
                activeAgentId={selectedAgent.id}
                onSelectAgent={(agentId) => {
                  const matched = agents.find(a => a.id === agentId);
                  if (matched) setSelectedAgent(matched);
                }}
                onLaunchSimulation={() => {
                  setIsSimulationMode(true);
                  setActiveTab('simulation');
                }}
              />
            )}

            {/* TAB CONTENT: 7b. SIMULATION MODE */}
            {(activeTab === 'simulation' || isSimulationMode) && (
              <AgentSimulationMode
                orchestratorAgent={orchestratorAgent}
                allAgents={agents}
                onDeployToLive={handleDeploySimulation}
                onExitSimulation={() => {
                  setIsSimulationMode(false);
                  setActiveTab('dag');
                }}
              />
            )}

            {/* TAB CONTENT: 8. AGENT LOGS */}
            {activeTab === 'logs' && !isSimulationMode && (
              <AgentLogsViewer
                logs={agentLogs}
                agents={agents}
                activeAgentId={selectedAgent.id}
                onClearLogs={() => {
                  setAgentLogs([]);
                  notifyInfo('Logs Cleared', 'Agent telemetry buffer emptied.');
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Batch Operations Bar */}
      <AnimatePresence>
        {selectedAgentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0d1017]/95 border border-accent/40 shadow-2xl rounded-2xl p-3 px-5 backdrop-blur-2xl flex items-center gap-3 sm:gap-4 shadow-accent/10"
          >
            <div className="flex items-center gap-2 border-r border-white/10 pr-3 sm:pr-4">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <div className="text-xs font-mono font-bold text-white whitespace-nowrap">
                <span>{selectedAgentIds.length}</span>
                <span className="text-muted font-normal"> of {agents.length} Agents Selected</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBatchPauseToggle}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                title="Pause or resume all selected agents"
              >
                {agents.filter(a => selectedAgentIds.includes(a.id)).every(a => a.status === 'PAUSED') ? (
                  <>
                    <PlayCircle size={14} className="text-green-400" />
                    <span>Resume Selected</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={14} className="text-amber-400" />
                    <span>Pause Selected</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBatchSync}
                disabled={isBatchSyncing}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Synchronize Second Brain vector embeddings across selected agents"
              >
                <RefreshCw size={14} className={cn("text-cyan-400", isBatchSyncing && "animate-spin")} />
                <span>{isBatchSyncing ? 'Syncing...' : 'Sync Knowledge'}</span>
              </button>

              <button
                onClick={handleBatchExport}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                title="Download multi-agent configuration package (.md)"
              >
                <Download size={14} className="text-accent" />
                <span>Export Bundle (.md)</span>
              </button>

              <button
                onClick={handleBatchBenchmark}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-mono font-bold transition-all items-center gap-1.5"
              >
                <Zap size={14} className="text-yellow-400" />
                <span>Benchmark</span>
              </button>

              <button
                onClick={handleDeselectAll}
                className="p-1.5 rounded-xl hover:bg-white/10 text-muted hover:text-white transition-all ml-1"
                title="Clear selection"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Markdown Import / Export Modal */}
      <AgentMarkdownModal
        mode={mdModal.mode}
        agent={selectedAgent}
        isOpen={mdModal.isOpen}
        onClose={() => setMdModal({ ...mdModal, isOpen: false })}
        onApplyImport={handleApplyMarkdownImport}
      />
    </div>
  );
}
