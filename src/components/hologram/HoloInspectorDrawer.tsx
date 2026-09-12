import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Database,
  Cpu,
  Unlink,
  Radio,
  Share2,
} from 'lucide-react';
import {
  HEALTH_COLOR,
  HEALTH_GLYPH,
  HEALTH_LABEL,
  type ModuleStatus,
} from '../../lib/hologramTelemetry';

export interface InspectedHoloNode {
  id: string;
  label: string;
  type: 'core' | 'module' | 'vault' | 'agent' | 'connector' | 'file' | 'sop' | 'task';
  category?: string;
  description: string;
  tier?: string;
  status?: string;
  color?: string;
  subKey?: string;
  moduleKey?: string;
  metrics?: Record<string, string | number>;
  linkedNodeCount?: number;
  lastSync?: string;
}

interface HoloInspectorDrawerProps {
  node: InspectedHoloNode | null;
  status?: ModuleStatus | null;
  onClose: () => void;
  onOpenVault?: (subKey: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function HoloInspectorDrawer({
  node,
  status = null,
  onClose,
  onOpenVault,
  onNavigateTab,
}: HoloInspectorDrawerProps) {
  if (!node) return null;

  const nodeColor = node.color || '#00E5FF';

  return (
    <div
      className="absolute top-16 bottom-16 right-4 sm:right-6 w-80 sm:w-96 bg-[#050515]/95 border border-cyan-500/40 rounded-xl p-5 flex flex-col shadow-[0_0_40px_rgba(0,229,255,0.2)] backdrop-blur-xl z-30 font-mono select-none overflow-y-auto"
      style={{
        boxShadow: `0 0 35px ${nodeColor}25, inset 0 0 15px rgba(0,229,255,0.05)`,
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest shadow-sm"
            style={{ backgroundColor: nodeColor }}
          >
            {node.type}
          </span>
          {node.tier && (
            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-900 text-cyan-300 border border-cyan-500/30">
              TIER: {node.tier.toUpperCase()}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node inspector"
          className="p-1 rounded bg-slate-900/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Node Title & Description */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: nodeColor }} />
          <h3 className="text-base font-bold text-white tracking-wide">{node.label}</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">{node.description}</p>
      </div>

      {/* Cybernetic Telemetry Metrics Grid */}
      <div className="bg-[#02020a]/80 border border-cyan-500/25 rounded-lg p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between text-[9px] text-cyan-400 font-bold border-b border-cyan-500/15 pb-1">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            TELEMETRY_STATS
          </span>
          {status ? (
            <span style={{ color: HEALTH_COLOR[status.health] }}>
              {HEALTH_GLYPH[status.health]} {HEALTH_LABEL[status.health]}
            </span>
          ) : (
            <span className="text-slate-500">CORE NODE</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-slate-500 block text-[8px]">NODE_ID</span>
            <span className="text-cyan-200 font-bold break-all">{node.id}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8px]">STATE</span>
            <span
              className="font-bold"
              style={{ color: status ? HEALTH_COLOR[status.health] : '#94a3b8' }}
            >
              {status ? HEALTH_LABEL[status.health] : node.status || 'CORE'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8px]">APPROVALS_WAITING</span>
            <span className={status?.pendingApprovals ? 'text-[#FF481B] font-bold' : 'text-slate-300 font-bold'}>
              {status ? status.pendingApprovals : 0}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[8px]">LAST_ACTIVITY</span>
            <span className="text-slate-300 font-bold">
              {status?.lastActivityAt
                ? new Date(status.lastActivityAt).toISOString().slice(0, 10)
                : 'NO RUNS YET'}
            </span>
          </div>
        </div>

        {node.metrics && Object.entries(node.metrics).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-800">
            <span className="text-slate-400">{key.toUpperCase()}</span>
            <span className="text-cyan-300 font-semibold">{val}</span>
          </div>
        ))}
      </div>

      {/* Readiness / Dependencies Warning */}
      {status && (
        <div
          className="border rounded-lg p-2.5 mb-4 text-[9px]"
          style={{
            borderColor: `${HEALTH_COLOR[status.health]}40`,
            backgroundColor: `${HEALTH_COLOR[status.health]}12`,
          }}
        >
          <div
            className="flex items-center gap-1.5 font-semibold mb-1"
            style={{ color: HEALTH_COLOR[status.health] }}
          >
            {status.missing.length ? (
              <AlertTriangle className="h-3 w-3" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3 w-3" aria-hidden />
            )}
            <span>{status.missing.length ? 'DEPENDENCIES_MISSING' : 'MODULE_READINESS'}</span>
          </div>

          <p className="text-slate-200 font-sans text-[11px] leading-tight mb-1.5">{status.headline}</p>

          {status.detail.length > 0 && (
            <ul className="space-y-1 font-sans text-[11px] text-slate-400 leading-tight">
              {status.detail.map((line, i) => (
                <li key={i} className="flex gap-1.5">
                  <span aria-hidden style={{ color: HEALTH_COLOR[status.health] }}>—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}

          {status.primaryFix && onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab(status.primaryFix!.tab)}
              className="mt-2 w-full py-1.5 rounded text-[10px] font-bold text-black flex items-center justify-center gap-1.5 transition cursor-pointer"
              style={{ backgroundColor: HEALTH_COLOR[status.health] }}
            >
              <Radio className="h-3 w-3" aria-hidden />
              <span>{status.primaryFix.label.toUpperCase()}</span>
            </button>
          )}
        </div>
      )}

      {/* Action Triggers */}
      <div className="mt-auto pt-3 border-t border-cyan-500/20 space-y-2">
        {node.type === 'module' && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab(node.moduleKey || node.id)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-600 via-fuchsia-600 to-cyan-600 hover:from-orange-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(255,72,27,0.35)] transition cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            <span>LAUNCH MODULE ➔</span>
          </button>
        )}

        {node.subKey && onOpenVault && (
          <button
            type="button"
            onClick={() => onOpenVault(node.subKey!)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)] transition cursor-pointer"
          >
            <Database className="h-3.5 w-3.5" />
            <span>OPEN RELATIONAL VAULT</span>
          </button>
        )}

        {node.type === 'agent' && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('agents')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(224,64,251,0.3)] transition cursor-pointer"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>CONFIGURE AGENT FLEET</span>
          </button>
        )}

        {node.type === 'connector' && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('sources')}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>MANAGE CONNECTIONS</span>
          </button>
        )}

        {node.type === 'core' && (
          <div className="text-center text-[10px] text-cyan-400/80 py-1">
            ✦ CENTRAL GROWTH OS QUANTUM INTELLIGENCE CORE ✦
          </div>
        )}
      </div>
    </div>
  );
}
