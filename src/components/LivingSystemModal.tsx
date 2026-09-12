import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Database, 
  Bot, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Search, 
  RotateCcw, 
  ExternalLink, 
  Activity, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Info,
  Radio,
  Share2,
  Lock,
  Workflow,
  Orbit,
  LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLivingSystemGraph, SystemElementNode, SystemDependency, SystemElementType } from '@/src/data/livingSystemData';
import LivingSystemCanvas from './LivingSystemCanvas';
import GrowthOSHolographicView from './hologram/GrowthOSHolographicView';
import { Orb, OrbSatelliteDef } from './Orb';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { isWebGLAvailable } from '@/src/lib/webglDetection';

interface LivingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedNodeId?: string | null;
}

export default function LivingSystemModal({ isOpen, onClose, initialSelectedNodeId = null }: LivingSystemModalProps) {
  const navigate = useNavigate();
  const { notifyInfo, notifySuccess } = useToast();

  const { nodes, dependencies } = useMemo(() => getLivingSystemGraph(), []);
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || 'second-brain-core');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'3D_HOLOGRAM' | 'PARTICLE_ORB' | 'DAG_MATRIX'>(() =>
    isWebGLAvailable() ? '3D_HOLOGRAM' : 'PARTICLE_ORB'
  );
  const [energyPulseTrigger, setEnergyPulseTrigger] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert system nodes into satellites for the 60fps Particle Orb view
  const orbSatellites: OrbSatelliteDef[] = useMemo(() => {
    return nodes.slice(1, 22).map((node, i) => ({
      id: node.id,
      ringIndex: i % 3,
      phase: (i / 21) * Math.PI * 2,
      label: node.name,
      category: node.type === 'VAULT' ? 'vault' : node.type === 'FILE' ? 'file' : node.type === 'AGENT' ? 'tool' : 'connector',
      subLabel: `${node.type} • ${node.status}`,
      status: node.status,
      color: node.color,
      size: node.type === 'VAULT' ? 4.8 : 3.8,
      pulse: node.status === 'OPTIMAL' || node.status === 'ACTIVE',
    }));
  }, [nodes]);

  if (!isOpen) return null;

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Upstream and downstream nodes for the selected node
  const upstreamNodes = selectedNode 
    ? nodes.filter(n => selectedNode.dependencies.includes(n.id))
    : [];

  const downstreamNodes = selectedNode 
    ? nodes.filter(n => selectedNode.dependents.includes(n.id))
    : [];

  const handleInjectEnergyPulse = () => {
    setEnergyPulseTrigger(prev => prev + 1);
    notifySuccess('Synaptic Pulse Dispatched', 'Fiery energy shockwave radiated through the Second Brain and agent lattice.');
  };

  const handleNavigateToElement = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4 overflow-hidden">
      <div className={cn(
        "relative flex flex-col bg-[#080402] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 w-full",
        isFullscreen ? "h-full rounded-none border-0" : "h-[94vh] max-w-7xl"
      )}>
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-black/60 border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Living Core Mini Pulse Icon */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap size={18} className="text-black font-black animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-black text-white tracking-wide flex items-center gap-2">
                  <span>Sigma Tactix Living System</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
                    Second Brain Biosphere
                  </span>
                </h3>
              </div>
              <p className="text-xs text-amber-200/60 font-mono">
                Real-time topological neural core connecting 10 Vaults, 10 Files, 5 Scoped Agents & 7 Pipelines
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pulse Button (From video effect) */}
            <button
              onClick={handleInjectEnergyPulse}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-mono font-black text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              title="Radiate a shockwave pulse like in the system video"
            >
              <Zap size={13} /> Inject Neural Pulse
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('3D_HOLOGRAM')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                  viewMode === '3D_HOLOGRAM' ? "bg-gradient-to-r from-orange-600 to-amber-500 text-black font-bold shadow-md shadow-orange-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <Sparkles size={12} /> {hasWebGL ? '3D Hologram Universe' : 'Solar Lattice (2D Canvas)'}
              </button>
              <button
                onClick={() => setViewMode('PARTICLE_ORB')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                  viewMode === 'PARTICLE_ORB' ? "bg-gradient-to-r from-orange-600 to-amber-500 text-black font-bold shadow-md shadow-orange-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <Orbit size={12} /> Particle Earth Orb
              </button>
              <button
                onClick={() => setViewMode('DAG_MATRIX')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                  viewMode === 'DAG_MATRIX' ? "bg-gradient-to-r from-orange-600 to-amber-500 text-black font-bold shadow-md shadow-orange-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <LayoutGrid size={12} /> Dependency DAG
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hidden sm:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-zinc-400 transition-all"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Quick Telemetry Ticker */}
        <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { key: 'ALL', label: `All Elements (${nodes.length})` },
              { key: 'VAULTS', label: 'Vaults (10)' },
              { key: 'FILES', label: 'Files (10)' },
              { key: 'AGENTS', label: 'AI Agents (5)' },
              { key: 'PIPELINES', label: 'Pipelines (7)' },
              { key: 'AUDITS', label: 'Governance (3)' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  activeFilter === tab.key
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search elements or files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Main Body Workspace */}
        <div className="relative flex-1 flex overflow-hidden">
          {/* Left / Center View: Hologram, Particle Orb, or DAG */}
          <div className="relative flex-1 h-full overflow-hidden">
            {viewMode === '3D_HOLOGRAM' ? (
              <div className="w-full h-full relative">
                <GrowthOSHolographicView
                  onOpenVault={(vaultKey) => handleNavigateToElement(`/vaults?tab=${vaultKey}`)}
                  onNavigateTab={(tab) => {
                    if (tab === 'agents') handleNavigateToElement('/cockpit');
                    else if (tab === 'sources') handleNavigateToElement('/onboarding');
                    else handleNavigateToElement(`/vaults`);
                  }}
                  className="h-full border-none rounded-none"
                />
              </div>
            ) : viewMode === 'PARTICLE_ORB' ? (
              <div className="w-full h-full relative bg-[#050515] flex items-center justify-center">
                <Orb
                  satellites={orbSatellites}
                  zoom={1.1}
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 pointer-events-none p-3 bg-black/75 backdrop-blur-md border border-[#FF481B]/30 rounded-2xl text-[11px] font-mono text-zinc-400 space-y-1 hidden sm:block shadow-xl">
                  <div className="text-[#FFB088] font-bold flex items-center gap-1.5">
                    <Radio size={12} className="text-[#FF481B] animate-pulse" /> 60 FPS Particle Earth Orb
                  </div>
                  <div>• Drag to freely rotate continental sphere on any axis</div>
                  <div>• Scroll / pinch to zoom into the core</div>
                  <div>• Hover satellites on orbit rings to inspect live state</div>
                </div>
              </div>
            ) : (
              /* ALTERNATIVE VIEW: DEPENDENCY DAG MATRIX */
              <div className="w-full h-full p-6 overflow-y-auto bg-black/50 space-y-6">
                <div className="text-xs font-mono text-amber-300/80 mb-2">
                  System Architecture & Hierarchical Flow Matrix:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Column 1: Ingestion Pipelines */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase pb-2 border-b border-white/10">
                      <Layers size={13} /> 1. Ingestion Pipelines ({nodes.filter(n => n.type === 'PIPELINE').length})
                    </div>
                    {nodes.filter(n => n.type === 'PIPELINE').map(pipe => (
                      <div
                        key={pipe.id}
                        onClick={() => setSelectedNodeId(pipe.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                          selectedNodeId === pipe.id ? "bg-cyan-500/20 border-cyan-400 shadow-md" : "bg-white/5 border-white/10 hover:border-cyan-500/40"
                        )}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{pipe.name}</span>
                          <span className="text-[10px] text-green-400 font-mono">99%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{pipe.description}</p>
                        <div className="text-[9px] text-cyan-300 font-mono">→ Feeds: {pipe.dependents.join(', ')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Column 2: Second Brain Vaults */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase pb-2 border-b border-white/10">
                      <Database size={13} /> 2. Second Brain Vaults (10)
                    </div>
                    {nodes.filter(n => n.type === 'VAULT').map(vault => (
                      <div
                        key={vault.id}
                        onClick={() => setSelectedNodeId(vault.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                          selectedNodeId === vault.id ? "bg-amber-500/20 border-amber-400 shadow-md" : "bg-white/5 border-white/10 hover:border-amber-500/40"
                        )}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{vault.name}</span>
                          <span className="text-[10px] text-amber-400 font-mono">{vault.sizeOrVolume}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{vault.description}</p>
                        <div className="text-[9px] text-amber-300 font-mono">Cleared for: {vault.dependents.slice(0, 2).join(', ')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Column 3: System Files & Prompts */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-pink-400 flex items-center gap-1.5 uppercase pb-2 border-b border-white/10">
                      <FileText size={13} /> 3. Files & Prompts ({nodes.filter(n => n.type === 'FILE').length})
                    </div>
                    {nodes.filter(n => n.type === 'FILE').map(file => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedNodeId(file.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                          selectedNodeId === file.id ? "bg-pink-500/20 border-pink-400 shadow-md" : "bg-white/5 border-white/10 hover:border-pink-500/40"
                        )}
                      >
                        <div className="text-xs font-bold font-mono text-white flex items-center justify-between">
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] text-pink-300 shrink-0">{file.sizeOrVolume}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{file.description}</p>
                        <div className="text-[9px] text-pink-400 font-mono">Bound to: {file.dependents[0]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Column 4: Scoped Agents & Audits */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5 uppercase pb-2 border-b border-white/10">
                      <Bot size={13} /> 4. AI Agents & Execution ({nodes.filter(n => n.type === 'AGENT' || n.type === 'AUDIT').length})
                    </div>
                    {nodes.filter(n => n.type === 'AGENT' || n.type === 'AUDIT').map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedNodeId(agent.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all space-y-1",
                          selectedNodeId === agent.id ? "bg-purple-500/20 border-purple-400 shadow-md" : "bg-white/5 border-white/10 hover:border-purple-500/40"
                        )}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{agent.name}</span>
                          <span className="text-[10px] text-purple-300 font-mono">{agent.healthScore}%</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{agent.description}</p>
                        <div className="text-[9px] text-purple-300 font-mono">{agent.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Node Stats & Dependencies Inspector */}
          {selectedNode && (
            <div className="w-80 md:w-96 bg-black/85 border-l border-amber-500/20 p-5 overflow-y-auto space-y-5 shrink-0 backdrop-blur-md">
              {/* Header of Inspector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-white/10 text-amber-400 border border-amber-500/30">
                    {selectedNode.type} • {selectedNode.status}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <Activity size={12} /> {selectedNode.healthScore}% Health
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedNode.color }} />
                  {selectedNode.name}
                </h4>

                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Telemetry Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-0.5">
                  <div className="text-[9px] uppercase text-zinc-500">Volume / Capacity</div>
                  <div className="font-bold text-white">{selectedNode.sizeOrVolume}</div>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-0.5">
                  <div className="text-[9px] uppercase text-zinc-500">Latency / Encryption</div>
                  <div className="font-bold text-white">{selectedNode.latencyOrCycle}</div>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-0.5">
                  <div className="text-[9px] uppercase text-zinc-500">24h Invocations</div>
                  <div className="font-bold text-amber-400">{selectedNode.accessCount24h.toLocaleString()}</div>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-0.5">
                  <div className="text-[9px] uppercase text-zinc-500">Security Zone</div>
                  <div className="font-bold text-emerald-400 truncate">{selectedNode.securityZone || 'ZONE_PUBLIC_BUS'}</div>
                </div>
              </div>

              {/* Upstream Dependencies */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center justify-between">
                  <span>Upstream Dependencies ({upstreamNodes.length})</span>
                  <span className="text-[10px] text-amber-400">Inputs Required</span>
                </div>
                {upstreamNodes.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {upstreamNodes.map(up => (
                      <div
                        key={up.id}
                        onClick={() => setSelectedNodeId(up.id)}
                        className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: up.color }} />
                          <span className="text-xs font-mono text-zinc-200 group-hover:text-white truncate">{up.name}</span>
                        </div>
                        <ChevronRight size={13} className="text-zinc-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-mono text-zinc-500">
                    Master root entity (no upstream dependencies).
                  </div>
                )}
              </div>

              {/* Downstream Dependents */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center justify-between">
                  <span>Downstream Dependents ({downstreamNodes.length})</span>
                  <span className="text-[10px] text-cyan-400">Consumers</span>
                </div>
                {downstreamNodes.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {downstreamNodes.map(down => (
                      <div
                        key={down.id}
                        onClick={() => setSelectedNodeId(down.id)}
                        className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: down.color }} />
                          <span className="text-xs font-mono text-zinc-200 group-hover:text-white truncate">{down.name}</span>
                        </div>
                        <ChevronRight size={13} className="text-zinc-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-mono text-zinc-500">
                    Terminal execution endpoint (no downstream dependents).
                  </div>
                )}
              </div>

              {/* Deep Action Navigation */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={() => handleNavigateToElement(selectedNode.linkUrl)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open in Growth OS</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  onClick={handleInjectEnergyPulse}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap size={12} className="text-amber-400" />
                  <span>Send Synaptic Energy Wave</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
