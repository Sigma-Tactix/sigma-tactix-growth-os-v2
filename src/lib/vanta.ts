import type { WorkspaceData } from '../types';

export type VantaPhase =
  | 'offline'
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'inspecting'
  | 'proposing'
  | 'awaiting_confirmation'
  | 'success'
  | 'warning'
  | 'error';

export type VantaEvidenceSource = 'workspace' | 'vault' | 'document' | 'web' | 'local';

export interface VantaEvidence {
  id: string;
  sourceType: VantaEvidenceSource;
  title: string;
  excerpt?: string;
  href?: string;
  entityId?: string;
  observedAt?: string;
}

export interface VantaActionProposal {
  id: string;
  title: string;
  objective: string;
  targetModule: string;
  targetRoute: string;
  expectedEffect: string;
  risk: 'low' | 'medium' | 'high';
  evidenceIds: string[];
}

export interface VantaMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  evidence: VantaEvidence[];
  proposal?: VantaActionProposal;
  createdAt: string;
}

export interface VantaProviderStatus {
  configured: boolean;
  verified: boolean;
  stale?: boolean;
  voiceAvailable: boolean;
  label: string;
  provider?: string;
  model?: string;
  verifiedAt?: string;
  decisionRuntime?: VantaDecisionRuntimeStatus;
}

export interface VantaDecisionRuntimeStatus {
  provider: 'laya';
  configured: boolean;
  reachable: boolean;
  state: 'unconfigured' | 'loading' | 'ready_unvalidated' | 'shadow' | 'calibrated' | 'degraded' | 'failed';
  mode: 'shadow' | 'active';
  model: string;
  calibrated: boolean;
  executionEligible: boolean;
  checkedAt: string;
  detail: string;
}

export interface VantaVoiceConfig {
  provider: 'gemini' | 'local';
  sttModel?: string;
  ttsModel?: string;
  voice?: string;
  baseUrl?: string;
}

export type VantaNodeKind = 'core' | 'decision' | 'connector' | 'agent' | 'document' | 'task';
export type VantaNodeStatus =
  | 'verified'
  | 'configured'
  | 'unavailable'
  | 'active'
  | 'stale'
  | 'approval_required'
  | 'unknown';

export interface VantaTopologyNode {
  id: string;
  label: string;
  kind: VantaNodeKind;
  status: VantaNodeStatus;
  detail?: string;
  route?: string;
}

export interface VantaTopologyFocus {
  nodes: VantaTopologyNode[];
  edges: Array<{ id: string; from: string; to: string }>;
}

export interface VantaState {
  phase: VantaPhase;
  inspectMode: boolean;
  audioAmplitude: number;
  provider: VantaProviderStatus;
  error: string | null;
}

export type VantaEvent =
  | { type: 'PROVIDER_STATUS'; status: VantaProviderStatus }
  | { type: 'VOICE_STARTED' }
  | { type: 'VOICE_STOPPED' }
  | { type: 'PROMPT_ACCEPTED' }
  | { type: 'RESPONSE_READY'; hasProposal: boolean }
  | { type: 'SPEECH_STARTED' }
  | { type: 'SPEECH_FINISHED' }
  | { type: 'INSPECT_STARTED' }
  | { type: 'INSPECT_FINISHED' }
  | { type: 'AWAITING_CONFIRMATION' }
  | { type: 'ACTION_OPENED' }
  | { type: 'WARNING'; message: string }
  | { type: 'FAILED'; message: string }
  | { type: 'RESET' }
  | { type: 'AUDIO_AMPLITUDE'; value: number };

export function createVantaState(provider?: Partial<VantaProviderStatus>): VantaState {
  const resolvedProvider: VantaProviderStatus = {
    configured: false,
    verified: false,
    voiceAvailable: false,
    label: 'Provider unavailable',
    ...provider,
  };
  return {
    phase: resolvedProvider.verified ? 'idle' : 'offline',
    inspectMode: false,
    audioAmplitude: 0,
    provider: resolvedProvider,
    error: null,
  };
}

