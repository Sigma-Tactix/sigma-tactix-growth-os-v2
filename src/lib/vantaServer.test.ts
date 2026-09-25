import { describe, expect, it } from 'vitest';
import { buildVantaPromptContext, classifyVantaVerification, describeVantaProviderError, parseVantaModelOutput, vantaMessageRequest } from './vantaServer';
import type { WorkspaceData } from '../types';

describe('VANTA server contract', () => {
  it('distinguishes current, stale, configured, and unavailable provider states', () => {
    const now = Date.parse('2026-09-17T00:00:00Z');
    expect(classifyVantaVerification(true, '2026-09-16T00:00:00Z', now)).toMatchObject({ verified: true, stale: false, label: 'Verified' });
    expect(classifyVantaVerification(true, '2026-09-01T00:00:00Z', now)).toMatchObject({ verified: false, stale: true, label: 'Verification stale' });
    expect(classifyVantaVerification(true, null, now)).toMatchObject({ verified: false, stale: false, label: 'Configured, not verified' });
    expect(classifyVantaVerification(false, null, now)).toMatchObject({ verified: false, stale: false, label: 'Provider unavailable' });
  });

  it('rejects an empty or oversized message', () => {
    expect(vantaMessageRequest.safeParse({ content: '' }).success).toBe(false);
    expect(vantaMessageRequest.safeParse({ content: 'x'.repeat(4001) }).success).toBe(false);
    expect(vantaMessageRequest.safeParse({ content: 'Inspect my analytics setup' }).success).toBe(true);
  });

  it('exposes operational facts without connector credentials', () => {
    const workspace = {
      secondBrain: {
        connectors: [{
          id: 'ga4',
          platform: 'Google Analytics',
          status: 'Connected',
          verificationState: 'verified',
          verifiedAt: '2026-09-17T10:00:00.000Z',
          connectedBy: 'owner',
          credentials: { encrypted: 'secret' },
        }],
        uploadedFiles: [],
        aiWorkflowVault: [],
        pipelines: [],
      },
      agentTasks: [],
    } as unknown as WorkspaceData;
    const context = buildVantaPromptContext(workspace);
    expect(context).toContain('Google Analytics: verified');
    expect(context).not.toContain('secret');
  });

  it('gives VANTA truthful decision-runtime context without credentials', () => {
    const workspace = {
      secondBrain: { connectors: [], uploadedFiles: [], aiWorkflowVault: [], pipelines: [] },
      agentTasks: [],
    } as unknown as WorkspaceData;
    const context = buildVantaPromptContext(workspace, {
      provider: 'laya', state: 'shadow', mode: 'shadow', model: 'auto', reachable: true,
      calibrated: false, executionEligible: false, checkedAt: '2026-09-25T00:00:00.000Z',
      detail: 'Deterministic policy remains authoritative.',
    });

    expect(context).toContain('laya: state=shadow');
    expect(context).toContain('executionEligible=false');
    expect(context).not.toContain('LAYA_API_KEY');
  });

  it('falls back to plain text when a provider does not return structured JSON', () => {
    expect(parseVantaModelOutput('No verified connector data is available.')).toEqual({
      text: 'No verified connector data is available.',
      evidence: [],
    });
  });

  it('normalizes provider evidence that uses content instead of the typed evidence fields', () => {
    expect(parseVantaModelOutput(JSON.stringify({
      text: 'Google Analytics is verified.',
      evidence: [{ sourceType: 'workspace', content: 'Google Analytics: verified' }],
    }))).toEqual({
      text: 'Google Analytics is verified.',
      evidence: [{
        id: 'workspace-1',
        sourceType: 'workspace',
        title: 'Workspace evidence 1',
        excerpt: 'Google Analytics: verified',
      }],
      memorySuggestion: undefined,
      topologyEntityIds: undefined,
    });
  });

  it('reports provider quota and model failures without exposing raw provider payloads', () => {
    expect(describeVantaProviderError(new Error('429 RESOURCE_EXHAUSTED: quota exceeded'))).toContain('quota or rate limit is exhausted');
    expect(describeVantaProviderError(new Error('404 model gemini-old not found'))).toContain('model is unavailable');
    expect(describeVantaProviderError(new Error('upstream payload with internal details'))).toBe(
      'VANTA could not complete this request because the configured AI provider failed. No assistant response was stored.',
    );
  });
});
