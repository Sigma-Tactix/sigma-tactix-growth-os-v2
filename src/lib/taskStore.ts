import { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentTask } from '../types.js';
import { HITLTask, CockpitLogItem } from '../data/agentCockpitData.js';
import { apiFetch } from './api.js';

export interface TaskStateTransition {
  taskId: string;
  previousStatus: string;
  newStatus: string;
  actor: string;
  timestamp: string;
  notes?: string;
}

export function mapAgentTaskToHITL(task: AgentTask): HITLTask {
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  if (task.priority === 'critical') riskLevel = 'CRITICAL';
  else if (task.priority === 'high') riskLevel = 'HIGH';
  else if (task.priority === 'low') riskLevel = 'LOW';

  let actionType: 'BUDGET_REALLOCATION' | 'CONTENT_PUBLICATION' | 'SCHEMA_OVERRIDE' | 'CRM_SYNC' = 'CONTENT_PUBLICATION';
  const goalLower = (task.goal || '').toLowerCase();
  if (goalLower.includes('budget') || goalLower.includes('spend') || goalLower.includes('cac')) {
    actionType = 'BUDGET_REALLOCATION';
  } else if (goalLower.includes('schema') || goalLower.includes('technical') || goalLower.includes('index')) {
    actionType = 'SCHEMA_OVERRIDE';
  } else if (goalLower.includes('crm') || goalLower.includes('lead') || goalLower.includes('hubspot')) {
    actionType = 'CRM_SYNC';
  }

  let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  if (task.status === 'Success') status = 'APPROVED';
  else if (task.status === 'Rejected') status = 'REJECTED';
  else status = 'PENDING';

  return {
    id: task.id,
    agentId: task.agentName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    agentName: task.agentName,
    title: task.goal.length > 60 ? task.goal.substring(0, 60) + '...' : task.goal,
    actionType,
    riskLevel,
    proposedAction: task.goal,
    rationale: `Governed action requested by ${task.requestedBy || 'workspace operator'}. Allowed scope: ${(task.allowedScope || []).join(', ') || 'Standard'}`,
    impactEstimate: 'Expected conversion and authority gains',
    requestedAt: task.timestamp || new Date().toISOString(),
    status,
    vaultAffected: (task.allowedScope && task.allowedScope[0]) || 'Audit Vault',
    payload: {
      goal: task.goal,
      requestedVaults: task.requestedVaults,
      output: task.output,
      steps: task.steps,
    },
  };
}

export class TaskStoreManager {
  private fetchFn: typeof apiFetch;
  private tasksByWorkspace = new Map<string, HITLTask[]>();
  private logsByWorkspace = new Map<string, CockpitLogItem[]>();
  private inFlightQueueLocks = new Set<string>();

  constructor(options?: { fetchFn?: typeof apiFetch }) {
    this.fetchFn = options?.fetchFn || apiFetch;
  }

  getTasks(workspaceId: string): HITLTask[] {
    return this.tasksByWorkspace.get(workspaceId) || [];
  }

  setTasks(workspaceId: string, tasks: HITLTask[]) {
    this.tasksByWorkspace.set(workspaceId, tasks);
    this.persistLocal(workspaceId);
    this.emitChange(workspaceId);
  }

  getLogs(workspaceId: string): CockpitLogItem[] {
    return this.logsByWorkspace.get(workspaceId) || [];
  }