export function vantaReducer(state: VantaState, event: VantaEvent): VantaState {
  switch (event.type) {
    case 'PROVIDER_STATUS':
      return {
        ...state,
        provider: event.status,
        phase: event.status.verified ? (state.phase === 'offline' ? 'idle' : state.phase) : 'offline',
        error: null,
      };
    case 'VOICE_STARTED':
      return state.provider.verified ? { ...state, phase: 'listening', error: null } : state;
    case 'VOICE_STOPPED':
      return state.phase === 'listening' ? { ...state, phase: 'transcribing', audioAmplitude: 0 } : state;
    case 'PROMPT_ACCEPTED':
      return state.provider.verified ? { ...state, phase: 'thinking', error: null } : state;
    case 'RESPONSE_READY':
      return { ...state, phase: event.hasProposal ? 'proposing' : 'success' };
    case 'SPEECH_STARTED':
      return { ...state, phase: 'speaking' };
    case 'SPEECH_FINISHED':
      return { ...state, phase: 'idle', audioAmplitude: 0 };
    case 'INSPECT_STARTED':
      return { ...state, phase: 'inspecting', inspectMode: true };
    case 'INSPECT_FINISHED':
      return { ...state, phase: 'idle', inspectMode: false };
    case 'AWAITING_CONFIRMATION':
      return { ...state, phase: 'awaiting_confirmation' };
    case 'ACTION_OPENED':
      return { ...state, phase: 'success' };
    case 'WARNING':
      return { ...state, phase: 'warning', error: event.message };
    case 'FAILED':
      return { ...state, phase: 'error', error: event.message, audioAmplitude: 0 };
    case 'RESET':
      return createVantaState(state.provider);
    case 'AUDIO_AMPLITUDE':
      return { ...state, audioAmplitude: Math.max(0, Math.min(1, event.value)) };
  }
}

export function buildVantaTopology(
  workspace: WorkspaceData | null | undefined,
  decisionRuntime?: VantaDecisionRuntimeStatus,
): VantaTopologyFocus {
  const nodes: VantaTopologyNode[] = [{
    id: 'core-vanta',
    label: 'VANTA',
    kind: 'core',
    status: workspace ? 'active' : 'unavailable',
    detail: workspace ? 'Authenticated workspace context' : 'Workspace context unavailable',
  }];

  if (decisionRuntime) {
    nodes.push({
      id: 'decision-laya',
      label: 'Laya Decision Core',
      kind: 'decision',
      status: decisionRuntime.state === 'calibrated'
        ? 'verified'
        : decisionRuntime.state === 'shadow'
          ? 'active'
          : decisionRuntime.state === 'ready_unvalidated'
            ? 'configured'
            : decisionRuntime.state === 'unconfigured'
              ? 'unknown'
              : 'unavailable',
      detail: `${decisionRuntime.detail} Automation: ${decisionRuntime.executionEligible ? 'eligible under policy' : 'disabled'}`,
      route: '/dashboard',
    });
  }

  if (!workspace) return {
    nodes,
    edges: nodes.slice(1).map(node => ({ id: `core-${node.id}`, from: 'core-vanta', to: node.id })),
  };

  for (const connector of workspace.secondBrain?.connectors ?? []) {
    const state = connector.verificationState;
    nodes.push({
      id: `connector-${connector.id}`,
      label: connector.platform,
      kind: 'connector',
      status: state === 'verified' ? 'verified' : state === 'configured' ? 'configured' : state === 'stale' ? 'stale' : state === 'failed' || state === 'unsupported' ? 'unavailable' : 'unknown',
      detail: connector.verificationError || (connector.verifiedAt ? `Verified ${connector.verifiedAt}` : 'No provider verification evidence'),
      route: '/sources',
    });
  }

  for (const agent of workspace.secondBrain?.aiWorkflowVault ?? []) {
    nodes.push({
      id: `agent-${agent.id}`,
      label: agent.agentType,
      kind: 'agent',
      status: agent.modelRouterEndpoint ? 'configured' : 'unknown',
      detail: agent.modelRouterEndpoint ? 'Model route configured' : 'No model route configured',
      route: '/agents',
    });
  }

  for (const file of workspace.secondBrain?.uploadedFiles ?? []) {
    nodes.push({
      id: `file-${file.id}`,
      label: file.name,
      kind: 'document',
      status: file.status === 'Ready' ? 'active' : 'configured',
      detail: file.status === 'Ready' ? 'Indexed or ready for retrieval' : 'Processing',
      route: '/vaults',
    });
  }

  for (const task of workspace.agentTasks ?? []) {
    nodes.push({
      id: `task-${task.id}`,
      label: task.goal,
      kind: 'task',
      status: task.status === 'Pending Approval' ? 'approval_required' : task.status === 'Running' ? 'active' : task.status === 'Failed' ? 'unavailable' : 'configured',
      detail: `${task.agentName}: ${task.status}`,
      route: '/agents',
    });
  }

  return {
    nodes,
    edges: nodes.slice(1).map(node => ({ id: `core-${node.id}`, from: 'core-vanta', to: node.id })),
  };
}

export function filterVantaTopology(topology: VantaTopologyFocus, query: string, expandAll: boolean): VantaTopologyFocus {
  if (expandAll || !query.trim()) return topology;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const selected = topology.nodes.filter(node =>
    node.kind === 'core' || words.some(word => `${node.label} ${node.kind} ${node.detail ?? ''}`.toLowerCase().includes(word))
  );
  const ids = new Set(selected.map(node => node.id));
  return { nodes: selected, edges: topology.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)) };
}
