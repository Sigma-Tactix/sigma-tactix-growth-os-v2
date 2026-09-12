import React from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  Cpu,
  Search,
  Eye,
  Crosshair,
  Sparkles,
  ShieldCheck,
  Database,
  Plug,
  Orbit,
  Pause,
  LayoutGrid,
} from 'lucide-react';
import {
  HEALTH_GLYPH,
  HEALTH_LABEL,
  HEALTH_COLOR,
  type ModuleHealth,
  type ModuleStatus,
  type MatrixSummary,
} from '../../lib/hologramTelemetry';
import HoloPanel, { type PanelLayout } from './HoloPanel';

/** Camera viewpoints */
export type HoloCameraPreset = 'core' | 'orbit' | 'flank' | 'wide';

export type HudPanelId = 'status' | 'search' | 'legend' | 'triad' | 'controls' | 'activity';

export const DEFAULT_PANEL_LAYOUTS: Record<HudPanelId, PanelLayout> = {
  status: { x: 0.012, y: 0.03, w: 292, h: null },
  search: { x: 0.42, y: 0.03, w: 430, h: null },
  legend: { x: 0.012, y: 0.6, w: 292, h: null },
  triad: { x: 0.012, y: 0.79, w: 292, h: null },
  controls: { x: 0.33, y: 0.88, w: 430, h: null },
  activity: { x: 0.7, y: 0.62, w: 330, h: null },
};

export interface HoloTelemetryHUDProps {
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  cameraPreset: HoloCameraPreset;
  onCameraPresetChange: (preset: HoloCameraPreset) => void;
  selectedNodeLabel?: string | null;
  selectedNodeHealth?: ModuleHealth | null;
  moduleCount: number;
  statuses: ModuleStatus[];
  summary: MatrixSummary;
  healthFilter: ModuleHealth | null;
  onHealthFilterChange: (health: ModuleHealth | null) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenVaults?: () => void;
  onRecenterCore: () => void;
  cameraReadout?: { azimuth: number; elevation: number; distance: number };
  orbitMotion: boolean;
  onToggleOrbitMotion: () => void;
  collapsed: Record<HudPanelId, boolean>;
  onToggleCollapsed: (panel: HudPanelId) => void;
  layouts: Record<string, PanelLayout>;
  onLayoutChange: (id: HudPanelId, next: PanelLayout) => void;
  onResetLayout: () => void;
  boundsRef: React.RefObject<HTMLElement | null>;
  topPanel: string | null;
  onFocusPanel: (id: HudPanelId) => void;
  activityMonitor: React.ReactNode;
}

