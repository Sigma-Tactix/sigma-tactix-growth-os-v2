import { describe, expect, it } from 'vitest';
import { evaluateDecisionCalibration, validateCalibrationCase } from './decisionCalibration';

describe('Laya calibration evaluation', () => {
  it('rejects cases without a human-approved expected decision', () => {
    expect(validateCalibrationCase({ id: 'case-1', locale: 'en', expected: 'HIGH' })).toMatchObject({
      valid: false,
      reason: 'approvedBy and approvedAt are required',
    });
  });

  it('measures accuracy and automatic coverage at a proposed confidence threshold', () => {
    const report = evaluateDecisionCalibration([
      { id: 'a', expected: 'HIGH', predicted: 'HIGH', confidence: 0.9 },
      { id: 'b', expected: 'LOW', predicted: 'MEDIUM', confidence: 0.8 },
      { id: 'c', expected: 'MEDIUM', predicted: 'MEDIUM', confidence: 0.6 },
    ], 0.75);

    expect(report).toMatchObject({
      total: 3,
      correct: 2,
      accuracy: 2 / 3,
      automaticallyEligible: 2,
      automaticCoverage: 2 / 3,
      eligibleAccuracy: 0.5,
    });
  });
});
