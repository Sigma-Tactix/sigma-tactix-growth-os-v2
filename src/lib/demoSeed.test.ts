import { describe, it, expect } from "vitest";
import { isDemoSeedEnabled } from "./demoSeed.js";

describe("demo seed gate (Phase 0)", () => {
  it("defaults to no seeded fixtures when the flag is unset", () => {
    // The failure this guards: a fresh tenant opening Scheduler and seeing three
    // 'completed' deliveries it never had.
    expect(isDemoSeedEnabled()).toBe(false);
  });

  it("only ever returns true for the exact string 'true'", () => {
    for (const value of ['true', '1', 'yes', 'TRUE', 'false', '']) {
      expect(isDemoSeedEnabled(value)).toBe(value === 'true');
    }
    // Unset / undefined must stay off: no flag means no fabricated rows.
    expect(isDemoSeedEnabled(undefined)).toBe(false);
  });
});