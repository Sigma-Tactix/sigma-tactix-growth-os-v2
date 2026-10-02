/**
 * Phase 2: how a claim is presented to a human, and the disclosure line that
 * travels with every exported artifact.
 *
 * Centralised so the wording cannot drift between the audit screen, the
 * exported plan, and a future PDF: "Estimate" must always mean the same thing
 * wherever a client reads it.
 */
import type { ClaimClassification } from "./evidenceContract.js";

/** Required on every client-facing output. Keep it short and unambiguous. */
export const AI_DISCLOSURE_LINE =
  "AI-generated content. AI can make mistakes — verify before acting on it.";

export type ClaimTone = 'measured' | 'derived' | 'estimated' | 'speculative' | 'unavailable';

export interface ClaimLabel {
  label: string;
  tone: ClaimTone;
  /** One line explaining what the label actually means. */
  explanation: string;
}

/**
 * The client-facing meaning of each classification.
 *
 * "Readiness assessment" (the old wording) hid the fact that a number was a
 * model's judgement. "Model estimate" says it plainly.
 */
const LABELS: Record<ClaimClassification, ClaimLabel> = {
  measured_fact: {
    label: 'Measured',
    tone: 'measured',
    explanation: 'Observed directly from a connected data source.',
  },
  calculation: {
    label: 'Calculated',
    tone: 'derived',
    explanation: 'Derived by a documented calculation from measured inputs.',
  },
  estimate: {
    label: 'Model estimate',
    tone: 'estimated',
    explanation:
      "A specialist model's judgement based on the evidence listed. It is not a measured value and should not be quoted as one.",
  },
  hypothesis: {
    label: 'Hypothesis to test',
    tone: 'speculative',
    explanation: 'A suggested explanation that has not yet been supported by evidence.',
  },
  unavailable: {
    label: 'Not available',
    tone: 'unavailable',
    explanation: 'No evidence could be observed. This is not a zero or a negative result.',
  },
};

export function claimLabel(classification?: ClaimClassification): ClaimLabel {
  if (!classification) {
    return {
      label: 'Unclassified',
      tone: 'estimated',
      explanation: 'This claim has not been through evidence review.',
    };
  }
  return LABELS[classification] || LABELS.estimate;
}

/** Maps a claim's tone onto the Badge variants this UI supports. */
export function claimToneBadge(tone: ClaimTone): 'success' | 'warning' | 'info' | 'neutral' {
  switch (tone) {
    case 'measured':
      return 'success';
    case 'derived':
      return 'info';
    case 'estimated':
    case 'speculative':
      return 'warning';
    default:
      return 'neutral';
  }
}

/**
 * Renders the headline score for a client, refusing to print a bare number when
 * no score could be computed. A null score is an admission, not a zero.
 */
export function formatAuditScoreLine(params: {
  score: number | null;
  basis?: string;
}): string {
  if (params.score === null || params.score === undefined) {
    return `Diagnostic score: not available — ${params.basis || 'no evidence could be observed for this audit.'}`;
  }
  const basis = params.basis ? ` (${params.basis})` : '';
  return `Diagnostic score: ${params.score}/100${basis}`;
}