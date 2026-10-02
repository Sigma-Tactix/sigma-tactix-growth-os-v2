import { describe, expect, it } from 'vitest';
import {
  resolveAgentReachBinary,
  getAgentReachDoctor,
  executeReachFetch,
  executeReachSearch,
  assertPublicHost
} from './agentReachService.js';

describe('agentReachService', () => {
  it('locates the agent-reach binary on the system or falls back gracefully', () => {
    const binary = resolveAgentReachBinary();
    expect(typeof binary).toBe('string');
    expect(binary.length).toBeGreaterThan(0);
  });

  it('retrieves the 15-channel doctor report with proper typing', async () => {
    const doctor = await getAgentReachDoctor();
    expect(doctor).toBeDefined();
    expect(doctor.totalChannels).toBeGreaterThanOrEqual(15);
    expect(doctor.channels.web).toBeDefined();
    expect(doctor.channels.youtube).toBeDefined();
    expect(doctor.channels.github).toBeDefined();
    if (doctor.cliAvailable) {
      expect(doctor.readyCount).toBeGreaterThan(0);
    } else {
      expect(doctor.readyCount).toBe(0);
    }
  }, 25000);

  it('does not mark fallback channels ready when the CLI health check fails', async () => {
    const doctor = await getAgentReachDoctor({
      runDoctor: async () => {
        throw new Error('agent-reach is unavailable');
      },
    });

    expect(doctor.cliAvailable).toBe(false);
    expect(doctor.readyCount).toBe(0);
    expect(doctor.warningCount).toBe(0);
    expect(doctor.offlineCount).toBe(15);
    expect(Object.values(doctor.channels).every(channel => channel.status === 'error')).toBe(true);
    expect(doctor.channels.web.message).toContain('Health check failed');
  });

  it('rejects SSRF targeting localhost or private IPs', async () => {
    await expect(assertPublicHost('http://localhost:8080')).rejects.toThrow(/Security Exception/);
    await expect(assertPublicHost('http://127.0.0.1:3000')).rejects.toThrow(/Security Exception/);
    await expect(assertPublicHost('http://169.254.169.254/latest/meta-data')).rejects.toThrow(/Security Exception/);
  });

  it('gracefully handles missing target for execution', async () => {
    const result = await executeReachFetch('web', '');
    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  it('returns a structured error instead of throwing Invalid URL for a keyword passed to URL extraction', async () => {
    const result = await executeReachFetch('web', 'Sigma Tactix');
    expect(result).toMatchObject({ success: false, channel: 'web' });
    expect(result.error).toContain('Agent Reach Web Extractor failed');
    expect(result.error).not.toContain('Invalid URL');
  });

  it('returns an actionable backend notice for an unconfigured Reddit keyword scan', async () => {
    const result = await executeReachSearch('reddit', 'Sigma Tactix');
    expect(result.success).toBe(false);
    expect(result.error).toContain('no authenticated Agent Reach backend is configured');
    expect(result.error).not.toContain('Invalid URL');
  });
});