function StatusRow({
  label,
  value,
  health,
  hint,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  value: string;
  health?: ModuleHealth;
  hint: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const color = health ? HEALTH_COLOR[health] : '#FFB088';
  const content = (
    <>
      <span className="flex items-center gap-1.5 min-w-0">
        {health ? (
          <span aria-hidden style={{ color }} className="text-[10px] leading-none">
            {HEALTH_GLYPH[health]}
          </span>
        ) : Icon ? (
          <Icon className="h-2.5 w-2.5 text-[#FFB088]/70" />
        ) : null}
        <span className="text-[8px] text-slate-400 tracking-wide truncate">{label}</span>
      </span>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center justify-between gap-2 px-1 py-0.5">{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      aria-label={hint}
      aria-pressed={!!active}
      className={`w-full flex items-center justify-between gap-2 px-1 py-0.5 rounded transition cursor-pointer text-left ${
        active ? 'bg-[#FF481B]/20 ring-1 ring-[#FF481B]/50' : 'hover:bg-[#FF481B]/10'
      }`}
    >
      {content}
    </button>
  );
}

export default function HoloTelemetryHUD({
  onResetView,
  onZoomIn,
  onZoomOut,
  isFullscreen,
  onToggleFullscreen,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  cameraPreset,
  onCameraPresetChange,
  selectedNodeLabel,
  selectedNodeHealth,
  moduleCount,
  summary,
  healthFilter,
  onHealthFilterChange,
  onNavigateTab,
  onOpenVaults,
  onRecenterCore,
  cameraReadout,
  orbitMotion,
  onToggleOrbitMotion,
  collapsed,
  onToggleCollapsed,
  layouts,
  onLayoutChange,
  onResetLayout,
  boundsRef,
  topPanel,
  onFocusPanel,
  activityMonitor,
}: HoloTelemetryHUDProps) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const auditAge = summary.lastAuditAt
    ? Math.floor((Date.now() - Date.parse(summary.lastAuditAt)) / 86_400_000)
    : null;

  const toggleHealth = (health: ModuleHealth) =>
    onHealthFilterChange(healthFilter === health ? null : health);

  const panelProps = (id: HudPanelId, title: string) => ({
    id,
    title,
    layout: layouts[id] ?? DEFAULT_PANEL_LAYOUTS[id],
    onLayoutChange: (next: PanelLayout) => onLayoutChange(id, next),
    boundsRef,
    collapsed: collapsed[id],
    onToggleCollapsed: () => onToggleCollapsed(id),
    onFocus: () => onFocusPanel(id),
    isTop: topPanel === id,
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono select-none">
      {/* 4-Corner Cybernetic HUD Reticles */}
      <svg className="absolute top-2 left-2 w-12 h-12 text-[#FF481B]/70" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M0 16 V2 H16" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 8 H12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
        <path d="M8 4 V12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
      <svg className="absolute top-2 right-2 w-12 h-12 text-[#FF481B]/70" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M48 16 V2 H32" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-2 left-2 w-12 h-12 text-[#FF481B]/70" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M0 32 V46 H16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-12 h-12 text-[#FF481B]/70" viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M48 32 V46 H32" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Live camera state */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400/50 pointer-events-none tracking-widest hidden sm:block">
        {cameraReadout
          ? `-- [ AZIMUTH: ${cameraReadout.azimuth.toFixed(0)}° // ELEV: ${cameraReadout.elevation.toFixed(0)}° // RANGE: ${cameraReadout.distance.toFixed(1)}u ] --`
          : '-- [ CAMERA: INITIALISING ] --'}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[9px] text-cyan-400/40 pointer-events-none hidden sm:flex">
        <span className="tracking-widest">
          + + PERSPECTIVE // {moduleCount} PLANETS // {summary.vaultsFilled}/{summary.vaultsTotal} VAULTS + +
        </span>
      </div>

      {/* Expand / layout controls */}
      <div className="absolute top-2 right-14 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={onResetLayout}
          title="Reset panel layout"
          aria-label="Reset panel layout"
          className="p-1.5 rounded bg-slate-900/85 hover:bg-[#FF481B]/20 text-[#FFB088] border border-[#FF481B]/30 transition cursor-pointer"
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit full screen' : 'Expand Growth Matrix to full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'Expand Growth Matrix to full screen'}
          aria-pressed={isFullscreen}
          className="px-2.5 py-1.5 rounded bg-gradient-to-r from-[#FF481B] to-[#E03A10] hover:from-[#FF6A44] hover:to-[#FF481B] text-white font-bold text-[9px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,72,27,0.35)] transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="h-3 w-3" aria-hidden /> : <Maximize2 className="h-3 w-3" aria-hidden />}
          <span>{isFullscreen ? 'EXIT' : 'EXPAND'}</span>
        </button>
      </div>

      {/* SYSTEM STATUS */}
      <HoloPanel
        {...panelProps('status', 'GROWTH OS // SYSTEM STATUS')}
        headerRight={
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#1D4ED8]/40 text-cyan-200 border border-cyan-400/40 tabular-nums">
            {summary.byHealth.active}/{summary.total} OK
          </span>
        }
      >
        <div className="px-2.5 py-2 space-y-0.5">
          <StatusRow
            label="HITL_QUEUE"
            value={summary.hitlQueue ? `${summary.hitlQueue} PENDING` : 'CLEAR'}
            health={summary.hitlQueue ? 'pending' : 'active'}
            hint={summary.hitlQueue ? `${summary.hitlQueue} agent runs need approval` : 'No agent runs waiting'}
            active={healthFilter === 'pending'}
            onClick={() => toggleHealth('pending')}
          />
          <StatusRow
            label="NEEDS_DATA"
            value={summary.blockedModules ? `${summary.blockedModules} MODULES` : 'NONE'}
            health={summary.blockedModules ? 'blocked' : 'active'}
            hint="Modules missing a dependency"
            active={healthFilter === 'blocked'}
            onClick={() => toggleHealth('blocked')}
          />
          <StatusRow
            label="STALE"
            value={summary.byHealth.stale ? `${summary.byHealth.stale} MODULES` : 'NONE'}
            health={summary.byHealth.stale ? 'stale' : 'active'}
            hint="No activity in the last 30 days"
            active={healthFilter === 'stale'}
            onClick={() => toggleHealth('stale')}
          />
          <StatusRow
            label="LOCKED"
            value={summary.lockedModules ? `${summary.lockedModules} MODULES` : 'NONE'}
            health="locked"
            hint="Modules outside the current plan"
            active={healthFilter === 'locked'}
            onClick={() => toggleHealth('locked')}
          />

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 mt-1 border-t border-[#FF481B]/15">
            <StatusRow label="VAULTS_FILLED" value={`${summary.vaultsFilled}/${summary.vaultsTotal}`} hint="Relational vaults holding data" icon={Database} />
            <StatusRow label="CONNECTORS" value={summary.connectorsTotal ? `${summary.connectorsOnline}/${summary.connectorsTotal}` : 'NONE'} hint="Connected data sources" icon={Plug} />
            <StatusRow label="GROWTH_SCORE" value={summary.growthScore !== null ? `${summary.growthScore}/100` : 'NO AUDIT'} hint="Latest diagnostic score" icon={ShieldCheck} />
            <StatusRow label="LAST_AUDIT" value={auditAge !== null ? `${auditAge}d AGO` : 'NEVER'} hint="Days since last diagnostic run" icon={Sparkles} />
          </div>

          <div className="mt-2 pt-1 border-t border-[#FF481B]/15 flex items-center justify-between text-[8px] text-slate-400">
            <span>DEPENDENCY_COVERAGE</span>
            <div className="flex gap-0.5" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-[1px] ${
                    i < Math.round(summary.dependencyCoverage * 10)
                      ? 'bg-gradient-to-t from-[#FF481B] to-[#FFB088] shadow-[0_0_3px_#FF481B]'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-[#FFB088] font-bold tabular-nums">{pct(summary.dependencyCoverage)}</span>
          </div>
        </div>
      </HoloPanel>

      {/* SEARCH + FILTERS */}
      <HoloPanel {...panelProps('search', 'SEARCH // FILTERS')}>
        <div className="flex flex-wrap items-center gap-2 p-2">
          <div className="flex items-center gap-1.5 bg-[#02020a] border border-[#FF481B]/30 rounded px-2 py-1">
            <Search className="h-3 w-3 text-[#FF481B] shrink-0" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search modules, tiers, telemetry..."
              aria-label="Search Growth Matrix nodes"
              className="bg-transparent border-none outline-none text-[11px] text-[#FFD6C2] placeholder-[#FF481B]/40 w-36 sm:w-48 font-mono"
            />
          </div>

          {[
            { id: 'all', label: `ALL (${moduleCount + 1})` },
            { id: 'module', label: `PLANETS (${moduleCount})` },
            { id: 'core', label: 'STAR' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              aria-pressed={activeFilter === f.id}
              aria-label={`Filter: ${f.label}`}
              className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider transition cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-[#FF481B] text-black shadow-[0_0_10px_#FF481B]'
                  : 'bg-slate-900/80 text-[#FFB088]/80 border border-[#FF481B]/25 hover:border-[#FF481B] hover:text-[#FFD6C2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </HoloPanel>

      {/* TARGET LOCK */}
      {selectedNodeLabel && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none bg-[#050515]/90 border border-[#FF481B]/50 rounded-lg px-4 py-2 shadow-[0_0_30px_rgba(255,72,27,0.25)] backdrop-blur-md flex items-center gap-3 z-30">
          <Crosshair className="h-4 w-4 text-[#FF481B] animate-spin" style={{ animationDuration: '6s' }} aria-hidden />
          <div>
            <span className="text-[8px] text-[#FFB088]/70 tracking-widest block">TARGET_LOCK // TELEMETRY_ACTIVE</span>
            <span className="text-xs text-white font-bold tracking-wider">{selectedNodeLabel}</span>
          </div>
          {selectedNodeHealth && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded border font-bold"
              style={{
                color: HEALTH_COLOR[selectedNodeHealth],
                borderColor: `${HEALTH_COLOR[selectedNodeHealth]}66`,
                backgroundColor: `${HEALTH_COLOR[selectedNodeHealth]}1A`,
              }}
            >
              {HEALTH_GLYPH[selectedNodeHealth]} {HEALTH_LABEL[selectedNodeHealth]}
            </span>
          )}
        </div>
      )}

      {/* HEALTH LEGEND */}
      <HoloPanel {...panelProps('legend', 'HEALTH_LEGEND')}>
        <div className="px-2.5 py-2 flex flex-wrap gap-x-3 gap-y-1">
          {(Object.keys(HEALTH_LABEL) as ModuleHealth[]).map((h) => {
            const count = summary.byHealth[h] ?? 0;
            return (
              <button
                key={h}
                type="button"
                onClick={() => toggleHealth(h)}
                aria-pressed={healthFilter === h}
                aria-label={`Highlight ${HEALTH_LABEL[h]} modules (${count})`}
                title={`Highlight ${HEALTH_LABEL[h]} modules`}
                className={`flex items-center gap-1 text-[8px] tracking-wide px-1 py-0.5 rounded transition cursor-pointer ${
                  healthFilter === h ? 'bg-[#FF481B]/20 ring-1 ring-[#FF481B]/50' : 'hover:bg-white/5'
                }`}
              >
                <span aria-hidden style={{ color: HEALTH_COLOR[h] }}>{HEALTH_GLYPH[h]}</span>
                <span className="text-slate-300">{HEALTH_LABEL[h]}</span>
                <span className="text-slate-500 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </HoloPanel>

      {/* LINKED TRIAD NODES */}
      <HoloPanel
        {...panelProps('triad', 'LINKED_TRIAD_NODES')}
        headerRight={<span className="text-[8px] text-slate-500">COVERAGE: {pct(summary.dependencyCoverage)}</span>}
      >
        <div className="flex items-center gap-4 px-3 py-2.5">
          <button
            type="button"
            onClick={onOpenVaults}
            disabled={!onOpenVaults}
            aria-label={`Open Second Brain vaults (${summary.vaultsFilled} of ${summary.vaultsTotal} filled)`}
            title="Open Second Brain vaults"
            className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative w-8 h-8 rounded-full border border-cyan-400/60 bg-cyan-950/40 flex items-center justify-center shadow-[0_0_8px_rgba(0,229,255,0.3)] group-hover:border-cyan-300 transition">
              <span className="text-[8px] font-bold text-cyan-300">VLT</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </span>
            <span className="text-[7px] text-slate-400 mt-1 group-hover:text-cyan-300">
              {summary.vaultsFilled}/{summary.vaultsTotal} VAULTS
            </span>
          </button>

          <span className="w-5 h-[1.5px] bg-gradient-to-r from-cyan-400 to-[#FF481B]" aria-hidden />

          <button
            type="button"
            onClick={onRecenterCore}
            aria-label="Recenter camera on star"
            title="Recenter camera on star"
            className="flex flex-col items-center group cursor-pointer"
          >
            <span className="relative w-8 h-8 rounded-full border border-[#FF481B]/70 bg-[#FF481B]/15 flex items-center justify-center shadow-[0_0_10px_rgba(255,72,27,0.35)] group-hover:shadow-[0_0_16px_rgba(255,72,27,0.7)] transition">
              <span className="text-[8px] font-bold text-[#FFB088]">CORE</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF481B] animate-pulse" />
            </span>
            <span className="text-[7px] text-[#FFB088] mt-1 group-hover:text-white">RECENTER</span>
          </button>

          <span className="w-5 h-[1.5px] bg-gradient-to-r from-[#FF481B] to-violet-400" aria-hidden />

          <button
            type="button"
            onClick={() => onNavigateTab?.('agents')}
            disabled={!onNavigateTab}
            aria-label={`Open Agentic AI Cockpit (${summary.hitlQueue} runs awaiting approval)`}
            title="Open Agentic AI Cockpit"
            className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative w-8 h-8 rounded-full border border-violet-400/60 bg-violet-950/40 flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.3)] group-hover:border-violet-300 transition">
              <span className="text-[8px] font-bold text-violet-300">AGT</span>
              {summary.hitlQueue > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[13px] h-[13px] px-0.5 rounded-full bg-[#FF481B] text-black text-[7px] font-bold flex items-center justify-center">
                  {summary.hitlQueue}
                </span>
              )}
            </span>
            <span className="text-[7px] text-slate-400 mt-1 group-hover:text-violet-300">{summary.runsInFlight} RUNNING</span>
          </button>
        </div>
      </HoloPanel>

      {/* VIEWPORT CONTROLS */}
      <HoloPanel {...panelProps('controls', 'VIEWPORT_CONTROLS')} resizable={false}>
        <div className="flex flex-wrap items-center gap-1.5 p-1.5">
          <div className="flex items-center gap-1 border-r border-[#FF481B]/20 pr-1.5">
            {[
              { id: 'core', label: 'CORE', icon: Sparkles, hint: 'Push in on the star' },
              { id: 'orbit', label: 'ORBIT', icon: Layers, hint: 'Top-down view of orbits' },
              { id: 'flank', label: 'FLANK', icon: Cpu, hint: 'Three-quarter flank view' },
              { id: 'wide', label: 'SYSTEM', icon: Eye, hint: 'Full system architecture' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onCameraPresetChange(p.id as HoloCameraPreset)}
                  className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    cameraPreset === p.id
                      ? 'bg-[#FF481B] text-black shadow-[0_0_8px_#FF481B]'
                      : 'bg-slate-900/80 text-[#FFB088]/80 hover:bg-[#FF481B]/20 hover:text-[#FFD6C2]'
                  }`}
                  title={p.hint}
                  aria-label={p.hint}
                  aria-pressed={cameraPreset === p.id}
                >
                  <Icon className="h-2.5 w-2.5" aria-hidden />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleOrbitMotion}
            title={orbitMotion ? 'Pause orbital motion' : 'Resume orbital motion'}
            aria-label={orbitMotion ? 'Pause orbital motion' : 'Resume orbital motion'}
            aria-pressed={orbitMotion}
            className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
              orbitMotion
                ? 'bg-[#FF481B] text-black shadow-[0_0_8px_#FF481B]'
                : 'bg-slate-900/80 text-[#FFB088]/80 border border-[#FF481B]/25 hover:text-[#FFD6C2]'
            }`}
          >
            {orbitMotion ? <Orbit className="h-2.5 w-2.5" aria-hidden /> : <Pause className="h-2.5 w-2.5" aria-hidden />}
            <span>{orbitMotion ? 'ORBITS ON' : 'ORBITS OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] hover:text-white border border-[#FF481B]/25 transition cursor-pointer"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] hover:text-white border border-[#FF481B]/25 transition cursor-pointer"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="px-2.5 py-1.5 rounded bg-slate-900/80 hover:bg-[#FF481B]/20 text-[#FFB088] hover:text-white border border-[#FF481B]/25 font-bold text-[9px] flex items-center gap-1.5 transition cursor-pointer"
            title="Reset to default framing"
            aria-label="Reset camera view"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            <span>RESET</span>
          </button>
        </div>
      </HoloPanel>

      {/* ACTIVITY MONITOR */}
      <HoloPanel {...panelProps('activity', 'MODULE_ACTIVITY')}>{activityMonitor}</HoloPanel>
    </div>
  );
}
