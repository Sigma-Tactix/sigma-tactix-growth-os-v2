import { spawn } from 'node:child_process';
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
  const command = options.command || resolveGoogleAdsMcpBinary();
  const args = options.args || [];
  const defaultToolsConfig = path.resolve(process.cwd(), 'integrations/google-ads-mcp/tools_config.yaml');
  const env = options.env === undefined
    ? {
        ...process.env,
        ...(fs.existsSync(defaultToolsConfig) && !process.env.GOOGLE_ADS_MCP_TOOLS_CONFIG
          ? { GOOGLE_ADS_MCP_TOOLS_CONFIG: defaultToolsConfig }
          : {}),
      }
    : options.env;
  const timeoutMs = options.timeoutMs ?? 15_000;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdoutBuffer = '';
    let stderr = '';
    let initializeResult: any;
    let tools: McpProbeResult['tools'] = [];
    let settled = false;

    const finish = (error?: Error, result?: McpProbeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill('SIGTERM');
      if (error) reject(error);
      else resolve(result!);
    };

    const send = (message: Record<string, unknown>) => {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    };

    const handleMessage = (message: any) => {
      if (message.id === 1 && message.result) {
        initializeResult = message.result;
        send({ jsonrpc: '2.0', method: 'notifications/initialized' });
        send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
        return;
      }
      if (message.id === 2) {
        if (message.error) return finish(new Error(message.error.message || 'Google Ads MCP tools/list failed.'));
        tools = Array.isArray(message.result?.tools) ? message.result.tools : [];
        if (!callCustomers) {
          finish(undefined, { serverVersion: initializeResult?.serverInfo?.version, tools });
          return;
        }
        send({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'customers_list_accessible_customers', arguments: {} },
        });
        return;
      }
      if (message.id === 3) {
        if (message.error) return finish(new Error(message.error.message || 'Google Ads MCP customer discovery failed.'));
        if (message.result?.isError) {
          const text = message.result?.content?.map((item: any) => item.text).filter(Boolean).join(' ');
          return finish(new Error(text || 'Google Ads MCP customer discovery failed.'));
        }
        finish(undefined, {
          serverVersion: initializeResult?.serverInfo?.version,
          tools,
          toolResult: message.result?.structuredContent?.result,
        });
      }
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try { handleMessage(JSON.parse(line)); } catch { /* Ignore non-JSON process output. */ }
      }
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-4_000); });
    child.once('error', error => finish(error));
    child.once('exit', code => {
      if (!settled) finish(new Error(`Google Ads MCP exited before completing the handshake (code ${code}). ${stderr}`.trim()));
    });

    const timer = setTimeout(() => finish(new Error(`Google Ads MCP handshake timed out after ${timeoutMs}ms. ${stderr}`.trim())), timeoutMs);
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'sigmatactix-growth-os', version: '0.2.0' },
      },
    });
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
    const missingBinary = error?.code === 'ENOENT';
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
