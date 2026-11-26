import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { Type } from '@google/genai';
import { saveDocument, searchDocuments } from '../../lib/rag.js';
import { fetchSiteContent, summarizeSnapshotForPrompt, createSyntheticSnapshot } from '../../lib/siteFetch.js';
import { captureAndStoreAuditScreenshots, ScreenshotCapacityError, type AuditScreenshots } from '../../lib/screenshot.js';
import { BoundedWorkflowGraph } from '../../lib/boundedWorkflowGraph.js';
import { computeArtifactSha256, type ClaimClassification } from '../../lib/evidenceContract.js';
import { detectClaimDiscrepancies, buildReviewerPacket, parseReviewerVerdict, applyReviewVerdict, type ClaimUnderReview } from '../../lib/auditConsistency.js';
import { buildGrowthStrategies } from '../../lib/growthStrategy.js';
import { computeAuditScore } from '../../lib/auditScoring.js';
import { AUDIT_CATEGORIES, runCategoryAgent, runSynthesisAgent } from '../../lib/growthAuditAgents.js';
import { estimateTokens } from '../../lib/tokenCostEngine.js';
import { startNodeAttempt, finishNodeAttempt } from '../../lib/executionLedgerStore.js';
import type { WorkspaceData, ContentAsset, GrowthAudit, UIUXAudit } from '../../types.js';

// ---------------------------------------------------------------------------
// AI-provider / content-generation — run-diagnostic, run-uiux, generate-content.
// The three expensive Gemini-swarm routes: each is rate-limited
// (expensiveLimiter) and tier-gated (requireModule("growth"/"uiux"/"content")),
// pulls the request-scoped Second Brain, runs a live Gemini pass with a
// structured responseSchema, mirrors the result into RAG, records token usage
// on the ledger, and falls back to an honest mock when no key is configured.
//
// Extracted from server.ts (P2 increment 13 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Handler bodies byte-preserved. The in-file
// Gemini helpers (getGeminiClient / resolveEffectiveGeminiKey /
// resolveEffectiveGeminiModel / classifyGeminiError), recordTokenUsage,
// request-scoped getDB/saveDB, expensiveLimiter and requireModule are
// INJECTED — they stay in server.ts, which owns them. Type, saveDocument,
// crypto and the domain types import directly. Mounted under /api/workspace
// AFTER the global app.use("/api/workspace", requireAuth); the per-route
// expensiveLimiter + requireModule(...) layers are preserved in order.
// ---------------------------------------------------------------------------

export interface ContentAiRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
  getGeminiClient: (key?: string) => any;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string | undefined>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  classifyGeminiError: (err: any) => string;
  recordTokenUsage: (res: Response, params: any) => Promise<any>;
  getGrowthProviderSnapshots: () => Promise<any[]>;
  expensiveLimiter: any;
  requireModule: (mod: string) => any;
}

