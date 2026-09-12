import { describe, it, expect } from 'vitest';
import {
  calculateTokenCost,
  estimateTokens,
  computeProfitability,
  aggregateTelemetry,
  MODEL_PRICING
} from './tokenCostEngine';
import { TokenUsageRecord } from '../types';

describe('tokenCostEngine', () => {
  it('calculates exact cost for Gemini 2.5 Flash tokens', () => {
    // 1,000,000 prompt tokens @ $0.075 + 1,000,000 candidate tokens @ $0.30 = $0.375
    const cost1M = calculateTokenCost('gemini-2.5-flash', 1_000_000, 1_000_000);
    expect(cost1M).toBe(0.375);

    // 10,000 prompt tokens + 2,000 candidate tokens
    // 10,000 * 0.000000075 = 0.00075
    // 2,000 * 0.00000030 = 0.0006
    // total = 0.00135
    const costSmall = calculateTokenCost('gemini-2.5-flash', 10_000, 2_000);
    expect(costSmall).toBe(0.00135);
  });

  it('calculates exact cost for Gemini 1.5 Pro tokens', () => {
    // 1,000,000 prompt tokens @ $1.25 + 1,000,000 candidate tokens @ $5.00 = $6.25
    const cost = calculateTokenCost('gemini-1.5-pro', 1_000_000, 1_000_000);
    expect(cost).toBe(6.25);
  });

  it('calculates token costs across all frontier and open-weight models', () => {
    // DeepSeek V3: $0.14 in / $0.28 out
    const dsCost = calculateTokenCost('deepseek-v3', 1_000_000, 1_000_000);
    expect(dsCost).toBe(0.42);

    // Qwen 2.5 72B: $0.35 in / $0.70 out
    const qwenCost = calculateTokenCost('qwen-2.5-72b', 1_000_000, 1_000_000);
    expect(qwenCost).toBe(1.05);

    // xAI Grok-2: $2.00 in / $10.00 out
    const grokCost = calculateTokenCost('grok-2-1212', 1_000_000, 1_000_000);
    expect(grokCost).toBe(12.00);

    // OpenAI GPT-4o: $2.50 in / $10.00 out
    const gptCost = calculateTokenCost('gpt-4o', 1_000_000, 1_000_000);
    expect(gptCost).toBe(12.50);

    // Claude 3.5 Sonnet: $3.00 in / $15.00 out
    const claudeCost = calculateTokenCost('claude-3-5-sonnet', 1_000_000, 1_000_000);
    expect(claudeCost).toBe(18.00);

    // GLM-4 Flash: $0.01 in / $0.01 out
    const glmCost = calculateTokenCost('glm-4-flash', 1_000_000, 1_000_000);
    expect(glmCost).toBe(0.02);
  });

  it('estimates token count from text length', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('test')).toBe(1);
    expect(estimateTokens('This is a test prompt with several words.')).toBeGreaterThan(5);
  });

  it('computes agency client profitability and margins correctly', () => {
    const metrics = computeProfitability(
      'growth',
      'Growth OS',
      1499,   // Monthly retainer
      4.50,   // AI Token cost
      35.00   // Cloud overhead
    );

    // Net profit = 1499 - 4.50 - 35 = 1459.50
    expect(metrics.netProfitUsd).toBe(1459.50);
    // Gross margin = (1459.5 / 1499) * 100 = ~97.4%
    expect(metrics.grossMarginPct).toBe(97.4);
    // ROI multiplier = 1499 / 39.5 = ~37.9x
    expect(metrics.roiMultiplier).toBeGreaterThan(35);
  });

  it('aggregates telemetry records into models, actions, and agents breakdowns', () => {
    const sampleRecords: TokenUsageRecord[] = [
      {
        id: 'rec-1',
        workspaceId: 'ws-1',
        agentId: 'oracle-05',
        actionType: 'AGENT_EXECUTION',
        provider: 'gemini',
        modelName: 'gemini-2.5-flash',
        promptTokens: 5000,
        candidateTokens: 1000,
        totalTokens: 6000,
        estimatedCostUsd: 0.000675,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        workspaceId: 'ws-1',
        agentId: 'oracle-05',
        actionType: 'CREATIVE_STUDIO',
        provider: 'gemini',
        modelName: 'gemini-2.5-flash',
        promptTokens: 8000,
        candidateTokens: 2000,
        totalTokens: 10000,
        estimatedCostUsd: 0.0012,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      }
    ];

    const summary = aggregateTelemetry(sampleRecords, 'growth', 'Growth OS', 1499);

    expect(summary.totalCalls).toBe(2);
    expect(summary.totalTokens).toBe(16000);
    expect(summary.promptTokens).toBe(13000);
    expect(summary.candidateTokens).toBe(3000);
    expect(summary.byModel['gemini-2.5-flash'].calls).toBe(2);
    expect(summary.byAction['AGENT_EXECUTION'].calls).toBe(1);
    expect(summary.byAction['CREATIVE_STUDIO'].calls).toBe(1);
    expect(summary.byAgent['oracle-05'].calls).toBe(2);
    expect(summary.profitability.monthlyRetainerUsd).toBe(1499);
  });
});