  recordLog(workspaceId: string, item: Omit<CockpitLogItem, 'id' | 'timestamp'>) {
    const existing = this.getLogs(workspaceId);
    const newLog: CockpitLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...item,
    };
    this.logsByWorkspace.set(workspaceId, [newLog, ...existing]);
    this.emitChange(workspaceId);
  }

  async fetchTasks(workspaceId: string): Promise<HITLTask[]> {
    try {
      const res = await this.fetchFn('/api/workspace');
      if (!res.ok) return this.getTasks(workspaceId);
      const data = await res.json();
      if (Array.isArray(data.agentTasks)) {
        const hitlTasks = data.agentTasks.map(mapAgentTaskToHITL);
        this.setTasks(workspaceId, hitlTasks);
        return hitlTasks;
      }
    } catch {
      // Fallback to local storage if network or offline
      this.loadLocal(workspaceId);
    }
    return this.getTasks(workspaceId);
  }

  async queueTask(
    workspaceId: string,
    params: {
      agentName: string;
      goal: string;
      moduleKey?: string;
      requestedVaults?: string[];
    }
  ): Promise<{ success: boolean; task?: HITLTask; deduplicated?: boolean; error?: string }> {
    const lockKey = `${workspaceId}:${params.agentName}:${params.goal}`;
    if (this.inFlightQueueLocks.has(lockKey)) {
      return { success: true, deduplicated: true };
    }

    this.inFlightQueueLocks.add(lockKey);
    try {
      const res = await this.fetchFn('/api/workspace/run-agent', {
        method: 'POST',
        body: JSON.stringify({
          agentName: params.agentName,
          goal: params.goal,
          moduleKey: params.moduleKey || 'growth',
          requestedVaults: params.requestedVaults,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: payload.error || 'Failed to queue agent task' };
      }

      const newTask = mapAgentTaskToHITL(payload.task);
      const current = this.getTasks(workspaceId);
      const updated = [newTask, ...current.filter(t => t.id !== newTask.id)];
      this.setTasks(workspaceId, updated);

      this.recordLog(workspaceId, {
        agentId: newTask.agentId,
        agentCodename: newTask.agentName.split(' ')[0] || 'ORCHESTRATOR',
        level: 'GATE',
        category: 'HITL',
        message: `Queued task "${newTask.title}" for HITL review.`,
      });

      return { success: true, task: newTask };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network exception while queueing task' };
    } finally {
      this.inFlightQueueLocks.delete(lockKey);
    }
  }

  async approveTask(
    workspaceId: string,
    taskId: string
  ): Promise<{ success: boolean; task?: HITLTask; error?: string }> {
    const current = this.getTasks(workspaceId);
    const existing = current.find(t => t.id === taskId);

    try {
      const res = await this.fetchFn(`/api/workspace/run-agent/${taskId}/approve`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Approval failed on server.' };
      }

      const updated = current.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'APPROVED' as const,
            payload: { ...t.payload, output: data.task?.output || t.payload?.output },
          };
        }
        return t;
      });

      this.setTasks(workspaceId, updated);
      this.recordLog(workspaceId, {
        agentId: existing?.agentId || 'system',
        agentCodename: existing?.agentName.split(' ')[0] || 'ADMIN',
        level: 'INFO',
        category: 'HITL',
        message: `Admin signed off on HITL task "${existing?.title || taskId}". Server approved and executed.`,
      });

      return { success: true, task: updated.find(t => t.id === taskId) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to communicate with server approval endpoint' };
    }
  }

  async rejectTask(
    workspaceId: string,
    taskId: string
  ): Promise<{ success: boolean; task?: HITLTask; error?: string }> {
    const current = this.getTasks(workspaceId);
    const existing = current.find(t => t.id === taskId);

    try {
      const res = await this.fetchFn(`/api/workspace/run-agent/${taskId}/reject`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Rejection failed on server.' };
      }

      const updated = current.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'REJECTED' as const };
        }
        return t;
      });

      this.setTasks(workspaceId, updated);
      this.recordLog(workspaceId, {
        agentId: existing?.agentId || 'system',
        agentCodename: existing?.agentName.split(' ')[0] || 'ADMIN',
        level: 'WARN',
        category: 'HITL',
        message: `Admin rejected HITL task "${existing?.title || taskId}". Task marked rejected.`,
      });

      return { success: true, task: updated.find(t => t.id === taskId) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to communicate with server rejection endpoint' };
    }
  }

  private persistLocal(workspaceId: string) {
    if (typeof localStorage === 'undefined') return;
    try {
      const tasks = this.getTasks(workspaceId);
      localStorage.setItem(`sigmatactix_tasks_${workspaceId}`, JSON.stringify(tasks));
    } catch {
      // LocalStorage quota or access error
    }
  }

  private loadLocal(workspaceId: string) {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(`sigmatactix_tasks_${workspaceId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.tasksByWorkspace.set(workspaceId, parsed);
        }
      }
    } catch {
      // LocalStorage access error
    }
  }

  private emitChange(workspaceId: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sigmatactix-tasks-updated', { detail: { workspaceId } })
      );
    }
  }
}

// Global shared singleton manager
export const globalTaskStore = new TaskStoreManager();

/**
 * React hook to access and synchronize shared workspace tasks & execution logs
 */
export function useTaskStore(workspaceId: string = 'ws-primary') {
  const [tasks, setTasks] = useState<HITLTask[]>(() => globalTaskStore.getTasks(workspaceId));
  const [logs, setLogs] = useState<CockpitLogItem[]>(() => globalTaskStore.getLogs(workspaceId));
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshTasks = await globalTaskStore.fetchTasks(workspaceId);
      setTasks(freshTasks);
      setLogs(globalTaskStore.getLogs(workspaceId));
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();

    const handleUpdate = (e: any) => {
      if (!e.detail?.workspaceId || e.detail.workspaceId === workspaceId) {
        setTasks(globalTaskStore.getTasks(workspaceId));
        setLogs(globalTaskStore.getLogs(workspaceId));
      }
    };

    window.addEventListener('sigmatactix-tasks-updated', handleUpdate);
    return () => {
      window.removeEventListener('sigmatactix-tasks-updated', handleUpdate);
    };
  }, [workspaceId, refresh]);

  const approveTask = useCallback(
    async (taskId: string) => {
      return globalTaskStore.approveTask(workspaceId, taskId);
    },
    [workspaceId]
  );

  const rejectTask = useCallback(
    async (taskId: string) => {
      return globalTaskStore.rejectTask(workspaceId, taskId);
    },
    [workspaceId]
  );

  const queueTask = useCallback(
    async (params: {
      agentName: string;
      goal: string;
      moduleKey?: string;
      requestedVaults?: string[];
    }) => {
      return globalTaskStore.queueTask(workspaceId, params);
    },
    [workspaceId]
  );

  const pendingCount = useMemo(() => tasks.filter(t => t.status === 'PENDING').length, [tasks]);

  return {
    tasks,
    logs,
    isLoading,
    pendingCount,
    refresh,
    approveTask,
    rejectTask,
    queueTask,
  };
}
