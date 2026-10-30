import React, { useState, useMemo } from 'react';
import {
  Workflow,
  Bot,
  Crown,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
  Sparkles,
  Info,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { ScopedAgent } from '@/src/data/agentCockpitData';

interface DAGNode {
  id: string;
  name: string;
  codename: string;
  type: 'orchestrator' | 'agent' | 'subagent' | 'vault';
  status: 'ACTIVE' | 'WARNING' | 'IDLE' | 'COMPLETED';
  role: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  parentIds: string[];
  toolOrOutput?: string;
  vaultAffected?: string;
  tasksCompleted?: number;
  accuracy?: string;
  latency?: string;
}

interface DAGEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  activeFlow?: boolean;
}

interface AgentDAGVisualizationProps {
  agents: ScopedAgent[];
  activeAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
  onLaunchSimulation?: () => void;
}

export default function AgentDAGVisualization({
  agents,
  activeAgentId,
  onSelectAgent,
  onLaunchSimulation
}: AgentDAGVisualizationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-orchestrator');
  const [activePipelineFilter, setActivePipelineFilter] = useState<'ALL' | 'AUTHORITY' | 'PERFORMANCE' | 'CONTENT' | 'OPS'>('ALL');
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExpandedView, setIsExpandedView] = useState(false);

  // Build DAG Nodes structure from agents and sub-agents
  const { nodes, edges } = useMemo(() => {
    const nodesList: DAGNode[] = [];
    const edgesList: DAGEdge[] = [];

    // Level 1: Root Orchestrator
    const orchestrator = agents.find(a => a.isOrchestrator) || agents[0];
    nodesList.push({
      id: 'node-orchestrator',
      name: orchestrator.name,
      codename: orchestrator.codename,
      type: 'orchestrator',
      status: orchestrator.status === 'PAUSED' ? 'IDLE' : 'ACTIVE',
      role: 'Master Goal Decomposition & Global Consensus',
      x: 8,
      y: 50,
      parentIds: [],
      toolOrOutput: 'build_dag_graph()',
      tasksCompleted: orchestrator.tasksCompleted,
      accuracy: orchestrator.accuracyRate,
      latency: '12ms'
    });

    // Level 2: Scoped Execution Agents
    const specialized = agents.filter(a => !a.isOrchestrator);
    const agentYPositions = [20, 40, 60, 80];

    specialized.forEach((agent, idx) => {
      const agentNodeId = `node-agent-${agent.id}`;
      const yPos = agentYPositions[idx % agentYPositions.length];

      nodesList.push({
        id: agentNodeId,
        name: agent.name,
        codename: agent.codename,
        type: 'agent',
        status: agent.status === 'AWAITING_APPROVAL' ? 'WARNING' : agent.status === 'PAUSED' ? 'IDLE' : 'ACTIVE',
        role: agent.role,
        x: 35,
        y: yPos,
        parentIds: ['node-orchestrator'],
        toolOrOutput: agent.skills[0]?.toolSignature || 'execute_task()',
        vaultAffected: agent.writeVaults[0],
        tasksCompleted: agent.tasksCompleted,
        accuracy: agent.accuracyRate,
        latency: '34ms'
      });

      edgesList.push({
        id: `edge-orch-${agent.id}`,
        sourceId: 'node-orchestrator',
        targetId: agentNodeId,
        label: 'Delegates Scoped Directive',
        activeFlow: true
      });

      // Level 3: Sub-Agents for each Agent
      const subAgents = agent.subAgents.slice(0, 2); // Show top 2 sub-agents per agent
      subAgents.forEach((sub, sIdx) => {
        const subNodeId = `node-sub-${sub.id}`;
        const subYPos = yPos + (sIdx === 0 ? -6 : 6);

        nodesList.push({
          id: subNodeId,
          name: sub.name,
          codename: sub.codename,
          type: 'subagent',
          status: sub.status === 'WAITING' ? 'WARNING' : sub.status === 'EXECUTING' ? 'ACTIVE' : 'IDLE',
          role: sub.designatedTask,
          x: 65,
          y: subYPos,
          parentIds: [agentNodeId],
          toolOrOutput: sub.specializedTool,
          tasksCompleted: sub.tasksCompleted,
          accuracy: sub.accuracy,
          latency: '18ms'
        });

        edgesList.push({
          id: `edge-${agent.id}-${sub.id}`,
          sourceId: agentNodeId,
          targetId: subNodeId,
          label: 'Tool Dispatch',
          activeFlow: true
        });

        // Level 4: Target Vault connection
        const targetVault = agent.writeVaults[0] || 'Marketing Vault';
        const vaultNodeId = `node-vault-${targetVault.toLowerCase().replace(/\s+/g, '-')}`;

        if (!nodesList.some(n => n.id === vaultNodeId)) {
          nodesList.push({
            id: vaultNodeId,
            name: targetVault,
            codename: 'VAULT',
            type: 'vault',
            status: 'ACTIVE',
            role: 'PostgreSQL + pgvector Relational Brain Storage',
            x: 92,
            y: yPos,
            parentIds: [subNodeId],
            toolOrOutput: 'RLS Commit & Vector Index',
            latency: '9ms'
          });
        }

        edgesList.push({
          id: `edge-${sub.id}-${vaultNodeId}`,
          sourceId: subNodeId,
          targetId: vaultNodeId,
          label: 'State Mutation',
          activeFlow: true
        });
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [agents]);

  // Filter nodes & edges based on active pipeline
  const filteredNodes = useMemo(() => {
    if (activePipelineFilter === 'ALL') return nodes;
    if (activePipelineFilter === 'AUTHORITY') {
      return nodes.filter(n => n.id.includes('orchestrator') || n.id.includes('aurora') || n.id.includes('authority'));
    }
    if (activePipelineFilter === 'PERFORMANCE') {
      return nodes.filter(n => n.id.includes('orchestrator') || n.id.includes('vortex') || n.id.includes('performance'));
    }
    if (activePipelineFilter === 'CONTENT') {
      return nodes.filter(n => n.id.includes('orchestrator') || n.id.includes('nexus') || n.id.includes('content') || n.id.includes('brand'));
    }
    if (activePipelineFilter === 'OPS') {
      return nodes.filter(n => n.id.includes('orchestrator') || n.id.includes('aegis') || n.id.includes('operations') || n.id.includes('ops'));
    }
    return nodes;
  }, [nodes, activePipelineFilter]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));
  }, [edges, filteredNodes]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Helper to calculate SVG bezier path
  const calculateCurvedPath = (source: DAGNode, target: DAGNode) => {
    const startX = source.x;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;
    const deltaX = (endX - startX) * 0.5;

    return `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div className={cn(
      "space-y-4 transition-all duration-300",
      isExpandedView ? "fixed inset-4 z-50 bg-[#090a0f] p-6 rounded-3xl border border-white/20 shadow-2xl overflow-y-auto" : ""
    )}>
      {/* Header Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Workflow size={16} className="text-purple-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Orchestrator Directed Acyclic Graph (DAG)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                Live Dataflow Path
              </span>
            </h4>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Interactive topological mapping of directives from Master Orchestrator down to Scoped Agents, Sub-Agents, and target Second Brain Vaults.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pipeline filter buttons */}
          <div className="sigma-segmented font-mono">
            {(['ALL', 'AUTHORITY', 'PERFORMANCE', 'CONTENT', 'OPS'] as const).map(filterKey => (
              <button
                key={filterKey}
                onClick={() => setActivePipelineFilter(filterKey)}
                className={cn(
                  "sigma-segment uppercase",
                  activePipelineFilter === filterKey
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {filterKey}
              </button>
            ))}
          </div>

          {/* Launch Simulation Mode */}
          {onLaunchSimulation && (
            <button
              onClick={onLaunchSimulation}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
              title="Test impact of changing Orchestrator instructions on DAG in virtual sandbox"
            >
              <Sliders size={13} className="text-amber-400" />
              <span>Simulation Mode</span>
            </button>
          )}

          {/* Animation Toggle */}
          <button
            onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono transition-all flex items-center gap-1"
            title={isPlayingAnimation ? "Pause data flow animation" : "Play data flow animation"}
          >
            {isPlayingAnimation ? <Pause size={13} className="text-accent" /> : <Play size={13} className="text-green-400" />}
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpandedView(!isExpandedView)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-mono transition-all"
            title={isExpandedView ? "Exit Fullscreen" : "Fullscreen Graph Canvas"}
          >
            {isExpandedView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Canvas + Inspector Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Interactive Canvas */}
        <div className="lg:col-span-8 bg-[#0b0d13] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-2xl min-h-[460px] flex flex-col justify-between">
          {/* Level Markers at Top */}
          <div className="grid grid-cols-4 text-center text-[10px] font-mono uppercase text-muted tracking-wider border-b border-white/5 pb-2 mb-2">
            <div className="text-purple-400 font-bold">1. Orchestrator</div>
            <div className="text-accent font-bold">2. Scoped Agent</div>
            <div className="text-blue-400 font-bold">3. Sub-Agent Node</div>
            <div className="text-green-400 font-bold">4. Brain Vault</div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative w-full h-[380px] sm:h-[420px]">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.7" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Connection Edges */}
              {filteredEdges.map(edge => {
                const source = filteredNodes.find(n => n.id === edge.sourceId);
                const target = filteredNodes.find(n => n.id === edge.targetId);
                if (!source || !target) return null;

                const pathData = calculateCurvedPath(source, target);
                const isSelectedPath = selectedNodeId === source.id || selectedNodeId === target.id;

                return (
                  <g key={edge.id}>
                    {/* Background Connection Path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isSelectedPath ? "url(#edgeGrad)" : "#ffffff18"}
                      strokeWidth={isSelectedPath ? "0.8" : "0.4"}
                      strokeDasharray={isSelectedPath ? "none" : "1, 1"}
                      className="transition-all duration-300"
                    />

                    {/* Animated Traveling Particle */}
                    {isPlayingAnimation && (
                      <circle r="0.8" fill={isSelectedPath ? "#F59E0B" : "#A855F7"} filter="url(#glow)">
                        <animateMotion
                          path={pathData}
                          dur="3s"
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
            {filteredNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isOrchestrator = node.type === 'orchestrator';
              const isAgent = node.type === 'agent';
              const isSubAgent = node.type === 'subagent';
              const isVault = node.type === 'vault';

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    if (isAgent && onSelectAgent) {
                      const agentMatch = agents.find(a => node.id.includes(a.id));
                      if (agentMatch) onSelectAgent(agentMatch.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={cn(
                    "cursor-pointer transition-all duration-200 z-10 group select-none text-left",
                    isSelected ? "scale-110 z-20" : "hover:scale-105"
                  )}
                >
                  <div className={cn(
                    "px-2.5 py-2 rounded-xl border backdrop-blur-md transition-all shadow-xl max-w-[130px] sm:max-w-[150px]",
                    isSelected && isOrchestrator ? "bg-purple-900/60 border-purple-400 shadow-purple-500/40 ring-2 ring-purple-400/40" :
                    isSelected && isAgent ? "bg-amber-900/60 border-accent shadow-amber-500/40 ring-2 ring-accent/40" :
                    isSelected && isSubAgent ? "bg-blue-900/60 border-blue-400 shadow-blue-500/40 ring-2 ring-blue-400/40" :
                    isSelected && isVault ? "bg-green-900/60 border-green-400 shadow-green-500/40 ring-2 ring-green-400/40" :
                    isOrchestrator ? "bg-purple-950/40 border-purple-500/40 hover:border-purple-400" :
                    isAgent ? "bg-black/60 border-white/15 hover:border-accent/60" :
                    isSubAgent ? "bg-black/50 border-white/10 hover:border-blue-400/50" :
                    "bg-green-950/30 border-green-500/30 hover:border-green-400/50"
                  )}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={cn(
                        "text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase truncate",
                        isOrchestrator ? "bg-purple-500/20 text-purple-300" :
                        isAgent ? "bg-accent/20 text-accent" :
                        isSubAgent ? "bg-blue-500/20 text-blue-300" :
                        "bg-green-500/20 text-green-300"
                      )}>
                        {node.codename}
                      </span>

                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        node.status === 'ACTIVE' ? "bg-green-400 animate-pulse" :
                        node.status === 'WARNING' ? "bg-amber-400 animate-ping" :
                        "bg-zinc-500"
                      )} />
                    </div>

                    <div className="text-[10px] font-bold text-white truncate leading-tight">
                      {node.name}
                    </div>

                    <div className="text-[8px] font-mono text-zinc-400 truncate mt-0.5">
                      {node.toolOrOutput || node.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5 text-[10px] font-mono text-zinc-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Orchestrator</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Scoped Agent</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Sub-Agent</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>Target Vault</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500">
              Click any node to inspect upstream & downstream dependencies
            </div>
          </div>
        </div>

        {/* Right Drawer: Selected Node Deep Inspector */}
        <div className="lg:col-span-4 bg-surface border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                selectedNode.type === 'orchestrator' ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                selectedNode.type === 'agent' ? "bg-accent/20 text-accent border border-accent/30" :
                selectedNode.type === 'subagent' ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                "bg-green-500/20 text-green-300 border border-green-500/30"
              )}>
                {selectedNode.type.toUpperCase()} NODE
              </span>

              <span className={cn(
                "text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold",
                selectedNode.status === 'ACTIVE' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                selectedNode.status === 'WARNING' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-white/5 text-muted border border-white/10"
              )}>
                {selectedNode.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-2 leading-tight">
              {selectedNode.name}
            </h3>
            <div className="text-xs font-mono text-accent mt-0.5">{selectedNode.codename}</div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-muted text-[10px] uppercase block mb-1">Assigned Directive / Purpose:</span>
              <p className="text-zinc-200 font-sans text-xs leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                {selectedNode.role}
              </p>
            </div>

            {selectedNode.toolOrOutput && (
              <div>
                <span className="text-muted text-[10px] uppercase block mb-1">MCP Tool Signature / Handler:</span>
                <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 text-cyan-300 text-[11px] font-mono break-all">
                  {selectedNode.toolOrOutput}
                </div>
              </div>
            )}

            {/* Telemetry metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[11px] text-muted">COMPLETED</div>
                <div className="text-xs font-bold text-white mt-0.5">{selectedNode.tasksCompleted ?? 140}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[11px] text-muted">ACCURACY</div>
                <div className="text-xs font-bold text-accent mt-0.5">{selectedNode.accuracy ?? '99.4%'}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[11px] text-muted">LATENCY</div>
                <div className="text-xs font-bold text-green-400 mt-0.5">{selectedNode.latency ?? '18ms'}</div>
              </div>
            </div>

            {/* Target Vault */}
            {selectedNode.vaultAffected && (
              <div className="p-2.5 rounded-xl bg-green-500/5 border border-green-500/20 text-xs">
                <span className="text-[11px] font-mono text-green-400 uppercase font-bold block mb-1">Enforced Target Vault:</span>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Database size={13} className="text-green-400" />
                  <span>{selectedNode.vaultAffected}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
