import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  Cpu,
  ShieldCheck,
  Bot,
  Layers,
  Filter,
  Info,
  Maximize2,
  RefreshCw,
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { SCOPED_AGENTS } from '@/src/data/agentCockpitData';
import { useToast } from '@/src/contexts/ToastContext';
import {
  HeatmapMetric,
  TimeWindow,
  HeatmapCellData,
  AgentTelemetryEvent,
  INTERVALS_24H,
  INTERVALS_PEAK,
  INTERVALS_7DAYS,
  TELEMETRY_STORAGE_KEY,
  TELEMETRY_UPDATED_EVENT,
  getStoredTelemetryEvents,
  saveTelemetryEvents,
  clearTelemetryEvents,
  buildHeatmapMatrix,
  calculateHeatmapStats,
  buildVerifiedTelemetryFromLedger
} from '@/src/lib/agentTelemetry';
import { apiFetch } from '@/src/lib/api';

export type { HeatmapMetric, TimeWindow, HeatmapCellData, AgentTelemetryEvent };

export default function AgentHeatmap({
  onSelectAgent
}: {
  onSelectAgent?: (agentId: string) => void;
}) {
  const { notifySuccess, notifyInfo } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [metricMode, setMetricMode] = useState<HeatmapMetric>('load');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 280 });
  const [isDispatching, setIsDispatching] = useState(false);

  // Read authentic telemetry events from localStorage (Clean slate default: [])
  const [telemetryEvents, setTelemetryEvents] = useState<AgentTelemetryEvent[]>(() => {
    return getStoredTelemetryEvents();
  });

  // Cross-component sync for live telemetry ingestion
  useEffect(() => {
    const handleSync = () => {
      const latest = getStoredTelemetryEvents();
      setTelemetryEvents(prev => {
        if (prev.length === latest.length && JSON.stringify(prev) === JSON.stringify(latest)) {
          return prev;
        }
        return latest;
      });
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener(TELEMETRY_UPDATED_EVENT, handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener(TELEMETRY_UPDATED_EVENT, handleSync);
    };
  }, []);

  // Phase 1: verified runs come from the transactional execution ledger, not
  // from localStorage. localStorage holds the simulated benchmark batch (and
  // nothing that is allowed to count as verified work), so the two feeds are
  // kept apart: ledgerRuns -> verified events, telemetryEvents -> simulation.
  const [ledgerRuns, setLedgerRuns] = useState<Array<{
    id: string;
    objective: string;
    agentName: string | null;
    status: string;
    updatedAt: number;
    durationMs?: number | null;
  }>>([]);
  const [ledgerUnavailable, setLedgerUnavailable] = useState(false);

  // Get active intervals
  const currentIntervals = useMemo(() => {
    if (timeWindow === 'peak') return INTERVALS_PEAK;
    if (timeWindow === '7days') return INTERVALS_7DAYS;
    return INTERVALS_24H;
  }, [timeWindow]);

  useEffect(() => {
    let cancelled = false;
    const loadLedger = async () => {
      try {
        const res = await apiFetch('/api/workspace/execution-ledger');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const payload = await res.json();
        if (cancelled) return;
        setLedgerRuns(
          (payload.runs || []).map((run: any) => ({
            id: run.id,
            objective: run.objective,
            agentName: run.agentName ?? null,
            status: run.status,
            updatedAt: new Date(run.updatedAt).getTime(),
            durationMs: run.durationMs ?? null,
          }))
        );
        setLedgerUnavailable(false);
      } catch {
        // A ledger that cannot be read is an unavailable state, not an empty
        // one — surface it rather than quietly rendering a quiet fleet.
        if (!cancelled) setLedgerUnavailable(true);
      }
    };
    void loadLedger();
    return () => { cancelled = true; };
  }, []);

  // Verified events derived from the ledger; simulated local events are merged
  // in as well, but buildHeatmapMatrix() keeps them out of verified stats.
  const verifiedLedgerEvents = useMemo(
    () => buildVerifiedTelemetryFromLedger(ledgerRuns),
    [ledgerRuns]
  );

  // Generate dynamic heatmap data calculated STRICTLY from produced telemetry events
  const heatmapData = useMemo(() => {
    return buildHeatmapMatrix(
      SCOPED_AGENTS,
      currentIntervals,
      [...verifiedLedgerEvents, ...telemetryEvents]
    );
  }, [currentIntervals, verifiedLedgerEvents, telemetryEvents]);

  // Dispatch a simulated benchmark batch for color-scale calibration only.
  // Phase 0: simulated events are written with simulated: true, which
  // buildHeatmapMatrix() isolates from verified load stats. No timer may
  // convert these into verified successes.
  const handleDispatchTestTelemetry = () => {
    setIsDispatching(true);
    try {
      // Generate simulated benchmark batch for agents across mid-day window
      const sampleIntervals = currentIntervals.slice(8, 14);
      const newEvents: AgentTelemetryEvent[] = [];

      SCOPED_AGENTS.forEach((agent) => {
        const runsCount = agent.isOrchestrator ? 8 : (agent.id === 'agent-performance' ? 14 : Math.floor(Math.random() * 6) + 3);

        for (let i = 0; i < runsCount; i++) {
          const chosenInterval = sampleIntervals[Math.floor(Math.random() * sampleIntervals.length)];
          const isFailed = Math.random() < 0.05; // 95%+ success
          newEvents.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            agentId: agent.id,
            interval: chosenInterval,
            status: isFailed ? 'failed' : 'completed',
            latencyMs: Math.floor(Math.random() * 40) + 35, // 35 - 75ms
            hitlRequired: Math.random() < 0.15,
            timestamp: Date.now(),
            simulated: true,
          });
        }
      });

      const updated = [...telemetryEvents, ...newEvents];
      setTelemetryEvents(updated);
      saveTelemetryEvents(updated);
      notifyInfo(
        'Benchmark Telemetry Generated',
        `Generated ${newEvents.length} SIMULATED benchmark events across ${SCOPED_AGENTS.length} agents. Excluded from verified ledger metrics.`
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const handleClearTelemetry = () => {
    clearTelemetryEvents();
    setTelemetryEvents([]);
    setSelectedCell(null);
    notifyInfo('Clean Slate Restored', 'All telemetry events cleared. Heatmap reset to 0-load quiet state.');
  };

  // ResizeObserver for responsive SVG sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      const targetWidth = Math.max(640, width);
      const targetHeight = SCOPED_AGENTS.length * 44 + 80;
      setDimensions({ width: targetWidth, height: targetHeight });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // D3 Rendering Pipeline with Dynamic Color Scale based STRICTLY on produced values
  useEffect(() => {
    if (!svgRef.current || !heatmapData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear prior render

    const margin = {
      top: 36,
      right: 24,
      bottom: 40,
      left: 170
    };

    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X scale (Time Intervals)
    const xScale = d3.scaleBand<string>()
      .domain(currentIntervals)
      .range([0, innerWidth])
      .padding(0.08);

    // Y scale (Agents)
    const agentIds = SCOPED_AGENTS.map(a => a.id);
    const yScale = d3.scaleBand<string>()
      .domain(agentIds)
      .range([0, innerHeight])
      .padding(0.12);

    // Dynamic Color Scale based on actual produced values:
    // When load === 0, returns clean dark zinc (#141416)
    const loadColorScale = d3.scaleLinear<string>()
      .domain([1, 4, 8, 14, 22])
      .range(['#064e3b', '#0284c7', '#d97706', '#ea580c', '#dc2626']);

    // Color mapper
    const getColor = (d: HeatmapCellData) => {
      if (!d.hasData || d.activeLoad === 0) {
        return '#141416'; // Quiet / Clean Slate
      }

      if (metricMode === 'load') {
        return loadColorScale(d.activeLoad);
      } else if (metricMode === 'success') {
        if (d.successRate >= 98) return '#10b981'; // Emerald 100%
        if (d.successRate >= 90) return '#059669'; // Teal high
        if (d.successRate >= 80) return '#f59e0b'; // Amber warning
        return '#ef4444'; // Crimson alert
      } else {
        // Composite health score
        const composite = (d.successRate * 0.6) + (Math.min(100, d.capacityPct) * 0.4);
        if (composite >= 85) return '#0ea5e9';
        if (composite >= 60) return '#6366f1';
        return '#8b5cf6';
      }
    };

    // Draw X-axis ticks & labels
    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickSize(0));

    xAxis.select('.domain').remove();
    xAxis.selectAll('text')
      .attr('fill', '#71717a')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('dy', '14px')
      .style('text-anchor', 'middle');

    // Draw Y-axis agent labels
    const yAxisGroup = g.append('g');

    SCOPED_AGENTS.forEach(agent => {
      const yPos = (yScale(agent.id) ?? 0) + (yScale.bandwidth() / 2);

      const labelG = yAxisGroup.append('g')
        .attr('transform', `translate(-14, ${yPos})`)
        .style('cursor', 'pointer')
        .on('click', () => onSelectAgent?.(agent.id));

      // Codename pill
      labelG.append('text')
        .attr('text-anchor', 'end')
        .attr('y', -3)
        .attr('fill', '#f59e0b')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(agent.codename);

      // Friendly Name
      labelG.append('text')
        .attr('text-anchor', 'end')
        .attr('y', 11)
        .attr('fill', '#d4d4d8')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(agent.name.length > 20 ? agent.name.slice(0, 18) + '...' : agent.name);
    });

    // Draw grid background stripes
    g.selectAll('.bg-row')
      .data(agentIds)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d) ?? 0)
      .attr('width', innerWidth)
      .attr('height', yScale.bandwidth())
      .attr('fill', 'rgba(255, 255, 255, 0.01)')
      .attr('rx', 4);

    // Render Heatmap Cells
    const cells = g.selectAll<SVGGElement, HeatmapCellData>('.heatmap-cell')
      .data(heatmapData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr('transform', (d: HeatmapCellData) => `translate(${xScale(d.interval)}, ${yScale(d.agentId)})`)
      .style('cursor', 'pointer');

    // Main Cell Rect
    cells.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d: HeatmapCellData) => getColor(d))
      .attr('stroke', (d: HeatmapCellData) => {
        if (selectedCell?.agentId === d.agentId && selectedCell?.interval === d.interval) {
          return '#f59e0b';
        }
        return d.hasData ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)';
      })
      .attr('stroke-width', (d: HeatmapCellData) => {
        if (selectedCell?.agentId === d.agentId && selectedCell?.interval === d.interval) {
          return 2.5;
        }
        return 1;
      })
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .attr('opacity', 1);

    // Dynamic numeric text overlay
    if (xScale.bandwidth() >= 34) {
      cells.append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2 + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', (d: HeatmapCellData) => {
          if (!d.hasData) return '#3f3f46';
          if (metricMode === 'load') return d.activeLoad > 10 ? '#ffffff' : '#e4e4e7';
          return d.successRate >= 95 ? '#ffffff' : '#fbbf24';
        })
        .text((d: HeatmapCellData) => {
          if (!d.hasData) return '·';
          if (metricMode === 'load') return d.activeLoad;
          if (metricMode === 'success') return `${Math.round(d.successRate)}%`;
          return `${d.capacityPct}%`;
        });
    }

    // Cell Interactivity
    cells
      .on('mouseenter', function (event: MouseEvent, d: HeatmapCellData) {
        d3.select(this).select('rect')
          .transition()
          .duration(120)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        setHoveredCell(d);
        const rect = (event.currentTarget as SVGGElement).getBoundingClientRect();
        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      })
      .on('mouseleave', function (_: MouseEvent, d: HeatmapCellData) {
        const isCurrentSelected = selectedCell?.agentId === d.agentId && selectedCell?.interval === d.interval;
        d3.select(this).select('rect')
          .transition()
          .duration(120)
          .attr('stroke', isCurrentSelected ? '#f59e0b' : (d.hasData ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)'))
          .attr('stroke-width', isCurrentSelected ? 2.5 : 1);

        setHoveredCell(null);
        setTooltipPos(null);
      })
      .on('click', (_: MouseEvent, d: HeatmapCellData) => {
        setSelectedCell(d);
      });

  }, [heatmapData, dimensions, metricMode, currentIntervals, selectedCell, onSelectAgent]);

  // Aggregate stats across current dataset
  const stats = useMemo(() => {
    return calculateHeatmapStats(heatmapData);
  }, [heatmapData]);

  return (
    <div className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 lg:p-8 shadow-[var(--sigma-shadow-lg)] space-y-6">
      {/* Deliberately-dark D3 console: the heatmap cells, summary strip, and drill-down
          render in static dark shades, so the card stays on a fixed dark surface rather
          than flipping with the page theme. */}
      {/* Heatmap Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={18} className="text-accent" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Agent Execution &amp; Load Heatmap
            </h3>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold border border-zinc-700">
              Dynamic Scale
            </span>
          </div>
          {ledgerUnavailable ? (
            <p className="text-xs text-amber-accent" role="status">
              Execution ledger unavailable — verified load and success cannot be shown.
              Apply migration 0017 and reload. Simulated benchmarks below are not verified work.
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Verified execution matrix. Only verified ledger runs count toward load and success; simulated benchmarks are labeled separately and never feed verified stats.
            </p>
          )}
        </div>

        {/* View Toggle Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Buttons: Dispatch Simulated Benchmark & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDispatchTestTelemetry}
              disabled={isDispatching}
              className="px-3 py-1.5 rounded-xl bg-accent text-background font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-all amber-glow disabled:opacity-50"
              title="Generates SIMULATED benchmark runs (isolated from verified stats) to calibrate dynamic color scaling"
            >
              <Play size={12} className={cn(isDispatching && "animate-spin")} />
              <span>{isDispatching ? 'Simulating...' : 'Simulate Benchmark'}</span>
            </button>
            {stats.simulatedRuns > 0 && (
              <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                {stats.simulatedRuns} simulated benchmark · excluded from verified stats
              </span>
            )}

            {telemetryEvents.length > 0 && (
              <button
                onClick={handleClearTelemetry}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-muted hover:text-rose-400 border border-white/10 text-xs font-mono transition-all flex items-center gap-1"
                title="Reset to clean slate (0 tasks)"
              >
                <RotateCcw size={12} />
                <span>Clean Slate</span>
              </button>
            )}
          </div>

          {/* Metric Selector */}
          <div className="sigma-segmented font-mono" role="group" aria-label="Heatmap metric">
            <button
              type="button"
              onClick={() => setMetricMode('load')}
              className={cn(
                "sigma-segment flex items-center gap-1.5",
                metricMode === 'load'
                  ? "sigma-segment-active"
                  : ""
              )}
            >
              <Cpu size={12} />
              <span>Active Load</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricMode('success')}
              className={cn(
                "sigma-segment flex items-center gap-1.5",
                metricMode === 'success'
                  ? "sigma-segment-active"
                  : ""
              )}
            >
              <CheckCircle2 size={12} />
              <span>Success Rate</span>
            </button>

            <button
              type="button"
              onClick={() => setMetricMode('composite')}
              className={cn(
                "sigma-segment flex items-center gap-1.5",
                metricMode === 'composite'
                  ? "sigma-segment-active"
                  : ""
              )}
            >
              <Sparkles size={12} />
              <span>Composite Health</span>
            </button>
          </div>

          {/* Time Window Switcher */}
          <div className="sigma-segmented font-mono" role="group" aria-label="Heatmap time window">
            {[
              { id: '24h', label: '24 Hours' },
              { id: 'peak', label: 'Peak Window' },
              { id: '7days', label: 'Past 7 Days' },
            ].map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setTimeWindow(w.id as TimeWindow)}
                className={cn(
                  "sigma-segment",
                  timeWindow === w.id
                    ? "sigma-segment-active"
                    : ""
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
        <div>
          <span className="text-[10px] text-muted uppercase">Verified Runs:</span>
          <div className="text-base font-bold text-white mt-0.5">{stats.activeRuns} Tasks</div>
        </div>
        <div>
          <span className="text-[10px] text-muted uppercase">Verified Success:</span>
          <div className="text-base font-bold text-emerald-400 mt-0.5">{stats.avgSuccess}</div>
        </div>
        <div>
          <span className="text-[10px] text-muted uppercase">Peak Agent (verified):</span>
          <div className="text-base font-bold text-amber-400 mt-0.5">{stats.peakAgent}</div>
        </div>
        <div>
          <span className="text-[10px] text-muted uppercase">Verified Latency:</span>
          <div className="text-base font-bold text-zinc-300 mt-0.5">{stats.avgLatency}</div>
        </div>
      </div>

      {/* SVG Container */}
      <div ref={containerRef} className="w-full overflow-x-auto relative min-h-[300px]">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
        />

        {/* Hover Tooltip */}
        {hoveredCell && tooltipPos && (
          <div
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-zinc-950/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono w-64 space-y-2 animate-in fade-in zoom-in-95"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold text-accent">{hoveredCell.agentCode}</span>
              <span className="text-zinc-400">{hoveredCell.interval}</span>
            </div>

            {hoveredCell.hasData ? (
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted">Verified Runs:</span>
                  <span className="text-white font-bold">{hoveredCell.activeLoad} tasks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Verified Success:</span>
                  <span className="text-emerald-400 font-bold">{hoveredCell.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Completed / Failed:</span>
                  <span className="text-zinc-300">{hoveredCell.completedTasks} / {hoveredCell.failedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Verified Latency:</span>
                  <span className="text-amber-400">{hoveredCell.avgLatencyMs}ms</span>
                </div>
                {hoveredCell.simulatedCount > 0 && (
                  <div className="flex justify-between border-t border-white/10 pt-1">
                    <span className="text-muted">Simulated (excluded):</span>
                    <span className="text-amber-300">{hoveredCell.simulatedCount} benchmark</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 py-1">
                {hoveredCell.simulatedCount > 0
                  ? `No verified runs for this interval. ${hoveredCell.simulatedCount} simulated benchmark event(s) excluded from verified stats.`
                  : 'No verified runs for this interval. Clean Slate state.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted">Scale Metric:</span>
          <span className="font-bold text-white">
            {metricMode === 'load' ? 'Task Intensity (Dynamic Color Scale)' :
             metricMode === 'success' ? 'Execution Success Rate (Dynamic Green/Amber/Red)' :
             'Composite Execution Score'}
          </span>
        </div>

        {/* Dynamic Color Scale Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted">Idle / Clean (#141416)</span>
          <div
            className="w-44 h-3 rounded-full overflow-hidden border border-white/10"
            style={{
              background: metricMode === 'load'
                ? 'linear-gradient(to right, #141416, #064e3b, #0284c7, #d97706, #ea580c, #dc2626)'
                : metricMode === 'success'
                ? 'linear-gradient(to right, #141416, #ef4444, #f59e0b, #059669, #10b981)'
                : 'linear-gradient(to right, #141416, #8b5cf6, #6366f1, #0ea5e9)'
            }}
          />
          <span className="text-[10px] text-muted">Peak Intensity</span>
        </div>
      </div>

      {/* Selected Cell Drilldown Card */}
      {selectedCell && (
        <div className="p-4 rounded-xl bg-black/40 border border-accent/40 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="px-2 py-0.5 rounded bg-accent/15 text-accent font-mono text-xs font-bold border border-accent/30">
                {selectedCell.agentCode}
              </div>
              <h4 className="text-sm font-bold text-white">
                {selectedCell.agentName} • {selectedCell.interval} Interval Telemetry
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectAgent?.(selectedCell.agentId)}
                className="px-3 py-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                title="Focus this agent in the detailed inspector below"
              >
                <span>Inspect Agent</span>
                <ArrowRight size={12} />
              </button>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-wider px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-muted uppercase block">Verified Queue</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {selectedCell.activeLoad} verified tasks
              </span>
              <span className="text-[10px] text-accent">{selectedCell.capacityPct}% capacity</span>
              {selectedCell.simulatedCount > 0 && (
                <span className="text-[10px] text-amber-300 block">{selectedCell.simulatedCount} simulated benchmark excluded</span>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-muted uppercase block">Verified Accuracy</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {selectedCell.hasData ? `${selectedCell.successRate}%` : 'N/A (Idle)'}
              </span>
              <span className="text-[10px] text-zinc-400">
                {selectedCell.failedTasks === 0 ? 'Zero failures' : `${selectedCell.failedTasks} logged error`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-muted uppercase block">Verified Output</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {selectedCell.completedTasks} completed
              </span>
              <span className="text-[10px] text-secondary">{selectedCell.hitlPauses} HITL checkpoints</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-muted uppercase block">Inference Latency</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {selectedCell.hasData ? `${selectedCell.avgLatencyMs} ms` : '0 ms'}
              </span>
              <span className="text-[10px] text-muted">Model Context Protocol</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
