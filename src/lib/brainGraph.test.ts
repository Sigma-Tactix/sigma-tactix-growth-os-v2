import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertBrainEntity,
  linkBrainEntities,
  getBrainGraph,
  compoundAgentLearning,
  clearLocalBrainGraph,
} from './brainGraph.js';

describe('Compounding Second Brain Knowledge Graph', () => {
  const ws1 = 'ws-test-enclave-001';
  const ws2 = 'ws-test-enclave-002';

  beforeEach(() => {
    clearLocalBrainGraph();
  });

  it('creates and updates knowledge entities with case-insensitive name resolution', async () => {
    const entity1 = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'brand',
      name: 'High-LTV Enterprise Persona',
      entityType: 'Persona',
      summary: 'Series B+ SaaS founders with >$50k monthly ad spend',
      attributes: { tier: 'Enterprise', segment: 'B2B' },
    });

    expect(entity1.id).toBeDefined();
    expect(entity1.name).toBe('High-LTV Enterprise Persona');
    expect(entity1.attributes.tier).toBe('Enterprise');

    // Update the same entity (case variation)
    const entity2 = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'brand',
      name: 'high-ltv enterprise persona',
      entityType: 'Persona',
      attributes: { verifiedConversionRate: '4.2%' },
    });

    expect(entity2.id).toBe(entity1.id);
    expect(entity2.attributes.tier).toBe('Enterprise');
    expect(entity2.attributes.verifiedConversionRate).toBe('4.2%');
  });

  it('links two entities with directional typed relationships', async () => {
    const hook = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'marketing',
      name: 'Stop Burning Ad Spend on Low-Intent Leads',
      entityType: 'Hook',
    });

    const persona = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'customer',
      name: 'SaaS Growth Lead',
      entityType: 'Persona',
    });

    const rel = await linkBrainEntities(null, {
      workspaceId: ws1,
      sourceId: hook.id,
      targetId: persona.id,
      relationType: 'TARGETS_PERSONA',
      weight: 1.5,
    });

    expect(rel.id).toBeDefined();
    expect(rel.sourceId).toBe(hook.id);
    expect(rel.targetId).toBe(persona.id);
    expect(rel.relationType).toBe('TARGETS_PERSONA');
    expect(rel.weight).toBe(1.5);
  });

  it('retrieves graph topology scoped by workspace and vaults', async () => {
    const brandEntity = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'brand',
      name: 'Core Positioning Slogan',
      entityType: 'Concept',
    });

    const marketingEntity = await upsertBrainEntity(null, {
      workspaceId: ws1,
      vaultId: 'marketing',
      name: 'LinkedIn Sponsored Carousel',
      entityType: 'Channel',
    });

    await linkBrainEntities(null, {
      workspaceId: ws1,
      sourceId: marketingEntity.id,
      targetId: brandEntity.id,
      relationType: 'OUTPERFORMS',
    });

    // Foreign entity in ws2
    await upsertBrainEntity(null, {
      workspaceId: ws2,
      vaultId: 'brand',
      name: 'Competitor Enclave Brand',
      entityType: 'Concept',
    });

    const ws1Graph = await getBrainGraph(null, ws1);
    expect(ws1Graph.entities).toHaveLength(2);
    expect(ws1Graph.relationships).toHaveLength(1);

    const filteredGraph = await getBrainGraph(null, ws1, ['brand']);
    expect(filteredGraph.entities).toHaveLength(1);
    expect(filteredGraph.entities[0].name).toBe('Core Positioning Slogan');
    // Edge crosses into 'marketing', which was excluded, so relationships should be empty
    expect(filteredGraph.relationships).toHaveLength(0);
  });

  it('compounds agent findings into an entity, related entity, and relationship edge', async () => {
    const result = await compoundAgentLearning(null, {
      workspaceId: ws1,
      vaultId: 'marketing',
      sourceModule: 'performance_ads',
      learningText: 'Hook "Tired of 30-day agency onboardings?" outperformed control by 3.1x ROAS',
      entityName: 'Tired of 30-day agency onboardings?',
      entityType: 'Hook',
      attributes: { roas: 3.1, channel: 'LinkedIn' },
      relatedEntityName: 'Inpatient Agency Fatigued Founders',
      relatedEntityType: 'Persona',
      relationshipType: 'TARGETS_PERSONA',
    });

    expect(result.primaryEntity).toBeDefined();
    expect(result.primaryEntity.name).toBe('Tired of 30-day agency onboardings?');
    expect(result.relatedEntity).toBeDefined();
    expect(result.relatedEntity?.name).toBe('Inpatient Agency Fatigued Founders');
    expect(result.relationship?.relationType).toBe('TARGETS_PERSONA');

    // Verify it is now retrievable in the graph
    const graph = await getBrainGraph(null, ws1);
    expect(graph.entities).toHaveLength(2);
    expect(graph.relationships).toHaveLength(1);
  });
});
