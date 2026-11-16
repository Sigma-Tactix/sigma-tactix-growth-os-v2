import { describe, expect, it, vi } from 'vitest';
import { checkLayaStatus } from './layaStatus.js';
import * as decisionEngine from '../src/lib/decisionEngine.js';

describe('Laya status checker', () => {
  it('returns code 0 when runtime is reachable', async () => {
    vi.spyOn(decisionEngine, 'getDecisionRuntimeStatus').mockResolvedValueOnce({
      provider: 'laya',
      configured: true,
      reachable: true,
      state: 'shadow',
      mode: 'shadow',
      model: 'auto',
      calibrated: false,
      executionEligible: false,
      checkedAt: new Date().toISOString(),
      detail: 'Reachable',
    });

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await checkLayaStatus();
    expect(result.code).toBe(0);
    expect(result.status.reachable).toBe(true);
    stdoutSpy.mockRestore();
  });

  it('returns code 1 when runtime is unreachable', async () => {
    vi.spyOn(decisionEngine, 'getDecisionRuntimeStatus').mockResolvedValueOnce({
      provider: 'laya',
      configured: true,
      reachable: false,
      state: 'degraded',
      mode: 'shadow',
      model: 'auto',
      calibrated: false,
      executionEligible: false,
      checkedAt: new Date().toISOString(),
      detail: 'Unreachable',
    });

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const result = await checkLayaStatus();
    expect(result.code).toBe(1);
    expect(result.status.reachable).toBe(false);
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});
