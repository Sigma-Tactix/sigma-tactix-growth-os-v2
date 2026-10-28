import { describe, expect, it, vi } from 'vitest';
import { readGoogleAdsViaMcp } from './googleAdsGateway.js';

function harness(options: { insertFails?: boolean; finishFails?: boolean; providerFails?: boolean; readOnly?: boolean } = {}) {
  const rows: any[] = [];
  const sb: any = { from: () => ({
    insert: async (row: any) => { rows.push(row); return { error: options.insertFails ? {} : null }; },
    update: (patch: any) => ({ eq: () => ({ eq: () => ({ select: () => ({ single: async () => {
      Object.assign(rows[0], patch);
      return { data: options.finishFails ? null : { id: rows[0].id }, error: options.finishFails ? {} : null };
    } }) }) }) }),
  }) };
  const callTool = vi.fn(async () => {
    expect(rows[0].status).toBe('started');
    return { isError: options.providerFails, content: [{ type: 'text', text: 'provider result' }] };
  });
  const connect: any = vi.fn(async (_config, execute) => execute({
    listTools: async () => [{ name: 'search_search', annotations: { readOnlyHint: options.readOnly !== false } }], callTool,
  }));
  const env = { MCP_GOOGLE_ADS_WORKSPACE_ID: 'workspace-a', MCP_GOOGLE_ADS_CUSTOMER_IDS: '1234567890' };
  const input = { workspaceId: 'workspace-a', actorId: 'user-a', actorEmail: 'sigmatactix@gmail.com', sb, request: {
    operation: 'report', customerId: '1234567890', resource: 'campaign', fields: ['campaign.id'],
  } };
  const verifyIdentity = vi.fn(async () => 'sigmatactix@gmail.com');
  return { input, deps: { env, connect, verifyIdentity }, rows, callTool, connect };
}

describe('workspace-bound MCP gateway', () => {
  it('blocks Ads access when the Google credential identity differs from the signed-in owner', async () => {
    const h = harness(); h.deps.verifyIdentity.mockResolvedValue('other@example.com');
    expect((await readGoogleAdsViaMcp(h.input, h.deps)).status).toBe('failed');
    expect(h.connect).not.toHaveBeenCalled();
  });
  it('rejects a different authenticated email even in the bound workspace', async () => {
    const h = harness();
    await expect(readGoogleAdsViaMcp({ ...h.input, actorEmail: 'other@example.com' }, h.deps)).rejects.toThrow('restricted');
    expect(h.connect).not.toHaveBeenCalled();
  });
  it('rejects a different workspace before storage or network access', async () => {
    const h = harness();
    await expect(readGoogleAdsViaMcp({ ...h.input, workspaceId: 'workspace-b' }, h.deps)).rejects.toThrow('not bound');
    expect(h.rows).toHaveLength(0); expect(h.connect).not.toHaveBeenCalled();
  });
  it('rejects a different customer even when the provider could access it', async () => {
    const h = harness(); h.input.request.customerId = '9999999999';
    await expect(readGoogleAdsViaMcp(h.input, h.deps)).rejects.toThrow('not allowed');
    expect(h.connect).not.toHaveBeenCalled();
  });
  it('fails closed before a provider call when receipt storage is missing', async () => {
    const h = harness({ insertFails: true });
    await expect(readGoogleAdsViaMcp(h.input, h.deps)).rejects.toThrow('no provider call');
    expect(h.connect).not.toHaveBeenCalled();
  });
  it('records intent before invoking a bounded reporting tool and finalizes the same receipt', async () => {
    const h = harness();
    const result = await readGoogleAdsViaMcp(h.input, h.deps);
    expect(result.status).toBe('succeeded'); expect(result.receiptId).toBe(h.rows[0].id);
    expect(h.callTool).toHaveBeenCalledWith('search_search', expect.objectContaining({ customer_id: '1234567890', limit: 50 }), { timeout: 30000 });
    expect(h.rows[0].finished_at).toBeTruthy();
  });
  it('does not invoke a tool that lacks a read-only annotation', async () => {
    const h = harness({ readOnly: false });
    expect((await readGoogleAdsViaMcp(h.input, h.deps)).status).toBe('failed');
    expect(h.callTool).not.toHaveBeenCalled();
  });
  it('records tool errors as failed rather than provider-verified', async () => {
    const h = harness({ providerFails: true });
    expect((await readGoogleAdsViaMcp(h.input, h.deps)).status).toBe('failed');
    expect(h.rows[0].status).toBe('failed');
  });
  it('reports uncertain execution when the outcome cannot be persisted', async () => {
    const h = harness({ finishFails: true });
    await expect(readGoogleAdsViaMcp(h.input, h.deps)).rejects.toThrow('outcome is uncertain');
    expect(h.callTool).toHaveBeenCalledTimes(1);
  });
  it('rejects mutations and unexpected customer/workspace override arguments', async () => {
    const h = harness();
    await expect(readGoogleAdsViaMcp({ ...h.input, request: { ...h.input.request, tool: 'mutate_campaigns' } }, h.deps)).rejects.toThrow();
    expect(h.connect).not.toHaveBeenCalled();
  });
});
