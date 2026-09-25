import { Router, type Response } from 'express';
import type { DecisionRuntimeStatus } from '../../lib/decisionEngine';
import type { DecisionTraceInsert } from '../../lib/decisionTrace';

interface DecisionRouterDeps {
  getDecisionRuntimeStatus: () => Promise<DecisionRuntimeStatus>;
  classifyActionRisk: (input: any) => Promise<any>;
  routeIssueToModule: (input: any) => Promise<any>;
  evaluateAgentSwarmSafety: (input: any) => Promise<any>;
  buildDecisionTrace: (input: any) => DecisionTraceInsert;
}

async function persistTrace(res: Response, trace: DecisionTraceInsert): Promise<{ id: string | null; persisted: boolean }> {
  const { data, error } = await res.locals.sb.from('decision_traces').insert({
    workspace_id: res.locals.wsId,
    created_by: res.locals.userId,
    ...trace,
  }).select('id').single();
  if (error) {
    console.warn('Decision trace persistence unavailable:', error.message);
    return { id: null, persisted: false };
  }
  return { id: data.id, persisted: true };
}

export function createDecisionRouter(deps: DecisionRouterDeps): Router {
  const router = Router();

  router.get('/status', async (_req, res) => {
    const runtime = await deps.getDecisionRuntimeStatus();
    res.json({ success: true, ...runtime, engine: runtime.executionEligible ? 'laya' : 'deterministic_policy' });
  });

  router.get('/traces', async (req, res) => {
    const requested = Number(req.query.limit);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(100, Math.floor(requested))) : 25;
    const { data, error } = await res.locals.sb.from('decision_traces')
      .select('id,operation,provider,mode,authoritative_engine,selected_value,confidence,probabilities,requires_hitl,policy_override,shadow_provider,shadow_decision,duration_ms,created_at')
      .eq('workspace_id', res.locals.wsId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      res.status(503).json({ error: 'Decision traces are unavailable. Apply migration 0016 and verify workspace persistence.' });
      return;
    }
    res.json({ traces: data || [] });
  });

  router.post('/triage', async (req, res) => {
    const { title, summary, module, details } = req.body as Record<string, string | undefined>;
    if (!title || !summary) {
      res.status(400).json({ error: 'title and summary are required' });
      return;
    }
    const input = { title, summary, module: module || 'GENERAL', details };
    const result = await deps.classifyActionRisk(input);
    const trace = await persistTrace(res, deps.buildDecisionTrace({
      operation: 'triage', input, questionSet: ['risk_level', 'requires_hitl'], result,
    }));
    res.json({
      success: true, ...result,
      risk_level: result.risk,
      requires_hitl: result.requiresHITL,
      reasoning: `Classified as ${result.risk} risk (${Math.round(result.confidence * 100)}% confidence).`,
      traceId: trace.id,
      tracePersisted: trace.persisted,
    });
  });

  router.post('/route', async (req, res) => {
    const { issueText, sourceChannel } = req.body as { issueText?: string; sourceChannel?: string };
    if (!issueText?.trim()) {
      res.status(400).json({ error: 'issueText is required' });
      return;
    }
    const input = { issueText: issueText.trim(), sourceChannel };
    const result = await deps.routeIssueToModule(input);
    const trace = await persistTrace(res, deps.buildDecisionTrace({
      operation: 'route', input, questionSet: ['target_module'], result,
    }));
    res.json({
      success: true, ...result,
      target_module: result.targetModule.toLowerCase(),
      recommended_action: result.suggestedAction,
      priority: result.confidence >= 0.85 ? 'HIGH' : 'NORMAL',
      traceId: trace.id,
      tracePersisted: trace.persisted,
    });
  });

  router.post('/safety', async (req, res) => {
    const { agentName, goal, proposedAction } = req.body as Record<string, string | undefined>;
    if (!proposedAction) {
      res.status(400).json({ error: 'proposedAction is required' });
      return;
    }
    const input = { agentName: agentName || 'Autonomous Agent', goal: goal || 'Execute action', proposedAction };
    const result = await deps.evaluateAgentSwarmSafety(input);
    const trace = await persistTrace(res, deps.buildDecisionTrace({
      operation: 'safety', input, questionSet: ['is_safe', 'risk_level'], result,
    }));
    res.json({ success: true, ...result, traceId: trace.id, tracePersisted: trace.persisted });
  });

  return router;
}
