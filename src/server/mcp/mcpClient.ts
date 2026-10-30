// Keep SDK telemetry off before its lazy import initializes the singleton.
process.env.MCP_USE_ANONYMIZED_TELEMETRY = 'false';

export interface McpConnection {
  serverInfo?: { version?: string };
  listTools: (options?: any) => Promise<Array<{ name: string; annotations?: { readOnlyHint?: boolean } }>>;
  callTool: (name: string, args: Record<string, unknown>, options?: any) => Promise<any>;
}

export async function withMcpConnection<T>(
  config: { command: string; args: string[]; env: Record<string, string> },
  execute: (connection: McpConnection) => Promise<T>,
): Promise<T> {
  const { MCPClient } = await import('@mcp-use/client');
  const client = new MCPClient({ mcpServers: { googleAds: {
    ...config, stderr: 'ignore', defaultRequestOptions: { timeout: 15_000 },
  } } });
  try {
    const connection = await client.connect('googleAds');
    return await execute(connection);
  } finally {
    await client.close();
  }
}
