import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapAgentTaskToHITL,
  TaskStoreManager,
  TaskStateTransition,
} from './taskStore';
import { AgentTask } from '../types.js';

describe('Phase 1 Shared Client Task Store', () => {
  let store: TaskStoreManager;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    store = new TaskStoreManager({ fetchFn: mockFetch });
  });

  it('maps server AgentTask to HITLTask format accurately', () => {
    const serverTask: AgentTask = {
      id: 'task-1727800000',
      agentName: 'SEO & Authority Agent',
      goal: '[Strategy strat-01] Build discoverable authority with schema indexing',
      timestamp: '2026-10-01 14:00',
      status: 'Pending Approval',
      allowedScope: ['Authority Vault', 'Marketing Vault'],
      requestedBy: 'usr-admin-1',
      steps: [],
      output: '',
      priority: 'high',
    };

    const hitl = mapAgentTaskToHITL(serverTask);
    expect(hitl.id).toBe('task-1727800000');
    expect(hitl.agentName).toBe('SEO & Authority Agent');
    expect(hitl.status).toBe('PENDING');
    expect(hitl.riskLevel).toBe('HIGH');
    expect(hitl.vaultAffected).toBe('Authority Vault');
    expect(hitl.proposedAction).toContain('Build discoverable authority');
  });

  it('fetches tasks for a workspace and stores them in state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        agentTasks: [
          {
            id: 'task-101',
            agentName: 'Performance Marketing Agent',
            goal: 'Optimize budget spend',
            timestamp: '2026-10-01 12:00',
            status: 'Pending Approval',
            steps: [],
            output: '',
          },
        ],
      }),
    });

    const tasks = await store.fetchTasks('ws-alpha');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-101');
    expect(tasks[0].status).toBe('PENDING');
  });

  it('approves a task via the server endpoint and updates status', async () => {
    store.setTasks('ws-alpha', [
      {
        id: 'task-101',
        agentId: 'agent-performance',
        agentName: 'Performance Marketing Agent',
        title: 'Optimize budget spend',
        actionType: 'BUDGET_REALLOCATION',
        riskLevel: 'HIGH',
        proposedAction: 'Reallocate spend',
        rationale: 'Reduce CAC',
        impactEstimate: '$4,000 monthly',
        requestedAt: '2026-10-01 12:00',
        status: 'PENDING',
        vaultAffected: 'Marketing Vault',
        payload: {},
      },
    ]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        task: {
          id: 'task-101',
          status: 'Success',
          output: 'Optimized budget allocation applied',
        },
      }),
    });

    const result = await store.approveTask('ws-alpha', 'task-101');
    expect(result.success).toBe(true);
    expect(result.task?.status).toBe('APPROVED');

    const tasks = store.getTasks('ws-alpha');
    expect(tasks[0].status).toBe('APPROVED');
  });

  it('rejects a task via the server endpoint and updates status', async () => {
    store.setTasks('ws-alpha', [
      {
        id: 'task-102',
        agentId: 'agent-cro',
        agentName: 'Growth & Audit Diagnostic Agent',
        title: 'Override checkout schema',
        actionType: 'SCHEMA_OVERRIDE',
        riskLevel: 'CRITICAL',
        proposedAction: 'Modify checkout',
        rationale: 'Improve funnel',
        impactEstimate: '+12% conversions',
        requestedAt: '2026-10-01 12:10',
        status: 'PENDING',
        vaultAffected: 'Audit Vault',
        payload: {},
      },
    ]);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        task: {
          id: 'task-102',
          status: 'Rejected',
        },
      }),
    });

    const result = await store.rejectTask('ws-alpha', 'task-102');
    expect(result.success).toBe(true);
    expect(result.task?.status).toBe('REJECTED');

    const tasks = store.getTasks('ws-alpha');
    expect(tasks[0].status).toBe('REJECTED');
  });

  it('prevents duplicate simultaneous queue submissions using client lock', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  task: {
                    id: 'task-103',
                    agentName: 'SEO & Authority Agent',
                    goal: 'Deploy technical schema markup',
                    status: 'Pending Approval',
                    steps: [],
                    output: '',
                    timestamp: '2026-10-01 12:15',
                  },
                }),
              }),
            50
          )
        )
    );

    // Fire two identical queue requests simultaneously
    const p1 = store.queueTask('ws-alpha', {
      agentName: 'SEO & Authority Agent',
      goal: 'Deploy technical schema markup',
    });
    const p2 = store.queueTask('ws-alpha', {
      agentName: 'SEO & Authority Agent',
      goal: 'Deploy technical schema markup',
    });

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1.success).toBe(true);
    // Second request is deduplicated by the in-flight idempotency guard
    expect(res2.deduplicated).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('derives durable log items from recorded task transitions', async () => {
    store.recordLog('ws-alpha', {
      agentId: 'agent-performance',
      agentCodename: 'CHRONOS',
      level: 'GATE',
      category: 'HITL',
      message: 'HITL approval required for budget reallocation',
    });

    const logs = store.getLogs('ws-alpha');
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('GATE');
    expect(logs[0].message).toContain('HITL approval required');
  });
});
