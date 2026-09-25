import { describe, expect, it } from 'vitest';
import { buildVantaTopology, createVantaState, vantaReducer } from './vanta';
import type { WorkspaceData } from '../types';

describe('VANTA public state contract', () => {
  it('moves through a truthful push-to-talk lifecycle', () => {
    let state = createVantaState({
      configured: true,
      verified: true,
      voiceAvailable: true,
      label: 'Verified',
    });
    state = vantaReducer(state, { type: 'VOICE_STARTED' });
    expect(state.phase).toBe('listening');

    state = vantaReducer(state, { type: 'VOICE_STOPPED' });
    expect(state.phase).toBe('transcribing');

    state = vantaReducer(state, { type: 'PROMPT_ACCEPTED' });
    expect(state.phase).toBe('thinking');

    state = vantaReducer(state, { type: 'RESPONSE_READY', hasProposal: true });
    expect(state.phase).toBe('proposing');

    state = vantaReducer(state, { type: 'SPEECH_STARTED' });
    expect(state.phase).toBe('speaking');

    state = vantaReducer(state, { type: 'SPEECH_FINISHED' });
    expect(state.phase).toBe('idle');
  });

  it('does not call an unverified provider online', () => {
    const state = vantaReducer(createVantaState(), {
      type: 'PROVIDER_STATUS',
      status: { configured: true, verified: false, voiceAvailable: false, label: 'Configured, not verified' },
    });
    expect(state.phase).toBe('offline');
    expect(state.provider.label).toBe('Configured, not verified');
  });
});

describe('VANTA topology', () => {
  it('shows Laya as an inspectable decision node without claiming automation is enabled', () => {
    const topology = buildVantaTopology(null, {
      provider: 'laya',
      configured: true,
      reachable: true,
      state: 'shadow',
      mode: 'shadow',
      model: 'auto',
      calibrated: false,
      executionEligible: false,
      checkedAt: '2026-09-25T00:00:00.000Z',
      detail: 'Reachable and observing decisions.',
    });

    expect(topology.nodes.find(node => node.id === 'decision-laya')).toMatchObject({
      label: 'Laya Decision Core',
      kind: 'decision',
      status: 'active',
    });
    expect(topology.nodes.find(node => node.id === 'decision-laya')?.detail).toContain('Automation: disabled');
  });

  it('derives inspectable entities from workspace data instead of static counts', () => {
    const workspace = {
      secondBrain: {
        uploadedFiles: [{ id: 'file-1', name: 'Brief.pdf', status: 'Ready', vaultId: 'brand', size: '1 MB', uploadedAt: '2026-09-01' }],
        connectors: [{ id: 'ga4', platform: 'Google Analytics', status: 'Connected', verificationState: 'verified', connectedBy: 'owner' }],
        pipelines: [],
        aiWorkflowVault: [{ id: 'agent-1', agentType: 'Marketing Agent', systemPrompt: '', modelRouterEndpoint: '', temperature: 0.2, maxTokens: 1000, agentConstraints: [] }],
      },
      agentTasks: [{ id: 'task-1', agentName: 'Marketing Agent', goal: 'Draft report', status: 'Pending Approval', timestamp: '2026-09-17', steps: [], output: '' }],
    } as unknown as WorkspaceData;

    const topology = buildVantaTopology(workspace);
    expect(topology.nodes.map(node => node.id)).toEqual([
      'core-vanta',
      'connector-ga4',
      'agent-agent-1',
      'file-file-1',
      'task-task-1',
    ]);
    expect(topology.nodes.find(node => node.id === 'connector-ga4')?.status).toBe('verified');
    expect(topology.nodes.find(node => node.id === 'task-task-1')?.status).toBe('approval_required');
  });
});
