import { SCOPED_AGENTS, ScopedAgent } from '@/src/data/agentCockpitData';

export interface AgentTelemetryEvent {
  id: string;
  agentId: string;
  interval: string;
  status: 'completed' | 'failed';
  latencyMs: number;
  hitlRequired: boolean;
  timestamp: number;
  simulated?: boolean;
}

export interface HeatmapCellData {
  agentId: string;
  agentCode: string;
  agentName: string;
  agentRole: string;
  interval: string;
  timestamp: number;
  activeLoad: number; // verified task count (simulated events excluded)
  capacityPct: number; // 0-100%
  successRate: number; // 0-100%
  completedTasks: number;
  failedTasks: number;
  hitlPauses: number;
  avgLatencyMs: number;
  status: 'OPTIMAL' | 'ELEVATED' | 'PEAK' | 'QUIET';
  hasData: boolean;
  verifiedCount: number; // verified (non-simulated) events in this cell
  simulatedCount: number; // simulated benchmark events in this cell
}

export type HeatmapMetric = 'load' | 'success' | 'composite';
export type TimeWindow = '24h' | 'peak' | '7days';

export const TELEMETRY_STORAGE_KEY = 'sigmatactix_agent_telemetry_events';
export const TELEMETRY_UPDATED_EVENT = 'sigmatactix-telemetry-updated';

export const INTERVALS_24H = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export const INTERVALS_PEAK = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export const INTERVALS_7DAYS = [
  'Mon 08:00', 'Mon 14:00', 'Mon 20:00',
  'Tue 08:00', 'Tue 14:00', 'Tue 20:00',
  'Wed 08:00', 'Wed 14:00', 'Wed 20:00',
  'Thu 08:00', 'Thu 14:00', 'Thu 20:00',
  'Fri 08:00', 'Fri 14:00', 'Fri 20:00',
  'Sat 12:00', 'Sun 12:00'
];

/**
 * Reads telemetry events safely from localStorage. Clean slate defaults to [].
 */
export function getStoredTelemetryEvents(): AgentTelemetryEvent[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read telemetry events from storage', err);
    return [];
  }
}

/**
 * Saves telemetry events to localStorage and notifies listeners.
 */
