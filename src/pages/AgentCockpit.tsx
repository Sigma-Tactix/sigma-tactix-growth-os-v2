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
import { Button, GlassCard, Badge, Tabs, type TabItem } from '@/src/components/ui';
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
import AgentTraceInspector from '@/src/components/AgentTraceInspector';
import { downloadAgentMarkdown, downloadMultiAgentBundleMarkdown } from '@/src/services/agentMarkdownService';
import { useToast } from '@/src/contexts/ToastContext';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useTaskStore } from '@/src/lib/taskStore';

export default function AgentCockpit() {
  const { notifySuccess, notifyWarning, notifyInfo } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const {
    tasks: sharedTasks,
    logs: sharedLogs,
    pendingCount: sharedPendingCount,
    approveTask: approveSharedTask,
    rejectTask: rejectSharedTask,
    refresh: refreshSharedTasks,
  } = useTaskStore(currentWorkspaceId || 'ws-primary');

  const [agents, setAgents] = useState<ScopedAgent[]>(SCOPED_AGENTS);
  const [localTasks, setLocalTasks] = useState<HITLTask[]>(INITIAL_HITL_TASKS);
  const [localLogs, setLocalLogs] = useState<CockpitLogItem[]>(INITIAL_AGENT_LOGS);

  // Shared durable HITL tasks
  const hitlTasks = React.useMemo(() => {
    return sharedTasks.length > 0 ? sharedTasks : localTasks;
  }, [sharedTasks, localTasks]);

  const setHitlTasks = setLocalTasks;
  const setAgentLogs = setLocalLogs;

  const [agentRuns, setAgentRuns] = useState<AgentRunLog[]>(INITIAL_AGENT_RUNS);

  // Derive execution logs from durable task actions and baseline events
  const agentLogs = React.useMemo(() => {
    return [...sharedLogs, ...localLogs];
  }, [sharedLogs, localLogs]);

  const [selectedAgent, setSelectedAgent] = useState<ScopedAgent>(SCOPED_AGENTS[0]);
  const [activeTaskModal, setActiveTaskModal] = useState<HITLTask | null>(null);
  const [isTriggeringRun, setIsTriggeringRun] = useState(false);
  const [liveSimRun, setLiveSimRun] = useState<AgentRunLog | null>(null);
  const simTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Multi-select batch operations state
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  // Active Inspector Tab & Simulation Mode state
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'instructions' | 'subagents' | 'learning' | 'analytics' | 'traces' | 'files' | 'dag' | 'simulation' | 'logs'>('overview');
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

  const handleApproveHITL = async (taskId: string) => {
    const task = hitlTasks.find(t => t.id === taskId);
    setActiveTaskModal(null);
    setHitlTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'APPROVED' } : t));

    const result = await approveSharedTask(taskId);
    if (result.success) {
      notifySuccess(
        'HITL Action Approved & Executed',
        `Signed off by Admin. Server approved and executed task "${task?.title || taskId}".`,
        { category: 'SECURITY' }
      );
    } else {
      notifyWarning('Approval Notice', result.error || 'Server approval failed.');
    }
  };

  const handleRejectHITL = async (taskId: string) => {
    const task = hitlTasks.find(t => t.id === taskId);
    setActiveTaskModal(null);
    setHitlTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'REJECTED' } : t));

    const result = await rejectSharedTask(taskId);
    if (result.success) {
      notifyWarning(
        'HITL Action Rejected',
        `Signed off by Admin. Task "${task?.title || taskId}" marked rejected.`,
        { category: 'SECURITY' }
      );
    } else {
      notifyWarning('Rejection Notice', result.error || 'Server rejection failed.');
    }
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
          // Phase 0: this timeline is a local rehearsal of the agent loop, not a
          // server execution. Nothing was committed anywhere, so it must not
          // claim a Postgres commit or a state commit. The run is labelled a
          // simulation in the UI and its telemetry is marked simulated.
          { phase: '05 Rehearsal complete', description: 'Local rehearsal finished — no server run, no persisted state', timestamp: '00:00:18', status: 'completed' }
        ],
        traceLog: [
          `[00:00:01] [SIM] Rehearsal step: task "agent.codename" staged locally`,
          `[00:00:02] [SIM] Rehearsal step: allowed read vaults shown as ${agent.readVaults.join(', ')}`,
          `[00:00:04] [SIM] Rehearsal step: planning phase described, not executed`,
          `[00:00:09] [SIM] Rehearsal step: illustrative tool call only`,
          `[00:00:15] [SIM] Rehearsal step: illustrative review gate only`,
          `[00:00:18] [SIM] Rehearsal finished — no agent was dispatched and nothing was persisted`
        ]
      };

      setLiveSimRun(completedRun);
      setAgentRuns(current => [completedRun, ...current]);
      setIsTriggeringRun(false);

      const currentHour = `${String(new Date().getHours()).padStart(2, '0')}:00`;
      // Phase 0: this is a local rehearsal, so its telemetry is marked simulated and
      // buildHeatmapMatrix() keeps it out of verified load/success/latency. It must
      // never be written as a verified event — no agent ran, nothing persisted.
      appendTelemetryEvent({
        id: `evt-${Date.now()}-${agent.id}`,
        agentId: agent.id,
        interval: currentHour,
        status: 'completed',
        latencyMs: 180,
        hitlRequired: (agent.requiresHITLFor && agent.requiresHITLFor.length > 0) || false,
        timestamp: Date.now(),
        simulated: true,
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--sigma-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand" size="sm" icon={<Bot size={12} />}>Agent Governance Layer</Badge>
            <Badge variant="neutral" size="sm">Multi-Agent Growth OS</Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[var(--sigma-text)]">
            Autonomous Agent Cockpit
          </h1>
          <p className="text-sm text-[var(--sigma-text-muted)] max-w-3xl mt-1.5 font-normal leading-relaxed">
            Orchestrate scoped autonomous execution across content, SEO authority, performance marketing, and operations with strict RBAC boundaries, dedicated sub-agents, live learning loops, and Human-in-the-Loop (HITL) gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={isSimulationMode || activeTab === 'simulation' ? "primary" : "secondary"}
            size="sm"
            icon={<Sliders size={13} />}
            onClick={() => {
              const nextMode = !isSimulationMode;
              setIsSimulationMode(nextMode);
              if (nextMode) setActiveTab('simulation');
              else if (activeTab === 'simulation') setActiveTab('dag');
            }}
          >
            {isSimulationMode || activeTab === 'simulation' ? "Exit Simulation" : "Simulation Mode"}
          </Button>

          <Button
            variant={activeTab === 'dag' && !isSimulationMode ? "primary" : "secondary"}
            size="sm"
            icon={<Workflow size={13} />}
            onClick={() => {
              setIsSimulationMode(false);
              setActiveTab('dag');
            }}
          >
            Data Flow DAG
          </Button>

          <Button
            variant={activeTab === 'analytics' ? "primary" : "secondary"}
            size="sm"
            icon={<Activity size={13} />}
            onClick={() => setActiveTab('analytics')}
          >
            Telemetry
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Crown size={13} className="text-purple-400" />}
            onClick={() => {
              setSelectedAgent(orchestratorAgent);
              handleTriggerAgentRun(orchestratorAgent);
            }}
            disabled={isTriggeringRun}
          >
            Orchestrate Pipeline
          </Button>

          <Badge variant={pendingHitlCount > 0 ? "warning" : "neutral"} size="md" dot={pendingHitlCount > 0} icon={<AlertTriangle size={12} />}>
            HITL Gate: {pendingHitlCount} Pending
          </Badge>
        </div>
      </div>

      {/* HITL Pending Approvals Section */}
      <GlassCard spotlight className="space-y-5" data-tutorial-id="tut-hitl-queue">
        <div className="flex items-center justify-between border-b border-[var(--sigma-border)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--sigma-primary)]/10 border border-[var(--sigma-primary)]/20 flex items-center justify-center text-[var(--sigma-primary)]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--sigma-text)]">Human-in-the-Loop (HITL) Approval Queue</h3>
              <p className="text-xs text-[var(--sigma-text-muted)]">Guarded state machine: destructive actions, public releases, and major budget shifts require explicit sign-off.</p>
            </div>
          </div>
          <Badge variant={pendingHitlCount > 0 ? "warning" : "neutral"} size="sm">
            {pendingHitlCount} Pending Review
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {hitlTasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3.5 bg-[var(--sigma-surface-subtle)]",
                task.status === 'PENDING' ? "border-[#ff481b]/30 shadow-md" :
                task.status === 'APPROVED' ? "border-emerald-500/20 opacity-70" :
                "border-rose-500/20 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={task.riskLevel === 'HIGH' ? 'danger' : task.riskLevel === 'MEDIUM' ? 'warning' : 'info'}
                    size="xs"
                  >
                    {task.riskLevel} RISK
                  </Badge>
                  <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">{task.requestedAt}</span>
                </div>

                <h4 className="text-xs font-semibold text-[var(--sigma-text)] leading-snug">{task.title}</h4>
                <div className="text-[10px] font-mono text-[#ff481b] mt-0.5">{task.agentName}</div>

                <p className="text-xs text-[var(--sigma-text-soft)] mt-2.5 bg-[var(--sigma-bg)] p-2.5 rounded-lg border border-[var(--sigma-border)] leading-relaxed">
                  {task.proposedAction}
                </p>

                <div className="text-[11px] text-[var(--sigma-text-muted)] mt-2.5 space-y-1">
                  <div><strong className="text-[var(--sigma-text)]">Rationale:</strong> {task.rationale}</div>
                  <div><strong className="text-[#ff481b]">Expected Impact:</strong> {task.impactEstimate}</div>
                  <div><strong className="text-[var(--sigma-text-muted)]">Target Vault:</strong> {task.vaultAffected}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--sigma-border)] flex items-center justify-between">
                {task.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      icon={<X size={12} />}
                      onClick={() => handleRejectHITL(task.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      icon={<Check size={12} />}
                      onClick={() => handleApproveHITL(task.id)}
                    >
                      Approve
                    </Button>
                  </div>
                ) : (
                  <div className="w-full text-center py-0.5 text-xs font-mono font-medium flex items-center justify-center gap-1.5">
                    {task.status === 'APPROVED' ? (
                      <Badge variant="success" size="sm" icon={<CheckCircle2 size={12} />}>
                        Approved & Executed
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" icon={<XCircle size={12} />}>
                        Rejected by Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

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
                className="p-1 rounded hover:bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer"
                title={selectedAgentIds.length === agents.length ? "Deselect All Agents" : "Select All Agents"}
              >
                {selectedAgentIds.length === agents.length ? (
                  <CheckSquare size={16} className="text-[#ff481b]" />
                ) : (
                  <Square size={16} className="text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]" />
                )}
              </button>
              <h3 className="text-base font-semibold text-[var(--sigma-text)]">Agent Fleet Hierarchy</h3>
            </div>
            <Badge variant="neutral" size="xs">{agents.length} Nodes Configured</Badge>
          </div>

          {/* Master Orchestrator Highlight Card */}
          {orchestratorAgent && (
            <GlassCard
              spotlight
              interactive
              onClick={() => setSelectedAgent(orchestratorAgent)}
              className={cn(
                "p-4 text-left transition-all relative overflow-hidden",
                selectedAgent.id === orchestratorAgent.id 
                  ? "ring-1 ring-purple-500/80 border-purple-500/50 bg-purple-950/20 shadow-lg" 
                  : "border-purple-500/20 hover:border-purple-500/40 bg-purple-950/10"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleSelectAgent(orchestratorAgent.id, e)}
                    className="p-1 rounded hover:bg-[var(--sigma-surface-subtle)] transition-colors cursor-pointer"
                    title={selectedAgentIds.includes(orchestratorAgent.id) ? "Deselect Agent" : "Select Agent for Batch Operations"}
                  >
                    {selectedAgentIds.includes(orchestratorAgent.id) ? (
                      <CheckSquare size={15} className="text-purple-400" />
                    ) : (
                      <Square size={15} className="text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]" />
                    )}
                  </button>

                  <Badge variant="neutral" size="xs" icon={<Crown size={10} className="text-purple-400" />}>
                    {orchestratorAgent.codename}
                  </Badge>
                  <Badge variant="neutral" size="xs">
                    MASTER ORCHESTRATOR
                  </Badge>
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
                      className="cursor-pointer"
                    >
                      <Badge variant="warning" size="xs" dot icon={<Wrench size={9} />}>
                        PAUSED
                      </Badge>
                    </button>
                  </QuickFixAssistant>
                ) : (
                  <Badge variant="success" size="xs" dot>
                    {orchestratorAgent.status}
                  </Badge>
                )}
              </div>

              <h4 className="font-semibold text-xs text-[var(--sigma-text)] mb-1">{orchestratorAgent.name}</h4>
              <p className="text-xs text-[var(--sigma-text-muted)] line-clamp-2 leading-relaxed">{orchestratorAgent.description}</p>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--sigma-border)] text-[10px] font-mono text-[var(--sigma-text-muted)]">
                <span>Skills: <strong className="text-[var(--sigma-text)] font-semibold">{orchestratorAgent.skills.length}</strong></span>
                <span>Sub-Agents: <strong className="text-purple-400 font-semibold">{orchestratorAgent.subAgents.length}</strong></span>
                <span>Accuracy: <strong className="text-[#ff481b] font-semibold">{orchestratorAgent.accuracyRate}</strong></span>
              </div>
            </GlassCard>
          )}

          <div className="text-xs font-mono uppercase text-[var(--sigma-text-muted)] tracking-wider pt-2">
            Specialized Execution Agents
          </div>

          <div className="space-y-3">
            {specializedAgents.map(agent => {
              const isSelected = agent.id === selectedAgent.id;
              const isMultiSelected = selectedAgentIds.includes(agent.id);

              return (
                <GlassCard
                  key={agent.id}
                  interactive
                  onClick={() => setSelectedAgent(agent)}
                  className={cn(
                    "p-3.5 text-left transition-all",
                    isSelected 
                      ? "ring-1 ring-[#ff481b]/50 border-[#ff481b]/40 shadow-sm" 
                      : isMultiSelected
                        ? "border-[#ff481b]/25 bg-[#ff481b]/5"
                        : "border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelectAgent(agent.id, e)}
                        className="p-0.5 rounded hover:bg-[var(--sigma-surface-subtle)] transition-colors cursor-pointer"
                        title={isMultiSelected ? "Deselect Agent" : "Select Agent for Batch Operations"}
                      >
                        {isMultiSelected ? (
                          <CheckSquare size={14} className="text-[#ff481b]" />
                        ) : (
                          <Square size={14} className="text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]" />
                        )}
                      </button>

                      <span className="font-mono text-xs font-semibold text-[#ff481b]">{agent.codename}</span>
                      <h4 className="font-semibold text-xs text-[var(--sigma-text)] truncate">{agent.name}</h4>
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
                          className="cursor-pointer"
                          title="Hover for Quick Fix Assistant"
                        >
                          <Badge variant="warning" size="xs" dot icon={<Wrench size={9} />}>
                            APPROVAL
                          </Badge>
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
                          className="cursor-pointer"
                          title="Hover for Quick Fix Assistant"
                        >
                          <Badge variant="neutral" size="xs" icon={<Wrench size={9} />}>
                            PAUSED
                          </Badge>
                        </button>
                      </QuickFixAssistant>
                    ) : (
                      <Badge variant="success" size="xs" dot>
                        {agent.status}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--sigma-text-muted)] line-clamp-2 leading-relaxed">{agent.description}</p>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--sigma-border)] text-[10px] font-mono text-[var(--sigma-text-muted)]">
                    <span>Skills: <strong className="text-[var(--sigma-text)] font-semibold">{agent.skills.length}</strong></span>
                    <span>Sub-Agents: <strong className="text-[var(--sigma-primary)] font-semibold">{agent.subAgents.length}</strong></span>
                    <span>Accuracy: <strong className="text-[#ff481b] font-semibold">{agent.accuracyRate}</strong></span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Agent Multi-Capability Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* Agent Inspector Card */}
          <GlassCard spotlight className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sigma-border)] pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedAgent.isOrchestrator ? "neutral" : "brand"} size="sm">
                    {selectedAgent.codename}
                  </Badge>
                  {selectedAgent.isOrchestrator && (
                    <Badge variant="neutral" size="sm" icon={<Crown size={10} className="text-purple-400" />}>
                      MASTER ORCHESTRATOR
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-[var(--sigma-text)]">{selectedAgent.name}</h3>
                </div>
                <p className="text-xs text-[var(--sigma-text-muted)] mt-1">{selectedAgent.role}</p>
              </div>

              {/* Action Buttons: Run, Export .md, Import .md */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={() => setMdModal({ isOpen: true, mode: 'export' })}
                  title="Export agent configuration to Markdown (.md)"
                >
                  Export .md
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={13} />}
                  onClick={() => setMdModal({ isOpen: true, mode: 'import' })}
                  title="Import agent configuration from Markdown (.md)"
                >
                  Import .md
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={isTriggeringRun ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                  disabled={isTriggeringRun}
                  onClick={() => handleTriggerAgentRun(selectedAgent)}
                >
                  {selectedAgent.isOrchestrator ? 'Trigger Orchestration' : 'Trigger Run'}
                </Button>
              </div>
            </div>

            {/* Navigation Tabs for Selected Agent */}
            <div className="overflow-x-auto no-scrollbar pb-1">
              <Tabs
                tabs={[
                  { id: 'overview', label: 'Overview & RBAC', icon: <Lock size={12} /> },
                  { id: 'skills', label: 'Skills', icon: <Zap size={12} />, badge: selectedAgent.skills.length },
                  { id: 'instructions', label: 'Instructions', icon: <FileCode size={12} /> },
                  { id: 'subagents', label: 'Sub-Agents', icon: <Layers size={12} />, badge: selectedAgent.subAgents.length },
                  { id: 'learning', label: 'Self-Learning', icon: <BrainCircuit size={12} /> },
                  { id: 'analytics', label: 'Telemetry', icon: <Activity size={12} /> },
                  { id: 'traces', label: 'Traces', icon: <Eye size={12} /> },
                  { id: 'files', label: 'Configs', icon: <FolderGit2 size={12} /> },
                  { id: 'dag', label: 'Data Flow DAG', icon: <Workflow size={12} /> },
                  { id: 'simulation', label: 'Simulation', icon: <Sliders size={12} /> },
                  { id: 'logs', label: 'Logs', icon: <Terminal size={12} /> },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => {
                  if (tabId === 'simulation') {
                    setIsSimulationMode(true);
                    setActiveTab('simulation');
                  } else {
                    setIsSimulationMode(false);
                    setActiveTab(tabId as any);
                  }
                }}
                variant="pill"
                size="sm"
              />
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
            {activeTab === 'traces' && !isSimulationMode && (
              <AgentTraceInspector
                agentId={selectedAgent.id}
                agentName={selectedAgent.name}
                agentCodename={selectedAgent.codename}
              />
            )}

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
          </GlassCard>
        </div>
      </div>

      {/* Floating Batch Operations Bar */}
      <AnimatePresence>
        {selectedAgentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--sigma-surface)]/95 border border-[#ff481b]/30 shadow-2xl rounded-2xl p-2 px-3.5 backdrop-blur-2xl flex items-center gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-2 border-r border-[var(--sigma-border)] pr-3 sm:pr-4">
              <span className="w-2 h-2 rounded-full bg-[#ff481b] animate-pulse" />
              <div className="text-xs font-mono font-medium text-[var(--sigma-text)] whitespace-nowrap">
                <span className="font-bold">{selectedAgentIds.length}</span>
                <span className="text-[var(--sigma-text-muted)] font-normal"> of {agents.length} Selected</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="secondary"
                size="xs"
                onClick={handleBatchPauseToggle}
                icon={agents.filter(a => selectedAgentIds.includes(a.id)).every(a => a.status === 'PAUSED') ? (
                  <PlayCircle size={13} className="text-emerald-400" />
                ) : (
                  <PauseCircle size={13} className="text-amber-400" />
                )}
              >
                {agents.filter(a => selectedAgentIds.includes(a.id)).every(a => a.status === 'PAUSED') ? 'Resume' : 'Pause'}
              </Button>

              <Button
                variant="secondary"
                size="xs"
                onClick={handleBatchSync}
                disabled={isBatchSyncing}
                icon={<RefreshCw size={13} className={cn("text-sky-400", isBatchSyncing && "animate-spin")} />}
              >
                {isBatchSyncing ? 'Syncing...' : 'Sync Knowledge'}
              </Button>

              <Button
                variant="secondary"
                size="xs"
                onClick={handleBatchExport}
                icon={<Download size={13} className="text-[#ff481b]" />}
              >
                Export Bundle (.md)
              </Button>

              <Button
                variant="secondary"
                size="xs"
                onClick={handleBatchBenchmark}
                className="hidden sm:flex"
                icon={<Zap size={13} className="text-amber-400" />}
              >
                Benchmark
              </Button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="p-1 rounded-lg hover:bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all ml-1 cursor-pointer"
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