export function createContentAiRouter(deps: ContentAiRouterDeps): Router {
  const router = Router();
  const {
    getDB,
    saveDB,
    getGeminiClient,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    classifyGeminiError,
    recordTokenUsage,
    expensiveLimiter,
    requireModule,
    getGrowthProviderSnapshots,
  } = deps;

router.post('/run-diagnostic', expensiveLimiter, requireModule("growth"), async (req: Request, res: Response) => {
  const { domain } = req.body as { domain?: string };
  const db = await getDB(res);
  const brain = db.secondBrain;
  const targetDomain = (domain || "").replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim() || "sigmatactix.com";

  const geminiKey = await resolveEffectiveGeminiKey(res);

  if (geminiKey) {
    let snapshot;
    let usedSyntheticSnapshot = false;
    try {
      snapshot = await fetchSiteContent(targetDomain);
    } catch (err: any) {
      console.warn(`Direct site fetch for ${targetDomain} had issue (${err.message}). Using synthetic heuristic snapshot.`);
      snapshot = createSyntheticSnapshot(targetDomain);
      usedSyntheticSnapshot = true;
    }

    try {
      const diagnosticStartTime = Date.now();
      const client = getGeminiClient(geminiKey);
      const model = await resolveEffectiveGeminiModel(res);

      let ragContext = "";
      try {
        const matches = await searchDocuments(res.locals.sb, res.locals.wsId, `${targetDomain} growth audit context`, { topK: 3 });
        ragContext = matches.map(m => `- (${m.sourceModule}) ${m.contentText?.slice(0, 400)}`).join("\n");
      } catch (err) {
        console.error("RAG lookup failed, continuing without it:", err);
      }

      // Phase 2 §6: the audit runs as a real DAG.
      //
      // Two nodes, not eight sequential ones: the 8 specialists are ONE logical
      // fan-out stage that stays parallel (making them sequential would make the
      // audit 8x slower for no benefit), and `synthesis` declares a dependency on it.
      //
      // The behaviour that changes: if any specialist fails, `synthesis` is BLOCKED
      // rather than being handed partial findings. Previously `Promise.all` rejected
      // the whole request; now the block is explicit, recorded, and the route can say
      // which categories are missing rather than dying on an opaque rejection.
      const auditRunId = `audit-${crypto.randomUUID()}`;
      const auditSb = res.locals.sb;
      const auditWsId = res.locals.wsId;

      const auditWorkflow = new BoundedWorkflowGraph({
        workspaceId: auditWsId,
        nodes: [
          {
            id: "specialists",
            title: "Run specialist category agents",
            inputSchema: "v1:site-snapshot",
            outputSchema: "v1:category-findings",
            permittedTools: ["gemini_generate", "second_brain_rag"],
            timeoutMs: 180000,
            maxRetries: 1,
            dependencies: [],
            execute: async () => {
              const attemptId = await startNodeAttempt(auditSb, auditWsId, auditRunId, {
                nodeId: "audit:specialists",
                executorVersion: `gemini:${model}`,
              }).catch(() => null);

              try {
                const settled = await Promise.allSettled(
                  AUDIT_CATEGORIES.map((category) =>
                    runCategoryAgent(client, model, category, snapshot, brain, ragContext, {
                      workspaceId: auditWsId,
                    })
                  )
                );

                const failed = settled
                  .map((r, i) => ({ r, category: AUDIT_CATEGORIES[i] }))
                  .filter(({ r }) => r.status === "rejected")
                  .map(({ r, category }) => `${category.key}: ${(r as PromiseRejectedResult).reason?.message || "failed"}`);

                if (failed.length > 0) {
                  // Partial specialist results must not be synthesised as if they
                  // were the whole picture.
                  await finishNodeAttempt(auditSb, auditWsId, attemptId || "", { error: failed.join("; ") }).catch(() => { });
                  return { status: "failed" as const, error: failed.join("; "), findings: [] } as any;
                }

                const generated = (settled as PromiseFulfilledResult<any>[]).map((r) => r.value);
                const findings = usedSyntheticSnapshot
                  ? generated.map((f) => ({ ...f, dataSource: "placeholder" as const }))
                  : generated;

                await finishNodeAttempt(auditSb, auditWsId, attemptId || "", {}).catch(() => { });
                return {
                  status: "succeeded" as const,
                  outputArtifactId: `${auditRunId}:specialists`,
                  outputArtifactHash: computeArtifactSha256(JSON.stringify(findings)),
                  findings,
                  findingsSummary: findings,
                } as any;
              } catch (err: any) {
                const message = classifyGeminiError(err);
                await finishNodeAttempt(auditSb, auditWsId, attemptId || "", { error: message }).catch(() => { });
                return { status: "failed" as const, error: message, findings: [] } as any;
              }
            },
          },
          {
            id: "synthesis",
            title: "Synthesize findings into recommendations",
            inputSchema: "v1:category-findings",
            outputSchema: "v1:synthesis-result",
            permittedTools: ["gemini_generate"],
            timeoutMs: 120000,
            maxRetries: 1,
            dependencies: ["specialists"],
            execute: async (_ctx, upstream) => {
              const attemptId = await startNodeAttempt(auditSb, auditWsId, auditRunId, {
                nodeId: "audit:synthesis",
                executorVersion: `gemini:${model}`,
              }).catch(() => null);
              try {
                // Upstream findings come from the dependency that actually ran, not
                // from a variable populated alongside it.
                const upstreamFindings = (upstream.specialists as any)?.findingsSummary || [];
                const synthesis = await runSynthesisAgent(client, model, upstreamFindings, snapshot.finalUrl);
                await finishNodeAttempt(auditSb, auditWsId, attemptId || "", {}).catch(() => { });
                return {
                  status: "succeeded" as const,
                  outputArtifactId: `${auditRunId}:synthesis`,
                  outputArtifactHash: computeArtifactSha256(JSON.stringify(synthesis)),
                  synthesis,
                } as any;
              } catch (err: any) {
                const message = classifyGeminiError(err);
                await finishNodeAttempt(auditSb, auditWsId, attemptId || "", { error: message }).catch(() => { });
                return { status: "failed" as const, error: message, findings: [] } as any;
              }
            },
          },
        ],
      });

      const auditExecution = await auditWorkflow.run();

      const specialistsResult = auditExecution.nodeResults.specialists as any;
      const synthesisResult = auditExecution.nodeResults.synthesis as any;
      const findings: any[] = specialistsResult?.findingsSummary || [];
      const synthesis = synthesisResult?.synthesis;

      if (auditExecution.status !== "succeeded" || !synthesis) {
        res.status(502).json({
          success: false,
          error:
            auditExecution.error ||
            "Audit did not complete. Specialists or synthesis did not run to completion.",
          auditRunId,
          workflowStatus: auditExecution.status,
          nodeResults: auditExecution.nodeResults,
        });
        return;
      }

      // Phase 2 §6: cross-claim consistency. Contradicting evidence is reported
      // with both references and is NEVER resolved by counting votes. Claims
      // with a single observation are reported as unchecked, not as confirmed.
      const claimsUnderReview: ClaimUnderReview[] = findings.map((f: any) => ({
        claimId: f.id,
        claimText: f.text,
        classification: (f.claimClassification || "estimate") as ClaimClassification,
        evidence: [
          {
            id: `${f.id}-site_snapshot`,
            workspaceId: res.locals.wsId,
            claimId: f.id,
            claimClassification: "measured_fact",
            claimText: f.text,
            dataSource: f.dataSource === "live" ? "connector" : "manual_audit",
            sourceLocator: snapshot.url,
            coveredPeriod: { start: auditRunId, end: auditRunId },
            observationTime: snapshot.fetchedAt || new Date().toISOString(),
            retrievalResult: snapshot.synthetic ? "simulated" : "success",
            scope: "page_content_snapshot",
            confidence: 0.5,
            numericValue: f.impactPct,
          },
        ],
        findingIds: [f.id],
      }));

      const discrepancies = detectClaimDiscrepancies(claimsUnderReview);

      // Phase 2 §6 independent review: a separate model pass that sees the claim,
      // its evidence and the acceptance rules — but NOT the specialist's reasoning —
      // and whose verdict may only LOWER a claim's classification. Refused upgrades
      // are recorded on the audit, so it stays visible that a reviewer tried and was
      // overruled rather than being silently ignored.
      const reviewedFindings: any[] = findings.map((f: any) => ({ ...f }));
      const refusedUpgrades: Array<{ claimId: string; from: string; to: string; rationale?: string }> = [];

      for (const underReview of claimsUnderReview) {
        const packet = buildReviewerPacket(underReview);
        const target = reviewedFindings.find((f: any) => f.id === packet.claimId);
        try {
          const reviewClient = getGeminiClient(await resolveEffectiveGeminiKey(res));
          const reviewModel = await resolveEffectiveGeminiModel(res);
          const response = await reviewClient.models.generateContent({
            model: reviewModel,
            contents:
              `You are an independent reviewer. You are given a claim, its evidence provenance, and the ` +
              `rules. Judge whether the claim is supported. Respond with JSON ` +
              `{"classification": one of the allowed values, "rationale": string}.\n\n` +
              `PACKET:\n${JSON.stringify(packet, null, 2)}`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  classification: {
                    type: Type.STRING,
                    enum: ["measured_fact", "calculation", "estimate", "hypothesis", "unavailable"],
                  },
                  rationale: { type: Type.STRING },
                },
                required: ["classification", "rationale"],
              },
            },
          });

          const verdict = parseReviewerVerdict(packet.claimId, response.text || "");
          const outcome = applyReviewVerdict(underReview, verdict);
          if (outcome.refusedUpgrade) {
            refusedUpgrades.push({
              claimId: packet.claimId,
              from: outcome.refusedUpgrade.from,
              to: outcome.refusedUpgrade.to,
              rationale: verdict.rationale,
            });
          }
          if (target) target.claimClassification = outcome.classification;
        } catch (err) {
          // A failed review leaves each claim exactly as the deterministic rules
          // classified it. It must never become an implicit "all claims passed".
          console.error(`Independent review failed for ${packet.claimId}; claim unchanged:`, err);
        }
      }

      // Phase 2 §6: the headline score is computed from the published rubric over
      // observable signals. The model's own score is kept off the headline —
      // `synthesis.score || 68` used to invent a 68 whenever the model returned
      // nothing, which is precisely the fabricated claim this phase removes.
      const rubric = computeAuditScore({
        snapshot,
        notAssessedCategories: findings
          .filter(f => f.dataSource === 'placeholder')
          .map(f => f.category),
      });

      const completeAudit: GrowthAudit = {
        status: "completed",
        evidenceMode: usedSyntheticSnapshot ? "heuristic" : findings.some(finding => finding.dataSource === 'placeholder') ? "mixed" : "live",
        score: rubric.score,
        scoringBasis: rubric.basis,
        scoringChecks: rubric.checks,
        notAssessedCategories: rubric.notAssessed,
        discrepancies,
        refusedUpgrades,
        domain: snapshot.finalUrl || targetDomain,
        lastAuditedAt: new Date().toISOString().split("T")[0],
        // The REVIEWED classifications, not the specialists' originals.
        findings: reviewedFindings,
        recommendations: synthesis.recommendations || [],
        roadmap90Day: synthesis.roadmap90Day || [],
      };
      completeAudit.strategies = buildGrowthStrategies(completeAudit, await getGrowthProviderSnapshots());

      db.growthAudit = completeAudit;
      await saveDB(res, db);

      const totalPromptTokens = estimateTokens(JSON.stringify(snapshot)) * 2 + estimateTokens(ragContext) * 8;
      const totalCandidateTokens = estimateTokens(JSON.stringify(findings)) + estimateTokens(JSON.stringify(synthesis));
      await recordTokenUsage(res, {
        actionType: "GROWTH_DIAGNOSTIC",
        modelName: model,
        usageMetadata: {
          promptTokenCount: totalPromptTokens,
          candidatesTokenCount: totalCandidateTokens,
          totalTokenCount: totalPromptTokens + totalCandidateTokens,
        },
        durationMs: Date.now() - diagnosticStartTime,
        metadata: { domain: snapshot.finalUrl || targetDomain, score: completeAudit.score, categoryCount: findings.length },
      });

      try {
        await saveDocument(res.locals.sb, {
          workspaceId: res.locals.wsId,
          vaultId: "audit",
          sourceModule: "growth_audit",
          fileName: `Growth Audit — ${snapshot.finalUrl || targetDomain} — ${completeAudit.lastAuditedAt}`,
          contentText: findings.map(f => `${f.title}: ${f.text}`).join("\n\n"),
        });
      } catch (err) {
        console.error("Failed to save audit into Second Brain documents (non-fatal):", err);
      }

      res.json({ success: true, growthAudit: completeAudit });
      return;
    } catch (err: any) {
      console.warn("Live Gemini audit encountered an issue, falling back to calibrated domain audit:", err.message);
    }
  }

  // A domain-hash fallback previously returned authoritative-looking findings
  // and percentages for a site that had not been inspected. No provider or
  // evidence means no completed audit.
  res.status(503).json({
    error: "Growth audit provider is unavailable. No audit was created.",
    code: "GROWTH_AUDIT_PROVIDER_UNAVAILABLE",
  });
});

