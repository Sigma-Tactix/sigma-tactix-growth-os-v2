import { describe, expect, it, vi } from 'vitest';
import { unsupportedConnectorAdapter, verifyPipelineConnection } from './pipelineVerification';
import type { Connector } from '../types';

const connector: Connector = { id: 'c1', platform: 'Meta Ads', status: 'Connected', connectedBy: 'tester' };
const credentials = () => ({ accountId: 'act_123', accessToken: 'test-only-token' });

describe('pipeline verification', () => {
  it('requires a real successful adapter result for the exact account', async () => {
    const adapter = vi.fn().mockResolvedValue(true);
    const result = await verifyPipelineConnection('Meta Ads Manager', 'act_123', [connector], credentials, () => adapter);
    expect(result.verified).toBe(true);
    expect(result.connectorId).toBe('c1');
    expect(adapter).toHaveBeenCalledWith(credentials());
    expect(JSON.stringify(result)).not.toContain('test-only-token');
  });
  it('rejects a different account without calling the provider', async () => {
    const adapter = vi.fn();
    await expect(verifyPipelineConnection('Meta Ads', 'act_other', [connector], credentials, () => adapter)).rejects.toThrow('exact provider account');
    expect(adapter).not.toHaveBeenCalled();
  });
  it('does not convert provider rejection or network errors into success', async () => {
    await expect(verifyPipelineConnection('Meta Ads', 'act_123', [connector], credentials, () => async () => false)).rejects.toThrow('could not verify');
    await expect(verifyPipelineConnection('Meta Ads', 'act_123', [connector], credentials, () => async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  });
  it('rejects unsupported, disconnected and ambiguous connections', async () => {
    const adapter = vi.fn();
    await expect(verifyPipelineConnection('PostgreSQL MCP Server', 'act_123', [connector], credentials, () => adapter)).rejects.toThrow('not implemented');
    for (const records of [[{ ...connector, status: 'Disconnected' as const }], [connector, { ...connector, id: 'c2' }]]) {
      await expect(verifyPipelineConnection('Meta Ads', 'act_123', records, credentials, () => adapter)).rejects.toThrow('exact provider account');
    }
    expect(adapter).not.toHaveBeenCalled();
    expect(await unsupportedConnectorAdapter()).toBe(false);
  });
});