export function saveTelemetryEvents(events: AgentTelemetryEvent[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const serialized = JSON.stringify(events);
    const existing = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (existing === serialized) return; // No change, do not trigger loop
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(TELEMETRY_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save telemetry events to storage', err);
  }
}

/**
 * Appends a new verified telemetry event.
 */
export function appendTelemetryEvent(event: AgentTelemetryEvent): void {
  const current = getStoredTelemetryEvents();
  saveTelemetryEvents([...current, event]);
}

/**
 * Resets telemetry to a clean slate (0 events).
 */
export function clearTelemetryEvents(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    window.dispatchEvent(new Event(TELEMETRY_UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to clear telemetry events', err);
  }
}

/**
 * Builds the dynamic heatmap matrix strictly from VERIFIED telemetry events.
 * Simulated benchmark events (simulated: true) are counted separately and
 * NEVER contribute to load, success, latency, or cell status. A cell with
 * only simulated events reports hasData: false (clean slate).
 */
export function buildHeatmapMatrix(
  agents: Pick<ScopedAgent, 'id' | 'codename' | 'name' | 'role'>[],
  intervals: string[],
  events: AgentTelemetryEvent[]
): HeatmapCellData[] {
  const data: HeatmapCellData[] = [];
  const baseTime = Date.now();
  const quietCell = (
    agent: Pick<ScopedAgent, 'id' | 'codename' | 'name' | 'role'>,
    interval: string,
    intIdx: number,
    simulatedCount: number
  ): HeatmapCellData => ({
    agentId: agent.id,
    agentCode: agent.codename,
    agentName: agent.name,
    agentRole: agent.role,
    interval,
    timestamp: baseTime + intIdx * 3600000,
    activeLoad: 0,
    capacityPct: 0,
    successRate: 100,
    completedTasks: 0,
    failedTasks: 0,
    hitlPauses: 0,
    avgLatencyMs: 0,
    status: 'QUIET',
    hasData: false,
    verifiedCount: 0,
    simulatedCount,
  });

  agents.forEach((agent) => {
    intervals.forEach((interval, intIdx) => {
      const matchingEvents = events.filter(
        e => e.agentId === agent.id && e.interval === interval
      );
      // Simulated benchmark events never count as verified work.
      const verifiedEvents = matchingEvents.filter(e => e.simulated !== true);
      const simulatedCount = matchingEvents.length - verifiedEvents.length;

      if (verifiedEvents.length > 0) {
        const completedTasks = verifiedEvents.filter(e => e.status === 'completed').length;
        const failedTasks = verifiedEvents.filter(e => e.status === 'failed').length;
        const hitlPauses = verifiedEvents.filter(e => e.hitlRequired).length;
        const activeLoad = verifiedEvents.length;
        const capacityPct = Math.min(100, Math.round((activeLoad / 20) * 100));
        const successRate = activeLoad > 0 ? parseFloat(((completedTasks / activeLoad) * 100).toFixed(1)) : 100;
        const totalLatency = verifiedEvents.reduce((acc, e) => acc + e.latencyMs, 0);
        const avgLatencyMs = Math.round(totalLatency / activeLoad);

        const status: HeatmapCellData['status'] =
          activeLoad > 15 ? 'PEAK' :
          activeLoad > 6 ? 'ELEVATED' : 'OPTIMAL';

        data.push({
          agentId: agent.id,
          agentCode: agent.codename,
          agentName: agent.name,
          agentRole: agent.role,
          interval,
          timestamp: baseTime + intIdx * 3600000,
          activeLoad,
          capacityPct,
          successRate,
          completedTasks,
          failedTasks,
          hitlPauses,
          avgLatencyMs,
          status,
          hasData: true,
          verifiedCount: verifiedEvents.length,
          simulatedCount,
        });
      } else {
        data.push(quietCell(agent, interval, intIdx, simulatedCount));
      }
    });
  });

  return data;
}

/**
 * Calculates aggregate fleet statistics across the active cells.
 * Only VERIFIED (non-simulated) runs are counted. Simulated benchmark
 * events are reported separately and never feed success/latency/peak.
 */
export function calculateHeatmapStats(cells: HeatmapCellData[]) {
  const simulatedRuns = cells.reduce((acc, c) => acc + (c.simulatedCount || 0), 0);
  const activeCells = cells.filter(c => c.hasData);
  if (activeCells.length === 0) {
    return {
      activeRuns: 0,
      verifiedRuns: 0,
      simulatedRuns,
      avgSuccess: 'N/A (no verified runs)',
      peakAgent: 'None',
      avgLatency: 'N/A'
    };
  }

  const totalRuns = activeCells.reduce((acc, c) => acc + c.activeLoad, 0);
  const avgSuccess = (activeCells.reduce((acc, c) => acc + c.successRate, 0) / activeCells.length).toFixed(1) + '%';
  // Latency is only known for cells that actually measured it. Ledger-derived
  // runs record lifecycle, not per-node duration, so they contribute 0 — and a
  // fleet average that treats "not measured" as 0ms would report a fake, and
  // impossibly fast, execution time.
  const measuredCells = activeCells.filter(c => c.avgLatencyMs > 0);
  const avgLatency = measuredCells.length > 0
    ? Math.round(measuredCells.reduce((acc, c) => acc + c.avgLatencyMs, 0) / measuredCells.length) + 'ms'
    : 'N/A (not measured)';

  const agentTotals: Record<string, number> = {};
  activeCells.forEach(c => {
    agentTotals[c.agentCode] = (agentTotals[c.agentCode] || 0) + c.activeLoad;
  });

  let peakAgent = 'None';
  let max = 0;
  Object.entries(agentTotals).forEach(([code, total]) => {
    if (total > max) {
      max = total;
      peakAgent = code;
    }
  });

  return { activeRuns: totalRuns, verifiedRuns: totalRuns, simulatedRuns, avgSuccess, peakAgent, avgLatency };
}

/**
 * System agent name -> Cockpit agent id.
 *
 * The ledger records the dispatch target as an AgentTask["agentName"] system
 * agent, while the heatmap renders the Cockpit's SCOPED_AGENTS rows, so the two
 * vocabularies have to be joined explicitly. A run whose agent is not in this
 * map is NOT attributed to some default agent — it is dropped from the heatmap
 * rather than counted against an agent that did not run it.
 *
 * Anchors: `agent-outreach` holds the SDR mailbox (sdr@sigmatactix.com) and
 * `agent-authority` / `agent-performance` their own (agentMailboxConfigs.ts);
 * the remainder follow MODULE_TO_SYSTEM_AGENT's module dispatch.
 */
export const SYSTEM_AGENT_TO_SCOPED_AGENT: Record<string, string> = {
  "Marketing Agent": "agent-performance",
  "Creative Director Agent": "agent-content",
  "SEO & Authority Agent": "agent-authority",
  "Audit Diagnostic Agent": "agent-diagnostic",
  "Operations Agent": "agent-ops",
  "AI SDR (Sales Agent)": "agent-outreach",
  "Customer Success Agent": "agent-outreach",
};

/**
 * Derives verified heatmap telemetry events from the transactional execution
 * ledger (Phase 1). Every emitted event is non-simulated, so simulated
 * benchmark batches can never leak into verified ledger counts.
 *
 * Two rules keep the derived numbers honest:
 *  - Each run is placed in its OWN interval, from that run's own completion
 *    time. Collapsing a day of runs into one interval would fabricate a load
 *    spike at whatever hour happened to be last.
 *  - Runs that cannot be attributed to a Cockpit agent are skipped rather than
 *    guessed at.
 */
export function buildVerifiedTelemetryFromLedger(runs: Array<{
  id: string;
  objective: string;
  agentName?: string | null;
  status: string;
  updatedAt: number;
  durationMs?: number | null;
}>): AgentTelemetryEvent[] {
  if (!Array.isArray(runs) || runs.length === 0) return [];
  const succeeded = runs.filter(r => r.status === 'succeeded');
  const failed = runs.filter(r => r.status === 'failed');
  const completedPool = [...succeeded, ...failed];
  if (completedPool.length === 0) return [];

  return completedPool
    .filter(run => !!SYSTEM_AGENT_TO_SCOPED_AGENT[run.agentName ?? ''])
    .map(run => ({
      id: `ledger-${run.id}`,
      agentId: SYSTEM_AGENT_TO_SCOPED_AGENT[run.agentName ?? ''],
      interval: `${String(new Date(run.updatedAt).getHours()).padStart(2, '0')}:00`,
      status: run.status === 'succeeded' ? ('completed' as const) : ('failed' as const),
      // Phase 2: real measured execution time from the ledger's node attempts.
      // A run with no attempt recorded has genuinely unknown latency, so it
      // stays 0 and calculateHeatmapStats() reports "N/A (not measured)"
      // rather than inventing a number.
      latencyMs: run.durationMs && run.durationMs > 0 ? run.durationMs : 0,
      hitlRequired: false,
      timestamp: run.updatedAt,
      simulated: false,
    }));
}

/**
 * Dynamic color mapper based strictly on produced values.
 * Idle quiet state is #141416.
 */
export function getCellColor(d: HeatmapCellData, metricMode: HeatmapMetric): string {
  if (!d.hasData || d.activeLoad === 0) {
    return '#141416'; // Idle Quiet / Clean Slate
  }

  if (metricMode === 'load') {
    if (d.activeLoad >= 20) return '#dc2626'; // Peak Crimson
    if (d.activeLoad >= 14) return '#ea580c'; // Heavy Orange
    if (d.activeLoad >= 8) return '#d97706';  // Moderate Amber
    if (d.activeLoad >= 4) return '#0284c7';  // Light Cyan
    return '#064e3b';                         // Initial Emerald
  } else if (metricMode === 'success') {
    if (d.successRate >= 98) return '#10b981'; // 100% Emerald
    if (d.successRate >= 90) return '#059669'; // 90%+ Teal
    if (d.successRate >= 80) return '#f59e0b'; // Amber warning
    return '#ef4444';                          // Crimson alert
  } else {
    // Composite health score
    const composite = (d.successRate * 0.6) + (Math.min(100, d.capacityPct) * 0.4);
    if (composite >= 85) return '#0ea5e9';
    if (composite >= 60) return '#6366f1';
    return '#8b5cf6';
  }
}
