import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ActionQueueStore,
  computeActionPayloadHash,
  ActionQueueItem,
  ACTION_QUEUE_STORAGE_KEY,
} from './actionQueueStore.js';

describe('S07 Action Queue Governance & Durable Approval States', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (globalThis as any).window = {
      localStorage: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
    };
  });

  const createSampleItem = (overrides?: Partial<ActionQueueItem>): ActionQueueItem => ({
    id: 'act-sample-01',
    moduleName: 'Social Distribution Hub',
    moduleCategory: 'DEMAND',
    moduleRoute: '/social',
    title: 'Schedule Q4 Campaign Social Post',
    summary: 'Publish enterprise narrative post across LinkedIn and X',
    details: 'Target audience: B2B CMOs and Heads of Growth',
    status: 'PENDING_APPROVAL',
    risk: 'MEDIUM',
    enclaveName: 'Sigma Sovereign Core',
    enclaveId: 'ws-default',
    timestamp: 'Just now',
    runPayload: {
      socialPost: {
        content: 'Enterprise sovereign AI operating model narrative.',
        channels: ['chan-li-01', 'chan-tw-01'],
      },
    },
    suggestedAction: 'Publish to LinkedIn & X',
    ...overrides,
  });

  describe('S07-A1: 401/403/500/timeout cannot create completion badge', () => {
    it('transitions to FAILED on HTTP 401 Unauthorized and does not create COMPLETED status', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-401' });
      store.addItem(item);

      // Simulate 401 Unauthorized dispatch failure
      store.failItem('act-401', 'HTTP 401 Unauthorized: Invalid or expired token');

      const updated = store.getItems().find(i => i.id === 'act-401');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.status).not.toBe('COMPLETED');
      expect(updated?.details).toContain('HTTP 401 Unauthorized');
      expect(updated?.lastError).toContain('HTTP 401 Unauthorized');

      const stats = store.getStats();
      expect(stats.failedCount).toBe(1);
      expect(stats.completedCount).toBe(0);
    });

    it('transitions to FAILED on HTTP 403 Forbidden and records access denial note', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-403' });
      store.addItem(item);

      // Simulate 403 Forbidden dispatch failure
      store.failItem('act-403', 'HTTP 403 Forbidden: Missing workspace execution grant');

      const updated = store.getItems().find(i => i.id === 'act-403');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.status).not.toBe('COMPLETED');
      expect(updated?.details).toContain('HTTP 403 Forbidden');
      expect(store.getStats().completedCount).toBe(0);
    });

    it('transitions to FAILED on HTTP 500 Server Error and records error details', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-500' });
      store.addItem(item);

      // Simulate 500 Server Error dispatch failure
      store.failItem('act-500', 'HTTP 500 Internal Server Error: Remote provider failure');

      const updated = store.getItems().find(i => i.id === 'act-500');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.status).not.toBe('COMPLETED');
      expect(updated?.details).toContain('HTTP 500 Internal Server Error');
      expect(store.getStats().completedCount).toBe(0);
    });

    it('transitions to FAILED on dispatch timeout and preserves failure note', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-timeout' });
      store.addItem(item);

      // Simulate request timeout
      store.failItem('act-timeout', 'Request timed out after 8000ms');

      const updated = store.getItems().find(i => i.id === 'act-timeout');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.status).not.toBe('COMPLETED');
      expect(updated?.details).toContain('Request timed out after 8000ms');
      expect(store.getStats().completedCount).toBe(0);
    });
  });

  describe('S07-A2: Approved payload version/hash bound to permission; revoked or edited action blocked', () => {
    it('computes deterministic payload hash from action fields', () => {
      const item1 = createSampleItem();
      const item2 = createSampleItem();

      const hash1 = computeActionPayloadHash(item1);
      const hash2 = computeActionPayloadHash(item2);

      expect(hash1).toBe(hash2);
      expect(hash1.startsWith('act-hash-')).toBe(true);
    });

    it('produces different hash when payload or content is modified', () => {
      const original = createSampleItem();
      const originalHash = computeActionPayloadHash(original);

      const modifiedPayload = createSampleItem({
        runPayload: {
          socialPost: {
            content: 'Tampered post content that alters original narrative',
            channels: ['chan-li-01'],
          },
        },
      });
      const modifiedHash = computeActionPayloadHash(modifiedPayload);
      expect(modifiedHash).not.toBe(originalHash);

      const modifiedRisk = createSampleItem({ risk: 'CRITICAL' });
      expect(computeActionPayloadHash(modifiedRisk)).not.toBe(originalHash);
    });

    it('successfully approves item when expected payload hash matches', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-match-01' });
      store.addItem(item);

      const hash = computeActionPayloadHash(item);
      const res = store.approveItem('act-match-01', 'Approved for execution', {
        expectedHash: hash,
        approver: 'operator-1',
      });

      expect(res.success).toBe(true);
      const updated = store.getItems().find(i => i.id === 'act-match-01');
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.approval?.approvedPayloadHash).toBe(hash);
      expect(updated?.approval?.status).toBe('APPROVED');
      expect(updated?.approval?.approver).toBe('operator-1');
    });

    it('blocks execution and fails item when payload was modified after review (hash mismatch)', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-tampered-01' });
      store.addItem(item);

      const originalHash = computeActionPayloadHash(item);

      // Simulate unauthorized tampering with payload after review
      store.setItems(prev =>
        prev.map(i =>
          i.id === 'act-tampered-01'
            ? {
                ...i,
                runPayload: {
                  ...i.runPayload,
                  socialPost: {
                    content: 'Altered payload: send $10,000 ad budget to unauthorized campaign',
                  },
                },
              }
            : i
        )
      );

      // Attempt to approve with the old original hash
      const res = store.approveItem('act-tampered-01', 'Approved', {
        expectedHash: originalHash,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Payload altered after review; consent invalidated.');

      const updated = store.getItems().find(i => i.id === 'act-tampered-01');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.status).not.toBe('COMPLETED');
      expect(updated?.details).toContain('Payload hash mismatch');
    });

    it('blocks execution when action approval was revoked', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-revoked-01' });
      store.addItem(item);

      // Revoke the approval
      store.revokeItem('act-revoked-01', 'Budget approval withdrawn by finance lead');

      const revokedItem = store.getItems().find(i => i.id === 'act-revoked-01');
      expect(revokedItem?.status).toBe('ALERT');
      expect(revokedItem?.approval?.status).toBe('REVOKED');
      expect(revokedItem?.approval?.revocationReason).toBe('Budget approval withdrawn by finance lead');

      // Subsequent approve attempt must be blocked
      const res = store.approveItem('act-revoked-01', 'Attempted re-approval');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Action approval was revoked');
    });
  });

  describe('S07-A3: Repeated approval does not duplicate side effects; reload sees same persisted state', () => {
    it('is idempotent on repeated approval calls with same payload hash', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-idempotent-01' });
      store.addItem(item);

      const hash = computeActionPayloadHash(item);
      const res1 = store.approveItem('act-idempotent-01', 'First approval dispatch', {
        expectedHash: hash,
      });
      expect(res1.success).toBe(true);

      const changeSpy = vi.fn();
      store.subscribe(changeSpy);

      // Repeated approval call
      const res2 = store.approveItem('act-idempotent-01', 'Duplicate approval dispatch', {
        expectedHash: hash,
      });
      expect(res2.success).toBe(true);

      // Verify no redundant change emissions or duplicate status alterations
      expect(changeSpy).not.toHaveBeenCalled();
      const current = store.getItems().find(i => i.id === 'act-idempotent-01');
      expect(current?.status).toBe('COMPLETED');
      expect(current?.details).toBe('First approval dispatch');
    });

    it('transitions to RUNNING when execution starts and records timestamp', () => {
      const store = new ActionQueueStore();
      const item = createSampleItem({ id: 'act-running-01' });
      store.addItem(item);

      store.startExecution('act-running-01');
      const updated = store.getItems().find(i => i.id === 'act-running-01');
      expect(updated?.status).toBe('RUNNING');
      expect(updated?.duration).toBe('In progress');
      expect(updated?.lastExecutedAt).toBeDefined();
    });

    it('persists accurate states across reload and maintains truthful terminal statuses', () => {
      const store1 = new ActionQueueStore();

      // Add one completed item with approval record
      const itemCompleted = createSampleItem({ id: 'act-persist-completed' });
      store1.addItem(itemCompleted);
      store1.approveItem('act-persist-completed', 'Dispatched to LinkedIn Queue (Job ID: job-42)');

      // Add one failed item with failure note
      const itemFailed = createSampleItem({ id: 'act-persist-failed' });
      store1.addItem(itemFailed);
      store1.failItem('act-persist-failed', 'HTTP 500 Internal Server Error: Gateway timeout');

      // Verify storage key was written
      expect(mockStorage[ACTION_QUEUE_STORAGE_KEY]).toBeDefined();

      // Instantiate a completely new store instance simulating a browser reload
      const store2 = new ActionQueueStore();
      const reloadedItems = store2.getItems();

      expect(reloadedItems.length).toBe(2);

      const reloadedCompleted = reloadedItems.find(i => i.id === 'act-persist-completed');
      expect(reloadedCompleted?.status).toBe('COMPLETED');
      expect(reloadedCompleted?.details).toBe('Dispatched to LinkedIn Queue (Job ID: job-42)');
      expect(reloadedCompleted?.approval?.status).toBe('APPROVED');
      expect(reloadedCompleted?.payloadHash).toBeDefined();

      const reloadedFailed = reloadedItems.find(i => i.id === 'act-persist-failed');
      expect(reloadedFailed?.status).toBe('FAILED');
      expect(reloadedFailed?.details).toContain('HTTP 500 Internal Server Error');
      expect(reloadedFailed?.lastError).toContain('HTTP 500 Internal Server Error');

      // Verify reload sees exact same stats
      const stats2 = store2.getStats();
      expect(stats2.completedCount).toBe(1);
      expect(stats2.failedCount).toBe(1);
      expect(stats2.pendingCount).toBe(0);
    });
  });
});
