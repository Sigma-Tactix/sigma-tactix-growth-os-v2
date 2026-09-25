import React, { useState, useMemo } from 'react';
import {
  Network,
  Layers,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  Eye,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Workflow,
  Sparkles,
  Download,
  Filter,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { GlassCard, Button, Badge } from '@/src/components/ui';
import {
  ARCHITECTURE_DIAGRAMS,
  ArchitectureDiagram,
  LifecycleState,
  ArchitectureComponent
} from '@/src/data/architectureDiagrams';

export default function ArchitectureViewer() {
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>('agent-run-lifecycle');
  const [activeViewId, setActiveViewId] = useState<string>('main-lifecycle');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false);
  const [simulatedStepIndex, setSimulatedStepIndex] = useState(0);
  const [filterLayer, setFilterLayer] = useState<string>('ALL');

  const currentDiagram = useMemo(() => {
    return ARCHITECTURE_DIAGRAMS.find(d => d.id === selectedDiagramId) || ARCHITECTURE_DIAGRAMS[0];
  }, [selectedDiagramId]);

  // Set default active view when diagram changes
  const handleSelectDiagram = (diagId: string) => {
    setSelectedDiagramId(diagId);
    const diag = ARCHITECTURE_DIAGRAMS.find(d => d.id === diagId);
    if (diag && diag.meta.views.length > 0) {
      setActiveViewId(diag.meta.views[0].id);
    }
    setSelectedNode(null);
    setIsPlayingSimulation(false);
    setSimulatedStepIndex(0);
  };

  const activeView = useMemo(() => {
    return currentDiagram.meta.views.find(v => v.id === activeViewId) || currentDiagram.meta.views[0];
  }, [currentDiagram, activeViewId]);

  const filteredDiagrams = useMemo(() => {
    if (filterLayer === 'ALL') return ARCHITECTURE_DIAGRAMS;
    return ARCHITECTURE_DIAGRAMS.filter(d => d.meta.layer.toUpperCase() === filterLayer.toUpperCase());
  }, [filterLayer]);

  // Simulation timer
  React.useEffect(() => {
    let timer: any;
    if (isPlayingSimulation) {
      timer = setInterval(() => {
        setSimulatedStepIndex((prev) => {
          const maxSteps = (currentDiagram.states?.length || currentDiagram.nodes?.length || currentDiagram.messages?.length || currentDiagram.components?.length || 5);
          if (prev >= maxSteps - 1) {
            setIsPlayingSimulation(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlayingSimulation, currentDiagram]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <GlassCard spotlight elevation="raised" className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="vermilion" size="sm">
                <Workflow size={12} className="mr-1 inline" /> Topology Engine
              </Badge>
              <Badge variant="outline" size="sm">
                Architecture v3.2
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">
              System Topology & Lifecycles
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Interactive architectural blueprints covering Agent Run Lifecycles, Async Job Queues, Event Streaming Topologies, and Production Deployment Ownership.
            </p>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant={isPlayingSimulation ? "outline" : "primary"}
              leftIcon={isPlayingSimulation ? <Pause size={16} /> : <Play size={16} />}
              onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
            >
              {isPlayingSimulation ? "Pause Trace" : "Simulate Trace"}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<RotateCcw size={15} />}
              onClick={() => {
                setIsPlayingSimulation(false);
                setSimulatedStepIndex(0);
              }}
              title="Reset Simulation"
            >
              Reset
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Diagram Selector & Layer Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Layer Filter:</span>
            {['ALL', 'AGENT', 'FOUNDATION', 'INTELLIGENCE', 'INFRASTRUCTURE'].map(layer => (
              <button
                key={layer}
                onClick={() => setFilterLayer(layer)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all border",
                  filterLayer === layer
                    ? "bg-[var(--sigma-surface-raised)] text-white font-semibold border-white/20 shadow-sm"
                    : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                {layer}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500 font-mono">
            {filteredDiagrams.length} Verified Specifications
          </div>
        </div>

        {/* Diagram Pill Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredDiagrams.map((diag) => {
            const isSelected = diag.id === selectedDiagramId;
            return (
              <button
                key={diag.id}
                onClick={() => handleSelectDiagram(diag.id)}
                className={cn(
                  "p-4 rounded-xl text-left border transition-all relative overflow-hidden group",
                  isSelected
                    ? "bg-[var(--sigma-surface-raised)] border-[var(--sigma-vermilion)]/50 shadow-md ring-1 ring-[var(--sigma-vermilion)]/30"
                    : "bg-[var(--sigma-surface)] border-[var(--sigma-border)] hover:border-white/20 hover:bg-[var(--sigma-surface-raised)]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={diag.meta.layer === 'Agent' ? 'vermilion' : diag.meta.layer === 'Foundation' ? 'info' : 'outline'}
                    size="sm"
                  >
                    {diag.meta.layer}
                  </Badge>
                  <span className="text-[10px] font-mono text-zinc-400 capitalize">
                    {diag.diagram_type}
                  </span>
                </div>
                <div className={cn(
                  "font-semibold text-sm tracking-tight transition-colors line-clamp-1",
                  isSelected ? "text-white font-bold" : "text-zinc-200 group-hover:text-white"
                )}>
                  {diag.meta.title}
                </div>
                <div className="text-xs text-zinc-400 line-clamp-1 mt-1">
                  {diag.meta.description}
                </div>
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--sigma-vermilion)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <GlassCard elevation="raised" className="overflow-hidden border border-[var(--sigma-border)]">
        {/* Stage Top Bar */}
        <div className="p-6 bg-[var(--sigma-surface)]/80 border-b border-[var(--sigma-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{currentDiagram.meta.title}</h2>
              <Badge variant="outline" size="sm">
                Schema v{currentDiagram.schema_version}.0
              </Badge>
            </div>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              {currentDiagram.meta.description}
            </p>
          </div>

          {/* View Perspective Selector */}
          <div className="sigma-segmented">
            <span className="px-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[var(--sigma-text-soft)]">
              <Eye size={12} /> View:
            </span>
            {currentDiagram.meta.views.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveViewId(v.id)}
                className={cn(
                  "sigma-segment",
                  activeViewId === v.id
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Perspective Note Banner */}
        {activeView && (
          <div className="px-6 py-2.5 bg-[var(--sigma-vermilion)]/5 border-b border-[var(--sigma-vermilion)]/15 flex items-center gap-3 text-xs text-zinc-300 font-mono">
            <Info size={14} className="text-[var(--sigma-vermilion)] shrink-0" />
            <span><strong className="text-white">Perspective Note:</strong> {activeView.note}</span>
          </div>
        )}

        {/* Interactive Diagram Canvas */}
        <div className="p-8 min-h-[440px] bg-[#070709] relative flex flex-col justify-center overflow-x-auto">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* RENDER BY DIAGRAM TYPE */}
          {currentDiagram.diagram_type === 'lifecycle' && (
            <LifecycleCanvas
              diagram={currentDiagram}
              activeView={activeView}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simulatedStepIndex={simulatedStepIndex}
            />
          )}

          {currentDiagram.diagram_type === 'workflow' && (
            <WorkflowCanvas
              diagram={currentDiagram}
              activeView={activeView}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simulatedStepIndex={simulatedStepIndex}
            />
          )}

          {currentDiagram.diagram_type === 'sequence' && (
            <SequenceCanvas
              diagram={currentDiagram}
              activeView={activeView}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simulatedStepIndex={simulatedStepIndex}
            />
          )}

          {currentDiagram.diagram_type === 'dataflow' && (
            <DataflowCanvas
              diagram={currentDiagram}
              activeView={activeView}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simulatedStepIndex={simulatedStepIndex}
            />
          )}

          {currentDiagram.diagram_type === 'architecture' && (
            <ArchitectureCanvas
              diagram={currentDiagram}
              activeView={activeView}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              simulatedStepIndex={simulatedStepIndex}
            />
          )}
        </div>

        {/* Selected Node Inspector Drawer / Cards Footer */}
        <div className="p-6 bg-[#09090B] border-t border-white/10">
          {selectedNode ? (
            <div className="p-4 bg-surface rounded-xl border border-accent/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Workflow size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold silver-text">{selectedNode.label}</h4>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-muted uppercase">
                      {selectedNode.type || 'state'}
                    </span>
                    {selectedNode.tag && (
                      <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-[10px] font-mono text-secondary">
                        {selectedNode.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">{selectedNode.sublabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-mono">Lane: <strong className="text-white">{selectedNode.lane || selectedNode.stage || 'Primary'}</strong></span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-muted hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentDiagram.cards.map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface/50 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      card.dot === 'emerald' ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" :
                      card.dot === 'amber' ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" :
                      card.dot === 'cyan' ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" :
                      card.dot === 'orange' ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" :
                      "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                    )} />
                    <h4 className="text-sm font-bold text-white tracking-tight">{card.title}</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {card.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// 1. LIFECYCLE CANVAS
function LifecycleCanvas({ diagram, activeView, selectedNode, onSelectNode, simulatedStepIndex }: any) {
  const states = diagram.states || [];
  const mainStates = states.filter((s: any) => s.lane === 'main');
  const waitingStates = states.filter((s: any) => s.lane === 'waiting');
  const recoveryStates = states.filter((s: any) => s.lane === 'exceptions' || s.lane === 'recovery');
  const terminalStates = states.filter((s: any) => s.lane === 'terminal');

  return (
    <div className="space-y-8 py-4 relative">
      {/* Primary Rail */}
      <div>
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Main Ordered Rail
        </div>
        <div className="grid grid-cols-5 gap-4">
          {mainStates.map((state: any, idx: number) => {
            const isFocused = activeView?.focus?.includes(state.id);
            const isSimActive = simulatedStepIndex === idx;
            const isSelected = selectedNode?.id === state.id;

            return (
              <motion.button
                key={state.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectNode(state)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all relative",
                  isSimActive ? "ring-2 ring-accent bg-accent/15 border-accent shadow-[0_0_20px_rgba(245,158,11,0.3)]" :
                  isSelected ? "bg-surface border-accent shadow-lg" :
                  isFocused ? "bg-surface border-white/20 text-white" :
                  "bg-surface/30 border-white/5 text-zinc-500 opacity-60 hover:opacity-100"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-black text-muted">{state.step || `0${idx + 1}`}</span>
                  <span className={cn(
                    "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded",
                    state.type === 'start' ? "bg-blue-500/10 text-blue-400" :
                    state.type === 'success' ? "bg-green-500/10 text-green-400" :
                    state.type === 'decision' ? "bg-amber-500/10 text-amber-400" :
                    "bg-white/10 text-zinc-400"
                  )}>
                    {state.tag || state.type}
                  </span>
                </div>
                <div className="font-bold text-sm text-white tracking-tight">{state.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{state.sublabel}</div>

                {/* Arrow connector */}
                {idx < mainStates.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-muted">
                    <ArrowRight size={14} className={isSimActive ? "text-accent animate-pulse" : "text-zinc-600"} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Waiting & Secondary Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
        {/* Waiting / Human Gates */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Lock size={12} /> Human & Input Waits
          </div>
          <div className="space-y-2">
            {waitingStates.map((s: any) => (
              <div
                key={s.id}
                onClick={() => onSelectNode(s)}
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-200">{s.label}</span>
                  <span className="text-[9px] font-mono text-amber-400/80">{s.sublabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery / Retries */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <RotateCcw size={12} /> Recovery & Controller
          </div>
          <div className="space-y-2">
            {recoveryStates.map((s: any) => (
              <div
                key={s.id}
                onClick={() => onSelectNode(s)}
                className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-200">{s.label}</span>
                  <span className="text-[9px] font-mono text-cyan-400/80">{s.sublabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Exits */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={12} /> Terminal Outcomes
          </div>
          <div className="space-y-2">
            {terminalStates.map((s: any) => (
              <div
                key={s.id}
                onClick={() => onSelectNode(s)}
                className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-200">{s.label}</span>
                  <span className="text-[9px] font-mono text-rose-400/80">{s.sublabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. WORKFLOW CANVAS
function WorkflowCanvas({ diagram, activeView, selectedNode, onSelectNode, simulatedStepIndex }: any) {
  const nodes = diagram.nodes || [];
  const lanes = diagram.lanes || [];

  return (
    <div className="space-y-6 py-2">
      {lanes.map((lane: any, laneIdx: number) => {
        const laneNodes = nodes.filter((n: any) => n.lane === lane.id);
        return (
          <div key={lane.id} className="space-y-2">
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                Lane: {lane.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {laneNodes.map((node: any, nIdx: number) => {
                const isFocused = activeView?.focus?.includes(node.id);
                const isSelected = selectedNode?.id === node.id;
                const isSimActive = simulatedStepIndex === (laneIdx * 2 + nIdx);

                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectNode(node)}
                    className={cn(
                      "p-3 rounded-xl border text-left cursor-pointer transition-all",
                      isSimActive ? "ring-2 ring-accent bg-accent/20 border-accent" :
                      isSelected ? "bg-surface border-accent shadow-lg" :
                      isFocused ? "bg-surface border-white/20 text-white" :
                      "bg-surface/30 border-white/5 opacity-50 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] font-mono uppercase text-muted">{node.type}</span>
                      {node.tag && (
                        <span className="text-[8px] font-mono text-secondary">{node.tag}</span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-white">{node.label}</div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1">{node.sublabel}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 3. SEQUENCE CANVAS
function SequenceCanvas({ diagram, activeView, selectedNode, onSelectNode, simulatedStepIndex }: any) {
  const participants = diagram.participants || [];
  const messages = diagram.messages || [];

  return (
    <div className="space-y-6 py-2">
      {/* Participants Header Bar */}
      <div className="grid grid-cols-7 gap-2">
        {participants.map((p: any) => (
          <div
            key={p.id}
            onClick={() => onSelectNode(p)}
            className="p-3 bg-surface border border-white/10 rounded-xl text-center cursor-pointer hover:border-accent/40 transition-all"
          >
            <div className="text-xs font-bold text-white truncate">{p.label}</div>
            <div className="text-[9px] font-mono text-muted truncate">{p.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Messages Timeline Flow */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
        {messages.map((m: any, idx: number) => {
          const isSimActive = simulatedStepIndex === idx;
          return (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between text-xs transition-all font-mono",
                isSimActive ? "bg-accent/15 border-accent text-accent shadow-md" :
                m.variant === 'security' ? "bg-rose-500/5 border-rose-500/20 text-rose-300" :
                m.variant === 'return' ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-300" :
                m.variant === 'dashed' ? "bg-white/5 border-dashed border-white/10 text-zinc-400" :
                "bg-surface/50 border-white/5 text-zinc-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted font-black w-6">{idx + 1}.</span>
                <span className="font-bold text-white">{m.from}</span>
                <ArrowRight size={12} className="text-muted" />
                <span className="font-bold text-white">{m.to}:</span>
                <span>{m.label}</span>
              </div>
              <span className="text-[9px] font-mono text-muted uppercase">
                {m.variant || 'default'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. DATAFLOW CANVAS
function DataflowCanvas({ diagram, activeView, selectedNode, onSelectNode, simulatedStepIndex }: any) {
  const stages = diagram.stages || [];
  const nodes = diagram.nodes || [];

  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage: any, stageIdx: number) => {
          const stageNodes = nodes.filter((n: any) => n.stage === stageIdx);
          return (
            <div key={stageIdx} className="space-y-3">
              <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white tracking-tight">
                {stage.label}
              </div>
              <div className="space-y-2.5">
                {stageNodes.map((n: any) => {
                  const isFocused = activeView?.focus?.includes(n.id);
                  const isSelected = selectedNode?.id === n.id;

                  return (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n)}
                      className={cn(
                        "p-3 rounded-xl border text-left cursor-pointer transition-all",
                        isSelected ? "bg-surface border-accent shadow-lg" :
                        isFocused ? "bg-surface border-white/20 text-white" :
                        "bg-surface/40 border-white/5 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="text-[8px] font-mono text-muted uppercase mb-1">{n.type}</div>
                      <div className="font-bold text-xs text-white line-clamp-1">{n.label}</div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1">{n.sublabel}</div>
                      {n.tag && (
                        <div className="mt-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 w-fit">
                          {n.tag}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. ARCHITECTURE CANVAS
function ArchitectureCanvas({ diagram, activeView, selectedNode, onSelectNode, simulatedStepIndex }: any) {
  const components = diagram.components || [];

  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {components.map((comp: any, idx: number) => {
          const isFocused = activeView?.focus?.includes(comp.id);
          const isSelected = selectedNode?.id === comp.id;
          const isSimActive = simulatedStepIndex === idx;

          return (
            <div
              key={comp.id}
              onClick={() => onSelectNode(comp)}
              className={cn(
                "p-4 rounded-xl border text-left cursor-pointer transition-all relative group",
                isSimActive ? "ring-2 ring-accent bg-accent/15 border-accent shadow-xl" :
                isSelected ? "bg-surface border-accent shadow-lg" :
                isFocused ? "bg-surface border-white/20 text-white" :
                "bg-surface/40 border-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono uppercase text-muted">{comp.type}</span>
                {comp.tag && (
                  <span className="text-[9px] font-mono text-secondary font-bold">{comp.tag}</span>
                )}
              </div>
              <div className="font-bold text-sm text-white tracking-tight">{comp.label}</div>
              <div className="text-xs text-zinc-400 mt-1 line-clamp-1">{comp.sublabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
