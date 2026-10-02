import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildHeatmapMatrix,
  buildVerifiedTelemetryFromLedger,
  calculateHeatmapStats, 
  getCellColor, 
  getStoredTelemetryEvents, 
  saveTelemetryEvents, 
  clearTelemetryEvents, 
  appendTelemetryEvent,
  AgentTelemetryEvent,
  HeatmapCellData,
  INTERVALS_24H,
  TELEMETRY_STORAGE_KEY
} from './agentTelemetry';

const MOCK_AGENTS = [
  { id: 'agent-oracle', codename: 'ORACLE', name: 'Growth Architect', role: 'Strategic Diagnostics' },
  { id: 'agent-aurora', codename: 'AURORA', name: 'Content Engine', role: 'Editorial Authority' }
];

const storage: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock window and window.localStorage for node environment
(globalThis as any).localStorage = mockLocalStorage;
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
} else {
  (globalThis.window as any).localStorage = mockLocalStorage;
}

describe('Agent Telemetry & Dynamic Heatmap Engine', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Clean Slate Idle State', () => {
    it('generates a 0-load quiet state when no telemetry events exist', () => {
      const intervals = ['08:00', '09:00', '10:00'];
      const matrix = buildHeatmapMatrix(MOCK_AGENTS, intervals, []);

      expect(matrix).toHaveLength(MOCK_AGENTS.length * intervals.length);

      matrix.forEach(cell => {
        expect(cell.hasData).toBe(false);
        expect(cell.activeLoad).toBe(0);
        expect(cell.capacityPct).toBe(0);
        expect(cell.successRate).toBe(100);
        expect(cell.completedTasks).toBe(0);
        expect(cell.failedTasks).toBe(0);
        expect(cell.hitlPauses).toBe(0);
        expect(cell.avgLatencyMs).toBe(0);
        expect(cell.status).toBe('QUIET');

        // Clean slate color must strictly be idle dark zinc (#141416)
        expect(getCellColor(cell, 'load')).toBe('#141416');
        expect(getCellColor(cell, 'success')).toBe('#141416');
        expect(getCellColor(cell, 'composite')).toBe('#141416');
      });
    });

    it('calculates zero aggregate stats in clean slate', () => {
      const intervals = ['08:00', '09:00'];
      const matrix = buildHeatmapMatrix(MOCK_AGENTS, intervals, []);
      const stats = calculateHeatmapStats(matrix);

      expect(stats.activeRuns).toBe(0);
      expect(stats.simulatedRuns).toBe(0);
      expect(stats.avgSuccess).toBe('N/A (no verified runs)');
      expect(stats.peakAgent).toBe('None');
      expect(stats.avgLatency).toBe('N/A');
    });
  });

  describe('Telemetry Event Ingestion & Aggregation', () => {
    it('aggregates real telemetry events into matching interval cells', () => {
      const intervals = ['08:00', '09:00', '10:00'];
      const mockEvents: AgentTelemetryEvent[] = [
        {
          id: 'evt-1',
          agentId: 'agent-oracle',
          interval: '09:00',
          status: 'completed',
          latencyMs: 120,
          hitlRequired: false,
          timestamp: Date.now()
        },
        {
          id: 'evt-2',
          agentId: 'agent-oracle',
          interval: '09:00',
          status: 'completed',
          latencyMs: 80,
          hitlRequired: true,
          timestamp: Date.now()
        },
        {
          id: 'evt-3',
          agentId: 'agent-oracle',
          interval: '09:00',
          status: 'failed',
          latencyMs: 100,
          hitlRequired: false,
          timestamp: Date.now()
        }
      ];

      const matrix = buildHeatmapMatrix(MOCK_AGENTS, intervals, mockEvents);
      const oracleNineAm = matrix.find(c => c.agentId === 'agent-oracle' && c.interval === '09:00');

      expect(oracleNineAm).toBeDefined();
      expect(oracleNineAm?.hasData).toBe(true);
      expect(oracleNineAm?.activeLoad).toBe(3);
      expect(oracleNineAm?.completedTasks).toBe(2);
      expect(oracleNineAm?.failedTasks).toBe(1);
      expect(oracleNineAm?.hitlPauses).toBe(1);
      expect(oracleNineAm?.avgLatencyMs).toBe(100); // (120 + 80 + 100) / 3
      expect(oracleNineAm?.successRate).toBeCloseTo(66.7, 1); // 2 / 3 * 100
      expect(oracleNineAm?.status).toBe('OPTIMAL');
    });

    it('elevates status to ELEVATED when load > 6 and PEAK when load > 15', () => {
      const intervals = ['12:00'];
      const events: AgentTelemetryEvent[] = Array.from({ length: 18 }, (_, i) => ({
        id: `evt-${i}`,
        agentId: 'agent-aurora',
        interval: '12:00',
        status: 'completed',
        latencyMs: 50,
        hitlRequired: false,
        timestamp: Date.now()
      }));

      const matrix = buildHeatmapMatrix(MOCK_AGENTS, intervals, events);
      const auroraCell = matrix.find(c => c.agentId === 'agent-aurora' && c.interval === '12:00');

      expect(auroraCell?.status).toBe('PEAK');
      expect(auroraCell?.activeLoad).toBe(18);
    });

    it('calculates fleet aggregate stats across all active agents', () => {
      const intervals = ['10:00', '11:00'];
      const events: AgentTelemetryEvent[] = [
        { id: '1', agentId: 'agent-oracle', interval: '10:00', status: 'completed', latencyMs: 60, hitlRequired: false, timestamp: 1 },
        { id: '2', agentId: 'agent-oracle', interval: '10:00', status: 'completed', latencyMs: 40, hitlRequired: false, timestamp: 2 },
        { id: '3', agentId: 'agent-aurora', interval: '11:00', status: 'completed', latencyMs: 50, hitlRequired: false, timestamp: 3 }
      ];

      const matrix = buildHeatmapMatrix(MOCK_AGENTS, intervals, events);
      const stats = calculateHeatmapStats(matrix);

      expect(stats.activeRuns).toBe(3);
      expect(stats.avgSuccess).toBe('100.0%');
      expect(stats.peakAgent).toBe('ORACLE'); // Oracle had 2 tasks, Aurora had 1
      expect(stats.avgLatency).toBe('50ms'); // (50 + 50) / 2
    });
  });

  describe('Dynamic Color Scaling', () => {
    const baseCell: HeatmapCellData = {
      agentId: 'agent-oracle',
      agentCode: 'ORACLE',
      agentName: 'Growth Architect',
      agentRole: 'Diagnostics',
      interval: '10:00',
      timestamp: Date.now(),
      activeLoad: 1,
      capacityPct: 10,
      successRate: 100,
      completedTasks: 1,
      failedTasks: 0,
      hitlPauses: 0,
      avgLatencyMs: 45,
      status: 'OPTIMAL',
      hasData: true,
      verifiedCount: 1,
      simulatedCount: 0
    };

    it('scales load metric from quiet to emerald, cyan, amber, orange, and crimson', () => {
      // 0 load: idle quiet
      expect(getCellColor({ ...baseCell, activeLoad: 0, hasData: false }, 'load')).toBe('#141416');

      // Light load: Emerald
      expect(getCellColor({ ...baseCell, activeLoad: 2 }, 'load')).toBe('#064e3b');

      // Cyan
      expect(getCellColor({ ...baseCell, activeLoad: 5 }, 'load')).toBe('#0284c7');

      // Moderate load: Amber
      expect(getCellColor({ ...baseCell, activeLoad: 10 }, 'load')).toBe('#d97706');

      // Heavy load: Orange
      expect(getCellColor({ ...baseCell, activeLoad: 16 }, 'load')).toBe('#ea580c');

      // Peak load: Crimson
      expect(getCellColor({ ...baseCell, activeLoad: 22 }, 'load')).toBe('#dc2626');
    });

    it('scales success rate metric properly', () => {
      expect(getCellColor({ ...baseCell, successRate: 100 }, 'success')).toBe('#10b981'); // Emerald
      expect(getCellColor({ ...baseCell, successRate: 92 }, 'success')).toBe('#059669');  // Teal
      expect(getCellColor({ ...baseCell, successRate: 85 }, 'success')).toBe('#f59e0b');  // Amber
      expect(getCellColor({ ...baseCell, successRate: 70 }, 'success')).toBe('#ef4444');  // Crimson
    });
  });

  describe('Storage & Synchronization', () => {
    it('reads and writes to localStorage cleanly', () => {
      expect(getStoredTelemetryEvents()).toEqual([]);

      const sample: AgentTelemetryEvent = {
        id: 'evt-test-1',
        agentId: 'agent-oracle',
        interval: '12:00',
        status: 'completed',
        latencyMs: 50,
        hitlRequired: false,
        timestamp: Date.now()
      };

      appendTelemetryEvent(sample);
      expect(getStoredTelemetryEvents()).toHaveLength(1);
      expect(getStoredTelemetryEvents()[0].id).toBe('evt-test-1');

      clearTelemetryEvents();
      expect(getStoredTelemetryEvents()).toEqual([]);
      expect(localStorage.getItem(TELEMETRY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('Phase 0: simulated benchmark isolation (remediation plan)', () => {
    it('never counts simulated benchmark events as verified load', () => {
      const events: AgentTelemetryEvent[] = [
        { id: 'sim-1', agentId: 'agent-oracle', interval: '12:00', status: 'completed', latencyMs: 50, hitlRequired: false, timestamp: Date.now(), simulated: true },
        { id: 'sim-2', agentId: 'agent-oracle', interval: '12:00', status: 'completed', latencyMs: 60, hitlRequired: false, timestamp: Date.now(), simulated: true },
      ];
      const cells = buildHeatmapMatrix(MOCK_AGENTS, ['12:00'], events);
      const oracleCells = cells.filter(c => c.agentId === 'agent-oracle');
      expect(oracleCells).toHaveLength(1);
      expect(oracleCells[0].hasData).toBe(false);
      expect(oracleCells[0].activeLoad).toBe(0);
      expect(oracleCells[0].simulatedCount).toBe(2);

      const stats = calculateHeatmapStats(cells);
      expect(stats.activeRuns).toBe(0);
      expect(stats.simulatedRuns).toBe(2);
      expect(stats.avgSuccess).toBe('N/A (no verified runs)');
    });

    it('derives verified events from the transactional ledger as non-simulated', () => {
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'run-1', objective: 'demo', status: 'succeeded', updatedAt: Date.now(), agentName: 'Marketing Agent' },
        { id: 'run-2', objective: 'demo', status: 'failed', updatedAt: Date.now(), agentName: 'Marketing Agent' },
      ]);
      expect(verified).toHaveLength(2);
      expect(verified.every(e => e.simulated === false)).toBe(true);
      const ledgerAgents = [
        { id: 'agent-performance', codename: 'PERF', name: 'Performance', role: 'Perf' },
      ];
      const matrix = buildHeatmapMatrix(ledgerAgents, [verified[0].interval], verified);
      expect(matrix[0].hasData).toBe(true);
      expect(matrix[0].verifiedCount).toBe(2);
      expect(calculateHeatmapStats(matrix).activeRuns).toBe(2);
    });

    it('attributes each ledger run to the agent that actually ran it', () => {
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'r1', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'Audit Diagnostic Agent' },
        { id: 'r2', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'SEO & Authority Agent' },
      ]);
      expect(verified.map(e => e.agentId)).toEqual(['agent-diagnostic', 'agent-authority']);
    });

    it('drops runs it cannot attribute rather than charging them to a default agent', () => {
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'r1', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: null },
        { id: 'r2', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'Unmapped Persona Agent' },
      ]);
      expect(verified).toHaveLength(0);
    });

    it('places each run in the interval it completed, not one shared bucket', () => {
      const morning = new Date('2026-10-02T09:15:00').getTime();
      const evening = new Date('2026-10-02T21:40:00').getTime();
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'r1', objective: 'd', status: 'succeeded', updatedAt: morning, agentName: 'Marketing Agent' },
        { id: 'r2', objective: 'd', status: 'succeeded', updatedAt: evening, agentName: 'Marketing Agent' },
      ]);
      expect(verified.map(e => e.interval)).toEqual(['09:00', '21:00']);
    });

    it('reports latency as unmeasured when the ledger never recorded it', () => {
      const agent = [{ id: 'agent-performance', codename: 'PERF', name: 'Performance', role: 'Perf' }];
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'r1', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'Marketing Agent' },
      ]);
      const matrix = buildHeatmapMatrix(agent, [verified[0].interval], verified);
      const stats = calculateHeatmapStats(matrix);
      expect(stats.activeRuns).toBe(1);
      expect(stats.avgLatency).toBe('N/A (not measured)');
    });

    it('reports real measured latency from recorded node attempts', () => {
      const agent = [{ id: 'agent-performance', codename: 'PERF', name: 'Performance', role: 'Perf' }];
      const verified = buildVerifiedTelemetryFromLedger([
        { id: 'r1', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'Marketing Agent', durationMs: 4200 },
        { id: 'r2', objective: 'd', status: 'succeeded', updatedAt: Date.now(), agentName: 'Marketing Agent', durationMs: 6300 },
      ]);
      expect(verified.map(e => e.latencyMs)).toEqual([4200, 6300]);
      const matrix = buildHeatmapMatrix(agent, [verified[0].interval], verified);
      expect(calculateHeatmapStats(matrix).avgLatency).toBe('5250ms');
    });
  });
});
