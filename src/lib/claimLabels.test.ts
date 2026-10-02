import { describe, it, expect } from "vitest";
import {
  claimLabel,
  claimToneBadge,
  formatAuditScoreLine,
  AI_DISCLOSURE_LINE,
} from "./claimLabels.js";

describe("Phase 2 claim presentation", () => {
  it("labels a model judgement as an estimate, not as evidence", () => {
    const label = claimLabel("estimate");
    expect(label.label).toBe("Model estimate");
    expect(label.label).not.toMatch(/measured/i);
    expect(label.tone).toBe("estimated");
  });

  it("explains that an unavailable claim is not a zero", () => {
    expect(claimLabel("unavailable").explanation).toMatch(/not a zero/i);
  });

  it("treats a claim with no classification as unclassified, never as measured", () => {
    expect(claimLabel(undefined).label).toBe("Unclassified");
    expect(claimLabel(undefined).tone).toBe("estimated");
  });

  it("never badges an estimate as success", () => {
    expect(claimToneBadge("estimated")).toBe("warning");
    expect(claimToneBadge("speculative")).toBe("warning");
    expect(claimToneBadge("unavailable")).toBe("neutral");
    // Only a genuinely measured fact gets the green treatment.
    expect(claimToneBadge("measured")).toBe("success");
  });

  it("refuses to print a bare number when no score exists", () => {
    const line = formatAuditScoreLine({ score: null, basis: "the page could not be fetched" });
    expect(line).toMatch(/not available/i);
    expect(line).not.toMatch(/0\/100/);
  });

  it("includes the basis when a score is shown", () => {
    const line = formatAuditScoreLine({ score: 72, basis: "11 published checks" });
    expect(line).toContain("72/100");
    expect(line).toContain("11 published checks");
  });

  it("ships a disclosure line for every exported artifact", () => {
    expect(AI_DISCLOSURE_LINE).toMatch(/AI/i);
    expect(AI_DISCLOSURE_LINE.length).toBeGreaterThan(20);
  });
});