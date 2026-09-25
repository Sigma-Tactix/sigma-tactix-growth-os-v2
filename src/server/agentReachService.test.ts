import { describe, expect, it } from 'vitest';
import {
  resolveAgentReachBinary,
  getAgentReachDoctor,
  executeReachFetch,
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
    expect(doctor.readyCount).toBeGreaterThan(0);
  }, 15000);

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
});
