import type { WorkspaceData } from '../types';
import type { DecisionRuntimeStatus } from './decisionEngine';

export type CapabilityState = 'declared' | 'enabled' | 'configured' | 'reachable' | 'verified' | 'failed';
export type CapabilityKind = 'mcp' | 'connector' | 'provider';

export interface GrowthCapabilityStatus {
  id: string;
  name: string;
  kind: CapabilityKind;
  moduleKey: string;
  state: CapabilityState;
  declared: true;
  enabled: boolean;
  configured: boolean;
  reachable: boolean;
  verified: boolean;
  automationEligible: boolean;
  checkedAt?: string;
  evidence: string[];
}

export interface CapabilityRegistry {
  generatedAt: string;
  capabilities: GrowthCapabilityStatus[];
  summary: Record<CapabilityState, number>;
}

export interface ExternalProviderCapability {
  provider: string;
  configured: boolean;
  verified: boolean;
  operations?: string[];
  detail: string;
}

function connectorCapability(connector: WorkspaceData['secondBrain']['connectors'][number]): GrowthCapabilityStatus {
  const verification = connector.verificationState;
  const verified = verification === 'verified' && connector.status === 'Connected';
  const failed = verification === 'failed' || verification === 'unsupported';
  const configured = verified || verification === 'configured' || failed || Boolean(connector.credentials?.encrypted);
  const state: CapabilityState = failed ? 'failed' : verified ? 'verified' : configured ? 'configured' : 'declared';
  const evidence = verified
    ? [`Provider handshake succeeded${connector.verifiedAt ? ` at ${connector.verifiedAt}` : ''}.`]
    : failed
      ? [connector.verificationError || 'Provider verification failed or is unsupported.']
      : configured
        ? ['Credentials or configuration exist, but no current provider verification is recorded.']
        : ['Connector is available in the catalogue; no credentials or provider verification are recorded.'];
  return {
    id: `connector-${connector.id}`,
    name: connector.platform,
    kind: 'connector',
    moduleKey: 'channels',
    state,
    declared: true,
    enabled: connector.status === 'Connected',
    configured,
    reachable: verified,
    verified,
    automationEligible: verified,
    checkedAt: connector.verifiedAt,
    evidence,
  };
}

function layaCapability(status: DecisionRuntimeStatus): GrowthCapabilityStatus {
  const verified = status.state === 'calibrated' && status.executionEligible;
  const failed = status.state === 'degraded' || status.state === 'failed';
  return {
    id: 'provider-laya',
    name: 'Laya Decision Core',
    kind: 'provider',
    moduleKey: 'decision',
    state: failed ? 'failed' : verified ? 'verified' : status.reachable ? 'reachable' : status.configured ? 'configured' : 'declared',
    declared: true,
    enabled: status.configured,
    configured: status.configured,
    reachable: status.reachable,
    verified,
    automationEligible: status.executionEligible,
    checkedAt: status.checkedAt,
    evidence: [status.detail],
  };
}

export function buildCapabilityRegistry(
  workspace: WorkspaceData,
  decisionRuntime?: DecisionRuntimeStatus,
  externalProviders: ExternalProviderCapability[] = [],
  now = new Date().toISOString(),
): CapabilityRegistry {
  const tinyfish = externalProviders.find(item => item.provider === 'tinyfish');
  const mirofish = externalProviders.find(item => item.provider === 'mirofish');
  const capabilities: GrowthCapabilityStatus[] = [
    ...(workspace.settings?.mcps ?? []).map(mcp => ({
      id: mcp.id,
      name: mcp.name,
      kind: 'mcp' as const,
      moduleKey: mcp.moduleKey || 'unassigned',
      state: mcp.enabled ? 'enabled' as const : 'declared' as const,
      declared: true as const,
      enabled: mcp.enabled,
      configured: false,
      reachable: false,
      verified: false,
      automationEligible: false,
      evidence: [mcp.enabled
        ? 'Workspace catalogue toggle is enabled; no runtime transport or handshake is registered.'
        : 'Capability is declared in the workspace catalogue but disabled.'],
    })),
    ...(workspace.secondBrain?.connectors ?? []).map(connectorCapability),
    {
      id: 'provider-tinyfish', name: 'TinyFish Web Intelligence', kind: 'provider', moduleKey: 'web-intelligence',
      state: tinyfish?.verified ? 'verified' : tinyfish?.configured ? 'configured' : 'declared',
      declared: true, enabled: Boolean(tinyfish?.configured), configured: Boolean(tinyfish?.configured),
      reachable: Boolean(tinyfish?.verified), verified: Boolean(tinyfish?.verified),
      automationEligible: false,
      evidence: [tinyfish?.detail || 'Adapter is implemented; no API key or runtime handshake is configured.'],
    },
    {
      id: 'provider-mirofish', name: 'MiroFish Market Simulation', kind: 'provider', moduleKey: 'market-simulation',
      state: mirofish?.verified ? 'verified' : mirofish?.configured ? 'configured' : 'declared',
      declared: true, enabled: Boolean(mirofish?.configured), configured: Boolean(mirofish?.configured),
      reachable: Boolean(mirofish?.verified), verified: Boolean(mirofish?.verified),
      automationEligible: false,
      evidence: [mirofish?.detail || 'Private-service adapter exists; deployment and governance gates are incomplete.'],
    },
    ...(decisionRuntime ? [layaCapability(decisionRuntime)] : []),
  ];

  const summary: Record<CapabilityState, number> = {
    declared: 0,
    enabled: 0,
    configured: 0,
    reachable: 0,
    verified: 0,
    failed: 0,
  };
  for (const capability of capabilities) summary[capability.state] += 1;
  return { generatedAt: now, capabilities, summary };
}
