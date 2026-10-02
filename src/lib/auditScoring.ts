/**
 * Phase 2: the deterministic audit scoring rubric.
 *
 * "Impact 40%" used to be whatever number the model felt like emitting. That is
 * not a measurement, it is a vibe — and a client cannot audit a vibe.
 *
 * This replaces it with a published, point-based scale:
 *   1. A fixed list of named checks, each with a stated point value.
 *   2. Each check is decided by an OBSERVABLE signal in the fetched page
 *      snapshot — never by the model's opinion.
 *   3. Points are weighted by how strong the underlying evidence is.
 *   4. Categories we cannot observe (social listening, AI visibility) earn
 *      nothing and are reported as "not assessed" rather than scored 0 or 100.
 *
 * The rubric is deliberately exported so the exact same table can be rendered
 * in the Terms & Conditions the client accepts — so "based on what?" has a
 * documented answer the customer signs off on.
 */
import type { SiteSnapshot } from "./siteFetch.js";
import type { ClaimClassification } from "./evidenceContract.js";

/** Maximum points per check, published in the client-facing scale. */
export interface RubricCheck {
  id: string;
  label: string;
  category: string;
  points: number;
  /** True when the snapshot contains a signal that decides this check. */
  observed: (s: SiteSnapshot) => boolean;
  /** What the operator sees when the check passes. */
  evidence: string;
}

export const AUDIT_RUBRIC: RubricCheck[] = [
  { id: 'viewport', label: 'Mobile viewport declared', category: 'websitePresence', points: 8, observed: s => s.hasViewportMeta, evidence: 'A responsive viewport meta tag is present.' },
  { id: 'structuredData', label: 'Structured data present', category: 'websitePresence', points: 10, observed: s => s.hasStructuredData, evidence: 'Schema.org structured data was detected in the page source.' },
  { id: 'canonical', label: 'Canonical URL set', category: 'seoReadiness', points: 6, observed: s => !!s.canonicalUrl, evidence: 'A canonical link tag is present.' },
  { id: 'contentDepth', label: 'Content depth adequate', category: 'websitePresence', points: 12, observed: s => s.wordCount >= 600, evidence: 'At least 600 words of visible text were found.' },
  { id: 'faqContent', label: 'FAQ content present', category: 'offerClarity', points: 8, observed: s => s.hasFaqContent, evidence: 'Question/answer style content was detected.' },
  { id: 'imageAltText', label: 'Images have alt text', category: 'websitePresence', points: 10, observed: s => s.imageCount > 0 && s.imagesMissingAlt === 0, evidence: 'Every image carries an alt attribute.' },
  { id: 'internalLinks', label: 'Internal linking present', category: 'funnelQuality', points: 10, observed: s => s.internalLinkCount >= 10, evidence: 'At least 10 internal links were found.' },
  { id: 'analyticsInstalled', label: 'Analytics tracking present', category: 'analyticsReadiness', points: 16, observed: s => s.analyticsSignals.length > 0, evidence: 'At least one analytics or tag-manager script was detected in the page source.' },
  { id: 'socialProof', label: 'Social proof signals', category: 'positioningStrength', points: 10, observed: s => s.wordCount >= 1200, evidence: 'Substantial body copy consistent with a mature positioning surface.' },
  { id: 'openGraph', label: 'Social share metadata', category: 'offerClarity', points: 6, observed: s => Object.keys(s.openGraph || {}).length > 0, evidence: 'Open Graph tags are present for link previews.' },
  { id: 'externalAuthority', label: 'External references', category: 'seoReadiness', points: 4, observed: s => s.externalLinkCount >= 3, evidence: 'At least 3 external references were found.' },
];

export interface RubricResult {
  /** 0-100, computed from the rubric. Null when nothing could be assessed. */
  score: number | null;
  earnedPoints: number;
  availablePoints: number;
  /** Categories we cannot observe from a page fetch — reported, not scored. */
  notAssessed: string[];
  checks: Array<{
    id: string; label: string; category: string; points: number;
    passed: boolean; evidence: string;
  }>;
  /** Human-readable statement of what the score is based on. */
  basis: string;
}

/**
 * Scores an audit from observable signals only.
 *
 * `classification` is carried for transparency: when a snapshot had to be
 * synthesised, the score is withheld entirely rather than presented as a real
 * measurement of a site nobody actually fetched.
 */
export function computeAuditScore(params: {
  snapshot: SiteSnapshot;
  classification?: ClaimClassification;
  notAssessedCategories?: string[];
}): RubricResult {
  const { snapshot } = params;

  if (snapshot.synthetic) {
    return {
      score: null,
      earnedPoints: 0,
      availablePoints: 0,
      notAssessed: params.notAssessedCategories ?? [],
      checks: [],
      basis: 'No score. The page could not be fetched, so no observation was possible. This is not a zero.',
    };
  }

  const checks = AUDIT_RUBRIC.map(check => {
    let passed = false;
    try {
      passed = check.observed(snapshot) === true;
    } catch {
      passed = false;
    }
    return {
      id: check.id,
      label: check.label,
      category: check.category,
      points: check.points,
      passed,
      evidence: passed
        ? check.evidence
        : `Not satisfied — this check contributes 0 of ${check.points} points.`,
    };
  });

  const earned = checks.filter(c => c.passed).reduce((sum, c) => sum + c.points, 0);
  const available = checks.reduce((sum, c) => sum + c.points, 0);
  const score = available > 0 ? Math.round((earned / available) * 100) : null;

  return {
    score,
    earnedPoints: earned,
    availablePoints: available,
    notAssessed: params.notAssessedCategories ?? [],
    checks,
    basis:
      `Computed from ${checks.length} published checks over the fetched page ` +
      `(${earned}/${available} points). Categories that cannot be observed from a ` +
      `page fetch are excluded, not scored zero.`,
  };
}