import { withMcpConnection } from './mcp/mcpClient.js';
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_TOOLS = [
  'customers_list_accessible_customers',
  'metadata_get_resource_metadata',
  'search_search',
] as const;

const KNOWN_BINARY_PATHS = [
  '/Users/mac/.local/bin/google-ads-mcp',
  '/opt/homebrew/bin/google-ads-mcp',
  '/usr/local/bin/google-ads-mcp',
];

export interface GoogleAdsMcpRuntimeOptions {
  command?: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

export interface GoogleAdsMcpStatus {
  checkedAt: string;
  installed: boolean;
  reachable: boolean;
  configured: boolean;
  verified: boolean;
  readOnly: boolean;
  command: string;
  serverVersion?: string;
  tools: string[];
  missingConfiguration: string[];
  detail: string;
}

interface McpProbeResult {
  serverVersion?: string;
  tools: Array<{ name: string; annotations?: { readOnlyHint?: boolean } }>;
  toolResult?: unknown;
}

export function resolveGoogleAdsMcpBinary(): string {
  return KNOWN_BINARY_PATHS.find(candidate => fs.existsSync(candidate)) || 'google-ads-mcp';
}

function getMissingConfiguration(env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = [];
  if (!env.GOOGLE_ADS_DEVELOPER_TOKEN) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!env.GOOGLE_PROJECT_ID && !env.GOOGLE_CLOUD_PROJECT) missing.push('GOOGLE_PROJECT_ID');
  const hasApplicationCredentials = Boolean(env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasOauthProxy = Boolean(env.GOOGLE_ADS_MCP_OAUTH_CLIENT_ID && env.GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET);
  if (!hasApplicationCredentials && !hasOauthProxy) {
    missing.push('GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_ADS_MCP_OAUTH_CLIENT_ID + GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET');
  }
  return missing;
}

function normalizeCustomers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => String(item).replace(/^customers\//, '').replace(/-/g, ''))
    .filter(item => /^\d{10}$/.test(item));
}

async function probeMcp(options: GoogleAdsMcpRuntimeOptions, callCustomers = false): Promise<McpProbeResult> {
  const source = options.env === undefined ? process.env : options.env;
  const allowedKeys = ['PATH', 'HOME', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_PROJECT_ID', 'GOOGLE_CLOUD_PROJECT',
    'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_ADS_MCP_OAUTH_CLIENT_ID', 'GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET'];
  const env = Object.fromEntries(allowedKeys.filter(key => source[key]).map(key => [key, source[key]!]));
  env.GOOGLE_ADS_MCP_TOOLS_CONFIG = path.resolve('integrations/google-ads-mcp/tools_config.yaml');
  return withMcpConnection({ command: options.command || resolveGoogleAdsMcpBinary(), args: options.args || [], env }, async connection => {
    const tools = await connection.listTools({ timeout: options.timeoutMs ?? 15_000 });
    if (!callCustomers) return { tools, serverVersion: connection.serverInfo?.version };
    const tool = tools.find(tool => tool.name === 'customers_list_accessible_customers');
    if (!tool || tool.annotations?.readOnlyHint !== true) throw new Error('Required read-only customer discovery tool is unavailable.');
    const result = await connection.callTool(tool.name, {}, { timeout: options.timeoutMs ?? 15_000 });
    if (result.isError) throw new Error('Google Ads MCP customer discovery failed.');
    return { tools, serverVersion: connection.serverInfo?.version, toolResult: result.structuredContent?.result };
  });
}

export async function getGoogleAdsMcpStatus(options: GoogleAdsMcpRuntimeOptions = {}): Promise<GoogleAdsMcpStatus> {
  const command = options.command || resolveGoogleAdsMcpBinary();
  const env = options.env === undefined ? process.env : options.env;
  const missingConfiguration = getMissingConfiguration(env);
  try {
    const probe = await probeMcp(options);
    const toolNames = probe.tools.map(tool => tool.name);
    const hasRequiredTools = REQUIRED_TOOLS.every(tool => toolNames.includes(tool));
    const readOnly = probe.tools.length > 0 && probe.tools.every(tool => tool.annotations?.readOnlyHint === true);
    return {
      checkedAt: new Date().toISOString(),
      installed: true,
      reachable: hasRequiredTools,
      configured: missingConfiguration.length === 0,
      verified: false,
      readOnly,
      command,
      serverVersion: probe.serverVersion,
      tools: toolNames,
      missingConfiguration,
      detail: hasRequiredTools
        ? `Runtime handshake succeeded with ${toolNames.length} read-only tools.${missingConfiguration.length ? ' Provider credentials are incomplete.' : ' Provider credentials are configured; discover customers to verify account access.'}`
        : 'Runtime responded but did not expose the required Google Ads tools.',
    };
  } catch (error: any) {
    const missingBinary = error?.code === 'ENOENT' || error?.cause?.code === 'ENOENT' || /ENOENT/.test(error?.message || '');
    return {
      checkedAt: new Date().toISOString(),
      installed: !missingBinary,
      reachable: false,
      configured: missingConfiguration.length === 0,
      verified: false,
      readOnly: true,
      command,
      tools: [],
      missingConfiguration,
      detail: error?.message || 'Google Ads MCP runtime handshake failed.',
    };
  }
}

export async function listGoogleAdsMcpCustomers(options: GoogleAdsMcpRuntimeOptions = {}): Promise<{
  customers: string[];
  verified: boolean;
  checkedAt: string;
}> {
  const env = options.env === undefined ? process.env : options.env;
  const missing = getMissingConfiguration(env);
  if (missing.length) throw new Error(`Google Ads MCP configuration is incomplete: ${missing.join(', ')}.`);
  const probe = await probeMcp(options, true);
  const customers = normalizeCustomers(probe.toolResult);
  if (!customers.length) throw new Error('Google Ads MCP authenticated, but no directly accessible customer IDs were returned.');
  return { customers, verified: true, checkedAt: new Date().toISOString() };
}
