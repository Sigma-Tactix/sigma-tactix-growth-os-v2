import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  buildHeatmapMatrix, 
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
      expect(stats.avgSuccess).toBe('0%');
      expect(stats.peakAgent).toBe('None');
      expect(stats.avgLatency).toBe('0ms');
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
      hasData: true
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
});
