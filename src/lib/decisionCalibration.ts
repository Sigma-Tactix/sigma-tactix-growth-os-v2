export interface CalibrationCaseMetadata {
  id?: string;
  locale?: string;
  expected?: string | number | boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CalibrationObservation {
  id: string;
  expected: string | number | boolean;
  predicted: string | number | boolean;
  confidence: number;
}

export function validateCalibrationCase(value: CalibrationCaseMetadata): { valid: true } | { valid: false; reason: string } {
  if (!value.id || !value.locale || value.expected === undefined) {
    return { valid: false, reason: 'id, locale, and expected are required' };
  }
  if (!value.approvedBy || !value.approvedAt) {
    return { valid: false, reason: 'approvedBy and approvedAt are required' };
  }
  if (!Number.isFinite(Date.parse(value.approvedAt))) {
    return { valid: false, reason: 'approvedAt must be an ISO timestamp' };
  }
  return { valid: true };
}

export function evaluateDecisionCalibration(observations: CalibrationObservation[], threshold: number) {
  const boundedThreshold = Math.max(0, Math.min(1, threshold));
  const correct = observations.filter(item => item.expected === item.predicted).length;
  const eligible = observations.filter(item => item.confidence >= boundedThreshold);
  const eligibleCorrect = eligible.filter(item => item.expected === item.predicted).length;
  const total = observations.length;
  return {
    total,
    correct,
    threshold: boundedThreshold,
    accuracy: total ? correct / total : 0,
    automaticallyEligible: eligible.length,
    automaticCoverage: total ? eligible.length / total : 0,
    eligibleAccuracy: eligible.length ? eligibleCorrect / eligible.length : 0,
  };
}
