import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { SecondBrain, AgentTask, Connector } from '../../types';
import HoloTelemetryHUD, {
  DEFAULT_PANEL_LAYOUTS,
  type HoloCameraPreset,
  type HudPanelId,
} from './HoloTelemetryHUD';
import { usePanelLayouts } from './HoloPanel';
import WaveformMonitor from './WaveformMonitor';
import HoloInspectorDrawer, { InspectedHoloNode } from './HoloInspectorDrawer';
import NeuralBrainCore3D from './NeuralBrainCore3D';
import { buildHoloGraph, GROWTH_MATRIX_MODULES } from '../../lib/hologramGraph';
import type { HoloNode3D } from '../../lib/hologramGraph';
import { assignPlanets } from '../../lib/hologramPlanets';
import {
  deriveModuleStatuses,
  summarizeMatrix,
  HEALTH_COLOR,
  HEALTH_GLYPH,
  HEALTH_LABEL,
  type ModuleHealth,
  type ModuleStatus,
} from '../../lib/hologramTelemetry';

interface GrowthOSHolographicViewProps {
  editedBrain?: SecondBrain;
  agentTasks?: AgentTask[];
  connectors?: Connector[];
  /** Plan entitlement check */
  isModuleUnlocked?: (moduleKey: string) => boolean;
  onOpenVault?: (subKey: string) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  className?: string;
  initialFullscreen?: boolean;
}

const HUD_STORAGE_KEY = 'growth-matrix.hud.collapsed';
const ALL_PANELS: HudPanelId[] = ['status', 'search', 'legend', 'triad', 'controls', 'activity'];

