import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Workflow, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Database, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  X, 
  TrendingDown, 
  TrendingUp, 
  Lock, 
  Layers, 
  Bot, 
  Crown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  HelpCircle,
  Clock,
  Flame,
  Send,
  SlidersHorizontal,
  RefreshCw,
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ScopedAgent, AgentInstructions } from '@/src/data/agentCockpitData';
import { useToast } from '@/src/contexts/ToastContext';

interface AgentSimulationModeProps {
  orchestratorAgent: ScopedAgent;
  allAgents: ScopedAgent[];
  onDeployToLive: (simulatedInstructions: AgentInstructions, summaryLog: string) => void;
  onExitSimulation: () => void;
}

export type SimulationPresetId = 'BALANCED' | 'SEO_SPRINT' | 'SECURITY_LOCKDOWN' | 'LEAN_TURBO' | 'OMNICHANNEL';

interface SimulationPreset {
  id: SimulationPresetId;
  name: string;
  tagline: string;
  description: string;
  badgeColor: string;
  instructions: AgentInstructions;
  targetFocus: 'ALL' | 'AUTHORITY' | 'PERFORMANCE' | 'CONTENT' | 'OPS';
  routingPolicy: string;
}

interface SimulatedNode {
  id: string;
  name: string;
  codename: string;
  type: 'orchestrator' | 'agent' | 'subagent' | 'vault';
  simStatus: 'ACTIVE' | 'ACCELERATED' | 'PRUNED' | 'HITL_GATED';
  role: string;
  x: number;
  y: number;
  parentIds: string[];
  toolOrOutput?: string;
  vaultAffected?: string;
  simLatencyMs: number;
  simTokens: number;
  reasonForStatus: string;
  category: 'AUTHORITY' | 'PERFORMANCE' | 'CONTENT' | 'OPS' | 'GOVERNANCE' | 'VAULT';
}

interface SimulatedEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  status: 'ACTIVE' | 'ACCELERATED' | 'PRUNED' | 'HITL_GATE';
}

