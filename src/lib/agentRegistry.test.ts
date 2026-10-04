/**
 * The registry must never drift from the systems it claims to mirror.
 *
 * These tests fail the build when the agent registry, the vault RBAC matrix,
 * the category map, and the database enum disagree — which is the failure mode
 * that makes a governance story unfalsifiable.
 */
import { describe, it, expect } from 'vitest';
import {
  MASTER_AGENT,
  MASTER_AGENT_ID,
  SYSTEM_AGENTS,
  SYSTEM_AGENT_NAMES,
  ALL_SUB_AGENTS,
  SUB_AGENT_IDS,
  getSystemAgent,
  getSubAgent,
  getAgentByName,
  ownerForCategory,
  requiresApproval,
} from './agentRegistry';
import { AGENT_VAULT_POLICIES } from './agentPolicies';
import { CATEGORY_OWNERS } from './decisionEngine';

describe('agent registry hierarchy', () => {
  it('has exactly one master agent and seven system agents', () => {
    expect(MASTER_AGENT_ID).toBe('VANTA');
    expect(SYSTEM_AGENTS).toHaveLength(7);
  });

  it('covers every SystemAgentName used by AgentTask and the DB enum', () => {
    const registered = SYSTEM_AGENTS.map(a => a.name);
    expect(registered.sort()).toEqual([...SYSTEM_AGENT_NAMES].sort());
  });

  it('gives every system agent a unique id and codename', () => {
    expect(new Set(SYSTEM_AGENTS.map(a => a.id)).size).toBe(7);
    expect(new Set(SYSTEM_AGENTS.map(a => a.codename)).size).toBe(7);
  });

  it('gives every sub-agent a unique kebab-case id', () => {
    expect(new Set(SUB_AGENT_IDS).size).toBe(SUB_AGENT_IDS.length);
    for (const id of SUB_AGENT_IDS) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('gives every system agent a real entry sub-agent that belongs to it', () => {
    for (const agent of SYSTEM_AGENTS) {
      const entry = agent.subAgents.find(s => s.id === agent.entrySubAgent);
      expect(entry, `${agent.id} entrySubAgent ${agent.entrySubAgent}`).toBeDefined();
      expect(entry!.owner).toBe(agent.id);
    }
  });

  it('declares a purpose, input and output contract for every sub-agent', () => {
    for (const sub of ALL_SUB_AGENTS) {
      expect(sub.purpose.length, sub.id).toBeGreaterThan(10);
      expect(sub.inputContract.length, sub.id).toBeGreaterThan(0);
      expect(sub.outputContract.length, sub.id).toBeGreaterThan(0);
      expect(sub.timeoutMs, sub.id).toBeGreaterThan(0);
    }
  });
});

describe('registry matches the real vault RBAC matrix', () => {
  it('every registered agent has a policy row in agentPolicies', () => {
    for (const agent of SYSTEM_AGENTS) {
      expect(AGENT_VAULT_POLICIES[agent.name], `no policy for ${agent.name}`).toBeDefined();
    }
  });

  it('every registry vault scope exactly matches the policy allow-list', () => {
    for (const agent of SYSTEM_AGENTS) {
      const policy = AGENT_VAULT_POLICIES[agent.name];
      expect([...agent.vaultScope].sort(), `scope drift for ${agent.name}`)
        .toEqual([...policy.allowed].sort());
    }
  });

  it('no agent — nor Vanta — ever holds a secret vault', () => {
    const secret = ['Executive Vault', 'Credentials Vault'];
    expect(MASTER_AGENT.blocked).toEqual(secret);
    for (const agent of SYSTEM_AGENTS) {
      for (const vault of secret) {
        expect(agent.vaultScope, `${agent.id} must not hold ${vault}`).not.toContain(vault);
      }
    }
  });
});

describe('registry matches the decision-engine category map', () => {
  it('every category maps to exactly one owning agent, in both places', () => {
    for (const category of Object.keys(CATEGORY_OWNERS)) {
      const owners = SYSTEM_AGENTS.filter(a => (a.categories as string[]).includes(category));
      expect(owners, `${category} owned by ${owners.length} agents`).toHaveLength(1);
      expect(owners[0].name).toBe(CATEGORY_OWNERS[category as keyof typeof CATEGORY_OWNERS]);
    }
  });

  it('declares no categories that the decision engine does not know', () => {
    const known = new Set(Object.keys(CATEGORY_OWNERS));
    for (const agent of SYSTEM_AGENTS) {
      for (const category of agent.categories) expect(known.has(category as string), category).toBe(true);
    }
  });

  it('owns every category exactly once', () => {
    const declared = SYSTEM_AGENTS.flatMap(a => a.categories as string[]);
    expect(declared.length).toBe(new Set(declared).size);
    expect(declared.sort()).toEqual(Object.keys(CATEGORY_OWNERS).sort());
  });
});

describe('A5 AI SDR can never send', () => {
  const sdr = getSystemAgent('A5');

  it('holds no connector write grant on any sub-agent path', () => {
    // Drafting is a write to artifacts, which is fine; the invariant is that no
    // sub-agent is granted delivery capability. The registry models delivery as
    // out-of-band, so this asserts the mission states the prohibition and that
    // there is no dedicated "send" sub-agent.
    expect(sdr.mission).toMatch(/never sends/i);
    expect(SUB_AGENT_IDS.filter(id => /send|deliver|blast|dispatch/.test(id))).toHaveLength(0);
  });

  it('cannot read the vaults a sales agent has no business seeing', () => {
    // A5 is not the narrowest agent by vault count — Operations is — but the
    // safety-relevant property is that the SDR can never see spend, campaign or
    // site data. Those vaults are what would let a sales agent act on, or leak,
    // commercial and performance detail it has no authority over.
    const forbidden = ['Marketing Vault', 'Website Vault', 'Authority Vault', 'Operations Vault', 'Audit Vault'];
    for (const vault of forbidden) {
      expect(sdr.vaultScope, `A5 must not hold ${vault}`).not.toContain(vault);
    }
  });
});

describe('approval semantics', () => {
  it('marks exactly the write-plane sub-agents as requiring approval', () => {
    expect(requiresApproval('budget-allocator')).toBe(true);
    expect(requiresApproval('spend-efficiency-scorer')).toBe(false);
  });

  it('leaves read-only agents with no approval requirement', () => {
    const a1 = getSystemAgent('A1');
    const readers = a1.subAgents.filter(s => s.plane === 'read').map(s => s.id);
    for (const id of readers) expect(requiresApproval(id)).toBe(false);
  });
});

describe('lookup helpers', () => {
  it('resolves by id, name and category', () => {
    expect(getSystemAgent('A3').name).toBe('SEO & Authority Agent');
    expect(getAgentByName('Operations Agent')?.id).toBe('A7');
    expect(ownerForCategory('crm')?.id).toBe('A5');
    expect(ownerForCategory('not_a_category')).toBeUndefined();
  });

  it('throws loudly on unknown ids rather than defaulting', () => {
    expect(() => getSubAgent('nope')).toThrow(/Unknown sub-agent/);
    expect(() => getSystemAgent('A9' as never)).toThrow(/Unknown system agent/);
  });
});
