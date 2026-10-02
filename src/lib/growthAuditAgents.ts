import { GoogleGenAI, Type } from "@google/genai";
import type { GrowthFinding, GrowthFindingCategory, SecondBrain } from "../types.js";
import type { SiteSnapshot } from "./siteFetch.js";
import { summarizeSnapshotForPrompt } from "./siteFetch.js";
import { buildAuditClaimEvidence } from "./auditClaimEvidence.js";

// Growth Audit Engine — one specialized agent persona per finding category,
// each run as its own real Gemini call (not one call role-playing 8
// personas), so "every AI Agent must focus on every bit of the audit ...
// locked in on that particular task" is literally true. Categories with no
// connected live-data source (social listening, LLM-citation tracking) are
// explicitly labeled 'placeholder' — the agent still runs and reasons from
// the site content available, but the UI must not present its numbers as
// measured fact.

export interface AuditCategoryConfig {
  key: GrowthFindingCategory;
  title: string;
  agentPersona: string;
  focus: string;
  dataSource: "live" | "placeholder";
}

export const AUDIT_CATEGORIES: AuditCategoryConfig[] = [
  {
    key: "websitePresence",
    title: "Website Presence & CRO",
    agentPersona: "Website Experience Auditor",
    focus: "homepage clarity, calls-to-action, conversion friction, and mobile responsiveness signals visible in the fetched HTML",
    dataSource: "live",
  },
  {
    key: "seoReadiness",
    title: "SEO Keywords & Indices",
    agentPersona: "Technical SEO Auditor",
    focus: "title/meta quality, heading structure, internal linking depth, and indexability signals",
    dataSource: "live",
  },
  {
    key: "offerClarity",
    title: "Offer Positioning",
    agentPersona: "Offer & Pricing Strategist",
    focus: "clarity of the offer, pricing presentation, and value proposition as expressed on the page",
    dataSource: "live",
  },
  {
    key: "positioningStrength",
    title: "Brand Slogan Effectiveness",
    agentPersona: "Brand Positioning Strategist",
    focus: "headline/slogan strength, differentiation versus generic competitor language, and proof points present",
    dataSource: "live",
  },
  {
    key: "funnelQuality",
    title: "Funnel & Conversion Drops",
    agentPersona: "Conversion Funnel Analyst",
    focus: "signup/contact/lead-capture flow friction, form length, and trust signals near conversion points",
    dataSource: "live",
  },
  {
    key: "analyticsReadiness",
    title: "Analytics Instrumentation",
    agentPersona: "Analytics Instrumentation Auditor",
    focus: "which tracking/analytics scripts were actually detected on the page and what's missing for funnel visibility",
    dataSource: "live",
  },
  {
    key: "socialMediaPresence",
    title: "Social Media Footprint",
    agentPersona: "Social Presence Analyst",
    focus: "social profile links and social-proof signals findable ON the site itself — no live social listening API is connected yet, so reason only from what the page exposes and say so",
    dataSource: "placeholder",
  },
  {
    key: "aiVisibility",
    title: "Generative Engine Visibility (AEO)",
    agentPersona: "AEO / Generative Visibility Analyst",
    focus: "FAQ/answer-format content, schema markup, and citation-readiness for LLM answer engines — no live citation-tracking API is connected yet, so reason only from on-page readiness signals and say so",
    dataSource: "placeholder",
  },
];

const FINDING_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "2-3 sentence finding, specific to what was actually observed." },
    insight: { type: Type.STRING, description: "One sharp, quotable key insight." },
    impactPct: { type: Type.INTEGER, description: "Estimated improvement potential if fixed, 1-100." },
    quickSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 concrete, immediately actionable steps a marketer could start today.",
    },
  },
  required: ["text", "insight", "impactPct", "quickSteps"],
};

function brainContextBlock(brain: SecondBrain): string {
  return `
Brand positioning: ${brain.brandVault.corePositioning}
Voice & tone: ${brain.brandVault.voiceAndTone}
Ideal customer profile: ${brain.customerVault.idealCustomerProfile}
`.trim();
}

