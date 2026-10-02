import { describe, it, expect } from "vitest";
import { buildAuditClaimEvidence } from "./auditClaimEvidence.js";
import { verifyClaimEvidence } from "./evidenceContract.js";

const BASE = {
  claimId: "finding-performance",
  workspaceId: "ws-1",
  statement: "Paid social is under-invested relative to pipeline.",
  claimedPercentage: 40,
  snapshotUrl: "https://client.example/",
  hasLiveDataSource: true,
  observedAt: "2026-10-02T09:00:00Z",
};

describe("Phase 2 audit claim evidence", () => {
  it("labels a model impact percentage as an ESTIMATE, never a measurement", () => {
    // The whole point: a percentage on a client screen must not read as data.
    const claim = buildAuditClaimEvidence(BASE);
    expect(claim.classification).toBe("estimate");
    expect(claim.classification).not.toBe("measured_fact");
  });

  it("catches the plan's acceptance case — an unsupported percentage", () => {
    const claim = buildAuditClaimEvidence(BASE);
    expect(claim.evidence).toHaveLength(1);
    // The evidence records the OBSERVATION (the page), never the number itself
    // as if it were measured.
    expect(claim.evidence[0].sourceLocator).toBe("https://client.example/");
    expect(claim.evidence[0].scope).toBe("page_content_snapshot");
    expect(claim.evidence[0].dataSource).toBe("connector");
  });

  it("marks a synthetic snapshot as simulated retrieval, not success", () => {
    // A failed crawl must not silently become evidence.
    const claim = buildAuditClaimEvidence({ ...BASE, isSyntheticSnapshot: true });
    expect(claim.evidence[0].retrievalResult).toBe("simulated");
    expect(claim.classification).toBe("unavailable");
  });

  it("downgrades a placeholder-category finding to manual audit", () => {
    const claim = buildAuditClaimEvidence({ ...BASE, hasLiveDataSource: false });
    expect(claim.evidence[0].dataSource).toBe("manual_audit");
    expect(claim.classification).toBe("estimate");
  });

  it("stamps evidence with the requesting workspace, so it cannot be smuggled", () => {
    // The workspace comes from request context, not from caller-supplied
    // evidence, so there is no path for one tenant's evidence to be attached to
    // another tenant's claim.
    const a = buildAuditClaimEvidence(BASE);
    const b = buildAuditClaimEvidence({ ...BASE, workspaceId: "ws-2" });
    expect(a.evidence[0].workspaceId).toBe("ws-1");
    expect(b.evidence[0].workspaceId).toBe("ws-2");
    // And the contract still rejects a hand-built cross-workspace claim.
    const tampered = verifyClaimEvidence({
      claimId: BASE.claimId,
      workspaceId: "ws-1",
      statement: BASE.statement,
      evidence: [{ ...a.evidence[0], workspaceId: "ws-2" }],
    });
    expect(tampered.verified).toBe(false);
    expect(tampered.reasons.join(" ")).toMatch(/workspace/i);
  });

  it("carries the observation time so freshness is checkable later", () => {
    const claim = buildAuditClaimEvidence(BASE);
    expect(claim.evidence[0].observationTime).toBe("2026-10-02T09:00:00Z");
    expect(claim.evidence[0].coveredPeriod.start).toBe("2026-10-02T09:00:00Z");
  });
});