// Run UI/UX Audit — real fetch + real screenshots (desktop/mobile/full-page)
// feed the Gemini analysis instead of just passing the URL string as text.
router.post('/run-uiux', expensiveLimiter, requireModule("uiux"), async (req: Request, res: Response) => {
  const { url, descriptionOfIssues } = req.body;
  const db = await getDB(res);
  const brain = db.secondBrain;

  if (process.env.GEMINI_API_KEY) {
    if (!url || !String(url).trim()) {
      res.status(400).json({ error: "A URL is required to run a UI/UX audit." });
      return;
    }

    let snapshot;
    try {
      snapshot = await fetchSiteContent(url);
    } catch (err: any) {
      res.status(422).json({ error: "Could not fetch the page: " + err.message });
      return;
    }

    // Screenshots go to the private vault-files bucket and only signed URLs are
    // persisted — see the note at the top of src/lib/screenshot.ts for why they
    // must not go into the workspace_state blob as base64.
    let screenshots: AuditScreenshots = { desktop: null, mobile: null, fullPage: null };
    try {
      screenshots = await captureAndStoreAuditScreenshots(res.locals.sb, res.locals.wsId, snapshot.finalUrl);
    } catch (err) {
      if (err instanceof ScreenshotCapacityError) {
        // Distinct from a capture failure: the box is at its Chromium limit, so
        // tell the caller to retry rather than silently downgrading to a
        // text-only audit they did not ask for.
        res.status(503).json({ error: err.message });
        return;
      }
      console.error("Screenshot capture failed (continuing with a text-only audit):", err);
    }

    try {
      const uiuxStartTime = Date.now();
      const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
      const geminiModel = await resolveEffectiveGeminiModel(res);
      const prompt = `
        You are the UX Architect of Sigma Tactix. Execute a deep UI/UX and CRO Audit on the following page,
        using the real fetched page data below — do not invent details not supported by it.
        User Described Issues: ${descriptionOfIssues || "None specified, perform general CRO audit."}

        ${summarizeSnapshotForPrompt(snapshot)}

        Our Client's Brand Guidelines:
        - Brand Position: ${brain.brandVault.corePositioning}
        - Target Audience: ${brain.customerVault.idealCustomerProfile}
        - Slogan: ${brain.brandVault.brandSlogan}

        Analyze Usability, Accessibility, Navigation flow, Mobile Responsiveness, and Conversion Friction.
        Generate an overall score (0-100), a friction rating ("High", "Medium", "Low"), and page-level recommendations for improvements.
      `;

      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              frictionRating: { type: Type.STRING, description: "High, Medium, or Low" },
              overallScore: { type: Type.INTEGER, description: "0 to 100 UX/CRO health score." },
              findings: {
                type: Type.OBJECT,
                properties: {
                  usability: { type: Type.STRING },
                  accessibility: { type: Type.STRING },
                  navigation: { type: Type.STRING },
                  mobileResponse: { type: Type.STRING },
                  conversionFriction: { type: Type.STRING }
                },
                required: ["usability", "accessibility", "navigation", "mobileResponse", "conversionFriction"]
              },
              pageLevelRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    page: { type: Type.STRING, description: "Element or component name" },
                    issue: { type: Type.STRING },
                    solution: { type: Type.STRING },
                    impact: { type: Type.STRING, description: "High, Medium, or Low" }
                  },
                  required: ["page", "issue", "solution", "impact"]
                }
              }
            },
            required: ["frictionRating", "overallScore", "findings", "pageLevelRecommendations"]
          }
        }
      });

      const auditResult: UIUXAudit = JSON.parse(response.text || "{}");
      auditResult.url = snapshot.finalUrl;
      auditResult.lastAuditedAt = new Date().toISOString().split('T')[0];
      auditResult.screenshots = screenshots;

      db.uiuxAudit = auditResult;
      await saveDB(res, db);

      await recordTokenUsage(res, {
        actionType: "UIUX_AUDIT",
        modelName: geminiModel,
        usageMetadata: (response as any).usageMetadata,
        promptText: prompt,
        responseText: response.text,
        durationMs: Date.now() - uiuxStartTime,
        metadata: { url: snapshot.finalUrl, score: auditResult.overallScore, friction: auditResult.frictionRating },
      });

      try {
        await saveDocument(res.locals.sb, {
          workspaceId: res.locals.wsId,
          vaultId: "audit",
          sourceModule: "uiux_audit",
          fileName: `UI/UX Audit — ${snapshot.finalUrl} — ${auditResult.lastAuditedAt}`,
          contentText: Object.entries(auditResult.findings).map(([k, v]) => `${k}: ${v}`).join("\n\n"),
        });
      } catch (err) {
        console.error("Failed to save UI/UX audit into Second Brain documents (non-fatal):", err);
      }

      res.json({ success: true, uiuxAudit: auditResult });
    } catch (err: any) {
      console.error("Gemini UI/UX Audit failed:", err);
      res.status(500).json({ error: classifyGeminiError(err) });
    }
  } else {
    // A provider-less UI/UX run used to return a fixed 61/100 audit and made
    // it look as though a client page had been inspected. Fail closed: the
    // caller can use the deterministic CRO proposal flow, but no model audit
    // exists until a verified provider is available.
    res.status(503).json({
      error: "UI/UX audit provider is unavailable. No audit was created.",
      code: "UIUX_PROVIDER_UNAVAILABLE",
    });
  }
});