export async function runCategoryAgent(
  client: GoogleGenAI,
  model: string,
  category: AuditCategoryConfig,
  snapshot: SiteSnapshot,
  brain: SecondBrain,
  ragContext: string,
  context: { workspaceId: string },
): Promise<GrowthFinding> {
  const placeholderNote =
    category.dataSource === "placeholder"
      ? "\nIMPORTANT: No live data source is connected for this category — you only have the fetched page's own content to reason from. Be explicit in `text` that this is a page-content-only read, not measured external data."
      : "";

  const prompt = `
You are the "${category.agentPersona}" — a specialized growth audit agent whose ONLY job is ${category.focus}.
Do not comment on anything outside your focus area.${placeholderNote}

Real fetched site data:
${summarizeSnapshotForPrompt(snapshot)}

Client brand context (for tone/relevance, not the subject of your audit):
${brainContextBlock(brain)}
${ragContext ? `\nRelevant Second Brain notes:\n${ragContext}` : ""}

Produce your finding as JSON.
  `.trim();

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: FINDING_RESPONSE_SCHEMA },
  });

  const parsed = JSON.parse(response.text || "{}");
  const impactPct = Math.max(1, Math.min(100, Number(parsed.impactPct) || 10));
  const text = parsed.text || "No finding generated.";

  // Phase 2: every audit claim carries the evidence behind it, and a label for
  // what kind of claim it is. "impact 40%" is a model ESTIMATE over a fetched
  // page — it must never reach a client screen looking like a measurement.
  const claim = buildAuditClaimEvidence({
    claimId: `finding-${category.key}`,
    workspaceId: context.workspaceId,
    statement: text,
    claimedPercentage: impactPct,
    snapshotUrl: snapshot.url,
    // A synthetic snapshot is generated content standing in for a crawl that
    // failed — it supports nothing as evidence.
    isSyntheticSnapshot: snapshot.synthetic === true,
    hasLiveDataSource: category.dataSource !== "placeholder" && snapshot.synthetic !== true,
    observedAt: snapshot.fetchedAt || new Date().toISOString(),
  });

  return {
    id: `finding-${category.key}`,
    category: category.key,
    title: category.title,
    text,
    insight: parsed.insight || "",
    impactPct,
    quickSteps: Array.isArray(parsed.quickSteps) ? parsed.quickSteps.slice(0, 5) : [],
    dataSource: category.dataSource,
    claimClassification: claim.classification,
    evidenceIds: claim.evidence.map(e => e.id),
  };
}

const SYNTHESIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Overall growth readiness score, 0-100." },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          impact: { type: Type.STRING, description: "High, Medium, or Low" },
          effort: { type: Type.STRING, description: "High, Medium, or Low" },
          description: { type: Type.STRING },
          quickSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["id", "category", "title", "impact", "effort", "description", "quickSteps"],
      },
    },
    roadmap90Day: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          title: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["phase", "title", "tasks"],
      },
    },
  },
  required: ["score", "recommendations", "roadmap90Day"],
};

export async function runSynthesisAgent(
  client: GoogleGenAI,
  model: string,
  findings: GrowthFinding[],
  domain: string,
): Promise<{ score: number; recommendations: any[]; roadmap90Day: any[] }> {
  const prompt = `
You are the Growth Architect synthesizing 8 specialist audit findings for ${domain} into an
executive-ready output. Findings (category, impact%, text):
${findings.map(f => `- [${f.title}] impact ${f.impactPct}%: ${f.text}`).join("\n")}

Produce:
1. An overall growth readiness score (0-100), weighted toward the highest-impact findings.
2. 3-4 priority recommendations (each with id, category, title, impact, effort, description, and 3-5 quickSteps) that address the highest-impact findings first.
3. A 90-day roadmap in 3 phases (Days 1-30, 31-60, 61-90).
Tone: authoritative, professional enterprise growth consulting — no hype words.
  `.trim();

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: SYNTHESIS_SCHEMA },
  });
  return JSON.parse(response.text || "{}");
}
