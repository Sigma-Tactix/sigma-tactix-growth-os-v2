import React, { useState } from 'react';
import Orb from './Orb';
import { OrbSatelliteDef } from './orb.types';
import { Sparkles, Orbit, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function OrbExample() {
  const [zoom, setZoom] = useState(1.0);
  const [selectedSat, setSelectedSat] = useState<OrbSatelliteDef | null>(null);

  const mockSatellites: OrbSatelliteDef[] = [
    {
      id: 'sat-1',
      ringIndex: 0,
      phase: 0.2,
      label: 'Brand Voice Vector v2.5',
      category: 'file',
      subLabel: 'Brand Vault / Vector Weights',
      color: '#FF481B',
      pulse: true,
    },
    {
      id: 'sat-2',
      ringIndex: 0,
      phase: 2.1,
      label: 'HubSpot CRM Webhook',
      category: 'connector',
      subLabel: 'Active Pipeline Ingestion',
      color: '#00E5FF',
    },
    {
      id: 'sat-3',
      ringIndex: 1,
      phase: 1.4,
      label: 'Authority Topical Clusters',
      category: 'vault',
      subLabel: 'Authority Vault / 1,420 Nodes',
      color: '#E040FB',
      pulse: true,
    },
    {
      id: 'sat-4',
      ringIndex: 1,
      phase: 3.8,
      label: 'Executive Financial Model',
      category: 'file',
      subLabel: 'Executive Vault / Q3 Forecast',
      color: '#FFB088',
    },
    {
      id: 'sat-5',
      ringIndex: 2,
      phase: 0.9,
      label: 'GA4 Realtime Streaming',
      category: 'connector',
      subLabel: 'Marketing Vault / 99.8% Sync',
      color: '#10B981',
    },
    {
      id: 'sat-6',
      ringIndex: 2,
      phase: 4.5,
      label: 'Content Engine Agent Constraints',
      category: 'tool',
      subLabel: 'AI Workflow Vault / Enforced RBAC',
      color: '#F59E0B',
      pulse: true,
    },
  ];

  return (
    <div className="relative w-full h-[520px] bg-[#050515] border border-[#FF481B]/30 rounded-2xl overflow-hidden font-mono select-none">
      {/* HUD Header */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#FF481B] animate-ping" />
        <span className="text-[11px] font-bold text-[#FFB088] tracking-wider uppercase">
          SECOND BRAIN // PARTICLE GLOBE RUNTIME
        </span>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
          className="p-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] border border-[#FF481B]/30 transition cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
          className="p-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] border border-[#FF481B]/30 transition cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1.0)}
          className="p-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] border border-[#FF481B]/30 transition cursor-pointer"
          title="Reset Zoom"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Orb Canvas */}
      <Orb zoom={zoom} satellites={mockSatellites} className="w-full h-full" />

      {/* Legend & Stats */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-[9px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF481B]" />
            <span>OCEAN MESH (2,600 PTS)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FFF4ED]" />
            <span>CONTINENTAL CLUSTERS</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
            <span>SATELLITE VAULTS</span>
          </span>
        </div>
        <span className="tracking-widest hidden sm:inline">60 FPS // ZERO GC // FIBONACCI SPHERE</span>
      </div>
    </div>
  );
}
