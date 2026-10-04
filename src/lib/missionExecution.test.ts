import { describe, expect, it } from 'vitest';
import { createDispatchPlan, dispatchPlanFromVantaProposal, expandDispatchPlan, materializeDispatchGraph, taskMetadata } from './missionExecution.js';

describe('mission execution module', () => {
  it('creates a governed plan from a registered system agent', () => {
    const plan = createDispatchPlan({
      intent: 'Draft a launch brief',
      agentName: 'Marketing Agent',
      moduleKey: 'content',
    });

    expect(plan.planId).toMatch(/^plan-/);
    expect(plan.missionId).toMatch(/^mission-/);
    expect(plan.ownerAgent).toBe('Marketing Agent');
    expect(plan.entrySubAgent).toBe('spend-efficiency-scorer');
    expect(plan.subAgents.length).toBeGreaterThan(1);
    expect(plan.requiresApproval).toBe(true);
    expect(plan.category).toBe('performance');
  });

  it('keeps task identity tied to the mission and entry sub-agent', () => {
    const plan = createDispatchPlan({ intent: 'Audit the funnel', agentName: 'Audit Diagnostic Agent' });
    expect(taskMetadata(plan, { parentTaskId: 'root-task' })).toEqual({
      missionId: plan.missionId,
      planId: plan.planId,
      subAgentId: 'evidence-collector',
      parentTaskId: 'root-task',
      requiresApproval: true,
    });
  });

  it('materializes the entry sub-agent behind the bounded graph seam', async () => {
    const plan = createDispatchPlan({ intent: 'Research competitors', agentName: 'Marketing Agent' });
    const graph = materializeDispatchGraph(plan, {
      workspaceId: 'ws-1',
      execute: async (subAgent, ctx) => ({ subAgent: subAgent.id, workspace: ctx.workspaceId }),
    });

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].id).toBe('sub-agent:spend-efficiency-scorer');
    const result = await graph.nodes[0].execute({ workspaceId: 'ws-1', nodeId: graph.nodes[0].id }, {});
    expect((result as any).value).toEqual({ subAgent: 'spend-efficiency-scorer', workspace: 'ws-1' });
  });

  it('derives VANTA ownership from the local module map, never from model-selected agents', () => {
    const plan = dispatchPlanFromVantaProposal({
      id: 'proposal-1',
      title: 'Diagnose funnel',
      objective: 'Audit the acquisition funnel',
      targetModule: 'DIAGNOSTICS',
      targetRoute: '/growth-diagnostics',
      expectedEffect: 'Produce evidence-backed findings',
      risk: 'medium',
      evidenceIds: ['audit-1'],
    });
    expect(plan?.ownerAgent).toBe('Audit Diagnostic Agent');
    expect(plan?.category).toBe('growth');
    expect(plan?.evidenceRefs).toEqual(['audit-1']);
  });

  it('preserves the VANTA plan identity for idempotent dispatch', () => {
    const plan = dispatchPlanFromVantaProposal({
      id: 'proposal-2',
      title: 'Queue diagnosis',
      objective: 'Audit the acquisition funnel',
      targetModule: 'DIAGNOSTICS',
      targetRoute: '/growth-diagnostics',
      expectedEffect: 'Produce findings',
      risk: 'low',
      evidenceIds: [],
      dispatchPlan: {
        planId: 'plan-existing',
        missionId: 'mission-existing',
        category: 'growth',
        ownerAgent: 'Audit Diagnostic Agent',
        entrySubAgent: 'evidence-collector',
        requiresApproval: true,
        evidenceRefs: [],
      },
    });
    expect(plan?.planId).toBe('plan-existing');
    expect(plan?.missionId).toBe('mission-existing');
  });

  it('materializes a bounded multi-node chain with upstream forwarding', async () => {
    const plan = expandDispatchPlan(createDispatchPlan({ intent: 'Inspect acquisition', agentName: 'Audit Diagnostic Agent' }), 3);
    const seenUpstream: Record<string, unknown>[] = [];
    const graph = materializeDispatchGraph(plan, {
      workspaceId: 'ws-1',
      execute: async (subAgent, _ctx, upstream) => {
        seenUpstream.push(upstream);
        return { subAgent: subAgent.id };
      },
    });

    expect(graph.nodes.length).toBe(3);
    expect(graph.nodes.map((node) => node.dependencies.length)).toEqual([0, 1, 1]);
    const first = await graph.nodes[0].execute({ workspaceId: 'ws-1', nodeId: graph.nodes[0].id }, {});
    const second = await graph.nodes[1].execute(
      { workspaceId: 'ws-1', nodeId: graph.nodes[1].id },
      { [graph.nodes[0].id]: first },
    );
    expect((second as any).value.subAgent).toBe(plan.executionSubAgentIds[1]);
    expect(Object.keys(seenUpstream[1])).toEqual([graph.nodes[0].id]);
  });
});
