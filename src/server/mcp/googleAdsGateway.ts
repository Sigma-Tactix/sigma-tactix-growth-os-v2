import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveGoogleAdsMcpBinary } from '../googleAdsMcpService.js';
import { withMcpConnection } from './mcpClient.js';
import { verifyGoogleAdsIdentity } from './googleIdentity.js';

const identifier = z.string().regex(/^[a-z][a-z0-9_]*$/).max(100);
export const googleAdsReadRequest = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('discover') }).strict(),
  z.object({ operation: z.literal('metadata'), resource: identifier }).strict(),
  z.object({
    operation: z.literal('report'),
    customerId: z.string().regex(/^\d{10}$/),
    resource: identifier,
    fields: z.array(z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_.]*$/).max(150)).min(1).max(30),
    conditions: z.array(z.string().min(1).max(500)).max(10).default([]),
    limit: z.number().int().min(1).max(100).default(50),
  }).strict(),
]);

export const GOOGLE_ADS_READ_TOOLS = [
  'customers_list_accessible_customers', 'metadata_get_resource_metadata', 'search_search',
] as const;

export const MCP_PILOT_OWNER_EMAIL = 'sigmatactix@gmail.com';
export function isMcpPilotOwner(email?: string) {
  return email?.trim().toLowerCase() === MCP_PILOT_OWNER_EMAIL;
}

export function googleAdsWorkspaceBinding(workspaceId: string, env = process.env) {
  return Boolean(workspaceId && env.MCP_GOOGLE_ADS_WORKSPACE_ID === workspaceId);
}

export async function readGoogleAdsViaMcp(input: {
  workspaceId: string; actorId: string; actorEmail?: string; sb: SupabaseClient; request: unknown;
}, deps = { env: process.env, connect: withMcpConnection, verifyIdentity: verifyGoogleAdsIdentity }) {
  if (!isMcpPilotOwner(input.actorEmail)) throw new Error('This MCP pilot is restricted to sigmatactix@gmail.com.');
  if (!googleAdsWorkspaceBinding(input.workspaceId, deps.env)) {
    throw new Error('Google Ads MCP is not bound to this workspace.');
  }
  const request = googleAdsReadRequest.parse(input.request);
  const customers = (deps.env.MCP_GOOGLE_ADS_CUSTOMER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (request.operation === 'report' && !customers.includes(request.customerId)) {
    throw new Error('This customer ID is not allowed for the bound workspace.');
  }
  const tool = request.operation === 'discover' ? GOOGLE_ADS_READ_TOOLS[0]
    : request.operation === 'metadata' ? GOOGLE_ADS_READ_TOOLS[1] : GOOGLE_ADS_READ_TOOLS[2];
  const args: Record<string, unknown> = request.operation === 'discover' ? {}
    : request.operation === 'metadata' ? { resource_name: request.resource }
      : { customer_id: request.customerId, resource: request.resource, fields: request.fields,
          conditions: request.conditions, limit: request.limit };
  const receiptId = randomUUID();
  const startedAt = new Date().toISOString();
  // Persist intent before contacting a provider. Missing migration/RLS blocks execution.
  const { error: insertError } = await input.sb.from('mcp_tool_calls').insert({
    id: receiptId, workspace_id: input.workspaceId, actor_id: input.actorId,
    server_id: 'google-ads', tool_name: tool, status: 'started', started_at: startedAt,
  });
  if (insertError) throw new Error('MCP receipt storage is unavailable; no provider call was made.');

  let result: unknown;
  let status: 'succeeded' | 'failed' = 'failed';
  try {
    const providerEmail = await deps.verifyIdentity(deps.env);
    if (!isMcpPilotOwner(providerEmail)) throw new Error('Google provider identity does not match the pilot owner.');
    const envKeys = ['PATH', 'HOME', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_PROJECT_ID', 'GOOGLE_CLOUD_PROJECT',
      'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'];
    const env = Object.fromEntries(envKeys.filter(k => deps.env[k]).map(k => [k, deps.env[k]!]));
    env.GOOGLE_ADS_MCP_TOOLS_CONFIG = path.resolve('integrations/google-ads-mcp/tools_config.yaml');
    result = await deps.connect({ command: resolveGoogleAdsMcpBinary(), args: [], env }, async connection => {
      const tools = await connection.listTools({ timeout: 15_000 });
      // An annotation alone is not authorization: the explicit tool list is authoritative.
      if (!tools.some(t => t.name === tool && t.annotations?.readOnlyHint === true)) {
        throw new Error('Required read-only MCP tool is unavailable.');
      }
      const response = await connection.callTool(tool, args, { timeout: 30_000 });
      if (response.isError) throw new Error('Provider returned a tool error.');
      const text = JSON.stringify(response);
      return text.length > 120_000
        ? { truncated: true, text: text.slice(0, 120_000) }
        : { ...JSON.parse(text), verifiedProviderEmail: providerEmail };
    });
    status = 'succeeded';
  } catch {
    result = { error: 'Google Ads MCP call failed. Check credentials, runtime and tool input. No automatic retry was made.' };
  }
  const finishedAt = new Date().toISOString();
  const { data, error } = await input.sb.from('mcp_tool_calls').update({
    status, finished_at: finishedAt, result,
  }).eq('id', receiptId).eq('workspace_id', input.workspaceId).select('id').single();
  if (error || !data) throw new Error(`MCP receipt ${receiptId} could not be finalized. Execution outcome is uncertain; do not retry automatically.`);
  return { receiptId, status, startedAt, finishedAt, result };
}

export async function listMcpReceipts(sb: SupabaseClient, workspaceId: string, limit = 10) {
  const { data, error } = await sb.from('mcp_tool_calls')
    .select('id,server_id,tool_name,status,started_at,finished_at,result')
    .eq('workspace_id', workspaceId).order('started_at', { ascending: false }).limit(limit);
  if (error) throw new Error('MCP receipt storage is unavailable.');
  return data || [];
}
