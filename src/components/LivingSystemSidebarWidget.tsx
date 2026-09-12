import React, { useState, useMemo } from 'react';
import { Zap, Maximize2, Activity, Database, Bot, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getLivingSystemGraph } from '@/src/data/livingSystemData';
import { Orb, OrbSatelliteDef } from './Orb';
import LivingSystemModal from './LivingSystemModal';

interface LivingSystemSidebarWidgetProps {
  isSidebarOpen: boolean;
}

export default function LivingSystemSidebarWidget({ isSidebarOpen }: LivingSystemSidebarWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { nodes, dependencies } = useMemo(() => getLivingSystemGraph(), []);

  const miniSatellites: OrbSatelliteDef[] = useMemo(() => {
    return nodes.slice(1, 10).map((node, i) => ({
      id: node.id,
      ringIndex: i % 2,
      phase: (i / 9) * Math.PI * 2,
      label: node.name,
      category: node.type === 'VAULT' ? 'vault' : node.type === 'FILE' ? 'file' : 'tool',
      subLabel: `${node.type}`,
      color: node.color,
      size: 3.5,
      pulse: i % 2 === 0,
    }));
  }, [nodes]);

  return (
    <>
      {isSidebarOpen ? (
        /* Expanded Sidebar Widget - Positioned Far Above Everything */
        <div 
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative mx-3 mb-3 p-3 rounded-2xl bg-gradient-to-b from-[#180b04] via-[#0d0603] to-[#080301] border border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-950/40 cursor-pointer group transition-all duration-300 overflow-hidden"
          title="Click to explore the Living Growth OS & Second Brain Biosphere"
        >
          {/* Subtle fiery background glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl pointer-events-none group-hover:bg-orange-500/30 transition-all" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-orange-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Mini Canvas Orb Container (Directly replicating the video) */}
          <div className="relative w-full h-28 rounded-xl overflow-hidden bg-[#050515] border border-amber-500/20 shadow-inner flex items-center justify-center">
            <Orb
              density={900}
              rings={2}
              zoom={1.15}
              satellites={miniSatellites}
              className="w-full h-full"
            />

            {/* Overlay Live Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-[9px] font-mono text-amber-300 pointer-events-none z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold tracking-wider">LIVING SYSTEM</span>
            </div>

            {/* Expand Action Icon */}
            <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-zinc-400 group-hover:text-amber-300 group-hover:border-amber-500/40 transition-all z-10">
              <Maximize2 size={12} />
            </div>

            {/* Bottom mini status overlay */}
            <div className="absolute bottom-1.5 inset-x-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/5 flex items-center justify-between text-[8px] font-mono text-zinc-400 pointer-events-none z-10">
              <span className="text-amber-400 font-bold">72 BPM</span>
              <span>100% HEALTHY</span>
              <span className="text-emerald-400 font-bold">39 NODES</span>
            </div>
          </div>

          {/* Descriptive Content & Real-time Stats */}
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-heading font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 animate-pulse" />
                Growth OS Biosphere
              </h4>
              <span className="text-[9px] font-mono text-amber-400/90 font-bold uppercase tracking-wider">
                Interactive
              </span>
            </div>

            <p className="text-[10px] text-zinc-400 font-mono line-clamp-1 leading-tight">
              Second Brain core, all files & agent dependencies.
            </p>

            {/* Micro Badges for System Elements */}
            <div className="grid grid-cols-2 gap-1 pt-1 text-[9px] font-mono">
              <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300 flex items-center justify-between">
                <span className="text-zinc-400">Vaults:</span>
                <span className="text-amber-400 font-bold">10</span>
              </div>
              <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300 flex items-center justify-between">
                <span className="text-zinc-400">Files:</span>
                <span className="text-pink-400 font-bold">10</span>
              </div>
              <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300 flex items-center justify-between">
                <span className="text-zinc-400">Agents:</span>
                <span className="text-purple-400 font-bold">5</span>
              </div>
              <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300 flex items-center justify-between">
                <span className="text-zinc-400">Pipelines:</span>
                <span className="text-cyan-400 font-bold">7</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Sidebar Icon Trigger */
        <div className="mx-auto mb-3 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            title="Open Living Growth OS Biosphere (10 Vaults • 48 Files • 5 Agents)"
            className="relative p-2.5 bg-gradient-to-b from-amber-600/30 to-black border border-amber-500/50 hover:border-amber-400 rounded-2xl flex items-center justify-center text-amber-400 hover:text-white transition-all group shadow-lg shadow-amber-950/60"
          >
            <Zap size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-black animate-ping" />
          </button>
        </div>
      )}

      {/* Full Immersive Living System Explorer Modal */}
      <LivingSystemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