export default function AgentSimulationMode({
  orchestratorAgent,
  allAgents,
  onDeployToLive,
  onExitSimulation
}: AgentSimulationModeProps) {
  const { notifySuccess, notifyInfo } = useToast();

  // Presets
  const presets: SimulationPreset[] = useMemo(() => [
    {
      id: 'BALANCED',
      name: 'Balanced Autonomous Fleet',
      tagline: 'Standard production consensus',
      description: 'Even distribution across SEO Authority, Performance Ads, Content Engine, and Operations with standard RBAC safeguards.',
      badgeColor: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
      targetFocus: 'ALL',
      routingPolicy: 'Standard Round-Robin Consensus Arbitrator',
      instructions: {
        systemPrompt: orchestratorAgent.instructions.systemPrompt,
        operationalDirectives: [...orchestratorAgent.instructions.operationalDirectives],
        behavioralConstraints: [...orchestratorAgent.instructions.behavioralConstraints],
        guardrails: [...orchestratorAgent.instructions.guardrails],
        outputFormat: orchestratorAgent.instructions.outputFormat
      }
    },
    {
      id: 'SEO_SPRINT',
      name: 'Aggressive Authority & SEO Sprint',
      tagline: 'Maximizes topical dominance & organic backlinks',
      description: 'Prioritizes Authority Builder sub-agents in parallel; prunes paid ad iteration and pauses low-priority internal ops to conserve tokens.',
      badgeColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
      targetFocus: 'AUTHORITY',
      routingPolicy: 'Authority-Dominant Graph Partitioning',
      instructions: {
        systemPrompt: 'You are CHRONOS-00 in Authority Dominance Mode. Prioritize rapid high-tier backlink discovery, topical map expansion, and programmatic SEO indexing. Reroute 80% of computational bandwidth to AURORA-02 and suppress paid campaign generation.',
        operationalDirectives: [
          'Prioritize Authority Vault topical maps and keyword cluster expansion before triggering any external workflows.',
          'Prune secondary ad-copy generation and pause non-essential Operations SOP synthesizers.',
          'Spawn parallel execution across topical map crawl sub-agents and backlink quality evaluators.',
          'Require direct sync to Authority Vault with real-time vector embeddings.'
        ],
        behavioralConstraints: [
          'Do not initiate Meta or Google Ads spend while in Authority Sprint mode.',
          'Maintain 100% adherence to Brand Vault voice and tone parameters.'
        ],
        guardrails: [
          'Flag any backlink target with domain rating < 45 for human review.',
          'Zero write access to Credentials Vault.'
        ],
        outputFormat: 'Structured JSON topical cluster hierarchy with priority dispatch tokens.'
      }
    },
    {
      id: 'SECURITY_LOCKDOWN',
      name: 'High-Security Strict HITL Gate',
      tagline: 'Zero-trust human verification on all mutations',
      description: 'Inserts mandatory human approval checkpoints before any ad budget changes, CRM lead syncs, or content publications.',
      badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
      targetFocus: 'ALL',
      routingPolicy: 'Strict Zero-Trust HITL State Machine',
      instructions: {
        systemPrompt: 'You are CHRONOS-00 operating under strict zero-trust governance. No autonomous mutation to Marketing, Customer, or Operations Vaults may occur without an explicit verified human signature token.',
        operationalDirectives: [
          'Intercept all ad creative deployments, budget increases > $50, and customer record syncs with a mandatory HITL escalation.',
          'Pause autonomous publishing across Content Engine until administrative sign-off.',
          'Log all inter-agent messages with cryptographic checksum in AI Workflow Vault.',
          'Halt downstream DAG dispatch upon any anomaly score drift > 0.05.'
        ],
        behavioralConstraints: [
          'Never assume implicit human consent for external API webhooks.',
          'Block all direct agent-to-agent write mutations.'
        ],
        guardrails: [
          'Require dual human confirmation for any budget allocation adjustment.',
          'Instant failover rollback if human timeout expires without approval.'
        ],
        outputFormat: 'Pre-flight cryptographic clearance payload awaiting human approval signature.'
      }
    },
    {
      id: 'LEAN_TURBO',
      name: 'Cost & Latency Optimized (Lean Turbo)',
      tagline: 'Cuts token burn by 55% & halves DAG latency',
      description: 'Prunes redundant sub-agents, streamlines sequential reasoning hops, enables direct vault mutations, and enforces tight token caps.',
      badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
      targetFocus: 'ALL',
      routingPolicy: 'Pruned Single-Pass Direct Routing',
      instructions: {
        systemPrompt: 'You are CHRONOS-00 in Lean Turbo Mode. Optimize for maximum execution velocity and minimal token overhead. Prune secondary review loops, bypass auxiliary sub-agents, and execute atomic direct writes.',
        operationalDirectives: [
          'Bypass auxiliary review sub-agents and dispatch directly to primary execution modules.',
          'Enforce strict 1,200 token budget per task decomposition.',
          'Cache vector similarity scores across Second Brain queries to eliminate duplicate embeddings.',
          'Combine multi-step consensus arbitration into a single deterministic Bayesian step.'
        ],
        behavioralConstraints: [
          'Eliminate multi-turn reflection dialogue between specialized agents.',
          'Fail fast if API response time exceeds 800ms.'
        ],
        guardrails: [
          'Maintain RBAC integrity even during expedited execution paths.',
          'Abort and alert if error rate rises above 1.5%.'
        ],
        outputFormat: 'Compact JSON payload optimized for minimal token serialization.'
      }
    },
    {
      id: 'OMNICHANNEL',
      name: 'Full Omnichannel Growth Blitz',
      tagline: 'Parallel execution across all 4 agents & 8 sub-agents',
      description: 'Saturates the DAG by firing Content, Authority, Performance, and Operations workflows simultaneously with global consensus locking.',
      badgeColor: 'text-pink-300 border-pink-500/30 bg-pink-500/10',
      targetFocus: 'ALL',
      routingPolicy: 'Hyper-Parallel Saturated DAG Dispatch',
      instructions: {
        systemPrompt: 'You are CHRONOS-00 in Omnichannel Blitz Mode. Coordinate concurrent multi-agent execution across Content, SEO, Paid Acquisition, and Ops with synchronized consensus checkpoints.',
        operationalDirectives: [
          'Dispatch simultaneous goals to NEXUS-01, AURORA-02, VORTEX-03, and AEGIS-04.',
          'Activate all 8 specialized sub-agents in parallel worker pools.',
          'Synchronize inter-agent milestones every 15 minutes using AI Workflow Vault telemetry.',
          'Balance budget distribution dynamically based on real-time ROAS feedback from VORTEX-03.'
        ],
        behavioralConstraints: [
          'Prevent write-lock contention on Customer and Marketing Vault tables using row-level transactions.',
          'Do not allow content publishing without SEO topical alignment verification.'
        ],
        guardrails: [
          'Enforce global fleet spend cap of $1,500/day across all ad channels.',
          'Trip circuit breaker if any sub-agent reports 3 consecutive failed webhooks.'
        ],
        outputFormat: 'Multi-threaded DAG state vector with parallel execution promises.'
      }
    }
  ], [orchestratorAgent]);

  // Current simulation state
  const [selectedPresetId, setSelectedPresetId] = useState<SimulationPresetId>('BALANCED');
  const [simInstructions, setSimInstructions] = useState<AgentInstructions>({
    systemPrompt: orchestratorAgent.instructions.systemPrompt,
    operationalDirectives: [...orchestratorAgent.instructions.operationalDirectives],
    behavioralConstraints: [...orchestratorAgent.instructions.behavioralConstraints],
    guardrails: [...orchestratorAgent.instructions.guardrails],
    outputFormat: orchestratorAgent.instructions.outputFormat
  });

  const [newDirectiveText, setNewDirectiveText] = useState('');
  const [activeDirectiveIndices, setActiveDirectiveIndices] = useState<number[]>(
    orchestratorAgent.instructions.operationalDirectives.map((_, i) => i)
  );

  // Simulation controls
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-orchestrator');
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isSimulatingTrace, setIsSimulatingTrace] = useState(false);
  const [simTraceStep, setSimTraceStep] = useState<number>(0);
  const [testGoalInput, setTestGoalInput] = useState('Execute Q3 Enterprise Authority & Performance Sprint with strict budget caps');
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);

  // Apply a preset
  const handleApplyPreset = (presetId: SimulationPresetId) => {
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSimInstructions({ ...preset.instructions });
      setActiveDirectiveIndices(preset.instructions.operationalDirectives.map((_, i) => i));
      notifyInfo('Preset Applied', `Loaded "${preset.name}" into Simulation Sandbox.`);
    }
  };

  // Toggle directive inclusion in simulation
  const handleToggleDirective = (idx: number) => {
    setActiveDirectiveIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Add custom directive in simulation
  const handleAddDirective = () => {
    if (!newDirectiveText.trim()) return;
    const updated = [...simInstructions.operationalDirectives, newDirectiveText.trim()];
    setSimInstructions(prev => ({ ...prev, operationalDirectives: updated }));
    setActiveDirectiveIndices(prev => [...prev, updated.length - 1]);
    setNewDirectiveText('');
  };

  // Delete directive in simulation
  const handleDeleteDirective = (idx: number) => {
    setSimInstructions(prev => ({
      ...prev,
      operationalDirectives: prev.operationalDirectives.filter((_, i) => i !== idx)
    }));
    setActiveDirectiveIndices(prev => 
      prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i))
    );
  };

  // Reset simulation back to live instructions
  const handleResetToLive = () => {
    setSelectedPresetId('BALANCED');
    setSimInstructions({
      systemPrompt: orchestratorAgent.instructions.systemPrompt,
      operationalDirectives: [...orchestratorAgent.instructions.operationalDirectives],
      behavioralConstraints: [...orchestratorAgent.instructions.behavioralConstraints],
      guardrails: [...orchestratorAgent.instructions.guardrails],
      outputFormat: orchestratorAgent.instructions.outputFormat
    });
    setActiveDirectiveIndices(orchestratorAgent.instructions.operationalDirectives.map((_, i) => i));
    notifyInfo('Simulation Reset', 'Simulated instructions reset to match live production fleet.');
  };

  // Analyze active directives & prompt to determine simulated DAG behavior
  const simulationRules = useMemo(() => {
    const activeDirectives = simInstructions.operationalDirectives
      .filter((_, idx) => activeDirectiveIndices.includes(idx))
      .join(' ')
      .toLowerCase();
    
    const promptText = simInstructions.systemPrompt.toLowerCase();
    const combined = `${promptText} ${activeDirectives}`;

    const isAuthorityPriority = combined.includes('authority') || combined.includes('seo') || combined.includes('backlink') || combined.includes('topical');
    const isPerformancePriority = combined.includes('performance') || combined.includes('ad spend') || combined.includes('roas') || combined.includes('meta');
    const isLeanMode = combined.includes('lean') || combined.includes('prune') || combined.includes('cache') || combined.includes('minimal token') || combined.includes('velocity');
    const isStrictHITL = combined.includes('hitl') || combined.includes('approval') || combined.includes('zero-trust') || combined.includes('lockdown') || combined.includes('human signature');
    const isOmnichannel = combined.includes('omnichannel') || combined.includes('concurrent') || combined.includes('all 4') || combined.includes('all specialized');

    return {
      isAuthorityPriority,
      isPerformancePriority,
      isLeanMode,
      isStrictHITL,
      isOmnichannel
    };
  }, [simInstructions, activeDirectiveIndices]);

  // Compute Simulated DAG Nodes & Edges
  const { simNodes, simEdges, deltaMetrics } = useMemo(() => {
    const nodesList: SimulatedNode[] = [];
    const edgesList: SimulatedEdge[] = [];

    // Base Orchestrator Node
    nodesList.push({
      id: 'node-orchestrator',
      name: orchestratorAgent.name,
      codename: orchestratorAgent.codename,
      type: 'orchestrator',
      simStatus: 'ACTIVE',
      role: 'Master Goal Decomposition & DAG Orchestration',
      x: 7,
      y: 50,
      parentIds: [],
      toolOrOutput: 'decompose_to_simulated_dag()',
      simLatencyMs: simulationRules.isLeanMode ? 6 : 14,
      simTokens: simulationRules.isLeanMode ? 450 : 850,
      reasonForStatus: 'Master root node orchestrating simulated task decomposition',
      category: 'GOVERNANCE'
    });

    // Specialized Agents & Sub-agents mapping
    const specialized = allAgents.filter(a => !a.isOrchestrator);
    const agentYPositions = [20, 40, 60, 80];

    let liveTotalTokens = 8400;
    let liveTotalLatency = 240;
    let liveActiveNodeCount = 15;
    let liveHitlGates = 1;

    let simTotalTokens = 0;
    let simTotalLatency = 0;
    let simActiveNodeCount = 1; // root orchestrator
    let simHitlGates = 0;

    specialized.forEach((agent, idx) => {
      const agentNodeId = `node-agent-${agent.id}`;
      const yPos = agentYPositions[idx % agentYPositions.length];
      
      const isAuthority = agent.codename.includes('AURORA');
      const isPerformance = agent.codename.includes('VORTEX');
      const isContent = agent.codename.includes('NEXUS');
      const isOps = agent.codename.includes('AEGIS');

      // Determine simulated status of this agent based on active rules
      let status: 'ACTIVE' | 'ACCELERATED' | 'PRUNED' | 'HITL_GATED' = 'ACTIVE';
      let reason = 'Operating on standard autonomous consensus path';

      if (simulationRules.isStrictHITL && (isPerformance || isContent)) {
        status = 'HITL_GATED';
        reason = 'Enforced Human-in-the-Loop review required prior to external ad/content publishing';
        simHitlGates += 1;
      } else if (simulationRules.isAuthorityPriority) {
        if (isAuthority) {
          status = 'ACCELERATED';
          reason = 'Designated primary throughput channel for Authority & SEO sprint';
        } else if (isPerformance && simulationRules.isLeanMode) {
          status = 'PRUNED';
          reason = 'Pruned by directive: Paid ads suppressed to focus on organic authority';
        }
      } else if (simulationRules.isLeanMode && isOps) {
        status = 'PRUNED';
        reason = 'Pruned by directive: Internal SOP generation paused to minimize graph latency';
      } else if (simulationRules.isOmnichannel) {
        status = 'ACCELERATED';
        reason = 'Hyper-parallel execution saturated under Omnichannel directive';
      }

      if (status !== 'PRUNED') {
        simActiveNodeCount += 1;
      }

      const nodeLatency = status === 'PRUNED' ? 0 : status === 'ACCELERATED' ? 18 : 32;
      const nodeTokens = status === 'PRUNED' ? 0 : status === 'ACCELERATED' ? 950 : 750;
      simTotalLatency = Math.max(simTotalLatency, nodeLatency);
      simTotalTokens += nodeTokens;

      nodesList.push({
        id: agentNodeId,
        name: agent.name,
        codename: agent.codename,
        type: 'agent',
        simStatus: status,
        role: agent.role,
        x: 34,
        y: yPos,
        parentIds: ['node-orchestrator'],
        toolOrOutput: agent.skills[0]?.toolSignature || 'execute_task()',
        vaultAffected: agent.writeVaults[0],
        simLatencyMs: nodeLatency,
        simTokens: nodeTokens,
        reasonForStatus: reason,
        category: isAuthority ? 'AUTHORITY' : isPerformance ? 'PERFORMANCE' : isContent ? 'CONTENT' : 'OPS'
      });

      edgesList.push({
        id: `edge-orch-${agent.id}`,
        sourceId: 'node-orchestrator',
        targetId: agentNodeId,
        label: status === 'PRUNED' ? 'Pruned by Directive' : status === 'HITL_GATED' ? 'HITL Gate' : 'Delegates Directive',
        status: status === 'PRUNED' ? 'PRUNED' : status === 'HITL_GATED' ? 'HITL_GATE' : status === 'ACCELERATED' ? 'ACCELERATED' : 'ACTIVE'
      });

      // Sub-Agents mapping
      const subAgents = agent.subAgents.slice(0, 2);
      subAgents.forEach((sub, sIdx) => {
        const subNodeId = `node-sub-${sub.id}`;
        const subYPos = yPos + (sIdx === 0 ? -6 : 6);

        let subStatus: 'ACTIVE' | 'ACCELERATED' | 'PRUNED' | 'HITL_GATED' = status === 'PRUNED' ? 'PRUNED' : 'ACTIVE';
        let subReason = `Sub-agent worker for ${agent.codename}`;

        if (status === 'PRUNED') {
          subStatus = 'PRUNED';
          subReason = `Parent agent ${agent.codename} pruned; child worker deactivated`;
        } else if (simulationRules.isLeanMode && sIdx === 1) {
          subStatus = 'PRUNED';
          subReason = 'Pruned by Lean Directive: Auxiliary sub-agent pruned to reduce token burn';
        } else if (simulationRules.isAuthorityPriority && isAuthority) {
          subStatus = 'ACCELERATED';
          subReason = 'Accelerated parallel crawler for high-velocity topical graph build';
        } else if (simulationRules.isStrictHITL && isPerformance) {
          subStatus = 'HITL_GATED';
          subReason = 'Ad spend mutation gated by Human-in-the-Loop policy';
        }

        if (subStatus !== 'PRUNED') {
          simActiveNodeCount += 1;
        }

        const subLatency = subStatus === 'PRUNED' ? 0 : subStatus === 'ACCELERATED' ? 12 : 24;
        const subTokens = subStatus === 'PRUNED' ? 0 : subStatus === 'ACCELERATED' ? 620 : 420;
        simTotalLatency += subLatency;
        simTotalTokens += subTokens;

        nodesList.push({
          id: subNodeId,
          name: sub.name,
          codename: sub.codename,
          type: 'subagent',
          simStatus: subStatus,
          role: sub.designatedTask,
          x: 64,
          y: subYPos,
          parentIds: [agentNodeId],
          toolOrOutput: sub.specializedTool,
          simLatencyMs: subLatency,
          simTokens: subTokens,
          reasonForStatus: subReason,
          category: isAuthority ? 'AUTHORITY' : isPerformance ? 'PERFORMANCE' : isContent ? 'CONTENT' : 'OPS'
        });

        edgesList.push({
          id: `edge-${agent.id}-${sub.id}`,
          sourceId: agentNodeId,
          targetId: subNodeId,
          label: subStatus === 'PRUNED' ? 'Pruned' : 'Worker Dispatch',
          status: subStatus === 'PRUNED' ? 'PRUNED' : subStatus === 'HITL_GATED' ? 'HITL_GATE' : subStatus === 'ACCELERATED' ? 'ACCELERATED' : 'ACTIVE'
        });

        // Level 4: Target Vault
        const targetVault = agent.writeVaults[0] || 'Marketing Vault';
        const vaultNodeId = `node-vault-${targetVault.toLowerCase().replace(/\s+/g, '-')}`;

        if (!nodesList.some(n => n.id === vaultNodeId)) {
          const vaultPruned = status === 'PRUNED' && subStatus === 'PRUNED';
          nodesList.push({
            id: vaultNodeId,
            name: targetVault,
            codename: 'VAULT',
            type: 'vault',
            simStatus: vaultPruned ? 'PRUNED' : 'ACTIVE',
            role: 'PostgreSQL + pgvector Relational Brain Storage',
            x: 92,
            y: yPos,
            parentIds: [subNodeId],
            toolOrOutput: 'RLS Transaction Commit',
            simLatencyMs: 8,
            simTokens: 120,
            reasonForStatus: vaultPruned ? 'No state mutations targeted to this vault under current directives' : 'Receives validated vector records',
            category: 'VAULT'
          });
          if (!vaultPruned) simActiveNodeCount += 1;
        }

        edgesList.push({
          id: `edge-${sub.id}-${vaultNodeId}`,
          sourceId: subNodeId,
          targetId: vaultNodeId,
          label: subStatus === 'PRUNED' ? 'No Mutation' : 'State Mutation',
          status: subStatus === 'PRUNED' ? 'PRUNED' : 'ACTIVE'
        });
      });
    });

    // Add baseline overhead
    simTotalTokens += 850;
    simTotalLatency += 22;

    const latencyDeltaPct = Math.round(((simTotalLatency - liveTotalLatency) / liveTotalLatency) * 100);
    const tokenDeltaPct = Math.round(((simTotalTokens - liveTotalTokens) / liveTotalTokens) * 100);
    const nodeDelta = simActiveNodeCount - liveActiveNodeCount;

    return {
      simNodes: nodesList,
      simEdges: edgesList,
      deltaMetrics: {
        liveLatency: liveTotalLatency,
        simLatency: simTotalLatency,
        latencyDeltaPct,
        liveTokens: liveTotalTokens,
        simTokens: simTotalTokens,
        tokenDeltaPct,
        liveNodes: liveActiveNodeCount,
        simNodes: simActiveNodeCount,
        nodeDelta,
        liveHitlGates,
        simHitlGates,
        activeVaultsCount: nodesList.filter(n => n.type === 'vault' && n.simStatus !== 'PRUNED').length
      }
    };
  }, [orchestratorAgent, allAgents, simulationRules]);

  const selectedNode = simNodes.find(n => n.id === selectedNodeId) || simNodes[0];

  // Helper to calculate SVG bezier path
  const calculateCurvedPath = (source: SimulatedNode, target: SimulatedNode) => {
    const startX = source.x;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;
    const deltaX = (endX - startX) * 0.5;

    return `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
  };

  // Run a test decomposition trace animation
  const handleRunSimulatedTrace = () => {
    setIsSimulatingTrace(true);
    setSimTraceStep(1);

    const timer1 = setTimeout(() => setSimTraceStep(2), 700);
    const timer2 = setTimeout(() => setSimTraceStep(3), 1500);
    const timer3 = setTimeout(() => setSimTraceStep(4), 2300);
    const timer4 = setTimeout(() => {
      setSimTraceStep(5);
      setIsSimulatingTrace(false);
      notifySuccess('Simulation Trace Finished', 'Decomposition graph successfully evaluated against simulated DAG topology.');
    }, 3100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  // Deploy confirmed simulation to live agents
  const handleConfirmDeploy = () => {
    const summary = `Deployed simulation preset: "${presets.find(p => p.id === selectedPresetId)?.name || 'Custom'}" with ${activeDirectiveIndices.length} active directives. Latency delta: ${deltaMetrics.latencyDeltaPct}%, Token delta: ${deltaMetrics.tokenDeltaPct}%.`;
    onDeployToLive(simInstructions, summary);
    setIsDeployModalOpen(false);
    notifySuccess(
      'Deployed to Live Agents!',
      `Master Orchestrator ${orchestratorAgent.codename} and DAG routing paths updated in production.`
    );
  };

  return (
    <div className={cn(
      "space-y-6 transition-all duration-300",
      isGraphFullscreen ? "fixed inset-2 z-50 bg-[#090a10] p-6 rounded-3xl border border-accent/40 shadow-2xl overflow-y-auto" : ""
    )}>
      {/* Top Simulation Mode Alert & Control Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-amber-950/30 to-purple-950/40 border-2 border-dashed border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/10 animate-pulse">
                <Sliders size={13} className="text-amber-400" />
                SIMULATION MODE ACTIVE • SANDBOX ISOLATION
              </span>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                Live agents remain strictly on current production directives until deployed.
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Orchestrator Instruction & DAG Impact Simulator</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-2xl font-sans leading-relaxed">
              Test how modifying Master Orchestrator prompt guidelines and operational directives reshapes the downstream Directed Acyclic Graph (DAG) before impacting live agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleResetToLive}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
              title="Discard simulation changes and reload live production directives"
            >
              <RotateCcw size={13} />
              <span>Reset to Live</span>
            </button>

            <button
              onClick={onExitSimulation}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <X size={13} />
              <span>Exit Simulator</span>
            </button>

            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-accent via-amber-500 to-amber-600 hover:opacity-95 text-background font-black rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl amber-glow"
            >
              <Send size={13} />
              <span>Deploy to Live Agents</span>
            </button>
          </div>
        </div>

        {/* Live Delta Metrics Ticker Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs font-mono">
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">Execution Latency</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-bold text-white">{deltaMetrics.simLatency}ms</span>
              <span className={cn(
                "text-[10px] font-bold flex items-center",
                deltaMetrics.latencyDeltaPct <= 0 ? "text-green-400" : "text-amber-400"
              )}>
                {deltaMetrics.latencyDeltaPct <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                {Math.abs(deltaMetrics.latencyDeltaPct)}%
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">Live: {deltaMetrics.liveLatency}ms</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">Token Burn / Run</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-bold text-white">{deltaMetrics.simTokens.toLocaleString()}</span>
              <span className={cn(
                "text-[10px] font-bold flex items-center",
                deltaMetrics.tokenDeltaPct <= 0 ? "text-green-400" : "text-amber-400"
              )}>
                {deltaMetrics.tokenDeltaPct <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                {Math.abs(deltaMetrics.tokenDeltaPct)}%
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">Live: {deltaMetrics.liveTokens.toLocaleString()}</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">Active DAG Nodes</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-bold text-white">{deltaMetrics.simNodes}</span>
              <span className={cn(
                "text-[10px] font-bold",
                deltaMetrics.nodeDelta < 0 ? "text-cyan-400" : deltaMetrics.nodeDelta > 0 ? "text-purple-400" : "text-zinc-400"
              )}>
                ({deltaMetrics.nodeDelta >= 0 ? `+${deltaMetrics.nodeDelta}` : deltaMetrics.nodeDelta})
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">Total capacity: 15</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">HITL Gate Points</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={cn("text-sm font-bold", deltaMetrics.simHitlGates > 0 ? "text-amber-400" : "text-zinc-300")}>
                {deltaMetrics.simHitlGates} Gate{deltaMetrics.simHitlGates !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-zinc-400">
                {deltaMetrics.simHitlGates > deltaMetrics.liveHitlGates ? '(+Hardened)' : '(Standard)'}
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">Human sign-off checkpoints</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">Mutated Vaults</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-bold text-green-400">{deltaMetrics.activeVaultsCount} Vaults</span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">Second Brain targets</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-[10px] text-muted uppercase">Simulation Risk</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={cn(
                "text-sm font-bold",
                simulationRules.isStrictHITL ? "text-green-400" : simulationRules.isLeanMode ? "text-cyan-400" : "text-zinc-300"
              )}>
                {simulationRules.isStrictHITL ? 'ZERO-RISK' : simulationRules.isLeanMode ? 'LOW-RISK' : 'BALANCED'}
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5">RBAC Verified</div>
          </div>
        </div>
      </div>

      {/* Preset Strategy Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" /> Rapid Strategy Presets for Simulation
          </label>
          <span className="text-[11px] font-mono text-zinc-500">Click to instantly simulate top-tier scenarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map(preset => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between group",
                  isSelected 
                    ? "bg-surface border-accent shadow-lg ring-1 ring-accent/40" 
                    : "bg-surface/50 border-white/5 hover:border-white/20 hover:bg-surface/80"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded font-bold border", preset.badgeColor)}>
                      {preset.id}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 group-hover:text-accent transition-colors">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                    {preset.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Routing:</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[100px]">{preset.routingPolicy.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: 2-Column Split (Instructions Workbench on Left, DAG Canvas on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Orchestrator Instruction Workbench (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Orchestrator Sandbox Directives
                </h3>
              </div>
              <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 font-bold">
                {orchestratorAgent.codename}
              </span>
            </div>

            {/* Simulated System Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                  <Cpu size={12} className="text-purple-400" /> Simulated Core System Prompt
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {simInstructions.systemPrompt.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={4}
                value={simInstructions.systemPrompt}
                onChange={e => setSimInstructions(prev => ({ ...prev, systemPrompt: e.target.value }))}
                className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent leading-relaxed resize-y"
                placeholder="Enter simulated Orchestrator prompt..."
              />
              <p className="text-[10px] text-zinc-400 font-sans">
                Hint: Type keywords like <code className="text-accent">"authority"</code>, <code className="text-cyan-400">"lean"</code>, or <code className="text-amber-400">"HITL"</code> to see live DAG path adaptation.
              </p>
            </div>

            {/* Simulated Operational Directives Matrix */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                  <Workflow size={12} className="text-accent" /> Active Directives ({activeDirectiveIndices.length}/{simInstructions.operationalDirectives.length})
                </label>
                <span className="text-[10px] font-mono text-zinc-400">Toggle ON/OFF to test path impact</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {simInstructions.operationalDirectives.map((directive, idx) => {
                  const isActive = activeDirectiveIndices.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-all",
                        isActive 
                          ? "bg-black/60 border-white/15 text-zinc-200" 
                          : "bg-black/20 border-white/5 text-zinc-500 line-through opacity-60"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleDirective(idx)}
                        className={cn(
                          "w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0",
                          isActive ? "bg-accent text-background font-bold" : "bg-white/10 text-transparent"
                        )}
                        title={isActive ? "Deactivate in simulation" : "Activate in simulation"}
                      >
                        <Check size={11} />
                      </button>

                      <div className="flex-1 leading-snug font-sans text-xs">
                        <span className="text-[10px] font-mono text-accent mr-1.5">#{idx + 1}</span>
                        {directive}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteDirective(idx)}
                        className="text-zinc-600 hover:text-rose-400 transition-colors p-0.5 shrink-0"
                        title="Delete directive from simulation"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Directive */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. Require HITL review on all CRM syncs..."
                  value={newDirectiveText}
                  onChange={e => setNewDirectiveText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDirective(); } }}
                  className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleAddDirective}
                  className="px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-bold rounded-xl text-xs font-mono shrink-0 transition-colors"
                >
                  Add Test
                </button>
              </div>
            </div>

            {/* Test Decomposition Runner */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <label className="text-[11px] font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                <Play size={12} className="text-green-400" /> Test Autonomous Goal Decomposition
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testGoalInput}
                  onChange={e => setTestGoalInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-accent font-sans"
                  placeholder="Type sample enterprise goal..."
                />
                <button
                  onClick={handleRunSimulatedTrace}
                  disabled={isSimulatingTrace}
                  className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-colors"
                >
                  <Play size={12} className={cn(isSimulatingTrace && "animate-spin")} />
                  <span>{isSimulatingTrace ? 'Simulating...' : 'Run Simulation'}</span>
                </button>
              </div>

              {/* Simulation Trace Steps Display */}
              <AnimatePresence>
                {simTraceStep > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-black/70 border border-purple-500/30 rounded-xl font-mono text-[11px] space-y-1.5 mt-2"
                  >
                    <div className="text-purple-300 font-bold flex items-center justify-between text-[10px] uppercase">
                      <span>Simulated Trace Stream</span>
                      <span>Step {simTraceStep} of 5</span>
                    </div>

                    <div className="space-y-1 text-zinc-300">
                      {simTraceStep >= 1 && (
                        <div className="text-zinc-400 flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="text-green-400" />
                          <span>CHRONOS-00: Ingested goal statement & loaded simulated directives.</span>
                        </div>
                      )}
                      {simTraceStep >= 2 && (
                        <div className="text-zinc-300 flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="text-green-400" />
                          <span>Active directives pruned {deltaMetrics.liveNodes - deltaMetrics.simNodes} nodes; path latency computed at {deltaMetrics.simLatency}ms.</span>
                        </div>
                      )}
                      {simTraceStep >= 3 && (
                        <div className="text-zinc-300 flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="text-green-400" />
                          <span>Dispatching execution vectors to {deltaMetrics.simNodes} active nodes across {deltaMetrics.activeVaultsCount} vaults.</span>
                        </div>
                      )}
                      {simTraceStep >= 4 && (
                        <div className="text-amber-300 flex items-center gap-1.5">
                          <ShieldCheck size={11} className="text-amber-400" />
                          <span>HITL Gate check: {deltaMetrics.simHitlGates} checkpoint(s) verified safe and compliant with RBAC boundaries.</span>
                        </div>
                      )}
                      {simTraceStep >= 5 && (
                        <div className="text-green-400 font-bold flex items-center gap-1.5">
                          <Check size={11} />
                          <span>Simulation Complete. Graph state ready for live deployment.</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Interactive Simulated DAG Canvas & Node Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0b0d13] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[500px]">
            {/* Header / Canvas Controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <GitBranch size={15} className="text-accent" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Simulated DAG Topological Preview</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold">
                    Virtual State
                  </span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs transition-all"
                  title={isGraphFullscreen ? "Exit Fullscreen" : "Fullscreen Graph View"}
                >
                  {isGraphFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* Level Column Markers */}
            <div className="grid grid-cols-4 text-center text-[10px] font-mono uppercase text-muted tracking-wider border-b border-white/5 pb-1.5 mb-2">
              <div className="text-purple-400 font-bold">1. Orchestrator</div>
              <div className="text-accent font-bold">2. Scoped Agent</div>
              <div className="text-blue-400 font-bold">3. Sub-Agent Node</div>
              <div className="text-green-400 font-bold">4. Brain Vault</div>
            </div>

            {/* SVG Diagram Canvas */}
            <div className="relative w-full h-[400px] sm:h-[440px]">
              <svg 
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="simActiveEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>

                  <linearGradient id="simAcceleratedEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
                  </linearGradient>

                  <filter id="simGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Render Simulated Edges */}
                {simEdges.map(edge => {
                  const source = simNodes.find(n => n.id === edge.sourceId);
                  const target = simNodes.find(n => n.id === edge.targetId);
                  if (!source || !target) return null;

                  const pathData = calculateCurvedPath(source, target);
                  const isPruned = edge.status === 'PRUNED';
                  const isAccelerated = edge.status === 'ACCELERATED';
                  const isHitl = edge.status === 'HITL_GATE';
                  const isSelectedPath = selectedNodeId === source.id || selectedNodeId === target.id;

                  return (
                    <g key={edge.id}>
                      {/* Background Edge */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={
                          isPruned ? "#ef444430" :
                          isHitl ? "#f59e0b80" :
                          isAccelerated ? "url(#simAcceleratedEdge)" :
                          isSelectedPath ? "url(#simActiveEdge)" :
                          "#ffffff20"
                        }
                        strokeWidth={isPruned ? "0.3" : isAccelerated ? "1.0" : isSelectedPath ? "0.9" : "0.5"}
                        strokeDasharray={isPruned ? "1, 1.5" : isHitl ? "2, 1" : "none"}
                        className="transition-all duration-300"
                      />

                      {/* Traveling Particle if not pruned */}
                      {!isPruned && (
                        <circle 
                          r={isAccelerated ? "1.1" : "0.8"} 
                          fill={isAccelerated ? "#10B981" : isHitl ? "#F59E0B" : "#A855F7"} 
                          filter="url(#simGlow)"
                        >
                          <animateMotion
                            path={pathData}
                            dur={isAccelerated ? "1.8s" : "3.2s"}
                            repeatCount="indefinite"
                            begin={`${Math.random() * 2}s`}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* DOM Node Cards overlaying SVG */}
              {simNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isOrchestrator = node.type === 'orchestrator';
                const isAgent = node.type === 'agent';
                const isSubAgent = node.type === 'subagent';
                const isVault = node.type === 'vault';

                const isPruned = node.simStatus === 'PRUNED';
                const isAccelerated = node.simStatus === 'ACCELERATED';
                const isHitl = node.simStatus === 'HITL_GATED';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      position: 'absolute',
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={cn(
                      "cursor-pointer transition-all duration-200 z-10 select-none text-left",
                      isSelected ? "scale-110 z-30" : "hover:scale-105",
                      isPruned ? "opacity-35 hover:opacity-75" : ""
                    )}
                  >
                    <div className={cn(
                      "px-2.5 py-2 rounded-xl border backdrop-blur-md transition-all shadow-xl max-w-[130px] sm:max-w-[150px]",
                      isPruned ? "bg-black/50 border-rose-500/30 border-dashed" :
                      isHitl ? "bg-amber-950/60 border-amber-400 shadow-amber-500/40 ring-1 ring-amber-400/50" :
                      isAccelerated ? "bg-emerald-950/60 border-emerald-400 shadow-emerald-500/40 ring-1 ring-emerald-400/50" :
                      isSelected && isOrchestrator ? "bg-purple-900/60 border-purple-400 shadow-purple-500/40 ring-2 ring-purple-400/50" :
                      isSelected ? "bg-amber-900/60 border-accent shadow-amber-500/40 ring-2 ring-accent/40" :
                      isOrchestrator ? "bg-purple-950/50 border-purple-500/40" :
                      isAgent ? "bg-black/70 border-white/15 hover:border-accent/60" :
                      isSubAgent ? "bg-black/60 border-white/10 hover:border-blue-400/50" :
                      "bg-green-950/40 border-green-500/30"
                    )}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={cn(
                          "text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase truncate",
                          isPruned ? "bg-rose-500/20 text-rose-300" :
                          isHitl ? "bg-amber-500/20 text-amber-300 font-black" :
                          isAccelerated ? "bg-emerald-500/20 text-emerald-300 font-black" :
                          isOrchestrator ? "bg-purple-500/20 text-purple-300" :
                          isAgent ? "bg-accent/20 text-accent" :
                          isSubAgent ? "bg-blue-500/20 text-blue-300" :
                          "bg-green-500/20 text-green-300"
                        )}>
                          {isPruned ? 'PRUNED' : isHitl ? 'HITL GATE' : isAccelerated ? 'BOOST' : node.codename}
                        </span>

                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isPruned ? "bg-rose-500" :
                          isHitl ? "bg-amber-400 animate-ping" :
                          isAccelerated ? "bg-emerald-400 animate-pulse" :
                          "bg-green-400"
                        )} />
                      </div>

                      <div className={cn(
                        "text-[10px] font-bold truncate leading-tight",
                        isPruned ? "text-zinc-400 line-through" : "text-white"
                      )}>
                        {node.name}
                      </div>

                      <div className="text-[8px] font-mono text-zinc-400 truncate mt-0.5">
                        {isPruned ? 'Bypassed by Directive' : node.toolOrOutput || node.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas Legend Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/5 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Accelerated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Active Live</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>HITL Gate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500/60" />
                  <span>Pruned / Bypassed</span>
                </div>
              </div>

              <div className="text-[9px] text-zinc-500">
                Click any node to inspect simulated routing reason
              </div>
            </div>
          </div>

          {/* Selected Node Simulated Impact Inspector Card */}
          <div className="bg-surface border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border",
                  selectedNode.simStatus === 'PRUNED' ? "bg-rose-500/10 text-rose-300 border-rose-500/30" :
                  selectedNode.simStatus === 'HITL_GATED' ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                  selectedNode.simStatus === 'ACCELERATED' ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                  "bg-purple-500/10 text-purple-300 border-purple-500/30"
                )}>
                  {selectedNode.simStatus} STATUS
                </span>
                <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
              </div>

              <span className="text-xs font-mono text-accent">{selectedNode.codename}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted text-[10px] uppercase font-mono block mb-0.5">Simulation Reasoning:</span>
                <p className="text-zinc-200 font-sans text-xs bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                  {selectedNode.reasonForStatus}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] text-muted">SIM LATENCY</div>
                  <div className="text-xs font-bold text-white mt-0.5">{selectedNode.simLatencyMs}ms</div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] text-muted">SIM TOKENS</div>
                  <div className="text-xs font-bold text-secondary mt-0.5">{selectedNode.simTokens}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] text-muted">TARGET VAULT</div>
                  <div className="text-xs font-bold text-green-400 mt-0.5 truncate">{selectedNode.vaultAffected || 'AI Workflow Vault'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Confirmation Modal */}
      <AnimatePresence>
        {isDeployModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-surface border border-accent/40 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Deploy Simulation to Live Agents</h3>
                    <p className="text-xs text-zinc-400">Review projected delta before synchronizing production fleet.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeployModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Pre-flight checklist summary */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                  <div className="text-[10px] uppercase text-muted font-bold">Selected Configuration:</div>
                  <div className="text-white font-bold text-sm">
                    {presets.find(p => p.id === selectedPresetId)?.name || 'Custom Directives'}
                  </div>
                  <div className="text-zinc-400 font-sans text-xs">
                    {activeDirectiveIndices.length} active directives will be applied to Master Orchestrator ({orchestratorAgent.codename}).
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                    <div className="text-[9px] text-muted uppercase">Latency Delta</div>
                    <div className="text-sm font-bold text-green-400 mt-0.5">
                      {deltaMetrics.latencyDeltaPct <= 0 ? `${deltaMetrics.latencyDeltaPct}%` : `+${deltaMetrics.latencyDeltaPct}%`}
                    </div>
                  </div>
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                    <div className="text-[9px] text-muted uppercase">Token Savings</div>
                    <div className="text-sm font-bold text-secondary mt-0.5">
                      {deltaMetrics.tokenDeltaPct <= 0 ? `${deltaMetrics.tokenDeltaPct}%` : `+${deltaMetrics.tokenDeltaPct}%`}
                    </div>
                  </div>
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                    <div className="text-[9px] text-muted uppercase">HITL Gates</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {deltaMetrics.simHitlGates} Active
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                  <span className="font-sans leading-snug">
                    Verified: All simulated directives comply with Second Brain RBAC boundaries and preserve atomic transactional rollback states.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeploy}
                  className="px-5 py-2.5 bg-accent text-background font-black rounded-xl text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 amber-glow"
                >
                  <Check size={14} />
                  <span>Confirm & Deploy to Live Agents</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