function useCollapsedPanels(): [Record<HudPanelId, boolean>, (panel: HudPanelId) => void] {
  const [collapsed, setCollapsed] = useState<Record<HudPanelId, boolean>>(() => {
    const fallback = Object.fromEntries(ALL_PANELS.map((p) => [p, false])) as Record<HudPanelId, boolean>;
    try {
      const raw = localStorage.getItem(HUD_STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  });

  const toggle = useCallback((panel: HudPanelId) => {
    setCollapsed((prev) => {
      const next = { ...prev, [panel]: !prev[panel] };
      try {
        localStorage.setItem(HUD_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}

export default function GrowthOSHolographicView({
  editedBrain,
  agentTasks = [],
  connectors = [],
  isModuleUnlocked,
  onOpenVault,
  onNavigateTab,
  className = '',
  initialFullscreen = false,
}: GrowthOSHolographicViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNode, setSelectedNode] = useState<HoloNode3D | null>(null);
  const [cameraPreset, setCameraPreset] = useState<HoloCameraPreset>('wide');
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomInSignal, setZoomInSignal] = useState(0);
  const [zoomOutSignal, setZoomOutSignal] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [healthFilter, setHealthFilter] = useState<ModuleHealth | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HoloNode3D | null>(null);
  const [cameraReadout, setCameraReadout] = useState<{ azimuth: number; elevation: number; distance: number } | undefined>();
  const [collapsed, toggleCollapsed] = useCollapsedPanels();
  const [orbitMotion, setOrbitMotion] = useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { layouts, update: updateLayout, reset: resetLayout, topPanel, setTopPanel } =
    usePanelLayouts(DEFAULT_PANEL_LAYOUTS);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    try {
      if (!document.fullscreenElement && el?.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
    } catch {
      /* fallback */
    }
    setIsFullscreen((f) => !f);
  }, []);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  const telemetryInput = useMemo(
    () => ({ brain: editedBrain, agentTasks, connectors, isModuleUnlocked }),
    [editedBrain, agentTasks, connectors, isModuleUnlocked]
  );
  const statuses = useMemo(() => deriveModuleStatuses(telemetryInput), [telemetryInput]);
  const summary = useMemo(() => summarizeMatrix(statuses, telemetryInput), [statuses, telemetryInput]);
  const statusByModule = useMemo(() => {
    const map = new Map<string, ModuleStatus>();
    for (const s of statuses) map.set(s.moduleKey, s);
    return map;
  }, [statuses]);

  const statusFor = useCallback(
    (node: HoloNode3D | null) => (node?.moduleKey ? statusByModule.get(node.moduleKey) ?? null : null),
    [statusByModule]
  );

  const planets = useMemo(() => assignPlanets(statuses), [statuses]);

  const healthColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const status of statuses) map[`mod-${status.moduleKey}`] = HEALTH_COLOR[status.health];
    return map;
  }, [statuses]);

  const { allNodes, allLinks } = useMemo(() => {
    const moduleMetrics: Record<string, Record<string, string | number>> = {};
    for (const status of statuses) {
      moduleMetrics[status.moduleKey] = {
        STATE: HEALTH_LABEL[status.health],
        ACTIVITY: `${Math.round(status.activity * 100)}%`,
        APPROVALS_WAITING: status.pendingApprovals,
        ...(status.missing.length ? { MISSING: status.missing.join(', ') } : {}),
      };
    }
    const positions: Record<string, [number, number, number]> = {};
    for (const planet of planets) {
      positions[planet.moduleKey] = [
        Math.cos(planet.phase) * planet.orbitRadius,
        Math.sin(planet.phase) * planet.orbitRadius * Math.sin(planet.inclination),
        Math.sin(planet.phase) * planet.orbitRadius * Math.cos(planet.inclination),
      ];
    }
    const { nodes, links } = buildHoloGraph(selectedNode?.id ?? null, {
      positions,
      coreMetrics: {
        MODULES_ONLINE: `${summary.byHealth.active}/${summary.total}`,
        HITL_QUEUE: summary.hitlQueue,
        VAULTS_FILLED: `${summary.vaultsFilled}/${summary.vaultsTotal}`,
        DEPENDENCY_COVERAGE: `${Math.round(summary.dependencyCoverage * 100)}%`,
      },
      moduleMetrics,
    });
    return { allNodes: nodes, allLinks: links };
  }, [selectedNode, statuses, summary, planets]);

  const filteredNodes = useMemo(() => {
    return allNodes.filter((node) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = node.label.toLowerCase().includes(q);
        const matchesDesc = node.description.toLowerCase().includes(q);
        const matchesType = node.type.toLowerCase().includes(q);
        if (!matchesLabel && !matchesDesc && !matchesType) return false;
      }

      if (activeFilter !== 'all') {
        if (activeFilter === 'module' && node.type !== 'module') return false;
        if (activeFilter === 'core' && node.type !== 'core') return false;
      }

      if (healthFilter && node.type === 'module') {
        if (statusByModule.get(node.moduleKey ?? '')?.health !== healthFilter) return false;
      }

      return true;
    });
  }, [allNodes, searchQuery, activeFilter, healthFilter, statusByModule]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredLinks = useMemo(
    () => allLinks.filter((l) => activeNodeIds.size === allNodes.length || l.active),
    [allLinks, activeNodeIds, allNodes.length]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#050515] border border-[#FF481B]/30 rounded-2xl shadow-[0_0_50px_rgba(255,72,27,0.15)] transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen'
          : `h-[740px] ${className}`
      }`}
    >
      {!mounted ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#050515] text-cyan-400 font-mono gap-3">
          <Activity className="h-8 w-8 text-cyan-400 animate-spin" />
          <div className="text-xs tracking-widest uppercase">INITIALIZING GROWTH MATRIX...</div>
        </div>
      ) : (
        <NeuralBrainCore3D
          nodes={filteredNodes}
          links={filteredLinks}
          selectedId={selectedNode?.id ?? null}
          onSelectNode={(node) => setSelectedNode(node)}
          onHoverNode={setHoveredNode}
          healthColors={healthColors}
          coreActivity={
            statuses.length ? statuses.reduce((sum, st) => sum + st.activity, 0) / statuses.length : 0
          }
          resetSignal={resetSignal}
          zoomInSignal={zoomInSignal}
          zoomOutSignal={zoomOutSignal}
          cameraPreset={cameraPreset}
          onCameraChange={setCameraReadout}
          planets={planets}
          orbitMotion={orbitMotion}
        />
      )}

      <HoloTelemetryHUD
        onResetView={() => setResetSignal((s) => s + 1)}
        onZoomIn={() => setZoomInSignal((s) => s + 1)}
        onZoomOut={() => setZoomOutSignal((s) => s + 1)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
        selectedNodeLabel={selectedNode?.label}
        selectedNodeHealth={statusFor(selectedNode)?.health ?? null}
        moduleCount={GROWTH_MATRIX_MODULES.length}
        statuses={statuses}
        summary={summary}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        onNavigateTab={onNavigateTab ? (tab) => onNavigateTab(tab) : undefined}
        onOpenVaults={onOpenVault ? () => onOpenVault('brandVault') : undefined}
        onRecenterCore={() => {
          setSelectedNode(null);
          setCameraPreset('core');
        }}
        cameraReadout={cameraReadout}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        orbitMotion={orbitMotion}
        onToggleOrbitMotion={() => setOrbitMotion((m) => !m)}
        layouts={layouts}
        onLayoutChange={updateLayout}
        onResetLayout={resetLayout}
        boundsRef={containerRef}
        topPanel={topPanel}
        onFocusPanel={setTopPanel}
        activityMonitor={
          <WaveformMonitor
            isInspecting={!!selectedNode}
            statuses={statuses}
            selectedModuleKey={selectedNode?.moduleKey ?? null}
            onSelectModule={(moduleKey) => {
              const node = allNodes.find((n) => n.moduleKey === moduleKey);
              if (node) setSelectedNode(node);
            }}
          />
        }
      />

      {hoveredNode && hoveredNode.id !== selectedNode?.id && (
        <div className="absolute left-1/2 -translate-x-1/2 top-16 z-30 pointer-events-none">
          <div className="bg-[#050515]/95 border border-[#FF481B]/40 rounded-md px-3 py-1.5 font-mono shadow-[0_0_18px_rgba(255,72,27,0.2)] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white font-bold">{hoveredNode.label}</span>
              {statusFor(hoveredNode) && (
                <span
                  className="text-[8px] px-1 py-0.5 rounded border font-bold"
                  style={{
                    color: HEALTH_COLOR[statusFor(hoveredNode)!.health],
                    borderColor: `${HEALTH_COLOR[statusFor(hoveredNode)!.health]}66`,
                  }}
                >
                  {HEALTH_GLYPH[statusFor(hoveredNode)!.health]} {HEALTH_LABEL[statusFor(hoveredNode)!.health]}
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {statusFor(hoveredNode)?.headline ?? 'Click to inspect'}
            </div>
          </div>
        </div>
      )}

      {selectedNode && (
        <HoloInspectorDrawer
          node={selectedNode as InspectedHoloNode}
          status={statusFor(selectedNode)}
          onClose={() => setSelectedNode(null)}
          onOpenVault={(subKey) => {
            if (onOpenVault) onOpenVault(subKey);
            setSelectedNode(null);
          }}
          onNavigateTab={(tab) => {
            if (onNavigateTab) {
              const targetKey = selectedNode.moduleKey || tab;
              onNavigateTab(targetKey);
            }
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}