// Generate Content using Gemini
router.post('/generate-content', expensiveLimiter, requireModule("content"), async (req: Request, res: Response) => {
  const { title, channel, assetType, brief } = req.body;
  const db = await getDB(res);
  const brain = db.secondBrain;
  const client = getGeminiClient(await resolveEffectiveGeminiKey(res));
  const geminiModel = await resolveEffectiveGeminiModel(res);

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
        You are the Head Copywriter & Creative Director for Sigma Tactix.
        Asset Title: ${title}
        Channel: ${channel}
        Asset Type: ${assetType}
        Target Brief / Context: ${brief.context}
        Creative Direction & Tone: ${brief.direction}
        Emotions & Expression: ${brief.emotions}
        Campaign Objective: ${brief.objective}
        Core Offer / CTA: ${brief.offer}
        
        Client's Brand Guidelines:
        - Voice and Tone: ${brain.brandVault.voiceAndTone}
        - Core Positioning: ${brain.brandVault.corePositioning}
        - Key Messages: ${brain.brandVault.keyMessages.join(" | ")}
        - Target Audience: ${brain.customerVault.idealCustomerProfile}
        
        Generate professional, production-ready, authoritative content. Write directly without generic explanations or intro lines.
      `;
      const response = await client.models.generateContent({
        model: geminiModel,
        contents: prompt
      });

      const newAsset: ContentAsset = {
        id: 'content-' + Date.now(),
        title,
        channel,
        assetType,
        brief,
        content: response.text || "Draft generated, please inspect.",
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
      db.contentAssets.unshift(newAsset);
      await saveDB(res, db);
      res.json({ success: true, contentAsset: newAsset });
    } catch (err: any) {
      console.error("Gemini Content Generation failed:", err);
      res.status(500).json({ error: "Gemini Content Generation failed: " + err.message });
    }
  } else {
    // Mock Content response
    const mockContent: ContentAsset = {
      id: 'content-' + Date.now(),
      title,
      channel,
      assetType,
      brief,
      content: `[Generated Draft for: ${title}]\n\nWe operate in a global ecosystem of rapid technology, yet traditional enterprise acquisition remains tethered to slow human agency retainers. High-ticket consulting firms lose millions in pipeline velocity due to inefficient execution delays.\n\nSigma Tactix replaces manual overhead with secure automated Growth OS systems. Standard campaigns are formulated and dispatched in seconds, establishing direct trust without agency friction. Real-time execution isn't a future privilege; it's the premium standard.`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Draft'
    };
    db.contentAssets.unshift(mockContent);
    await saveDB(res, db);
    res.json({ success: true, contentAsset: mockContent });
  }
});

  return router;
}
