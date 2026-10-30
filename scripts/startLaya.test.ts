import { describe, expect, it } from 'vitest';
import { buildLayaRuntimeEnv } from './startLaya';

describe('Laya runtime launcher', () => {
  it('fails closed without a server credential', () => {
    expect(() => buildLayaRuntimeEnv({})).toThrow(/LAYA_API_KEY is required/);
  });

  it('binds locally and preloads without changing the credential', () => {
    const runtime = buildLayaRuntimeEnv({ LAYA_API_KEY: 'server-only-test-value' });
    expect(runtime).toMatchObject({
      LAYA_API_KEY: 'server-only-test-value',
      LAYA_HOST: '127.0.0.1',
      LAYA_PRELOAD: '1',
    });
  });
});
