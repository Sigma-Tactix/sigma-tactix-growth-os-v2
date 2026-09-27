import { describe, expect, it } from 'vitest';
import { getGoogleAdsMcpStatus, listGoogleAdsMcpCustomers } from './googleAdsMcpService.js';

const fakeMcpScript = `
const readline = require('node:readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const message = JSON.parse(line);
  if (message.method === 'initialize') {
    console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2025-06-18', serverInfo: { name: 'Google Ads Server', version: 'test' }, capabilities: { tools: {} } } }));
  }
  if (message.method === 'tools/list') {
    console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [
      { name: 'customers_list_accessible_customers', annotations: { readOnlyHint: true } },
      { name: 'metadata_get_resource_metadata', annotations: { readOnlyHint: true } },
      { name: 'search_search', annotations: { readOnlyHint: true } }
    ] } }));
  }
  if (message.method === 'tools/call') {
    console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: '["customers/1234567890"]' }], structuredContent: { result: ['customers/1234567890'] } } }));
  }
});`;

describe('Google Ads MCP runtime', () => {
  it('discovers the required read-only MCP tools without promoting missing credentials', async () => {
    const status = await getGoogleAdsMcpStatus({
      command: process.execPath,
      args: ['-e', fakeMcpScript],
      env: {},
    });

    expect(status).toMatchObject({
      installed: true,
      reachable: true,
      configured: false,
      verified: false,
      serverVersion: 'test',
    });
    expect(status.tools).toEqual([
      'customers_list_accessible_customers',
      'metadata_get_resource_metadata',
      'search_search',
    ]);
    expect(status.readOnly).toBe(true);
    expect(status.missingConfiguration).toContain('GOOGLE_ADS_DEVELOPER_TOKEN');
  });

  it('uses the MCP customer-discovery tool through the same runtime seam', async () => {
    const result = await listGoogleAdsMcpCustomers({
      command: process.execPath,
      args: ['-e', fakeMcpScript],
      env: {
        GOOGLE_ADS_DEVELOPER_TOKEN: 'test-token',
        GOOGLE_APPLICATION_CREDENTIALS: '/tmp/test-google-credentials.json',
        GOOGLE_PROJECT_ID: 'test-project',
      },
    });

    expect(result.customers).toEqual(['1234567890']);
    expect(result.verified).toBe(true);
  });
});
