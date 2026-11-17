import { describe, it, expect, vi } from 'vitest';
import {
  executeVantaTool,
  validateVantaToolPolicy,
  VANTA_TOOL_CATALOG,
  type VantaToolExecutionContext,
} from './vantaToolGateway.js';

describe('Typed VANTA Tool Gateway and Consent (S10-A1, S10-A2, S10-A3)', () => {
  const baseContext: VantaToolExecutionContext = {
    workspaceId: 'ws-test-123',
    userId: 'user-operator-1',
    userRole: 'owner',
    environment: 'test',
    isAutonomousPlanner: false,
  };

  describe('S10-A1: Planner uses validated tool/schema/effect/cost/runtime policy', () => {
    it('contains all required typed tools with explicit effect classifications and cost budgets', () => {
      expect(VANTA_TOOL_CATALOG.has('vanta_inspect_page')).toBe(true);
      expect(VANTA_TOOL_CATALOG.has('vanta_query_metrics')).toBe(true);
      expect(VANTA_TOOL_CATALOG.has('vanta_search_documents')).toBe(true);
      expect(VANTA_TOOL_CATALOG.has('vanta_propose_action')).toBe(true);
      expect(VANTA_TOOL_CATALOG.has('vanta_execute_action')).toBe(true);

      const inspect = VANTA_TOOL_CATALOG.get('vanta_inspect_page')!;
      expect(inspect.effect).toBe('read_only');
      expect(inspect.costBudget.estimatedCostUsd).toBeGreaterThan(0);
      expect(inspect.costBudget.timeoutMs).toBeGreaterThan(0);

      const propose = VANTA_TOOL_CATALOG.get('vanta_propose_action')!;
      expect(propose.effect).toBe('propose_mutation');

      const execute = VANTA_TOOL_CATALOG.get('vanta_execute_action')!;
      expect(execute.effect).toBe('execute_mutating');
    });

    it('rejects invalid schema inputs with detailed validation errors and failed receipt', async () => {
      const result = await executeVantaTool(
        'vanta_query_metrics',
        { metricCategory: 'invalid_category_name' },
        baseContext,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
      expect(result.error).toMatch(/Invalid input for tool 'vanta_query_metrics'/i);
      expect(result.receipt.status).toBe('failed');
      expect(result.receipt.toolName).toBe('vanta_query_metrics');
      expect(result.receipt.proof.errorDetails).toBeDefined();
    });

    it('enforces role authorization on sensitive tools', async () => {
      const memberContext: VantaToolExecutionContext = {
        ...baseContext,
        userRole: 'member',
      };

      // vanta_execute_action requires owner or admin
      const result = await executeVantaTool(
        'vanta_execute_action',
        { actionId: 'act-1', approvalToken: 'tok-1', payloadHash: 'abc' },
        memberContext,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('UNAUTHORIZED_ROLE');
      expect(result.receipt.status).toBe('blocked');
      expect(result.error).toMatch(/Role 'member' is not authorized/i);
    });

    it('prohibits autonomous execution of mutating actions by the planner (consent gate)', async () => {
      const autonomousContext: VantaToolExecutionContext = {
        ...baseContext,
        isAutonomousPlanner: true,
      };

      const result = await executeVantaTool(
        'vanta_execute_action',
        { actionId: 'act-99', approvalToken: 'tok-99', payloadHash: 'hash-99' },
        autonomousContext,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('POLICY_DENIED');
      expect(result.receipt.status).toBe('blocked');
      expect(result.error).toMatch(/Autonomous execution of mutating tool.*is forbidden/i);
    });

    it('enforces cost budget ceiling and denies invocation when budget is exceeded', async () => {
      const lowBudgetContext: VantaToolExecutionContext = {
        ...baseContext,
        budgetRemainingUsd: 0.0005, // Lower than tool estimatedCostUsd of 0.002
      };

      const check = validateVantaToolPolicy('vanta_query_metrics', lowBudgetContext);
      expect(check.valid).toBe(false);
      expect(check.code).toBe('BUDGET_EXCEEDED');

      const result = await executeVantaTool(
        'vanta_query_metrics',
        { metricCategory: 'growth' },
        lowBudgetContext,
      );
      expect(result.success).toBe(false);
      expect(result.code).toBe('BUDGET_EXCEEDED');
      expect(result.receipt.status).toBe('blocked');
    });
  });

  describe('S10-A3: Authorized tool returns receipt; injected/unknown tool/destination denied; cancellation works', () => {
    it('returns an authentic verification receipt upon authorized tool execution', async () => {
      const result = await executeVantaTool(
        'vanta_query_metrics',
        { metricCategory: 'growth', timeRangeDays: 14 },
        baseContext,
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.metrics.primaryScore).toBe(78);

      const receipt = result.receipt;
      expect(receipt.receiptId).toMatch(/^[0-9a-f-]{36}$/);
      expect(receipt.toolName).toBe('vanta_query_metrics');
      expect(receipt.toolVersion).toBe('1.0.0');
      expect(receipt.effect).toBe('read_only');
      expect(receipt.workspaceId).toBe('ws-test-123');
      expect(receipt.environment).toBe('test');
      expect(receipt.status).toBe('success');
      expect(receipt.durationMs).toBeGreaterThanOrEqual(0);
      expect(receipt.proof.success).toBe(true);
      expect(receipt.tokensUsed).toBe(800);
      expect(receipt.costUsd).toBe(0.002);
    });

    it('denies injected or unknown tool names with structured blocked receipt', async () => {
      const result = await executeVantaTool(
        'injected_arbitrary_shell_exec',
        { command: 'cat /etc/passwd' },
        baseContext,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('TOOL_NOT_FOUND');
      expect(result.error).toMatch(/Unknown or injected tool 'injected_arbitrary_shell_exec' denied/i);
      expect(result.receipt.status).toBe('blocked');
      expect(result.receipt.toolName).toBe('injected_arbitrary_shell_exec');
    });

    it('denies injected or unauthorized destinations with DESTINATION_DENIED', async () => {
      // Injected external or unauthorized internal route
      const result = await executeVantaTool(
        'vanta_inspect_page',
        { targetRoute: '/internal/admin/secret-debugger' },
        baseContext,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('DESTINATION_DENIED');
      expect(result.error).toMatch(/not an authorized workspace destination/i);
      expect(result.receipt.status).toBe('blocked');
    });

    it('supports clean cancellation via AbortSignal before dispatch', async () => {
      const controller = new AbortController();
      controller.abort(); // Pre-aborted

      const result = await executeVantaTool(
        'vanta_query_metrics',
        { metricCategory: 'spend' },
        { ...baseContext, signal: controller.signal },
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe('CANCELLED');
      expect(result.receipt.status).toBe('cancelled');
      expect(result.receipt.proof.cancelled).toBe(true);
    });

    it('supports dynamic cancellation while tool is executing', async () => {
      const controller = new AbortController();

      // Dispatch and immediately abort in the next microtask tick
      const executionPromise = executeVantaTool(
        'vanta_inspect_page',
        { targetRoute: '/dashboard' },
        { ...baseContext, signal: controller.signal },
      );
      controller.abort();

      const result = await executionPromise;
      expect(result.success).toBe(false);
      expect(result.code).toBe('CANCELLED');
      expect(result.receipt.status).toBe('cancelled');
    });
  });
});
