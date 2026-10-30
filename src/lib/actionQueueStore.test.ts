import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ActionQueueStore,
  hydrateQueueItem,
  resolveActionQueueIcon,
  DEMO_INITIAL_QUEUE_ITEMS,
  ACTION_QUEUE_STORAGE_KEY,
  ActionQueueItem,
} from './actionQueueStore.js';

describe('actionQueueStore', () => {
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

  it('hydrates items with appropriate category icons', () => {
    const rawItem: ActionQueueItem = {
      id: 'test-1',
      moduleName: 'Performance Ads',
      moduleCategory: 'DEMAND',
      moduleRoute: '/paid-ads',
      title: 'Budget Alert',
      summary: 'Reallocate spend',
      status: 'PENDING_APPROVAL',
      risk: 'HIGH',
      enclaveName: 'Sigma Core',
      enclaveId: 'ws-default',
      timestamp: '1m ago',
    };

    const hydrated = hydrateQueueItem(rawItem);
    expect(hydrated.moduleIcon).toBeDefined();
  });

  it('resolves correct icons by category and module', () => {
    expect(resolveActionQueueIcon('DEMAND', 'SEO Authority')).toBeDefined();
    expect(resolveActionQueueIcon('DEMAND', 'Editorial Content')).toBeDefined();
    expect(resolveActionQueueIcon('DEMAND', 'Performance Ads')).toBeDefined();
    expect(resolveActionQueueIcon('CAPTURE', 'WhatsApp Lead Intake')).toBeDefined();
    expect(resolveActionQueueIcon('INTELLIGENCE', 'Growth Diagnostics')).toBeDefined();
    expect(resolveActionQueueIcon('CREATIVE')).toBeDefined();
    expect(resolveActionQueueIcon('INFRASTRUCTURE')).toBeDefined();
  });

  it('initializes to empty queue in clean-slate mode (no demo seed)', () => {
    const store = new ActionQueueStore();
    // Default in test environment is clean slate (isDemoSeedEnabled() === false)
    expect(store.getItems()).toEqual([]);
    expect(store.getPendingCount()).toBe(0);
    expect(store.getStats()).toEqual({
      pendingCount: 0,
      runningCount: 0,
      alertCount: 0,
      completedCount: 0,
    });
  });

  it('adds items, updates pending count, and notifies listeners', () => {
    const store = new ActionQueueStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const newItem: ActionQueueItem = {
      id: 'act-new-001',
      moduleName: 'Performance Ads & ROAS',
      moduleCategory: 'DEMAND',
      moduleRoute: '/paid-ads',
      title: 'Autonomous Budget Re-Allocation Proposal',
      summary: 'Re-distribute $4,500',
      status: 'PENDING_APPROVAL',
      risk: 'HIGH',
      enclaveName: 'Sigma Core',
      enclaveId: 'ws-default',
      timestamp: 'Just now',
    };

    store.addItem(newItem);

    expect(store.getItems().length).toBe(1);
    expect(store.getPendingCount()).toBe(1);
    expect(store.getStats().pendingCount).toBe(1);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it('approves an item, transitions status to COMPLETED, and decreases pendingCount', () => {
    const store = new ActionQueueStore();
    store.addItem({
      id: 'act-approve-test',
      moduleName: 'Test Module',
      moduleCategory: 'CAPTURE',
      moduleRoute: '/outreach',
      title: 'Outreach Campaign',
      summary: 'Send 50 invites',
      status: 'PENDING_APPROVAL',
      risk: 'MEDIUM',
      enclaveName: 'Sigma Core',
      enclaveId: 'ws-default',
      timestamp: '5m ago',
    });

    expect(store.getPendingCount()).toBe(1);

    store.approveItem('act-approve-test', 'Custom approval note');

    const updated = store.getItems().find(i => i.id === 'act-approve-test');
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.details).toBe('Custom approval note');
    expect(store.getPendingCount()).toBe(0);
    expect(store.getStats().completedCount).toBe(1);
  });

  it('dismisses an item and removes it from the queue', () => {
    const store = new ActionQueueStore();
    store.addItem({
      id: 'act-dismiss-test',
      moduleName: 'Test Module',
      moduleCategory: 'CREATIVE',
      moduleRoute: '/video',
      title: 'Video Render',
      summary: 'Render completed',
      status: 'ALERT',
      risk: 'LOW',
      enclaveName: 'Sigma Core',
      enclaveId: 'ws-default',
      timestamp: '10m ago',
    });

    expect(store.getItems().length).toBe(1);
    store.dismissItem('act-dismiss-test');
    expect(store.getItems().length).toBe(0);
  });

  it('serializes and deserializes cleanly to localStorage without icon serialization errors', () => {
    const store = new ActionQueueStore();
    store.addItem({
      id: 'act-storage-test',
      moduleName: 'Performance Ads',
      moduleCategory: 'DEMAND',
      moduleRoute: '/paid-ads',
      title: 'Ad Optimization',
      summary: 'Test summary',
      status: 'PENDING_APPROVAL',
      risk: 'HIGH',
      enclaveName: 'Sigma Core',
      enclaveId: 'ws-default',
      timestamp: 'Just now',
    });

    const storedRaw = mockStorage[ACTION_QUEUE_STORAGE_KEY];
    expect(storedRaw).toBeDefined();

    // Verify stored JSON does not have raw React component objects that fail parsing
    const parsed = JSON.parse(storedRaw);
    expect(parsed[0].id).toBe('act-storage-test');
    expect(parsed[0].moduleIcon).toBeUndefined(); // stripped for serialization

    // Instantiate a second store reading from the same storage
    const store2 = new ActionQueueStore();
    const items2 = store2.getItems();
    expect(items2.length).toBe(1);
    expect(items2[0].id).toBe('act-storage-test');
    expect(items2[0].moduleIcon).toBeDefined(); // re-hydrated on load
  });
});

